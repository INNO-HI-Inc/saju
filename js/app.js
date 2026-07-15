/* 만세력 UI — 포스텔러 스타일. 입력→계산→결과. 브라우저에서 완결. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var gender = "F", LUNAR = null;

  // 음력 변환표 로드(있으면 음력 입력 지원)
  fetch("js/lunar-table.json").then(function (r) { return r.json(); })
    .then(function (j) { LUNAR = j; }).catch(function () { LUNAR = null; });

  // 주요 도시 경도(진태양시 보정용)
  var CITY = { "서울": 126.98, "서울특별시": 126.98, "부산": 129.08, "대구": 128.60,
    "인천": 126.71, "광주": 126.85, "대전": 127.38, "울산": 129.31, "세종": 127.29,
    "수원": 127.03, "제주": 126.53, "춘천": 127.73, "강릉": 128.90, "전주": 127.15,
    "청주": 127.49, "포항": 129.34, "창원": 128.68, "천안": 127.11, "안동": 128.73,
    "목포": 126.39, "여수": 127.66, "경주": 129.22, "평양": 125.75, "도쿄": 139.69,
    "베이징": 116.40, "뉴욕": -74.00, "로스앤젤레스": -118.24 };

  // ── 입력 마스킹 ──
  function maskDate(v) {
    v = v.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) return v.slice(0, 4) + "/" + v.slice(4, 6) + "/" + v.slice(6);
    if (v.length >= 3) return v.slice(0, 4) + "/" + v.slice(4);
    return v;
  }
  function maskTime(v) {
    v = v.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + ":" + v.slice(2);
    return v;
  }
  $("birthday").addEventListener("input", function (e) { e.target.value = maskDate(e.target.value); validate(); });
  $("birthtime").addEventListener("input", function (e) { e.target.value = maskTime(e.target.value); validate(); });
  $("name").addEventListener("input", validate);
  $("hmUnsure").addEventListener("change", function () {
    $("birthtime").disabled = this.checked;
    if (this.checked) $("birthtime").value = "";
    validate();
  });

  // 성별
  document.querySelectorAll(".seg-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); gender = b.dataset.g;
    });
  });

  // ── 음력→양력 ──
  function addDays(ymd, n) {
    var dt = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2]));
    dt.setUTCDate(dt.getUTCDate() + n);
    return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  }
  function lunarToSolar(y, m, d, isLeap) {
    if (!LUNAR || !LUNAR[y]) return null;
    var t = LUNAR[y], ny = t.ny.split("-").map(Number), L = t.leap, md = t.md, off = 0;
    var order = [];
    for (var x = 1; x <= 12; x++) { order.push([x, false]); if (L === x) order.push([x, true]); }
    for (var i = 0; i < order.length && i < md.length; i++) {
      if (order[i][0] === m && order[i][1] === isLeap) return addDays(ny, off + d - 1);
      off += md[i];
    }
    return null;
  }

  // ── 진태양시 보정 ──
  function applySolarTime(y, mo, d, h, mi, city) {
    var lon = CITY[(city || "").trim()];
    if (lon == null) return { arr: [y, mo, d, h, mi], off: null };
    var off = Math.round((lon - 135) * 4); // 분
    var dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
    dt.setUTCMinutes(dt.getUTCMinutes() + off);
    return { arr: [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes()], off: off };
  }

  // ── 검증 ──
  function parseInputs() {
    var bd = $("birthday").value.replace(/\D/g, "");
    var bt = $("birthtime").value.replace(/\D/g, "");
    var unsure = $("hmUnsure").checked;
    if (bd.length !== 8) return null;
    var y = +bd.slice(0, 4), mo = +bd.slice(4, 6), d = +bd.slice(6, 8);
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1901 || y > 2099) return null;
    var h = 12, mi = 0;
    if (!unsure) { if (bt.length !== 4) return null; h = +bt.slice(0, 2); mi = +bt.slice(2); if (h > 23 || mi > 59) return null; }
    return { y: y, mo: mo, d: d, h: h, mi: mi, unsure: unsure };
  }
  function validate() {
    $("go").disabled = !parseInputs();
  }

  // ── 계산 실행 ──
  $("go").addEventListener("click", function () {
    var p = parseInputs(); if (!p) return;
    var cal = $("calendar").value, y = p.y, mo = p.mo, d = p.d;
    if (cal === "L" || cal === "LL") {
      var sol = lunarToSolar(y, mo, d, cal === "LL");
      if (!sol) { toast("해당 음력 날짜를 찾을 수 없어요"); return; }
      y = sol[0]; mo = sol[1]; d = sol[2];
    }
    var sc = applySolarTime(y, mo, d, p.h, p.mi, $("city").value);
    var a = sc.arr;
    var chart;
    try { chart = SajuEngine.buildChart(a[0], a[1], a[2], a[3], a[4], gender, $("lateZi").checked); }
    catch (e) { toast("계산 오류: " + e.message); return; }
    chart._meta = { name: $("name").value || "이름 없음", cal: cal, solarOff: sc.off,
      inputSolar: y + "-" + pad(mo) + "-" + pad(d), city: $("city").value };
    lastChart = chart;
    renderResult(chart);
    showScreen("result");
  });

  // ── 결과 렌더 ──
  var lastChart = null;
  function bigCell(o) {
    return '<div class="wg-cell bg-' + o.elem + '"><div class="wg-big el-' + o.elem + '">' +
      o.ko + '<span class="hj">' + o.hanja + '</span></div><div class="wg-sub el-' + o.elem + '">' +
      o.sign + o.elem + '</div></div>';
  }
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
  var DIST = [5, 16, 19.5, 10, 25, 13, 5, 1.5];
  function strengthGraph(bi) {
    var W = 460, H = 176, pad = 26, n = DIST.length, max = Math.max.apply(null, DIST), bands = SajuEngine.BANDS;
    var xs = function (i) { return pad + (W - 2 * pad) * i / (n - 1); }, ys = function (v) { return H - 34 - (H - 58) * v / max; };
    var pts = DIST.map(function (v, i) { return xs(i) + "," + ys(v); }).join(" ");
    var s = '<svg class="str-graph" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    DIST.forEach(function (v, i) { s += '<rect x="' + (xs(i) - 19) + '" y="22" width="38" height="' + (H - 56) + '" rx="6" fill="#f4f2ee"/>'; });
    s += '<polyline points="' + pts + '" fill="none" stroke="#33302b" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<circle cx="' + xs(bi) + '" cy="' + ys(DIST[bi]) + '" r="6" fill="#1c1a17"/>';
    s += '<text class="band-me" x="' + xs(bi) + '" y="' + (ys(DIST[bi]) - 11) + '" text-anchor="middle">나</text>';
    bands.forEach(function (b, i) { s += '<text class="band-label" x="' + xs(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + b + '</text>'; });
    return s + '</svg>';
  }
  function renderStrength(c) {
    var s = c.strength, bi = s.band_index, pct = (DIST[bi] / DIST.reduce(function (a, b) { return a + b; }, 0) * 100).toFixed(2);
    var chips = Object.keys(s.deuk).map(function (k) { return '<span class="deuk ' + (s.deuk[k] ? "on" : "") + '">' + (s.deuk[k] ? "●" : "○") + " " + k + '</span>'; }).join("");
    var el = c.elements.count, bars = SajuEngine.ELEMENTS.map(function (e) { return '<div class="eb bg-' + e + ' el-' + e + '">' + e + " " + Math.round(el[e]) + '</div>'; }).join("");
    return '<div class="rcard"><h2>신강 / 신약 지수</h2><div class="deuk-row">' + chips + '</div>' +
      '<div class="str-msg"><b>' + s.band + '</b> 사주입니다. 이 유형은 약 <b>' + pct + '%</b>.</div>' +
      strengthGraph(bi) + '<div class="elem-bars">' + bars + '</div></div>';
  }
  function renderYongshin(c) {
    var y = c.yongshin;
    function it(t, e) { return '<div class="yong-item"><div class="yong-badge bg-' + e + ' el-' + e + '">' + e + '</div><div><div class="t">' + t + '</div><div class="v el-' + e + '">' + e + '</div></div></div>'; }
    return '<div class="rcard"><h2>용신 <span class="mut">用神</span></h2><div class="yong-list">' + it("조후용신", y.johu) + it("억부용신", y.eokbu) + '</div></div>';
  }
  function luckCard(x, isNow) {
    return '<div class="luck-card ' + (isNow ? "luck-now" : "") + '"><div class="luck-age">' + (x.age != null ? x.age + "세" : x.year) + '</div>' +
      '<div class="luck-ten">' + x.stem_ten_star + '</div><div class="luck-box">' +
      '<div class="luck-h bg-' + x.stem_elem + ' el-' + x.stem_elem + '">' + x.ganji.charAt(0) + '<span class="hj">' + x.ganji_hanja.charAt(0) + '</span></div>' +
      '<div class="luck-b bg-' + x.branch_elem + ' el-' + x.branch_elem + '">' + x.ganji.charAt(1) + '<span class="hj">' + x.ganji_hanja.charAt(1) + '</span></div></div>' +
      '<div class="luck-meta">' + x.branch_ten_star + '<br>' + x.twelve_life + '</div></div>';
  }
  function renderDaeun(c) {
    var d = c.daeun, list = d.list.slice().reverse();
    return '<div class="rcard"><h2>대운 <span class="mut">大運 · ' + d.direction + ' · 대운수 ' + d.daeun_su.number + '</span></h2><div class="luck-scroll">' +
      list.map(function (x) { return luckCard(x, false); }).join("") + '</div></div>';
  }
  function renderSeun(c) {
    var nowY = (new Date()).getFullYear(), list = c.seun.slice().reverse();
    return '<div class="rcard"><h2>세운 <span class="mut">歲運 · 연운</span></h2><div class="luck-scroll">' +
      list.map(function (x) { return luckCard(x, x.year === nowY); }).join("") + '</div></div>';
  }
  function renderResult(c) {
    var dm = c.day_master, p = c.pillars, m = c._meta;
    var offTxt = m.solarOff != null ? " · 진태양시 " + (m.solarOff >= 0 ? "+" : "") + m.solarOff + "분" : "";
    var html = '<div class="summary"><span class="dm el-' + dm.elem + '">' + m.name + ' · 일간 ' + dm.ko + dm.hanja + ' (' + dm.sign + dm.elem + ')</span>' +
      '<span class="palja">' + p["년주"] + " · " + p["월주"] + " · " + p["일주"] + " · " + p["시주"] +
      "　|　" + (m.cal === "S" ? "양력" : "음력") + " " + m.inputSolar + offTxt + '</span></div>';
    html += renderWonguk(c)
      + '<div class="result-grid">' + renderStrength(c) + renderYongshin(c) + '</div>'
      + renderDaeun(c) + renderSeun(c);
    html += '<div class="rfoot">브라우저에서 즉시 계산 · 절기 천문계산 · 신강약/용신은 유파별 보정 가능</div>';
    $("result").innerHTML = html;
    $("result").scrollTop = 0;
  }

  // ── 화면/저장 ──
  function showScreen(which) {
    $("inputScreen").classList.toggle("hidden", which !== "input");
    $("resultScreen").classList.toggle("hidden", which !== "result");
    window.scrollTo(0, 0);
  }
  $("backBtn").addEventListener("click", function () { showScreen("input"); });
  $("saveBtn").addEventListener("click", function () {
    if (!lastChart) return;
    var saved = JSON.parse(localStorage.getItem("saju_saved") || "[]");
    saved.unshift({ name: lastChart._meta.name, form: currentForm(), ts: Date.now() });
    localStorage.setItem("saju_saved", JSON.stringify(saved.slice(0, 20)));
    toast("저장했어요");
  });
  function currentForm() {
    return { name: $("name").value, gender: gender, calendar: $("calendar").value,
      birthday: $("birthday").value, birthtime: $("birthtime").value,
      hmUnsure: $("hmUnsure").checked, lateZi: $("lateZi").checked, city: $("city").value };
  }
  $("loadBtn").addEventListener("click", function () {
    var saved = JSON.parse(localStorage.getItem("saju_saved") || "[]");
    if (!saved.length) { toast("저장된 만세력이 없어요"); return; }
    var s = saved[0], f = s.form;
    $("name").value = f.name; $("calendar").value = f.calendar;
    $("birthday").value = f.birthday; $("birthtime").value = f.birthtime;
    $("hmUnsure").checked = f.hmUnsure; $("lateZi").checked = f.lateZi; $("city").value = f.city;
    gender = f.gender;
    document.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.toggle("on", b.dataset.g === gender); });
    validate(); toast("‘" + s.name + "’ 불러옴");
    $("go").click();
  });

  // 네비 저장버튼 = 불러오기, 12간지 시간표 안내
  var lb2 = $("loadBtn2"); if (lb2) lb2.addEventListener("click", function () { $("loadBtn").click(); });
  var gb = $("ganjiBtn"); if (gb) gb.addEventListener("click", function () {
    toast("자 23~01 · 축 01~03 · 인 03~05 · 묘 05~07 · 진 07~09 · 사 09~11 · 오 11~13 · 미 13~15 · 신 15~17 · 유 17~19 · 술 19~21 · 해 21~23");
  });

  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // 기본값(레퍼런스 사주) — 바로 체험되게
  $("birthday").value = "1998/06/08"; $("birthtime").value = "10:00";
  validate();
})();
