# -*- coding: utf-8 -*-
"""4기둥(년·월·일·시주) 계산.

년주 = 입춘 기준 60갑자, 월주 = 12절 경계 + 월두법,
일주 = 율리우스일 60갑자, 시주 = 시두법(일간 + 시지).
"""
import math
from datetime import timedelta
from . import constants as C
from . import solarterms as S

# ── 60갑자 앵커 ──────────────────────────────────────
# 년: 1984 = 갑자년(甲子, idx60 0)
_YEAR_ANCHOR = 1984
# 일: 1998-06-08 = 병술(丙戌, idx60 22) 로 오프셋 보정 (아래 계산기에서 검증)
_DAY_IDX60_ANCHOR = {"jdn": None, "idx60": 22, "y": 1998, "m": 6, "d": 8}


def civil_jdn(y, m, d):
    """양력 날짜 → 정수 율리우스일(자정 기준, proleptic Gregorian)."""
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12 * a - 3
    return (d + (153 * mm + 2) // 5 + 365 * yy + yy // 4
            - yy // 100 + yy // 400 - 32045)


# 일주 오프셋: (jdn + OFF) % 60 == idx60.  앵커로 1회 산출.
_DAY_OFFSET = (_DAY_IDX60_ANCHOR["idx60"]
               - civil_jdn(_DAY_IDX60_ANCHOR["y"], _DAY_IDX60_ANCHOR["m"],
                           _DAY_IDX60_ANCHOR["d"])) % 60


def pillar(stem_i, branch_i):
    """(천간idx, 지지idx) → 기둥 dict. 오행·음양·±표기 포함."""
    si = stem_i % 10
    bi = branch_i % 12
    main = C.BRANCH_MAIN_STEM[bi]           # 지지 본기(정기) 천간
    return {
        "stem_idx": si, "branch_idx": bi,
        "stem": C.STEM_KO[si], "stem_hanja": C.STEM_HANJA[si],
        "branch": C.BRANCH_KO[bi], "branch_hanja": C.BRANCH_HANJA[bi],
        "ganji": C.STEM_KO[si] + C.BRANCH_KO[bi],
        "ganji_hanja": C.STEM_HANJA[si] + C.BRANCH_HANJA[bi],
        "animal": C.BRANCH_ANIMAL[bi],
        # 천간 오행/음양
        "stem_elem": C.STEM_ELEM[si],
        "stem_sign": "+" if C.STEM_YANG[si] else "-",
        # 지지 오행 + 음양(본기 기준 = 화면의 用 음양 표기)
        "branch_elem": C.BRANCH_ELEM[bi],
        "branch_sign": "+" if C.STEM_YANG[main] else "-",
    }


def hour_branch_index(hour, minute=0):
    """시각(24h) → 시지 idx. 자시=23:00~00:59, 이후 2시간 단위."""
    return ((hour + 1) // 2) % 12


def compute_pillars(dt_kst, gender=None, late_zi=False):
    """출생 KST datetime → 4기둥.
    late_zi=False: 일주는 자정(00:00) 경계. 23시대(야자시)는 당일 일간 + 자시.
    late_zi=True : 일주가 23:00부터 다음날로 넘어감(조자시/야자시 적용).
    반환: dict(year/month/day/hour, day_master, meta)
    """
    # ── 일주 기준일 (자정/야자시 옵션) ──
    day_dt = dt_kst
    if late_zi and dt_kst.hour == 23:
        day_dt = dt_kst + timedelta(days=1)
    jdn = civil_jdn(day_dt.year, day_dt.month, day_dt.day)
    day_idx60 = (jdn + _DAY_OFFSET) % 60
    day_stem = day_idx60 % 10
    day_branch = day_idx60 % 12

    # ── 년주 (입춘 경계) ──
    saju_year = dt_kst.year
    if dt_kst < S.ipchun_kst(dt_kst.year):
        saju_year -= 1
    yoff = (saju_year - _YEAR_ANCHOR) % 60
    year_stem = yoff % 10
    year_branch = yoff % 12

    # ── 월주 (12절 경계 + 월두법) ──
    month_branch = S.month_branch_index(dt_kst)
    # 월두법: 년간 → 인월 천간
    ipwol_stem = {0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0}[year_stem]
    m_off = (month_branch - 2) % 12                # 인(2)에서 몇 번째 달
    month_stem = (ipwol_stem + m_off) % 10

    # ── 시주 (시두법) ──
    hour_branch = hour_branch_index(dt_kst.hour, dt_kst.minute)
    jasi_stem = {0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8}[day_stem]
    hour_stem = (jasi_stem + hour_branch) % 10

    return {
        "year": pillar(year_stem, year_branch),
        "month": pillar(month_stem, month_branch),
        "day": pillar(day_stem, day_branch),
        "hour": pillar(hour_stem, hour_branch),
        "day_master_idx": day_stem,             # 일간 = 나
        "day_master": C.STEM_KO[day_stem],
        "meta": {
            "saju_year": saju_year,
            "ipchun": S.ipchun_kst(dt_kst.year).isoformat(),
            "birth_kst": dt_kst.isoformat(),
            "gender": gender,
            "late_zi": late_zi,
        },
    }
