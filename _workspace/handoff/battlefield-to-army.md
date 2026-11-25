# battlefield → army-modeler

## 지운 것 / 남긴 것 (`src/32-props.js`)
- 지움: `PROP.bones`, `PROP.ribcage`, `PROP.grave`, `PROP.web`, `PROP.gibbet`, `PROP.towerRuin`, `PROP.signpost`, `PROP.statue`. 원작 기준으로 `src/5x`, `src/6x`에서 쓰는 곳은 없었다. 새로 쓰기 시작했다면 병합 때 깨지니 알려 달라.
- 남김: `PROP.skull`(`51-bestiary.js:44`), `PROP.barrel`(`51-bestiary.js:48`), `clothPanel`, `Soup.prototype.seg` — 시그니처 그대로. 해골을 더 쓰지 않게 되면 `PROP.skull`은 지워도 된다.

## 적 진문(`buildCave`)
- `B.cave`의 위치·`s` 값, 어두운 통로의 크기(길이 3.8 × 폭 3.6 × 높이 3.0)는 원작과 같다. 출현·`vis` 로직은 그대로 동작한다.
- 문 가로대가 y≈3.05(길 높이 기준)에 있다. 스케일이 큰 적장(말 + 깃발)은 나올 때 가로대·휘장과 겹쳐 보일 수 있다. 등 뒤 깃발이 3.0보다 높으면 통로 안에서는 가려진다.
- 진문 양옆 기둥에 횃불 둘이 있다(`B.fires`).

## 색 맞추기 — 내가 쓴 군기 규칙 (`bf_army(bio)`, 모두 `ARMY` 표에서)
| 군대 | 깃발 바탕 / 문양 | 군막·지붕 천 / 줄 |
|---|---|---|
| 수 | `sub`(황) / `main`(황토) | `main` / `sub` |
| 당 | `main`(진홍) / `sub`(금) | `main` / `sub` |
| 몽골 | `main`(청) / `sub`(백), 술데는 **검은 말총**(0x211e1d) | `sub`(백) / `main`(청) |
| 왜 | `sub`(적) 또는 `trim`(백)의 노보리 / 문양은 `main`(흑) | `trim`(백) / `main`(흑) |

적 병사의 등 깃발(사시모노)·군기도 같은 조합이면 한 군대로 보인다. `bf_army(bio)`는 같은 스코프라 그대로 불러 써도 된다: `{ key, main, sub, trim, flag, flag2, cloth, stripe, mark }`(선형 RGB 배열).

## 전장이 적에게 주는 배경
- 진주성은 매우 어둡고 붉다. 왜군의 흑색 갑옷은 묻히기 쉽다 — `trim`(백)·`sub`(적) 면적을 넉넉히.
- 귀주성은 눈밭이라 몽골의 백색(`sub`)이 묻힌다 — 청(`main`)과 모피색을 주색으로.
