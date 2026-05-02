#!/usr/bin/env python3
"""
find-clinic-directors.py — クリニック院長名調査スクリプト

DuckDuckGo HTML検索 + 公式サイトスクレイピングで院長名を取得する。
取得できなかった場合は "未取得" として記録する。

使用方法:
    python3 find-clinic-directors.py

出力:
    clinic_directors_results.json
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import urllib.parse
from pathlib import Path

OUTPUT_FILE = Path(__file__).parent / "clinic_directors_results.json"

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# スキップすべきドメイン（医療ポータル・SNS等）
SKIP_DOMAINS = {
    "caloo.jp", "medley.life", "epark.jp", "qlife.jp", "doctorquality.jp",
    "facebook.com", "twitter.com", "instagram.com", "youtube.com",
    "wikipedia.org", "google.com", "bing.com",
    "mhlw.go.jp", "pref.kanagawa.jp", "city.yokohama.lg.jp",
    "jimin.jp", "recruit-doctorly.jp", "doda.jp", "indeed.com",
    "hotpepper.jp", "tabelog.com", "ekiten.jp", "itp.ne.jp",
}

# ノイズ語（院長名に含まれてはいけない語）
NOISE_PATTERN = re.compile(
    r"(クリニック|病院|医院|科目|診療|はじめ|ご挨拶|医療法人|社団|財団|一般|内科|外科|"
    r"皮膚|眼科|耳鼻|泌尿|整形|循環|呼吸|消化|精神|心療|産婦|小児|無床|有床|"
    r"横浜|神奈川|保土|金沢|港北|戸塚|港南|旭|緑|瀬谷|泉|青葉|磯子|"
    r"先生方|スタッフ|当院|通院|患者|診察|ご相談)"
)


def extract_director_from_text(text):
    """テキストから院長名を抽出（複数パターン試行）"""

    # パターン1: 「院長の○○と申します」「院長の○○です」
    m = re.search(r"院長(?:の|は)\s*(\S{2,6})\s*(?:と申します|です|先生|と[いい]|でご)", text)
    if m and not NOISE_PATTERN.search(m.group(1)):
        return m.group(1)

    # パターン2: 「院長名 姓 名」（スペース区切り）
    m = re.search(r"院長名\s+(\S{1,4})\s+(\S{1,4})", text)
    if m:
        name = f"{m.group(1)} {m.group(2)}"
        # ふりがなが続く場合は名前だけ
        return name

    # パターン3: 「院長名：○○」「院長名: ○○」
    m = re.search(r"院長名?\s*[：:]\s*(\S{2,8})", text)
    if m and not NOISE_PATTERN.search(m.group(1)):
        return m.group(1)

    # パターン4: 「院長 ○○（2〜6文字の名前）」
    m = re.search(r"院長\s+(\S{2,6})", text)
    if m and not NOISE_PATTERN.search(m.group(1)):
        cand = m.group(1)
        # 「院長 ご挨拶」「院長 よりご」のようなノイズ除外
        if not re.search(r"^[ぁ-ん]{2,}|より|ご|お[知知]", cand):
            return cand

    # パターン5: 「○○院長」
    m = re.search(r"(\S{2,6})院長", text)
    if m:
        cand = m.group(1)
        if not NOISE_PATTERN.search(cand) and not re.search(r"[、。・]", cand):
            # 「副院長」「前院長」等を除外
            if not re.search(r"(副|前|元|名誉|新|現|初代)", cand):
                return cand

    # パターン6: 「管理者：○○」
    m = re.search(r"管理者\s*[：: ]\s*(\S{2,8})", text)
    if m and not NOISE_PATTERN.search(m.group(1)):
        return m.group(1)

    return None


def ddg_search(query):
    """DuckDuckGo HTML検索でスニペットとURLを取得"""
    url = "https://html.duckduckgo.com/html/"
    try:
        resp = requests.post(url, data={"q": query}, headers=HTTP_HEADERS, timeout=15)
        if resp.status_code != 200:
            return [], []
        soup = BeautifulSoup(resp.text, "html.parser")

        snippets = [el.get_text() for el in soup.select(".result__snippet")]
        result_urls = []
        for el in soup.select("a.result__url"):
            href = el.get("href", "")
            if href.startswith("//duckduckgo.com/l/?uddg="):
                # DDGのリダイレクトURLをデコード
                m = re.search(r"uddg=([^&]+)", href)
                if m:
                    href = urllib.parse.unquote(m.group(1))
            elif href.startswith("/"):
                continue
            result_urls.append(href)

        return snippets, result_urls
    except Exception:
        return [], []


def is_skip_domain(url):
    """スキップすべきドメインかチェック"""
    try:
        domain = urllib.parse.urlparse(url).netloc.replace("www.", "")
        return any(skip in domain for skip in SKIP_DOMAINS)
    except Exception:
        return True


def fetch_official_site(url, clinic_name, city):
    """公式サイトから院長名を取得"""
    try:
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=15)
        if resp.status_code != 200:
            return None

        # 文字コード対応
        resp.encoding = resp.apparent_encoding or "utf-8"
        soup = BeautifulSoup(resp.text, "html.parser")

        # サイトがクリニックのものか確認（クリニック名または住所が含まれるか）
        page_text = soup.get_text(" ", strip=True)
        city_short = city.replace("横浜市", "").replace("区", "")

        # クリニック名の主要部分（法人名を除いた部分）
        name_key = re.sub(r"(医療法人|社団|財団|一般)", "", clinic_name).strip()[:6]

        if name_key not in page_text and city_short not in page_text:
            return None

        director = extract_director_from_text(page_text)
        if director:
            return director

        # 「院長紹介」「医師紹介」ページのリンクを探す
        for link in soup.select("a[href]"):
            link_text = link.get_text()
            if re.search(r"院長(紹介|プロフィール|ご挨拶)|医師紹介", link_text):
                href = link.get("href", "")
                if href.startswith("/"):
                    intro_url = urllib.parse.urljoin(url, href)
                elif href.startswith("http"):
                    intro_url = href
                else:
                    intro_url = urllib.parse.urljoin(url, href)

                try:
                    intro_resp = requests.get(intro_url, headers=HTTP_HEADERS, timeout=15)
                    intro_resp.encoding = intro_resp.apparent_encoding or "utf-8"
                    intro_text = BeautifulSoup(intro_resp.text, "html.parser").get_text(" ", strip=True)
                    director = extract_director_from_text(intro_text)
                    if director:
                        return director
                except Exception:
                    pass
                break

        return None
    except Exception:
        return None


def find_director(clinic):
    """DDG検索 → スニペット抽出 → 公式サイト取得 の順で院長名を探す"""
    name = clinic["name"]
    city = clinic["city"]
    name_key = re.sub(r"(医療法人|社団|財団|一般)", "", name).strip()

    # クエリ1: クリニック名 + 市区町村 + 院長
    query = f"{name_key} {city} 院長"
    snippets, urls = ddg_search(query)

    # スニペットから院長名を試行
    for snippet in snippets:
        director = extract_director_from_text(snippet)
        if director:
            return {"director": director, "source": "ddg_snippet", "confidence": "medium"}

    # 公式サイトを探して取得
    for url in urls[:4]:
        if is_skip_domain(url):
            continue
        director = fetch_official_site(url, name, city)
        if director:
            return {"director": director, "source": url, "confidence": "high"}
        time.sleep(0.3)

    # クエリ2: クリニック名のみ + 院長名
    query2 = f'"{name_key}" 院長名'
    snippets2, urls2 = ddg_search(query2)

    for snippet in snippets2:
        director = extract_director_from_text(snippet)
        if director:
            return {"director": director, "source": "ddg_snippet2", "confidence": "medium"}

    for url in urls2[:3]:
        if is_skip_domain(url):
            continue
        director = fetch_official_site(url, name, city)
        if director:
            return {"director": director, "source": url, "confidence": "high"}
        time.sleep(0.3)

    return {"director": "未取得", "source": "", "confidence": "none"}


# 91クリニックデータ
CLINICS = [
    {"id": "mhwpznuav", "name": "吉田クリニック", "city": "横浜市保土ケ谷区", "address": "神奈川県横浜市保土ケ谷区星川１－１５－２０"},
    {"id": "mbmatfksj", "name": "天王町レディースクリニック", "city": "横浜市保土ケ谷区", "address": "神奈川県横浜市保土ケ谷区天王町２－３６－８"},
    {"id": "mj7dl8ost", "name": "磯レディースクリニック", "city": "横浜市保土ケ谷区", "address": "神奈川県横浜市保土ケ谷区和田１－１９－３"},
    {"id": "mdx3czi0o", "name": "Ａｙａ女性のためのクリニック", "city": "横浜市保土ケ谷区", "address": "神奈川県横浜市保土ケ谷区川辺町３－５"},
    {"id": "mpojmky4q", "name": "みつばちこども漢方クリニック", "city": "横浜市磯子区", "address": "神奈川県横浜市磯子区洋光台３－１３－４－１１０"},
    {"id": "mk2rup5do", "name": "あい皮ふ科アレルギー科", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区瀬戸１７－６"},
    {"id": "mmx1n9grp", "name": "いとうファミリークリニック", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区谷津町３７８"},
    {"id": "mkrlqn3ep", "name": "吉村内科医院", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区釜利谷東２－１７－８"},
    {"id": "m8r0x9lvs", "name": "和田耳鼻咽喉科", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区釜利谷東２－２１－２２"},
    {"id": "mp6ufk5n2", "name": "松瀬医院", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区富岡西５－５－１４"},
    {"id": "mx5u8nwmy", "name": "森クリニック", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区泥亀１－８－２７"},
    {"id": "mi6bfxmpq", "name": "草川クリニック内科・循環器内科", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区能見台通４番１号"},
    {"id": "mg3bx8liu", "name": "金沢さくら医院", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区谷津町３５"},
    {"id": "mhqjdol6s", "name": "鳥居泌尿器科・内科", "city": "横浜市金沢区", "address": "神奈川県横浜市金沢区釜利谷東２－２１－２２"},
    {"id": "mpcx2rvbo", "name": "きくな湯田眼科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区菊名４－３－１１"},
    {"id": "mp3jezc1a", "name": "ここクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区箕輪町２－７－４２"},
    {"id": "mwcdg75yk", "name": "たかみざわ医院", "city": "横浜市港北区", "address": "神奈川県横浜市港北区日吉本町１－２３－５"},
    {"id": "m9sdlpfzo", "name": "ながしまメンタルクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区大倉山１－１２－１８"},
    {"id": "mpcwlgs5e", "name": "アイレディースクリニック新横浜", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜３－６－１"},
    {"id": "m0oemb95a", "name": "リンクス大倉山クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区大豆戸町８９番地１"},
    {"id": "mjucz734m", "name": "一般社団法人再健会シン・整形外科綱島", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島東１丁目７－１０"},
    {"id": "musnkqtgw", "name": "中野こどもクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区富士塚１－１－１"},
    {"id": "m0khc7fov", "name": "医療法人社団なかよし会日吉メディカルクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区日吉４－１－１"},
    {"id": "mkomzx47v", "name": "医療法人社団やまびこ新横浜整形外科リウマチ科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜３－６－４"},
    {"id": "mjkg3b8mr", "name": "医療法人社団善方会よしかた産婦人科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区小机町２４３０"},
    {"id": "mcr0yj7qt", "name": "医療法人財団新羽駅前耳鼻咽喉科クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新羽町１６７１"},
    {"id": "m3lheq5s9", "name": "大倉山はるかぜクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区大倉山３－８－２８"},
    {"id": "mx54ylptq", "name": "大倉山耳鼻咽喉科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区大倉山３－２６－６"},
    {"id": "m8jloi1n9", "name": "新横浜国際クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜２－３－１２"},
    {"id": "mgdi9hec4", "name": "新横浜形成クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜２－１７－１１"},
    {"id": "m5ml74bqd", "name": "新羽駅前松野医院内視鏡・内科・皮膚科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新羽町１６２５－１"},
    {"id": "mypq5r6ud", "name": "日吉の森内科クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区箕輪町一丁目２４番９号"},
    {"id": "m6xtvuz80", "name": "日吉本町えがわ耳鼻咽喉科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区日吉本町４丁目１５番１１号"},
    {"id": "mz8hb5y72", "name": "横浜綱島フォレスト内科・呼吸器クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島西二丁目１２番１０号"},
    {"id": "my7ao9gnr", "name": "横浜綱島フォレスト内科・循環器クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島西二丁目１２番５号"},
    {"id": "ma05emxlc", "name": "横浜綱島フォレスト消化器内科・内視鏡クリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島東一丁目９番１０号"},
    {"id": "mkdczmle6", "name": "洋和メンタルクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区日吉本町１－２－７"},
    {"id": "mc0dufko8", "name": "港北高田駅前すみれ皮膚科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区高田東４丁目２３番４号"},
    {"id": "mrzx0gqy9", "name": "石井内科医院", "city": "横浜市港北区", "address": "神奈川県横浜市港北区日吉本町６－２６－５"},
    {"id": "mejdz69c4", "name": "神奈川リウマチクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜二丁目４番地１７"},
    {"id": "mmoda9x5p", "name": "綱島あお整形外科・皮膚科", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島西２－１２－５"},
    {"id": "meuin4rpf", "name": "綱島こころクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区綱島西１－６－１９"},
    {"id": "m3lqxifar", "name": "ＲＥＳＭ新横浜睡眠・呼吸メディカルケアクリニック", "city": "横浜市港北区", "address": "神奈川県横浜市港北区新横浜３－８－１２"},
    {"id": "mt4c3lazs", "name": "ながのクリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区上倉田町４８１－１"},
    {"id": "m2bguahr6", "name": "アリスクリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区品濃町５３８－１"},
    {"id": "m2u7m5ev0", "name": "メディカルパーク戸塚", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区戸塚町１６番地１"},
    {"id": "m7s4rblkt", "name": "医療法人はまゆう会浜之上クリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区上倉田町８８４番地６"},
    {"id": "meki4wzno", "name": "医療法人東戸塚駅前なかやまクリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区品濃町５１６番地５"},
    {"id": "mq5ivwf6z", "name": "戸塚ファミリークリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区戸塚町９９"},
    {"id": "m02qbmg3y", "name": "東戸塚わたなべクリニック内科・消化器", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区品濃町５３８－８"},
    {"id": "m2r6w0duf", "name": "横浜きくち内科・糖尿病クリニック東戸塚院", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区品濃町５１６－１１"},
    {"id": "micdwzfq4", "name": "秋葉町ゆいクリニック", "city": "横浜市戸塚区", "address": "神奈川県横浜市戸塚区秋葉町４４４－２"},
    {"id": "mb1uzyjax", "name": "うるうクリニック港南台", "city": "横浜市港南区", "address": "神奈川県横浜市港南区港南台三丁目３番１号"},
    {"id": "mv24kojni", "name": "かわぐち消化器内科", "city": "横浜市港南区", "address": "神奈川県横浜市港南区港南台５－２３－３０"},
    {"id": "m1fcndrj3", "name": "上大岡糖尿病・代謝内科クリニック", "city": "横浜市港南区", "address": "神奈川県横浜市港南区上大岡西１－５－１"},
    {"id": "m10jiotfw", "name": "上永谷ほほえみクリニック", "city": "横浜市港南区", "address": "神奈川県横浜市港南区丸山台１－１１－１７"},
    {"id": "m786s9kd4", "name": "医療法人社団健徳会吉田医院", "city": "横浜市港南区", "address": "神奈川県横浜市港南区港南台７－８－４６"},
    {"id": "mgox8tmvh", "name": "苅部医院", "city": "横浜市港南区", "address": "神奈川県横浜市港南区笹下２－７－１２"},
    {"id": "mdgf57x3q", "name": "つばきメンタルクリニック", "city": "横浜市旭区", "address": "神奈川県横浜市旭区東希望が丘１００－１９－４０２"},
    {"id": "mu75ijqdz", "name": "医療法人社団邦生会簡野クリニック", "city": "横浜市旭区", "address": "神奈川県横浜市旭区柏町５３－８"},
    {"id": "mm906h5i1", "name": "希望ヶ丘しまや内科", "city": "横浜市旭区", "address": "神奈川県横浜市旭区中希望が丘１９８－２１"},
    {"id": "mc74xjt2i", "name": "あいこ内科クリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区台村町３２９－３"},
    {"id": "m546o2sm7", "name": "かもい脳神経クリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区鴨居３－１－３"},
    {"id": "m5vezoul8", "name": "しらはた胃腸肛門クリニック横浜", "city": "横浜市緑区", "address": "神奈川県横浜市緑区長津田５－６－３２"},
    {"id": "m42lqzum6", "name": "みなみレディースクリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区長津田みなみ台１－１－５"},
    {"id": "mra8g124e", "name": "長津田ファミリークリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区長津田５－４－１"},
    {"id": "m9wizajdv", "name": "長津田レディースクリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区長津田５－３－７"},
    {"id": "mx1msz78d", "name": "鴨居メンタルクリニック", "city": "横浜市緑区", "address": "神奈川県横浜市緑区鴨居１丁目７－４"},
    {"id": "m4qcrgynw", "name": "えはらクリニック", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区相沢７－５９－１"},
    {"id": "mhqyzd02p", "name": "さくらレディースクリニック", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区下瀬谷２－５２－７"},
    {"id": "mpoen7a9g", "name": "瀬谷いろどりハート内科クリニック", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区下瀬谷２丁目９－３"},
    {"id": "mlzy3esr0", "name": "瀬谷メンタルクリニック", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区瀬谷３－１－３０"},
    {"id": "mumgesi6t", "name": "田川クリニック", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区瀬谷４－４３－１"},
    {"id": "mi94sgm7p", "name": "高畑耳鼻咽喉科医院", "city": "横浜市瀬谷区", "address": "神奈川県横浜市瀬谷区三ツ境１"},
    {"id": "mpy124cgq", "name": "こじま眼科", "city": "横浜市泉区", "address": "神奈川県横浜市泉区領家３－２－４"},
    {"id": "m9l4gope2", "name": "こまくさ女性クリニック", "city": "横浜市泉区", "address": "神奈川県横浜市泉区緑園２－１－６"},
    {"id": "mhbw0ne85", "name": "ゆめが丘みかみ耳鼻咽喉科", "city": "横浜市泉区", "address": "神奈川県横浜市泉区ゆめが丘３０番地２"},
    {"id": "m8svzu1rq", "name": "ゆめが丘内科・糖尿病甲状腺クリニック", "city": "横浜市泉区", "address": "神奈川県横浜市泉区ゆめが丘４１－６"},
    {"id": "mepszyhnj", "name": "丸本眼科", "city": "横浜市泉区", "address": "神奈川県横浜市泉区和泉町５７３５－１"},
    {"id": "m92zigjh6", "name": "湘南ゆめが丘めのうクリニック眼科・脳神経外科", "city": "横浜市泉区", "address": "神奈川県横浜市泉区ゆめが丘４１－６"},
    {"id": "mfg6ezcjl", "name": "あおばの森内科クリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区若草台１７番地１"},
    {"id": "m7pkqvr39", "name": "いわい整形外科・ペインクリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区上谷本町７２３－１"},
    {"id": "mav9jq6yx", "name": "こうクリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区藤が丘１－２８－１７"},
    {"id": "mcgy0o6ja", "name": "たまプラーザあかりクリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区新石川２－４－１６"},
    {"id": "mf5z31tr4", "name": "たまプラーザ駅前皮ふ科", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区美しが丘二丁目１５－７"},
    {"id": "mmqijtu4l", "name": "ひらやま内科・内視鏡クリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区藤が丘２－４－７"},
    {"id": "my9zn1ae8", "name": "スマイル眼科クリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区青葉台１－６－１２"},
    {"id": "mcuywtsmj", "name": "ファミリークリニックあざみ野", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区すすき野３－２－１３"},
    {"id": "m8xw9yfc7", "name": "フジ皮フ科クリニック", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区藤が丘一丁目１４番地４９"},
    {"id": "mcau49p6w", "name": "メディカルクリニックあざみ野", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区黒須田３３－５"},
    {"id": "mqesvl5kf", "name": "レディースクリニック市ヶ尾", "city": "横浜市青葉区", "address": "神奈川県横浜市青葉区市ケ尾１１５４"},
]


def main():
    print(f"=== クリニック院長名調査 ({len(CLINICS)}件) ===\n")

    # 既存の結果があれば読み込んでスキップ
    results = {}
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            results = json.load(f)
        already_done = sum(1 for v in results.values() if v.get("director") != "未取得")
        print(f"既存結果: {len(results)}件（取得済み{already_done}件）→ 残りを処理\n")

    for i, clinic in enumerate(CLINICS):
        if clinic["id"] in results:
            continue

        print(f"[{i+1:02d}/{len(CLINICS)}] {clinic['name'][:30]}", end=" ... ", flush=True)
        result = find_director(clinic)
        results[clinic["id"]] = {
            "name": clinic["name"],
            "city": clinic["city"],
            **result
        }

        status = result["director"] if result["director"] != "未取得" else "❌未取得"
        print(f"{status} [{result['confidence']}]")

        # 途中経過を保存（中断しても再開可能）
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        time.sleep(1.2)  # レート制限

    # 集計
    found = sum(1 for v in results.values() if v.get("director") != "未取得")
    high = sum(1 for v in results.values() if v.get("confidence") == "high")
    medium = sum(1 for v in results.values() if v.get("confidence") == "medium")
    not_found = len(CLINICS) - found

    print(f"\n=== 完了 ===")
    print(f"取得成功: {found}/{len(CLINICS)} 件")
    print(f"  確度高（公式サイト）: {high}件")
    print(f"  確度中（検索スニペット）: {medium}件")
    print(f"未取得: {not_found}件")
    print(f"\n結果ファイル: {OUTPUT_FILE}")

    if not_found > 0:
        print("\n--- 未取得リスト ---")
        for v in results.values():
            if v.get("director") == "未取得":
                print(f"  {v['name']} ({v.get('city', '')})")


if __name__ == "__main__":
    main()
