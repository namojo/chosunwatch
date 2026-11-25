
const _segq = new THREE.Quaternion(), _segd = new THREE.Vector3(), _upv = new THREE.Vector3(0, 1, 0);
Soup.prototype.seg = function (a, b, r0, r1, c, o = {}) {
  _segd.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _segd.length(); if (len < 1e-5) return this; _segd.multiplyScalar(1 / len);
  _segq.setFromUnitVectors(_upv, _segd);
  o.q = _segq; o.s = [r0, len, r0]; o.p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; o.c = c;
  return this.add(gCyl(o.n || 6, Math.round(clamp(r1 / r0, 0, 2.5) * 10) / 10), o);
};

function clothPanel(S, o) {
  const nx = o.nx || 4, ny = o.ny || 6, rng = o.rng, sway = o.sway === undefined ? .8 : o.sway;
  const yAt = j => o.yTop - o.len * j / ny, sw = j => Math.pow(j / ny, 1.3) * sway;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (j >= ny - 2 && rng() < (o.rag === undefined ? .4 : o.rag)) continue;
    if (j === ny - 1 && (i & 1)) continue;
    const xa = lerp(o.x0, o.x1, i / nx), xb = lerp(o.x0, o.x1, (i + 1) / nx);
    const emblem = o.col2 && i >= 1 && i < nx - 1 && j >= 1 && j <= 2;
    const c = mulC(emblem ? o.col2 : o.col, .78 + .3 * rng());
    const q = [[xa, yAt(j), sw(j)], [xb, yAt(j), sw(j)], [xb, yAt(j + 1), sw(j + 1)], [xa, yAt(j + 1), sw(j + 1)]];
    for (const [order, nz] of [[[0, 3, 2, 0, 2, 1], 1], [[0, 1, 2, 0, 2, 3], -1]]) for (const k of order) S.v(q[k][0], q[k][1], o.z, 0, 0, nz, c[0], c[1], c[2], q[k][0] * .5, q[k][1] * .5, L_CLOTH, .95, q[k][2], 0);
  }
}

const PROP = {
  barrel(S, x, y, z, s = 1, rng) {
    const c = mulC(COL.wood, .8 + .3 * rng());
    S.cyl(.2 * s, .27 * s, x, y + .135 * s, z, c, { n: 8, l: L_WOOD, rt: 1.16 });
    S.cyl(.232 * s, .27 * s, x, y + .405 * s, z, c, { n: 8, l: L_WOOD, rt: .86 });
    for (const h of [.06, .27, .48]) S.cyl((h === .27 ? .242 : .215) * s, .035 * s, x, y + h * s, z, COL.iron, { n: 8, l: L_METAL, rough: .6 });
  },
  crate(S, x, y, z, s, rng, ry = 0) {
    const c = mulC(COL.woodL, .75 + .3 * rng()), o = () => ({ l: L_WOOD, r: [0, ry, 0] });
    S.box(s, s, s, x, y + s / 2, z, c, o());
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.box(s * .12, s * 1.04, s * .12, x + (dx * Math.cos(ry) + dz * Math.sin(ry)) * s * .47, y + s / 2, z + (-dx * Math.sin(ry) + dz * Math.cos(ry)) * s * .47, COL.woodD, o());
    S.box(s * 1.04, s * .1, s * 1.04, x, y + s * .97, z, COL.woodD, o());
  },
  tree(S, rng, h, o = {}) {
    const bark = o.bark || mulC(COL.bark, .8 + .4 * rng());
    const branch = (a, d, len, r, depth) => {
      const b = [a[0] + d[0] * len, a[1] + d[1] * len, a[2] + d[2] * len], hot = o.tipEmis && depth >= 3;
      S.seg(a, b, r, r * .64, hot ? o.tip : bark, { l: L_WOOD, n: depth > 1 ? 4 : 6, sway: depth >= 2 ? .35 + depth * .15 : 0, emis: hot ? o.tipEmis : 0 });
      if (depth >= 4 || len < .3) return;
      const kids = depth === 0 ? rng.int(2, 3) : rng.int(1, 2);
      for (let k = 0; k < kids; k++) {
        const nd = [d[0] + rng.range(-1, 1), d[1] * .5 + rng.range(.05, .7), d[2] + rng.range(-1, 1)], l = Math.hypot(nd[0], nd[1], nd[2]);
        branch(b, [nd[0] / l, nd[1] / l, nd[2] / l], len * rng.range(.55, .8), r * .58, depth + 1);
      }
      if (depth < 2) { const nd = [d[0] + rng.range(-.3, .3), 1, d[2] + rng.range(-.3, .3)], l = Math.hypot(nd[0], nd[1], nd[2]); branch(b, [nd[0] / l, nd[1] / l, nd[2] / l], len * .72, r * .64, depth + 1); }
    };
    S.cyl(h * .12, .3, 0, .1, 0, bark, { n: 6, l: L_WOOD, rt: .7 });
    branch([0, .05, 0], [rng.range(-.15, .15), 1, rng.range(-.15, .15)], h * .42, h * .075, 0);
  },
  stump(S, rng) {
    S.cyl(.3, .45, 0, .2, 0, COL.bark, { n: 7, l: L_WOOD, rt: .8 }); S.cyl(.235, .04, 0, .44, 0, COL.woodL, { n: 7, l: L_WOOD });
    for (let k = 0; k < 3; k++) { const a = rng() * TAU; S.seg([Math.cos(a) * .2, .12, Math.sin(a) * .2], [Math.cos(a) * .6, -.05, Math.sin(a) * .6], .09, .04, COL.bark, { l: L_WOOD, n: 5 }); }
  },
  cart(S, rng, broken) {
    const w = COL.wood, wd = COL.woodD, o = () => ({ l: L_WOOD });
    S.box(1.6, .08, .9, 0, .56, 0, w, o());
    for (const zz of [-.45, .45]) { S.box(1.6, .28, .06, 0, .74, zz, w, o()); for (const xx of [-.7, 0, .7]) S.box(.07, .4, .08, xx, .74, zz * 1.04, wd, o()); }
    S.box(.06, .28, .9, -.8, .74, 0, w, o());
    const wheel = (x, z, lean) => {
      const T = new Soup();
      T.add(gTorus(10, .13, 4), { s: .4, c: wd, l: L_WOOD }); T.cyl(.07, .14, 0, 0, 0, COL.iron, { n: 6, l: L_METAL, r: [HPI, 0, 0] });
      for (let k = 0; k < 4; k++) T.box(.74, .05, .05, 0, 0, 0, w, { l: L_WOOD, r: [0, 0, k * PI / 4] });
      S.merge(T, { p: [x, lean ? .12 : .4, z], r: [lean ? 1.35 : 0, 0, lean ? .3 : 0] });
    };
    wheel(-.25, .56, false); if (!broken) wheel(-.25, -.56, false); else wheel(.5, -1.0, true);
    S.box(.08, .08, 1.2, -.25, .4, 0, wd, o());
    for (const zz of [-.3, .3]) S.seg([.8, .54, zz], [2.0, broken ? .1 : .34, zz * 1.1], .04, .035, wd, { l: L_WOOD });
    S.ico(.26, .35, .74, .1, COL.clothT, { sc: [1.2, .7, 1], l: L_CLOTH, d: 1 }); S.ico(.24, -.05, .72, -.18, mulC(COL.clothT, .8), { sc: [1, .7, 1.2], l: L_CLOTH, d: 1 });
    PROP.barrel(S, -.5, .6, .12, .8, rng);
  },
  skull(S, x, y, z, r, ry) {
    const T = new Soup();
    T.sph(r, 0, 0, 0, COL.bone, { sc: [1, .95, 1.1], l: L_BONE, w: 7, h: 5 }); T.box(r * 1.1, r * .55, r * .8, 0, -r * .65, r * .32, COL.boneD, { l: L_BONE });
    for (const s of [-1, 1]) T.box(r * .42, r * .38, r * .2, s * r * .42, -r * .05, r * 1.0, COL.black, { jit: 0 });
    S.merge(T, { p: [x, y, z], ry, ao: null });
  },
  banner(S, rng, col, h = 2.8, col2) {
    S.seg([0, 0, 0], [0, h, 0], .055, .04, COL.woodD, { l: L_WOOD }); S.seg([-.08, h - .2, 0], [.82, h - .2, 0], .03, .03, COL.woodD, { l: L_WOOD, n: 5 });
    S.cone(.07, .2, 0, h + .1, 0, COL.iron, { n: 4, l: L_METAL });
    clothPanel(S, { x0: .04, x1: .78, yTop: h - .23, len: 1.45, z: 0, col, col2: col2 || mulC(COL.gold, .6), rng });
  },
  fence(S, rng, len) {
    const nP = Math.max(2, Math.round(len) + 1);
    for (let k = 0; k < nP; k++) {
      const x = -len / 2 + k * len / (nP - 1), lean = rng.range(-.14, .14), hh = rng.range(.72, .95);
      S.box(.1, hh, .1, x, hh / 2, 0, mulC(COL.wood, .7 + .3 * rng()), { l: L_WOOD, r: [lean, 0, rng.range(-.12, .12)] });
      if (k < nP - 1) for (const y of [.36, .68]) { if (rng() < .22) continue; const drop = rng() < .15 ? -.3 : 0; S.seg([x, y, 0], [x + len / (nP - 1), y + drop + rng.range(-.04, .04), 0], .035, .035, mulC(COL.woodL, .7 + .3 * rng()), { l: L_WOOD, n: 4 }); }
    }
  },
  palisade(S, rng, len) {
    for (let x = -len / 2; x < len / 2; x += .27) {
      if (rng() < .1) continue;
      const hh = rng.range(1.25, 1.75), lean = [rng.range(-.1, .1), 0, rng.range(-.12, .12)], c = mulC(COL.wood, .65 + .35 * rng()), T = new Soup();
      T.cyl(.12, hh, 0, hh / 2, 0, c, { n: 6, l: L_WOOD }); T.cone(.12, .3, 0, hh + .15, 0, mulC(c, 1.15), { n: 6, l: L_WOOD });
      S.merge(T, { p: [x, -.1, rng.range(-.04, .04)], r: lean, ao: [0, .5, .6] });
    }
    S.box(len, .09, .07, 0, .95, .13, COL.woodD, { l: L_WOOD });
  },
  well(S, rng) {
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; S.box(.44, .56, .26, Math.cos(a) * .68, .28, Math.sin(a) * .68, mixC(COL.stoneD, COL.stoneL, rng()), { l: L_MASON, r: [0, -a + HPI, 0] }); }
    S.cyl(.6, .06, 0, .3, 0, COL.black, { n: 10, jit: 0 });
    for (const s of [-1, 1]) S.box(.1, 1.7, .1, s * .72, .85, 0, COL.woodD, { l: L_WOOD });
    S.seg([-.8, 1.45, 0], [.8, 1.45, 0], .05, .05, COL.wood, { l: L_WOOD });
    for (const s of [-1, 1]) S.box(1.75, .08, .66, 0, 1.86, s * .27, mulC(COL.thatch, .95), { l: L_THATCH, r: [s * .62, 0, 0] });
    S.seg([.15, 1.45, 0], [.15, .75, 0], .012, .012, COL.rope, { n: 3 }); S.cyl(.12, .2, .15, .68, 0, COL.wood, { n: 7, l: L_WOOD, rt: 1.2 });
  },
  wallRun(S, rng, len, hMax) {
    let x = -len / 2, k = 0, h = hMax * rng.range(.5, 1);
    while (x < len / 2) {
      const w = rng.range(.9, 1.4); h = clamp(h + rng.range(-1.1, .7), .5, hMax);
      const edge = Math.min(1, (len / 2 - Math.abs(x + w / 2)) / 1.4 + .25), hh = h * edge, c = mixC(COL.stoneD, COL.stone, rng());
      S.box(w, hh, .62, x + w / 2, hh / 2, 0, c, { l: L_MASON });
      for (let j = 0; j < 3; j++) if (rng() < .6) S.box(w * rng.range(.25, .45), rng.range(.2, .5), .62, x + w * (.2 + j * .3), hh + .15, 0, mixC(COL.stoneD, COL.stoneL, rng()), { l: L_MASON });
      if (rng() < .5) S.rock(rng.range(.2, .4), x + rng.range(0, w), .1, rng.sign() * rng.range(.5, .9), mixC(COL.stoneD, COL.stone, rng()));
      x += w; k++;
    }
    S.box(len * .9, .22, .86, 0, .08, 0, COL.stoneD, { l: L_MASON });
  },
  cairn(S, rng) { let y = 0, r = rng.range(.3, .42); for (let k = 0; k < 4; k++) { S.rock(r, rng.range(-.05, .05), y + r * .45, rng.range(-.05, .05), mixC(COL.stoneD, COL.stoneL, rng()), { sq: .6 }); y += r * .72; r *= .74; } },
  tuft(S, rng) {
    const c = mulC(mixC(COL.tuftA, COL.tuftB, rng() * .6), .8 + .5 * rng());
    for (let k = 0; k < rng.int(3, 5); k++) {
      const a = rng() * TAU, l = rng.range(.22, .42), bx = Math.cos(a) * .06, bz = Math.sin(a) * .06, tx = Math.cos(a) * l * .5, tz = Math.sin(a) * l * .5, w = .035;
      const A = [bx - Math.sin(a) * w, 0, bz + Math.cos(a) * w], Bp = [bx + Math.sin(a) * w, 0, bz - Math.cos(a) * w], T = [tx, l, tz];
      for (const [p, sw] of [[A, 0], [Bp, 0], [T, .7], [A, 0], [T, .7], [Bp, 0]]) S.v(p[0], p[1], p[2], 0, 1, 0, c[0], c[1], c[2], 0, 0, L_PLAIN, 1, sw, 0);
    }
  },
};

// ───────── 조선워치: 전장 공용 헬퍼 (bf_) ─────────
// 시대(수비 측)·군대(침공군) 색은 src/05-lore.js 의 ERA / ARMY 표에서만 가져온다.
const bf_OBANG = [C(0x2a5caa), C(0xc23a2a), C(0xe0b030), C(0xe8e4da), C(0x22222a)];
// 솔잎 뭉치의 미세 발광값. 0보다 크면 지형 덮개(행주산성의 모래)가 나무 위에 쌓이지 않는다. scatterProps 가 전장마다 정한다.
let bf_leafEmis = 0;
function bf_style(bio) {
  const k = bio.era, e = ERA[k] || ERA.joseon, o = { key: k, main: C(e.main), sub: C(e.sub), trim: C(e.trim) };
  if (k === 'goguryeo') Object.assign(o, { roof: 'gable', tile: C(0x3a3840), post: o.main, band: mixC(o.sub, o.trim, .1), ridge: o.trim, flag: mulC(o.main, 1.15), flag2: o.trim });
  else if (k === 'goryeo') Object.assign(o, { roof: 'hip', tile: mulC(o.main, .95), post: C(0x7a3326), band: o.sub, ridge: o.trim, flag: mulC(o.main, 1.1), flag2: o.sub });
  else Object.assign(o, { roof: 'hip', tile: C(0x3a3e48), post: o.sub, band: C(0x2f6f55), ridge: o.trim, flag: mulC(o.main, 1.35), flag2: o.sub });
  return o;
}
function bf_army(bio) {
  const k = bio.army, a = ARMY[k] || ARMY.wa, o = { key: k, main: C(a.main), sub: C(a.sub), trim: C(a.trim) };
  if (k === 'sui') Object.assign(o, { flag: o.sub, flag2: o.main, cloth: mulC(o.main, 1.1), stripe: o.sub, mark: o.trim });
  else if (k === 'tang') Object.assign(o, { flag: mulC(o.main, 1.2), flag2: o.sub, cloth: mulC(o.main, 1.1), stripe: o.sub, mark: o.trim });
  else if (k === 'mongol') Object.assign(o, { flag: mulC(o.main, 1.15), flag2: o.sub, cloth: o.sub, stripe: o.main, mark: o.trim });
  else Object.assign(o, { flag: mulC(o.sub, 1.1), flag2: o.trim, cloth: o.trim, stripe: mixC(o.main, o.trim, .1), mark: mixC(o.main, o.trim, .06) });
  return o;
}
function bf_q(S, a, b, c, d, out, col, layer, rough, o) {
  _sa.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _sb.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); _sn.crossVectors(_sa, _sb);
  if (_sn.x * out[0] + _sn.y * out[1] + _sn.z * out[2] >= 0) S.quad(a, b, c, d, col, layer, rough, o); else S.quad(a, d, c, b, col, layer, rough, o);
}
// 한옥 지붕: 처마가 휘어 오르는 우진각(hip) / 맞배(gable). o = { w, d, h, x, y, z, ry, kind, tile, ridge, eave, lift, rng }
function bf_roof(S, o) {
  const a = o.w / 2, b = o.d / 2, h = o.h, gable = o.kind === 'gable', r = gable ? a : Math.max(.12, a - b * .82), lift = o.lift === undefined ? .3 : o.lift;
  const rng = o.rng, T = new Soup(), UP = [0, 1, 0], ns = o.ns || 6, nt = 3, tile = o.tile, ridge = o.ridge || mulC(tile, 1.5), eave = o.eave || mulC(tile, .55);
  const yy = (s, t) => h * Math.pow(t, 1.55) + lift * Math.pow(Math.abs(s), 2.4) * (1 - t) * (1 - t);
  const front = (s, t, sg) => [s * lerp(a, r, t), yy(s, t), sg * b * (1 - t)];
  const side = (s, t, sg) => [sg * lerp(a, r, t), yy(s, t), s * b * (1 - t)];
  const shade = j => mulC(tile, (.74 + .2 * j) * (.92 + .16 * rng())), em = o.emis === undefined ? .025 : o.emis, eo = j => ({ emis: o.snow && j === 0 ? 0 : em });
  for (const sg of [-1, 1]) {
    for (let i = 0; i < ns; i++) {
      const s0 = -1 + 2 * i / ns, s1 = -1 + 2 * (i + 1) / ns;
      for (let j = 0; j < nt; j++) bf_q(T, front(s0, j / nt, sg), front(s1, j / nt, sg), front(s1, (j + 1) / nt, sg), front(s0, (j + 1) / nt, sg), UP, shade(j), L_SLATE, .78, eo(j));
      const p0 = front(s0, 0, sg), p1 = front(s1, 0, sg);
      bf_q(T, p0, p1, [p1[0], p1[1] - .13, p1[2] - sg * .05], [p0[0], p0[1] - .13, p0[2] - sg * .05], [0, 0, sg], eave, L_WOOD, .9);
    }
    if (!gable) for (let i = 0; i < 4; i++) {
      const s0 = -1 + i / 2, s1 = -1 + (i + 1) / 2;
      for (let j = 0; j < nt; j++) bf_q(T, side(s0, j / nt, sg), side(s1, j / nt, sg), side(s1, (j + 1) / nt, sg), side(s0, (j + 1) / nt, sg), UP, shade(j), L_SLATE, .78, eo(j));
      const p0 = side(s0, 0, sg), p1 = side(s1, 0, sg);
      bf_q(T, p0, p1, [p1[0] - sg * .05, p1[1] - .13, p1[2]], [p0[0] - sg * .05, p0[1] - .13, p0[2]], [sg, 0, 0], eave, L_WOOD, .9);
    } else {
      // 맞배: 박공(옆면 삼각벽)과 박공널
      const gx = sg * (a - .34), wallC = o.gableCol || mulC(eave, 1.6);
      bf_q(T, [gx, 0, -b * .8], [gx, 0, b * .8], [gx, h * .86, 0], [gx, h * .86, 0], [sg, 0, 0], wallC, L_WOOD, .95);
      for (const zs of [-1, 1]) for (let j = 0; j < nt; j++) { const p0 = front(sg, j / nt, zs), p1 = front(sg, (j + 1) / nt, zs); bf_q(T, p0, p1, [p1[0], p1[1] - .16, p1[2]], [p0[0], p0[1] - .16, p0[2]], [sg, 0, 0], eave, L_WOOD, .9); }
    }
  }
  // 용마루와 망와(치미)
  T.box(r * 2 + .12, .15, .17, 0, h + .03, 0, ridge, { l: L_PLAIN, rough: .8, jit: 0 });
  for (const sg of [-1, 1]) {
    T.box(.16, .34, .19, sg * (r + .04), h + .15, 0, ridge, { l: L_PLAIN, rough: .7, jit: 0, r: [0, 0, -sg * .28] });
    if (!gable) for (const zs of [-1, 1]) { let p = side(zs, 1, sg); p = [p[0], p[1] + .04, p[2]]; for (let j = nt - 1; j >= 0; j--) { const q = side(zs, j / nt, sg); q[1] += .05; T.seg(p, q, .055, .055, ridge, { n: 4, jit: 0, rough: .8 }); p = q; } }
  }
  S.merge(T, { p: [o.x || 0, o.y || 0, o.z || 0], ry: o.ry || 0, ao: null });
}
// 여장(女墻): 성벽 위의 낮은 담. x0→x1 로 늘어선 타(垛)와 타구.
function bf_yeojang(S, x0, x1, y, z, col, cap, rng) {
  const n = Math.max(1, Math.round((x1 - x0) / .82)), p = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    const x = x0 + (k + .5) * p, c = mulC(col, .88 + .24 * rng());
    S.box(p - .2, .46, .32, x, y + .23, z, c, { l: L_MASON }); S.box(p - .14, .08, .4, x, y + .5, z, cap, { l: L_MASON });
  }
  S.box(x1 - x0, .14, .3, (x0 + x1) / 2, y + .07, z, mulC(col, .8), { l: L_MASON });
}

Object.assign(PROP, {
  // 장승: 길가의 나무 수호신. 얼굴은 +z 를 본다.
  jangseung(S, rng, female) {
    const w = mulC(COL.wood, .8 + .3 * rng()), hh = rng.range(1.7, 2.15), T = new Soup();
    T.cyl(.16, hh, 0, hh / 2 - .1, 0, w, { n: 7, l: L_WOOD, rt: 1.15 });
    T.cyl(.21, .52, 0, hh - .3, 0, mulC(w, 1.15), { n: 7, l: L_WOOD, rt: 1.05 });
    if (female) { T.cyl(.13, .14, 0, hh + .02, 0, COL.woodD, { n: 6, l: L_WOOD }); T.box(.5, .05, .08, 0, hh + .06, 0, COL.woodD, { l: L_WOOD }); }
    else { T.box(.66, .07, .2, 0, hh - .02, 0, COL.woodD, { l: L_WOOD }); T.box(.24, .2, .2, 0, hh + .1, 0, COL.woodD, { l: L_WOOD }); }
    for (const s of [-1, 1]) { T.box(.1, .09, .05, s * .09, hh - .2, .2, C(0xe6dcc0), { jit: 0 }); T.box(.05, .05, .06, s * .09, hh - .2, .21, COL.black, { jit: 0 }); }
    T.box(.07, .17, .09, 0, hh - .32, .21, mulC(w, .75), { l: L_WOOD });
    T.box(.22, .07, .05, 0, hh - .48, .2, C(0xe6dcc0), { jit: 0 });
    T.box(.13, hh * .42, .03, 0, hh * .4, .19, C(0xd8cfb4), { jit: 0 });
    for (let k = 0; k < 4; k++) T.box(.08, .05, .035, 0, hh * (.25 + k * .09), .195, COL.black, { jit: 0 });
    S.merge(T, { r: [rng.range(-.07, .07), 0, rng.range(-.09, .09)], ao: [0, .5, .6] });
  },
  // 솟대: 긴 장대 끝의 나무 새와 오방색 천.
  sotdae(S, rng, h) {
    h = h || rng.range(2.6, 3.5); const w = mulC(COL.woodD, .95 + .3 * rng()), lx = rng.range(-.05, .05) * h;
    S.seg([0, -.1, 0], [lx, h, 0], .055, .035, w, { l: L_WOOD, n: 5 });
    const bird = (x, y, z, ry, s) => {
      const T = new Soup(), c = mulC(COL.woodL, .85 + .25 * rng());
      T.ico(.15 * s, 0, 0, 0, c, { sc: [2.0, .75, .8], d: 1, l: L_WOOD });
      T.seg([.2 * s, .03 * s, 0], [.36 * s, .22 * s, 0], .05 * s, .04 * s, c, { l: L_WOOD, n: 4 }); T.ico(.065 * s, .39 * s, .25 * s, 0, c, { d: 0 });
      T.seg([.43 * s, .25 * s, 0], [.58 * s, .22 * s, 0], .022 * s, .008 * s, COL.woodD, { n: 3 });
      T.seg([-.24 * s, .01 * s, 0], [-.52 * s, .12 * s, 0], .06 * s, .02 * s, mulC(c, .8), { n: 3, l: L_WOOD });
      S.merge(T, { p: [x, y, z], ry, ao: null });
    };
    bird(lx, h + .1, 0, rng() * TAU, 1.2);
    if (rng() < .55) { const y = h * .78, a = rng() * TAU, dx = Math.cos(a) * .42, dz = Math.sin(a) * .42; S.seg([lx * .78 - dx, y, -dz], [lx * .78 + dx, y + .05, dz], .03, .025, w, { l: L_WOOD, n: 4 }); bird(lx * .78 + dx, y + .14, dz, rng() * TAU, .85); }
    const y0 = h * .52;
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + rng(), x = lx * .5 + Math.cos(a) * .07, z = Math.sin(a) * .07, wx = -Math.sin(a) * .05, wz = Math.cos(a) * .05, len = rng.range(.45, .8); ribbon(S, [x - wx, y0, z - wz], [x + wx, y0, z + wz], [x + wx, y0 - len, z + wz], [x - wx, y0 - len, z - wz], bf_OBANG[k], [.1, .1, .9, .9]); }
  },
  // 돌탑: 소원을 빌며 쌓아 올린 원뿔 돌무더기.
  doltap(S, rng, hh) {
    hh = hh || rng.range(1.0, 1.7); const R = hh * .46; let y = 0;
    for (let L = 0; y < hh; L++) {
      const r = Math.max(.06, R * (1 - y / hh * .9)), n = r < .14 ? 1 : Math.round(r * 13);
      for (let k = 0; k < n; k++) { const a = k / n * TAU + L * .7, q = rng.range(.12, .19), d = n > 1 ? r - q * .5 : 0; S.rock(q, Math.cos(a) * d, y + q * .45, Math.sin(a) * d, mixC(COL.stoneD, COL.stoneL, rng()), { d: 0, sq: .72 }); }
      if (r > .3) S.cyl(r * .72, .2, 0, y + .1, 0, mulC(COL.stoneD, .8), { n: 7, l: L_ROCK });
      y += .19;
    }
    S.rock(.12, 0, y + .04, 0, COL.stoneL, { d: 0, sq: 1.3 });
  },
  // 초가: 흙벽과 둥근 볏짚 지붕. o.burnt 면 불탄 집터.
  choga(S, rng, o = {}) {
    const burnt = o.burnt, wall = burnt ? C(0x2c2623) : mulC(C(0xbfae88), .85 + .2 * rng()), wd = burnt ? mulC(COL.bark, .55) : COL.woodD, th = mulC(COL.thatch, .95 + .25 * rng());
    const W = o.w || 2.5, D = 1.6, H = burnt ? .62 : 1.0, y0 = .14;
    S.box(W + .5, .16, D + .7, 0, .06, .1, mixC(COL.stoneD, COL.stone, .5), { l: L_MASON });
    S.box(W, H, D, 0, y0 + H / 2, 0, wall, { l: L_PLAIN, rough: .96 });
    for (const x of [-W / 2, -W / 6, W / 6, W / 2]) for (const z of [-D / 2, D / 2]) S.box(.1, (burnt ? rng.range(.7, 1.5) : H + .04), .1, x, y0 + (burnt ? .5 : H / 2), z, wd, { l: L_WOOD, r: burnt ? [rng.range(-.2, .2), 0, rng.range(-.2, .2)] : undefined });
    S.box(.44, H * .72, .05, -W / 3, y0 + H * .36, D / 2 + .01, COL.black, { jit: 0 }); S.box(.3, .28, .05, W / 3, y0 + H * .6, D / 2 + .01, COL.black, { jit: 0 });
    S.box(W * .5, .1, .44, 0, .3, D / 2 + .26, burnt ? wd : COL.wood, { l: L_WOOD });
    if (!burnt) {
      S.box(W + .06, .09, D + .06, 0, y0 + H, 0, wd, { l: L_WOOD });
      S.cyl(W * .74, .16, 0, y0 + H + .08, 0, mulC(th, .7), { n: 10, rz: D * .96, l: L_THATCH, jit: .03 });
      S.add(gDome(10, 3), { s: [W * .7, .82, D * .9], p: [0, y0 + H + .1, 0], c: th, l: L_THATCH, jit: .05, uvs: .5, cf: v => .7 + .3 * sat(v.y / .82) });
      for (const x of [-W * .3, 0, W * .3]) S.seg([x, y0 + H + .2, -D * .82], [x, y0 + H + .2, D * .82], .022, .022, COL.rope, { n: 3, jit: 0 });
    } else {
      for (let k = 0; k < 5; k++) { const x = -W / 2 + k * W / 4 + rng.range(-.1, .1); S.seg([x, y0 + H, -D / 2], [x + rng.range(-.3, .3), y0 + H + rng.range(.2, .8), rng.range(-.2, .3)], .05, .04, wd, { l: L_WOOD, n: 4, emis: k & 1 ? .03 : 0 }); }
      S.ico(.6, rng.range(-.3, .3), y0 + .2, 0, C(0x231d1a), { sc: [1.5, .45, 1], d: 1, l: L_THATCH });
      for (let k = 0; k < 4; k++) S.ico(.07, rng.range(-W * .4, W * .4), y0 + rng.range(.35, .7), rng.range(-.5, .5), [.8, .22, .03], { d: 0, emis: .22, jit: 0 });
    }
  },
  // 볏섬(가마니) 더미.
  bales(S, rng) {
    const c = mulC(COL.thatch, 1.0 + .2 * rng());
    for (const [x, y, z] of [[0, .2, 0], [.03, .2, .44], [0, .56, .22]]) { S.cyl(.2, .62, x, y, z, mulC(c, .9 + .2 * rng()), { n: 7, l: L_THATCH, r: [0, 0, HPI] }); for (const dx of [-.18, .18]) S.cyl(.208, .04, x + dx, y, z, COL.rope, { n: 7, r: [0, 0, HPI], jit: 0 }); }
  },
  // 녹각(거마): 길을 막는 깎은 말뚝 울타리.
  nokgak(S, rng, len = 2.4) {
    S.seg([-len / 2, .42, 0], [len / 2, .42, 0], .06, .06, COL.woodD, { l: L_WOOD, n: 5 });
    for (let x = -len / 2 + .15; x < len / 2; x += .3) for (const s of [-1, 1]) { const j = rng.range(-.06, .06); S.seg([x + j, -.05, -s * .42], [x + j, .9, s * .46], .045, .012, mulC(COL.wood, .65 + .35 * rng()), { l: L_WOOD, n: 4 }); }
  },
  // 싸움의 흔적: 땅에 박힌 화살, 부러진 창, 버려진 방패.
  warDebris(S, rng, ar) {
    for (let k = 0, n = rng.int(2, 5); k < n; k++) {
      const x = rng.range(-.45, .45), z = rng.range(-.45, .45), a = rng() * TAU, t = rng.range(.15, .55), l = rng.range(.42, .62), dx = Math.cos(a) * Math.sin(t), dz = Math.sin(a) * Math.sin(t), dy = Math.cos(t);
      S.seg([x, -.03, z], [x + dx * l, dy * l, z + dz * l], .013, .013, COL.woodL, { n: 3, jit: 0 });
      S.seg([x + dx * l * .78, dy * l * .78, z + dz * l * .78], [x + dx * l, dy * l, z + dz * l], .04, .03, mulC(ar.flag2, .9), { n: 3, jit: 0 });
    }
    if (rng() < .55) { const a = rng() * TAU, l = rng.range(.9, 1.4), x = rng.range(-.3, .3), z = rng.range(-.3, .3), e = [x + Math.cos(a) * l, .05, z + Math.sin(a) * l]; S.seg([x, .04, z], e, .026, .026, COL.woodD, { l: L_WOOD, n: 4 }); S.seg(e, [e[0] + Math.cos(a) * .24, .05, e[2] + Math.sin(a) * .24], .04, .004, COL.steel, { l: L_METAL, n: 4, rough: .4 }); }
    if (rng() < .4) { const T = new Soup(); T.cyl(.27, .05, 0, 0, 0, mulC(ar.cloth, .75), { n: 9, l: L_WOOD }); T.cyl(.09, .05, 0, .035, 0, ar.stripe, { n: 6, l: L_METAL, rough: .5 }); S.merge(T, { p: [rng.range(-.3, .3), .09, rng.range(-.3, .3)], r: [rng.range(-.35, .35), rng() * TAU, rng.range(-.2, .2)], ao: null }); }
  },
  // 군막: 수·당은 네모 군막, 몽골은 게르, 왜는 진막(장막)과 노보리.
  tent(S, rng, ar) {
    if (ar.key === 'mongol') {
      S.cyl(.95, .78, 0, .37, 0, mulC(ar.cloth, .9), { n: 10, l: L_CLOTH }); S.cyl(.97, .11, 0, .66, 0, ar.stripe, { n: 10, l: L_CLOTH });
      S.cone(1.06, .58, 0, 1.04, 0, mulC(ar.cloth, .78), { n: 10, l: L_CLOTH }); S.cyl(.22, .1, 0, 1.3, 0, ar.mark, { n: 8, l: L_WOOD });
      S.box(.42, .6, .08, 0, .3, .94, ar.mark, { l: L_WOOD });
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + .3; S.seg([Math.cos(a) * .98, .72, Math.sin(a) * .98], [Math.cos(a) * 1.5, -.02, Math.sin(a) * 1.5], .012, .012, COL.rope, { n: 3, jit: 0 }); }
    } else if (ar.key === 'wa') {
      const cur = (x, z, ry, w) => { const T = new Soup(); clothPanel(T, { x0: -w / 2, x1: w / 2, yTop: 1.2, len: 1.08, z: 0, col: ar.cloth, col2: ar.mark, rng, sway: .12, rag: 0, nx: 6, ny: 5 }); T.box(w, .1, .03, 0, 1.16, 0, ar.stripe, { jit: 0 }); T.seg([-w / 2, 1.24, 0], [w / 2, 1.24, 0], .02, .02, COL.woodD, { n: 3 }); S.merge(T, { p: [x, 0, z], ry, ao: null }); };
      cur(0, -.8, 0, 2.2); cur(-1.1, 0, HPI, 1.6); cur(1.1, 0, HPI, 1.6);
      for (const [x, z] of [[-1.1, -.8], [1.1, -.8], [-1.1, .8], [1.1, .8]]) S.seg([x, -.05, z], [x, 1.42, z], .04, .03, COL.woodD, { l: L_WOOD, n: 4 });
      S.box(.6, .22, .36, 0, .11, -.2, COL.woodD, { l: L_WOOD });
    } else {
      S.box(1.5, .86, 1.5, 0, .42, 0, mulC(ar.cloth, .92), { l: L_CLOTH }); S.box(1.55, .12, 1.55, 0, .82, 0, ar.stripe, { l: L_CLOTH });
      S.cone(1.26, .82, 0, 1.28, 0, mulC(ar.cloth, .75), { n: 4, l: L_CLOTH, r: [0, PI / 4, 0] }); S.sph(.09, 0, 1.74, 0, ar.stripe, { w: 6, h: 4 });
      S.box(.42, .62, .05, 0, .3, .76, COL.black, { jit: 0 });
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.seg([x * .76, .84, z * .76], [x * 1.25, -.02, z * 1.25], .012, .012, COL.rope, { n: 3, jit: 0 });
    }
  },
  // 좁고 긴 세로 깃발(노보리·기치). 깃대 아래가 원점.
  nobori(S, rng, col, col2, h = 3.0) {
    S.seg([0, -.1, 0], [0, h, 0], .04, .03, COL.woodD, { l: L_WOOD, n: 4 }); S.seg([-.03, h - .08, 0], [.46, h - .08, 0], .022, .022, COL.woodD, { n: 3 });
    clothPanel(S, { x0: .04, x1: .44, yTop: h - .1, len: h * .62, z: 0, col, col2, rng, sway: .5, rag: .15, nx: 3, ny: 8 });
  },
  // 술데(몽골의 말총 깃대). 침공군의 술데는 검은 말총이다.
  sulde(S, rng, col, h = 3.0) {
    S.seg([0, -.1, 0], [0, h, 0], .045, .03, COL.woodD, { l: L_WOOD, n: 4 }); S.cone(.05, .3, 0, h + .14, 0, COL.steel, { n: 4, l: L_METAL, rough: .4 });
    S.cyl(.17, .06, 0, h - .04, 0, COL.iron, { n: 8, l: L_METAL });
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, x = Math.cos(a) * .15, z = Math.sin(a) * .15, wx = -Math.sin(a) * .06, wz = Math.cos(a) * .06, len = rng.range(.6, .85); ribbon(S, [x - wx, h - .06, z - wz], [x + wx, h - .06, z + wz], [x * 1.5 + wx * .5, h - .06 - len, z * 1.5 + wz * .5], [x * 1.5 - wx * .5, h - .06 - len, z * 1.5 - wz * .5], mulC(col, .8 + .3 * rng()), [.1, .1, .8, .8]); }
  },
  // 군기: 군대에 따라 깃발 모양이 다르다.
  armyFlag(S, rng, ar, h) {
    if (ar.key === 'mongol' && rng() < .6) PROP.sulde(S, rng, C(0x211e1d), h || 3.0);   // 전시의 술데는 검은 말총
    else if (ar.key === 'wa') PROP.nobori(S, rng, rng() < .5 ? ar.flag : ar.flag2, rng() < .5 ? ar.main : ar.mark, h || 3.1);
    else PROP.banner(S, rng, ar.flag, h || 2.8, ar.flag2);
  },
  // 비석: 거북 받침(귀부) 위의 빗돌.
  biseok(S, rng) {
    S.ico(.5, 0, .16, 0, COL.stoneD, { sc: [1.0, .42, 1.35], d: 1, l: L_ROCK }); S.ico(.17, 0, .26, .7, COL.stoneD, { d: 1, l: L_ROCK });
    S.box(.5, 1.25, .16, 0, .95, 0, COL.stone, { l: L_ROCK, jit: .02 }); S.box(.7, .26, .28, 0, 1.68, 0, COL.stoneL, { l: L_ROCK });
    S.box(.32, .8, .02, 0, .98, .09, mulC(COL.stoneD, .6), { jit: 0 });
  },
  // 삼층석탑.
  seoktap(S, rng) {
    const c = () => mixC(COL.stone, COL.stoneL, rng() * .7);
    S.box(1.7, .22, 1.7, 0, .11, 0, COL.stoneD, { l: L_MASON }); S.box(1.3, .4, 1.3, 0, .42, 0, c(), { l: L_ROCK }); S.box(1.5, .1, 1.5, 0, .67, 0, c(), { l: L_ROCK });
    let y = .72, w = .82;
    for (let k = 0; k < 3; k++) {
      const bh = k ? .3 : .62; S.box(w, bh, w, 0, y + bh / 2, 0, c(), { l: L_ROCK }); y += bh;
      S.box(w * 1.28, .08, w * 1.28, 0, y + .04, 0, c(), { l: L_ROCK });
      S.add(gCyl(4, .5), { s: [w * 1.3, .2, w * 1.3], p: [0, y + .18, 0], r: [0, PI / 4, 0], c: c(), l: L_ROCK });
      y += .28; w *= .8;
    }
    S.cyl(.1, .14, 0, y + .07, 0, c(), { n: 6, l: L_ROCK }); S.sph(.11, 0, y + .22, 0, c(), { w: 6, h: 4, l: L_ROCK }); S.cone(.05, .3, 0, y + .45, 0, COL.stoneL, { n: 4 });
  },
  // 고구려 돌무지무덤(적석총).
  jeokseok(S, rng) {
    const N = 5;
    for (let k = 0; k < N; k++) { const w = 3.5 - k * .52; S.box(w, .4, w, 0, k * .36 + .18, 0, mixC(COL.stoneD, COL.stone, .25 + .55 * rng()), { l: L_MASON, jit: .03 }); }
    S.box(1.0, .36, 1.0, 0, N * .36 + .16, 0, COL.stoneL, { l: L_MASON });
    for (const [x, z, r] of [[-1.1, 1.85, .25], [.2, 1.85, .25], [1.3, 1.85, .25], [1.85, .9, -.25], [1.85, -.4, -.25]]) S.box(r > 0 ? .5 : .22, 1.0, r > 0 ? .22 : .5, x, .42, z, COL.stone, { l: L_ROCK, r: r > 0 ? [-.3, 0, 0] : [0, 0, .3] });
  },
  // 서낭당: 당산나무와 돌무더기, 금줄과 오방색 천.
  seonang(S, rng, bare) {
    const T = new Soup(); if (bare) PROP.tree(T, rng, 4.4); else PROP.broadleaf(T, rng, 4.6); S.merge(T, { ao: null });
    S.ico(1.0, 0, .08, 0, COL.stoneD, { sc: [1.25, .5, 1.25], d: 1, l: L_ROCK });
    for (let k = 0; k < 18; k++) { const a = rng() * TAU, d = rng.range(.45, 1.3), r = rng.range(.14, .28); S.rock(r, Math.cos(a) * d, r * .4 + Math.max(0, 1.3 - d) * .38, Math.sin(a) * d, mixC(COL.stoneD, COL.stoneL, rng()), { d: 0, sq: .8 }); }
    const y0 = 1.5;
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = Math.cos(a) * .3, z = Math.sin(a) * .3, wx = -Math.sin(a) * .07, wz = Math.cos(a) * .07, len = rng.range(.35, .75); ribbon(S, [x - wx, y0, z - wz], [x + wx, y0, z + wz], [x * 1.2 + wx, y0 - len, z * 1.2 + wz], [x * 1.2 - wx, y0 - len, z * 1.2 - wz], bf_OBANG[k % 5], [.1, .1, .9, .9]); }
    S.cyl(.31, .05, 0, y0, 0, COL.rope, { n: 8, jit: 0 });
  },
  // 나룻배.
  boat(S, rng) {
    const w = mulC(COL.wood, .8 + .3 * rng()), T = new Soup();
    T.box(1.9, .07, .5, 0, .06, 0, mulC(w, .8), { l: L_WOOD });
    for (const s of [-1, 1]) T.box(2.1, .3, .06, 0, .2, s * .3, w, { l: L_WOOD, r: [s * .32, 0, 0] });
    for (const s of [-1, 1]) T.box(.07, .32, .66, s * 1.0, .22, 0, mulC(w, .9), { l: L_WOOD, r: [0, 0, -s * .45] });
    T.box(.1, .05, .6, .3, .26, 0, COL.woodD, { l: L_WOOD });
    T.seg([-.7, .34, .1], [.9, .28, .5], .025, .02, COL.woodL, { l: L_WOOD, n: 4 });
    S.merge(T, { r: [rng.range(-.05, .05), 0, rng.range(-.12, .12)], ao: [0, .3, .7] });
  },
  // 토산: 공성군이 성벽보다 높이 쌓아 올린 흙산(안시성).
  tosan(S, rng, ar) {
    const RX = 3.1, RZ = 2.5, HY = 1.7;
    S.ico(1, 0, .05, 0, mulC(COL.earth, 1.1), { sc: [RX, HY, RZ], d: 2, l: L_DIRT, jit: .04, cf: v => .7 + .3 * sat(v.y / HY) });
    for (const y of [.35, .85, 1.3]) {
      const k = Math.sqrt(Math.max(0, 1 - (y / HY) * (y / HY))); let prev = null;
      for (let j = 0; j <= 12; j++) { const a = j / 12 * TAU, p = [Math.cos(a) * RX * k, y, Math.sin(a) * RZ * k]; S.box(.1, .5, .1, p[0], p[1] + .1, p[2], COL.woodD, { l: L_WOOD }); if (prev) S.seg([prev[0], prev[1] + .22, prev[2]], [p[0], p[1] + .22, p[2]], .045, .045, mulC(COL.wood, .7 + .3 * rng()), { l: L_WOOD, n: 4 }); prev = p; }
    }
    for (const s of [-1, 1]) { const T = new Soup(); PROP.armyFlag(T, rng, ar, 2.6); S.merge(T, { p: [s * .7, HY - .1, rng.range(-.3, .3)], ry: rng() * TAU, ao: null }); }
  },
});


function buildBridge(B) {
  const i = B.ci0, x = B.px[i], z = B.pz[i], ang = Math.atan2(B.tz[i], B.tx[i]), rng = B.rng, T = new Soup();
  const y0 = B.py[i], bed = B.wlc - .5 - y0, spring = B.wlc + .08 - y0, wHalf = ROAD_HALF + .34, A = 1.3;
  const yd = u => B.py[clamp(Math.round(i + u / PATH_STEP), 0, B.n - 1)] - y0;
  const crown = yd(0) - .34;
  const yArch = u => spring + (crown - spring) * Math.sqrt(Math.max(0, 1 - (u / A) * (u / A)));
  const mc = () => mixC(COL.stoneD, COL.stoneL, rng());
  for (let k = -5; k < 5; k++) {
    const u = (k + .5) * .62, top = yd(u);
    T.box(.63, .26, wHalf * 2 - .1, u, top - .16, 0, COL.stoneD, { l: L_MASON });
    for (const side of [-1, 1]) {
      const zz = side * wHalf;
      T.box(.63, .52, .3, u, top + .22, zz, mc(), { l: L_MASON });
      if (k % 2 === 0) T.box(.3, .14, .36, u, top + .55, zz, mc(), { l: L_MASON });
      const bot = Math.abs(u) < A ? yArch(u) : bed - .3;
      if (top - .05 - bot > .04) T.box(.63, top - .05 - bot, .3, u, (top - .05 + bot) / 2, zz, mc(), { l: L_MASON });
    }
  }
  for (const side of [-1, 1]) {
    for (let k = 0; k <= 8; k++) { const th = PI * k / 8, u = Math.cos(th) * A; T.box(.42, .22, .38, u, spring + (crown - spring) * Math.sin(th) - .05, side * wHalf, COL.stoneL, { l: L_MASON, r: [0, 0, th - HPI] }); }
    for (const u of [-3.25, 3.25]) { const t = yd(u); T.box(.5, 1.25, .5, u, t + .3, side * wHalf, mc(), { l: L_MASON }); T.box(.62, .13, .62, u, t + .98, side * wHalf, COL.stoneL, { l: L_MASON }); T.cone(.2, .25, u, t + 1.15, side * wHalf, COL.stoneD, { n: 4, l: L_ROCK }); }
  }
  if (B.bio.key === 'frost') for (const side of [-1, 1]) for (let u = -1.15; u <= 1.16; u += .21) { const h = rng.range(.12, .55); T.cone(.04 + .03 * rng(), h, u, yArch(u) - h / 2 - .04, side * (wHalf + .03), COL.ice, { n: 5, r: [PI, 0, 0], rough: .14, emis: .012 }); }
  B.put(T, x, z, { y: y0, ry: -ang, ao: null });
  B.bridge = { x, z, y: y0 };
}

function buildPads(B) {
  const bright = B.bio.key === 'frost' || B.bio.key === 'dunes', top = bright ? C(0x5a6070) : C(0x8e929e), rim = bright ? C(0x363a46) : C(0x565a66), brass = mulC(COL.brass, bright ? 1.7 : 1.25);
  for (const p of B.pads) {
    const T = new Soup(), rng = B.rng;
    T.cyl(1.36, .34, 0, .12, 0, mulC(rim, .8), { n: 8, l: L_MASON, r: [0, PI / 8, 0] });
    T.cyl(1.2, .05, 0, .3, 0, top, { n: 8, l: L_MASON, r: [0, PI / 8, 0], emis: .03 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; T.box(.46, .2, .28, Math.cos(a) * 1.34, .1 + rng() * .06, Math.sin(a) * 1.34, mixC(rim, top, rng() * .5), { l: L_ROCK, r: [rng.range(-.1, .1), -a + HPI, 0], emis: .026 }); }
    for (let k = 0; k < 8; k++) { const a = (k + .5) / 8 * TAU; T.box(.62, .03, .09, Math.cos(a) * .8, .333, Math.sin(a) * .8, brass, { l: L_METAL, rough: .4, emis: .07, jit: 0, r: [0, -a + HPI, 0] }); }
    for (const r of [0, HPI]) T.box(.5, .03, .09, 0, .333, 0, brass, { l: L_METAL, rough: .4, emis: .07, jit: 0, r: [0, r, 0] });
    B.put(T, p.x, p.z, { y: p.y0, ry: rng() * TAU, ao: [0, .3, .7] });
  }
}


// 산성의 정문과 봉수대. 시대(bio.era)에 따라 문루 지붕·기둥·깃발이 달라진다.
// - 고구려: 붉은 기둥의 맞배지붕, 금빛 치미 / 고려: 비취 기와 우진각 / 조선: 검은 기와 우진각과 단청 띠
// - 행주산성(dunes)은 사료대로 양옆 성벽이 토성 + 목책이다.
function buildKeep(B) {
  const rng = B.rng, kx = B.kx, ky = B.keepY, oz = -12.35, bio = B.bio, E = bf_style(bio);
  const TG = new Soup(), TT = new Soup();
  const st = COL.stone, sdk = COL.stoneD, sl = COL.stoneL;
  const mc = () => mixC(sdk, sl, rng() * .8 + .1);
  const mas = (S, w, h, d, x, y, z, c, o = {}) => S.box(w, h, d, x, y, z, c || mc(), Object.assign({ l: L_MASON }, o));
  const WH = 3.0, WZ = -.95, WT = 1.3, plaster = mulC(C(0xd8ccb0), .9), snow = bio.key === 'frost';
  const flag = (S, x, y, z, h, ry) => { const T = new Soup(); PROP.banner(T, rng, E.flag, h, E.flag2); S.merge(T, { p: [x, y, z], ry: ry || 0, ao: null }); };

  // 기단, 문 앞 디딤돌
  mas(TG, 11.4, .5, 6.0, -.3, -.2, -2.9, sdk);
  for (let k = 0; k < 5; k++) mas(TG, 1.1, .16, .55, -2.2 + k * 1.1, .1, .25, mc());

  // 체성(석축 성벽)과 여장
  const wallBlock = (x, w, top, g) => {
    mas(TG, w, top - g + .8, WT, x, (top + g - .8) / 2, WZ, rng() < .5 ? st : mc());
    mas(TG, w + .02, .7, WT + .22, x, g + .2, WZ, sdk);
    mas(TG, w + .02, .16, WT + .1, x, top + .08, WZ, sl);
  };
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) wallBlock(s * (1.65 + (k + .5) * 1.22), 1.22, WH, 0);
    bf_yeojang(TG, s > 0 ? 1.8 : -5.31, s > 0 ? 5.31 : -1.8, WH + .16, WZ + WT / 2 - .18, st, sl, rng);
  }
  // 능선을 따라 이어지는 양옆 성벽 — 타워 터·개울·길을 만나면 멈춘다
  const wood = bio.key === 'dunes', Z = oz + WZ; let wx0 = kx - 5.31, wx1 = kx + 5.31;
  for (const s of [-1, 1]) {
    let top = WH, endX = 5.31, endG = 0;
    for (let k = 0; k < 8; k++) {
      const w = 1.3, lx = s * (5.31 + (k + .5) * w), X = kx + lx;
      if (Math.abs(X) > BH - 1.2) break;
      if (B.pads.some(p => Math.hypot(p.x - X, p.z - Z) < 2.8) || B.dStrAt(X, Z) < 2.5 || B.dRoadAt(X, Z) < ROAD_HALF + 1.5) break;
      const ha = B.heightAt(X - w / 2, Z) - ky, hb = B.heightAt(X + w / 2, Z) - ky, hc = B.heightAt(X, Z - .5) - ky, g = Math.max(ha, hb, hc), g0 = Math.min(ha, hb, B.heightAt(X, Z + .6) - ky);
      if (wood) {
        top = Math.max(g + 2.0, top - .35);
        TG.box(w + .04, g + .55 - (g0 - .9), WT + 1.0, lx, (g + .55 + g0 - .9) / 2, WZ, mulC(COL.earth, .9 + .2 * rng()), { l: L_DIRT, jit: .04 });
        for (let j = 0; j < 5; j++) { const x = lx - w / 2 + (j + .5) * w / 5, hh = top - g - .4 + rng.range(-.12, .12), c = mulC(COL.wood, .65 + .35 * rng()); TG.cyl(.125, hh, x, g + .45 + hh / 2, WZ + rng.range(-.03, .03), c, { n: 6, l: L_WOOD }); TG.cone(.125, .28, x, g + .45 + hh + .14, WZ, mulC(c, 1.15), { n: 6, l: L_WOOD }); }
        TG.box(w, .09, .08, lx, g + 1.3, WZ + .15, COL.woodD, { l: L_WOOD });
      } else {
        top = Math.max(g + 1.6, top - .3);
        wallBlock(lx, w, top, g0); bf_yeojang(TG, lx - w / 2, lx + w / 2, top + .16, WZ + WT / 2 - .18, st, sl, rng);
      }
      endX = 5.31 + (k + 1) * w; endG = g0;
      if (s < 0) wx0 = X - w / 2; else wx1 = X + w / 2;
      if (k === 2 || k === 6) flag(TG, lx, top + (wood ? -.3 : .16), WZ - .25, 2.3, rng.range(-.3, .3));
    }
    for (let j = 0; j < 4; j++) TG.rock(rng.range(.25, .5), s * (endX + rng.range(.1, .9)), endG + .15, WZ + rng.range(-.5, .5), mc());
  }
  B.keepWall = { x0: wx0, x1: wx1, z: Z };

  // 홍예문(무지개문)
  const GZ = -.75, GT = 1.5;
  for (let k = 0; k <= 8; k++) { const th = PI * k / 8; mas(TG, .4, .3, GT + .1, Math.cos(th) * 1.12, 1.5 + Math.sin(th) * 1.12, GZ, sl, { r: [0, 0, th - HPI] }); }
  for (const s of [-1, 1]) { mas(TG, .5, .95, GT, s * 1.12, 2.32, GZ, st); mas(TG, .3, 1.5, GT + .04, s * 1.2, .75, GZ, sl); mas(TG, .52, 3.3, GT, s * 1.56, 1.65, GZ, st); }
  mas(TG, 3.6, .72, GT, 0, 2.94, GZ, st); mas(TG, 3.74, .14, GT + .1, 0, 3.37, GZ, sl);
  TG.box(2.2, 2.7, .2, 0, 1.35, -1.42, COL.black, { jit: 0 }); TG.box(2.2, .2, 1.3, 0, 2.75, -.8, COL.black, { jit: 0 });
  for (const s of [-1, 1]) {   // 활짝 열린 성문
    TG.box(.09, 2.15, .92, s * 1.0, 1.08, .44, mulC(COL.wood, .9), { l: L_WOOD, r: [0, s * .16, 0] });
    for (const y of [.5, 1.1, 1.7]) TG.box(.12, .08, .94, s * 1.0, y, .44, COL.iron, { l: L_METAL, r: [0, s * .16, 0] });
    TG.seg([s * 1.56, 1.95, .0], [s * 1.56, 2.18, .36], .035, .03, COL.iron, { l: L_METAL, n: 4 }); TG.cyl(.09, .14, s * 1.56, 2.22, .38, COL.iron, { n: 6, l: L_METAL, rt: 1.4 });
    B.fires.push({ x: kx + s * 1.56, y: ky + 2.38, z: oz + .38, size: .42, type: 'sconce' });
  }

  // 문루
  const PY = 3.46;
  TG.box(4.8, .12, 2.6, 0, PY, -.9, COL.wood, { l: L_WOOD });
  for (const x of [-2.05, -.7, .7, 2.05]) for (const z of [.2, -2.0]) TG.box(.18, 1.32, .18, x, PY + .7, z, E.post, { l: L_WOOD });
  for (const z of [.26, -2.06]) { TG.box(4.3, .09, .06, 0, PY + .46, z, mulC(E.post, .75), { l: L_WOOD }); TG.box(4.2, .3, .04, 0, PY + .22, z, COL.woodD, { l: L_WOOD }); }
  for (const x of [-2.11, 2.11]) { TG.box(.06, .09, 2.3, x, PY + .46, -.9, mulC(E.post, .75), { l: L_WOOD }); TG.box(.04, .3, 2.2, x, PY + .22, -.9, COL.woodD, { l: L_WOOD }); }
  TG.box(4.4, .24, 2.5, 0, PY + 1.44, -.9, E.band, { l: L_WOOD }); TG.box(4.56, .07, 2.66, 0, PY + 1.6, -.9, E.trim, { l: L_WOOD });
  TG.box(1.0, .4, .04, 0, PY + 1.18, .3, E.trim, { jit: 0 }); TG.box(.86, .28, .05, 0, PY + 1.18, .31, COL.black, { jit: 0 });
  bf_roof(TG, { w: 5.9, d: 3.9, h: 1.3, x: 0, y: PY + 1.62, z: -.9, kind: E.roof, tile: E.tile, ridge: E.ridge, rng, lift: E.roof === 'gable' ? .18 : .36, ns: 8, snow, emis: snow ? .018 : .025 });

  // 적대: 문 양옆으로 내민 성벽
  for (const s of [-1, 1]) {
    const x = s * 3.6, top = WH + .22;
    mas(TG, 1.9, top + .8, 1.55, x, (top - .8) / 2, .1, st, { jit: .03 }); mas(TG, 2.0, .7, 1.66, x, .25, .1, sdk); mas(TG, 2.0, .16, 1.66, x, top + .08, .1, sl);
    bf_yeojang(TG, x - .96, x + .96, top + .16, .74, st, sl, rng);
    for (const q of [-1, 1]) for (const z of [-.2, .34]) { mas(TG, .3, .46, .44, x + q * .82, top + .39, z, st); }
    flag(TG, x + s * .5, top + .16, -.05, 2.5, s * .35);
  }

  // 성 안: 군창과 군량, 뒤쪽 낮은 성벽
  mas(TG, 3.0, .5, 2.3, 2.9, .25, -3.9, sdk); TG.box(2.3, 1.12, 1.5, 2.9, 1.06, -3.9, plaster, { l: L_PLAIN, rough: .95 });
  for (const dx of [-1.15, -.38, .38, 1.15]) for (const dz of [-.75, .75]) TG.box(.14, 1.16, .14, 2.9 + dx, 1.08, -3.9 + dz, E.post, { l: L_WOOD });
  TG.box(.5, .8, .04, 2.9, .92, -3.13, COL.black, { jit: 0 }); TG.box(2.4, .16, 1.6, 2.9, 1.68, -3.9, E.band, { l: L_WOOD });
  bf_roof(TG, { w: 3.6, d: 2.8, h: .95, x: 2.9, y: 1.74, z: -3.9, kind: E.roof, tile: E.tile, ridge: E.ridge, rng, lift: E.roof === 'gable' ? .12 : .24, snow, emis: snow ? .018 : .025 });
  for (let k = 0; k < 6; k++) mas(TG, 1.22, 1.5, .6, -1.5 + (k + .5) * 1.22 - .3, .75, -5.5, k & 1 ? st : mc());
  bf_yeojang(TG, -1.8, 5.5, 1.5, -5.42, st, sl, rng);
  { const S1 = new Soup(); PROP.bales(S1, rng); TG.merge(S1, { p: [-.9, .05, -3.3], ry: .5, ao: null }); const S2 = new Soup(); PROP.bales(S2, rng); TG.merge(S2, { p: [-1.5, .05, -4.2], ry: -1.1, ao: null }); }
  for (const [x, z] of [[.3, -4.5], [.75, -4.3], [.5, -4.85], [4.7, -2.4], [4.9, -2.85]]) { const J = new Soup(); PROP.jar(J, rng, C(0x4a3226)); TG.merge(J, { p: [x, .05, z], ao: null }); }
  PROP.crate(TG, -2.1, .05, -2.5, .55, rng, .4);
  flag(TG, .9, .05, -3.2, 4.6, .4);

  // 봉수대: 석축 연대 위의 연조(굴뚝 아궁이)
  const bx = -4.0, bz = -3.5, bh = 6.4, rAt = y => 1.72 * (1 - .27 * y / bh);
  TT.cyl(2.1, 1.1, bx, .5, bz, sdk, { n: 10, l: L_MASON, rt: .9 });
  TT.cyl(1.72, bh, bx, bh / 2, bz, st, { n: 10, l: L_MASON, rt: .73, jit: .03 });
  for (let c = 0; c < 6; c++) { const y = 1.45 + c * .88; TT.cyl(rAt(y) + .03, .17, bx, y, bz, mc(), { n: 10, l: L_MASON }); }
  TT.cyl(1.24, .42, bx, bh - .12, bz, sl, { n: 10, l: L_MASON, rt: 1.36 });
  TT.cyl(1.78, .22, bx, bh + .2, bz, st, { n: 10, l: L_MASON });
  for (let k = 0; k < 10; k++) { const a = (k + .5) / 10 * TAU; if (k === 0) continue; mas(TT, .7, .44, .28, bx + Math.cos(a) * 1.6, bh + .53, bz + Math.sin(a) * 1.6, null, { r: [0, -a + HPI, 0] }); TT.box(.76, .07, .34, bx + Math.cos(a) * 1.6, bh + .78, bz + Math.sin(a) * 1.6, sl, { l: L_MASON, r: [0, -a + HPI, 0] }); }
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .9, y = bh * (.38 + k * .16); TT.box(.14, .5, .12, bx + Math.cos(a) * (rAt(y) + .01), y, bz + Math.sin(a) * (rAt(y) + .01), COL.black, { jit: 0, r: [0, -a + HPI, 0] }); }
  TT.cyl(.8, .98, bx, bh + .78, bz, sdk, { n: 8, l: L_MASON, rt: .66 });
  TT.cyl(.6, .12, bx, bh + 1.3, bz, sl, { n: 8, l: L_MASON });
  { const a = PI / 4; TT.box(.36, .42, .14, bx + Math.cos(a) * .7, bh + .56, bz + Math.sin(a) * .7, COL.black, { jit: 0, r: [0, -a + HPI, 0] }); TT.box(.3, .1, .16, bx + Math.cos(a) * .71, bh + .44, bz + Math.sin(a) * .71, COL.ember, { jit: 0, emis: .35, r: [0, -a + HPI, 0] }); }
  TT.cyl(.5, .06, bx, bh + 1.37, bz, COL.ember, { n: 8, emis: .5, jit: 0 });
  for (let k = 0; k < 4; k++) { const a = k * 1.3; TT.seg([bx + Math.cos(a) * .5, bh + 1.4, bz + Math.sin(a) * .5], [bx - Math.cos(a) * .45, bh + 1.56, bz - Math.sin(a) * .45], .09, .08, mulC(COL.bark, .7), { l: L_WOOD, n: 5, emis: .05 }); }
  { // 오르내리는 사다리
    const a0 = [bx + 1.25, .1, bz + 2.05], a1 = [bx + .85, bh + .35, bz + 1.4];
    for (const q of [-.2, .2]) TT.seg([a0[0] + q, a0[1], a0[2] + q * .3], [a1[0] + q, a1[1], a1[2] + q * .3], .04, .04, COL.woodD, { l: L_WOOD, n: 4 });
    for (let k = 1; k < 12; k++) { const t = k / 12, p = [lerp(a0[0], a1[0], t), lerp(a0[1], a1[1], t), lerp(a0[2], a1[2], t)]; TT.seg([p[0] - .2, p[1], p[2] - .06], [p[0] + .2, p[1], p[2] + .06], .025, .025, COL.wood, { l: L_WOOD, n: 3 }); }
  }
  clothPanel(TT, { x0: bx - .42, x1: bx + .42, yTop: 4.9, len: 2.1, z: bz + rAt(4.2) + .1, col: E.flag, col2: E.flag2, rng, sway: .45 });
  TT.seg([bx - .5, 4.92, bz + rAt(4.9) + .08], [bx + .5, 4.92, bz + rAt(4.9) + .08], .03, .03, COL.woodD, { l: L_WOOD, n: 4 });

  B.structs.push({ soup: new Soup().merge(TG, { p: [kx, ky, oz], ao: [0, .9, .7] }), cx: kx, cy: ky, cz: oz - 2.5, kind: 'keep' });
  B.structs.push({ soup: new Soup().merge(TT, { p: [kx, ky, oz], ao: [0, 1.4, .65] }), cx: kx + bx, cy: ky, cz: oz + bz, kind: 'beaconTower' });
  B.beacon = { x: kx + bx, y: ky + bh + 1.5, z: oz + bz };
  B.gate = { x: kx, y: ky, z: -11.4 };
}

// 적 진문(陣門): 벼랑 사이 길목을 막은 통나무 문과 군막 지붕, 침공군(bio.army) 깃발.
// 안쪽의 어두운 통로는 원작 동굴과 같은 크기 — 적이 여기서 모습을 드러낸다.
function buildCave(B) {
  const rng = B.rng, zc = B.zc, T = new Soup(), D = new Soup(), A = bf_army(B.bio);
  let i0 = 0; for (let i = 0; i < B.n; i++) if (B.px[i] >= -14.6) { i0 = i; break; }
  const y0 = B.py[i0], ox = -14.5;
  const rk = (r, x, y, z, o = {}) => T.rock(r, x, y, z, mixC(COL.stoneD, COL.stone, rng() * .7), o);
  const wd = () => mulC(COL.wood, .62 + .36 * rng());
  for (const s of [-1, 1]) { rk(1.25, -.5, .6, s * 3.15); rk(1.0, -1.4, 1.7, s * 3.2); rk(.62, 1.0, .3, s * 2.75); rk(.45, 1.6, .2, s * 2.4); }
  // 어두운 통로
  T.box(3.8, .2, 3.7, -1.9, 3.05, 0, COL.black, { jit: 0 }); T.box(.2, 3.4, 3.7, -3.45, 1.5, 0, COL.black, { jit: 0 });
  for (const s of [-1, 1]) T.box(3.8, 3.2, .2, -1.9, 1.5, s * 1.82, mulC(COL.woodD, .2), { l: L_WOOD, jit: 0 });
  // 통나무 벽
  for (const s of [-1, 1]) {
    for (let x = -3.55; x < .2; x += .34) { const hh = 3.25 + rng.range(-.08, .14); T.cyl(.18, hh, x, hh / 2 - .15, s * 2.08, wd(), { n: 6, l: L_WOOD }); }
    T.box(3.9, .12, .1, -1.75, 2.2, s * 2.28, COL.woodD, { l: L_WOOD }); T.box(3.9, .12, .1, -1.75, 1.0, s * 2.28, COL.woodD, { l: L_WOOD });
    for (let z = 1.72; z < 2.3; z += .3) { const hh = 3.3 + rng.range(-.05, .1); T.cyl(.16, hh, .22, hh / 2 - .15, s * z, wd(), { n: 6, l: L_WOOD }); }
    T.cyl(.24, 4.0, .34, 1.9, s * 1.86, mulC(COL.woodD, 1.1), { n: 7, l: L_WOOD }); T.cone(.24, .4, .34, 4.1, s * 1.86, COL.wood, { n: 7, l: L_WOOD });
    T.seg([.42, 2.35, s * 1.86], [.72, 2.62, s * 1.86], .035, .03, COL.iron, { l: L_METAL, n: 4 }); T.cyl(.09, .14, .74, 2.66, s * 1.86, COL.iron, { n: 6, l: L_METAL, rt: 1.4 });
    B.fires.push({ x: ox + .74, y: y0 + 2.82, z: zc + s * 1.86, size: .4, type: 'sconce' });
  }
  T.seg([.34, 3.2, -2.3], [.34, 3.2, 2.3], .15, .15, COL.woodD, { l: L_WOOD, n: 6 }); T.seg([.34, 3.62, -2.2], [.34, 3.62, 2.2], .1, .1, COL.wood, { l: L_WOOD, n: 6 });
  for (let z = -1.5; z <= 1.51; z += .5) T.box(.08, .42, .1, .34, 3.41, z, COL.woodD, { l: L_WOOD });
  // 군막 지붕: 군대 색 줄무늬
  const RY = 3.3, RH = 1.3, RB = 2.55, X0 = -3.75, X1 = .62, UP = [0, 1, 0];
  for (const s of [-1, 1]) for (let j = 0; j < 4; j++) {
    const t0 = j / 4, t1 = (j + 1) / 4, c = mulC(j === 1 ? A.stripe : A.cloth, .82 + .2 * rng()), sag = t => RY + RH * Math.pow(t, 1.25);
    bf_q(T, [X0, sag(t0), s * RB * (1 - t0)], [X1, sag(t0), s * RB * (1 - t0)], [X1, sag(t1), s * RB * (1 - t1)], [X0, sag(t1), s * RB * (1 - t1)], UP, c, L_CLOTH, .95, { emis: j === 0 ? 0 : .02 });
  }
  bf_q(T, [X1, RY, -RB], [X1, RY, RB], [X1, RY + RH, 0], [X1, RY + RH, 0], [1, 0, 0], mulC(A.cloth, .9), L_CLOTH, .95);
  { // 진문 휘장의 문양: 진주성의 왜군은 구요(아홉 개의 원), 행주의 왜군은 두 줄 띠, 그 밖은 둥근 표지
    const dot = (y, z, r) => T.cyl(r, .05, X1 + .03, y, z, A.mark, { n: 9, r: [0, 0, HPI], jit: 0, l: L_CLOTH }), cy = RY + .47;
    if (A.key === 'wa' && B.bio.key === 'ember') { dot(cy, 0, .15); for (let k = 0; k < 8; k++) dot(cy + Math.sin(k / 8 * TAU) * .33, Math.cos(k / 8 * TAU) * .33, .085); }
    else if (A.key === 'wa') { for (const y of [cy - .12, cy + .14]) T.box(.05, .13, 1.5 - (y - RY) * 1.6, X1 + .03, y, 0, A.mark, { jit: 0, l: L_CLOTH }); }
    else dot(cy, 0, .4);
  }
  T.seg([X0, RY + RH + .03, 0], [X1 + .1, RY + RH + .03, 0], .07, .07, COL.woodD, { l: L_WOOD, n: 5 });
  { const V = new Soup(); clothPanel(V, { x0: -1.6, x1: 1.6, yTop: 3.08, len: .62, z: 0, col: A.flag, col2: A.flag2, rng, sway: .3, rag: 0, nx: 8, ny: 3 }); T.merge(V, { p: [.52, 0, 0], ry: HPI, ao: null }); }
  for (const s of [-1, 1]) { const F = new Soup(); PROP.armyFlag(F, rng, A, 4.7); T.merge(F, { p: [.5, .0, s * 2.75], ry: s > 0 ? .2 : -.5, ao: null }); }
  if (B.bio.key === 'frost') for (let z = -1.6; z <= 1.61; z += .22) { const h = rng.range(.15, .5); T.cone(.04 + .03 * rng(), h, .34, 3.05 - h / 2, z, COL.ice, { n: 5, r: [PI, 0, 0], rough: .14, emis: .012 }); }
  for (const xx of [-.35, -.95, -1.55, -2.2, -2.85]) D.quad([xx, 0, 1.8], [xx, 0, -1.8], [xx, 3.0, -1.8], [xx, 3.0, 1.8], WHITE, L_PLAIN, 1);
  B.structs.push({ soup: new Soup().merge(T, { p: [ox, y0, zc], ao: null }), cx: ox - 1.2, cy: y0, cz: zc, kind: 'cave', extras: [{ soup: new Soup().merge(D, { p: [ox, y0, zc], ao: null }), mat: MAT.dark, order: 2 }] });
  B.cave = { x: ox, y: y0, z: zc, s: Math.max(.6, (i0 - 5) * PATH_STEP) };
}

function scatterProps(B) {
  const rng = B.rng, placed = [], H = B.heightAt;
  const free = (x, z, r, roadMin = .6) => {
    if (Math.abs(x) > BH - .7 - r || Math.abs(z) > BH - .7 - r) return false;
    if (B.dRoadAt(x, z) < ROAD_HALF + roadMin + r) return false;
    if (B.dStrAt(x, z) < 1.5 + r) return false;
    for (const p of B.pads) if (dist2(x, z, p.x, p.z) < (2.15 + r) * (2.15 + r)) return false;
    if (Math.abs(x - B.kx) < 5.7 + r && z < -11.2 + r) return false;
    if (B.keepWall && x > B.keepWall.x0 - .4 - r && x < B.keepWall.x1 + .4 + r && Math.abs(z - B.keepWall.z) < 1.15 + r) return false;
    if (x < -12.4 && Math.abs(z - B.zc) < 3.6 + r) return false;
    for (const q of B.ponds) if (dist2(x, z, q.x, q.z) < (q.r * 1.25 + .9 + r) * (q.r * 1.25 + .9 + r)) return false;
    for (const q of placed) if (dist2(x, z, q[0], q[1]) < (q[2] + r) * (q[2] + r)) return false;
    return true;
  };
  const waterD = (x, z) => { let d = B.dStrAt(x, z); for (const q of B.ponds) d = Math.min(d, Math.hypot(x - q.x, z - q.z) - q.r); return d; };
  const slope = (x, z) => Math.abs(H(x + .5, z) - H(x - .5, z)) + Math.abs(H(x, z + .5) - H(x, z - .5));
  const find = (r, o = {}) => {
    for (let t = 0; t < 90; t++) {
      const x = rng.range(-BH + 1, BH - 1), z = rng.range(-BH + 1, BH - 1);
      if (!free(x, z, r, o.roadMin)) continue;
      if (!o.steep && slope(x, z) > (o.maxSlope || .32)) continue;
      const dr = B.dRoadAt(x, z); if (o.near && dr > o.near) continue; if (o.far && dr < o.far) continue;
      if (o.water && waterD(x, z) > o.water) continue;
      return [x, z];
    }
    return null;
  };
  const drop = (build, r, o = {}) => { const p = o.at || find(r, o); if (!p) return null; const T = new Soup(); build(T); B.put(T, p[0], p[1], { ry: o.ry === undefined ? rng() * TAU : o.ry, s: o.s, r: o.r, dy: o.dy, ao: o.ao }); placed.push([p[0], p[1], r]); return p; };
  const beside = (smin, smax, d, r) => {
    for (let t = 0; t < 40; t++) {
      const i = clamp(Math.round(rng.range(smin, smax) / PATH_STEP), 2, B.n - 3), side = rng.sign();
      const x = B.px[i] - B.tz[i] * side * (ROAD_HALF + d), z = B.pz[i] + B.tx[i] * side * (ROAD_HALF + d);
      if (free(x, z, r, d - r - .05) && slope(x, z) < .4) return [x, z, Math.atan2(B.tz[i], B.tx[i]), side];
    }
    return null;
  };
  const bio = B.bio, E = bf_style(bio), A = bf_army(bio), burnt = bio.key === 'ember', bare = !!bio.bare, onggi = C(0x4a3226);
  bf_leafEmis = bio.key === 'dunes' ? .025 : 0;
  const at = (x, z, build, r, T0) => { if (Math.abs(x) > BH - .8 || Math.abs(z) > BH - .8) return; const T = T0 || new Soup(); if (!T0) build(T); B.put(T, x, z, { ry: rng() * TAU }); if (r) placed.push([x, z, r]); };

  // 랜드마크: 고구려 전장엔 돌무지무덤, 고려·조선 전장엔 삼층석탑
  if (bio.era === 'goguryeo') drop(T => PROP.jeokseok(T, rng), 2.7, { far: 3.4 }); else drop(T => PROP.seoktap(T, rng), 1.4, { far: 2.6 });
  drop(T => PROP.well(T, rng), 1.3, { near: 5.5, far: 2.6 });
  drop(T => PROP.biseok(T, rng), 1.0, { near: 6, far: 2.4 });
  drop(T => PROP.seonang(T, rng, bare), 2.3, { far: 2.8 });
  for (let k = 0; k < 3; k++) { const len = rng.range(3.5, 6); drop(T => PROP.wallRun(T, rng, len, rng.range(.9, 1.5)), len * .5, { far: 1.6 }); }
  // 민가: 초가 두 채와 장독대, 울타리 (진주성은 불탄 집터)
  { const g = find(3.2, { far: 3.4 }); if (g) {
      const ry = rng() * TAU, cs = Math.cos(ry), sn = Math.sin(ry), L = (lx, lz) => [g[0] + lx * cs + lz * sn, g[1] - lx * sn + lz * cs];
      { const T = new Soup(); PROP.choga(T, rng, { burnt: burnt && rng() < .7 }); const p = L(-.3, -1.1); B.put(T, p[0], p[1], { ry }); }
      { const T = new Soup(); PROP.choga(T, rng, { w: 1.9, burnt }); const p = L(1.9, 1.0); B.put(T, p[0], p[1], { ry: ry - HPI }); if (burnt) B.fires.push({ x: p[0], y: H(p[0], p[1]) + .55, z: p[1], size: .55, fx: { smoke: 1.6, embers: 1.2, glow: .7 } }); }
      for (const [lx, lz] of [[-1.9, .9], [-1.45, 1.05], [-1.75, 1.35], [-1.3, 1.5]]) { if (rng() < .2) continue; const T = new Soup(); PROP.jar(T, rng, onggi); const p = L(lx, lz); B.put(T, p[0], p[1], { ao: null }); }
      for (const [lx, lz, a, len] of [[0, -2.6, 0, 4.6], [-2.9, -.4, HPI, 4.0]]) { const T = new Soup(); PROP.fence(T, rng, len); const p = L(lx, lz); B.put(T, p[0], p[1], { ry: ry + a }); }
      { const T = new Soup(); if (burnt) PROP.charred(T, rng, 3.6); else if (bare) PROP.tree(T, rng, 3.6); else PROP.broadleaf(T, rng, 3.6); const p = L(2.4, -2.0); B.put(T, p[0], p[1], {}); }
      placed.push([g[0], g[1], 3.2]);
    } }
  for (let k = 0; k < 2; k++) { const p = beside(10, B.L - 8, 1.25, 1.1); if (p) drop(T => PROP.cart(T, rng, k === 1), 1.1, { at: p, ry: -p[2] + rng.range(-.3, .3), r: k === 1 ? [0, -p[2] + .4, .22] : undefined }); }
  for (let k = 0; k < 4; k++) { const p = beside(8, B.L - 6, .75, .3); if (p) { const len = rng.range(2.6, 4.2); drop(T => PROP.palisade(T, rng, len), 1.0, { at: p, ry: -p[2] }); } }
  for (let k = 0; k < 2; k++) { const p = beside(B.L * .45, B.L - 6, 1.0, .4); if (p) { const len = rng.range(2.5, 4.5); drop(T => PROP.fence(T, rng, len), 1.2, { at: p, ry: -p[2] + rng.range(-.15, .15) }); } }
  for (let k = 0; k < 3; k++) { const p = beside(6, B.L * .5, .85, .5); if (p) { const len = rng.range(2.0, 3.0); drop(T => PROP.nokgak(T, rng, len), 1.0, { at: p, ry: -p[2] + rng.range(-.2, .2) }); } }
  // 길가 깃발: 적 진영 쪽은 침공군, 성 쪽은 수비군
  for (let k = 0; k < 2; k++) { const p = beside(6, B.L * .42, .8, .25); if (p) drop(T => PROP.armyFlag(T, rng, A), .3, { at: p, ry: -p[2] + HPI * p[3] }); }
  for (let k = 0; k < 3; k++) { const p = beside(B.L * .55, B.L - 4, .8, .25); if (p) drop(T => PROP.banner(T, rng, E.flag, 2.8, E.flag2), .3, { at: p, ry: -p[2] + HPI * p[3] }); }
  // 장승 한 쌍, 솟대
  { const p = beside(B.L * .3, B.L * .7, .8, .5); if (p) { const fy = -p[2] + (p[3] > 0 ? PI : 0); drop(T => { PROP.jangseung(T, rng, false); const F = new Soup(); PROP.jangseung(F, rng, true); T.merge(F, { p: [.62, 0, 0], ao: null }); }, .6, { at: p, ry: fy }); } }
  { const p = beside(12, B.L * .7, 1.3, .6); if (p) drop(T => { PROP.sotdae(T, rng); const F = new Soup(); PROP.sotdae(F, rng, 2.3); T.merge(F, { p: [.55, 0, .3], ao: null }); }, .6, { at: p, ry: -p[2] + HPI }); }
  // 타워 터 옆 군수품: 볏섬·옹기·궤짝
  for (const pad of B.pads) {
    if (rng() < .35) continue;
    const a = rng() * TAU, x = pad.x + Math.cos(a) * 2.25, z = pad.z + Math.sin(a) * 2.25;
    if (B.dRoadAt(x, z) < ROAD_HALF + .7 || B.dStrAt(x, z) < 1.8) continue;
    const T = new Soup(), kind = rng.int(0, 2);
    if (kind === 0) { PROP.bales(T, rng); if (rng() < .5) PROP.crate(T, -.1, 0, -.6, .45, rng, rng()); }
    else if (kind === 1) { for (const [jx, jz] of [[0, 0], [.44, .1], [.18, .46]]) { if (rng() < .25) continue; const J = new Soup(); PROP.jar(J, rng, onggi); T.merge(J, { p: [jx, 0, jz], ao: null }); } }
    else { PROP.crate(T, 0, 0, 0, .5, rng, rng()); if (rng() < .6) PROP.crate(T, .02, .5, .03, .38, rng, rng()); const J = new Soup(); PROP.jar(J, rng, onggi); T.merge(J, { p: [.55, 0, .2], ao: null }); }
    B.put(T, x, z, { ry: rng() * TAU }); placed.push([x, z, .8]);
  }
  // 적 진영: 군막, 군기, 버려진 무기
  { let tents = 0;
    for (let k = 0; k < 14 && tents < 2; k++) { const x = B.lay.cave.x + rng.range(2.6, 8), z = B.zc + rng.sign() * rng.range(2.9, 6); if (free(x, z, 1.4, .5) && slope(x, z) < .36) { drop(T => PROP.tent(T, rng, A), 1.5, { at: [x, z], ry: rng.range(.2, 1.3) }); tents++; } }
    for (let k = 0; k < 4; k++) { const x = B.lay.cave.x + rng.range(1.8, 7), z = B.zc + rng.sign() * rng.range(1.9, 5); if (free(x, z, .3, .2)) drop(T => PROP.armyFlag(T, rng, A), .35, { at: [x, z], ry: rng.range(-.4, .9) }); }
    for (let k = 0; k < 5; k++) { const x = B.lay.cave.x + rng.range(1.8, 8), z = B.zc + rng.sign() * rng.range(1.9, 5.5); if (free(x, z, .4, .2)) drop(T => PROP.warDebris(T, rng, A), .5, { at: [x, z], ao: null }); }
  }
  for (let k = 0; k < 7; k++) drop(T => PROP.warDebris(T, rng, A), .45, { ao: null, near: 4.5 });
  for (let k = 0; k < 3; k++) drop(T => PROP.doltap(T, rng), .6, {});
  for (let k = 0; k < 3; k++) drop(T => PROP.cairn(T, rng), .5, {});
  BIOME_DRESS[bio.key]({ B, rng, drop, find, beside, free, at, H, placed, slope, E, A });
  for (const [kind, cnt, h0, h1] of bio.trees) for (let k = 0; k < cnt; k++) { const h = rng.range(h0, h1); drop(T => PROP[kind](T, rng, h), kind === 'tree' || kind === 'charred' ? .55 : .8, { far: 1.0, water: kind.indexOf('willow') === 0 && k < 6 ? 5.5 : 0 }); }
  for (let k = 0; k < bio.stumps; k++) drop(T => PROP.stump(T, rng), .4, {});
  for (let k = 0; k < bio.rocks; k++) { const r = rng() < .2 ? rng.range(.6, 1.25) : rng.range(.16, .5); drop(T => T.rock(r, 0, r * .28, 0, mixC(COL.stoneD, COL.stone, rng())), r * .8, { steep: true, roadMin: .25, ao: [0, r * .6, .6] }); }
  for (let k = 0; k < bio.tufts; k++) {
    const x = rng.range(-BH + .8, BH - .8), z = rng.range(-BH + .8, BH - .8);
    if (B.dRoadAt(x, z) < ROAD_HALF + .35 || waterD(x, z) < 1.1 || slope(x, z) > .5) continue;
    if (Math.abs(x - B.kx) < 5.9 && z < -11.6) continue;
    if (B.keepWall && x > B.keepWall.x0 && x < B.keepWall.x1 && Math.abs(z - B.keepWall.z) < .95) continue;
    const T = new Soup(); PROP.tuft(T, rng); B.put(T, x, z, { ao: null, s: rng.range(.8, 1.5) });
  }
  for (let k = 0; k < 60; k++) {
    const i = rng.int(16, B.n - 12), side = rng.sign(), d = ROAD_HALF + rng.range(.1, .45), x = B.px[i] - B.tz[i] * side * d, z = B.pz[i] + B.tx[i] * side * d;
    if (B.dStrAt(x, z) < 2.4) continue;
    const r = rng.range(.08, .17), T = new Soup(); T.rock(r, 0, r * .3, 0, mixC(COL.roadD, COL.stone, rng())); B.put(T, x, z, { ao: null });
  }
}
