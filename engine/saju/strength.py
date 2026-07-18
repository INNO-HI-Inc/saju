# -*- coding: utf-8 -*-
"""신강/신약 판정 + 용신(조후·억부).

주의(상용화 필수 인지):
  · 득령/득지/득시/득세 = 결정론 → 정확 재현.
  · 8단계 밴드 경계와 인구분포%(예: 26.31%)는 각 만세력 사이트의 자체 통계/가중치 →
    본 엔진은 투명한 억부+통근 지수를 산출하고, BAND_THRESHOLDS로 보정 가능하게 둔다.
  · 용신(조후/억부)은 유파 의존. 아래는 표준적·방어가능한 규칙이며 교체 가능.
"""
from . import constants as C
from . import derive

# 8단계 (약 → 강)
BANDS = ["극약", "태약", "신약", "중화신약", "중화신강", "신강", "태강", "극왕"]
# 강약지수(0~100) → 밴드 경계. 레퍼런스 사이트에 맞춰 보정 가능.
BAND_THRESHOLDS = [18, 30, 41, 48, 57, 68, 80]  # 7개 컷 → 8밴드

# 위치 가중(월령 최중요). ※ web/js/saju-engine.js 의 POSW 와 반드시 동일하게 유지.
POS_WEIGHT = {"year": 1.0, "month": 2.0, "day": 1.5, "hour": 1.0}
# 통근(12운성) 강도
ROOT_STRENGTH = {"장생": 1.0, "관대": 1.0, "건록": 1.0, "제왕": 1.0,
                 "목욕": 0.5, "양": 0.5, "쇠": 0.5,
                 "묘": 0.1, "병": 0.2, "사": 0.0, "절": 0.0, "태": 0.3}


def _supports(day_elem, elem):
    """elem이 일간(day_elem)을 부조하는가 = 비겁(동일) 또는 인성(생아)."""
    return elem == day_elem or C.GENERATES[elem] == day_elem


def deuk_flags(pillars):
    """득령/득지/득시/득세 (bool)."""
    dm = C.STEM_ELEM[pillars["day_master_idx"]]
    def branch_supports(key):
        bi = pillars[key]["branch_idx"]
        return _supports(dm, C.BRANCH_ELEM[bi])
    deukryeong = branch_supports("month")   # 월지
    deukji = branch_supports("day")         # 일지
    deuksi = branch_supports("hour")        # 시지
    # 득세: 전체 세력에서 일간 부조 오행이 과반
    cnt = derive.element_count(pillars, weighted=True)
    support = sum(v for e, v in cnt.items() if _supports(dm, e))
    deukse = support > (sum(cnt.values()) / 2)
    return {"득령": deukryeong, "득지": deukji, "득시": deuksi, "득세": deukse}


def strength(pillars):
    """신강/신약 지수(0~100) + 밴드 + 득 플래그."""
    dm_idx = pillars["day_master_idx"]
    dm = C.STEM_ELEM[dm_idx]

    # ① 오행 세력비(월령 가중, 일간 self 포함 비겁)
    support = 1.0   # 일간 자신 = 비겁
    oppose = 0.0
    keys = ["year", "month", "day", "hour"]
    # 천간 누적(일간 제외)
    for k in keys:
        if k == "day":
            continue
        e = pillars[k]["stem_elem"]
        if _supports(dm, e):
            support += 1.0
        else:
            oppose += 1.0
    # 지지 지장간(위치 가중)
    for k in keys:
        w = POS_WEIGHT[k]
        bi = pillars[k]["branch_idx"]
        for si, days in C.HIDDEN_STEMS[bi]:
            e = C.STEM_ELEM[si]
            val = (days / 30.0) * w
            if _supports(dm, e):
                support += val
            else:
                oppose += val
    support_ratio = support / (support + oppose)

    # ② 통근(일간이 각 지지에서 갖는 12운성) — 위치 가중
    root_num = root_den = 0.0
    for k in keys:
        w = POS_WEIGHT[k]
        life = derive.twelve_life(dm_idx, pillars[k]["branch_idx"])
        root_num += ROOT_STRENGTH.get(life, 0.0) * w
        root_den += w
    root_ratio = root_num / root_den

    # ③ 득(득령/득지/득시/득세) 비율
    dk = deuk_flags(pillars)
    deuk_count = sum(1 for v in dk.values() if v)
    deuk_ratio = deuk_count / 4.0

    # ④ 종합지수 (오행세력 45% + 통근 22% + 득 33%)
    #    ※ web/js/saju-engine.js 의 strength() 공식과 반드시 동일하게 유지.
    #    포스텔러(김민수=신강) 케이스에 맞춰 보정된 계수.
    index = round(100 * (0.45 * support_ratio + 0.22 * root_ratio + 0.33 * deuk_ratio))
    band = BANDS[0]
    for i, cut in enumerate(BAND_THRESHOLDS):
        if index >= cut:
            band = BANDS[i + 1]
    is_strong = index >= BAND_THRESHOLDS[3]  # 중화신강 이상 = 신강 계열

    return {
        "index": index,
        "band": band,
        "is_strong": is_strong,
        "support_ratio": round(support_ratio, 4),
        "root_ratio": round(root_ratio, 4),
        "deuk": dk,
        "_note": "밴드경계/인구%는 레퍼런스별 보정 대상(BAND_THRESHOLDS).",
    }


# ── 용신 ─────────────────────────────────────────────
# 계절: 월지 idx → 계절
_SEASON = {2: "봄", 3: "봄", 4: "봄", 5: "여름", 6: "여름", 7: "여름",
           8: "가을", 9: "가을", 10: "가을", 11: "겨울", 0: "겨울", 1: "겨울"}

def johu_yongshin(pillars):
    """조후용신 — 계절 한난조습 균형(간이표; 窮通寶鑑 전체표로 교체 가능)."""
    season = _SEASON[pillars["month"]["branch_idx"]]
    dm = C.STEM_ELEM[pillars["day_master_idx"]]
    if season == "여름":
        return C.WATER          # 더움 → 물
    if season == "겨울":
        return C.FIRE           # 추움 → 불
    if season == "봄":
        # 목왕 → 금으로 다듬거나 화로 설기; 간이로 화/금 중 화
        return C.METAL if dm in (C.WOOD,) else C.FIRE
    # 가을: 금왕 → 화로 제련 / 목으로 소통 → 간이로 화
    return C.FIRE

def eokbu_yongshin(pillars, strength_res):
    """억부용신 — 신강이면 극·설(관>식상>재), 신약이면 부조(인>비겁)."""
    dm = C.STEM_ELEM[pillars["day_master_idx"]]
    controls_me = [e for e in C.ELEMENTS if C.CONTROLS[e] == dm][0]   # 관성(나를 극)
    i_generate = C.GENERATES[dm]                                       # 식상(내가 생)
    i_control = C.CONTROLS[dm]                                         # 재성(내가 극)
    generates_me = [e for e in C.ELEMENTS if C.GENERATES[e] == dm][0]  # 인성(나를 생)
    cnt = derive.element_count(pillars, weighted=True)
    if strength_res["is_strong"]:
        # 신강 → 빼거나 눌러야. 원국에 세력 있는 것 우선(관 > 식상 > 재)
        for cand in (controls_me, i_generate, i_control):
            if cnt[cand] > 0:
                return cand
        return controls_me
    else:
        # 신약 → 도와야 (인성 > 비겁)
        for cand in (generates_me, dm):
            if cnt[cand] > 0:
                return cand
        return generates_me

def yongshin(pillars, strength_res):
    return {
        "johu": johu_yongshin(pillars),
        "eokbu": eokbu_yongshin(pillars, strength_res),
        "_note": "조후=간이표, 억부=신강약 기반. 유파별 보정 가능.",
    }
