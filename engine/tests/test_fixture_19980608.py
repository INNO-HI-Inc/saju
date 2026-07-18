# -*- coding: utf-8 -*-
"""픽스처 검증: 1998-06-08 사시(09~11시) 여성.

정답 출처 = 사용자 제공 만세력 스크린샷 3장.
결정론적 항목(간지·십성·지장간·12운성·12신살·대운/세운 전개)은 완전 일치해야 한다.
강약 밴드/용신은 근사 항목이라 별도 표기.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from saju.chart import build_chart

# 사시 = 09~11시. 대운 역행 검증 위해 여성.
chart = build_chart(1998, 6, 8, 10, 0, gender="F")

EXPECT = {
    "pillars": {"년주": "무인", "월주": "무오", "일주": "병술", "시주": "계사"},
    "day_master": "병",
    # 천간 십성 (시/일/월/년)
    "stem_ten": {"hour": "정관", "day": "일간(나)", "month": "식신", "year": "식신"},
    # 지지 십성
    "branch_ten": {"hour": "비견", "day": "식신", "month": "겁재", "year": "편인"},
    # 지장간
    "hidden": {"hour": "무경병", "day": "신정무", "month": "병기정", "year": "무병갑"},
    # 12운성
    "life": {"hour": "건록", "day": "묘", "month": "제왕", "year": "장생"},
    # 12신살
    "sin": {"hour": "망신살", "day": "화개살", "month": "장성살", "year": "지살"},
    # 대운 (역행) 간지 전개
    "daeun_dir": "역행",
    "daeun_su": 1,
    "daeun_ganji": ["정사", "병진", "을묘", "갑인", "계축", "임자", "신해", "경술", "기유", "무신"],
    "daeun_stem_ten": ["겁재", "비견", "정인", "편인", "정관", "편관", "정재", "편재", "상관", "식신"],
    # 세운 1998~2007
    "seun_ganji": ["무인", "기묘", "경진", "신사", "임오", "계미", "갑신", "을유", "병술", "정해"],
    "seun_ten": ["식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인", "비견", "겁재"],
    # 근사 항목(참고): 신강약=중화신강, 용신 수/수, 득령○득지✗득시○득세✗
    "band_ref": "중화신강",
    "yongshin_ref": {"johu": "수", "eokbu": "수"},
    "deuk_ref": {"득령": True, "득지": False, "득시": True, "득세": False},
}

ok, fail = [], []
def check(name, got, exp):
    (ok if got == exp else fail).append((name, got, exp))

# 기둥
for k, v in EXPECT["pillars"].items():
    check(f"기둥 {k}", chart["pillars"][k], v)
check("일간", chart["day_master"]["ko"], EXPECT["day_master"])

# 십성/지장간/운성/신살
for k in ("hour", "day", "month", "year"):
    check(f"천간십성 {k}", chart["chart"][k]["stem"]["ten_star"], EXPECT["stem_ten"][k])
    check(f"지지십성 {k}", chart["chart"][k]["branch"]["ten_star"], EXPECT["branch_ten"][k])
    check(f"지장간 {k}", chart["chart"][k]["hidden_stems"]["str"], EXPECT["hidden"][k])
    check(f"12운성 {k}", chart["chart"][k]["twelve_life"], EXPECT["life"][k])
    check(f"12신살 {k}", chart["chart"][k]["twelve_sin"], EXPECT["sin"][k])

# 대운
check("대운 방향", chart["daeun"]["direction"], EXPECT["daeun_dir"])
check("대운수", chart["daeun"]["daeun_su"]["number"], EXPECT["daeun_su"])
check("대운 간지열", [d["ganji"] for d in chart["daeun"]["list"]], EXPECT["daeun_ganji"])
check("대운 천간십성", [d["stem_ten_star"] for d in chart["daeun"]["list"]], EXPECT["daeun_stem_ten"])

# 세운
check("세운 간지열", [s["ganji"] for s in chart["seun"]], EXPECT["seun_ganji"])
check("세운 십성", [s["stem_ten_star"] for s in chart["seun"]], EXPECT["seun_ten"])

# ── 출력 ──
print("=" * 60)
print("결정론 항목 검증 (스크린샷 정답과 완전 일치해야 함)")
print("=" * 60)
for name, got, exp in ok:
    print(f"  ✅ {name}: {got}")
if fail:
    print("\n  ❌ 불일치:")
    for name, got, exp in fail:
        print(f"     {name}\n        got={got}\n        exp={exp}")
print(f"\n결과: {len(ok)} 통과 / {len(fail)} 실패")

print("\n" + "=" * 60)
print("근사 항목 (레퍼런스 사이트 자체통계 → 보정 대상)")
print("=" * 60)
print(f"  신강약 밴드   : {chart['strength']['band']} (지수 {chart['strength']['index']})  [레퍼런스: {EXPECT['band_ref']}]")
print(f"  득령/지/시/세 : {chart['strength']['deuk']}  [레퍼런스: {EXPECT['deuk_ref']}]")
print(f"  용신 조후/억부: {chart['yongshin']['johu']}/{chart['yongshin']['eokbu']}  [레퍼런스: {EXPECT['yongshin_ref']}]")
