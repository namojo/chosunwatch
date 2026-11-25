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
