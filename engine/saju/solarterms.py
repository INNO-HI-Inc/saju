# -*- coding: utf-8 -*-
"""24절기 — 분(分) 단위 절입 시각 (로컬 천문계산, Meeus 저정밀 태양황경).

사주 정확도의 핵심. 년주(입춘)·월주(12절 경계)·대운수(절기까지 날수)를 좌우한다.
KASI 절기 API가 열리면(특일정보 활용신청) day 단위 교차검증 훅을 붙일 수 있게
`kasi_crosscheck()` 자리를 비워둔다.

정밀도: 태양 겉보기황경 ~0.01°(≈15분 이내). 대부분의 상용 만세력과 동급.
필요 시 VSOP87 전개로 초 단위까지 상향 가능(구조 그대로).
"""
import math
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
_RAD = math.pi / 180.0

# ── 24절기 정의: (한글명, 태양황경 deg) ─────────────────
#   節(월 시작) 12개 + 中(월 중간) 12개.  황경 오름차순.
SOLAR_TERMS = [
    ("춘분", 0),   ("청명", 15),  ("곡우", 30),  ("입하", 45),
    ("소만", 60),  ("망종", 75),  ("하지", 90),  ("소서", 105),
    ("대서", 120), ("입추", 135), ("처서", 150), ("백로", 165),
    ("추분", 180), ("한로", 195), ("상강", 210), ("입동", 225),
    ("소설", 240), ("대설", 255), ("동지", 270), ("소한", 285),
    ("대한", 300), ("입춘", 315), ("우수", 330), ("경칩", 345),
]
# 12절(節) — 월지 시작. 황경(deg) → 월지 idx. 인(2)월=입춘(315°)에서 시작.
JIE_LONGITUDES = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285]
# 節 황경(deg) → 월지 idx
JIE_DEG_TO_BRANCH = {315: 2, 345: 3, 15: 4, 45: 5, 75: 6, 105: 7,
                     135: 8, 165: 9, 195: 10, 225: 11, 255: 0, 285: 1}
IPCHUN_DEG = 315  # 년주 경계

# ── KASI 절기 캐시 (있으면 우선, 없으면 Meeus 폴백) ──────
#   구조: {(year:int, deg:int): datetime(KST)}.  load_kasi_cache()로 채운다.
_KASI_CACHE = {}
_SOURCE = {"mode": "meeus"}   # 'kasi' 로드되면 'kasi+meeus'


def load_kasi_cache(path):
    """KASI 절기 JSON 캐시 로드. {year: {deg: 'ISO8601'}} 형식."""
    import json
    from datetime import datetime as _dt
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    n = 0
    for y, terms in data.items():
        for deg, iso in terms.items():
            _KASI_CACHE[(int(y), int(deg))] = _dt.fromisoformat(iso)
            n += 1
    _SOURCE["mode"] = "kasi+meeus"
    return n


def source_mode():
    return _SOURCE["mode"]


# ── 시각 ↔ 율리우스일 ───────────────────────────────
def _jd_from_datetime_utc(dt_utc):
    """UTC datetime → Julian Day (proleptic Gregorian)."""
    y, m = dt_utc.year, dt_utc.month
    d = (dt_utc.day + dt_utc.hour / 24 + dt_utc.minute / 1440
         + dt_utc.second / 86400 + dt_utc.microsecond / 86400e6)
    if m <= 2:
        y -= 1; m += 12
    a = y // 100
    b = 2 - a + a // 4
    return (math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1))
            + d + b - 1524.5)


def _datetime_utc_from_jd(jd):
    """Julian Day → UTC datetime."""
    jd += 0.5
    z = math.floor(jd); f = jd - z
    if z < 2299161:
        a = z
    else:
        alpha = math.floor((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - alpha // 4
    b = a + 1524
    c = math.floor((b - 122.1) / 365.25)
    dd = math.floor(365.25 * c)
    e = math.floor((b - dd) / 30.6001)
    day_frac = b - dd - math.floor(30.6001 * e) + f
    day = math.floor(day_frac)
    frac = day_frac - day
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    secs = round(frac * 86400)
    base = datetime(year, month, day, tzinfo=timezone.utc)
    return base + timedelta(seconds=secs)


def _delta_t_seconds(year):
    """ΔT = TT − UT (초). Espenak–Meeus 근사 (1800~2150 구간 위주)."""
    if 1900 <= year < 1920:
        t = year - 1900
        return -2.79 + 1.494119*t - 0.0598939*t*t + 0.0061966*t**3 - 0.000197*t**4
    if 1920 <= year < 1941:
        t = year - 1920
        return 21.20 + 0.84493*t - 0.076100*t*t + 0.0020936*t**3
    if 1941 <= year < 1961:
        t = year - 1950
        return 29.07 + 0.407*t - t*t/233 + t**3/2547
    if 1961 <= year < 1986:
        t = year - 1975
        return 45.45 + 1.067*t - t*t/260 - t**3/718
    if 1986 <= year < 2005:
        t = year - 2000
        return (63.86 + 0.3345*t - 0.060374*t*t + 0.0017275*t**3
                + 0.000651814*t**4 + 0.00002373599*t**5)
    if 2005 <= year < 2050:
        t = year - 2000
        return 62.92 + 0.32217*t + 0.005589*t*t
    if 2050 <= year <= 2150:
        return -20 + 32*((year-1820)/100)**2 - 0.5628*(2150-year)
    # 범위 밖: 근사
    u = (year - 1820) / 100
    return -20 + 32*u*u


# ── 태양 겉보기황경 (Meeus 25장, 저정밀) ─────────────
def _sun_apparent_longitude(jde):
    """JDE(=TT 기준 율리우스일) → 태양 겉보기황경(deg, 0~360)."""
    T = (jde - 2451545.0) / 36525.0
    L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T
    M = 357.52911 + 35999.05029*T - 0.0001537*T*T
    Mr = M * _RAD
    C = ((1.914602 - 0.004817*T - 0.000014*T*T) * math.sin(Mr)
         + (0.019993 - 0.000101*T) * math.sin(2*Mr)
         + 0.000289 * math.sin(3*Mr))
    true_long = L0 + C
    omega = 125.04 - 1934.136*T
    apparent = true_long - 0.00569 - 0.00478 * math.sin(omega * _RAD)
    return apparent % 360.0


def sun_longitude_kst(dt_kst):
    """KST datetime → 그 순간의 태양 겉보기황경(deg)."""
    dt_utc = dt_kst.astimezone(timezone.utc)
    dt_dt = dt_utc + timedelta(seconds=_delta_t_seconds(dt_utc.year))  # UT→TT
    jde = _jd_from_datetime_utc(dt_dt)
    return _sun_apparent_longitude(jde)


def _signed_diff(lon, target):
    """(lon-target)을 [-180,180)로. 근을 부호변화(-→+)로 찾기 위함."""
    return ((lon - target + 180) % 360) - 180


def find_term_kst(year, target_deg):
    """주어진 양력 연도에서 태양황경이 target_deg에 도달하는 절기 시각(KST).
    KASI 캐시가 있으면 그 공식값을, 없으면 Meeus 천문계산으로 폴백."""
    cached = _KASI_CACHE.get((year, int(target_deg) % 360))
    if cached is not None:
        return cached
    return _find_term_meeus(year, target_deg)


def _find_term_meeus(year, target_deg):
    """Meeus 태양황경 기반 절기 시각(KST) — 폴백/오프라인용."""
    def lon_at(dt_kst):
        return _sun_apparent_longitude(
            _jd_from_datetime_utc(
                dt_kst.astimezone(timezone.utc)
                + timedelta(seconds=_delta_t_seconds(year))))
    step = timedelta(days=1)
    t = datetime(year, 1, 1, tzinfo=KST)
    prev = _signed_diff(lon_at(t), target_deg)
    end = datetime(year + 1, 1, 2, tzinfo=KST)
    while t < end:
        nxt = t + step
        cur = _signed_diff(lon_at(nxt), target_deg)
        if prev < 0 <= cur:  # 상승 교차
            lo, hi = t, nxt
            for _ in range(40):  # 이분법 → 초 단위 수렴
                mid = lo + (hi - lo) / 2
                if _signed_diff(lon_at(mid), target_deg) < 0:
                    lo = mid
                else:
                    hi = mid
            return lo + (hi - lo) / 2
        prev = cur
        t = nxt
    raise ValueError(f"{year}년 황경 {target_deg}° 절기를 찾지 못함")


def ipchun_kst(year):
    """해당 양력 연도의 입춘 시각(KST). 사주 년주 경계."""
    return find_term_kst(year, IPCHUN_DEG)


def _all_jie_around(dt_kst):
    """dt 주변(전년·당년·익년)의 모든 節 (시각, 황경) 리스트, 시간순."""
    out = []
    for yy in (dt_kst.year - 1, dt_kst.year, dt_kst.year + 1):
        for deg in JIE_LONGITUDES:
            out.append((find_term_kst(yy, deg), deg))
    out.sort(key=lambda x: x[0])
    return out


def month_branch_index(dt_kst):
    """출생 순간의 월지(地支) idx. 직전 節의 황경으로 결정. 인(2)~축(1).
    절기 시각(KASI 우선) 기준이라 경계 '분'까지 정확."""
    jies = _all_jie_around(dt_kst)
    last_deg = None
    for t, deg in jies:
        if t <= dt_kst:
            last_deg = deg
        else:
            break
    return JIE_DEG_TO_BRANCH[last_deg]


def prev_next_jie(dt_kst):
    """출생 순간 기준 직전/직후 節(월 시작 절기)의 시각(KST). 대운수 계산용."""
    jies = _all_jie_around(dt_kst)
    prev_t = next_t = None
    for t, deg in jies:
        if t <= dt_kst:
            prev_t = t
        elif next_t is None:
            next_t = t
            break
    return prev_t, next_t


def kasi_crosscheck(year, month):
    """(추후) KASI get24DivisionsInfo 로 day 단위 교차검증.
    특일정보 서비스 활용신청 후 활성화. 현재는 미구현 훅."""
    raise NotImplementedError(
        "KASI 특일정보(SpcdeInfoService) 활용신청 후 구현. 현재 키는 403.")
