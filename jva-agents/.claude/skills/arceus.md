# アルセウス スキル — システム監査・改善提案

## 目的

全ポケモンエージェントの直近14日間の実行データを分析し、パフォーマンスの問題点と改善提案をJSON形式で出力する。

---

## Step 0: 分析期間の設定

分析対象は**直近14日間**（今日から14日前まで）。

---

## Step 1: agent_runs の集計

以下のSQLiteクエリを実行する:

```sql
-- エージェント別の実行サマリー（直近14日）
SELECT
  agent_name,
  pokemon_name,
  COUNT(*) AS total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
  SUM(CASE WHEN status = 'hook_rejected' THEN 1 ELSE 0 END) AS hook_rejected_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
  MAX(started_at) AS last_run_at
FROM agent_runs
WHERE started_at >= datetime('now', '-14 days')
  AND status != 'running'
GROUP BY agent_name, pokemon_name;
```

成功率 = success_count / total_runs
hook_rejected率 = hook_rejected_count / total_runs

---

## Step 2: agent_costs の集計

```sql
-- エージェント別の平均コスト（直近14日）
SELECT
  r.agent_name,
  AVG(c.estimated_cost_usd) AS avg_cost_usd,
  SUM(c.estimated_cost_usd) AS total_cost_usd,
  AVG(c.input_tokens + c.output_tokens) AS avg_total_tokens
FROM agent_costs c
JOIN agent_runs r ON c.run_id = r.id
WHERE r.started_at >= datetime('now', '-14 days')
  AND r.status != 'running'
GROUP BY r.agent_name;
```

---

## Step 3: 未反映トレーナーFBの確認

```sql
-- 直近14日のトレーナーFB（古い順）
SELECT
  agent_name,
  content,
  datetime(created_at, 'localtime') AS feedback_at
FROM dialogue_logs
WHERE direction = 'trainer_to_agent'
  AND created_at >= datetime('now', '-14 days')
ORDER BY created_at ASC;
```

FBがある場合: 「このFBがエージェントの行動に反映されているか」を agent_runs のoutput_summaryから推測し、未反映と見られる場合は`pending_feedback`に含める。

---

## Step 4: 問題点の特定

各エージェントについて以下の基準で問題を判定する:

| 指標 | 警告 (yellow) | 問題 (red) |
|------|--------------|------------|
| 成功率 | 50%未満 | 20%未満 |
| hook_rejected率 | 40%超 | 70%超 |
| 平均コスト | $0.80超 | $1.50超 |

`overall_health` の判定:
- 全エージェントが green → `"green"`
- いずれかが yellow → `"yellow"`
- いずれかが red → `"red"`

---

## Step 5: 改善提案の生成

**提案は最大3点**。以下の優先順位で選ぶ:

1. **未反映トレーナーFB**がある場合は必ず最優先で含める
2. 成功率が最も低いエージェントへの対応
3. コストが最も高いエージェントへの対応

各提案は「何が問題で、何をどう変えるべきか」まで具体的に書く。

例:
- ✅ 「ヒコザルのhook_rejected率が80%。原因はmax-turns超過。run-agent.shのmax-turnsを30以上に増やすことを推奨」
- ❌ 「パフォーマンスが低下しています」（根拠なし・対策なし）

---

## Step 6: JSON出力

以下のスキーマで出力する。JSONのみ。前後に余分なテキストを出力しない。

```json
{
  "analysis_date": "YYYY-MM-DD",
  "period": "直近14日",
  "agents": [
    {
      "agent_name": "lead-search",
      "pokemon_name": "ヒコザル",
      "total_runs": 10,
      "success_count": 2,
      "hook_rejected_count": 7,
      "failed_count": 1,
      "success_rate": 0.20,
      "hook_rejected_rate": 0.70,
      "avg_cost_usd": 1.19,
      "total_cost_usd": 11.90,
      "last_run_at": "2026-04-16T00:04:00",
      "health": "red",
      "pending_feedback": [],
      "issues": [
        "hook_rejected率70%: 品質ゲート通過率が極めて低い",
        "平均コスト$1.19: 1実行あたりのコストが高い"
      ],
      "recommendations": [
        "run-agent.shのmax-turnsを20→30に増加（error_max_turnsが連続発生しているため）",
        "スキルの検索ステップを簡略化してターン数を削減する"
      ]
    }
  ],
  "overall_health": "red",
  "top_recommendations": [
    "ヒコザルのmax-turns超過問題を最優先で修正する"
  ]
}
```
