# -*- coding: utf-8 -*-
"""KASI 24절기 → 로컬 캐시(JSON) 빌드.

특일정보 서비스(get24DivisionsInfo)에서 연도별 24절기(절입 시각 kst 포함)를 받아
saju/data/solar_terms.json 으로 저장한다. 엔진은 런타임에 이 캐시를 읽는다(오프라인).

사용:
    SERVICE_KEY='특일정보_Decoding_인증키' python3 tools/fetch_kasi_solarterms.py 1900 2100
"""
import os, sys, json, ssl, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
BASE = "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo"
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE

KEY = os.environ.get("SERVICE_KEY", "").strip()
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "saju", "data", "solar_terms.json")


def fetch_year(year):
    qs = urllib.parse.urlencode({"solYear": f"{year:04d}", "numOfRows": "30",
                                 "serviceKey": KEY})
    with urllib.request.urlopen(f"{BASE}?{qs}", timeout=25, context=_CTX) as r:
        body = r.read().decode("utf-8", "replace")
    root = ET.fromstring(body)
    terms = {}
    for it in root.findall(".//item"):
        d = {c.tag: (c.text or "") for c in it}
        loc = d.get("locdate", "").strip()      # YYYYMMDD
        kst = d.get("kst", "").strip().zfill(4)  # HHMM
        lon = d.get("sunLongitude", "").strip()
        if not (loc and lon):
            continue
        dt = datetime(int(loc[:4]), int(loc[4:6]), int(loc[6:8]),
                      int(kst[:2]), int(kst[2:]), tzinfo=KST)
        terms[str(int(lon) % 360)] = dt.isoformat()
    return terms


def main():
    if not KEY:
        sys.exit("환경변수 SERVICE_KEY(특일정보 Decoding 키)가 비어있습니다.")
    y0 = int(sys.argv[1]) if len(sys.argv) > 1 else 1900
    y1 = int(sys.argv[2]) if len(sys.argv) > 2 else 2100
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    data, ok, bad = {}, 0, []
    for y in range(y0, y1 + 1):
        try:
            terms = fetch_year(y)
            if len(terms) >= 24:
                data[str(y)] = terms
                ok += 1
            else:
                bad.append((y, len(terms)))
        except Exception as e:
            bad.append((y, str(e)[:40]))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"저장: {OUT}")
    print(f"성공 연도: {ok}  ({y0}~{y1})")
    if bad:
        print(f"미수집/부족: {len(bad)}건 →", bad[:10], "..." if len(bad) > 10 else "")


if __name__ == "__main__":
    main()
