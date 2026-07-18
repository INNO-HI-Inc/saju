# 배포 가이드

이 저장소는 **서버 없이 브라우저에서 동작하는 정적 사이트**다.
빌드 단계가 없다 — 소스를 그대로 push하면 GitHub Pages가 서빙한다.

- **라이브** : https://inno-hi-inc.github.io/saju/
- **저장소** : `INNO-HI-Inc/saju`
- **Pages 소스** : `main` 브랜치 `/ (root)` (Settings → Pages)

---

## 현재(정본) 배포 — 업데이트 반영

이 PC의 `gh`는 이미 `INNO-HI-Inc`로 로그인돼 있어 바로 push하면 된다.

```bash
cd saju            # (로컬에선 ~/saju-engine/web)
git add -A
git commit -m "변경 내용"
git push
```
→ **1~2분 뒤** https://inno-hi-inc.github.io/saju/ 에 반영. 브라우저에서 `Cmd+Shift+R`(강력 새로고침).

`index.html`이 저장소 루트에 있어야 Pages 루트에서 서빙된다. (`engine/` 등 하위 폴더의 파일은
Pages가 무시하므로 같이 있어도 무방.)

---

## 다른 계정/조직으로 옮길 때

`INNO-HI-Inc` 접근이 없다면:

1. 저장소를 fork 하거나, 새 레포를 만들어 이 폴더 내용을 통째로 push.
2. 새 레포 Settings → Pages → Source를 `main` `/ (root)`로 지정.
3. 몇 분 뒤 `https://<계정>.github.io/<레포명>/` 에서 확인.

> HTTPS push는 비밀번호 대신 **Personal Access Token**(repo 권한) 또는 `gh auth login`이 필요하다.

---

## 배포되는 파일

| 파일/폴더 | Pages가 서빙? | 역할 |
|---|---|---|
| `index.html` | ✅ (루트 진입점) | 웹앱 |
| `css/`, `js/` | ✅ | 디자인·엔진·UI |
| `engine/` (Python) | ⛔ (무시됨) | 검증·백엔드용 소스 (저장소 보관만) |
| `*.md` | ⛔ | 문서 |

---

## 참고

- 절기는 브라우저 내 천문계산(전 연도). **외부 API 호출 없음** → 오프라인·무료·무제한.
- 폰트(Pretendard)·이모지(Tossface)·이미지저장(html-to-image)은 CDN 로드 →
  차단 환경이면 로컬 번들 권장([HANDOVER.md](HANDOVER.md) 함정 (2) 참고).
- 신강약 밴드/인구분포%/용신은 유파·통계별 보정 대상([README.md](README.md) 보정 포인트).
