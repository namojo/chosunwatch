---
name: chosun-renovate
description: 조선워치 리노베이션 하네스의 오케스트레이터. Cinderwatch 기반 타워 디펜스를 한국사 전쟁 테마(고구려·수/당, 고려·몽골, 조선·일본)로 개조·보완·재실행·배포하는 전 과정을 에이전트 팀으로 조율한다. "리노베이션 실행", "전장/적/타워/UI/소리 다시 만들어", "새 전장·새 적 추가", "QA 돌리고 배포", "이전 결과 개선", "○○만 다시" 같은 요청에 반드시 이 스킬을 사용한다.
---

# 조선워치 리노베이션 오케스트레이터

원작(MIT, kevintngo/cinderwatch)을 한국사 전쟁 디오라마로 바꾸는 일을 **일곱 역할의 에이전트 팀**으로 나눠 수행한다. 오케스트레이터(이 스킬을 읽는 메인 에이전트)는 계약을 깔고, 팀을 병렬로 돌리고, 합치고, 검증하고, 배포한다.

## 아키텍처 — 파이프라인 + 팬아웃/팬인 + 생성·검증 루프

```
[0 준비]──▶[1 계약·고증]──▶[2 병렬 제작 ×5]──▶[3 병합]──▶[4 QA]──▶[5 배포]
 오케스트레이터  오케스트레이터   battlefield-artisan    오케스트레이터  qa-playtester  오케스트레이터
                + lore-historian  army-modeler                           │
                                  tower-architect            ◀──결함 재작업 루프(최대 2회)──┘
                                  hud-calligrapher
                                  gugak-composer
```

**왜 이 구조인가:** 지형·적군·타워·UI·소리는 파일이 깔끔히 나뉘어 병렬화 이득이 크다. 하지만 "같은 군대는 같은 색", "키와 수치는 불변" 같은 약속이 없으면 다섯 결과물이 한 화면에서 따로 논다. 그래서 병렬 구간 **앞에** 계약(설계서 + `05-lore.js` 훅)을 깔고, **뒤에** 경계면만 보는 QA를 둔다.

## 실행 모드

- **서브에이전트 모드**(기본): `Agent` 도구로 각 역할을 띄운다. 에이전트끼리는 직접 대화하지 않고 **파일로** 주고받는다(`_workspace/`).
- `.claude/agents/{이름}.md`가 세션에 에이전트 타입으로 등록되어 있으면 `subagent_type`으로 그 이름을 쓴다. 등록되어 있지 않으면 `general-purpose`로 띄우고 프롬프트 첫 줄에 "`.claude/agents/{이름}.md`를 읽고 그 역할로 일하라"를 넣는다.
- 병렬 제작 에이전트는 **`isolation: "worktree"`** 로 띄운다. 한 작업 트리에서 다섯이 동시에 빌드하면 남의 반쯤 고친 파일 때문에 빌드가 깨진다.
- 모든 Agent 호출에 `model`을 지정하지 않는다(세션 모델 상속). 절차적 3D 모델링과 리그 수학은 가장 강한 모델이 필요하다.

## Phase 0 — 컨텍스트 확인과 준비

1. `_workspace/`와 `git log`를 보고 실행 모드를 정한다.
   - `_workspace/` 없음 + `src/`에 원작 상태 → **초기 실행**: Phase 1부터 전부.
   - `_workspace/` 있음 + 사용자가 일부만 요청("적 모델만 다시", "QA 결함 수정") → **부분 재실행**: 해당 에이전트만 Phase 2 형식으로 호출, 이전 보고서 경로를 입력으로 준다. 이후 Phase 3~5.
   - 새 입력(새 전장·새 전쟁 추가 등) → 기존 `_workspace/`를 `_workspace_prev/`로 옮기고 Phase 1부터.
2. 원작 소스가 없으면 가져온다: `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/kevintngo/cinderwatch` 후 `src/ tools/ vendor/ LICENSE .nojekyll .gitignore`만 복사(원작 `media/`·`README.md`는 가져오지 않는다). `tools/cdp.js`·`record.js`의 Chrome 경로·GPU 플래그를 실행 환경에 맞춘다.
3. 베이스라인 확인: `python3 tools/build.py` → `node tools/cdp.js "seed=4&ff=30" 1280,800 wait:6000 shot:base eval:"__cw.G.lives"`. 여기서 안 돌면 이후 모든 단계가 무의미하다.

## Phase 1 — 계약 깔기 (오케스트레이터 직접 + lore-historian)

병렬 제작이 서로를 기다리지 않게 하는 최소한의 공용 접점을 **오케스트레이터가 직접** 만든다.

- `src/05-lore.js`: `ERA`, `ARMY` 색 표, `curEra()`, `curArmy()`, `monName()`, `monTip()`, `towerName()`, `towerDesc()`.
- `src/29-biome.js`: 전장마다 `alias`, `name`, `title`, `year`, `era`, `army`, `lore`. 배열을 연대순으로.
- 이름을 쓰는 곳(`72-ui.js`, `62-game.js`, `61-monsters.js`)이 헬퍼를 거치도록 연결.
- 소유권이 겹치는 코드를 파일로 분리(아군 병사 → `src/52-allies.js`).
- 빌드·스모크 후 **커밋**(워크트리의 출발점).

동시에 `lore-historian`을 띄워 설계서를 검수시킨다(`_workspace/01_lore_review.md`). 오류 판정이 나오면 설계서·`29-biome.js`의 문자열을 고치고, 이미 출발한 제작 에이전트에게는 Phase 3 병합 때 반영한다(이름표 수준의 수정은 병합 후 한 번에 고치는 편이 싸다).

## Phase 2 — 병렬 제작 (팬아웃)

다섯 에이전트를 **한 메시지에서 동시에**, 백그라운드·워크트리 격리로 띄운다.

| 에이전트 | 소유 파일 | 보고서 |
|---|---|---|
| battlefield-artisan | `29,30,31,32,33,41` | `_workspace/02_battlefield.md` |
| army-modeler | `50,51,61,62` | `_workspace/03_army.md` |
| tower-architect | `52,60` | `_workspace/04_towers.md` |
| hud-calligrapher | `70,71,72`, `shell.html`, `tools/build.py`, `tools/hangul.py` | `_workspace/05_hud.md` |
| gugak-composer | `80` | `_workspace/06_audio.md` |

각 프롬프트에 반드시 넣는 것:
1. 역할 파일 경로(`.claude/agents/{이름}.md`)와 읽을 스킬(`cinder-engine-guide`, `chosun-world-bible`, 역할별 스킬).
2. **소유 파일 목록과 "그 밖의 파일은 수정 금지"**. 남의 파일에 필요한 것은 `_workspace/handoff/{from}-to-{to}.md`.
3. 완료 조건: 빌드 성공, 예외 0, 스크린샷을 직접 열어 확인, 보고서 작성, **자기 워크트리 브랜치에 커밋**.
4. 보고 형식: 브랜치 이름, 커밋 해시, 바꾼 파일, 한계 3줄 이내.
5. (재실행 시) 이전 보고서와 QA 결함 목록 경로.

## Phase 3 — 병합 (팬인)

1. 각 워크트리 브랜치를 개발 브랜치로 `git merge --no-edit`. 소유권을 지켰다면 충돌이 없다. 충돌이 나면 소유권 표에 따라 소유자의 버전을 택한다.
2. `_workspace/handoff/*.md`를 읽고 교차 요청을 반영한다(오케스트레이터가 직접, 작은 것만).
3. `lore-historian`의 수정안을 반영한다.
4. `python3 tools/build.py`(한글 글리프가 전 모듈 문자열 기준으로 재생성된다) → 스모크 → 커밋.

## Phase 4 — QA (생성·검증 루프)

`qa-playtester`를 띄운다(`playtest-qa` 스킬). 보고서의 S1·S2 결함을 담당자별로 묶어 해당 에이전트를 **결함 목록과 함께** 다시 띄우고, 병합·재검증한다.

- 루프는 최대 2회. 2회 뒤에도 남는 S2는 범위를 줄이는 대안(이름·색만 적용 등)으로 닫거나, 알려진 한계로 README에 적는다.
- 작은 결함(문자열, 상수 하나)은 에이전트를 띄우지 않고 오케스트레이터가 직접 고친다 — 에이전트 한 번의 왕복 비용이 수정보다 크다.

## Phase 5 — 배포

`pages-deploy` 스킬을 따른다: README(한국어, 원작 출처 명시)·스크린샷 갱신 → 라이선스 고지 점검 → 개발 브랜치 푸시 → `gh-pages` 구성·푸시 → 배포 확인. 지정 브랜치 외 푸시가 막히면 우회하지 않고 사용자에게 Pages 설정 한 가지를 요청한다.

## 데이터 흐름

```
설계서(.claude/skills/chosun-world-bible) ─┬─▶ 모든 에이전트
src/05-lore.js, 29-biome.js(메타데이터)   ─┘
_workspace/01_lore_review.md   ◀─ lore-historian ─▶ 오케스트레이터가 설계서·코드 문자열에 반영
_workspace/0{2..6}_*.md        ◀─ 제작 에이전트 ─▶ qa-playtester(이미 밝힌 한계 제외)
_workspace/handoff/*.md        ◀─ 제작 에이전트 ─▶ 오케스트레이터(병합 시 반영)
_workspace/qa/report.md        ◀─ qa-playtester ─▶ 오케스트레이터 ─▶ 담당 에이전트 재작업
tools/shots/*.png              (git 무시) 스크린샷 — 판단의 근거
```

`_workspace/`는 감사 추적용으로 지우지 않는다(커밋한다). 스크린샷은 커밋하지 않는다.

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| 제작 에이전트 실패·중단 | 1회 재시도(이전 보고서·부분 커밋을 입력으로). 다시 실패하면 그 영역은 원작 상태 + 이름·색만 적용으로 축소하고 보고서에 "미완" 명시. 나머지는 진행. |
| 병합 충돌 | 소유권 표의 소유자 버전 채택. 양쪽 다 필요한 변경이면 오케스트레이터가 수동 병합 후 빌드 확인. |
| 병합 후 빌드 실패 | 최상위 이름 충돌이 가장 흔하다. `node --check`로는 못 잡으므로 헤드리스 실행의 `[EXCEPTION]` 메시지로 식별자 확인 → 한쪽 이름 변경. |
| 고증 오류 판정 | 삭제하지 않고 수정안 반영, 출처를 `01_lore_review.md`에 남긴다. |
| QA 2회 후 S1 잔존 | 배포하지 않는다. 사용자에게 상태와 선택지를 보고한다. |
| 배포 푸시 거부 | `pages-deploy`의 "푸시가 거부될 때" 절차. |

## 테스트 시나리오

**정상 흐름:** "조선워치 리노베이션 실행" → Phase 0에서 초기 실행 판정 → 계약 커밋 → 5개 에이전트 병렬 → 충돌 없이 병합 → QA 조건부 통과(S2 2건) → 담당 에이전트 재작업 1회 → 통과 → 배포 → `https://namojo.github.io/chosunwatch/` 200 확인.

**에러 흐름:** army-modeler가 기병 리그에서 시간 초과 → 재시도에서도 뒤틀림 → 기병은 원작 늑대 리그 유지 + 말 색 키트 + 이름 "경기병"으로 축소, `03_army.md`와 README "알려진 한계"에 기록 → 나머지 병합·QA·배포는 정상 진행.

**부분 재실행:** "귀주성 전장이 너무 어두워" → Phase 0에서 부분 재실행 판정 → battlefield-artisan만 `02_battlefield.md` + 피드백과 함께 호출 → 병합 → QA는 스모크 + 귀주성 눈검사만 → 재배포.

## 후속 작업 진입점

| 요청 | 호출 |
|---|---|
| 새 전장 추가(예: 처인성, 명량) | lore-historian(고증) → 설계서 §2 갱신 → battlefield-artisan + army-modeler(`mobs`/적장) → QA |
| 새 적·새 타워 | 설계서 §4/§5 갱신 → army-modeler 또는 tower-architect → hud(글리프 재생성은 빌드가 자동) → QA |
| 문구·번역 수정 | hud-calligrapher (작으면 오케스트레이터 직접) |
| 밸런스 조정 | 계약(수치 불변)의 예외이므로 사용자 확인 후 army-modeler가 `62-game.js`/`MON` 수정, QA 긴 진행 필수 |
| 재배포만 | `pages-deploy` |
