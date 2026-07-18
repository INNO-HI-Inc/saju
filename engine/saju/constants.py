# -*- coding: utf-8 -*-
"""사주 만세력 엔진 — 결정론적 상수/룩업 테이블.

이 파일에는 계산 로직이 없다. 오직 명리학의 고정표만 담는다.
(천간·지지·오행관계·지장간·십성·12운성·12신살)
LLM 해석 레이어와 완전히 분리된, 오차 0의 순수 데이터 계층.
"""

# ── 오행 ─────────────────────────────────────────────
WOOD, FIRE, EARTH, METAL, WATER = "목", "화", "토", "금", "수"
ELEMENTS = [WOOD, FIRE, EARTH, METAL, WATER]

# 상생: 목→화→토→금→수→목 (generates[X] = X가 생하는 오행)
GENERATES = {WOOD: FIRE, FIRE: EARTH, EARTH: METAL, METAL: WATER, WATER: WOOD}
# 상극: 목→토→수→화→금→목 (controls[X] = X가 극하는 오행)
CONTROLS = {WOOD: EARTH, EARTH: WATER, WATER: FIRE, FIRE: METAL, METAL: WOOD}

# ── 천간(天干) 10 ─────────────────────────────────────
#   idx, 한글, 한자, 오행, 음양(양=True)
STEMS = [
    (0, "갑", "甲", WOOD,  True),
    (1, "을", "乙", WOOD,  False),
    (2, "병", "丙", FIRE,  True),
    (3, "정", "丁", FIRE,  False),
    (4, "무", "戊", EARTH, True),
    (5, "기", "己", EARTH, False),
    (6, "경", "庚", METAL, True),
    (7, "신", "辛", METAL, False),
    (8, "임", "壬", WATER, True),
    (9, "계", "癸", WATER, False),
]
STEM_KO = [s[1] for s in STEMS]
STEM_HANJA = [s[2] for s in STEMS]
STEM_ELEM = [s[3] for s in STEMS]
STEM_YANG = [s[4] for s in STEMS]

# ── 지지(地支) 12 ─────────────────────────────────────
#   idx, 한글, 한자, 오행, 음양(양=True), 동물
BRANCHES = [
    (0,  "자", "子", WATER, True,  "쥐"),
    (1,  "축", "丑", EARTH, False, "소"),
    (2,  "인", "寅", WOOD,  True,  "호랑이"),
    (3,  "묘", "卯", WOOD,  False, "토끼"),
    (4,  "진", "辰", EARTH, True,  "용"),
    (5,  "사", "巳", FIRE,  False, "뱀"),      # 지지 음양: 사=음(체;용은 양) — 명리 관례상 巳는 陰
    (6,  "오", "午", FIRE,  True,  "말"),      # 午는 陽 (관례상 子午 정렬)
    (7,  "미", "未", EARTH, False, "양"),
    (8,  "신", "申", METAL, True,  "원숭이"),
    (9,  "유", "酉", METAL, False, "닭"),
    (10, "술", "戌", EARTH, True,  "개"),
    (11, "해", "亥", WATER, False, "돼지"),
]
BRANCH_KO = [b[1] for b in BRANCHES]
BRANCH_HANJA = [b[2] for b in BRANCHES]
BRANCH_ELEM = [b[3] for b in BRANCHES]
BRANCH_YANG = [b[4] for b in BRANCHES]
BRANCH_ANIMAL = [b[5] for b in BRANCHES]

# ── 지장간(支藏干) ────────────────────────────────────
# 각 지지에 숨은 천간. (여기[餘氣], 중기[中氣], 정기[正氣]) 순.
# 값은 천간 idx. 일수(비중)는 월률분야 표준(여기/중기/정기 = 대략 7/7/16, 왕지는 10/20 등).
#   화면 표기 순서와 동일: 사=무경병, 술=신정무, 오=병기정, 인=무병갑
HIDDEN_STEMS = {
    0:  [(9, 10), (8, 20)],              # 자: 임계  → (여 임10, 정 계20)  ※표기 임계
    1:  [(9, 9), (7, 3), (5, 18)],       # 축: 계신기
    2:  [(4, 7), (2, 7), (0, 16)],       # 인: 무병갑
    3:  [(0, 10), (1, 20)],              # 묘: 갑을
    4:  [(1, 9), (9, 3), (4, 18)],       # 진: 을계무
    5:  [(4, 7), (6, 7), (2, 16)],       # 사: 무경병
    6:  [(2, 10), (5, 9), (3, 11)],      # 오: 병기정
    7:  [(3, 9), (1, 3), (5, 18)],       # 미: 정을기
    8:  [(4, 7), (8, 7), (6, 16)],       # 신: 무임경
    9:  [(6, 10), (7, 20)],              # 유: 경신
    10: [(7, 9), (3, 3), (4, 18)],       # 술: 신정무
    11: [(4, 7), (0, 7), (8, 16)],       # 해: 무갑임
}
# 지지 본기(정기) = 지장간 마지막 원소의 천간. 십성 판정에 사용.
BRANCH_MAIN_STEM = {bi: hs[-1][0] for bi, hs in HIDDEN_STEMS.items()}

# ── 십성(十星) 판정표 ────────────────────────────────
# 일간 대비 대상(천간)의 (오행 관계 × 음양 동이) → 십성.
# 관계: same=비겁, iGen(내가生:식상), iCon(내가剋:재성), genMe(나를生:인성), conMe(나를剋:관성)
#   음양 같으면(동성) / 다르면(이성) 로 정/편 갈림.
#   same  동성=비견, 이성=겁재
#   iGen  동성=식신, 이성=상관
#   iCon  동성=편재, 이성=정재
#   conMe 동성=편관, 이성=정관
#   genMe 동성=편인, 이성=정인
TEN_STAR = {
    ("same",  "동"): "비견", ("same",  "이"): "겁재",
    ("iGen",  "동"): "식신", ("iGen",  "이"): "상관",
    ("iCon",  "동"): "편재", ("iCon",  "이"): "정재",
    ("conMe", "동"): "편관", ("conMe", "이"): "정관",
    ("genMe", "동"): "편인", ("genMe", "이"): "정인",
}

# ── 12운성(十二運星) ─────────────────────────────────
# 일간(천간)별, 각 지지에서의 포태(胞胎) 상태. 표는 [일간idx] → {지지idx: 운성}.
# 기준: 양간은 순행, 음간은 역행(전통 포태법). 장생 시작 지지만 주면 나머지 파생 가능하나,
# 명확성을 위해 12x12 완전표를 직접 담는다.
_TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"]
# 각 일간의 '장생' 지지 idx, 그리고 진행 방향(양간 +1, 음간 -1)
_JANGSAENG_BRANCH = {
    0: 11, 1: 6,   # 갑→해, 을→오
    2: 2,  3: 9,   # 병→인, 정→유
    4: 2,  5: 9,   # 무→인, 기→유 (화토동법: 토는 화를 따름)
    6: 5,  7: 0,   # 경→사, 신→자
    8: 8,  9: 3,   # 임→신, 계→묘
}
def _build_twelve_life():
    table = {}
    for si in range(10):
        start = _JANGSAENG_BRANCH[si]
        step = 1 if STEM_YANG[si] else -1
        d = {}
        for k, stage in enumerate(_TWELVE_STAGES):
            bi = (start + step * k) % 12
            d[bi] = stage
        table[si] = d
    return table
TWELVE_LIFE = _build_twelve_life()

# ── 12신살(十二神殺) ─────────────────────────────────
# 년지(또는 일지) 삼합 기준. 삼합 국(局)의 자오묘유 기준점에서 12신살이 배치된다.
# 삼합: 신자진(수국), 해묘미(목국), 인오술(화국), 사유축(금국).
# 각 국의 '지살(地殺)' 시작 지지에서 순서대로 12신살.
_TWELVE_SIN = ["지살", "년살", "월살", "망신살", "장성살", "반안살",
               "역마살", "육해살", "화개살", "겁살", "재살", "천살"]
# 국별 지살 지지(각 삼합의 첫 글자, 즉 생지): 신자진→신? 표준은 '역마=생지의 충'...
# 표준 배치: 삼합국의 '역마살'은 생지(인신사해)의 충. 여기서는 지살을 기준점으로 잡는다.
# 국의 왕지(자오묘유) 기준으로: 삼합 마지막(고지) 다음이 지살. 정석 대응표를 직접 명시한다.
#   인오술국(화): 지살=인, 이후 묘진사오미신유술해자축 순으로 12신살
#   신자진국(수): 지살=신
#   사유축국(금): 지살=사
#   해묘미국(목): 지살=해
_JISAL_START = {
    # key: 삼합 판별용 대표(년지가 속한 국) → 지살 지지 idx
    "화": 2,   # 인오술 → 지살 인(2)
    "수": 8,   # 신자진 → 지살 신(8)
    "금": 5,   # 사유축 → 지살 사(5)
    "목": 11,  # 해묘미 → 지살 해(11)
}
# 년지 idx → 소속 삼합국 오행
_BRANCH_TO_TRIAD = {
    8: "수", 0: "수", 4: "수",     # 신자진
    11: "목", 3: "목", 7: "목",    # 해묘미
    2: "화", 6: "화", 10: "화",    # 인오술
    5: "금", 9: "금", 1: "금",     # 사유축
}
def _build_twelve_sin():
    table = {}
    for base_bi in range(12):
        triad = _BRANCH_TO_TRIAD[base_bi]
        start = _JISAL_START[triad]
        d = {}
        for k, sin in enumerate(_TWELVE_SIN):
            bi = (start + k) % 12
            d[bi] = sin
        table[base_bi] = d
    return table
TWELVE_SIN = _build_twelve_sin()

# ── 60갑자 유틸용: 천간/지지 인덱스로 idx60 ──────────
def idx60(stem_i, branch_i):
    for i in range(60):
        if i % 10 == stem_i and i % 12 == branch_i:
            return i
    return -1
