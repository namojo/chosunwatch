# 오케스트레이터 로그

## Phase 0 — 준비 (2026-11-25)
- 원작: kevintngo/cinderwatch @ 6640b81 (MIT). `src/ tools/ vendor/ LICENSE .nojekyll .gitignore`만 가져옴. 원작 media/README는 제외.
- `tools/cdp.js`, `tools/record.js`: Linux 헤드리스 Chromium(SwiftShader) 지원 추가, 접속 재시도 확대.
- 베이스라인 빌드·실행 확인(예외 0).

## Phase 1 — 계약
- `src/05-lore.js` 신설: ERA/ARMY 색, curEra/curArmy, monName/monTip, towerName/towerShort/towerDesc.
- `src/29-biome.js`: 연대순 재배열(살수→안시성→귀주성→진주성→행주산성), alias/name/title/year/era/army/lore 추가.
- UI·웨이브·체력바의 이름 조회를 헬퍼로 연결. 저장 키 `chosunwatch.*`.
- 아군 병사 키트·그리기를 `src/52-allies.js`로 분리(소유권 충돌 제거).
- 핵심 배너 4종 한국어화(62-game.js), 시작 전장을 항상 첫 전장(살수)으로.

## Phase 1b — 고증 검수 반영
- lore-historian 검수 완료(`01_lore_review.md`): 오류 21건(A 7, B 14), 허용 18, 사실 30.
- 설계서(world-bible.md)에 A·B등급 수정 반영, §9 기록 추가. README의 적장 표기(살리타) 등 수정.
- 진행 중인 제작 에이전트 5명에게 담당별 수정 사항 전달(이름 확정표, 행주 계절, 술데 색, 전립, 군자금, 거문고 제안).
- 병합 때 할 일: `29-biome.js`의 lore 3문장(안시성·귀주성·진주성) 교체.

## Phase 3 — 병합 (진행)
- hud-calligrapher 병합(b150a52): 한글 픽셀 폰트 파이프라인, HUD 번역. 스모크 통과.
- battlefield-artisan 병합(893292d): 다섯 전장·성곽·봉수대·진문. `29-biome.js` lore 3문장 교체(검수 E05 등). 다섯 전장 스모크 통과(예외 0).
- army-modeler 병합(dcb0f01): 21종 병종·적장 6명 재모델링, 확정 이름표 반영. 다섯 전장 스모크 통과(예외 0), 근접 스크린샷 확인.
  - `bio.tints`/`wispHex`는 더 이상 읽지 않음(죽은 데이터, 유지).
  - `army-to-audio.md`: 효과음 키의 쓰임새 변화 → gugak-composer 후속 반영 대상.
- gugak-composer 병합(6b7b27b): 드론+5음 선율, 장단, 전장별 조, 국악 신호음. 오디오를 깨운 실행에서 예외 0, `__au.dbg().err = 0`.
  - `audio-to-army.md` 반영: 적장 근접 공격의 짐승 포효(`roar`) → `clash`(오케스트레이터 직접 수정, 한 줄). 나머지 사망음은 army-modeler가 이미 사람용 분기로 바꿔 `squelch` 호출 없음.
- tower-architect 병합(007b35e): 시대별 타워 4종·수비 병사 3벌, 확정 이름표 반영. 전 브랜치 병합 완료.
- 통합 스모크(`ff=150`, 다섯 전장): 예외 0, 적장전 진입, lives 20, 네 종류 타워 건설. `hangul.py --check` 0(누락 글리프 없음), 492자.
- 충돌 0건(소유권 표 준수). 

## Phase 5 — 배포 (사용자 지시로 QA 완료 전에 선배포)
- QA 1차 시도는 사용량 한도로 중단, 2차 실행 중. 사용자가 "우선 배포"를 지시해 b27b9da 기준으로 배포.
- `gh-pages`(orphan, 서빙 전용: index.html, .nojekyll, LICENSE, media/, vendor/LICENSE-*.txt) 푸시 → Pages 자동 활성화 확인(`has_pages: true`).
- https://namojo.github.io/chosunwatch/ 200, 서빙 파일이 커밋된 `index.html`과 바이트 동일, 헤드리스로 라이브 URL 실행 확인(살수, lives 20, 타워 4, 예외 0).
- QA 보고서가 나오면 S1·S2 수정 후 재배포 예정.

## Phase 4 — QA 결과와 수정
- qa-playtester 2차 실행 완료: **조건부 통과** (S1 0 · S2 1 · S3 4). 계약 위반 0, 난이도 회귀 없음(AI 자동 4개 시드 모두 2회차 진입), 드로콜 143~225.
- S2-1(패배 뒤 "다음 전장"으로 넘어가며 level만 0) 수정: 패배하면 이번 원정의 첫 전장부터 다시(`G.boardIndex -= G.level + 1`), 판 문구 "처음부터 다시"(`G.fell`). 재현 명령으로 `살수 L0 → 살수 L0` 확인.
- S3-1(괴물 포효 `roar` 잔존) 수정: 적장 쓰러짐 → `clash`, 돌 세례 → `hammer`, 격분 → `horn`. `sfx('roar')` 호출 0.
- 남긴 것(S3): 적장 직함 미표시, 패배 순간 밀린 알림이 다음 소개 화면에 뜨는 경우, 쓰이지 않는 원작 코드.
