# -*- coding: utf-8 -*-
"""대운(大運) + 세운(歲運/연운).

대운 방향 = 년간 음양 × 성별.
대운수  = (순행: 다음 節 / 역행: 이전 節) 까지의 날수 ÷ 3.
대운 전개 = 월주 60갑자에서 순행 +1 / 역행 −1, 10년 단위.
"""
from . import constants as C
from . import derive
from . import solarterms as S


def luck_direction(year_stem_idx, gender):
    """순행(True)/역행(False). gender: 'M'/'남' 또는 'F'/'여'."""
    yang_year = C.STEM_YANG[year_stem_idx]
    male = str(gender).upper() in ("M", "MALE", "남", "남자")
    # 양년 남자·음년 여자 = 순행 / 그 외 = 역행
    return (yang_year and male) or ((not yang_year) and (not male))


def daeun_number(dt_kst, forward):
    """대운수(첫 대운 시작 나이) + 상세."""
    prev_jie, next_jie = S.prev_next_jie(dt_kst)
    if forward:
        days = (next_jie - dt_kst).total_seconds() / 86400.0
        ref = next_jie
    else:
        days = (dt_kst - prev_jie).total_seconds() / 86400.0
        ref = prev_jie
    num = round(days / 3.0)
    if num < 1:
        num = 1
    # 3일=1년, 1일=4개월 환산(참고)
    years = int(days // 3)
    months = round((days - years * 3) / 3 * 12)
    return {"number": num, "days_to_term": round(days, 3),
            "years": years, "months": months,
            "term_kst": ref.isoformat()}


def daeun_list(pillars, gender, count=10):
    """대운 전개 리스트."""
    dm_idx = pillars["day_master_idx"]
    year_stem = pillars["year"]["stem_idx"]
    forward = luck_direction(year_stem, gender)
    dt_iso = pillars["meta"]["birth_kst"]
    from datetime import datetime
    dt_kst = datetime.fromisoformat(dt_iso)
    num = daeun_number(dt_kst, forward)

    month_i60 = C.idx60(pillars["month"]["stem_idx"], pillars["month"]["branch_idx"])
    step = 1 if forward else -1
    out = []
    for k in range(count):
        i60 = (month_i60 + step * (k + 1)) % 60
        si, bi = i60 % 10, i60 % 12
        age = num["number"] + k * 10
        out.append({
            "age": age,
            "ganji": C.STEM_KO[si] + C.BRANCH_KO[bi],
            "ganji_hanja": C.STEM_HANJA[si] + C.BRANCH_HANJA[bi],
            "stem_ten_star": derive.ten_star(dm_idx, si),
            "branch_ten_star": derive.branch_ten_star(dm_idx, bi),
            "twelve_life": derive.twelve_life(dm_idx, bi),
        })
    return {"direction": "순행" if forward else "역행",
            "daeun_su": num, "list": out}


def seun_list(pillars, start_year, count=10):
    """세운(연운) 리스트 — 해당 연도들의 년간지 + 십성."""
    dm_idx = pillars["day_master_idx"]
    out = []
    for y in range(start_year, start_year + count):
        i60 = (y - 1984) % 60
        si, bi = i60 % 10, i60 % 12
        out.append({
            "year": y,
            "ganji": C.STEM_KO[si] + C.BRANCH_KO[bi],
            "ganji_hanja": C.STEM_HANJA[si] + C.BRANCH_HANJA[bi],
            "stem_ten_star": derive.ten_star(dm_idx, si),
            "branch_ten_star": derive.branch_ten_star(dm_idx, bi),
            "twelve_life": derive.twelve_life(dm_idx, bi),
        })
    return out
