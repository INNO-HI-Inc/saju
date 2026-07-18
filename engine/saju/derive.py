# -*- coding: utf-8 -*-
"""글자 파생 정보 — 십성(十星)·지장간·12운성·12신살.

전부 고정표 룩업. 일간(日干)과 각 지지/천간의 관계로 결정된다.
"""
from . import constants as C


def ten_star(day_master_idx, target_stem_idx):
    """일간 대비 target 천간의 십성."""
    dm = day_master_idx % 10
    t = target_stem_idx % 10
    dm_e, dm_y = C.STEM_ELEM[dm], C.STEM_YANG[dm]
    t_e, t_y = C.STEM_ELEM[t], C.STEM_YANG[t]
    if t_e == dm_e:
        rel = "same"
    elif C.GENERATES[dm_e] == t_e:
        rel = "iGen"           # 내가 생함 → 식상
    elif C.CONTROLS[dm_e] == t_e:
        rel = "iCon"           # 내가 극함 → 재성
    elif C.GENERATES[t_e] == dm_e:
        rel = "genMe"          # 나를 생함 → 인성
    elif C.CONTROLS[t_e] == dm_e:
        rel = "conMe"          # 나를 극함 → 관성
    else:
        rel = "same"
    parity = "동" if t_y == dm_y else "이"
    return C.TEN_STAR[(rel, parity)]


def branch_ten_star(day_master_idx, branch_idx):
    """지지 십성 = 지지 본기(정기) 천간 기준."""
    return ten_star(day_master_idx, C.BRANCH_MAIN_STEM[branch_idx % 12])


def hidden_stems(branch_idx, day_master_idx=None):
    """지지의 지장간. (한글 연결문자열 + 상세 리스트)."""
    items = C.HIDDEN_STEMS[branch_idx % 12]
    detail = []
    for si, days in items:
        entry = {
            "stem": C.STEM_KO[si], "stem_hanja": C.STEM_HANJA[si],
            "elem": C.STEM_ELEM[si], "days": days,
        }
        if day_master_idx is not None:
            entry["ten_star"] = ten_star(day_master_idx, si)
        detail.append(entry)
    return {"str": "".join(C.STEM_KO[si] for si, _ in items), "detail": detail}


def twelve_life(day_master_idx, branch_idx):
    """12운성(포태) — 일간이 해당 지지에서 갖는 상태."""
    return C.TWELVE_LIFE[day_master_idx % 10][branch_idx % 12]


def twelve_sin(base_branch_idx, branch_idx):
    """12신살 — base(보통 년지) 삼합국 기준으로 해당 지지의 신살."""
    return C.TWELVE_SIN[base_branch_idx % 12][branch_idx % 12]


def element_count(pillars, weighted=False):
    """원국 오행 분포 집계.
    weighted=False: 8글자(천간4+지지4) 단순 개수.
    weighted=True : 지장간 비중까지 반영한 세력 점수(신강약용).
    """
    cnt = {e: 0.0 for e in C.ELEMENTS}
    keys = ["year", "month", "day", "hour"]
    for k in keys:
        p = pillars[k]
        cnt[p["stem_elem"]] += 1
        if not weighted:
            cnt[p["branch_elem"]] += 1
    if weighted:
        # 지지는 지장간 비중(30일 정규화)으로 세력 배분
        for k in keys:
            bi = pillars[k]["branch_idx"]
            for si, days in C.HIDDEN_STEMS[bi]:
                cnt[C.STEM_ELEM[si]] += days / 30.0
    return cnt
