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
