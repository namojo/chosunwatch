---
name: playtest-qa
description: 조선워치를 헤드리스 Chromium으로 실제 실행해 검증하는 절차 — 빌드, 다섯 전장 스모크 테스트, 스크린샷 눈검사, 한글 깨짐 검사, 수동 조작·모바일 시나리오, 회귀 판정과 결함 보고 형식. 변경을 합친 뒤, 배포 전, "테스트/검증/QA/플레이 확인/스크린샷" 요청 시 사용.
---

# 조선워치 플레이테스트 QA

이 게임에는 단위 테스트가 없다. **실제로 띄워서 보는 것**이 유일한 검증이다. 코드가 그럴듯해 보여도 스크린샷을 열어 보지 않았다면 검증한 것이 아니다.

## 도구

```bash
python3 tools/build.py
node tools/cdp.js "<URL 해시>" <가로,세로> <스텝...>
```
스텝: `wait:ms`, `shot:이름`(→ `tools/shots/이름.png`), `eval:"JS"`, `click:x,y`, `move:x,y`, `key:K`, 모바일(`MOBILE=1 DPR=2`)에서 `tap:x,y`, `drag:`, `pinch:`, `rotate:w,h`.
출력의 `[EXCEPTION]`, `[console.error]`가 결함 신호다. `GPU stall`은 무시.

## 1단계 — 스모크 (다섯 전장 전부)

```bash
for b in salsu ansi gwiju jinju haengju; do
  node tools/cdp.js "seed=4&biome=$b&ff=45" 1280,800 wait:6000 shot:smoke-$b \
    eval:"JSON.stringify({bio:__cw.G.B.bio.name,lives:__cw.G.lives,k:__cw.G.k,mons:__cw.G.mons.length,towers:__cw.G.towers.length,phase:__cw.G.phase})" 2>&1 | grep -v "GPU stall"
done
```
합격: 예외 0, `towers ≥ 3`, `phase`가 `play`, `lives > 0`.

## 2단계 — 긴 진행 (적장·전장 전환)

```bash
node tools/cdp.js "seed=4&ff=240" 1280,800 wait:9000 shot:long \
  eval:"JSON.stringify({level:__cw.G.level,bio:__cw.G.B.bio.name,k:__cw.G.k,lives:__cw.G.lives,best:__cw.G.best})" 2>&1 | grep -v "GPU stall"
```
`ff`를 240, 480으로 늘려 AI 군사가 적장을 잡고 다음 전장으로 넘어가는지(`level ≥ 1`) 본다. 넘어가지 못하면 난이도가 깨졌거나(수치 변경 금지 위반) 타워가 발사를 못 하는 것이다. 무너짐(`crumble`)·솟아오름(`rise`) 중 스크린샷도 한 장.

## 3단계 — 눈검사 체크리스트

스크린샷을 `Read`로 열어 항목마다 통과/실패를 적는다.

| 영역 | 확인할 것 |
|---|---|
| 전장 | 다섯 전장이 서로 다른 장소로 보이는가. 용암·야자·해골 장식 같은 원작 판타지 잔재가 없는가. 성·봉수대·적 진문이 한국 성곽/군영으로 읽히는가. |
| 적군 | 쥐·거미·슬라임·해골이 남아 있지 않은가. 군대색(수 황토, 당 진홍, 몽골 청, 왜 흑적)이 전장과 맞는가. 기병·공성 수레가 뭉개지지 않는가. |
| 아군 | 타워 네 종류가 구분되는가. 시대 이름이 전장과 맞는가(살수에서 "총통"이 나오면 결함). |
| 글자 | 한글이 깨진 글리프(□, ?) 없이 나오는가. 판 밖으로 넘치거나 겹치지 않는가. 영어 문장이 남아 있지 않은가. |
| 빛 | 원작의 밤·불빛 분위기가 유지되는가. 너무 어둡거나 하얗게 날아가지 않는가. |

적을 가까이서 보는 법은 `cinder-engine-guide`의 "특정 적을 가까이서" 예시를 쓴다. 타입 전부를 군대 넷에 대해 한 번씩 찍는다.

## 4단계 — 조작과 모바일

```bash
# 터를 눌러 직접 지휘 → 건설 메뉴
node tools/cdp.js "seed=4&ff=5" 1280,800 wait:2000 \
  clickat:"(()=>{const p=__cw.G.B.pads.find(p=>!p.tower),v=__cw.UI.project?__cw.UI.project(p.x,p.y,p.z):null;return v?v.join(','):'640,400'})()" \
  wait:600 shot:menu
MOBILE=1 DPR=2 node tools/cdp.js "seed=4&ff=20" 390,844 wait:3000 shot:phone rotate:844,390 wait:800 shot:phone-wide
```
`UI.project`가 없으면 화면 좌표를 스크린샷에서 읽어 `click:x,y`로 누른다. 확인: 메뉴 한글, 버튼 터치 크기, 세로/가로 레이아웃.

## 5단계 — 무결성

- `grep -c "http" index.html`로 새 네트워크 요청이 생기지 않았는지(three.js 주석의 URL 제외) 확인. `fetch(`, `new Image`, `@font-face url(`, `<link rel="stylesheet"` 금지.
- `index.html` 크기 2MB 이하.
- `git status`에 `tools/shots/` 같은 산출물이 섞이지 않았는지.
- `LICENSE`에 원작자 표기와 `vendor/LICENSE-three.txt`가 남아 있는지.

## 결함 보고 형식

`_workspace/qa/report.md`에 누적한다. 고칠 사람이 재현할 수 있어야 한다.

```markdown
### [심각도 S1/S2/S3] 한 줄 제목
- 담당: army-modeler (파일: src/61-monsters.js)
- 재현: node tools/cdp.js "seed=4&biome=gwiju&ff=60" ...
- 관찰: 무엇이 보였나 (스크린샷 경로)
- 기대: 설계서 §몇의 무엇
```
S1 = 예외·진행 불가·글자 전면 깨짐, S2 = 테마 위반·눈에 띄는 시각 결함, S3 = 다듬기. **S1·S2가 0이 되어야 배포한다.** 같은 결함을 두 번 고쳐도 남으면 범위를 줄이는 대안(이름·색만 적용 등)을 제안한다.
