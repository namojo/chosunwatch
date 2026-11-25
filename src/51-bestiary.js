
// ── 조선워치 침공군: 장비·말·공성 병기·비행체 키트와 리그 ─────────────────────────
// 군대(수·당·몽골·왜) 구분은 ① 인스턴스 tint ② 군대별 머리 장비 ③ 군대별 깃발로 한다.
// 군대별 PartBatch는 그 군대의 전장에서만 인스턴스가 생기므로(n = 0이면 안 그림) 드로콜이 늘지 않는다.
const ar_ARMIES = ['sui', 'tang', 'mongol', 'wa'];

// 깃발 천(양면). 밤 화면에서 묻히지 않게 살짝 자체 발광을 준다.
function ar_cloth(S, x0, x1, yTop, len, z, col, col2, o = {}) {
  const nx = o.nx || 3, ny = o.ny || 5, rng = makeRng(o.seed || 9), em = o.emis === undefined ? .035 : o.emis;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (o.swallow && j === ny - 1 && i > 0 && i < nx - 1) continue;
    const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx), ya = yTop - len * j / ny, yb = yTop - len * (j + 1) / ny;
    const emb = col2 && (o.band ? j === 1 || j === 2 : (i >= 1 && i < nx - 1 && j >= 1 && j <= ny - 3));
    const c = mulC(emb ? col2 : col, .86 + .22 * rng());
    const q = [[xa, ya], [xb, ya], [xb, yb], [xa, yb]];
    for (const [order, nz] of [[[0, 3, 2, 0, 2, 1], 1], [[0, 1, 2, 0, 2, 3], -1]]) for (const k of order) S.v(q[k][0], q[k][1], z, 0, 0, nz, c[0], c[1], c[2], q[k][0] * .5, q[k][1] * .5, L_CLOTH, .95, 0, em);
  }
}
// 양면 사각 판
function ar_quad2(S, a, b, c, d, col, layer, rough, o) { S.quad(a, b, c, d, col, layer, rough, o); S.quad(a, d, c, b, col, layer, rough, o); }

// 군대별 머리 장비와 깃발
function ar_armyKit(a) {
  const A = ARMY[a], main = C(A.main), sub = C(A.sub), trim = C(A.trim), iron = COL.iron, gold = mulC(COL.gold, .9), N = { rad: .17, shadow: false };
  const K = {};
  if (a === 'sui') {
    // 찰갑 투구: 검은 쇠 종장판 + 가죽 드림 + 황색 띠와 꼭지
    K.hat = new PartBatch(S => {
      S.add(gDome(8, 3), { s: [.142, .135, .15], p: [0, .165, 0], c: mulC(iron, 1.5), l: L_METAL, rough: .5 });
      S.cyl(.147, .035, 0, .175, 0, mulC(sub, 1.1), { n: 8, emis: .02 });
      S.box(.28, .15, .05, 0, .1, -.115, mulC(trim, 1.3), {}); for (const s of [-1, 1]) S.box(.045, .14, .15, s * .125, .1, -.035, mulC(trim, 1.3), {});
      S.cone(.035, .1, 0, .34, 0, mulC(sub, 1.2), { n: 4, emis: .03 });
    }, 170, N);
    K.heavy = K.hat;
  } else if (a === 'tang') {
    // 붉은 술 투구: 밝은 강철 + 챙 + 붉은 술
    K.hat = new PartBatch(S => {
      const st = mulC(trim, 1.25), red = mulC(main, 1.9);
      S.add(gDome(8, 3), { s: [.142, .13, .15], p: [0, .165, 0], c: st, l: L_METAL, rough: .35 });
      S.cyl(.19, .022, 0, .172, 0, st, { n: 8, l: L_METAL, rough: .35 });
      S.box(.26, .13, .04, 0, .1, -.115, red, { l: L_CLOTH, emis: .02 }); for (const s of [-1, 1]) S.box(.04, .12, .12, s * .12, .1, -.04, st, { l: L_METAL, rough: .4 });
      S.seg([0, .28, 0], [0, .37, 0], .014, .014, mulC(sub, 1.1), { n: 4, l: L_METAL });
      S.ico(.06, 0, .41, 0, red, { d: 0, sc: [1, 1.25, 1], emis: .05 }); S.ico(.045, 0, .35, -.04, red, { d: 0, emis: .05 });
    }, 170, N);
    K.heavy = K.hat;
  } else if (a === 'mongol') {
    // 털모자: 모피 테 + 흰 펠트 고깔 + 귀·목 가리개
    K.hat = new PartBatch(S => {
      const fur = mulC(trim, 1.25), felt = mulC(sub, .95);
      S.cyl(.168, .075, 0, .19, 0, fur, { n: 8, jit: .1 });
      S.cone(.135, .19, 0, .32, 0, felt, { n: 6, emis: .025 });
      S.ico(.03, 0, .425, 0, mulC(main, 2.2), { d: 0, emis: .05 });
      for (const s of [-1, 1]) S.box(.05, .17, .14, s * .135, .08, -.02, fur, { jit: .1 });
      S.box(.25, .17, .05, 0, .08, -.115, fur, { jit: .1 });
    }, 170, N);
    K.heavy = K.hat;
  } else {
    // 진가사: 넓고 납작한 검은 옻칠 삿갓 + 흰 테 + 붉은 원
    K.hat = new PartBatch(S => {
      const lac = [.035, .035, .045], red = mulC(sub, 1.5);
      S.cone(.275, .115, 0, .247, 0, lac, { n: 8, rough: .3 });
      S.cyl(.282, .014, 0, .187, 0, mulC(trim, .95), { n: 8, emis: .03 });
      S.box(.075, .014, .085, 0, .258, .12, red, { r: [.4, 0, 0], emis: .06, jit: 0 });
      S.box(.075, .014, .085, 0, .258, -.12, red, { r: [-.4, 0, 0], emis: .06, jit: 0 });
      S.ico(.025, 0, .31, 0, gold, { d: 0, l: L_METAL });
    }, 170, N);
    // 가부토: 검은 투구 + 붉은 엮음 시코로 + 금빛 앞꾸밈(밖으로 벌어진 뿔 한 쌍과 가운데 원판)
    K.heavy = new PartBatch(S => {
      const lac = [.05, .05, .065], red = mulC(sub, 1.4);
      S.add(gDome(8, 3), { s: [.15, .13, .16], p: [0, .165, 0], c: lac, l: L_METAL, rough: .35 });
      S.box(.36, .045, .21, 0, .155, -.07, lac, { rough: .4 }); S.box(.41, .045, .25, 0, .11, -.085, red, { emis: .02 }); S.box(.45, .04, .28, 0, .065, -.1, lac, { rough: .4 });
      S.box(.2, .02, .08, 0, .18, .14, lac, { rough: .4 });
      for (const s of [-1, 1]) { S.seg([s * .03, .2, .16], [s * .11, .34, .155], .02, .028, gold, { n: 4, l: L_METAL, rough: .3, emis: .05 }); S.seg([s * .11, .34, .155], [s * .21, .47, .15], .028, .012, gold, { n: 4, l: L_METAL, rough: .3, emis: .05 }); }
      S.cyl(.04, .015, 0, .25, .165, gold, { n: 6, r: [HPI, 0, 0], l: L_METAL, rough: .3, emis: .05 });
    }, 50, N);
  }
  // 깃발: 몸통 좌표(등 뒤 z = -.14에 깃대)
  K.flag = new PartBatch(S => {
    const pole = COL.woodD;
    if (a === 'mongol') {
      // 술데: 검은 말총을 두른 깃대(전쟁의 술데) + 청색 띠
      S.seg([0, .1, -.14], [0, 1.5, -.2], .022, .018, pole, { l: L_WOOD, n: 4 });
      S.cyl(.12, .035, 0, 1.43, -.2, mulC(COL.brass, 1.5), { n: 8, l: L_METAL, rough: .35, emis: .03 });
      for (let k = 0; k < 9; k++) { const t = k / 9 * TAU, cx = Math.cos(t), sz = Math.sin(t); S.seg([cx * .1, 1.42, -.2 + sz * .1], [cx * .15, 1.0 + (k & 1) * .07, -.2 + sz * .15], .03, .008, k & 1 ? [.06, .055, .06] : [.11, .1, .1], { n: 3 }); }
      S.cone(.034, .22, 0, 1.6, -.2, mulC(COL.brass, 1.6), { n: 4, l: L_METAL, rough: .3, emis: .03 });
      S.box(.16, .022, .022, 0, 1.5, -.2, mulC(COL.brass, 1.5), { l: L_METAL });
      S.cyl(.03, .12, 0, .95, -.185, mulC(main, 2.2), { n: 6, emis: .04 });
      S.ico(.05, 0, 1.47, -.2, mulC(COL.gold, 1.2), { d: 0, l: L_METAL, emis: .08 });
      // 밤에도 보이도록 말총 아래에 청·백 두 갈래 드림을 단다
      ar_cloth(S, .02, .2, .98, .4, -.19, mulC(main, 2.4), null, { nx: 1, ny: 3, seed: 5, emis: .06 }); ar_cloth(S, -.2, -.02, .98, .3, -.19, mulC(sub, 1.0), null, { nx: 1, ny: 2, seed: 6, emis: .05 });
    } else if (a === 'wa') {
      // 사시모노: 등 뒤의 좁고 긴 흰 깃발에 붉은 띠
      const lac = [.05, .05, .06];
      S.seg([0, .1, -.14], [0, 1.56, -.17], .016, .014, lac, { n: 4 });
      S.seg([0, 1.54, -.17], [.27, 1.54, -.17], .012, .012, lac, { n: 4 });
      ar_cloth(S, .01, .27, 1.53, .78, -.17, mulC(trim, 1.05), mulC(sub, 1.5), { nx: 2, ny: 6, band: 1, seed: 31, emis: .05 });
    } else {
      // 수·당 군기: 가로대에 드리운 네모 깃발
      const col = a === 'sui' ? mulC(sub, 1.15) : mulC(main, 2.0), col2 = a === 'sui' ? mulC(main, .9) : mulC(sub, 1.2);
      S.seg([0, .1, -.14], [0, 1.6, -.2], .022, .018, pole, { l: L_WOOD, n: 4 }); S.seg([-.21, 1.47, -.2], [.21, 1.47, -.2], .016, .016, pole, { l: L_WOOD, n: 4 });
      ar_cloth(S, -.19, .19, 1.46, .62, -.2, col, col2, { nx: 3, ny: 5, swallow: 1, seed: 21, emis: a === 'sui' ? .03 : .05 });
      S.ico(.04, 0, 1.64, -.2, a === 'tang' ? gold : mulC(trim, 1.3), { d: 0, l: L_METAL });
      for (const s of [-1, 1]) S.seg([s * .21, 1.47, -.2], [s * .21, 1.28, -.2], .018, .006, col2, { n: 3, emis: .03 });
    }
  }, 110, { rad: .3, shadow: false });
  return K;
}

function initBestiary() {
  const I = KIT.item, N = { rad: .2, shadow: false }, iron = COL.iron, steel = mulC(COL.steel, 1.1), gold = mulC(COL.gold, .9), skin = COL.skin;
  const W = [.9, .9, .9], wd = [.5, .4, .29], wdD = [.33, .26, .19], hide = [.6, .47, .34];

  // ── 사람에게 덧입히는 장비 ──
  // 복면 두건(세작·자객·닌자)
  I.hood = new PartBatch(S => {
    const b = [.045, .045, .06];
    S.add(gDome(8, 4), { s: [.15, .14, .155], p: [0, .165, -.005], c: b, l: L_CLOTH });
    S.box(.212, .1, .212, 0, .07, 0, b, { l: L_CLOTH, jit: 0 }); S.box(.22, .2, .06, 0, .09, -.1, mulC(b, .8), { l: L_CLOTH });
    S.box(.03, .16, .02, .08, .0, -.13, b, { l: L_CLOTH, r: [.3, 0, .2] });
  }, 90, N);
  // 긴 겉옷(독전관) — 흰 천, tint로 군대색
  I.robe = new PartBatch(S => {
    S.add(gCyl(8, .55, true), { s: [.3, 1.0, .27], p: [0, -.1, 0], c: W, l: L_CLOTH, dbl: true, deform: v => { if (v.y < 0) { const j = .9 + .2 * vnoise(Math.atan2(v.z, v.x) * 2 + 3, 1, 7); v.x *= j; v.z *= j; } }, cf: v => .72 + .28 * sat(v.y / .5 + .5) });
    S.box(.46, .1, .28, 0, .4, 0, W, { l: L_CLOTH }); S.cyl(.2, .05, 0, .04, 0, [.25, .2, .16], { n: 8 });
  }, 12, N);
  // 영기(令旗): 독전관이 휘두르는 세모 깃발 — 흰 천, wTint로 군대색
  I.staff = new PartBatch(S => {
    S.seg([0, -.55, 0], [0, 1.3, 0], .022, .018, COL.woodD, { l: L_WOOD, n: 5 }); S.cone(.03, .1, 0, 1.36, 0, [2.2, 1.7, .6], { n: 4, l: L_METAL });
    const a = [0, 1.28, -.02], b = [0, .86, -.02], c = [0, 1.07, -.6], o = { emis: .05 };
    S.tri(a, b, c, W, L_CLOTH, .95, o); S.tri(a, c, b, W, L_CLOTH, .95, o);
  }, 12, N);
  // 전고(戰鼓): 배에 멘 붉은 북
  I.drum = new PartBatch(S => {
    const T = new Soup(); T.cyl(.2, .2, 0, 0, 0, C(0x8a2c22), { n: 10, l: L_WOOD }); T.cyl(.205, .03, 0, .1, 0, C(0xd8c49a), { n: 10 }); T.cyl(.212, .025, 0, -.09, 0, COL.brass, { n: 10, l: L_METAL }); T.cyl(.212, .025, 0, .08, 0, COL.brass, { n: 10, l: L_METAL });
    S.merge(T, { p: [0, .1, .28], r: [.5, 0, 0], ao: null }); S.box(.05, .5, .03, .05, .26, .13, COL.leather, { r: [0, 0, .55] });
  }, 12, N);
  // (호환용) 흰 군기 — 군대색 깃발은 KIT.army[a].flag
  I.standard = new PartBatch(S => {
    S.seg([0, .1, -.14], [0, 1.55, -.2], .022, .018, COL.woodD, { l: L_WOOD, n: 4 }); S.seg([-.2, 1.42, -.2], [.2, 1.42, -.2], .016, .016, COL.woodD, { l: L_WOOD, n: 4 });
    ar_cloth(S, -.18, .18, 1.41, .56, -.2, W, null, { nx: 3, ny: 5, swallow: 1 });
  }, 8, { rad: .3, shadow: false });
  // 북채·나무 메
  I.stick = new PartBatch(S => { S.seg([0, -.05, 0], [0, .3, 0], .02, .018, COL.wood, { l: L_WOOD, n: 4 }); S.ico(.045, 0, .32, 0, COL.woodL, { d: 0, l: L_WOOD }); }, 40, N);
  // 등에 멘 단지(기름 항아리 / 화약 단지) — 밝은 질그릇색, tint로 재질
  I.keg = new PartBatch(S => {
    const clay = [.8, .68, .56];
    S.ico(.17, 0, .25, -.25, clay, { d: 1, sc: [1, 1.05, 1], rough: .6 }); S.cyl(.07, .07, 0, .44, -.25, mulC(clay, .8), { n: 6 }); S.cyl(.09, .02, 0, .48, -.25, mulC(clay, .9), { n: 6 });
    S.seg([0, .48, -.25], [.05, .58, -.23], .012, .01, COL.rope, { n: 3 }); S.ico(.035, .05, .59, -.23, COL.ember, { d: 0, emis: .6, jit: 0 });
    S.box(.05, .5, .03, 0, .22, .12, COL.leather, { r: [0, 0, .5] }); S.box(.05, .5, .03, 0, .22, .12, COL.leather, { r: [0, 0, -.5] });
  }, 36, N);
  // 가죽 멜빵 / 붉은 머리띠(결사대)
  I.wraps = new PartBatch(S => { S.box(.05, .52, .245, .0, .22, 0, COL.leather, { r: [0, 0, .6] }); S.box(.36, .05, .245, 0, .05, 0, COL.leather, {}); }, 12, N);
  I.wrapHead = new PartBatch(S => {
    const red = C(0xc0261e);
    S.box(.205, .04, .205, 0, .185, 0, red, { l: L_CLOTH, emis: .04, jit: 0 });
    S.box(.03, .15, .015, .04, .11, -.115, red, { l: L_CLOTH, r: [.25, 0, .15], emis: .04 }); S.box(.03, .12, .015, -.03, .12, -.115, red, { l: L_CLOTH, r: [.35, 0, -.2], emis: .04 });
  }, 60, N);
  // 투구 깃 장식(장교·중갑병) — 흰 술, tint로 군대색
  I.crown = new PartBatch(S => {
    S.seg([0, .3, 0], [0, .47, -.02], .016, .014, [.8, .7, .4], { n: 4, l: L_METAL });
    S.ico(.062, 0, .52, -.03, W, { d: 0, sc: [1, 1.45, 1], emis: .05 }); S.ico(.045, 0, .45, -.07, W, { d: 0, emis: .05 });
  }, 40, N);
  // 찰갑 흉갑 + 어깨 + 치마 갑 — 밝은 쇠, tint로 군대별 재질
  I.cuirass = new PartBatch(S => {
    const m1 = [.78, .78, .8], m2 = [.52, .52, .55];
    for (let r = 0; r < 4; r++) S.box(.372, .092, .252, 0, .065 + r * .095, 0, r & 1 ? m1 : m2, { l: L_METAL, rough: .42, jit: .03 });
    for (const s of [-1, 1]) { S.box(.14, .07, .21, s * .235, .405, 0, m1, { l: L_METAL, rough: .42 }); S.box(.125, .07, .19, s * .255, .335, 0, m2, { l: L_METAL, rough: .42 }); S.box(.155, .2, .05, s * .085, -.11, .118, m2, { l: L_METAL, rough: .45 }); }
    S.box(.31, .2, .05, 0, -.11, -.118, m2, { l: L_METAL, rough: .45 });
    S.cyl(.075, .02, 0, .27, .13, [1.5, 1.2, .5], { n: 8, r: [HPI, 0, 0], l: L_METAL, rough: .25 });
  }, 40, N);
  // 방패병의 큰 둥근 방패: 가죽을 씌운 나무판 + 쇠 테와 배꼽 — 밝은 색, tint로 군대색
  I.buckler = new PartBatch(S => {
    S.add(gDome(10, 2), { s: [.37, .08, .37], p: [0, 0, 0], r: [HPI, 0, 0], c: [.82, .8, .76], rough: .7 });
    S.add(gTorus(10, .06, 4), { s: .355, p: [0, 0, .005], c: [.2, .2, .22], l: L_METAL }); S.add(gTorus(10, .09, 4), { s: .2, p: [0, 0, .045], c: [.42, .4, .38] });
    S.sph(.08, 0, 0, .08, [.3, .3, .33], { l: L_METAL, w: 6, h: 4, smooth: false });
  }, 50, { rad: .25, shadow: false });
  // 섶단(왜 화공병): 기름 먹여 불붙인 나뭇단
  I.fagot = new PartBatch(S => {
    const tw = [.42, .32, .2];
    for (let k = 0; k < 7; k++) { const a = k * .9, r = k ? .07 : 0; S.seg([Math.cos(a) * r - .2, .3 + Math.sin(a) * r, -.24], [Math.cos(a + .4) * r + .2, .3 + Math.sin(a + .4) * r, -.24], .03, .026, mulC(tw, .8 + .06 * k), { l: L_WOOD, n: 4 }); }
    for (const x of [-.1, .1]) S.cyl(.115, .03, x, .3, -.24, COL.rope, { n: 6, r: [0, 0, HPI] });
    S.ico(.05, .2, .34, -.24, COL.ember, { d: 0, emis: .7, jit: 0 }); S.ico(.035, .16, .4, -.22, COL.ember, { d: 0, emis: .6, jit: 0 });
    S.box(.05, .5, .03, 0, .22, .12, COL.leather, { r: [0, 0, .5] }); S.box(.05, .5, .03, 0, .22, .12, COL.leather, { r: [0, 0, -.5] });
  }, 40, N);

  KIT.army = {}; for (const a of ar_ARMIES) KIT.army[a] = ar_armyKit(a);

  // ── 말 ── 몸통(목·머리 포함)/다리/꼬리는 털빛 tint, 마구·마갑은 군대색 tint
  const hc = [.8, .76, .72], hd = [.26, .23, .21], lea = [.5, .38, .28];
  KIT.horse = {
    body: new PartBatch(S => {
      S.ico(.2, 0, 0, 0, hc, { sc: [.9, 1.0, 2.1], d: 1 }); S.ico(.2, 0, .02, .3, hc, { sc: [.96, 1.1, 1.0], d: 1 }); S.ico(.2, 0, .03, -.32, hc, { sc: [1.0, 1.08, 1.05], d: 1 });
      S.seg([0, .08, .4], [0, .47, .62], .14, .095, hc, { n: 6 }); S.seg([0, .5, .6], [0, .36, .86], .1, .062, hc, { n: 6 }); S.box(.095, .075, .085, 0, .33, .895, hd, {});
      for (const s of [-1, 1]) { S.cone(.03, .09, s * .05, .6, .585, hc, { n: 4 }); S.box(.02, .026, .022, s * .078, .47, .7, COL.black, { jit: 0 }); }
      for (let k = 0; k < 5; k++) { const t = .08 + .2 * k; S.box(.045, .11, .1, 0, .08 + .39 * t + .07, .4 + .22 * t - .1, hd, { r: [-.5, 0, 0] }); }
    }, 70, { rad: .3 }),
    leg: new PartBatch(S => { S.seg([0, 0, 0], [0, -.27, .015], .07, .046, hc, { n: 5 }); S.seg([0, -.27, .015], [0, -.5, 0], .042, .033, hc, { n: 5 }); S.box(.072, .05, .088, 0, -.52, .01, [.1, .09, .08], {}); }, 280, { rad: .06, shadow: false }),
    tail: new PartBatch(S => { S.seg([0, 0, 0], [0, -.14, -.12], .045, .05, hd, { n: 5 }); S.seg([0, -.14, -.12], [0, -.42, -.16], .05, .015, hd, { n: 5 }); }, 70, { rad: .06, shadow: false }),
    tack: new PartBatch(S => {
      S.box(.4, .03, .46, 0, .195, -.03, W, { l: L_CLOTH }); for (const s of [-1, 1]) S.box(.03, .2, .42, s * .2, .1, -.03, W, { l: L_CLOTH });
      S.box(.22, .07, .3, 0, .24, -.03, lea, {}); S.box(.24, .1, .05, 0, .275, .13, lea, {}); S.box(.24, .12, .05, 0, .285, -.19, lea, {});
      S.ico(.05, 0, -.03, .5, W, { d: 0, emis: .03 });
    }, 70, { rad: .25, shadow: false }),
    bard: new PartBatch(S => {
      const m1 = [.76, .76, .79], m2 = [.5, .5, .54], o = () => ({ l: L_METAL, rough: .42, jit: .03 });
      for (const s of [-1, 1]) { S.box(.03, .22, .92, s * .212, .04, 0, m1, o()); S.box(.032, .14, .92, s * .216, -.13, 0, m2, o()); }
      S.box(.44, .03, .42, 0, .21, -.4, m1, o()); S.box(.44, .32, .04, 0, -.03, .5, m1, o()); S.box(.44, .28, .04, 0, -.01, -.53, m2, o());
      S.seg([0, .1, .42], [0, .45, .62], .165, .118, m2, { n: 6, l: L_METAL, rough: .42 }); S.box(.11, .03, .25, 0, .475, .74, m1, { r: [.5, 0, 0], l: L_METAL, rough: .4 });
      S.box(.22, .07, .3, 0, .24, -.03, lea, {}); S.box(.24, .1, .05, 0, .275, .13, lea, {}); S.box(.24, .12, .05, 0, .285, -.19, lea, {});
    }, 14, { rad: .3, shadow: false }),
  };

  // ── 공성 병기 ──
  KIT.wheel = new PartBatch(S => {
    S.cyl(.2, .05, 0, 0, 0, [.4, .31, .21], { n: 10, r: [0, 0, HPI], l: L_WOOD }); S.cyl(.06, .09, 0, 0, 0, iron, { n: 6, r: [0, 0, HPI], l: L_METAL });
    for (let a = 0; a < 2; a++) S.box(.058, .38, .055, 0, 0, 0, [.62, .5, .36], { r: [a * HPI, 0, 0], l: L_WOOD });
  }, 80, { rad: .18 });
  // 충차: 지붕 덮은 수레 + 그 안에 매단 통나무 망치
  KIT.ram = {
    body: new PartBatch(S => {
      for (const s of [-1, 1]) S.box(.07, .07, 1.1, s * .25, .27, 0, wdD, { l: L_WOOD });
      for (const z of [-.46, .46]) { S.box(.58, .07, .07, 0, .27, z, wdD, { l: L_WOOD }); for (const s of [-1, 1]) S.seg([s * .28, .3, z], [0, .93, z], .032, .03, wdD, { l: L_WOOD, n: 4 }); }
      S.box(.06, .06, 1.08, 0, .94, 0, wdD, { l: L_WOOD });
      for (const s of [-1, 1]) { S.box(.67, .03, 1.0, s * .158, .665, 0, hide, { r: [0, 0, -s * 1.086], jit: .06 }); S.box(.1, .034, 1.02, s * .29, .41, 0, W, { r: [0, 0, -s * 1.086], l: L_CLOTH, emis: .02 }); }
    }, 30, { rad: .5 }),
    log: new PartBatch(S => {
      S.seg([0, 0, -.62], [0, 0, .7], .088, .088, [.46, .34, .22], { l: L_WOOD, n: 6 }); S.seg([0, 0, .7], [0, 0, .9], .1, .045, mulC(iron, 1.4), { l: L_METAL, n: 6, rough: .45 });
      S.seg([0, 0, .52], [0, 0, .6], .096, .096, mulC(iron, 1.4), { l: L_METAL, n: 6 });
      for (const z of [-.32, .32]) S.seg([0, .4, z], [0, .06, z], .012, .012, COL.rope, { n: 3 });
    }, 30, { rad: .3 }),
  };
  // 운제: 수레 위에 비스듬히 세운 공성 사다리(뒤에서 두 병사가 밀고 온다)
  KIT.ladder = new PartBatch(S => {
    const c = [.64, .52, .36], a = [0, .3, -.42], b = [0, 1.62, .78];
    for (const s of [-1, 1]) {
      S.box(.06, .06, .8, s * .2, .24, -.05, wdD, { l: L_WOOD });
      S.seg([s * .14, a[1], a[2]], [s * .14, b[1], b[2]], .028, .026, c, { l: L_WOOD, n: 4 });
      S.seg([s * .2, .26, .3], [s * .14, .95, .2], .024, .022, wdD, { l: L_WOOD, n: 4 });
      S.box(.03, .03, .12, s * .14, b[1] + .01, b[2] + .05, mulC(iron, 1.6), { l: L_METAL });
    }
    for (const z of [-.42, .3]) S.box(.46, .06, .06, 0, .24, z, wdD, { l: L_WOOD });
    for (let k = 1; k < 10; k++) { const t = k / 10; S.box(.28, .028, .03, 0, lerp(a[1], b[1], t), lerp(a[2], b[2], t), mulC(c, .85), { l: L_WOOD }); }
    S.box(.5, .03, .03, 0, .62, -.5, wdD, { l: L_WOOD }); for (const s of [-1, 1]) S.seg([s * .2, .26, -.42], [s * .23, .62, -.5], .02, .02, wdD, { l: L_WOOD, n: 4 });
  }, 30, { rad: .5 });
  // 누차: 바퀴 달린 공성탑(단위 크기 — def.scale 2.3배로 그린다)
  KIT.stower = new PartBatch(S => {
    S.box(.62, .07, .74, 0, .15, 0, wdD, { l: L_WOOD });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.seg([sx * .28, .18, sz * .33], [sx * .215, 1.04, sz * .255], .03, .026, wdD, { l: L_WOOD, n: 4 });
    S.box(.5, .42, .6, 0, .4, 0, wd, { l: L_WOOD, jit: .04 }); S.box(.44, .4, .52, 0, .8, 0, wd, { l: L_WOOD, jit: .04 });
    S.box(.54, .04, .64, 0, .61, 0, wdD, { l: L_WOOD }); S.box(.47, .84, .03, 0, .62, .3, hide, { r: [-.075, 0, 0], jit: .06 });
    S.box(.52, .05, .6, 0, 1.03, 0, wdD, { l: L_WOOD });
    for (const sx of [-1, 1]) { S.box(.03, .12, .6, sx * .25, 1.11, 0, wd, { l: L_WOOD }); S.seg([sx * .255, .22, -.28], [sx * .23, .6, .26], .016, .016, wdD, { l: L_WOOD, n: 4 }); S.seg([sx * .23, .62, .24], [sx * .22, 1.0, -.24], .016, .016, wdD, { l: L_WOOD, n: 4 }); }
    S.box(.52, .12, .03, 0, 1.11, -.29, wd, { l: L_WOOD });
    for (const x of [-.19, 0, .19]) S.box(.11, .15, .03, x, 1.125, .29, wd, { l: L_WOOD });
    S.box(.3, .34, .025, 0, .98, .345, wdD, { l: L_WOOD, r: [-.16, 0, 0] });
    S.box(.14, .2, .02, 0, .84, .262, COL.black, { jit: 0 });
    for (let k = 0; k < 6; k++) S.box(.16, .02, .02, 0, .26 + k * .13, -.31, wdD, { l: L_WOOD });
  }, 8, { rad: .6 });

  // ── 비행체 ──
  // 전투매 / 송골매
  KIT.bat = {
    body: new PartBatch(S => {
      const br = [.42, .31, .2], pale = [.8, .72, .58], dk = [.2, .15, .11];
      S.ico(.1, 0, 0, 0, br, { sc: [.8, .75, 1.5], d: 1, c2: [pale[0], pale[1], pale[2], v => smooth(.03, -.05, v.y)] }); S.ico(.062, 0, .04, .15, br, { d: 1 });
      S.cone(.024, .065, 0, .025, .225, [1.0, .75, .2], { n: 4, r: [HPI + .35, 0, 0] });
      for (const s of [-1, 1]) S.box(.02, .02, .02, s * .04, .055, .19, COL.black, { jit: 0 });
      const t0 = [0, 0, -.1], tl = [-.1, 0, -.36], tr = [.1, 0, -.36]; S.tri(t0, tl, tr, dk, L_PLAIN, .9); S.tri(t0, tr, tl, dk, L_PLAIN, .9);
    }, 50, { rad: .1 }),
    wing: new PartBatch(S => {
      const c = [.46, .34, .22], c2 = [.24, .18, .13], pts = [[0, 0, .09], [.22, .03, .13], [.54, .02, .03], [.5, 0, -.05], [.4, 0, -.06], [.3, 0, -.11], [.16, 0, -.1], [0, 0, -.1]];
      for (let i = 1; i < pts.length - 1; i++) { S.tri(pts[0], pts[i + 1], pts[i], i & 1 ? c : c2, L_PLAIN, .9); S.tri(pts[0], pts[i], pts[i + 1], i & 1 ? c : c2, L_PLAIN, .9); }
      S.seg([0, 0, .09], [.5, .02, .04], .016, .008, c2, { n: 3 });
    }, 100, { rad: .1 }),
  };
  // 대연(大鳶) 척후: 방패연(wing)과 그 아래 매달린 척후병(body)
  KIT.garg = {
    body: new PartBatch(S => {
      const cl = [.13, .13, .17], dk = [.07, .07, .09], hair = C(0x15110e);
      S.box(.2, .3, .13, 0, 0, 0, cl, { l: L_CLOTH }); S.box(.14, .15, .14, 0, .225, .01, skin, {}); S.box(.15, .06, .15, 0, .31, 0, hair, { jit: 0 });
      S.box(.15, .035, .15, 0, .27, 0, C(0xc0261e), { jit: 0, emis: .04 });
      for (const s of [-1, 1]) {
        S.seg([s * .11, .12, 0], [s * .2, .5, .04], .036, .03, cl, { n: 4 }); S.box(.05, .05, .05, s * .2, .53, .04, skin, {});
        S.seg([s * .06, -.15, 0], [s * .07, -.42, -.12], .05, .04, cl, { n: 4 }); S.seg([s * .07, -.42, -.12], [s * .07, -.6, -.3], .04, .034, dk, { n: 4 });
        S.seg([s * .26, .54, .04], [s * .32, 1.02, .1], .008, .008, COL.rope, { n: 3 });
      }
      S.seg([-.27, .54, .04], [.27, .54, .04], .015, .015, COL.woodL, { n: 4, l: L_WOOD });
    }, 24, { rad: .2 }),
    wing: new PartBatch(S => {
      // 마름모꼴의 큰 연: 앞·옆·뒤 꼭짓점과 대나무 살, 긴 꼬리 둘
      const pa = [1, 1, 1], pb = [.5, .5, .5], bam = [.42, .34, .2], o = { emis: .04 };
      const F = [0, 0, .62], Bk = [0, 0, -.72], Lf = [-.62, 0, .12], Rt = [.62, 0, .12], Cn = [0, .05, .1];
      for (const [p, q, c] of [[F, Rt, pa], [Rt, Bk, pb], [Bk, Lf, pa], [Lf, F, pb]]) { S.tri(Cn, p, q, c, L_CLOTH, .9, o); S.tri(Cn, q, p, c, L_CLOTH, .9, o); }
      S.seg([0, -.012, .62], [0, -.012, -.72], .014, .014, bam, { n: 3 }); S.seg([-.62, -.012, .12], [.62, -.012, .12], .014, .014, bam, { n: 3 });
      for (const s of [-1, 1]) ar_quad2(S, [s * .05, 0, -.7], [s * .11, 0, -.7], [s * .2, -.16, -1.35], [s * .14, -.16, -1.35], pa, L_CLOTH, .9, o);
    }, 24, { rad: .4, shadow: false }),
  };
  // 풍등: 불 밝힌 종이 등
  KIT.wisp = { core: new PartBatch(S => {
    const paper = [1, .82, .52];
    S.cyl(.07, .2, 0, .02, 0, paper, { n: 6, rt: 1.5, emis: .42, jit: 0 }); S.add(gDome(6, 2), { s: [.105, .06, .105], p: [0, .12, 0], c: paper, emis: .36, jit: 0 });
    S.cyl(.074, .014, 0, -.08, 0, [.2, .14, .08], { n: 6, jit: 0 }); S.ico(.03, 0, -.06, 0, [1, .6, .2], { d: 0, emis: 1, jit: 0 });
  }, 60, { rad: .08, shadow: false }) };
}

// ── 리그 ──
// 말. e.coat = 털빛 tint, e.tack = 마구/마갑 tint. 안장 행렬을 돌려준다(rigHuman의 e.mount로 넘긴다).
function ar_rigHorse(e, bard) {
  const K = KIT.horse, hs = e.hs || 1.34, s = (e.scale || 1) * hs, fl = e.flash || 0, mv = e.mv, ph = e.ph, fz = e.flinch || 0, coat = e.coat || null;
  const bob = Math.abs(Math.sin(ph)) * .045 * mv, pit = Math.sin(ph * 2) * .035 * mv - fz * .2;
  const H = xf(_M[14], null, e.x, e.y + (.615 + bob) * s, e.z, pit, e.yaw, 0, s, s, s);
  K.body.put(H, fl, coat); (bard ? K.bard : K.tack).put(H, fl, e.tack || null);
  for (let i = 0; i < 4; i++) {
    const fr = i < 2, sd = (i & 1) ? -1 : 1, a = Math.sin(ph + ((fr === (sd > 0)) ? 0 : PI) + (fr ? 0 : .5)) * .62 * mv;
    K.leg.put(xf(_M[15], H, sd * .1, -.07, fr ? .27 : -.3, a - pit, 0, 0), fl, coat);
  }
  K.tail.put(xf(_M[15], H, 0, .1, -.5, -.1 + Math.sin(ph * 2) * .15 * mv, Math.sin(ph + 1) * .25 * mv, 0), fl, coat);
  return xf(_M[16], H, 0, .255, -.03, -pit * .6, 0, 0, 1 / hs, 1 / hs, 1 / hs);   // 기수는 말보다 작게(사람 크기 그대로)
}
// 기병: 말 + 그 위에 앉은 사람
function ar_rigRider(e, bard) {
  e.mount = ar_rigHorse(e, bard);
  return rigHuman(KIT.man, SPEC.man, e);
}
// 충차: e.hop(밀고-멈추는 박자)에 맞춰 통나무가 앞뒤로 흔들린다
function ar_rigRam(e) {
  const K = KIT.ram, s = e.scale || 1, fl = e.flash || 0, h = e.hop || 0, fz = e.flinch || 0;
  const heave = (h > .22 && h < .62) ? Math.sin((h - .22) / .4 * PI) : 0, swing = Math.sin(h * TAU) * .13;
  const M0 = xf(_M[14], null, e.x, e.y, e.z, -heave * .03 - fz * .05, e.yaw, Math.sin(e.ph * .5) * .012, s, s, s);
  K.body.put(M0, fl, e.tint);
  K.log.put(xf(_M[15], M0, 0, .52, .04 + swing, 0, 0, 0), fl, null);
  const rot = e.ph / (5.6 * .2);
  for (let i = 0; i < 4; i++) KIT.wheel.put(xf(_M[15], M0, (i & 1 ? -1 : 1) * .34, .2, i < 2 ? .36 : -.36, rot, 0, 0), fl, null);
  return M0;
}
// 운제: 사다리 수레를 앞세우고 두 병사가 뒤에서 나란히 민다
function ar_rigLadder(e) {
  const s = e.scale || 1, x0 = e.x, z0 = e.z, ph0 = e.ph, fl = e.flash || 0, sy = Math.sin(e.yaw), cy = Math.cos(e.yaw);
  for (const sd of [-1, 1]) {
    e.x = x0 + (-sy * .62 + cy * sd * .21) * s; e.z = z0 + (-cy * .62 - sy * sd * .21) * s; e.ph = ph0 + (sd > 0 ? 0 : PI);
    rigHuman(KIT.man, SPEC.man, e);
  }
  e.x = x0; e.z = z0; e.ph = ph0;
  const M0 = xf(_M[14], null, x0 + sy * .12 * s, e.y, z0 + cy * .12 * s, -(e.flinch || 0) * .06, e.yaw, Math.sin(ph0 * .5) * .012 * e.mv, s, s, s);
  KIT.ladder.put(M0, fl, e.tintW || null);
  const rot = ph0 / (5.6 * .2);
  for (const sd of [-1, 1]) KIT.wheel.put(xf(_M[15], M0, sd * .27, .2, -.05, rot, 0, 0), fl, null);
  return M0;
}
// 누차: 천천히 굴러오는 공성탑. e.flagB = 꼭대기 깃발 PartBatch
function ar_rigTower(e) {
  const s = e.scale || 1, fl = e.flash || 0, fz = e.flinch || 0;
  const M0 = xf(_M[14], null, e.x, e.y, e.z, -fz * .03, e.yaw, Math.sin(e.ph * .7) * .012 * e.mv, s, s, s);
  KIT.stower.put(M0, fl, e.tint);
  const rot = e.ph / (5.6 * .11);
  for (let i = 0; i < 4; i++) KIT.wheel.put(xf(_M[15], M0, (i & 1 ? -1 : 1) * .33, .11, i < 2 ? .25 : -.25, rot, 0, 0, .55, .55, .55), fl, null);
  if (e.flagB) e.flagB.put(xf(_M[15], M0, 0, .98, .02, 0, 0, 0, .42, .42, .42), 0, null);
  return M0;
}
// 대연 척후: 비스듬히 뜬 방패연 아래 사람이 매달려 흔들린다
function ar_rigKite(e) {
  const K = KIT.garg, s = e.scale || 1, fl = e.flash || 0, t = e.ph, fz = e.flinch || 0;
  const M0 = xf(_M[0], null, e.x, e.y + Math.sin(t * .5) * .1, e.z, 0, e.yaw, Math.sin(t * .31) * .12, s, s, s);
  K.wing.put(xf(_M[1], M0, 0, .5, .12, -.26 + Math.sin(t * .8) * .07 + fz * .4, 0, 0), fl, e.tint);
  K.body.put(xf(_M[2], M0, 0, -.5, 0, .28 + Math.sin(t * .5 + 1) * .1, 0, 0), fl, null);
  return M0;
}
// 풍등: 불빛이 일렁이며 떠간다
function rigWisp(e) {
  const t = SH.uTime.value + (e.lseed || 0), s = (e.scale || 1) * (1 + .05 * Math.sin(t * 9));
  const M0 = xf(_M[0], null, e.x, e.y, e.z, Math.sin(t * 1.7) * .12, e.yaw, Math.sin(t * 1.3) * .12, s, s, s); KIT.wisp.core.put(M0, e.flash || 0, e.tint); return M0;
}
