---
name: cinder-engine-guide
description: 조선워치(원작 Cinderwatch) 엔진의 구조와 작업 규칙 — src/*.js 모듈 지도, 절차적 모델링 API(Soup, PartBatch, rigHuman), 색·재질, 빌드·실행 방법, 파일 소유권. src/ 아래 코드를 읽거나 고치기 전, 새 모델·키트·프롭을 만들기 전, 빌드가 깨졌을 때 반드시 읽는다.
---

# Cinder 엔진 작업 가이드

three.js r170 위에 얹은 약 5,800줄의 단일 번들 게임이다. `tools/build.py`가 `src/*.js`를 **파일 이름 순서대로 이어 붙여 하나의 즉시 실행 함수** 안에 넣고 `index.html`로 내보낸다. 모듈 시스템이 없으므로 모든 최상위 선언은 한 스코프를 공유한다.

## 이 구조에서 나오는 규칙

- **이름 충돌 = 빌드 전체 실패.** 최상위 `const`/`function` 이름은 번들 전체에서 유일해야 한다. 새 헬퍼는 접두어를 붙인다(예: `hk_`=한옥, `ar_`=적군). 추가 전 `grep -n "이름" src/*.js`.
- **초기화 순서 = 파일 번호.** 최상위에서 바로 실행되는 코드는 앞 번호 파일의 것만 쓸 수 있다. 함수 본문 안에서는 순서 무관.
- **`</script` 문자열 금지**(빌드가 assert로 막는다).
- 원작은 한 줄이 매우 긴 압축된 스타일이다. 기존 줄을 고칠 때는 `Edit`으로 필요한 토막만 바꾸고, 새 코드는 읽기 쉬운 줄 길이로 써도 된다.

## 모듈 지도와 소유권

병렬 작업의 충돌을 막기 위해 **자기 파일만 고친다.** 남의 파일에 필요한 변경은 `_workspace/handoff/{from}-to-{to}.md`에 적는다.

| 파일 | 내용 | 소유 에이전트 |
|---|---|---|
| `00-util.js`, `10-gfx.js`, `20-post.js`, `40-fx.js` | 수학·난수, 질감·재질·`Soup`·`COL`, 렌더러·후처리, 조명·파티클 | **동결** (오케스트레이터만) |
| `05-lore.js` | 시대·군대 색, 이름 조회 헬퍼 | 오케스트레이터 / lore-historian |
| `29-biome.js`, `30-layout.js`, `31-terrain.js`, `32-props.js`, `33-flora.js`, `41-weather.js` | 전장 팔레트·조명·날씨, 길·지형, 성·진문·소품, 식생 | battlefield-artisan |
| `50-rig.js`, `51-bestiary.js`, `61-monsters.js`, `62-game.js` | 적 키트·리그, 적 정의·그리기, 웨이브 | army-modeler |
| `52-allies.js`, `60-towers.js` | 아군 병사 키트, 타워 정의·모델·발사체 | tower-architect |
| `70-pixelfont.js`, `72-ui.js`, `shell.html`, `tools/build.py`, `tools/hangul.py` | 글꼴, HUD·메뉴·입력, HTML 껍데기 | hud-calligrapher |
| `80-audio.js` | 합성 사운드·음악 | gugak-composer |
| `90-main.js` | 카메라·메인 루프·부팅 | 오케스트레이터 |

동결 파일의 것이 꼭 필요하면(새 색, 새 질감 레이어) 자기 파일 안에 지역 상수로 만든다: `const hk_red = C(0xa8281c);`.

## 절차적 모델링 API

### 색
`C(0xRRGGBB)` → 선형 RGB 배열. `mulC(c, k)`, `mixC(a, b, t)`. 기본 팔레트 `COL.stone/wood/iron/steel/clothR/clothB/thatch/slate/...` (`src/10-gfx.js` 끝). 전장마다 `applyBiomePalette`가 `COL`의 지형 색을 덮어쓴다.

시대·군대 색: `C(ERA[curEra()].main)`, `C(ARMY[curArmy()].sub)`.

### Soup — 정점 수프 빌더 (`src/10-gfx.js`)
모든 정적 모델은 `Soup` 인스턴스 `S`에 도형을 쌓아 만든다.

```js
S.box(w, h, d, x, y, z, col, o)        // 중심 (x,y,z)
S.cyl(r, h, x, y, z, col, { n: 8, rt: 1 /*윗면 반지름비*/, open, rz })
S.cone(r, h, x, y, z, col, { n: 6 })
S.ico(r, x, y, z, col, { d: 1, sc: [sx, sy, sz] })   // 각진 덩어리
S.sph(r, x, y, z, col, { w: 8, h: 6, smooth, sc })
S.seg(a, b, r0, r1, col, { n: 6 })      // 두 점을 잇는 가늘어지는 기둥 (32-props.js)
S.tri(a, b, c, col, layer, rough)  /  S.quad(a, b, c, d, col, layer, rough)
S.rock(r, x, y, z, col, o)              // 울퉁불퉁한 바위
S.add(gDome(8, 3) | gTorus(n, t, m) | gOct() ..., { s, p, r: [rx, ry, rz], c, l, rough })
```

공통 옵션 `o`: `l` 질감 레이어(`L_DIRT, L_ROCK, L_MASON, L_WOOD, L_COBBLE, L_METAL, L_SLATE, L_CLOTH, L_PLAIN, L_BONE, L_THATCH`), `rough`, `r: [rx, ry, rz]` 회전, `jit` 정점 흔들림(손맛), `emis` 자체 발광, `sway` 바람 흔들림.
천: `clothPanel(S, { x0, x1, yTop, len, z, col, rng, sway, nx, ny })` — 깃발·휘장·치마.

**스타일:** 저폴리, 각진 면, 살짝 흔들린 정점(`jit`), 64px 질감 레이어. 화면은 절반 해상도+디더+틸트시프트로 그려지므로 **실루엣과 색 대비**가 디테일보다 중요하다. 2~3픽셀짜리 장식은 보이지 않는다.

### PartBatch — 움직이는 것의 인스턴스 부품 (`src/50-rig.js`)
```js
const part = new PartBatch(S => { /* 도형 쌓기 */ }, capacity, { rad, shadow });
part.put(matrix4, flash, tint);   // 매 프레임 인스턴스 하나 추가
```
- 유닛은 부품 여러 개(골반·몸통·머리·팔다리·무기)의 행렬을 매 프레임 계산해 `put`한다. `xf(out, parent, px,py,pz, rx,ry,rz, sx,sy,sz)`로 부모-자식 변환.
- `capacity`를 넘으면 그냥 안 그려진다(조용한 실패). 한 화면 최대 수(`G.mons.length`는 84에서 막힘)를 고려해 잡는다. PartBatch 하나가 드로콜 하나이므로 **새 PartBatch 수를 아낀다**(군대 넷 × 부위 일곱을 모두 만들면 28개).
- `tint`(인스턴스별 색 곱)로 한 키트를 여러 군대색으로 돌려 쓸 수 있다. 밝은 중립색으로 모델링하고 `tint`로 물들이는 것이 가장 싸다.
- `rigHuman(kit, spec, e)`: 사람형 공용 리그. `e.weapon`, `e.shield`, `e.helm`, `e.plate`, `e.hood`, `e.robe`, `e.drum`, `e.standard`, `e.keg`, `e.crown`, `e.wraps`, `e.heavy`, `e.claw`, `e.shamble` 같은 플래그로 장비·자세를 바꾼다. 반환값은 머리 행렬, `RIGOUT.handR/handL/tip/torch`에 손·무기 끝 위치.
- 죽을 때 `shatter(rigFn, e, impulse)`가 같은 리그 함수를 캡처 모드로 돌려 부품을 파편으로 날린다. **새 리그도 반드시 `RIG_CAPTURE`를 거치는 `put`만 써야** 사망 연출이 따라온다.

### 타워 (`src/60-towers.js`)
`blueprint(kind, lvl)`가 조각 목록을 돌려주고, 비계 안에서 조각이 하나씩 올라간다. 조각 구조와 순서를 유지하면 건설·증축·철거 연출이 그대로 동작한다. 불빛은 `light`, `flame` 위치로 제어.

### 전장 (`src/31-terrain.js`, `32-props.js`, `33-flora.js`)
`buildBoard(seed, index)` → 36×36 슬래브를 6×6 청크로. `buildKeep(B)`(성과 봉화), `buildCave(B)`(적 출현 지점), `buildPads`, `buildBridge`, `scatterProps`, `BIOME_DRESS[key]`(전장별 치장). 모든 조각은 `B.pieces`에 등록되어 "무너짐/솟아오름" 연출에 참여한다 — 새 구조물도 같은 방식으로 등록해야 연출에서 빠지지 않는다.

## 빌드와 실행

```bash
python3 tools/build.py                         # src → index.html
node tools/cdp.js "seed=4&ff=30" 1280,800 wait:5000 shot:이름 eval:"__cw.G.lives"
```
- 스크린샷: `tools/shots/이름.png` (git 무시). **반드시 `Read`로 열어 눈으로 확인한다.**
- 예외는 `[EXCEPTION]`으로 출력된다. 한 줄도 없어야 한다. `GPU stall` 경고는 무시.
- URL 플래그: `seed=N`, `biome=salsu|ansi|gwiju|jinju|haengju`(또는 내부 키), `level=N`, `k=N`(공세 번호), `ff=S`(S초 빨리감기), `fps=1`, `nodof=1`, `cam=x,z,zoom`(카메라 고정).
- 디버그 전역 `__cw`: `G`(상태), `MON`, `spawnMonster(type, {})`, `setPhase(p)`, `UI`, `CAM`.
- 특정 적을 가까이서 보려면:
  ```bash
  node tools/cdp.js "seed=4&biome=gwiju&ff=3&cam=0,0,2.6&nodof=1" 1280,800 \
    eval:"['wolf','knight','brute'].forEach((t,i)=>__cw.spawnMonster(t,{s:14+i*1.5}))" wait:1500 shot:mobs
  ```
- 헤드리스 환경은 소프트웨어 렌더링이라 느리다(수 fps). 성능 판단은 `fps=1`의 **드로콜 수**와 PartBatch 개수로 한다.

## 끝내기 전 자가 점검

1. `python3 tools/build.py` 성공.
2. 자기 변경이 보이는 전장·상황 스크린샷을 찍어 직접 확인(전·후 비교).
3. `[EXCEPTION]` 0건, 30초 빨리감기 후에도 `__cw.G.lives > 0`이고 타워가 지어짐.
4. 자기 소유가 아닌 파일의 diff가 없는지 `git status`로 확인.
