/* 만세력 UI — 이미지 완전카피 렌더링 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var gender = "F";

  // 성별 토글
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); gender = b.dataset.g;
    });
  });
  $("go").addEventListener("click", render);

  // 신강약 대표 인구분포(레퍼런스 곡선 형태). %는 이 곡선에서 일관되게 산출.
  var DIST = [5, 16, 19.5, 10, 25, 13, 5, 1.5];

  function esc(s) { return String(s); }

  function bigCell(o) {
    // o: {ko,hanja,elem,sign}
    return '<div class="wg-cell bg-' + o.elem + '">' +
      '<div class="wg-big el-' + o.elem + '">' + o.ko + '<span class="hj">' + o.hanja + '</span></div>' +
      '<div class="wg-sub el-' + o.elem + '">' + o.sign + o.elem + '</div></div>';
  }

  function renderWonguk(c) {
    var order = ["hour", "day", "month", "year"];
    var head = { hour: "생시", day: "생일", month: "생월", year: "생년" };
    var ch = c.chart;
    var h = '<div class="card"><h2>사주 원국 <span class="mut">命式</span></h2><div class="wonguk-grid">';
    // header
    h += '<div class="wg-head"></div>';
    order.forEach(function (k) { h += '<div class="wg-head">' + head[k] + '</div>'; });
    // 천간
    h += '<div class="wg-rowlabel">천간</div>';
    order.forEach(function (k) { h += bigCell(ch[k].stem); });
    // 천간 십성
    h += '<div class="wg-rowlabel">십성</div>';
    order.forEach(function (k) { h += '<div class="wg-tenstar">' + ch[k].stem.ten_star + '</div>'; });
    // 지지
    h += '<div class="wg-rowlabel">지지</div>';
    order.forEach(function (k) { h += bigCell(ch[k].branch); });
    // 지지 십성
    h += '<div class="wg-rowlabel">십성</div>';
    order.forEach(function (k) { h += '<div class="wg-tenstar">' + ch[k].branch.ten_star + '</div>'; });
    // 지장간 / 12운성 / 12신살
    h += '<div class="wg-rowlabel">지장간</div>';
    order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].hidden_stems.str + '</div>'; });
    h += '<div class="wg-rowlabel">12운성</div>';
    order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].twelve_life + '</div>'; });
    h += '<div class="wg-rowlabel">12신살</div>';
    order.forEach(function (k) { h += '<div class="wg-plain">' + ch[k].twelve_sin + '</div>'; });
    h += '</div></div>';
    return h;
  }

  function strengthGraph(bandIdx) {
    var W = 460, H = 180, pad = 26, n = DIST.length;
    var max = Math.max.apply(null, DIST);
    var bands = SajuEngine.BANDS;
    var xs = function (i) { return pad + (W - 2 * pad) * i / (n - 1); };
    var ys = function (v) { return H - 34 - (H - 60) * v / max; };
    var pts = DIST.map(function (v, i) { return xs(i) + "," + ys(v); }).join(" ");
    var svg = '<svg class="str-graph" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    // 배경 바
    DIST.forEach(function (v, i) {
      svg += '<rect x="' + (xs(i) - 20) + '" y="24" width="40" height="' + (H - 58) + '" rx="6" fill="#f3f4f6"/>';
    });
    // 곡선
    svg += '<polyline points="' + pts + '" fill="none" stroke="#3a3f4b" stroke-width="2.5" stroke-linejoin="round"/>';
    // 마커
    svg += '<circle cx="' + xs(bandIdx) + '" cy="' + ys(DIST[bandIdx]) + '" r="6" fill="#20242c"/>';
    svg += '<text class="band-me" x="' + xs(bandIdx) + '" y="' + (ys(DIST[bandIdx]) - 12) + '" text-anchor="middle">나</text>';
    // x라벨
    bands.forEach(function (b, i) {
      svg += '<text class="band-label" x="' + xs(i) + '" y="' + (H - 8) + '" text-anchor="middle">' +
        b.replace("중화", "중화\n") + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function renderStrength(c) {
    var s = c.strength, bi = s.band_index;
    var pct = (DIST[bi] / DIST.reduce(function (a, b) { return a + b; }, 0) * 100).toFixed(2);
    var deuk = s.deuk;
    var chips = Object.keys(deuk).map(function (k) {
      return '<span class="deuk ' + (deuk[k] ? "on" : "") + '">' + (deuk[k] ? "●" : "○") + " " + k + '</span>';
    }).join("");
    var el = c.elements.count;
    var bars = SajuEngine.ELEMENTS.map(function (e) {
      return '<div class="eb bg-' + e + ' el-' + e + '">' + e + " " + Math.round(el[e]) + '</div>';
    }).join("");
    var h = '<div class="card"><h2>신강 / 신약 지수</h2>';
    h += '<div class="deuk-row">' + chips + '</div>';
    h += '<div class="str-msg"><b>' + s.band + '</b> 사주입니다. 이 유형은 약 <b>' + pct + '%</b>.</div>';
    h += strengthGraph(bi);
    h += '<div class="elem-bars">' + bars + '</div>';
    h += '</div>';
    return h;
  }

  function renderYongshin(c) {
    var y = c.yongshin;
    function item(t, e) {
      return '<div class="yong-item"><div class="yong-badge bg-' + e + ' el-' + e + '">' + e + '</div>' +
        '<div><div class="t">' + t + '</div><div class="v el-' + e + '">' + e + '</div></div></div>';
    }
    return '<div class="card"><h2>용신 <span class="mut">用神</span></h2><div class="yong-list">' +
      item("조후용신", y.johu) + item("억부용신", y.eokbu) + '</div></div>';
  }

  function luckCard(x, isNow) {
    return '<div class="luck-card ' + (isNow ? "luck-now" : "") + '">' +
      '<div class="luck-age">' + (x.age != null ? x.age + "세" : x.year) + '</div>' +
      '<div class="luck-ten">' + x.stem_ten_star + '</div>' +
      '<div class="luck-box">' +
      '<div class="luck-h bg-' + x.stem_elem + ' el-' + x.stem_elem + '">' + x.ganji.charAt(0) +
      '<span class="hj">' + x.ganji_hanja.charAt(0) + '</span></div>' +
      '<div class="luck-b bg-' + x.branch_elem + ' el-' + x.branch_elem + '">' + x.ganji.charAt(1) +
      '<span class="hj">' + x.ganji_hanja.charAt(1) + '</span></div></div>' +
      '<div class="luck-meta">' + x.branch_ten_star + '<br>' + x.twelve_life + '</div></div>';
  }

  function renderDaeun(c) {
    var d = c.daeun;
    var list = d.list.slice().reverse();  // 레퍼런스: 높은 나이 왼쪽
    var cards = list.map(function (x) { return luckCard(x, false); }).join("");
    return '<div class="card"><div class="luck-head"><h2>대운 <span class="mut">大運 · ' +
      d.direction + ' · 대운수 ' + d.daeun_su.number + '</span></h2></div>' +
      '<div class="luck-scroll">' + cards + '</div></div>';
  }

  function renderSeun(c) {
    var nowY = (new Date()).getFullYear();
    var list = c.seun.slice().reverse();  // 최신 연도 왼쪽
    var cards = list.map(function (x) { return luckCard(x, x.year === nowY); }).join("");
    return '<div class="card"><div class="luck-head"><h2>세운 <span class="mut">歲運 · 연운</span></h2></div>' +
      '<div class="luck-scroll">' + cards + '</div></div>';
  }

  function render() {
    var y = +$("y").value, mo = +$("mo").value, d = +$("d").value,
        h = +$("h").value, mi = +$("mi").value, lz = $("latezi").checked;
    var box = $("result");
    try {
      var c = SajuEngine.buildChart(y, mo, d, h, mi, gender, lz);
    } catch (e) { box.innerHTML = '<div class="card">입력 오류: ' + e.message + '</div>'; return; }
    var dm = c.day_master, p = c.pillars;
    var html = '<div class="summary">' +
      '<span class="dm el-' + dm.elem + '">일간 ' + dm.ko + dm.hanja + ' (' + dm.sign + dm.elem + ')</span>' +
      '<span class="palja">' + p["년주"] + " · " + p["월주"] + " · " + p["일주"] + " · " + p["시주"] + '</span>' +
      '<span class="src">브라우저 즉시계산 · 절기 천문계산</span></div>';
    html += renderWonguk(c);
    html += '<div class="grid2">' + renderStrength(c) + renderYongshin(c) + '</div>';
    html += renderDaeun(c);
    html += renderSeun(c);
    box.innerHTML = html;
  }

  render(); // 초기 렌더(기본값 = 레퍼런스 사주)
})();
