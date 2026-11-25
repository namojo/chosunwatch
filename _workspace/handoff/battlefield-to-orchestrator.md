# battlefield → 오케스트레이터

## 병합 때
- 내 커밋에는 `src/29-biome.js`, `src/31-terrain.js`, `src/32-props.js`, `src/33-flora.js`, `_workspace/`만 있다. **`index.html`은 커밋하지 않았다** — 병합 후 `python3 tools/build.py`로 다시 만들어야 한다.
- `29-biome.js`의 `key/alias/name/title/year/era/army/lore`, `mobs/early/boss/tints/wispHex`는 바이트 단위로 그대로다(비교 확인함). `lore` 문장 3개는 맡긴 대로 건드리지 않았다. 같은 줄을 고치는 것이 아니라 충돌은 나지 않을 것이다(`lore`는 각 전장 첫 줄, 내 변경은 `col/strata/hemi/clear/wat/relief/wx/trees` 줄).
- 새 최상위 이름: `bf_OBANG`, `bf_leafEmis`, `bf_style`, `bf_army`, `bf_q`, `bf_roof`, `bf_yeojang`. 새 `PROP` 키: `jangseung, sotdae, doltap, choga, bales, nokgak, warDebris, tent, nobori, sulde, armyFlag, biseok, seoktap, jeokseok, seonang, boat, tosan, sonamu, broadleaf, willowBare, eoksae, emberHeap`.

## 바뀐 데이터 계약
- `BIOMES[i]`: `webs` 필드 삭제. 추가 — `bare`(겨울·이른 봄 전장: 잎 없는 나무를 쓴다, `frost`·`dunes`), `embers`(땅의 잉걸 무리 수, `ember`만). `bankGlow`는 이제 0~1 세기 값이다.
- `ember.spray`가 `'lava'` → `'none'`. **`src/90-main.js:100`의 `spray === 'lava'` 분기는 이제 죽은 코드다**(지워도 된다).
- `B.keepWall = { x0, x1, z }` 추가(성벽이 뻗은 범위, 소품 배치 회피용).
- `B.beacon`이 성 안쪽 뒤편으로 옮겨졌다(성문 기준 x −4.0, z −3.5, 높이 약 0.9 낮음). 불꽃·조명·비행 적의 목표는 모두 `B.beacon`을 읽으므로 따로 고칠 것은 없다.

## 설계서(§2, §3)에 반영해 달라
- §2 `dunes`: "가을 저녁" → "이른 봄 저녁, 지난해의 마른 갈대·억새, 잎 진 버드나무"(고증 검수 E04). 전장은 그렇게 만들었다.
- §3 몽골: "흰 말총 깃발(술데)" → "검은 말총 술데"(E16). 진문·길가 술데는 검은색이다.
- §2 `ember`: 용암 맥은 끄고(`vein: 0`), 땅의 균열은 잉걸로 바꿨다.

## QA가 볼 것
- 헤드리스에서 실시간 루프가 거의 돌지 않아 전환은 `__cw.tick(1/30, false)` 반복으로 확인했다: `setPhase('clear')` → 약 4.4초 뒤 `crumble` → 약 10초 뒤 `rise` → `play`.
- 봉수대를 눈으로 보려면 봉화가 너무 밝다: `eval:"__cw.LT.beaconBase=60"` 후 3초 대기하고 찍으면 문루·봉수대 형태가 보인다.
