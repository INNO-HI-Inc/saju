# -*- coding: utf-8 -*-
"""데모 — 화면 3장 레이아웃으로 콘솔 출력.
사용:  python3 demo.py 1998 6 8 10 0 F
"""
import sys, json
from saju.chart import build_chart


def render(chart):
    P = ["hour", "day", "month", "year"]
    HEAD = {"hour": "생시", "day": "생일", "month": "생월", "year": "생년"}
    c = chart["chart"]
    def row(getter):
        return " | ".join(f"{getter(c[k]):^10}" for k in P)

    print("\n" + "═" * 56)
    print(f"  {chart['input']['solar']}  ({chart['input']['gender']})   "
          f"일간: {chart['day_master']['ko']}{chart['day_master']['hanja']}"
          f"({chart['day_master']['sign']}{chart['day_master']['elem']})")
    print("═" * 56)
    print("        " + " | ".join(f"{HEAD[k]:^10}" for k in P))
    print("천간   " + row(lambda x: f"{x['stem']['ko']}{x['stem']['hanja']} {x['stem']['sign']}{x['stem']['elem']}"))
    print("십성   " + row(lambda x: x['stem']['ten_star']))
    print("지지   " + row(lambda x: f"{x['branch']['ko']}{x['branch']['hanja']} {x['branch']['sign']}{x['branch']['elem']}"))
    print("십성   " + row(lambda x: x['branch']['ten_star']))
    print("지장간 " + row(lambda x: x['hidden_stems']['str']))
    print("12운성 " + row(lambda x: x['twelve_life']))
    print("12신살 " + row(lambda x: x['twelve_sin']))

    s = chart["strength"]
    print("\n[신강/신약]", s["band"], f"(지수 {s['index']})",
          " ".join(f"{k}{'○' if v else '✗'}" for k, v in s["deuk"].items()))
    y = chart["yongshin"]
    print("[용신] 조후:", y["johu"], " 억부:", y["eokbu"])
    el = chart["elements"]["count"]
    print("[오행]", " ".join(f"{k}{int(v)}" for k, v in el.items()))

    d = chart["daeun"]
    print(f"\n[대운] {d['direction']} · 대운수 {d['daeun_su']['number']}")
    print("  " + " ".join(f"{x['age']:>2}{x['ganji']}" for x in d["list"]))
    print("  " + " ".join(f"  {x['stem_ten_star'][:2]}" for x in d["list"]))
    print("[세운]")
    print("  " + " ".join(f"{x['year']%100:02d}{x['ganji']}" for x in chart["seun"]))
    print()


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        a = ["1998", "6", "8", "10", "0", "F"]
    y, mo, d, h = int(a[0]), int(a[1]), int(a[2]), int(a[3])
    mi = int(a[4]) if len(a) > 4 else 0
    g = a[5] if len(a) > 5 else "F"
    chart = build_chart(y, mo, d, h, mi, gender=g)
    render(chart)
    # 전체 구조화 JSON (LLM 해석 레이어로 넘어가는 계약)
    if "--json" in a:
        print(json.dumps(chart, ensure_ascii=False, indent=2))
