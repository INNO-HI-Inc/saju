# 인수인계 문서 (HANDOVER)

> 이 프로젝트를 처음 넘겨받는 사람이 **가장 먼저** 읽는 문서.
> 전체 설명은 [README.md](README.md), 엔진 상세는 [engine/README.md](engine/README.md).

---

## 1. 한 줄 요약

생년월일시 → 사주 만세력을 **결정론적으로 계산**해 보여주는 웹앱.
계산 엔진은 **JS(라이브)와 Python(검증용)** 두 벌로 같은 로직을 구현. 서버 없음.

- **라이브 URL** : https://inno-hi-inc.github.io/saju/
- **저장소** : `INNO-HI-Inc/saju` (GitHub) — `main` 브랜치 루트를 GitHub Pages가 서빙
- **성격** : 정적 사이트(빌드 단계 없음). `index.html`을 브라우저가 열면 그 자리에서 전부 계산.

---

## 2. 계정 / 접근 권한

| 항목 | 값 |
|---|---|
| GitHub 저장소 | `INNO-HI-Inc/saju` (조직 계정) |
| 이 PC의 `gh` 로그인 | `INNO-HI-Inc` (push 권한 있음) |
| 커밋 author | `INNO-HI-Inc <dev@inno-hi.com>` |
| Pages 설정 | Settings → Pages → Source: `main` 브랜치 `/ (root)` |

> **넘겨받는 사람은** `INNO-HI-Inc` 조직에 대한 write 권한이 필요하다.
> 조직 접근이 없다면 저장소를 fork 하거나 새 계정/조직으로 옮기고 Pages를 다시 켜면 된다.
> (과거 `khwee2000.github.io`로 배포하려다 권한 문제로 `INNO-HI-Inc/saju`로 확정한 이력 있음.)

---

## 3. 배포 방법 (업데이트 반영)

빌드가 없다. **소스 그대로 push하면 1~2분 뒤 라이브 반영.**

```bash
cd saju
# ... js/css/html 또는 engine/ 수정 ...
git add -A
git commit -m "무엇을 바꿨는지"
git push
# → 1~2분 뒤 https://inno-hi-inc.github.io/saju/ 에 반영. Cmd+Shift+R 로 강력새로고침
```

자세한 건 [DEPLOY.md](DEPLOY.md).

---

## 4. ⚠️ 반드시 알아야 할 함정 3가지

### (1) 엔진이 두 벌이다 — 한쪽만 고치면 값이 갈라진다
`js/saju-engine.js`(라이브)와 `engine/saju/`(Python)는 **같은 로직의 두 구현**이다.
강약·용신 등 계수가 있는 함수를 고칠 땐 **두 파일을 반드시 같이** 고치고 교차검증할 것.
→ 규칙과 검증법은 README의 [엔진 동기화](README.md#-엔진-동기화-js--python) 섹션 참고.
(실제로 강약 공식을 JS만 고쳐 지수가 56↔51로 어긋난 사고가 있었고, 2026-07 동기화로 복구함.)

### (2) 외부 라이브러리를 CDN으로 불러온다 — 오프라인/차단 시 일부 기능 죽음
`index.html`이 CDN에서 로드하는 것:
- Pretendard(폰트), Tossface(이모지 폰트) — 없으면 폰트/띠 이모지만 깨짐(계산은 정상)
- `html-to-image` — 없으면 **"이미지 저장" 버튼만** 작동 안 함
> 계산 엔진 자체(`saju-engine.js`)는 CDN 의존이 전혀 없다. 완전 오프라인으로도 계산은 됨.
> 상용화 시 CDN 자산을 저장소에 로컬 번들로 내려받아 두는 걸 권장.

### (3) 절기 시각은 ~수 분 오차 (Meeus 저정밀 근사)
절기 **날짜(일)는 정확**하지만 절입 **시각**은 알려진 값 대비 수 분 오차가 있다.
생시가 절기 경계(예: 입춘 당일 새벽)에 걸치는 극소수 케이스에서 년주/월주가 갈릴 수 있음.
→ 초정밀이 필요하면 태양황경 함수만 VSOP87로 교체(구조는 그대로).

---

## 5. 지금 상태 / 검증

- ✅ 결정론 계산: 픽스처(1998-06-08) **31/31 통과**. JS·Python 값 일치(지수 51/중화신강).
- ✅ 라이브 배포·이미지 저장·저장/불러오기·음력입력·진태양시 보정 동작.
- ⚠️ **아직 없는 것**: 해석 LLM 레이어(성향/운세 서술), 인구분포 % 통계 DB.

### 검증 돌리는 법
```bash
cd engine && python3 tests/test_fixture_19980608.py      # 31/31 통과 확인
node -e 'console.log(require("./js/saju-engine.js").buildChart(1998,6,8,10,0,"F").strength.index)'  # 51 나와야 함
```

---

## 6. 앞으로 할 일 (로드맵)

우선순위 순.

1. **해석 LLM 레이어** — `buildChart()`의 JSON을 받아 성향/운세를 *서술만* 하는 계층.
   지금은 로컬, 나중에 클라우드 API. **엔진의 JSON 계약은 절대 안 바꿈** (설계 원칙).
2. **CDN 자산 로컬 번들화** — 폰트·이모지·html-to-image를 저장소에 내려받아 오프라인/차단 대비.
3. **인구분포 % 통계** — 레퍼런스 사이트의 "상위 26.31%" 같은 값은 자체 통계 DB가 있어야 재현됨.
4. **신강약/용신 유파 보정** — `CUTS`/`POSW`/조후표를 레퍼런스에 맞춰 정교화 (README 보정 포인트).
5. **(선택) 절기 초정밀** — VSOP87 태양황경으로 교체해 시각 오차 제거.

---

## 7. 코드 지도 (어디를 고칠 때 어디를 보나)

| 하고 싶은 것 | 볼 파일 |
|---|---|
| 4기둥(년월일시) 계산 로직 | `js/saju-engine.js` `computePillars` / `engine/saju/pillars.py` |
| 십성·지장간·12운성·12신살 | `js/saju-engine.js` 파생 함수들 / `engine/saju/derive.py` |
| 신강약·용신 (계수 튜닝) | `js/saju-engine.js` `strength`/`johu`/`eokbu` / `engine/saju/strength.py` |
| 대운·세운·월운 | `js/saju-engine.js` `daeunList`/`seunList`/`wolunList` / `engine/saju/luck.py` |
| 24절기 천문계산 | `js/saju-engine.js` `sunLon`/`findTermMs` / `engine/saju/solarterms.py` |
| 신살·길성·합충형파·궁성 | `js/saju-engine.js` `gilsinOf`/`relations`/`palaces` (JS 전용, 웹 표시용) |
| 화면 렌더링·UI·이미지저장 | `js/app.js` |
| 디자인(색·레이아웃) | `css/style.css` |
| 음↔양력 변환표 | `js/lunar-table.json` |

---

## 8. 로컬 작업본 주의

이 저장소의 원본 작업 폴더는 로컬에서 `~/saju-engine/`(부모)와 `~/saju-engine/web/`(git 저장소, 이 폴더) 구조였다.
과거 `~/saju-engine/saju/`(Python)가 git 밖에 따로 있었으나, **인수인계 시점에 `engine/`으로 저장소에 통합**했다.
→ **이 저장소가 유일한 정본.** 클론 받으면 웹앱·엔진·문서가 모두 들어있다.
