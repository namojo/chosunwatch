# QA 보고서 — 회차 1

- 대상: `claude/kind-lamport-eh2r89` @ f5edbf6 (다섯 워크스트림 병합본), 검수일 2026-11-25
- 도구: `python3 tools/build.py` → `node tools/cdp.js` (헤드리스 Chromium, 소프트웨어 렌더링)
- 이전 회차 보고서 없음(1회차). `tools/shots/`의 예전 스크린샷은 근거로 쓰지 않았고, 이번에 찍은 것은 모두 `q1-` 접두어.

> 이 파일은 단계가 끝날 때마다 이어 쓴다. 맨 아래 "최종 판정" 절이 없으면 검증이 중간에 끊긴 것이다.

## 진행 기록

### 0단계 — 빌드·계약·무결성 (완료)

- `python3 tools/build.py` 성공(1,222,618자 / 1,239,229바이트). 빌드 후 `git status` 깨끗 → 커밋된 `index.html`이 `src/`와 일치.
- `python3 tools/hangul.py --check` 종료 코드 0 (492자, 누락 글리프 없음).
- **계약(diff 근거, `517dc84..HEAD`)** — `MON`/`TOWER`/`ROSTER`/`BIOMES` 객체 리터럴을 두 리비전에서 꺼내 잎 단위로 비교(스크립트로 평가·비교).
  - `MON`: 타입 키 27개와 순서 동일. `hp, spd, rad, mass, bounty, lives, dmg, atkT, armor, slowRes, frenzy, regen, split, summon, explode, hop, ghost, aura, stomp, enrage, alt, flap, glow, fly, slip, boss, cat` **변경 0건**. 바뀐 것은 `name/names/tip/tips/short`(표시)와 겉모습 필드 `scale, top, hitH, death, eye(삭제), tint(삭제), blade, ride`뿐(보고된 사항).
  - `TOWER`: `cost, range, minRange, dmg, splash, rate, n, hp, jumps, slow, slowT, air, ground, light, icon` **변경 0건**. 추가는 `eras{}`와 한글 `name/short/desc`.
  - `ROSTER`(`src/62-game.js`): 파일 자체가 `517dc84` 이후 무변경.
  - `BIOMES`: 키·순서(`fen, ashen, frost, ember, dunes`), `alias/era/army/mobs/early/boss` **변경 0건**. 바뀐 것은 `lore` 3문장(검수 E05 등), 팔레트·하늘·물·날씨·식생 수(겉모습).
  - `61-monsters.js`의 로직 diff는 사망 연출·섬광 색·보폭 위상·효과음 키 교체(`roar`→`clash`)뿐. 소환 주기·기절 시간·피해 계산식은 그대로.
- **무결성** — 번들에 `XMLHttpRequest` 0, `new Image` 0, `@font-face` 0, 외부 `<link>`/`<script src>` 0(`<link rel="icon">`은 `data:` URI). `fetch(`는 three.js 로더 클래스 안의 1건뿐(원작과 동일, 호출되지 않음). `http(s)://` 문자열은 SVG/XHTML 네임스페이스 2건뿐. `LICENSE`(kevintngo·namojo 병기), `vendor/LICENSE-three.txt`, `vendor/LICENSE-unifont.txt` 존재.
- **삭제된 이름 grep** — `낭인, 닌자, 진태고수, 진천뢰병, 호로쿠, 등패, 살리타이, 엽전, 명광개 갑사, 몽골 경기병`: `src/`의 표시 문자열 0건(`51-bestiary.js:114` 주석의 "닌자" 1건은 주석). 글리프 표에도 `낭·닌·엽` 없음.

