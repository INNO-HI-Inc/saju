# -*- coding: utf-8 -*-
"""사주 만세력 엔진 — 결정론적 계산 계층 (LLM 해석과 분리).

사용:
    from saju.chart import build_chart
    chart = build_chart(1998, 6, 8, 10, 0, gender="F")
"""
import os as _os
from .chart import build_chart
from . import solarterms as _st

# KASI 절기 캐시가 있으면 자동 로드(없으면 Meeus 폴백으로 동작)
_CACHE = _os.path.join(_os.path.dirname(__file__), "data", "solar_terms.json")
if _os.path.exists(_CACHE):
    try:
        _st.load_kasi_cache(_CACHE)
    except Exception:
        pass

__all__ = ["build_chart"]
__version__ = "0.1.0"
