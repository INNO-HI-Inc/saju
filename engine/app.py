# -*- coding: utf-8 -*-
"""사주 만세력 엔진 — Streamlit 데모.
실행:  streamlit run app.py
"""
import streamlit as st
from saju.chart import build_chart
from saju import solarterms as S

st.set_page_config(page_title="사주 만세력 엔진", page_icon="☯", layout="wide")

# 오행 → 색
ELEM_COLOR = {"목": "#2e7d32", "화": "#c62828", "토": "#c77f0a",
              "금": "#6b7280", "수": "#1565c0"}
ELEM_BG = {"목": "#e8f5e9", "화": "#fdecea", "토": "#fdf3e2",
           "금": "#f3f4f6", "수": "#e7f0fb"}


def cell(char, hanja, elem, sign, big=True):
    c = ELEM_COLOR.get(elem, "#333")
    bg = ELEM_BG.get(elem, "#fff")
    size = "34px" if big else "15px"
    return (f"<div style='background:{bg};border-radius:8px;padding:8px 4px;text-align:center'>"
            f"<span style='color:{c};font-weight:800;font-size:{size}'>{char}{hanja}</span>"
            f"<br><span style='color:{c};font-size:12px'>{sign}{elem}</span></div>")


def pillar_table(chart):
    order = ["hour", "day", "month", "year"]
    head = {"hour": "생시", "day": "생일", "month": "생월", "year": "생년"}
    c = chart["chart"]
    rows = []
    rows.append("<tr><td class='rh'></td>" + "".join(
        f"<td class='ch'>{head[k]}</td>" for k in order) + "</tr>")

    def rowline(label, fn):
        return (f"<tr><td class='rh'>{label}</td>" +
                "".join(f"<td>{fn(c[k])}</td>" for k in order) + "</tr>")

    rows.append(rowline("천간", lambda x: cell(
        x["stem"]["ko"], x["stem"]["hanja"], x["stem"]["elem"], x["stem"]["sign"])))
    rows.append(rowline("십성", lambda x: f"<b>{x['stem']['ten_star']}</b>"))
    rows.append(rowline("지지", lambda x: cell(
        x["branch"]["ko"], x["branch"]["hanja"], x["branch"]["elem"], x["branch"]["sign"])))
    rows.append(rowline("십성", lambda x: f"<b>{x['branch']['ten_star']}</b>"))
    rows.append(rowline("지장간", lambda x: x["hidden_stems"]["str"]))
    rows.append(rowline("12운성", lambda x: x["twelve_life"]))
    rows.append(rowline("12신살", lambda x: x["twelve_sin"]))
    return ("<table class='saju'>" + "".join(rows) + "</table>"
            "<style>"
            ".saju{border-collapse:separate;border-spacing:6px;width:100%;text-align:center}"
            ".saju td{padding:6px;font-size:15px}"
            ".saju .ch{font-weight:700;color:#666;font-size:14px}"
            ".saju .rh{color:#999;font-size:13px;text-align:right;padding-right:10px}"
            "</style>")


st.title("☯ 사주 만세력 엔진")
st.caption("생년월일시 → 만세력(원국·신강약·용신·대운·세운). 계산은 결정론 엔진, 해석은 LLM(분리).")

with st.sidebar:
    st.header("생년월일시")
    y = st.number_input("연도(양력)", 1900, 2100, 1998)
    mo = st.number_input("월", 1, 12, 6)
    d = st.number_input("일", 1, 31, 8)
    h = st.number_input("시", 0, 23, 10)
    mi = st.number_input("분", 0, 59, 0)
    gender = st.radio("성별", ["여", "남"], horizontal=True)
    late_zi = st.checkbox("야자시 적용(23시→익일 일주)", value=False)
    go = st.button("만세력 뽑기", type="primary", use_container_width=True)

if go or True:
    try:
        chart = build_chart(int(y), int(mo), int(d), int(h), int(mi),
                            gender="M" if gender == "남" else "F", late_zi=late_zi)
    except Exception as e:
        st.error(f"입력 오류: {e}")
        st.stop()

    dm = chart["day_master"]
    src = "KASI 절기(공식) + Meeus 폴백" if S.source_mode() == "kasi+meeus" else "Meeus 천문계산(로컬)"
    st.markdown(f"### 일간(나): <span style='color:{ELEM_COLOR[dm['elem']]}'>"
                f"{dm['ko']}{dm['hanja']} ({dm['sign']}{dm['elem']})</span>",
                unsafe_allow_html=True)
    p = chart["pillars"]
    st.markdown(f"**사주팔자:** {p['년주']} · {p['월주']} · {p['일주']} · {p['시주']}  "
                f"　|　절기소스: `{src}`")

    st.subheader("원국(命式)")
    st.markdown(pillar_table(chart), unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        s = chart["strength"]
        st.subheader("신강 / 신약")
        st.metric(s["band"], f"지수 {s['index']}")
        deuk = s["deuk"]
        st.write(" ".join(f"{'✅' if v else '❌'} {k}" for k, v in deuk.items()))
        el = chart["elements"]["count"]
        st.write("**오행 분포:** " + " · ".join(
            f"<span style='color:{ELEM_COLOR[k]}'>{k} {int(v)}</span>"
            for k, v in el.items()), unsafe_allow_html=True)
        st.caption("※ 밴드/오행 가중치는 유파별 보정 가능. 인구분포%는 별도 통계 필요.")
    with col2:
        yy = chart["yongshin"]
        st.subheader("용신(用神)")
        st.markdown(f"- **조후용신:** <span style='color:{ELEM_COLOR[yy['johu']]};font-weight:800'>{yy['johu']}</span>",
                    unsafe_allow_html=True)
        st.markdown(f"- **억부용신:** <span style='color:{ELEM_COLOR[yy['eokbu']]};font-weight:800'>{yy['eokbu']}</span>",
                    unsafe_allow_html=True)
        st.caption("※ 조후=간이표, 억부=신강약 기반. 유파별 교체 가능.")

    d_ = chart["daeun"]
    st.subheader(f"대운  ·  {d_['direction']} · 대운수 {d_['daeun_su']['number']}")
    cols = st.columns(len(d_["list"]))
    for i, x in enumerate(d_["list"]):
        with cols[i]:
            elem = None
            # 대운 천간 색: 간지 첫 글자 오행
            st.markdown(f"<div style='text-align:center'><small>{x['age']}세</small><br>"
                        f"<b style='font-size:20px'>{x['ganji']}</b><br>"
                        f"<small>{x['stem_ten_star']}<br>{x['twelve_life']}</small></div>",
                        unsafe_allow_html=True)

    st.subheader("세운(올해 전후)")
    scols = st.columns(len(chart["seun"]))
    for i, x in enumerate(chart["seun"]):
        with scols[i]:
            st.markdown(f"<div style='text-align:center'><small>{x['year']}</small><br>"
                        f"<b>{x['ganji']}</b><br><small>{x['stem_ten_star']}</small></div>",
                        unsafe_allow_html=True)

    with st.expander("🔧 LLM 해석 레이어로 넘어가는 구조화 JSON (계산↔해석 분리 계약)"):
        st.json(chart)
