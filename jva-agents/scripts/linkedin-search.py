#!/usr/bin/env python3
"""
linkedin-search.py — LinkedIn API 経由でリード候補を検索する

Usage:
  python3 linkedin-search.py [--keywords "Tokyo startup HR"] [--limit 5]

出力: lead-search スキーマに準拠した JSON を stdout に出力
"""

import sys
import json
import argparse
import os
import re
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path
from datetime import date

TOKEN_FILE = Path.home() / ".config" / "linkedin-mcp" / "token.json"

DEFAULT_KEYWORDS = "Tokyo startup Series A hiring"
DEFAULT_LIMIT = 5


def load_token():
    if not TOKEN_FILE.exists():
        return None
    with open(TOKEN_FILE) as f:
        return json.load(f)


def linkedin_api_get(path, token, params=None):
    """LinkedIn API v2 に GET リクエストを送る"""
    url = f"https://api.linkedin.com/v2/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token['access_token']}")
    req.add_header("X-Restli-Protocol-Version", "2.0.0")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "status": e.code}


def get_my_profile(token):
    """自分のプロフィールを取得（接続確認用）"""
    return linkedin_api_get("userinfo", token)


def search_organizations_api(token, keywords, limit):
    """
    Organization Search API（Marketing Developer Platform が必要）
    承認済みの場合はこちらを使う
    """
    params = {
        "q": "search",
        "query.keywords": keywords,
        "query.facetGeoRegion": "urn:li:geo:104514075",  # Japan
        "count": limit,
    }
    result = linkedin_api_get("organizations", token, params)
    if "error" in result or result.get("status") == 403:
        return None  # 権限なし
    return result


def web_search_fallback(keywords, limit):
    """
    暫定: Web 検索（DuckDuckGo API）で LinkedIn 企業ページを検索
    Marketing Developer Platform 承認前の代替手段
    """
    query = f"site:linkedin.com/company {keywords}"
    url = "https://api.duckduckgo.com/?q=" + urllib.parse.quote(query) + "&format=json&no_redirect=1"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "JVA-LeadSearch/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        results = data.get("RelatedTopics", [])[:limit]
        companies = []
        for r in results:
            text = r.get("Text", "")
            href = r.get("FirstURL", "")
            if "linkedin.com/company" in href:
                name_match = re.search(r'linkedin\.com/company/([^/?]+)', href)
                company_slug = name_match.group(1) if name_match else ""
                companies.append({
                    "slug": company_slug,
                    "description": text,
                    "linkedin_url": href,
                })
        return companies
    except Exception as e:
        print(f"[linkedin-search] Web 検索フォールバック失敗: {e}", file=sys.stderr)
        return []


def build_lead_from_org(org_data, source="linkedin_api"):
    """API レスポンスを lead スキーマに変換"""
    name = org_data.get("localizedName", "") or org_data.get("name", {}).get("localized", {}).get("ja_JP", "")
    return {
        "company_name": name,
        "company_name_en": name,
        "url": f"https://www.linkedin.com/company/{org_data.get('vanityName', '')}",
        "industry": org_data.get("industries", [""])[0] if org_data.get("industries") else "",
        "stage": "",
        "location": "Tokyo",
        "why_target": "LinkedIn API検索結果。詳細確認が必要。",
        "contact": {"name": "", "title": "", "linkedin": "", "email": ""},
        "source": f"https://www.linkedin.com/company/{org_data.get('vanityName', '')}",
        "confidence": "low",
    }


def build_lead_from_web(company_data):
    """Web 検索結果を lead スキーマに変換"""
    slug = company_data.get("slug", "")
    return {
        "company_name": slug.replace("-", " ").title(),
        "company_name_en": slug.replace("-", " ").title(),
        "url": f"https://www.{slug}.com",
        "industry": "",
        "stage": "",
        "location": "Tokyo",
        "why_target": company_data.get("description", "LinkedIn企業ページ発見。詳細確認が必要。")[:200],
        "contact": {
            "name": "",
            "title": "",
            "linkedin": company_data.get("linkedin_url", ""),
            "email": "",
        },
        "source": company_data.get("linkedin_url", ""),
        "confidence": "low",
    }


def main():
    parser = argparse.ArgumentParser(description="LinkedIn API lead search")
    parser.add_argument("--keywords", default=DEFAULT_KEYWORDS, help="検索キーワード")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="最大取得件数")
    args = parser.parse_args()

    token = load_token()
    leads = []

    if token:
        # 接続確認
        profile = get_my_profile(token)
        if "error" in profile:
            print(f"[linkedin-search] 警告: APIトークンが無効です: {profile}", file=sys.stderr)
            token = None
        else:
            print(f"[linkedin-search] 認証OK: {profile.get('name', profile.get('sub', ''))}", file=sys.stderr)

            # Organization Search API を試みる
            orgs = search_organizations_api(token, args.keywords, args.limit)
            if orgs and "elements" in orgs:
                for org in orgs.get("elements", [])[:args.limit]:
                    leads.append(build_lead_from_org(org, source="linkedin_api"))
                print(f"[linkedin-search] API経由で {len(leads)} 件取得", file=sys.stderr)
            else:
                print("[linkedin-search] Organization Search API 未承認 → Web 検索にフォールバック", file=sys.stderr)

    if not leads:
        # Web 検索フォールバック
        companies = web_search_fallback(args.keywords, args.limit)
        for c in companies:
            leads.append(build_lead_from_web(c))
        print(f"[linkedin-search] Web検索フォールバックで {len(leads)} 件取得", file=sys.stderr)

    output = {
        "run_date": date.today().isoformat(),
        "leads_found": len(leads),
        "leads": leads,
        "source": "linkedin-search.py",
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
