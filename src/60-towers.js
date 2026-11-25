
const G = {
  B: null, t: 0, gold: 0, lives: 20, maxLives: 20, wave: 0, slain: 0, level: 0, run: 1,
  towers: [], mons: [], men: [], arrows: [], shells: [], stuck: [], hbars: [], phase: 'play',
};
// 이름·설명 문구는 고증 검수(_workspace/01_lore_review.md)의 확정표를 따른다. 한 줄 14자 이내.
// 종류 키·비용·사거리·피해·발사 수치는 원작 그대로(밸런스·AI 군사가 키에 묶여 있다). 이름과 설명만 시대별로 바뀐다.
const TOWER = {
  archer: {
    name: '망루', short: '망루', icon: 'archer', cost: [70, 90, 140], range: [6.2, 6.8, 7.4], dmg: [9, 11, 14], rate: [.85, .78, .7], n: [1, 2, 3], air: true, ground: true, light: [80, 105, 140],
    desc: ['빠르게 쏘는 불화살.', '나는 적도 맞힌다.'],
    eras: {
      goguryeo: { name: '맥궁 망루', short: '맥궁', desc: ['빠르게 쏘는 불화살.', '나는 적도 맞힌다.'] },
      goryeo: { name: '각궁 망루', short: '각궁', desc: ['빠르게 쏘는 불화살.', '나는 적도 맞힌다.'] },
      joseon: { name: '편전 망루', short: '편전', desc: ['빠르고 멀리 가는 애기살.', '나는 적도 맞힌다.'] },
    },
  },
  bombard: {
    name: '포차', short: '포차', icon: 'bombard', cost: [120, 130, 190], range: [7.4, 8.0, 8.6], minRange: 2.3, dmg: [36, 60, 98], splash: [1.55, 1.8, 2.1], rate: [2.9, 2.7, 2.5], air: false, ground: true, light: [50, 62, 80],
    desc: ['돌과 불 단지를 날린다.', '땅 위의 적만 맞힌다.'],
    eras: {
      goguryeo: { name: '포차', short: '포차', desc: ['돌과 불 단지를 날린다.', '땅 위의 적만 맞힌다.'] },
      goryeo: { name: '포차', short: '포차', desc: ['큰 돌과 쇳물을 날린다.', '땅 위의 적만 맞힌다.'] },
      joseon: { name: '총통 포대', short: '총통', desc: ['총통과 진천뢰로 포격한다.', '땅 위의 적만 맞힌다.'] },
    },
  },
  spire: {
    name: '벼락 솟대', short: '솟대', icon: 'spire', cost: [110, 120, 180], range: [5.5, 6.0, 6.5], dmg: [17, 25, 35], jumps: [3, 4, 6], rate: [2.3, 2.1, 1.9], slow: [.36, .42, .48], slowT: [1.3, 1.5, 1.7], air: true, ground: true, light: [16, 20, 26],
    desc: ['벼락이 번져 적을 늦춘다.', '나는 적도 맞힌다.'],
    eras: {
      goguryeo: { name: '벼락 솟대', short: '솟대', desc: ['벼락이 번져 적을 늦춘다.', '나는 적도 맞힌다.'] },
      goryeo: { name: '벼락 솟대', short: '솟대', desc: ['벼락이 번져 적을 늦춘다.', '나는 적도 맞힌다.'] },
      joseon: { name: '벼락 솟대', short: '솟대', desc: ['벼락이 번져 적을 늦춘다.', '나는 적도 맞힌다.'] },
    },
  },
  guard: {
    name: '초소', short: '초소', icon: 'guard', cost: [80, 90, 150], range: [3.4, 3.7, 4.0], n: [2, 3, 3], hp: [62, 90, 135], dmg: [7, 10, 15], rate: [7, 6, 5], air: false, ground: true, light: [55, 70, 90],
    desc: ['병사들이 길을 막고', '적과 맞서 싸운다.'],
    eras: {
      goguryeo: { name: '창병 초소', short: '창병', desc: ['창병이 길을 막고', '적과 맞서 싸운다.'] },
      goryeo: { name: '별초 초소', short: '별초', desc: ['별초가 길을 막고', '적과 맞서 싸운다.'] },
      joseon: { name: '의병 초소', short: '의병', desc: ['의병이 길을 막고', '적과 맞서 싸운다.'] },
    },
  },
};
const TOWER_KINDS = ['archer', 'bombard', 'spire', 'guard'];

// ── 한국 건축 헬퍼 (tw_ = tower-architect) ──────────────────────────────────
// 시대별 건축 팔레트. 깃발·단청·방패색은 ERA 표(src/05-lore.js)에서 가져오고,
// 기와·기둥·벽처럼 표에 없는 재료색만 여기서 정한다.
const tw_PAL = {};
const tw_OBANG = [0x2f62b0, 0xc23a2e, 0xdcae3c, 0xe9e3d3, 0x3a3944];   // 오방색: 청·적·황·백·흑
function tw_pal(era) {
  if (!ERA[era]) era = 'joseon';
  if (tw_PAL[era]) return tw_PAL[era];
  const E = ERA[era], main = C(E.main), sub = C(E.sub), trim = C(E.trim), p = { era, main, sub, trim };
  if (era === 'goguryeo') Object.assign(p, {           // 붉은 기둥, 먹빛 기와 맞배지붕, 금빛 치미
    gable: true, pillar: mulC(main, 1.1), band: mulC(main, 1.3), band2: trim,
    tile: mixC(sub, COL.slate, .62), ridge: mixC(sub, COL.slate, .3), ridgeEnd: trim,
    wall: C(0xb6a583), flag: mulC(main, 1.35), flag2: trim, shield: mulC(main, 1.25), shield2: trim,
  });
  else if (era === 'goryeo') Object.assign(p, {        // 청자빛 기와, 미색 벽과 용마루
    gable: false, pillar: C(0x8a3324), band: mulC(main, 1.2), band2: trim,
    tile: mulC(main, .9), ridge: mulC(sub, .8), ridgeEnd: trim,
    wall: mulC(sub, .78), flag: mulC(main, 1.3), flag2: mulC(sub, .95), shield: mulC(main, 1.15), shield2: trim,
  });
  else Object.assign(p, {                              // 검은 기와 우진각, 흰 양성바름 마루, 뇌록·석간주 단청
    gable: false, pillar: mulC(sub, .85), band: C(0x2f7a5e), band2: mulC(sub, 1.2),
    tile: C(0x353c4c), ridge: mulC(trim, .85), ridgeEnd: trim,
    wall: mulC(trim, .8), flag: mulC(main, 1.7), flag2: mulC(sub, 1.25), shield: mulC(main, 1.5), shield2: mulC(sub, 1.2),
  });
  return tw_PAL[era] = p;
}
// 처마 귀가 들린 기와지붕. ax/az = 처마 반폭(x/z), y = 처마 높이, h = 물매 높이.
// gable = 맞배(용마루가 x 전체), 아니면 우진각(rl = 용마루 반길이, 0이면 모임지붕).
// 윗면과 밑면을 모두 그려 어느 각도에서도 뚫려 보이지 않는다.
function tw_roof(S, o) {
  const ax = o.ax, az = o.az, y = o.y, h = o.h, cx = o.x || 0, cz = o.z || 0, gable = !!o.gable;
  const rl = gable ? ax : (o.rl === undefined ? Math.max(ax - az * .75, ax * .26) : o.rl);
  const lift = o.lift === undefined ? .16 : o.lift, sag = o.sag === undefined ? .09 : o.sag, nu = o.nu || 6, nv = 3;
  const col = o.col, colB = mulC(col, .76), under = o.under || mulC(COL.woodD, .9), lay = o.l === undefined ? L_SLATE : o.l, rough = o.rough === undefined ? .8 : o.rough;
  // 이끼·눈·재·모래 덮개(uCover)가 기와색을 다 가리지 않도록 아주 약한 발광을 준다(발광이 있으면 덮개가 줄어든다).
  const em = o.emis === undefined ? (curBio().key === 'frost' ? .011 : .017) : o.emis, eo = { emis: em };
  const yAt = (c, v) => y + h * v - sag * 4 * v * (1 - v) + lift * Math.abs(c * c * c) * (1 - v) * (1 - v);
  const pt = (f, u, v) => {
    const ex = lerp(f[0][0], f[1][0], u), ez = lerp(f[0][1], f[1][1], u), rx = lerp(f[2][0], f[3][0], u), rz = lerp(f[2][1], f[3][1], u);
    return [cx + lerp(ex, rx, v), yAt(2 * u - 1, v), cz + lerp(ez, rz, v)];
  };
  const both = (a, b, c, k, l, r) => { S.tri(a, b, c, k, l, r); S.tri(a, c, b, k, l, r); };
  const up = (a, b, c, k) => {
    const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    if (ny >= 0) { S.tri(a, b, c, k, lay, rough, eo); S.tri(a, c, b, under, L_WOOD, .95); } else { S.tri(a, c, b, k, lay, rough, eo); S.tri(a, b, c, under, L_WOOD, .95); }
  };
  const F = [[[-ax, az], [ax, az], [-rl, 0], [rl, 0]], [[ax, -az], [-ax, -az], [rl, 0], [-rl, 0]]];
  if (!gable) F.push([[ax, az], [ax, -az], [rl, 0], [rl, 0]], [[-ax, -az], [-ax, az], [-rl, 0], [-rl, 0]]);
  for (const f of F) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv, k = (i & 1) ? colB : col;
    const a = pt(f, u0, v0), b = pt(f, u1, v0), c = pt(f, u1, v1), d = pt(f, u0, v1);
    up(a, b, c, k); up(a, c, d, k);
    if (j === 0 && o.fascia) { const dn = o.fasciaH || .07, a2 = [a[0], a[1] - dn, a[2]], b2 = [b[0], b[1] - dn, b[2]]; both(a, b, b2, o.fascia, L_WOOD, .9); both(a, b2, a2, o.fascia, L_WOOD, .9); }   // 처마 끝 단청 띠
  }
  const rc = o.ridge || colB, re = o.ridgeEnd || rc, ry = y + h;
  if (rl > .05) {                                       // 용마루와 양끝 치미/망와
    S.box(rl * 2 + .08, .1, .12, cx, ry + .03, cz, rc, { l: L_SLATE, jit: 0, emis: em });
    if (o.ends !== false) for (const s of [-1, 1]) S.box(.12, o.orn ? .26 : .16, .15, cx + s * (rl + .01), ry + (o.orn ? .11 : .06), cz, re, { l: L_SLATE, r: [0, 0, -s * .28], jit: 0, emis: em });
  } else { S.cyl(.09, .14, cx, ry + .05, cz, rc, { n: 6, l: L_SLATE }); S.sph(.075, cx, ry + .17, cz, re, { w: 6, h: 4, smooth: false, l: L_SLATE }); }   // 절병통
  if (!gable && o.hips !== false) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // 추녀마루
    let p = [cx + sx * rl, ry + .02, cz];
    for (const v of [.5, 0]) { const q = [cx + sx * lerp(ax, rl, v), yAt(1, v) + .03, cz + sz * az * (1 - v)]; S.seg(p, q, .045, .045, rc, { n: 4, l: L_SLATE, emis: em }); p = q; }
    if (o.orn) S.box(.1, .12, .1, p[0], p[1] + .04, p[2], re, { l: L_SLATE, jit: 0 });
  }
  if (gable) for (const s of [-1, 1]) {                 // 박공: 합각벽과 박공널
    const gx = cx + s * (ax - (o.gin === undefined ? .14 : o.gin)), gc = o.gableCol || under, Y = v => y + h * v - sag * 4 * v * (1 - v) - .03;
    const A = [gx, Y(1), cz], Cb = [gx, Y(0), cz];
    for (const t of [-1, 1]) { const P0 = [gx, Y(0), cz + t * az * .97], P1 = [gx, Y(.5), cz + t * az * .5]; both(Cb, P0, P1, gc, L_PLAIN, .95); both(Cb, P1, A, gc, L_PLAIN, .95); }
    for (const t of [-1, 1]) { let p = [cx + s * ax, ry, cz]; for (const v of [.5, 0]) { const q = [cx + s * ax, yAt(1, v) - .01, cz + t * az * (1 - v)]; S.seg(p, q, .04, .04, o.fascia || rc, { n: 4, l: L_WOOD }); p = q; } }
  }
}
// 천 조각에 약한 발광을 준다: 불빛이 닿지 않는 높은 깃발도 밤에 제 색으로 읽힌다.
function tw_glow(T, e) { for (let i = 3; i < T.S.length; i += 4) T.S[i] = e; return T; }
// 깃대와 군기. 바탕은 시대 주색, 가운데 문양 자리는 보조/장식색.
function tw_flag(S, x, y0, y1, z, P, o = {}) {
  S.seg([x, y0, z], [x, y1, z], .04, .028, COL.woodD, { l: L_WOOD, n: 4 });
  S.sph(.05, x, y1 + .03, z, P.trim, { l: L_METAL, w: 5, h: 3, smooth: false });
  const T = new Soup(); clothPanel(T, { x0: 0, x1: o.w || .62, yTop: 0, len: o.len || .4, z: 0, col: P.flag, col2: P.flag2, rng: soupRng, nx: 4, ny: 3, rag: 0, sway: 1.15 });
  S.merge(tw_glow(T, .04), { p: [x + .03, y1 - .05, z], ao: null });
}
// 솟대의 나무 새(오리). 몸통이 +z를 본다. s = 몸 크기.
function tw_bird(S, x, y, z, s, yaw, c, lay) {
  const T = new Soup(), c2 = mulC(c, .68), o = () => ({ l: lay === undefined ? L_WOOD : lay, jit: 0 });
  T.ico(s, 0, 0, 0, c, Object.assign(o(), { sc: [.5, .48, 1.15], d: 1 }));
  T.seg([0, .12 * s, .7 * s], [0, .85 * s, 1.05 * s], .2 * s, .15 * s, c, Object.assign(o(), { n: 5 }));
  T.ico(.27 * s, 0, .95 * s, 1.12 * s, c, Object.assign(o(), { sc: [.9, .9, 1.15], d: 1 }));
  T.cone(.1 * s, .5 * s, 0, .9 * s, 1.62 * s, c2, Object.assign(o(), { n: 4, r: [HPI, 0, 0] }));
  T.box(.46 * s, .08 * s, .75 * s, 0, .27 * s, -1.2 * s, c2, Object.assign(o(), { r: [.5, 0, 0] }));
  S.merge(T, { p: [x, y, z], ry: yaw || 0, ao: null });
}
// 불항아리(포차의 탄과 포대 위 장식).
function tw_jar(S, x, y, z, s, lit) {
  const clay = C(0x8a5636);
  S.sph(.13 * s, x, y + .12 * s, z, clay, { sc: [1, .92, 1], w: 7, h: 5, smooth: false, rough: .7 });
  S.cyl(.075 * s, .07 * s, x, y + .25 * s, z, mulC(clay, .7), { n: 6 });
  if (lit) S.box(.05 * s, .05 * s, .05 * s, x, y + .3 * s, z, COL.ember, { emis: 1, jit: 0 }); else S.cyl(.085 * s, .025 * s, x, y + .295 * s, z, COL.clothT, { n: 6, l: L_CLOTH });
}
// 쇳물 솥(고려 포차의 탄): 검은 무쇠 솥에 벌겋게 끓는 쇳물.
function tw_pot(S, x, y, z, s) {
  S.sph(.13 * s, x, y + .11 * s, z, mulC(COL.iron, .9), { sc: [1, .85, 1], w: 7, h: 5, smooth: false, l: L_METAL, rough: .6 });
  S.cyl(.12 * s, .04 * s, x, y + .2 * s, z, COL.iron, { n: 8, l: L_METAL });
  S.cyl(.1 * s, .03 * s, x, y + .225 * s, z, COL.ember, { n: 8, emis: 1, jit: 0 });
}

// 조각 구조(id·순서·바닥 높이)는 건설·증축·철거 연출이 그대로 쓰므로 원작 규약을 지킨다.
// era는 타워가 지어진 시대(Tower.era). 같은 조각이라도 시대별로 지붕·색·무기가 달라진다.
function blueprint(kind, lvl, era) {
  const pieces = [], mounts = {};
  const piece = (id, order, fn) => {
    const S = new Soup(); fn(S); if (!S.verts) return; let minY = 1e9; for (let i = 1; i < S.P.length; i += 3) minY = Math.min(minY, S.P[i]);
    for (let i = 1; i < S.P.length; i += 3) S.P[i] -= minY; pieces.push({ id, order, y: minY, soup: S });
  };
  const P = tw_pal(era || curEra());
  const w = COL.wood, wd = COL.woodD, wl = COL.woodL, st = COL.stone, sdk = COL.stoneD, sl = COL.stoneL, iron = COL.iron, rng = soupRng;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const brazier = (S, x, y, z, bs) => {                 // 화톳불: 세 발 쇠 받침과 불 바구니
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5; S.seg([x + Math.cos(a) * bs * .42, y, z + Math.sin(a) * bs * .42], [x + Math.cos(a) * bs * .2, y + bs * .5, z + Math.sin(a) * bs * .2], .028, .028, iron, { l: L_METAL, n: 4 }); }
    S.cyl(bs * .3, bs * .22, x, y + bs * .56, z, iron, { n: 8, l: L_METAL, rt: 1.5, rough: .6 });
    S.cyl(bs * .4, .04, x, y + bs * .68, z, COL.ember, { n: 8, emis: .55, jit: 0 });
  };
  if (kind === 'archer') {
    // 망루: 돌 기단 → 붉은 기둥 → 마루와 난간 → 누각 기둥과 기와지붕. 화톳불은 처마 밖 받침 위.
    const bH = [.25, 1.0, 1.9][lvl], H = [2.0, 2.7, 3.35][lvl], W = [.75, .85, .93][lvl], bs = [.5, .62, .8][lvl];
    const cw = W - .1, ht = cw + .1, hb = ht / .92, y0 = H + .1, eY = y0 + 1.5, rh = [.55, .62, .72][lvl], ax = W + (P.gable ? .3 : .42), az = W + .42;
    const hwAt = y => lerp(hb, ht, sat((y - .3) / (bH - .3)));
    piece('base', 0, S => {
      if (lvl === 0) { S.box(1.7, .25, 1.7, 0, .125, 0, sdk, { l: L_MASON }); for (const [a, b] of corners) S.box(.32, .3, .32, a * (cw + .03), .17, b * (cw + .03), sl, { l: L_MASON }); }
      else {
        S.box(hb * 2 + .12, .3, hb * 2 + .12, 0, .15, 0, sdk, { l: L_MASON });
        S.cyl(hb * 1.4142, bH - .3, 0, .3 + (bH - .3) / 2, 0, st, { n: 4, l: L_MASON, rt: .92, r: [0, PI / 4, 0] });
        S.box(ht * 2 + .08, .14, ht * 2 + .08, 0, bH - .04, 0, sl, { l: L_MASON });
        S.box(.34, .52, .08, 0, .56, hwAt(.56) - .01, COL.black, { jit: 0 }); S.box(.5, .09, .1, 0, .87, hwAt(.87), sl, { l: L_MASON });
        if (lvl === 2) {
          for (const [a, b] of corners) for (let q = 0; q < 3; q++) { const y = .5 + q * .5, hw = hwAt(y) - .06; S.box(.22, .2, .22, a * hw, y, b * hw, sl, { l: L_MASON }); }
          for (const sg of [-1, 1]) S.box(.06, .5, .12, sg * hwAt(1.1), 1.1, 0, COL.black, { jit: 0 });
        }
      }
    });
    piece('posts', 1, S => {
      for (const [a, b] of corners) S.seg([a * (cw + .04), bH, b * (cw + .04)], [a * cw, H, b * cw], .09, .08, P.pillar, { l: L_WOOD });
      const ym = (bH + H) / 2, r = cw + .02;
      for (let k = 0; k < 4; k++) { const [a, b] = corners[k], [c, d] = corners[(k + 1) % 4]; S.seg([a * r, ym, b * r], [c * r, ym, d * r], .05, .05, wd, { l: L_WOOD, n: 4 }); }
    });
    piece('brace', 2, S => {
      for (let k = 0; k < 4; k++) { const [a, b] = corners[k], [c, d] = corners[(k + 1) % 4]; S.seg([a * cw, bH + .1, b * cw], [c * cw, H - .15, d * cw], .035, .035, w, { l: L_WOOD, n: 4 }); S.seg([c * cw, bH + .1, d * cw], [a * cw, H - .15, b * cw], .035, .035, wl, { l: L_WOOD, n: 4 }); }
    });
    const bx = -(W + .6), bz = .12, by = y0;
    piece('deck', 3, S => {
      S.box(W * 2 + .16, .1, W * 2 + .16, 0, H + .05, 0, w, { l: L_WOOD });
      for (const sg of [-1, 1]) { S.box(W * 2 + .3, .09, .1, 0, H - .04, sg * cw, wd, { l: L_WOOD }); S.box(.1, .09, W * 2 + .3, sg * cw, H - .04, 0, wd, { l: L_WOOD }); }
      for (const sg of [-1, 1]) { S.box(W * 2 + .22, .08, .04, 0, H + .05, sg * (W + .09), P.band, { jit: 0 }); S.box(.04, .08, W * 2 + .22, sg * (W + .09), H + .05, 0, P.band, { jit: 0 }); }   // 마루 귀틀 단청
      if (lvl >= 1) for (const [a, b] of corners) S.seg([a * cw, H - .55, b * cw], [a * (W + .06), H - .02, b * (W + .06)], .04, .04, wd, { l: L_WOOD, n: 4 });
      S.box(.66, .06, .52, bx + .12, H + .07, bz, w, { l: L_WOOD }); S.seg([-cw, H - .55, bz], [bx, H + .03, bz], .04, .04, wd, { l: L_WOOD, n: 4 });   // 화톳불 받침
    });
    piece('rail', 4, S => {
      const rr2 = W + .02;
      const bar = (k, u0, u1) => {                      // 평난간 한 칸: 돌란대(붉은 칠) + 청판 + 하방
        const ang = k * HPI, cs = Math.cos(ang), sn = Math.sin(ang), u = (u0 + u1) / 2, len = u1 - u0, x = u * cs + rr2 * sn, z = -u * sn + rr2 * cs, o = () => ({ l: L_WOOD, r: [0, ang, 0] });
        S.box(len, .05, .07, x, y0 + .44, z, P.pillar, o()); S.box(len, .05, .06, x, y0 + .1, z, wd, o()); S.box(len - .04, .28, .03, x, y0 + .27, z, wl, o());
        for (const e of [u0 + .03, u1 - .03]) S.box(.06, .5, .06, e * cs + rr2 * sn, y0 + .25, -e * sn + rr2 * cs, wd, o());
      };
      for (let k = 0; k < 4; k++) { if (k === 2) { bar(k, -W, -W * .42); bar(k, W * .42, W); } else bar(k, -W, W); }
      if (lvl >= 1) for (const u of lvl === 2 ? [-.5, 0, .5] : [-.35, .35]) { S.box(.26, .36, .04, u, y0 + .25, W + .09, P.shield, { l: L_WOOD, jit: 0 }); S.box(.27, .06, .05, u, y0 + .27, W + .095, P.shield2, { l: L_METAL, jit: 0, rough: .5 }); }
      if (lvl === 2) { S.box(.04, .36, .26, W + .09, y0 + .25, .1, P.shield, { l: L_WOOD, jit: 0 }); S.box(.05, .06, .27, W + .095, y0 + .27, .1, P.shield2, { l: L_METAL, jit: 0, rough: .5 }); }
    });
    piece('ladder', 5, S => {
      for (const sg of [-1, 1]) S.seg([sg * .17, 0, -W - .5], [sg * .17, H + .15, -W - .06], .035, .035, wd, { l: L_WOOD, n: 4 });
      for (let y = .3; y < H; y += .34) { const u = y / (H + .15); S.box(.36, .04, .05, 0, y, lerp(-W - .5, -W - .06, u), wl, { l: L_WOOD }); }
    });
    piece('pillars', 6, S => {                          // 누각 기둥과 창방(단청 띠)
      for (const [a, b] of corners) S.seg([a * cw, y0, b * cw], [a * cw, eY, b * cw], .075, .07, P.pillar, { l: L_WOOD });
      for (const sg of [-1, 1]) {
        S.box(cw * 2 + .3, .13, .1, 0, eY - .08, sg * cw, P.band, { l: L_WOOD, jit: 0 }); S.box(.1, .13, cw * 2 + .3, sg * cw, eY - .08, 0, P.band, { l: L_WOOD, jit: 0 });
        S.box(.36, .135, .11, 0, eY - .08, sg * cw, P.band2, { jit: 0 }); S.box(.11, .135, .36, sg * cw, eY - .08, 0, P.band2, { jit: 0 });
      }
      if (lvl >= 1) for (const [a, b] of corners) S.box(.25, .1, .25, a * cw, eY - .21, b * cw, P.band2, { jit: 0 });   // 주두
    });
    piece('roof', 7, S => tw_roof(S, { ax, az, y: eY, h: rh, gable: P.gable, col: P.tile, ridge: P.ridge, ridgeEnd: P.ridgeEnd, fascia: P.band, gableCol: P.wall, orn: lvl === 2, lift: .14 + lvl * .03 }));
    piece('brazier', 8, S => brazier(S, bx, by, bz, bs));
    if (lvl >= 1) piece('flag', 9, S => tw_flag(S, 0, eY + rh, eY + rh + 1.15, 0, P));
    mounts.flame = [bx, by + bs * .7, bz]; mounts.flameSize = bs; mounts.top = eY + rh + (lvl ? 1.1 : .25);
    mounts.archers = [[[.12, H + .1, .28]], [[-.3, H + .1, .42], [.42, H + .1, .1]], [[-.35, H + .1, .5], [.5, H + .1, .3], [.25, H + .1, -.4]]][lvl];
  } else if (kind === 'bombard') {
    // 포대: 여장을 두른 팔각 석축. 고구려·고려는 그 위에 포차(투석기), 조선은 총통.
    const Rr = [1.0, 1.08, 1.15][lvl], H = [1.1, 1.5, 1.9][lvl], treb = P.era !== 'joseon', q8 = PI / 8, RT = .88;
    const rAt = y => Rr * (1 - (1 - RT) * y / H), oct = () => ({ n: 8, l: L_MASON, r: [0, q8, 0] });
    piece('plinth', 0, S => { S.cyl(Rr + .22, .26, 0, .13, 0, sdk, oct()); if (lvl === 2) S.cyl(Rr + .12, .2, 0, .36, 0, st, oct()); });
    piece('drum', 1, S => {
      S.cyl(Rr, H, 0, H / 2, 0, st, Object.assign(oct(), { rt: RT, jit: .03 }));
      for (let c = 0; c < 2 + lvl; c++) { const y = .35 + c * (H - .5) / (1.5 + lvl); S.cyl(rAt(y) + .012, .16, 0, y, 0, mixC(sdk, sl, rng()), oct()); }
      S.box(.34, .55, .1, 0, .3, rAt(.3) * .924 - .01, COL.black, { jit: 0 });
    });
    if (lvl >= 1) piece('butt', 2, S => { for (let k = 0; k < 4; k++) { const a = k * HPI + PI / 4, d = Rr * .9 + .05; S.box(.38, H * .8, .5, Math.cos(a) * d, H * .36, Math.sin(a) * d, sdk, { l: L_MASON, r: [0, -a + HPI, 0] }); S.box(.42, .12, .56, Math.cos(a) * d, H * .78, Math.sin(a) * d, sl, { l: L_MASON, r: [0, -a + HPI, 0] }); } });
    if (lvl >= 1) piece('bands', 3, S => { for (const y of lvl === 2 ? [H * .45, H * .8] : [H * .65]) S.cyl(rAt(y) + .03, .08, 0, y, 0, sl, oct()); });   // 장대석 띠
    piece('deck', 4, S => { S.cyl(Rr * RT + .16, .16, 0, H + .02, 0, sl, oct()); S.cyl(Rr * .78, .06, 0, H + .12, 0, w, { n: 8, l: L_WOOD, r: [0, q8, 0] }); });
    piece('rim', 5, S => {                              // 여장과 옥개석
      for (let k = 0; k < 8; k++) {
        if (k === 2 || k === 6) continue; const a = k * TAU / 8, d = Rr * RT * .924 + .05, o = () => ({ l: L_MASON, r: [0, -a + HPI, 0] });
        S.box(.56, .3, .2, Math.cos(a) * d, H + .25, Math.sin(a) * d, mixC(sdk, sl, rng()), o()); S.box(.62, .07, .28, Math.cos(a) * d, H + .43, Math.sin(a) * d, lvl === 2 ? P.tile : sdk, o());
      }
    });
    piece('ammo', 6, S => {
      const ball = treb ? mulC(sl, .9) : mulC(iron, .8), lay = treb ? L_ROCK : L_METAL, br = treb ? .1 : .09;
      for (const [x, z] of [[-.45, -.5], [-.27, -.56], [-.36, -.42]]) S.sph(br, x, H + .13 + br, z, ball, { l: lay, w: 6, h: 4, smooth: false });
      S.sph(br, -.36, H + .13 + br * 2.5, -.5, ball, { l: lay, w: 6, h: 4, smooth: false });
      if (treb) { tw_jar(S, .46, H + .15, -.5, 1.05); tw_jar(S, .25, H + .15, -.6, .85); } else PROP.barrel(S, .45, H + .13, -.52, .75, rng);
    });
    const lx = -Rr * .8, lz = .2, lh = H + 1.25 + lvl * .12, lz2 = lz + .32;
    piece('lantern', 7, S => {                          // 장대에 건 등롱
      for (const sg of lvl === 2 ? [-1, 1] : [1]) {
        const x = lx * sg;
        S.seg([x, H + .1, lz], [x, lh + .08, lz], .045, .035, wd, { l: L_WOOD, n: 4 }); S.seg([x, lh, lz - .06], [x, lh, lz2 + .05], .028, .028, wd, { l: L_WOOD, n: 4 });
        S.cone(.18, .1, x, lh - .07, lz2, P.tile, { n: 4, r: [0, PI / 4, 0] });
        S.box(.16, .2, .16, x, lh - .22, lz2, COL.ember, { emis: .8, jit: 0 }); S.box(.2, .04, .2, x, lh - .34, lz2, P.pillar, { l: L_WOOD });
        for (const [a, b] of corners) S.box(.028, .22, .028, x + a * .085, lh - .22, lz2 + b * .085, P.pillar, { l: L_WOOD });
      }
    });
    piece('flag', 8, S => tw_flag(S, Rr * .6, H + .4, H + 1.55 + lvl * .2, -Rr * .6, P, { w: .5, len: .34 }));
    mounts.flame = [lx, lh - .3, lz2]; mounts.flameSize = .26 + lvl * .05; mounts.flame2 = lvl === 2 ? [-lx, lh - .3, lz2] : null;
    mounts.gun = [0, H + .15, .05]; mounts.gunLen = [.95, 1.12, 1.25][lvl]; mounts.gunR = [.15, .18, .215][lvl];
    mounts.treb = treb; mounts.armL = [1.25, 1.35, 1.45][lvl]; mounts.pivot = [1.05, 1.12, 1.2][lvl]; mounts.top = treb ? H + 2.6 : H + 1.7;
  } else if (kind === 'spire') {
    // 벼락 솟대: 돌무지에 세운 긴 장대, 금줄과 오방색 천, 꼭대기의 나무 새(Tower.makeCrystal).
    const H = [2.7, 3.4, 4.1][lvl], pole = mulC(wl, .95), straw = COL.thatch, paper = COL.bone;
    piece('plinth', 0, S => {
      S.cyl(1.0, .16, 0, .08, 0, sdk, { n: 8, l: L_ROCK });
      const n = 9 + lvl * 3;
      for (let i = 0; i < n; i++) { const a = i * 2.4, u = i / n, r = lerp(.64, .1, u); S.rock(lerp(.28, .2, u), Math.cos(a) * r, .22 + u * (.42 + lvl * .1), Math.sin(a) * r, mixC(sdk, sl, rng()), { sq: .8, emis: .012 }); }
    });
    piece('shaft', 1, S => {
      const k1 = [.05, H * .55, .03];
      S.seg([0, .15, 0], k1, .13, .105, pole, { l: L_WOOD, n: 6 }); S.seg(k1, [0, H, 0], .105, .075, pole, { l: L_WOOD, n: 6 });
      const nb = 2 + lvl;
      for (let j = 0; j < nb; j++) {                    // 장대에 감은 금줄과 흰 종이(길지)
        const y = lerp(1.0, H - .75, j / (nb - 1)), px = .05 * Math.min(1, y / (H * .55));
        S.cyl(.15, .08, px, y, .02, straw, { n: 6, l: L_THATCH });
        for (let q = 0; q < 4; q++) { const a = q * HPI + j * .7; S.box(.06, .22, .012, px + Math.cos(a) * .165, y - .13, .02 + Math.sin(a) * .165, paper, { l: L_CLOTH, jit: 0, r: [0, -a + HPI, 0], swayf: v => (.5 - v.y / .22) * .5 }); }
      }
    });
    if (lvl >= 1) piece('bands', 2, S => {              // 장승 말뚝으로 내려 맨 금줄과 오방색 천
      const yTop = H * .66, x1 = .98;
      (lvl === 2 ? [0, HPI, PI, PI + HPI] : [0, PI]).forEach((ang, k) => {
        const T = new Soup(); let p = [.06, yTop, 0];
        for (let i = 1; i <= 5; i++) {
          const u = i / 5, q = [x1 * u, lerp(yTop, .95, u) - .3 * Math.sin(u * PI), 0]; T.seg(p, q, .022, .022, COL.rope, { n: 4 });
          if (i < 5) { const F = new Soup(); clothPanel(F, { x0: -.075, x1: .075, yTop: 0, len: .44, z: 0, col: C(tw_OBANG[(i + k * 2) % 5]), rng, nx: 1, ny: 3, rag: 0, sway: .9 }); T.merge(tw_glow(F, .03), { p: [q[0], q[1], 0], ao: null }); }
          p = q;
        }
        T.cyl(.1, .86, x1, .43, 0, wd, { n: 6, l: L_WOOD }); T.box(.2, .26, .2, x1, .8, 0, wl, { l: L_WOOD }); T.box(.27, .06, .27, x1, .95, 0, wd, { l: L_WOOD });
        for (const s of [-1, 1]) T.box(.04, .04, .02, x1 + .101, .83, s * .05, COL.black, { jit: 0 });
        S.merge(T, { ry: ang, ao: null });
      });
    });
    piece('claws', 3, S => {                            // 새가 앉는 가지
      S.box(.34, .05, .07, 0, H - .01, 0, pole, { l: L_WOOD });
      const T = new Soup(), yb = H - .55, hw = .4 + lvl * .04; T.seg([-hw, yb, 0], [hw, yb, 0], .035, .035, pole, { l: L_WOOD, n: 5 });   // 가로대에 건 오방색 천
      for (let i = 0; i < 5; i++) { const F = new Soup(); clothPanel(F, { x0: -.07, x1: .07, yTop: 0, len: .5 + (i & 1) * .08, z: 0, col: C(tw_OBANG[i]), rng, nx: 1, ny: 3, rag: 0, sway: .9 }); T.merge(tw_glow(F, .03), { p: [(i - 2) * hw * .44, yb - .02, 0], ao: null }); }
      S.merge(T, { ry: HPI, ao: null });
      if (lvl === 2) for (const s of [-1, 1]) { S.seg([0, H - .62, 0], [s * .5, H - .2, 0], .045, .03, pole, { l: L_WOOD, n: 5 }); tw_bird(S, s * .5, H - .1, 0, .15, s * HPI, mulC(wl, 1.1)); }
    });
    const bsz = [.25, .29, .33][lvl];
    mounts.crystal = [0, H + bsz * .5 + .02, 0]; mounts.crystalS = bsz; mounts.shards = [0, 2, 4][lvl]; mounts.rings = lvl === 2; mounts.top = H + .9; mounts.flame = null; mounts.lightAt = [0, H + .35, 0];
  } else {
    // 초소: 0단계는 초가 흙벽집, 1단계부터 시대별 기와지붕과 회벽, 2단계는 돌 각루가 붙는다.
    const W = [1.5, 1.7, 1.9][lvl], D = [1.3, 1.4, 1.5][lvl], wh = [1.05, 1.25, 1.5][lvl], tiled = lvl >= 1;
    const post = tiled ? P.pillar : wd, wc = tiled ? P.wall : C(0x9a8660);
    piece('floor', 0, S => { S.box(W + .5, .16, D + .6, 0, .08, .08, sdk, { l: L_MASON }); S.box(.7, .1, .4, 0, .05, D / 2 + .5, st, { l: L_MASON }); });
    piece('walls', 1, S => {
      if (lvl === 2) S.box(W + .06, .55, D + .06, 0, .43, 0, st, { l: L_MASON });   // 화방벽
      S.box(W, wh, D, 0, .16 + wh / 2, 0, wc, { l: L_PLAIN, jit: .03 });
      for (const [a, b] of corners) S.box(.13, wh + .04, .13, a * W / 2, .16 + wh / 2, b * D / 2, post, { l: L_WOOD });
      for (const sg of [-1, 1]) { S.box(W, .1, .08, 0, .16 + wh - .07, sg * D / 2, post, { l: L_WOOD }); S.box(.08, .1, D, sg * W / 2, .16 + wh - .07, 0, post, { l: L_WOOD }); }
      if (!tiled) for (const sg of [-1, 1]) S.seg([sg * W * .5, .2, D / 2 + .01], [sg * W * .22, .16 + wh, D / 2 + .01], .04, .04, wd, { l: L_WOOD, n: 4 });
      S.box(.5, .82, .12, 0, .57, D / 2, COL.black, { jit: 0 }); S.box(.66, .1, .16, 0, 1.02, D / 2 + .02, post, { l: L_WOOD }); for (const sg of [-1, 1]) S.box(.09, .86, .16, sg * .29, .59, D / 2 + .02, post, { l: L_WOOD });
      S.box(.24, .24, .08, W * .34, .16 + wh * .58, D / 2 + .01, COL.black, { jit: 0 }); S.box(.08, .3, .3, W / 2 + .01, .16 + wh * .58, 0, COL.black, { jit: 0 });
    });
    const yr = .16 + wh, rh = [.6, .7, .8][lvl], rax = W / 2 + .3, raz = D / 2 + .3;
    piece('roof', 2, S => {
      if (!tiled) tw_roof(S, { ax: rax, az: raz, y: yr - .03, h: rh, rl: rax * .4, col: COL.thatch, l: L_THATCH, rough: .95, lift: -.07, sag: -.1, nu: 5, ridge: mulC(COL.thatch, .78), ends: false, hips: false, fascia: mulC(COL.thatch, .62), fasciaH: .11 });
      else tw_roof(S, { ax: rax, az: raz, y: yr, h: rh, gable: P.gable, gin: .3, col: P.tile, ridge: P.ridge, ridgeEnd: P.ridgeEnd, fascia: P.band, gableCol: P.wall, orn: lvl === 2 });
    });
    piece('rack', 3, S => {                             // 창 거치대와 방패
      const x = -W / 2 - .28; S.box(.06, .7, .06, x, .5, -.3, wd, { l: L_WOOD }); S.box(.06, .7, .06, x, .5, .3, wd, { l: L_WOOD }); S.box(.05, .05, .7, x, .78, 0, w, { l: L_WOOD });
      for (const z of [-.2, 0, .2]) { S.seg([x + .06, .12, z], [x - .03, 1.02, z], .018, .018, wl, { l: L_WOOD, n: 4 }); S.cone(.035, .13, x - .035, 1.08, z, COL.steel, { n: 4, l: L_METAL }); }
      if (lvl >= 1) { S.box(.05, .42, .28, W / 2 + .04, .72, -.25, P.shield, { l: L_WOOD, jit: 0 }); S.box(.06, .06, .29, W / 2 + .045, .74, -.25, P.shield2, { l: L_METAL, jit: 0, rough: .5 }); }
    });
    const tx = W / 2 - .2, tz = -D / 2 + .2, th = 2.3, tRoofY = th + .97;
    if (lvl === 2) piece('turret', 4, S => {            // 돌 각루 위의 작은 누
      S.box(.8, th, .8, tx, th / 2 + .16, tz, st, { l: L_MASON }); S.box(.96, .14, .96, tx, th + .2, tz, sl, { l: L_MASON });
      S.box(.1, .4, .06, tx, th * .7, tz + .41, COL.black, { jit: 0 });
      for (const [a, b] of corners) S.seg([tx + a * .36, th + .27, tz + b * .36], [tx + a * .36, tRoofY, tz + b * .36], .05, .05, P.pillar, { l: L_WOOD, n: 5 });
      for (const sg of [-1, 1]) {
        S.box(.8, .05, .05, tx, th + .55, tz + sg * .38, wd, { l: L_WOOD }); S.box(.05, .05, .8, tx + sg * .38, th + .55, tz, wd, { l: L_WOOD });
        S.box(.86, .1, .08, tx, tRoofY - .06, tz + sg * .36, P.band, { jit: 0 }); S.box(.08, .1, .86, tx + sg * .36, tRoofY - .06, tz, P.band, { jit: 0 });
      }
      tw_roof(S, { x: tx, z: tz, ax: .7, az: .7, y: tRoofY, h: .42, gable: P.gable, col: P.tile, ridge: P.ridge, ridgeEnd: P.ridgeEnd, fascia: P.band, gableCol: P.wall, nu: 4, lift: .12, sag: .06 });
    });
    const fx = W / 2 + .2, fz = D / 2 + .6, bs = [.34, .46, .6][lvl];
    piece('fire', 5, S => { if (lvl === 0) { S.seg([fx, 0, fz], [fx, 1.05, fz], .04, .035, wd, { l: L_WOOD, n: 4 }); S.cyl(.07, .12, fx, 1.1, fz, iron, { n: 6, l: L_METAL, rt: 1.4 }); } else brazier(S, fx, .08, fz, bs + .1); });
    const fy = lvl === 2 ? tRoofY + .42 : yr + rh, fpx = lvl === 2 ? tx : -rax * .42, fpz = lvl === 2 ? tz : 0;
    piece('flag', 6, S => tw_flag(S, fpx, fy - .05, fy + 1.2, fpz, P, { w: .7, len: .46 }));
    mounts.flame = lvl === 0 ? [fx, 1.2, fz] : [fx, .08 + (bs + .1) * .72, fz]; mounts.flameSize = bs; mounts.door = [0, 0, D / 2 + .45]; mounts.top = lvl === 2 ? 3.9 : yr + rh + .6;
  }
  pieces.sort((a, b) => a.order - b.order);
  return { pieces, mounts };
}

function scaffoldGeo(w, h) {
  const S = new Soup(), c = mulC(COL.woodL, .9), c2 = COL.wood;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) S.seg([a * w, 0, b * w], [a * w, h, b * w], .04, .035, c, { l: L_WOOD, n: 4 });
  for (let y = .9; y < h; y += 1.05) for (let k = 0; k < 4; k++) { const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]], [a, b] = q[k], [cc, d] = q[(k + 1) % 4]; S.seg([a * w, y, b * w], [cc * w, y, d * w], .03, .03, c2, { l: L_WOOD, n: 4 }); if (k & 1) S.seg([a * w, y - .9, b * w], [cc * w, y, d * w], .022, .022, c, { l: L_WOOD, n: 3 }); }
  S.box(w * 1.2, .05, .34, 0, Math.min(h - .2, 1.95), w + .12, c2, { l: L_WOOD }); S.box(.34, .05, w * 1.2, -w - .12, Math.min(h - .25, .95), 0, c, { l: L_WOOD });
  return S.build();
}

let TOWER_STUN = false;
function findTarget(x, z, range, air, ground, minRange = 0) {
  if (G.phase !== 'play' || TOWER_STUN) return null;
  let best = null, bp = -1; const r2 = range * range, m2 = minRange * minRange;
  for (const m of G.mons) {
    if (m.dead || m.hp <= 0 || !m.vis) continue; if (m.fly ? !air : !ground) continue;
    const d = dist2(x, z, m.x, m.z); if (d > r2 || d < m2) continue;
    const sc = m.prog + (m.fly ? 2 : 0) + (m.def.boss ? -.0 : 0); if (sc > bp) { bp = sc; best = m; }
  }
  return best;
}
function aimPoint(m, dt, out) {
  if (m.fly) { out.x = m.x + m.vx * dt; out.y = m.y; out.z = m.z + m.vz * dt; return out; }
  const B = G.B, adv = m.blocked ? 0 : m.spdNow * dt, s2 = Math.min(B.L - .1, m.s + adv);
  pathAt(B, s2, out); out.x += -out.tz * m.lat; out.z += out.tx * m.lat; out.y += m.hitH; return out;
}

const _tv = new THREE.Vector3(), _tq = new THREE.Quaternion(), _tm = new THREE.Matrix4(), _tz = new THREE.Vector3(0, 0, 1), _ts = new THREE.Vector3(1, 1, 1), _ap = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };

class Tower {
  constructor(pad, kind, idx) {
    this.pad = pad; this.kind = kind; this.idx = idx; this.lvl = 0; this.def = TOWER[kind];
    this.x = pad.x; this.y = pad.y; this.z = pad.z; this.yaw = pad.face; this.cs = Math.cos(this.yaw); this.sn = Math.sin(this.yaw);
    this.spent = this.def.cost[0]; this.state = 'build'; this.bt = 0; this.cool = rr(.2, .8); this.kills = 0; this.dealt = 0; this.alive = true; this.recent = 0;
    this.group = new THREE.Group(); this.group.position.set(this.x, this.y, this.z); this.group.rotation.y = this.yaw; R.scene.add(this.group);
    this.pieces = []; this.staticMesh = null; this.scaf = null; this.flame = null; this.flame2 = null; this.archers = []; this.men = []; this.respawn = 0;
    this.em = { x: this.x, y: this.y + 3, z: this.z, r: 1, g: .56, b: .26, I: 0, range: 13, on: 0, alive: true, seed: rnd() * 50, spot: kind !== 'spire', dx: this.sn, dz: this.cs, fl: 1, _spot: 0 };
    LT.emitters[idx] = this.em; pad.tower = this;
    this.gunYaw = 0; this.recoil = 0; this.charge = 0; this.spin = rnd() * 6; this.hover = 0; this.appear = 0;
    this.era = curEra(); this.tb = 9; this.birdYaw = 0;   // 타워는 지어진 시대의 모습으로 고정된다
    this.begin();
  }
  get range() { return this.def.range[this.lvl]; }
  w(l, out) { out.x = this.x + l[0] * this.cs + l[2] * this.sn; out.y = this.y + l[1]; out.z = this.z - l[0] * this.sn + l[2] * this.cs; return out; }
  begin() {
    const bp = blueprint(this.kind, this.lvl, this.era); this.bp = bp; this.mounts = bp.mounts; this.bt = 0; this.state = this.lvl ? 'upgrade' : 'build';
    this.clearModel(true);
    const n = bp.pieces.length, gap = Math.min(.2, 1.45 / n);
    bp.pieces.forEach((p, i) => {
      const mesh = new THREE.Mesh(p.soup.build(), MAT.world); mesh.castShadow = mesh.receiveShadow = true; mesh.visible = false; mesh.position.y = p.y + 2.4;
      this.group.add(mesh); this.pieces.push({ mesh, y: p.y, t0: .32 + i * gap, landed: false, soup: p.soup });
    });
    this.tEnd = .32 + n * gap + .3;
    this.scaf = new THREE.Mesh(scaffoldGeo(1.25, Math.min(4.4, bp.mounts.top + .3)), MAT.world); this.scaf.castShadow = true; this.scaf.scale.set(1, .01, 1); this.group.add(this.scaf);
    fxDust(this.x, this.y + .1, this.z, 7, 1.0, { speed: 1.6 });
    sfx('hammer', this.x, this.z, .8, .3);
  }
  clearModel(keepLights) {
    for (const p of this.pieces) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); } this.pieces.length = 0;
    for (const k of ['staticMesh', 'scaf', 'carriage', 'crystal']) if (this[k]) { this.group.remove(this[k]); this[k].traverse(o => { if (o.geometry) o.geometry.dispose(); }); this[k] = null; }
    this.barrel = null; this.load = null; this.shards = null; this.ringG = null;
    removeFlame(this.flame); removeFlame(this.flame2); this.flame = this.flame2 = null; this.em.on = keepLights ? this.em.on * .4 : 0;
    this.archers.length = 0;
  }
  finish() {
    const M = new Soup(); for (const p of this.pieces) M.merge(p.soup, { p: [0, p.y, 0], ao: [0, 1.0, .72] });
    for (const p of this.pieces) { this.group.remove(p.mesh); p.mesh.geometry.dispose(); } this.pieces.length = 0;
    this.staticMesh = new THREE.Mesh(M.build(), MAT.world); this.staticMesh.castShadow = this.staticMesh.receiveShadow = true; this.group.add(this.staticMesh);
    if (this.scaf) { this.group.remove(this.scaf); this.scaf.geometry.dispose(); this.scaf = null; }
    const mt = this.mounts, lvl = this.lvl, d = this.def;
    if (mt.flame) { const p = this.w(mt.flame, {}); this.flame = addFlame({ x: p.x, y: p.y, z: p.z, size: mt.flameSize, on: 0, layers: mt.flameSize > .7 ? 2 : 1, glow: 1 }); this.em.x = p.x; this.em.y = p.y + .25; this.em.z = p.z; this.em.r = 1; this.em.g = .56; this.em.b = .26; }
    if (mt.flame2) { const p = this.w(mt.flame2, {}); this.flame2 = addFlame({ x: p.x, y: p.y, z: p.z, size: mt.flameSize, on: 0 }); }
    if (mt.lightAt) { const p = this.w(mt.lightAt, {}); this.em.x = p.x; this.em.y = p.y; this.em.z = p.z; this.em.r = .45; this.em.g = .72; this.em.b = 1; }
    this.em.I = d.light[lvl]; this.em.range = this.kind === 'archer' ? 12 : 10.5;
    if (this.kind === 'archer') mt.archers.forEach((a, i) => this.archers.push({ l: a, yaw: this.yaw, draw: 0, cool: .4 + i * .3, e: { scale: .82, ph: 0, mv: 0, atk: -1, bow: true, draw: 0, pitch: 0, tint: null, x: 0, y: 0, z: 0, yaw: 0, flash: 0 } }));
    if (this.kind === 'bombard') this.makeGun();
    if (this.kind === 'spire') this.makeCrystal();
    if (this.kind === 'guard') { this.respawn = .2; }
    this.state = 'active'; this.appear = 0;
    fxDust(this.x, this.y + .2, this.z, 10, 1.3, { speed: 2.2 });
    sfx('buildDone', this.x, this.z, 1);
    if (this.flame) fxEmbers(this.flame.x, this.flame.y, this.flame.z, 10, .2);
  }
  makeGun() {
    // 시대별 무기: 고구려·고려 = 포차(인력 투석기), 조선 = 총통(0~1단계)과 화차(2단계).
    const mt = this.mounts, lvl = this.lvl, P = tw_pal(this.era), wd = COL.woodD, w = COL.wood, wl = COL.woodL, S = new Soup(), Bq = new Soup();
    const mesh = q => { const m = new THREE.Mesh(q.build(), MAT.world); m.castShadow = m.receiveShadow = true; return m; };
    this.gunKind = mt.treb ? 'treb' : (lvl === 2 ? 'hwacha' : 'gun'); this.shellKind = this.era === 'goguryeo' ? 'jar' : this.era === 'goryeo' ? 'pot' : 'shell';
    let by = .4, load = null;
    if (this.gunKind === 'treb') {
      const pv = mt.pivot, L1 = mt.armL, L2 = .42; by = pv;
      S.cyl(.52, .08, 0, .04, 0, wd, { n: 8, l: L_WOOD });
      for (const sg of [-1, 1]) {
        S.box(.1, .09, .92, sg * .27, .12, 0, w, { l: L_WOOD });
        for (const z of [-.4, .4]) S.seg([sg * .27, .14, z], [sg * .24, pv + .04, 0], .055, .05, w, { l: L_WOOD, n: 5 });
        S.box(.08, .11, .11, sg * .31, pv, 0, P.band, { jit: 0 });
      }
      for (const z of [-.4, .4]) S.box(.64, .08, .1, 0, .13, z, wd, { l: L_WOOD });
      S.cyl(.045, .62, 0, pv, 0, wd, { n: 6, l: L_WOOD, r: [0, 0, HPI] });
      Bq.seg([0, 0, L2], [0, 0, -L1], .075, .045, wl, { l: L_WOOD, n: 6 }); Bq.box(.14, .14, .2, 0, 0, 0, COL.iron, { l: L_METAL });
      for (const u of [.38, .72]) Bq.box(.12, .12, .09, 0, 0, -L1 * u, P.band, { jit: 0 });   // 시대색 띠
      Bq.box(.5, .06, .06, 0, 0, L2, wd, { l: L_WOOD });
      for (const x of [-.2, -.07, .07, .2]) Bq.seg([x, 0, L2], [x * 1.4, -.5, L2 + .1], .014, .014, COL.rope, { n: 3 });
      Bq.seg([0, 0, -L1], [0, -.2, -L1 - .08], .014, .014, COL.rope, { n: 3 }); Bq.box(.17, .04, .17, 0, -.22, -L1 - .08, COL.leather, {});
      const J = new Soup(); if (this.shellKind === 'pot') tw_pot(J, 0, 0, 0, .9); else tw_jar(J, 0, 0, 0, .9, true);
      load = mesh(J); load.position.set(0, -.2, -L1 - .08);
      this.muzzle = [0, pv + L1 * .93 + .05, L1 * .37 + .1];
    } else if (this.gunKind === 'gun') {
      const L = mt.gunLen, r = mt.gunR, br = lvl ? mulC(COL.bronze, .82) : COL.bronze, o = () => ({ n: 8, l: L_METAL, r: [HPI, 0, 0], rough: .42 });
      S.box(r * 2 + .34, .1, .8, 0, .17, -.05, w, { l: L_WOOD });
      for (const sg of [-1, 1]) { S.box(.08, .26, .66, sg * (r + .07), .3, -.02, wd, { l: L_WOOD }); for (const z of [-.3, .22]) S.cyl(.15, .07, sg * (r + .2), .15, z, wd, { n: 8, r: [0, 0, HPI], l: L_WOOD }); }
      Bq.cyl(r * .86, L, 0, 0, L / 2 - .28, br, Object.assign(o(), { rt: .92 }));
      Bq.cyl(r * 1.08, L * .3, 0, 0, -.28 + L * .15, br, o());
      const n = 4 + lvl; for (let i = 0; i <= n; i++) Bq.cyl(r, .045, 0, 0, -.28 + L * (.36 + .58 * i / n), mulC(br, .75), o());   // 죽절
      Bq.cyl(r * 1.1, .09, 0, 0, L - .32, br, o()); Bq.cyl(r * .6, .03, 0, 0, L - .265, COL.black, Object.assign(o(), { jit: 0 }));
      Bq.cyl(r * .5, .2, 0, 0, -.38, mulC(br, .8), o());
      this.muzzle = [0, 0, L - .2];
    } else {
      by = .56;
      for (const sg of [-1, 1]) { S.cyl(.3, .07, sg * .44, .3, 0, wd, { n: 10, r: [0, 0, HPI], l: L_WOOD }); S.cyl(.08, .1, sg * .46, .3, 0, COL.iron, { n: 6, r: [0, 0, HPI], l: L_METAL }); S.seg([sg * .3, .36, -.2], [sg * .3, .3, -.78], .035, .035, w, { l: L_WOOD, n: 4 }); }
      S.cyl(.04, .9, 0, .3, 0, wd, { n: 6, r: [0, 0, HPI], l: L_WOOD }); S.box(.72, .08, .8, 0, .36, -.05, w, { l: L_WOOD }); S.box(.1, .3, .1, 0, .2, .3, wd, { l: L_WOOD });
      Bq.box(.66, .42, .62, 0, .1, .1, wl, { l: L_WOOD });
      for (const z of [-.12, .32]) Bq.box(.69, .45, .05, 0, .1, z, COL.iron, { l: L_METAL });
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) Bq.box(.07, .07, .03, (i - 2) * .12, .1 + (j - 1) * .12, .41, COL.black, { jit: 0 });
      Bq.box(.7, .05, .05, 0, .33, .4, P.band2, { jit: 0 });
      this.muzzle = [0, .1, .5];
    }
    this.carriage = mesh(S); this.carriage.position.set(mt.gun[0], mt.gun[1], mt.gun[2]); this.group.add(this.carriage);
    this.barrel = mesh(Bq); this.barrel.position.set(0, by, 0); this.barrel.rotation.x = this.gunKind === 'treb' ? -.55 : -.42; this.carriage.add(this.barrel);
    if (load) { this.load = load; this.barrel.add(load); }
    this.gunYaw = this.yaw;
  }
  makeCrystal() {
    // 솟대 꼭대기의 나무 새. 벼락 기운이 찰수록 푸르게 빛난다. 둘레를 도는 것은 도깨비불.
    const mt = this.mounts, mk = (sx, sy) => { const S = new Soup(); S.add(gOct(), { s: [sx, sy, sx], c: [1, 1, 1], jit: 0, cf: v => .55 + .45 * smooth(-sy, sy, v.y) + (v.x > 0 ? .12 : 0) }); return S.build(); };
    this.cmat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.4, .45, .55) });
    this.smat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(.3, .6, 1) });
    this.crystal = new THREE.Group(); this.crystal.position.set(mt.crystal[0], mt.crystal[1], mt.crystal[2]);
    const Bs = new Soup(); tw_bird(Bs, 0, 0, 0, mt.crystalS, 0, [1, .86, .66], L_PLAIN);
    const c = new THREE.Mesh(Bs.build(), this.cmat); c.castShadow = true; this.crystal.add(c); this.core = c;
    this.shards = [];
    for (let i = 0; i < mt.shards; i++) { const s = new THREE.Mesh(mk(.06, .13), this.smat); this.crystal.add(s); this.shards.push(s); }
    if (mt.rings) {                                     // 장대를 감싸 도는 금줄과 오방색 천
      const S = new Soup(); S.add(gTorus(12, .024, 4), { s: 1, r: [HPI, 0, 0], c: COL.rope, l: L_THATCH });
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, F = new Soup(); clothPanel(F, { x0: -.075, x1: .075, yTop: 0, len: .5, z: 0, col: C(tw_OBANG[k % 5]), rng: soupRng, nx: 1, ny: 3, rag: 0, sway: .8 }); S.merge(tw_glow(F, .03), { p: [Math.cos(a), -.01, Math.sin(a)], ry: -a + HPI, ao: null }); }
      this.ringG = new THREE.Mesh(S.build(), MAT.world); this.ringG.castShadow = true; this.ringG.position.y = -1.25; this.crystal.add(this.ringG);
    }
    this.group.add(this.crystal);
  }
  upgrade() { if (this.lvl >= 2 || this.state !== 'active') return false; this.lvl++; this.spent += this.def.cost[this.lvl]; for (const m of this.men) m.lvlUp = true; this.begin(); return true; }
  sell() {
    this.alive = false; this.em.alive = false; this.em.on = 0; LT.emitters[this.idx] = null; this.pad.tower = null;
    for (let i = 0; i < 14; i++) { _tm.compose(_tv.set(this.x + rr(-.7, .7), this.y + rr(.3, 2.4), this.z + rr(-.7, .7)), _tq.set(rr(-1, 1), rr(-1, 1), rr(-1, 1), 1).normalize(), _ts.set(1, 1, 1)); addDebris(this.kind !== 'bombard' ? KIT.plank : KIT.rubble, _tm, null, rr(-2, 2), rr(1, 4), rr(-2, 2), rr(3, 9), rr(2, 3.5)); }
    fxDust(this.x, this.y + .4, this.z, 16, 1.6, { speed: 2.6 }); sfx('sell', this.x, this.z, 1);
    for (const m of this.men) m.leave = true;
    this.clearModel(false); R.scene.remove(this.group);
  }
  update(dt) {
    const d = this.def, lvl = this.lvl; this.recent = Math.max(0, this.recent - dt * .25);
    if (this.state !== 'active') {
      this.bt += dt; const bt = this.bt;
      if (this.scaf) this.scaf.scale.y = bt < this.tEnd - .25 ? easeOutBack(bt / .3) : Math.max(.01, 1 - (bt - (this.tEnd - .25)) / .25);
      for (const p of this.pieces) {
        const u = (bt - p.t0) / .24;
        if (u < 0) continue; p.mesh.visible = true;
        if (u < 1) p.mesh.position.y = p.y + (1 - u * u) * 2.2;
        else { p.mesh.position.y = p.y; const sq = clamp((u - 1) / .5, 0, 1); p.mesh.scale.y = 1 - .1 * Math.sin(sq * PI) * (1 - sq);
          if (!p.landed) { p.landed = true; fxDust(this.x + rr(-.5, .5), this.y + p.y + .1, this.z + rr(-.5, .5), 3, .55, { speed: 1.2, a: .4 }); sfx('hammer', this.x, this.z, .7, rnd()); } }
      }
      this.em.on = damp(this.em.on, 0, 4, dt);
      if (bt >= this.tEnd) this.finish();
      return;
    }
    this.appear = Math.min(1, this.appear + dt * 2.2);
    TOWER_STUN = this.stun > 0;
    if (TOWER_STUN) { this.stun -= dt; const k = Math.min(1, this.stun * 2); FX.add.push(this.x, this.y + 1.7, this.z, 4.2, 5.6, 0, 0, .2, .5, 1.2, .3 * k, 2, 0, 0, 0); if (rnd() < dt * 5) { const a = rnd() * TAU, h = rr(.6, 3); fxBolt([this.x + Math.cos(a) * .8, this.y + h, this.z + Math.sin(a) * .8], [this.x + Math.cos(a + 1.2) * .8, this.y + h + rr(-.5, .5), this.z + Math.sin(a + 1.2) * .8], .12, [.5, .85, 1.5], .03); } if (rnd() < dt * 18) fxPart(this.x + rr(-.7, .7), this.y + rr(.4, 3.2), this.z + rr(-.7, .7), 0, rr(-.5, .1), 0, rr(.4, .9), rr(.05, .08), .6, 1.1, 2.0, { drag: .5 }); }
    this.em.on = damp(this.em.on, TOWER_STUN ? .12 : 1, TOWER_STUN ? 8 : 3, dt);
    if (this.flame) this.flame.on = this.em.on; if (this.flame2) this.flame2.on = this.em.on;
    this.cool -= dt;
    if (this.kind === 'archer') this.updArcher(dt, d, lvl);
    else if (this.kind === 'bombard') this.updBombard(dt, d, lvl);
    else if (this.kind === 'spire') this.updSpire(dt, d, lvl);
    else this.updGuard(dt, d, lvl);
    TOWER_STUN = false;
  }
  updArcher(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, d.range[lvl], true, true);
    for (const a of this.archers) {
      const p = this.w(a.l, _ap), e = a.e; e.x = p.x; e.y = p.y - (1 - easeOut(this.appear)) * .5; e.z = p.z; e.scale = .82 * (.3 + .7 * this.appear);
      a.cool -= dt;
      if (tgt) {
        const T = clamp(Math.hypot(tgt.x - p.x, tgt.z - p.z) / 14, .22, .62), q = aimPoint(tgt, T, _ap2);
        a.yaw = angDamp(a.yaw, Math.atan2(q.x - p.x, q.z - p.z), 12, dt);
        e.pitch = clamp(Math.atan2(q.y - (p.y + 1), Math.hypot(q.x - p.x, q.z - p.z)) * .7 + .2, -.5, .6);
        a.draw = a.cool < .34 ? Math.min(1, a.draw + dt * 3.6) : Math.max(0, a.draw - dt * 6);
        if (a.cool <= 0 && a.draw > .95) {
          a.cool = d.rate[lvl] * rr(.9, 1.12); a.draw = 0;
          shootArrow(p.x + Math.sin(a.yaw) * .3, p.y + 1.0, p.z + Math.cos(a.yaw) * .3, tgt, d.dmg[lvl], this);
          sfx('bow', p.x, p.z, .6, rnd());
        }
      } else { a.draw = Math.max(0, a.draw - dt * 3); a.yaw = angDamp(a.yaw, this.yaw + Math.sin(G.t * .5 + a.l[0] * 3) * .5, 2, dt); e.pitch = damp(e.pitch, 0, 4, dt); if (a.cool < .3) a.cool = .3; }
      e.yaw = a.yaw; e.draw = a.draw;
      rigHuman(tw_allyKit(this.era).kit, SPEC.foot, e);
    }
  }
  updBombard(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, d.range[lvl], false, true, d.minRange), treb = this.gunKind === 'treb';
    this.recoil = Math.max(0, this.recoil - dt * 1.6); this.tb += dt;
    let aligned = false;
    if (tgt) {
      const dist = Math.hypot(tgt.x - this.x, tgt.z - this.z), T = clamp(dist / 7.2, .75, 1.45), q = aimPoint(tgt, T, _ap2);
      const want = Math.atan2(q.x - this.x, q.z - this.z); this.gunYaw = angDamp(this.gunYaw, want, 5, dt); aligned = Math.abs(angDiff(this.gunYaw, want)) < .12;
      if (aligned && this.cool <= 0) {
        this.cool = d.rate[lvl] * rr(.95, 1.08); this.recoil = 1; this.tb = 0;
        this.carriage.rotation.y = this.gunYaw - this.yaw; this.group.updateMatrixWorld(true);
        const mu = this.muzzle, mz = _tv.set(mu[0], mu[1], mu[2]).applyMatrix4(treb ? this.carriage.matrixWorld : this.barrel.matrixWorld);
        const gy = G.B.heightAt(q.x, q.z);
        G.shells.push({ x0: mz.x, y0: mz.y, z0: mz.z, tx: q.x, ty: Math.max(gy, q.y - tgt.hitH) + .05, tz: q.z, t: 0, T, dmg: d.dmg[lvl], splash: d.splash[lvl], tower: this, x: mz.x, y: mz.y, z: mz.z, sm: 0, arc: 1.5 + dist * .2, kind: this.shellKind });
        const dx = Math.sin(this.gunYaw), dz = Math.cos(this.gunYaw);
        if (treb) {                                     // 화약이 없던 시대: 섬광 없이 나무 울림과 먼지만
          fxDust(this.x, this.y + this.mounts.gun[1] + .1, this.z, 5, .8, { speed: 1.8 });
          sfx('bow', this.x, this.z, 1, 0); sfx('hammer', this.x, this.z, .9, .15); FX.shake = Math.min(1, FX.shake + .04);
        } else {
          lightFlash(mz.x, mz.y + .2, mz.z, 0xffc880, 420, .16, 15);
          fxTimed(5, mz.x + dx * .2, mz.y + .1, mz.z + dz * .2, 1.9, 1.9, 4, 3, 1.6, 1, .1); fxTimed(3, mz.x + dx * .3, mz.y + .12, mz.z + dz * .3, .9, .9, 4, 3.2, 2.2, 1, .2, { grow: .8 });
          for (let i = 0; i < 6; i++) fxSmoke(mz.x + dx * .3, mz.y + .1, mz.z + dz * .3, dx * rr(1, 3.4) + rr(-.5, .5), rr(.3, 1.2), dz * rr(1, 3.4) + rr(-.5, .5), rr(1.2, 2.4), rr(.35, .6), .9, .3, .29, .28, .5, { drag: 2.2, rise: .2 });
          fxSparks(mz.x + dx * .2, mz.y, mz.z + dz * .2, 8, 5, 3, 1.8, .6, { lo: 0, hi: .6 });
          sfx('cannon', this.x, this.z, 1, lvl / 2); FX.shake = Math.min(1, FX.shake + .12);
        }
      }
    } else this.gunYaw = angDamp(this.gunYaw, this.yaw + Math.sin(G.t * .3 + this.idx) * .7, 1.2, dt);
    this.carriage.rotation.y = this.gunYaw - this.yaw;
    if (treb) {                                         // 팔이 휙 넘어갔다가 천천히 다시 눕는다
      const t = this.tb, a0 = -.55, a1 = 1.95;
      this.barrel.rotation.x = t < .12 ? lerp(a0, a1, easeOut(t / .12)) : t < .55 ? a1 + Math.sin((t - .12) * 14) * .12 * (1 - (t - .12) / .43) : lerp(a1, a0, easeInOut((t - .55) / 1.2));
      if (this.load) this.load.visible = t > 1.75;
      return;
    }
    const k = this.recoil; this.barrel.position.z = -(this.gunKind === 'hwacha' ? .14 : .3) * k * k; this.barrel.rotation.x = -.42 - .1 * k * k;
    if (this.cool > 0 && this.cool < 1.2 && rnd() < dt * 5) { this.group.updateMatrixWorld(true); const mu = this.muzzle, mz = _tv.set(mu[0], mu[1], mu[2]).applyMatrix4(this.barrel.matrixWorld); fxSmoke(mz.x, mz.y, mz.z, rr(-.1, .1), rr(.3, .6), rr(-.1, .1), 1.2, .18, .35, .3, .3, .3, .22, { drag: 1 }); }
  }
  updSpire(dt, d, lvl) {
    const tgt = findTarget(this.x, this.z, d.range[lvl], true, true);
    const was = this.charge;
    this.charge = tgt ? Math.min(1, this.charge + dt / d.rate[lvl]) : Math.max(0, this.charge - dt * .25);
    if (was < .68 && this.charge >= .68 && tgt) sfx('charge', this.x, this.z, .5);
    const c = this.charge, pulse = .85 + .15 * Math.sin(G.t * (6 + c * 20));
    this.spin += dt * (.8 + c * 5);
    this.birdYaw = angDamp(this.birdYaw, tgt ? Math.atan2(tgt.x - this.x, tgt.z - this.z) - this.yaw : Math.sin(G.t * .35 + this.idx) * .9, tgt ? 6 : 1.5, dt);   // 새는 적을 향해 고개를 돌린다
    this.core.rotation.y = this.birdYaw + Math.sin(G.t * 43) * .06 * c * c; this.core.rotation.x = -.22 * c; this.core.position.y = Math.sin(G.t * 1.6 + this.idx) * .025;
    this.shards.forEach((s, i) => { const a = this.spin * .7 + i * TAU / this.shards.length; s.position.set(Math.cos(a) * .58, Math.sin(a * 1.3) * .14 - .05, Math.sin(a) * .58); s.rotation.y = -a * 2; });
    if (this.ringG) this.ringG.rotation.y = -this.spin * .25;
    const k = (.9 + 4.5 * c * c) * pulse * this.appear, g = c * c, kb = pulse * this.appear; this.smat.color.setRGB(.28 * k, .62 * k, 1.15 * k);
    this.cmat.color.setRGB(lerp(.4, 1.5, g) * kb, lerp(.44, 3.3, g) * kb, lerp(.54, 6.2, g) * kb);
    this.em.I = (d.light[lvl] + 70 * c * c) * pulse;
    const cp = this.w(this.mounts.crystal, _ap);
    FX.add.push(cp.x, cp.y, cp.z, 1.5 + c, 1.5 + c, 0, 0, .25, .55, 1.0, (.1 + .22 * c) * pulse, 2, 0, 0, 0);
    if (c > .5 && rnd() < dt * 14 * c) { const a = rnd() * TAU; fxBolt([cp.x, cp.y, cp.z], [cp.x + Math.cos(a) * .7, cp.y + rr(-.5, .5), cp.z + Math.sin(a) * .7], .1, [.45, .7, 1.4], .035); }
    if (c >= 1 && tgt) {
      this.charge = 0; let from = [cp.x, cp.y, cp.z], cur = tgt, dmg = d.dmg[lvl]; const hit = [];
      for (let j = 0; j < d.jumps[lvl] && cur; j++) {
        hit.push(cur); const to = [cur.x, cur.y + cur.hitH, cur.z];
        fxBolt(from, to, .26 - j * .015, [.5, .78, 1.6], .1 - j * .008);
        fxSparks(to[0], to[1], to[2], 5, 3.5, 1.2, 2, 4, { grav: 3, size: .06 }); fxTimed(2, to[0], to[1], to[2], 1.6, 1.6, .5, .9, 2, .7, .16);
        const cx = cur.x, cz = cur.z; slowMonster(cur, d.slow[lvl], d.slowT[lvl]); hitMonster(cur, dmg, 'bolt', 0, 0, this);
        dmg *= .86; from = to; let nb = null, nd = 3.0 * 3.0;
        for (const m of G.mons) { if (m.dead || m.hp <= 0 || !m.vis || hit.includes(m)) continue; const dd = dist2(cx, cz, m.x, m.z); if (dd < nd) { nd = dd; nb = m; } }
        cur = nb;
      }
      lightFlash(tgt.x, tgt.y + 1.2, tgt.z, 0x9fd0ff, 520, .22, 16); lightFlash(cp.x, cp.y, cp.z, 0x9fd0ff, 300, .18, 12);
      sfx('zap', this.x, this.z, 1, lvl / 2); FX.shake = Math.min(1, FX.shake + .08);
    }
  }
  updGuard(dt, d, lvl) {
    for (let i = this.men.length - 1; i >= 0; i--) if (this.men[i].gone) this.men.splice(i, 1);
    if (this.men.length < d.n[lvl]) { this.respawn -= dt; if (this.respawn <= 0) { this.respawn = this.men.length === 0 && G.t < 4 ? .5 : d.rate[lvl]; spawnFootman(this); } }
  }
  dispose() { this.alive = false; this.em.alive = false; LT.emitters[this.idx] = null; this.clearModel(false); R.scene.remove(this.group); this.pad.tower = null; }
}
const _ap2 = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };

function shootArrow(x, y, z, m, dmg, tower) {
  const dist = Math.hypot(m.x - x, m.z - z), T = clamp(dist / 14, .22, .62), q = aimPoint(m, T, _ap2);
  G.arrows.push({ x0: x, y0: y, z0: z, tx: q.x, ty: q.y, tz: q.z, t: 0, T, m, dmg, tower, x, y, z, dx: 0, dy: 0, dz: 1, arc: .25 + dist * .07, alive: true, lI: 22, lCol: 0xff9040, lx: x, ly: y, lz: z, lseed: rnd() * 9, ember: 0 });
}
function arrowMatrix(x, y, z, dx, dy, dz) { _tq.setFromUnitVectors(_tz, _tv.set(dx, dy, dz).normalize()); return _tm.compose(_tv.set(x, y, z), _tq, _ts.set(1, 1, 1)); }
function updateProjectiles(dt) {
  const A = G.arrows, B = G.B;
  for (let i = A.length - 1; i >= 0; i--) {
    const a = A[i]; a.t += dt; const u = Math.min(1, a.t / a.T), m = a.m;
    if (m && !m.dead && m.hp > 0) { const q = aimPoint(m, Math.max(0, a.T - a.t), _ap2), k = Math.min(1, dt * 9); a.tx = lerp(a.tx, q.x, k); a.ty = lerp(a.ty, q.y, k); a.tz = lerp(a.tz, q.z, k); }
    const px = a.x, py = a.y, pz = a.z;
    a.x = lerp(a.x0, a.tx, u); a.z = lerp(a.z0, a.tz, u); a.y = lerp(a.y0, a.ty, u) + a.arc * 4 * u * (1 - u);
    const dx = a.x - px, dy = a.y - py, dz = a.z - pz, l = Math.hypot(dx, dy, dz) || 1; a.dx = dx / l; a.dy = dy / l; a.dz = dz / l;
    a.lx = a.x; a.ly = a.y; a.lz = a.z;
    KIT.arrow.put(arrowMatrix(a.x, a.y, a.z, a.dx, a.dy, a.dz), 0, null);
    const hx = a.x + a.dx * .25, hy = a.y + a.dy * .25, hz = a.z + a.dz * .25;
    FX.segs.push(hx, hy, hz, .055, hx - a.dx * .95, hy - a.dy * .95, hz - a.dz * .95, .0, 2.6, 1.05, .25, .85);
    FX.add.push(hx, hy, hz, .3, .3, 0, 0, 3.6, 1.9, .5, 1, 0, 0, 0, 0); FX.add.push(hx, hy, hz, 1.0, 1.0, 0, 0, 1, .45, .12, .22, 2, 0, 0, 0);
    a.ember += dt * 26; while (a.ember > 1) { a.ember -= 1; fxPart(hx, hy, hz, rr(-.4, .4), rr(-.1, .6), rr(-.4, .4), rr(.25, .6), .05, 2.6, 1.1, .2, { drag: 1.5, rise: .6 }); }
    if (u >= 1) {
      a.alive = false; swapRemove(A, i);
      if (m && !m.dead && m.hp > 0 && dist2(a.tx, a.tz, m.x, m.z) < 1.0) {
        fxSparks(a.x, a.y, a.z, 5, 3, 3, 1.5, .4, { size: .055, grav: 6 }); fxTimed(2, a.x, a.y, a.z, .9, .9, 1.6, .8, .25, .8, .12);
        sfx('arrowHit', a.x, a.z, .55, rnd()); hitMonster(m, a.dmg, 'arrow', a.dx, a.dz, a.tower);
      } else if (!m || !m.fly) {
        const gy = B.heightAt(a.x, a.z);
        G.stuck.push({ x: a.x, y: gy + .12, z: a.z, dx: a.dx, dy: Math.min(-.5, a.dy), dz: a.dz, life: 3.2 });
        fxSparks(a.x, gy + .1, a.z, 3, 2, 3, 1.5, .4, { size: .05 });
      }
    }
  }
  const St = G.stuck;
  for (let i = St.length - 1; i >= 0; i--) {
    const s = St[i]; s.life -= dt; if (s.life <= 0) { swapRemove(St, i); continue; }
    KIT.arrow.put(arrowMatrix(s.x, s.y - Math.max(0, .5 - s.life) * .5, s.z, s.dx, s.dy, s.dz), 0, null);
    if (s.life > 1.4) { FX.add.push(s.x - s.dx * .25, s.y - s.dy * .25 + .04, s.z - s.dz * .25, .2, .2, 0, 0, 3, 1.4, .3, Math.min(1, (s.life - 1.4)), 0, 0, 0, 0); if (rnd() < dt * 5) fxPart(s.x, s.y + .1, s.z, rr(-.1, .1), rr(.4, .9), rr(-.1, .1), .6, .045, 2.4, 1, .2, { drag: .5, wob: 1 }); }
  }
  const Sh = G.shells;
  for (let i = Sh.length - 1; i >= 0; i--) {
    const s = Sh[i]; s.t += dt; const u = Math.min(1, s.t / s.T);
    s.x = lerp(s.x0, s.tx, u); s.z = lerp(s.z0, s.tz, u); s.y = lerp(s.y0, s.ty, u) + s.arc * 4 * u * (1 - u);
    _tm.compose(_tv.set(s.x, s.y, s.z), _tq.setFromAxisAngle(_tz, s.t * 9), _ts.set(1, 1, 1)); (s.kind === 'jar' ? KIT.ally.jar : s.kind === 'pot' ? KIT.ally.pot : KIT.shell).put(_tm, 0, null);
    FX.add.push(s.x, s.y + .1, s.z, .3, .3, 0, 0, 3.2, 1.5, .3, 1, 0, 0, 0, 0);
    s.sm += dt * 30; while (s.sm > 1) { s.sm -= 1; fxSmoke(s.x, s.y, s.z, rr(-.1, .1), rr(0, .2), rr(-.1, .1), rr(.5, .9), .16, .3, .26, .25, .25, .32, { drag: 1 }); if (rnd() < .5) fxPart(s.x, s.y, s.z, rr(-.5, .5), rr(-.2, .5), rr(-.5, .5), .4, .05, 2.5, 1.1, .2, { grav: 2 }); }
    if (u >= 1) { swapRemove(Sh, i); explodeAt(s.tx, s.ty, s.tz, s.dmg, s.splash, s.tower, s.kind === 'jar' || s.kind === 'pot'); }
  }
}
// 포차의 탄(불 단지·쇳물)은 화약 폭발이 아니라 흙먼지와 불붙은 기름으로 터진다.
function tw_oilBurst(x, y, z, sc) {
  lightFlash(x, y + .8, z, 0xff9a40, 250 * sc * sc, .5, 16 + sc * 4);
  fxTimed(3, x, y + .3 * sc, z, 1.7 * sc, 1.4 * sc, 4.2, 2.6, 1.1, .9, .5, { grow: .9 });
  fxTimed(4, x, y + .08, z, 5 * sc, 5 * sc, 1.3, .7, .3, .5, .5, { ground: true });
  fxDust(x, y, z, 12, 1.25 * sc, { speed: 3.2, c: [.36, .3, .24], a: .6 });
  fxSparks(x, y + .2, z, Math.round(10 * sc), 5 * sc, 3, 1.4, .35, { size: .07 });
  for (let i = 0; i < 12 * sc; i++) { const a = rnd() * TAU, r = rr(.1, 1) * sc; fxPart(x + Math.cos(a) * r, y + .1, z + Math.sin(a) * r, rr(-.2, .2), rr(.5, 1.6), rr(-.2, .2), rr(.6, 1.5), rr(.07, .12), 2.8, 1.2, .25, { drag: .4, wob: 1, rise: .3 }); }
  for (let i = 0; i < 5 * sc; i++) fxSmoke(x + rr(-.4, .4), y + rr(.3, .6), z + rr(-.4, .4), rr(-.3, .3), rr(.6, 1.4), rr(-.3, .3), rr(1.6, 3), rr(.6, .9) * sc, 1.3 * sc, .16, .15, .15, .55, { drag: 1.5, rise: .25 });
  FX.shake = Math.min(1.2, FX.shake + .2 * sc);
}
function explodeAt(x, y, z, dmg, splash, tower, oil) {
  const sc = splash / 1.7;
  if (oil) tw_oilBurst(x, y, z, sc); else fxExplosion(x, y, z, sc);
  FX.decals.add(G.B.heightAt, x, z, splash * 1.2, .016, .013, .011, .85, 45);
  sfx('explode', x, z, 1, clamp(sc - .6, 0, 1));
  for (const m of G.mons) {
    if (m.dead || m.hp <= 0 || m.fly || !m.vis) continue;
    const d = Math.hypot(m.x - x, m.z - z); if (d > splash + m.rad) continue;
    const k = lerp(1, .45, sat(d / splash)), l = d || 1;
    hitMonster(m, dmg * k, 'blast', (m.x - x) / l, (m.z - z) / l, tower);
  }
  for (let i = 0; i < 5; i++) { _tm.compose(_tv.set(x + rr(-.3, .3), y + .2, z + rr(-.3, .3)), _tq.set(rr(-1, 1), rr(-1, 1), rr(-1, 1), 1).normalize(), _ts.set(.6, .6, .6)); addDebris(KIT.rubble, _tm, [.5, .45, .4], rr(-3, 3), rr(3, 6), rr(-3, 3), rr(4, 10), rr(1.6, 2.6)); }
}
