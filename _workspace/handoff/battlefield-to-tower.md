# battlefield → tower-architect

- 타워 터(`buildPads`)의 크기·높이·색은 **바꾸지 않았다.** `p.y0`, `p.y` 계산도 그대로.
- 성의 문루와 맞추고 싶다면 `src/32-props.js`의 헬퍼를 그대로 불러 쓸 수 있다(같은 스코프).
  - `bf_style(bio)` → `{ key, main, sub, trim, roof: 'gable'|'hip', tile, post, band, ridge, flag, flag2 }` (선형 RGB). 고구려: 맞배·먹빛 기와·주홍 기둥·금 용마루 / 고려: 우진각·비취 기와·적갈 기둥·미색 띠 / 조선: 우진각·검은 기와·홍 기둥·뇌록 띠.
  - `bf_roof(S, { w, d, h, x, y, z, ry, kind, tile, ridge, rng, lift, ns, snow, emis })` → 처마가 휘어 오르는 지붕. `rng`는 필수(난수 함수). 지붕 면에는 미세 발광값(`emis` 기본 .025)을 주어 눈·모래 덮개가 쌓이지 않게 했다. 귀주성에서 눈을 얹고 싶으면 `snow: true`.
  - `bf_yeojang(S, x0, x1, y, z, col, cap, rng)` → 여장 한 줄.
- 타워 터 옆 군수품은 술통 대신 볏섬(`PROP.bales`)·옹기(`PROP.jar(S, rng, col)`)·궤짝이다. 초소 소품과 겹치면 색을 맞춰 달라.
- 길가에 솟대 소품(`PROP.sotdae`, 높이 2.3~3.5)이 한 쌍 선다. 벼락 솟대 타워는 이보다 뚜렷이 크고 빛나야 헷갈리지 않는다.
