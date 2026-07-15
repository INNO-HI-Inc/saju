# khwee2000.github.io 배포 가이드

이 `web/` 폴더는 **서버 없이 브라우저에서 동작하는 정적 사이트**입니다.
(index.html + css/ + js/ 만으로 완결. 만세력 계산이 방문자 브라우저에서 실행됨)

## 배포 방법 (khwee2000 계정으로 push)

현재 이 PC의 gh는 `INNO-HI-Inc` 계정이라 khwee2000 레포에 쓰기 권한이 없습니다.
아래는 **khwee2000 본인 계정으로** 실행하세요.

### 방법 A — 서브경로로 (추천, 기존 사이트 안 건드림)
결과 주소: **https://khwee2000.github.io/saju/**

```bash
git clone https://github.com/khwee2000/khwee2000.github.io.git
cd khwee2000.github.io
mkdir -p saju
cp -r /Users/flareon078/saju-engine/web/* saju/
git add saju
git commit -m "add 만세력 사주 계산기"
git push
```
→ 1~2분 뒤 https://khwee2000.github.io/saju/ 에서 확인.

### 방법 B — 메인 페이지로 (기존 beautiful-jekyll 사이트 대체)
결과 주소: **https://khwee2000.github.io/**

```bash
git clone https://github.com/khwee2000/khwee2000.github.io.git
cd khwee2000.github.io
# 기존 파일 정리(원하면 백업 브랜치 먼저: git branch backup)
git rm -rf . >/dev/null 2>&1
cp -r /Users/flareon078/saju-engine/web/* .
touch .nojekyll          # Jekyll 처리 끄기(정적 그대로 서빙)
git add -A
git commit -m "만세력 사주 계산기로 사이트 교체"
git push
```

## push 인증 팁
- HTTPS push 시 비밀번호 대신 **Personal Access Token**을 입력해야 합니다.
  (github.com → Settings → Developer settings → Tokens → repo 권한)
- 또는 `gh auth login`으로 khwee2000 계정 로그인 후 `gh repo clone`.

## 구조
```
web/
  index.html          진입점
  css/style.css       디자인(오행 색·원국표·신강약 곡선·대운/세운)
  js/saju-engine.js   만세력 엔진(브라우저 계산, 서버 불필요)
  js/app.js           UI 렌더링
```

## 참고
- 절기는 브라우저 내 천문계산(전 연도). 외부 API 호출 없음 → 오프라인·무료·무제한.
- 신강약 밴드/인구분포%/용신은 유파·통계별 보정 대상(README 참고).
