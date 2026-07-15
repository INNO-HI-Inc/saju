/* 만세력 UI — 토스 테마 · 포스텔러 구조 카피. 브라우저에서 완결. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var gender = "F", LUNAR = null;

  fetch("js/lunar-table.json").then(function (r) { return r.json(); })
    .then(function (j) { LUNAR = j; }).catch(function () { LUNAR = null; });

  // 오행/십성 색 (토스 팔레트)
  var ELEM_HEX = { "목": "#15C47E", "화": "#F04452", "토": "#FF9500", "금": "#8B95A1", "수": "#3182F6" };
  var TEN_GROUP = { "비견": "비겁", "겁재": "비겁", "식신": "식상", "상관": "식상",
    "편재": "재성", "정재": "재성", "편관": "관성", "정관": "관성", "편인": "인성", "정인": "인성" };
  var GROUP_HEX = { "비겁": "#3182F6", "식상": "#15C47E", "재성": "#FF9500", "관성": "#F04452", "인성": "#7C5CFC" };
  var ANIMAL_EMOJI = { "쥐": "🐭", "소": "🐮", "호랑이": "🐯", "토끼": "🐰", "용": "🐲", "뱀": "🐍",
    "말": "🐴", "양": "🐑", "원숭이": "🐵", "닭": "🐔", "개": "🐶", "돼지": "🐷" };

  // 도시 경도(진태양시). name → 경도(°E)
  var CITY = { "서울": 126.98, "인천": 126.71, "수원": 127.03, "성남": 127.13, "용인": 127.18,
    "부천": 126.77, "안양": 126.95, "고양": 126.83, "남양주": 127.22, "화성": 126.83, "평택": 127.09,
    "파주": 126.78, "김포": 126.72, "광명": 126.86, "의정부": 127.03, "춘천": 127.73, "원주": 127.92,
    "강릉": 128.90, "속초": 128.59, "청주": 127.49, "충주": 127.93, "천안": 127.11, "아산": 127.00,
    "서산": 126.45, "공주": 127.12, "대전": 127.38, "세종": 127.29, "전주": 127.15, "익산": 126.96,
    "군산": 126.71, "목포": 126.39, "여수": 127.66, "순천": 127.49, "광주": 126.85, "포항": 129.34,
    "경주": 129.22, "구미": 128.34, "안동": 128.73, "창원": 128.68, "김해": 128.89, "진주": 128.11,
    "양산": 129.04, "거제": 128.62, "통영": 128.42, "부산": 129.08, "대구": 128.60, "울산": 129.31,
    "제주": 126.53, "서귀포": 126.56, "평양": 125.75, "개성": 126.55,
    "도쿄": 139.69, "오사카": 135.50, "베이징": 116.40, "상하이": 121.47, "홍콩": 114.17,
    "뉴욕": -74.00, "로스앤젤레스": -118.24, "런던": -0.13, "파리": 2.35, "시드니": 151.21,
    "방콕": 100.50, "싱가포르": 103.82, "하노이": 105.85, "타이베이": 121.56 };
  function cityOffset(name) {
    var lon = CITY[(name || "").trim()];
    if (lon == null) return null;
    return Math.round((lon - 135) * 4);
  }

  // ── 마스킹 ──
  function maskDate(v) { v = v.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) return v.slice(0, 4) + "/" + v.slice(4, 6) + "/" + v.slice(6);
    if (v.length >= 3) return v.slice(0, 4) + "/" + v.slice(4); return v; }
  function maskTime(v) { v = v.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + ":" + v.slice(2); return v; }
  $("birthday").addEventListener("change", validate);
  $("birthtime").addEventListener("change", validate);
  $("name").addEventListener("input", validate);
  $("hmUnsure").addEventListener("change", function () { $("birthtime").disabled = this.checked; if (this.checked) $("birthtime").value = ""; validate(); });
  document.querySelectorAll(".seg-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); gender = b.dataset.g;
    });
  });

  // ── 도시 자동완성 ──
  var cityNames = Object.keys(CITY);
  function renderCityHint() {
    var off = cityOffset($("city").value), h = $("cityHint");
    if (off == null) { h.textContent = $("city").value ? "목록에 없는 도시 — 보정 없이 계산됩니다" : ""; h.className = "city-hint gray"; }
    else { h.textContent = "진태양시 " + (off >= 0 ? "+" : "") + off + "분 보정"; h.className = "city-hint"; }
  }
  function showCityList() {
    var q = $("city").value.trim(), ul = $("cityList");
    var matches = cityNames.filter(function (n) { return q === "" ? false : n.indexOf(q) === 0 || n.indexOf(q) >= 0; }).slice(0, 8);
    if (!matches.length) { ul.classList.remove("show"); return; }
    ul.innerHTML = matches.map(function (n) {
      var o = cityOffset(n); return '<li data-city="' + n + '">' + n + '<span class="off">' + (o >= 0 ? "+" : "") + o + '분</span></li>'; }).join("");
    ul.classList.add("show");
  }
  $("city").addEventListener("input", function () { showCityList(); renderCityHint(); });
  $("city").addEventListener("focus", showCityList);
  $("city").addEventListener("blur", function () { setTimeout(function () { $("cityList").classList.remove("show"); }, 180); });
  $("cityList").addEventListener("mousedown", function (e) {
    var li = e.target.closest("li"); if (!li) return;
    $("city").value = li.dataset.city; $("cityList").classList.remove("show"); renderCityHint();
  });

  // ── 음↔양 ──
  function ymdUTC(a) { return Date.UTC(a[0], a[1] - 1, a[2]); }
  function addDays(ymd, n) { var dt = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2])); dt.setUTCDate(dt.getUTCDate() + n);
    return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()]; }
  function lunarToSolar(y, m, d, isLeap) {
    if (!LUNAR || !LUNAR[y]) return null;
    var t = LUNAR[y], ny = t.ny.split("-").map(Number), L = t.leap, md = t.md, off = 0, order = [];
    for (var x = 1; x <= 12; x++) { order.push([x, false]); if (L === x) order.push([x, true]); }
    for (var i = 0; i < order.length && i < md.length; i++) {
      if (order[i][0] === m && order[i][1] === isLeap) return addDays(ny, off + d - 1); off += md[i]; }
    return null;
  }
  function solarToLunar(y, mo, d) {
    if (!LUNAR) return null;
    var tgt = Date.UTC(y, mo - 1, d);
    for (var Y = y; Y >= y - 1; Y--) {
      var t = LUNAR[Y]; if (!t) continue;
      var ny = ymdUTC(t.ny.split("-").map(Number));
      if (tgt < ny) continue;
      var nx = LUNAR[Y + 1], nyN = nx ? ymdUTC(nx.ny.split("-").map(Number)) : ny + 400 * 86400000;
      if (tgt >= nyN) continue;
      var off = Math.round((tgt - ny) / 86400000), L = t.leap, md = t.md, order = [], acc = 0;
      for (var x = 1; x <= 12; x++) { order.push([x, false]); if (L === x) order.push([x, true]); }
      for (var i = 0; i < order.length; i++) { if (off < acc + md[i]) return { y: Y, m: order[i][0], d: off - acc + 1, leap: order[i][1] }; acc += md[i]; }
    }
    return null;
  }

  // ── 검증 ──
  function parseInputs() {
    var dv = $("birthday").value, tv = $("birthtime").value, unsure = $("hmUnsure").checked;
    if (!dv) return null;
    var dp = dv.split("-"), y = +dp[0], mo = +dp[1], d = +dp[2];
    if (!(y >= 1901 && y <= 2099) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var h = 12, mi = 0;
    if (!unsure) { if (!tv) return null; var tp = tv.split(":"); h = +tp[0]; mi = +tp[1]; if (isNaN(h) || isNaN(mi)) return null; }
    return { y: y, mo: mo, d: d, h: h, mi: mi, unsure: unsure };
  }
  function validate() { $("go").disabled = !parseInputs(); }

  // ── 계산 ──
  var lastChart = null;
  $("go").addEventListener("click", function () {
    var p = parseInputs(); if (!p) return;
    var cal = $("calendar").value, y = p.y, mo = p.mo, d = p.d;
    if (cal === "L" || cal === "LL") {
      var sol = lunarToSolar(y, mo, d, cal === "LL");
      if (!sol) { toast("해당 음력 날짜를 찾을 수 없어요"); return; }
      y = sol[0]; mo = sol[1]; d = sol[2];
    }
    var off = cityOffset($("city").value), useY = y, useMo = mo, useD = d, useH = p.h, useMi = p.mi;
    if (off != null && !p.unsure) {
      var dt = new Date(Date.UTC(y, mo - 1, d, p.h, p.mi)); dt.setUTCMinutes(dt.getUTCMinutes() + off);
      useY = dt.getUTCFullYear(); useMo = dt.getUTCMonth() + 1; useD = dt.getUTCDate(); useH = dt.getUTCHours(); useMi = dt.getUTCMinutes();
    }
    var chart;
    try { chart = SajuEngine.buildChart(useY, useMo, useD, useH, useMi, gender, $("lateZi").checked); }
    catch (e) { toast("계산 오류: " + e.message); return; }
    var lun = solarToLunar(y, mo, d);
    chart._meta = { name: $("name").value || "이름 없음", gender: gender === "M" ? "남자" : "여자",
      cal: cal, solarY: y, solarMo: mo, solarD: d, h: p.h, mi: p.mi, unsure: p.unsure,
      city: $("city").value, off: off, useH: useH, useMi: useMi, lunar: lun };
    lastChart = chart; renderResult(chart); showScreen("result");
  });

  // ══════ 렌더 ══════
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(h, m) { return pad(h) + ":" + pad(m); }

  // 프로필
  function renderProfile(c) {
    var dm = c.day_master, m = c._meta, ch = c.chart;
    var emoji = ANIMAL_EMOJI[ch.day.branch.animal] || "☯";
    var gtxt = m.gender + (m.city ? " · " + m.city : "");
    var lines = '<div class="pdate"><b>양</b> ' + m.solarY + "/" + pad(m.solarMo) + "/" + pad(m.solarD) +
      (m.unsure ? " 시간모름" : " " + hhmm(m.h, m.mi)) + " " + gtxt + '</div>';
    if (m.lunar) lines += '<div class="pdate"><b>음' + (m.lunar.leap ? "윤" : "") + '</b> ' + m.lunar.y + "/" + pad(m.lunar.m) + "/" + pad(m.lunar.d) + " " + gtxt + '</div>';
    if (m.off != null && !m.unsure) lines += '<div class="pdate"><b>양</b> ' + m.solarY + "/" + pad(m.solarMo) + "/" + pad(m.solarD) + " " + hhmm(m.useH, m.useMi) +
      ' <span class="tag">(지역시 ' + (m.off >= 0 ? "+" : "") + m.off + '분)</span></div>';
    return '<div class="rcard"><div class="profile-head"><div class="avatar">' + emoji + '</div>' +
      '<div><div class="profile-name">' + m.name + '</div><div class="profile-nick el-' + dm.elem + '">' +
      c.pillars["일주"] + '(' + c.nickname + ') · 일간 ' + dm.ko + dm.hanja + '</div></div></div>' +
      '<div class="profile-dates">' + lines + '</div></div>';
  }

  // 원국
  function bigCell(o) { return '<div class="wg-cell bg-' + o.elem + '"><div class="wg-big el-' + o.elem + '">' +
    o.ko + '<span class="hj">' + o.hanja + '</span></div><div class="wg-sub el-' + o.elem + '">' + o.sign + o.elem + '</div></div>'; }
  function renderWonguk(c) {
    var order = ["hour", "day", "month", "year"], head = { hour: "생시", day: "생일", month: "생월", year: "생년" }, ch = c.chart;
    var h = '<div class="rcard"><h2>사주 원국 <span class="mut">命式</span></h2><div class="wonguk-grid">';
    h += '<div class="wg-head"></div>'; order.forEach(function (k) { h += '<div class="wg-head">' + head[k] + '</div>'; });
    h += '<div class="wg-rowlabel">천간</div>'; order.forEach(function (k) { h += bigCell(ch[k].stem); });
    h += '<div class="wg-rowlabel">십성</div>'; order.forEach(function (k) { h += '<div class="wg-tenstar">' + ch[k].stem.ten_star + '</div>'; });
    h += '<div class="wg-rowlabel">지지</div>'; order.forEach(function (k) { h += bigCell(ch[k].branch); });
    h += '<div class="wg-rowlabel">십성</div>'; order.forEach(function (k) { h += '<div class="wg-tenstar">' + ch[k].branch.ten_star + '</div>'; });
    h += '<div class="wg-rowlabel">지장간</div>'; order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].hidden_stems.str + '</div>'; });
    h += '<div class="wg-rowlabel">12운성</div>'; order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].twelve_life + '</div>'; });
    h += '<div class="wg-rowlabel">12신살</div>'; order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].twelve_sin + '</div>'; });
    return h + '</div></div>';
  }

  // 도넛
  function donut(items, centerText, centerColor) {
    var circ = 2 * Math.PI * 60, off = 0;
    var s = '<svg class="donut" viewBox="0 0 150 150"><circle cx="75" cy="75" r="60" fill="none" stroke="#F2F4F6" stroke-width="22"/>';
    items.forEach(function (it) { if (it.pct <= 0) return; var len = circ * it.pct / 100;
      s += '<circle cx="75" cy="75" r="60" fill="none" stroke="' + it.color + '" stroke-width="22" stroke-dasharray="' + len + ' ' + (circ - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 75 75)"/>'; off += len; });
    s += '<text x="75" y="75" text-anchor="middle" dominant-baseline="central" class="donut-center" fill="' + centerColor + '">' + centerText + '</text></svg>';
    return s;
  }
  function elemLevel(p) { return p === 0 ? "부족" : p <= 12.5 ? "적정" : p <= 25 ? "발달" : "과다"; }
  function renderAnalysis(c) {
    var ep = c.elements2.pct, ELS = SajuEngine.ELEMENTS;
    var domE = ELS.reduce(function (a, b) { return ep[b] > ep[a] ? b : a; });
    var eItems = ELS.map(function (e) { return { pct: ep[e], color: ELEM_HEX[e] }; });
    var eRows = ELS.map(function (e) { var lv = elemLevel(ep[e]);
      return '<tr><td class="el-' + e + '">' + e + '</td><td>' + ep[e] + '%<span class="tag-lv lv-' + lv + '">' + lv + '</span></td></tr>'; }).join("");
    var ts = c.tenstar, TEN = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
    var tItems = TEN.map(function (t) { return { pct: ts.pct[t], color: GROUP_HEX[TEN_GROUP[t]] }; });
    var tRows = TEN.filter(function (t) { return ts.pct[t] > 0; }).map(function (t) {
      return '<tr><td>' + t + '</td><td>' + ts.pct[t] + '%</td></tr>'; }).join("");

    var left = '<div class="donut-wrap">' + donut(eItems, domE, ELEM_HEX[domE]) + '<div class="donut-cap">오행 중심 · ' + domE + '</div>' +
      '<table class="pct-table">' + eRows + '</table></div>';
    var right = '<div class="donut-wrap">' + donut(tItems, ts.dominant, GROUP_HEX[TEN_GROUP[ts.dominant]]) + '<div class="donut-cap">십성 중심 · ' + ts.dominant + '</div>' +
      '<table class="pct-table">' + tRows + '</table></div>';
    return '<div class="rcard"><h2>오행 · 십성 분석</h2><div class="analysis-grid">' + left + right + '</div></div>';
  }

  // 오행 관계도(펜타곤)
  function renderRelation(c) {
    var g = c.groups; // [비겁,식상,재성,관성,인성]
    var cx = 210, cy = 195, R = 128, ang = [-90, -18, 54, 126, 198];
    var pos = ang.map(function (a) { var r = a * Math.PI / 180; return [cx + R * Math.cos(r), cy + R * Math.sin(r)]; });
    var s = '<svg class="relation" viewBox="0 0 420 400">';
    // 극(剋) 대각선 — red
    var kg = [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]];
    kg.forEach(function (e) { s += '<line x1="' + pos[e[0]][0] + '" y1="' + pos[e[0]][1] + '" x2="' + pos[e[1]][0] + '" y2="' + pos[e[1]][1] + '" stroke="#F04452" stroke-width="1.5" opacity=".5"/>'; });
    // 생(生) 둘레 — blue
    for (var i = 0; i < 5; i++) { var j = (i + 1) % 5;
      s += '<line x1="' + pos[i][0] + '" y1="' + pos[i][1] + '" x2="' + pos[j][0] + '" y2="' + pos[j][1] + '" stroke="#3182F6" stroke-width="2" opacity=".55"/>'; }
    // 노드
    g.forEach(function (n, i) { var col = ELEM_HEX[n.elem];
      s += '<g class="rel-node"><circle cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="40" fill="#fff" stroke="' + col + '" stroke-width="2.5"/>' +
        '<text x="' + pos[i][0] + '" y="' + (pos[i][1] - 8) + '" text-anchor="middle" font-size="15" fill="' + col + '">' + n.elem + '</text>' +
        '<text x="' + pos[i][0] + '" y="' + (pos[i][1] + 8) + '" text-anchor="middle" font-size="11" fill="#8B95A1">' + n.key + '</text>' +
        '<text x="' + pos[i][0] + '" y="' + (pos[i][1] + 24) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#191F28">' + n.pct + '%</text></g>'; });
    s += '</svg>';
    return '<div class="rcard"><h2>오행 관계도 <span class="mut">生 · 剋</span></h2>' + s +
      '<div class="rel-legend"><span class="g">→ 생(生)</span><span class="k">→ 극(剋)</span></div></div>';
  }

  // 신강약
  var DIST = [5, 16, 19.5, 10, 25, 13, 5, 1.5];
  function strengthGraph(bi) {
    var W = 460, H = 176, pad = 26, n = DIST.length, max = Math.max.apply(null, DIST), bands = SajuEngine.BANDS;
    var xs = function (i) { return pad + (W - 2 * pad) * i / (n - 1); }, ys = function (v) { return H - 34 - (H - 58) * v / max; };
    var pts = DIST.map(function (v, i) { return xs(i) + "," + ys(v); }).join(" ");
    var s = '<svg class="str-graph" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    DIST.forEach(function (v, i) { s += '<rect x="' + (xs(i) - 19) + '" y="22" width="38" height="' + (H - 56) + '" rx="6" fill="#F2F4F6"/>'; });
    s += '<polyline points="' + pts + '" fill="none" stroke="#4E5968" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<circle cx="' + xs(bi) + '" cy="' + ys(DIST[bi]) + '" r="6" fill="#3182F6"/>';
    s += '<text class="band-me" x="' + xs(bi) + '" y="' + (ys(DIST[bi]) - 11) + '" text-anchor="middle">나</text>';
    bands.forEach(function (b, i) { s += '<text class="band-label" x="' + xs(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + b + '</text>'; });
    return s + '</svg>';
  }
  function renderStrength(c) {
    var s = c.strength, bi = s.band_index, pct = (DIST[bi] / DIST.reduce(function (a, b) { return a + b; }, 0) * 100).toFixed(1);
    var chips = Object.keys(s.deuk).map(function (k) { return '<span class="deuk ' + (s.deuk[k] ? "on" : "") + '">' + (s.deuk[k] ? "●" : "○") + " " + k + '</span>'; }).join("");
    return '<div class="rcard"><h2>신강 / 신약 지수</h2><div class="deuk-row">' + chips + '</div>' +
      '<div class="str-msg"><b>' + s.band + '</b> 사주입니다. 이 유형은 약 <b>' + pct + '%</b>.</div>' + strengthGraph(bi) + '</div>';
  }
  function renderYongshin(c) {
    var y = c.yongshin;
    function it(t, e) { return '<div class="yong-item"><div class="yong-badge bg-' + e + ' el-' + e + '">' + e + '</div><div><div class="t">' + t + '</div><div class="v el-' + e + '">' + e + '</div></div></div>'; }
    return '<div class="rcard"><h2>용신 <span class="mut">用神</span></h2><div class="yong-list">' + it("조후용신", y.johu) + it("억부용신", y.eokbu) + '</div></div>';
  }

  // 대운/세운/월운 — 프리미엄 카드
  function luckCard(x, isNow, label, sub) {
    return '<div class="lc' + (isNow ? " lc-now" : "") + '">' +
      '<div class="lc-top">' + label + (sub ? '<span class="lc-sub">' + sub + '</span>' : '') + '</div>' +
      '<div class="lc-ten">' + x.stem_ten_star + '</div>' +
      '<div class="lc-cell bg-' + x.stem_elem + '"><span class="lc-ko el-' + x.stem_elem + '">' + x.ganji.charAt(0) + '</span><span class="lc-hj">' + x.ganji_hanja.charAt(0) + '</span></div>' +
      '<div class="lc-cell bg-' + x.branch_elem + '"><span class="lc-ko el-' + x.branch_elem + '">' + x.ganji.charAt(1) + '</span><span class="lc-hj">' + x.ganji_hanja.charAt(1) + '</span></div>' +
      '<div class="lc-bot"><span>' + x.branch_ten_star + '</span><span class="lc-life">' + x.twelve_life + '</span></div></div>';
  }
  function renderLuck(title, mut, list, labelFn, subFn, nowFn) {
    return '<div class="rcard"><div class="rc-head"><h2>' + title + ' <span class="mut">' + mut + '</span></h2>' +
      '<span class="rc-hint">좌우로 넘겨보세요</span></div><div class="luck-scroll">' +
      list.map(function (x) { return luckCard(x, nowFn ? nowFn(x) : false, labelFn(x), subFn ? subFn(x) : ""); }).join("") + '</div></div>';
  }

  // 신살·길성
  function renderGilsin(c) {
    var g = c.gilsin, order = ["hour", "day", "month", "year"], head = { hour: "생시", day: "생일", month: "생월", year: "생년" };
    if (!g.list.length) return "";
    var chips = g.list.map(function (n) { return '<span class="sin-chip">' + n + '</span>'; }).join("");
    var rows = '<div class="sin-grid"><div class="sin-h"></div>' + order.map(function (k) { return '<div class="sin-h">' + head[k] + '</div>'; }).join("") +
      '<div class="sin-rl">간지</div>' + order.map(function (k) { return '<div class="sin-gz el-' + c.chart[k].stem.elem + '">' + c.pillars[({ hour: "시주", day: "일주", month: "월주", year: "년주" })[k]] + '</div>'; }).join("") +
      '<div class="sin-rl">신살</div>' + order.map(function (k) { var t = (g.byPillar[k] || []); return '<div class="sin-tags">' + (t.length ? t.map(function (x) { return '<span>' + x + '</span>'; }).join("") : '<span class="none">-</span>') + '</div>'; }).join("") + '</div>';
    return '<div class="rcard"><h2>신살 · 길성 <span class="mut">神殺</span></h2><div class="sin-chips">' + chips + '</div>' + rows + '</div>';
  }

  // 사주풀이 (궁성 + 합충형파)
  function renderRelations(c) {
    var p = c.palaces;
    var palTbl = '<div class="pal-grid"><div class="pal-h"></div>' + p.map(function (x) { return '<div class="pal-h">' + x.label + '</div>'; }).join("") +
      '<div class="pal-rl">천간</div>' + p.map(function (x) { return '<div class="pal-c"><b>' + x.g + '</b><span>' + x.cheon + '</span></div>'; }).join("") +
      '<div class="pal-rl">지지</div>' + p.map(function (x) { return '<div class="pal-c"><b>' + x.z + '</b><span>' + x.ji + '</span></div>'; }).join("") + '</div>';
    var r = c.relations, groups = [["천간합", r.천간합], ["지지육합", r.지지육합], ["지지삼합", r.지지삼합], ["지지방합", r.지지방합],
      ["천간충", r.천간충], ["지지충", r.지지충], ["형", r.형], ["파", r.파], ["해", r.해], ["원진", r.원진], ["공망", r.공망]];
    var rel = groups.filter(function (grp) { return grp[1] && grp[1].length; }).map(function (grp) {
      var cls = /합/.test(grp[0]) ? "rel-good" : "rel-bad";
      return '<div class="rel-row"><span class="rel-k ' + cls + '">' + grp[0] + '</span><span class="rel-v">' + grp[1].join(" · ") + '</span></div>';
    }).join("");
    return '<div class="rcard"><h2>사주 풀이 <span class="mut">궁성 · 합충형파</span></h2>' + palTbl +
      '<div class="rel-list">' + (rel || '<div class="rel-row"><span class="rel-v">두드러진 합충이 없습니다.</span></div>') + '</div></div>';
  }

  // 일진 달력
  var iljinState = { y: 0, m: 0 };
  function iljinInner() {
    var ij = SajuEngine.iljinMonth(iljinState.y, iljinState.m), termBy = {};
    ij.terms.forEach(function (t) { termBy[t.day] = t; });
    var wd = ["일", "월", "화", "수", "목", "금", "토"];
    var h = '<div class="rc-head"><h2>일진 달력</h2><div class="ilj-nav"><button class="ilj-prev">‹</button><span class="ilj-title">' + ij.year + '.' + pad(ij.month) + '</span><button class="ilj-next">›</button></div></div>';
    h += '<div class="ilj-grid">';
    wd.forEach(function (w, i) { h += '<div class="ilj-wd ' + (i === 0 ? "sun" : i === 6 ? "sat" : "") + '">' + w + '</div>'; });
    for (var i = 0; i < ij.firstWeekday; i++) h += '<div class="ilj-cell empty"></div>';
    ij.days.forEach(function (d) {
      var w2 = (ij.firstWeekday + d.day - 1) % 7, term = termBy[d.day];
      h += '<div class="ilj-cell ' + (w2 === 0 ? "sun" : w2 === 6 ? "sat" : "") + (term ? " has-term" : "") + '">' +
        '<div class="ilj-d">' + d.day + '</div><div class="ilj-g el-' + d.stem_elem + '">' + d.ganji + '</div>' +
        (term ? '<div class="ilj-term">' + term.name + '</div>' : "") + '</div>';
    });
    return h + '</div>';
  }
  function renderIljin() { return '<div class="rcard" id="iljinCard">' + iljinInner() + '</div>'; }

  function renderResult(c) {
    var nowY = (new Date()).getFullYear(), now = new Date();
    iljinState = { y: now.getFullYear(), m: now.getMonth() + 1 };
    var html = renderProfile(c) + renderWonguk(c) + renderRelations(c) + renderGilsin(c) +
      renderAnalysis(c) + renderRelation(c) +
      '<div class="result-grid">' + renderStrength(c) + renderYongshin(c) + '</div>' +
      renderLuck("대운", "大運 · " + c.daeun.direction + " · 대운수 " + c.daeun.daeun_su.number, c.daeun.list.slice().reverse(),
        function (x) { return x.age + "세"; }, function (x) { return x.stem_ten_star; }) +
      renderLuck("연운", "歲運", c.seun.slice().reverse(), function (x) { return x.year; }, null, function (x) { return x.year === nowY; }) +
      renderLuck("월운", c._meta.solarY + "년", c.wolun, function (x) { return x.mlabel; }) +
      renderIljin();
    html += '<div class="rfoot">브라우저에서 즉시 계산 · 절기 로컬 천문계산 · 신강약/용신은 유파별 보정 대상</div>';
    $("result").innerHTML = html; window.scrollTo(0, 0);
  }
  // 일진 월 이동
  $("result").addEventListener("click", function (e) {
    var prev = e.target.closest(".ilj-prev"), next = e.target.closest(".ilj-next");
    if (!prev && !next) return;
    if (prev) { iljinState.m--; if (iljinState.m < 1) { iljinState.m = 12; iljinState.y--; } }
    else { iljinState.m++; if (iljinState.m > 12) { iljinState.m = 1; iljinState.y++; } }
    var el = $("iljinCard"); if (el) el.innerHTML = iljinInner();
  });

  // ── 화면/저장 ──
  function showScreen(w) { $("inputScreen").classList.toggle("hidden", w !== "input"); $("resultScreen").classList.toggle("hidden", w !== "result"); window.scrollTo(0, 0); }
  $("backBtn").addEventListener("click", function () { showScreen("input"); });
  function currentForm() { return { name: $("name").value, gender: gender, calendar: $("calendar").value,
    birthday: $("birthday").value, birthtime: $("birthtime").value, hmUnsure: $("hmUnsure").checked, lateZi: $("lateZi").checked, city: $("city").value }; }
  $("saveBtn").addEventListener("click", function () {
    if (!lastChart) return;
    var saved = JSON.parse(localStorage.getItem("saju_saved") || "[]");
    saved.unshift({ name: lastChart._meta.name, form: currentForm() });
    localStorage.setItem("saju_saved", JSON.stringify(saved.slice(0, 20))); toast("저장했어요");
  });
  function doLoad() {
    var saved = JSON.parse(localStorage.getItem("saju_saved") || "[]");
    if (!saved.length) { toast("저장된 만세력이 없어요"); return; }
    var s = saved[0], f = s.form;
    $("name").value = f.name; $("calendar").value = f.calendar; $("birthday").value = f.birthday; $("birthtime").value = f.birthtime;
    $("hmUnsure").checked = f.hmUnsure; $("lateZi").checked = f.lateZi; $("city").value = f.city; gender = f.gender;
    document.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.toggle("on", b.dataset.g === gender); });
    renderCityHint(); validate(); showScreen("input"); toast("‘" + s.name + "’ 불러옴"); $("go").click();
  }
  $("loadBtn").addEventListener("click", doLoad);
  var lb2 = $("loadBtn2"); if (lb2) lb2.addEventListener("click", doLoad);
  var gb = $("ganjiBtn"); if (gb) gb.addEventListener("click", function () { toast("자 23~01 · 축 01~03 · 인 03~05 · 묘 05~07 · 진 07~09 · 사 09~11 · 오 11~13 · 미 13~15 · 신 15~17 · 유 17~19 · 술 19~21 · 해 21~23"); });

  var toastTimer;
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200); }

  validate();
})();
