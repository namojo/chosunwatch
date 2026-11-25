---
name: pages-deploy
description: 조선워치를 GitHub Pages(namojo.github.io/chosunwatch)로 내보내는 절차 — 릴리스 빌드, README·스크린샷 갱신, 라이선스 고지 점검, gh-pages 브랜치 구성과 푸시, 배포 확인. "배포/게시/Pages/릴리스/올려줘" 요청과 QA 통과 후 마지막 단계에서 사용.
---

# GitHub Pages 배포

게임은 `index.html` 하나로 완결된다(빌드 산출물이 저장소 루트에 커밋됨). Pages는 정적 파일만 서빙하면 되고 빌드 단계가 필요 없다.

## 배포 전 관문

1. `playtest-qa` 보고서에 S1·S2 결함 0.
2. `python3 tools/build.py` 직후의 `index.html`이 커밋되어 있다(`git status` 깨끗).
3. 고지: `LICENSE`(원작 MIT, kevintngo 저작권 줄 유지 + 리노베이션 저작권 줄 추가), `vendor/LICENSE-three.txt`, `vendor/LICENSE-unifont.txt`.
4. `README.md`가 한국어로 조선워치를 설명하고, 첫머리에 원작 출처(Cinderwatch by kevintngo, MIT)를 밝힌다. 플레이 링크는 `https://namojo.github.io/chosunwatch/`.
5. `media/` 스크린샷은 **리노베이션된 화면**으로 새로 찍는다(원작 이미지·영상은 가져오지 않는다).
   ```bash
   node tools/cdp.js "seed=4&biome=jinju&ff=90" 1440,900 wait:6000 shot:hero
   # tools/shots/hero.png → media/screenshot.jpg (ffmpeg -i ... -q:v 3)
   ```
6. `.nojekyll`이 루트에 있다(밑줄로 시작하는 경로·처리 지연 방지).

## 브랜치 전략

| 브랜치 | 용도 |
|---|---|
| 개발 브랜치(세션이 지정한 브랜치) | 소스 + 하네스 + 빌드 산출물. 모든 커밋은 여기에. |
| `gh-pages` | **서빙 전용.** `index.html`, `.nojekyll`, `media/`, `LICENSE`, `vendor/LICENSE-*.txt`만 담은 뿌리 없는(orphan) 브랜치. |

`gh-pages`라는 이름의 브랜치를 처음 푸시하면 GitHub가 저장소의 Pages를 그 브랜치 기준으로 자동 활성화한다(공개 저장소). 설정 화면을 열 필요가 없는 유일한 경로라 이 방식을 쓴다.

```bash
# 개발 브랜치에서, 작업 트리가 깨끗한 상태로
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git worktree add --detach "$TMP" HEAD
(
  cd "$TMP"
  git checkout -q --orphan gh-pages
  git rm -rf -q .
  git checkout "$SRC" -- index.html .nojekyll LICENSE media vendor/LICENSE-three.txt vendor/LICENSE-unifont.txt
  git add -A && git commit -q -m "Deploy $SRC"
  git push -u origin gh-pages   # 재배포는 --force-with-lease (서빙 전용 브랜치라 이력이 필요 없다)
)
git worktree remove --force "$TMP"
```

### 재배포 (gh-pages가 이미 있을 때)

이력을 지우지 않고 기존 `gh-pages` 위에 새 커밋을 얹는다(강제 푸시 불필요).

```bash
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git fetch -q origin gh-pages
git worktree add -q --detach "$TMP" FETCH_HEAD
(
  cd "$TMP"
  git checkout -q -B gh-pages
  git checkout "$SRC" -- index.html .nojekyll LICENSE media vendor/LICENSE-three.txt vendor/LICENSE-unifont.txt
  git add -A && git commit -q -m "Deploy $SRC" && git push origin gh-pages
)
git worktree remove --force "$TMP"
```

반영 확인은 상태 코드가 아니라 **내용 비교**로 한다(이전 버전도 200을 돌려준다):

```bash
git show HEAD:index.html | md5sum
curl -sS "https://namojo.github.io/chosunwatch/?v=$RANDOM" | md5sum   # 같아질 때까지 30초 간격, 최대 8회
```

## 푸시가 거부될 때

세션에 따라 지정 브랜치 외 푸시가 막혀 있을 수 있다. **우회하지 않는다.** 대신:

1. 개발 브랜치는 정상 푸시해 둔다(루트에 `index.html`이 있으므로 그 브랜치 자체가 배포 가능한 상태다).
2. 사용자에게 한 가지만 요청한다: 저장소 **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: (개발 브랜치 또는 main) / (root)**.
3. 사용자가 `main`을 원하면 PR을 만들지 물어본다(명시적 요청 없이는 PR을 만들지 않는다).

## 배포 확인

Pages 첫 빌드는 1~3분 걸린다. 폴링 루프 대신 60~90초 간격으로 최대 5회만 확인한다.

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://namojo.github.io/chosunwatch/
curl -sS https://namojo.github.io/chosunwatch/ | grep -c "조선워치"
```
200과 제목 문자열이 확인되면, 배포된 URL을 헤드리스로 한 번 띄워 최종 스크린샷을 찍는다:
```bash
PAGE="https://namojo.github.io/chosunwatch/#seed=4&ff=20" node tools/cdp.js "" 1280,800 wait:8000 shot:live
```
(프록시 환경에서 헤드리스 브라우저가 외부에 못 나가면 curl 확인으로 갈음하고 그 사실을 보고한다.)

404가 계속되면: 저장소가 비공개인지(무료 플랜은 공개 저장소만 Pages 가능), Pages가 꺼져 있는지 사용자에게 알리고 위 "Settings → Pages" 안내를 준다.
