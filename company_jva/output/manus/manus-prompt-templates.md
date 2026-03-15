# Manus スライド作成 — プロンプトテンプレート集

> このファイルのプロンプトをそのままManusにコピペして使用してください。
> `[  ]` で囲まれた部分のみ書き換えて使います。
> 最終更新: 2026-03-13

---

## STEP 0: 毎回必ず最初にManusへ渡すブランド指示（固定文）

> **このブロックをすべてのプロンプトの先頭にコピペする。**

```
=== JVA BRAND GUIDE ===

Organization: JVA (Japan's Venture Academy) — IB (Internship Board) team
Output format: .pptx (editable in Google Slides)
Slide size: 16:9 (widescreen)
Language: [English / Japanese]

COLORS (strictly follow — do not use other colors):
- Primary Red:     #BE1229  → header accent line, badges, highlights
- Dark Red:        #8C0D1E  → cover/section backgrounds
- Light Red:       #E84060  → secondary badges, card borders
- Purple Accent:   #6251D0  → second color in charts, sub-accents
- Header Dark:     #1A0508  → header bar background, cover background
- Off-White:       #FAF5F5  → content slide background
- Light Red BG:    #F9ECEC  → card backgrounds
- Text Dark:       #1A0508  → body text
- Text Muted:      #C4A0A0  → secondary text on dark backgrounds
- Green Accent:    #27AE60  → positive metrics
- Yellow Accent:   #F59E0B  → caution / neutral metrics

FONTS:
- Headings / KPI numbers: Montserrat (Bold)
- Body / captions: Lato (Regular)

SLIDE STRUCTURE (every slide):
1. Cover slides: dark background (#1A0508), white bold title (Montserrat 38px), red accent line at bottom
2. Section slides: red background (#BE1229), white centered title
3. Content slides: off-white background (#FAF5F5), dark header bar (#1A0508) with red line below, section name left / page number right
4. Ending slide: dark background, large white message

DESIGN PRINCIPLES:
- Minimal and clean. One message per slide.
- Lead with conclusion, then evidence, then action items.
- Use tables, bullet points, and large numbers — avoid long paragraphs.
- Max 5-6 bullet points per slide. Split if more.
- Speaker notes required on every slide (key talking points).
- No animations, no transitions, no gradients, no excessive decoration.

=== END OF BRAND GUIDE ===
```

---

## Template A: IB週次ミーティング（最もよく使う）

```
=== JVA BRAND GUIDE ===
[上のブランド指示をここに貼る]
=== END OF BRAND GUIDE ===

Create a 7-slide weekly IB team meeting presentation in English.

Meeting date: [March XX, 2026]
Theme / main question: [例: "Why Is Match Still 0? — Challenges & Next Actions"]

Slide structure:
1. Cover — Title: "IB Weekly Meeting", Subtitle: "[date]", Catchphrase: "[theme]"
2. KPI Dashboard (3 large numbers) — "Where Are We?"
   - LINE Registrations (cumulative): [数値] / this week: [+X]
   - Applications (cumulative): [数値] / this week: [+X]
   - Matches: [数値] ← highlight this as THE problem if 0
3. Problem Analysis (Before/After split) — "What's the Issue?"
   - Left: What We Expected
   - Right: What's Actually Happening
4. Root Cause (radial diagram or bullet list) — "Why?"
   - [原因1]
   - [原因2]
   - [原因3]
5. Options (comparison table or 2-column) — "What Do We Change?"
   - Option A vs Option B for each issue
6. Today's Goals (3-4 numbered cards) — "What We Need to Decide Today"
   - [決めること1]
   - [決めること2]
   - [決めること3]
7. Ending — "Let's Decide." / Footer: "IB Weekly — [date]"

Design: Follow JVA brand guide above. Keep slides concise and data-driven.
Include speaker notes on every slide.
Export as .pptx
```

---

## Template B: 事業紹介・外部向け提案（新規企業・パートナー向け）

```
=== JVA BRAND GUIDE ===
[上のブランド指示をここに貼る]
=== END OF BRAND GUIDE ===

Create a [10-12]-slide business introduction presentation in [English / Japanese].

Purpose: Pitch JVA's IB (Internship Board) platform to [target: startup companies / university partners / investors]
Goal: [例: Convince the company to list their internship position on IB]

Background context about JVA IB:
- JVA (Japan's Venture Academy) is a student-led startup support community backed by Shibuya Startup Support
- IB is a free internship matching platform connecting global students with early-stage Japanese startups
- Students: primarily international / bilingual students at top Japanese universities (UTokyo, Keio, Waseda, TiTech)
- 80%+ have business-level English; most have beginner-intermediate Japanese (N3-N5)
- Current stats: 59 LINE registrations, 23 applications, 16 active job postings, 7 companies

Slide structure:
1. Cover — title, subtitle, date
2. The Problem We Solve — why global talent meets startup needs
3. Who We Are — JVA overview (3 pillars: Bootcamp / Networking / IB)
4. Our Students — profile: English proficiency, university affiliations, majors
5. How IB Works (student side) — LINE → Apply → Interview → Match
6. How IB Works (company side) — list position → receive CVs → interview → hire
7. Current Traction — KPI numbers (LINE: 59, Applications: 23, Companies: 7+)
8. Why List With Us — benefits: free, curated global talent, managed process
9. Recommended Position Profile — ideal requirements for high match rate
10. Next Step — CTA: how to list a position
11. Ending — contact info

Design: Follow JVA brand guide. Make it persuasive and data-driven.
Include speaker notes (key talking points for each slide).
Export as .pptx
```

---

## Template C: KPIレポート・月次/週次振り返り（社内用）

```
=== JVA BRAND GUIDE ===
[上のブランド指示をここに貼る]
=== END OF BRAND GUIDE ===

Create a [8]-slide internal KPI report presentation in [English / Japanese].

Period: [Week XX / Month XX, 2026]

KPI data to include:
- LINE new registrations this week: [+X] / cumulative: [X]
- Applications this week: [+X] / cumulative: [X]
- Matches this week: [+X] / cumulative: [X]
- Active job postings: [X]
- New companies onboarded: [X]

Slide structure:
1. Cover — "IB KPI Report — [period]"
2. Summary Dashboard — 4-5 key numbers in large format (RAG status: green/yellow/red)
3. Trend Chart — LINE registrations over past 4 weeks (bar chart)
4. Funnel — LINE → Apply → Match conversion rates with current numbers
5. What Worked This Week — top 2-3 wins
6. What Didn't Work — top 1-2 blockers / root causes
7. Next Week's Priorities — 3 specific action items with owners and deadlines
8. Ending

Design: Data-driven. Use RAG (Red/Amber/Green) color coding for metrics.
Green = #27AE60 (on target), Yellow = #F59E0B (slightly off), Red = #BE1229 (problem).
Include speaker notes.
Export as .pptx
```

---

## Template D: 戦略・方針変更の提案スライド（意思決定用）

```
=== JVA BRAND GUIDE ===
[上のブランド指示をここに貼る]
=== END OF BRAND GUIDE ===

Create a [8-10]-slide strategy proposal presentation in [English / Japanese].

Topic: [例: "Improving Match Rate — Structural Changes to IB Operations"]
Audience: JVA leadership team
Goal: Get alignment on [具体的な意思決定]

Context:
[ここに背景情報・課題・データを貼る]

Slide structure:
1. Cover — topic title, date
2. Executive Summary — 3 bullets: Problem / Proposed Solution / Expected Impact
3. Current State — key metrics showing the problem (before)
4. Root Cause Analysis — why is this happening? (diagram or 3-column)
5. Proposed Solution — what we want to change (specific, actionable)
6. Option Comparison — Option A vs Option B (comparison table)
7. Implementation Plan — timeline and milestones (4-6 week view)
8. Expected Outcomes — target KPI changes
9. Risks & Mitigations — top 2-3 risks
10. Decision Needed — clear ask: "We need your decision on X by Y"
11. Ending

Design: Follow JVA brand guide. Lead with conclusion.
Make the decision ask explicit and easy to act on.
Include speaker notes.
Export as .pptx
```

---

## Template E: 短いアップデート（5枚以内・クイック共有用）

```
=== JVA BRAND GUIDE ===
[上のブランド指示をここに貼る]
=== END OF BRAND GUIDE ===

Create a 5-slide quick update deck in [English / Japanese].

Purpose: [例: Quick async update for IB team on this week's status]

Content:
1. Cover — "[Topic] Update — [date]"
2. This Week in 3 Numbers — [KPI1: value / KPI2: value / KPI3: value]
3. What Happened — [2-3 key events or actions taken this week]
4. What's Next — [2-3 priorities for next week]
5. Ending

Design: Follow JVA brand guide. Keep it ultra-concise — no more than 3 bullets per slide.
Export as .pptx
```

---

## よくあるManusへの追加指示（オプション）

必要に応じて上記プロンプトの末尾に追加してください：

```
# スライドを修正してほしい時:
Please revise slide [X] to [具体的な修正内容].
Keep all other slides unchanged.

# デザインのみ変更:
Keep the content exactly as is.
Only update the design to match the JVA brand guide above.

# 特定レイアウトを指定:
For slide [X], use a [two-column layout / large number KPI layout / before-after comparison / step-by-step flow diagram].

# 日本語にしたい時:
Please create this in Japanese. Use Noto Sans JP for Japanese text, Lato for English.

# スピーカーノートを詳しく:
Make speaker notes detailed — 3-5 sentences per slide with key talking points and transition cues.
```
