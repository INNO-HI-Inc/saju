# -*- coding: utf-8 -*-
"""통합 — 생년월일시 + 성별 → 화면 3장의 모든 필드를 구조화 JSON으로.

이 dict가 LLM 해석 레이어(로컬 LLM → 추후 클라우드 API)로 넘어가는 '단일 계약'이다.
LLM은 이 값을 '읽어서 서술'만 한다. 계산은 절대 LLM에게 시키지 않는다.
"""
from datetime import datetime, timezone, timedelta
from . import constants as C
from . import pillars as P
from . import derive
from . import strength as ST
from . import luck as L

KST = timezone(timedelta(hours=9))


def _pillar_view(pillars, key, dm_idx, sin_base):
    """한 기둥의 화면 표기용 상세(천간/지지 + 십성/지장간/12운성/12신살)."""
    p = pillars[key]
    bi = p["branch_idx"]
    return {
        "stem": {"ko": p["stem"], "hanja": p["stem_hanja"],
                 "elem": p["stem_elem"], "sign": p["stem_sign"],
                 "ten_star": derive.ten_star(dm_idx, p["stem_idx"])
                 if key != "day" else "일간(나)"},
        "branch": {"ko": p["branch"], "hanja": p["branch_hanja"],
                   "elem": p["branch_elem"], "sign": p["branch_sign"],
                   "animal": p["animal"],
                   "ten_star": derive.branch_ten_star(dm_idx, bi)},
        "hidden_stems": derive.hidden_stems(bi, dm_idx),
        "twelve_life": derive.twelve_life(dm_idx, bi),
        "twelve_sin": derive.twelve_sin(sin_base, bi),
        "ganji": p["ganji"], "ganji_hanja": p["ganji_hanja"],
    }


def build_chart(year, month, day, hour, minute=0, gender="F",
                late_zi=False, seun_years=10, daeun_count=10):
    """메인 진입점. 양력 생년월일시(KST) + 성별 → 전체 사주 차트 dict."""
    dt = datetime(year, month, day, hour, minute, tzinfo=KST)
    pil = P.compute_pillars(dt, gender=gender, late_zi=late_zi)
    dm_idx = pil["day_master_idx"]
    sin_base = pil["year"]["branch_idx"]        # 12신살 기준 = 년지

    # 원국(화면1)
    won = {k: _pillar_view(pil, k, dm_idx, sin_base)
           for k in ("hour", "day", "month", "year")}

    # 오행 분포
    elem_simple = derive.element_count(pil, weighted=False)
    elem_weighted = {e: round(v, 3) for e, v in
                     derive.element_count(pil, weighted=True).items()}

    # 신강약 + 용신(화면2)
    st = ST.strength(pil)
    ys = ST.yongshin(pil, st)

    # 대운 + 세운(화면3)
    daeun = L.daeun_list(pil, gender, count=daeun_count)
    seun = L.seun_list(pil, seun_years if seun_years > 100 else year,
                       count=seun_years if seun_years <= 100 else 10)

    return {
        "input": {"solar": f"{year:04d}-{month:02d}-{day:02d} "
                            f"{hour:02d}:{minute:02d}", "gender": gender,
                  "late_zi": late_zi},
        "day_master": {"ko": pil["day_master"],
                       "hanja": C.STEM_HANJA[dm_idx],
                       "elem": C.STEM_ELEM[dm_idx],
                       "sign": "+" if C.STEM_YANG[dm_idx] else "-"},
        "pillars": {
            "년주": pil["year"]["ganji"], "월주": pil["month"]["ganji"],
            "일주": pil["day"]["ganji"], "시주": pil["hour"]["ganji"],
            "hanja": {
                "년주": pil["year"]["ganji_hanja"],
                "월주": pil["month"]["ganji_hanja"],
                "일주": pil["day"]["ganji_hanja"],
                "시주": pil["hour"]["ganji_hanja"]},
        },
        "chart": won,                        # 화면1: 4기둥 상세 테이블
        "elements": {"count": elem_simple, "weighted": elem_weighted},
        "strength": st,                      # 화면2: 신강약
        "yongshin": ys,                      # 화면2: 용신
        "daeun": daeun,                      # 화면3: 대운
        "seun": seun,                        # 화면3: 세운
        "meta": pil["meta"],
    }
