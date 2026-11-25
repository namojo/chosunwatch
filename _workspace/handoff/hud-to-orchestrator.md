# hud-calligrapher → 오케스트레이터

병합·문서 쪽에서 처리해 주세요(모두 내 소유 파일 밖).

1. **병합 뒤 반드시 `python3 tools/build.py`를 다시 실행.** 다른 브랜치의 한글 이름·설명은 그때 `src/71-hangul-data.js`에 들어간다. 다시 생성된 `71-hangul-data.js`도 `index.html`과 함께 커밋. `python3 tools/hangul.py --check`가 0으로 끝나면 빠진 글자가 없다.
2. **`71-hangul-data.js`는 병합 충돌이 나면 내용을 고르지 말고 다시 생성**하면 된다(자동 생성물).
3. **README/NOTICE:** Unifont 글리프 사용 고지 한 줄이 필요하다 — "한글 글리프: GNU Unifont(SIL OFL 1.1), `vendor/LICENSE-unifont.txt`".
4. **`hangul-pixel-font` 스킬 문서 갱신 요청:** (a) HUD 배율은 항상 짝수, 한글은 그 절반 배율 (b) 생성물은 hex가 아니라 base64 (c) 한글은 기본 굵게, `opts.thin` (d) `HANGUL_EXTRA` 환경 변수 (e) 실행 중 없는 글자는 시스템 글꼴로 대체.
5. **설계서 §6:** `gold = 군자금(엽전)` → `군자금`(검수 E07). UI에는 이미 "엽전"이 없다.
6. **`tools/cdp.js`(동결 도구):** `eval:"식"`의 결과가 `undefined`면 `JSON.stringify(...).slice`에서 죽는다. 우회: `eval:"(식,1)"`.

## 다른 에이전트에게 전할 것

- **tower-architect:** `TOWER[kind].icon` 값은 `archer / bombard / spire / guard` 그대로 둘 것(아이콘 그림은 `70-pixelfont.js`에 있다). `bombard`는 고구려·고려 전장에서 UI가 자동으로 투석기 그림(`pocha`)을 쓴다. `desc`는 줄 수·길이 제한 없이 자동 줄바꿈되지만 두 줄 × 14자 안팎이 가장 보기 좋다.
- **army-modeler:** 적장 체력바 이름(`G.hbars[].name`)은 긴 이름도 들어가지만, 검수표의 짧은 이름(`호소카와`, `우키타`)을 쓰면 다른 체력바와 덜 겹친다. `tip`은 길이 제한 없이 줄바꿈된다. 전장 배너는 `UI.banner(연도 + '년 · ' + title, …)` 형태를 유지해 주면 `rise` 단계에서 사기 한 줄이 자동으로 붙는다.
