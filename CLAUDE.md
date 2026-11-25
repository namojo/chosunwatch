# 조선워치 (Chosunwatch)

[Cinderwatch](https://github.com/kevintngo/cinderwatch)(MIT)를 한국사의 전쟁 — 고구려·수, 고구려·당, 고려·몽골, 조선·일본 — 으로 리노베이션한 단일 HTML 3D 타워 디펜스. 배포: https://namojo.github.io/chosunwatch/

## 빌드와 실행

```bash
python3 tools/build.py        # src/*.js + vendor/three → index.html (커밋 대상)
node tools/cdp.js "seed=4&ff=30" 1280,800 wait:5000 shot:check eval:"__cw.G.lives"
```

- `index.html`은 빌드 산출물이지만 **저장소에 커밋한다**(Pages가 그대로 서빙).
- 테스트 러너는 없다. 검증은 헤드리스 실행 + 스크린샷 눈검사다(`playtest-qa` 스킬).
- 에셋 파일·네트워크 요청·프레임워크를 추가하지 않는다. 모든 모델·질감·소리·글꼴은 코드/빌드로 생성한다.

## 하네스: 조선워치 리노베이션

**목표:** 원작의 메커니즘과 밸런스는 유지한 채, 전장·적군·타워·UI·소리를 한국사 전쟁 테마로 바꾸고 GitHub Pages로 배포한다.

**트리거:** 이 게임의 테마·모델·문구·소리를 만들거나 고치는 요청, QA·배포 요청, "다시 실행/보완/○○만 수정" 요청에는 `chosun-renovate` 스킬(오케스트레이터)을 사용한다. 한 줄 오타 수정 같은 단순 작업은 직접 처리해도 된다.

**구성**

| 종류 | 이름 | 역할 |
|---|---|---|
| 스킬 | `chosun-renovate` | 오케스트레이터: 단계·팀 편성·병합·QA 루프·배포 |
| 스킬 | `chosun-world-bible` | 세계관·고증·이름·색 계약(단일 진실 원천) |
| 스킬 | `cinder-engine-guide` | 엔진 구조, 절차적 모델링 API, 파일 소유권 |
| 스킬 | `hangul-pixel-font` | 에셋 없는 한글 픽셀 폰트 파이프라인 |
| 스킬 | `gugak-synth` | Web Audio 국악 음색·장단 레시피 |
| 스킬 | `playtest-qa` | 헤드리스 플레이테스트와 결함 보고 |
| 스킬 | `pages-deploy` | GitHub Pages 배포 절차 |
| 에이전트 | `lore-historian` | 고증 검수, 한국어 문구 |
| 에이전트 | `battlefield-artisan` | 전장·성곽·봉수대·식생·날씨 |
| 에이전트 | `army-modeler` | 침공군 병종과 적장 |
| 에이전트 | `tower-architect` | 타워와 수비 병사 |
| 에이전트 | `hud-calligrapher` | 한글 폰트, HUD·메뉴 |
| 에이전트 | `gugak-composer` | 효과음·생성 음악 |
| 에이전트 | `qa-playtester` | 통합 검증 |

**핵심 계약 (어기면 팀 작업이 깨진다)**

1. `MON`·`TOWER`·`BIOMES`의 내부 키와 밸런스 수치는 바꾸지 않는다. 이름·겉모습만 바꾼다.
2. 깃발·군복·장식 색은 `src/05-lore.js`의 `ERA`/`ARMY`에서 가져온다.
3. 에이전트는 자기 소유 파일만 고친다(`cinder-engine-guide`의 소유권 표). 교차 요청은 `_workspace/handoff/`.
4. 적을 비하하는 표현 금지. 역사 용어와 통설만.

**작업 산출물:** `_workspace/`(에이전트 보고서, QA 보고서, 핸드오프) — 감사 추적용으로 유지한다.

**변경 이력**

| 날짜 | 변경 내용 | 대상 | 사유 |
|---|---|---|---|
| 2026-11-25 | 초기 구성 | 전체 | 조선워치 리노베이션 하네스 신규 구축 |
