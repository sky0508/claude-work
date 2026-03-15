"use strict";

/**
 * スコアリングエンジン
 * config の scoring_axes を読み、候補者 × 機会のスコアを計算する。
 * ドメイン非依存 — config を差し替えるだけで任意のマッチングに対応。
 */

/**
 * @param {object} candidate - 候補者データ
 * @param {object} opportunity - 機会データ
 * @param {object} config - match.config.json の内容
 * @returns {{ total: number, axes: object[], flags: object[] }}
 */
function score(candidate, opportunity, config) {
  const axisResults = config.scoring_axes.map((axis) =>
    scoreAxis(candidate, opportunity, axis)
  );

  const total = axisResults.reduce((sum, r) => sum + r.earned, 0);
  const flags = evaluateFlags(candidate, opportunity, config, axisResults);

  return { total: Math.round(total), axes: axisResults, flags };
}

function scoreAxis(candidate, opportunity, axis) {
  const base = { id: axis.id, label: axis.label, weight: axis.weight, earned: 0, note: "" };

  switch (axis.type) {
    case "level_match":
      return scoreLevelMatch(candidate, opportunity, axis, base);
    case "skill_overlap":
      return scoreSkillOverlap(candidate, opportunity, axis, base);
    case "range_fit":
      return scoreRangeFit(candidate, opportunity, axis, base);
    case "enum_match":
      return scoreEnumMatch(candidate, opportunity, axis, base);
    case "tag_overlap":
      return scoreTagOverlap(candidate, opportunity, axis, base);
    default:
      return { ...base, note: `unknown type: ${axis.type}` };
  }
}

/**
 * level_match: 候補者レベル >= 要求レベル なら満点
 * partial_credit が true なら 1段階下で半点
 */
function scoreLevelMatch(candidate, opportunity, axis, base) {
  const levels = axis.levels;
  const required = opportunity[axis.opportunity_field] || "none";
  const actual   = candidate[axis.candidate_field] || "none";

  const reqIdx = levels.indexOf(required);
  const actIdx = levels.indexOf(actual);

  if (reqIdx === -1 || reqIdx === 0) {
    // 要件なし → 満点
    return { ...base, earned: axis.weight, note: "要件なし → 満点" };
  }
  if (actIdx >= reqIdx) {
    return { ...base, earned: axis.weight, note: `${actual} ≥ ${required} ✅` };
  }
  if (axis.partial_credit && actIdx === reqIdx - 1) {
    const earned = axis.weight * 0.5;
    return { ...base, earned, note: `${actual} (1段階不足) → 半点` };
  }
  return { ...base, earned: 0, note: `${actual} < ${required} ❌` };
}

/**
 * skill_overlap: 必須スキルの一致率でスコア。ボーナススキルで加点。
 */
function scoreSkillOverlap(candidate, opportunity, axis, base) {
  const candidateSkills = (candidate[axis.candidate_field] || []).map(normalizeSkill);
  const required = (opportunity[axis.opportunity_field] || []).map(normalizeSkill);
  const bonus    = (opportunity[axis.bonus_field] || []).map(normalizeSkill);

  if (required.length === 0) {
    // 必須スキルなし → ボーナススキルだけで判定（最大満点）
    const bonusMatches = bonus.filter((s) => candidateSkills.includes(s)).length;
    const bonusScore   = bonus.length > 0 ? (bonusMatches / bonus.length) * axis.weight : axis.weight;
    return { ...base, earned: Math.round(bonusScore), note: `必須スキルなし。ボーナス ${bonusMatches}/${bonus.length}` };
  }

  const requiredMatches = required.filter((s) => candidateSkills.includes(s)).length;
  const baseScore       = (requiredMatches / required.length) * axis.weight;

  const bonusMatches = bonus.filter((s) => candidateSkills.includes(s)).length;
  const bonusScore   = bonus.length > 0 ? (bonusMatches / bonus.length) * axis.weight * (axis.bonus_weight || 0.3) : 0;

  const earned = Math.min(axis.weight, baseScore + bonusScore);
  const note   = `必須 ${requiredMatches}/${required.length}  ボーナス ${bonusMatches}/${bonus.length}`;
  return { ...base, earned: Math.round(earned), note };
}

/**
 * range_fit: 候補者の数値 >= 要求値 なら満点
 */
function scoreRangeFit(candidate, opportunity, axis, base) {
  const candidateVal  = candidate[axis.candidate_field] ?? 0;
  const requiredVal   = opportunity[axis.opportunity_field] ?? 0;

  if (axis.direction === "gte") {
    if (candidateVal >= requiredVal) {
      return { ...base, earned: axis.weight, note: `${candidateVal} ≥ ${requiredVal} ✅` };
    }
    // 不足分に応じて減点（最大50%まで）
    const ratio  = candidateVal / requiredVal;
    const earned = ratio >= 0.8 ? axis.weight * 0.5 : 0;
    return { ...base, earned, note: `${candidateVal} < ${requiredVal} (${Math.round(ratio * 100)}%)` };
  }

  return { ...base, earned: axis.weight, note: "方向性なし → 満点" };
}

/**
 * enum_match: 順序付き列挙型で候補者 >= 要求 なら満点
 */
function scoreEnumMatch(candidate, opportunity, axis, base) {
  if (axis.direction === "any") {
    const candidateVal   = candidate[axis.candidate_field];
    const opportunityVal = opportunity[axis.opportunity_field];
    const match = !opportunityVal || candidateVal === opportunityVal;
    return { ...base, earned: match ? axis.weight : 0, note: match ? "一致 ✅" : `${candidateVal} ≠ ${opportunityVal}` };
  }

  const order        = axis.order || [];
  const required     = opportunity[axis.opportunity_field] || order[0];
  const actual       = candidate[axis.candidate_field] || order[0];
  const reqIdx       = order.indexOf(required);
  const actIdx       = order.indexOf(actual);

  if (reqIdx === -1 || actIdx >= reqIdx) {
    return { ...base, earned: axis.weight, note: `${actual} ≥ ${required} ✅` };
  }
  return { ...base, earned: 0, note: `${actual} < ${required} ❌` };
}

/**
 * tag_overlap: タグ配列の一致率でスコア
 */
function scoreTagOverlap(candidate, opportunity, axis, base) {
  const candidateTags   = (candidate[axis.candidate_field] || []).map(normalizeSkill);
  const opportunityTags = (opportunity[axis.opportunity_field] || []).map(normalizeSkill);

  if (opportunityTags.length === 0) {
    return { ...base, earned: axis.weight, note: "要件タグなし → 満点" };
  }

  const matches = opportunityTags.filter((t) => candidateTags.includes(t)).length;
  const earned  = (matches / opportunityTags.length) * axis.weight;
  return { ...base, earned: Math.round(earned), note: `${matches}/${opportunityTags.length} タグ一致` };
}

/**
 * フラグ評価（簡易ルールエンジン）
 * config の flag_rules を評価してフラグリストを返す
 */
function evaluateFlags(candidate, opportunity, config, axisResults) {
  if (!config.flag_rules) return [];

  const axisMap = Object.fromEntries(axisResults.map((r) => [r.id, r.earned]));

  return (config.flag_rules || []).filter((rule) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "axis_score", "candidate_field", "opportunity_field",
        `return (${rule.condition});`
      );
      return fn(
        (id) => axisMap[id] ?? 0,
        (f)  => candidate[f],
        (f)  => opportunity[f]
      );
    } catch {
      return false;
    }
  });
}

function normalizeSkill(s) {
  return String(s).toLowerCase().trim();
}

module.exports = { score };
