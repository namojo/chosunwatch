
function ribbon(S, a, b, c, d, col, sw) {
  _sa.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _sb.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); _sn.crossVectors(_sa, _sb);
  const l = _sn.length() || 1, nx = _sn.x / l, ny = _sn.y / l, nz = _sn.z / l, P = [a, b, c, d];
  for (const [order, s] of [[[0, 1, 2, 0, 2, 3], 1], [[0, 2, 1, 0, 3, 2], -1]]) for (const k of order) { const p = P[k]; S.v(p[0], p[1], p[2], nx * s, ny * s, nz * s, col[0], col[1], col[2], p[0] * .5, p[1] * .5, L_PLAIN, .8, sw[k], 0); }
}

Object.assign(PROP, {
  pine(S, rng, h) {
    const bark = mulC(COL.bark, .8 + .4 * rng()), lx = rng.range(-.05, .05), lz = rng.range(-.05, .05);
    S.seg([0, -.1, 0], [lx * h, h * .94, lz * h], h * .05, h * .012, bark, { l: L_WOOD, n: 6 });
    const tiers = Math.round(4 + h * .55);
    for (let k = 0; k < tiers; k++) {
      const u = k / (tiers - 1), y = h * (.2 + .66 * u), r = h * (.33 - .23 * u) * rng.range(.88, 1.1), hh = h * (.3 - .11 * u), ph = rng() * TAU;
      const c = mulC(mixC(COL.leaf, COL.leafL, rng() * .6 + u * .25), .8 + .35 * rng());
      S.add(gCyl(9, 0), {
        s: [r, hh, r], p: [lx * y + rng.range(-.03, .03), y + hh * .5, lz * y + rng.range(-.03, .03)], r: [rng.range(-.07, .07), ph, rng.range(-.07, .07)], c, l: L_THATCH, uvs: .5,
        deform: v => { if (v.y < 0) { const j = .8 + .4 * vnoise(Math.atan2(v.z, v.x) * 2.2 + ph, k * 3.1, 5); v.x *= j; v.z *= j; v.y -= hh * .25 * (j - .8); } },
        cf: v => .62 + .38 * sat(Math.hypot(v.x, v.z) / r), swayf: v => .14 * Math.hypot(v.x, v.z) / r * (.4 + u),
      });
    }
  },
  willow(S, rng, h, o = {}) {
    const bark = mulC(COL.bark, .85 + .3 * rng());
    let p = [0, -.1, 0], d = [rng.range(-.25, .25), 1, rng.range(-.25, .25)], r = h * .085; const tips = [];
    for (let k = 0; k < 4; k++) {
      const l = h * rng.range(.15, .2), q = [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l]; S.seg(p, q, r, r * .8, bark, { l: L_WOOD, n: 6 }); p = q; r *= .8;
      d = [d[0] + rng.range(-.4, .4), 1, d[2] + rng.range(-.4, .4)]; const dl = Math.hypot(d[0], d[1], d[2]); d = d.map(v => v / dl);
    }
    for (let k = 0; k < 4; k++) { const a = rng() * TAU + k * 1.6, len = h * rng.range(.28, .42), q = [p[0] + Math.cos(a) * len * .8, p[1] + len * rng.range(.1, .45), p[2] + Math.sin(a) * len * .8]; S.seg(p, q, r, r * .45, bark, { l: L_WOOD, n: 5, sway: .12 }); tips.push(q); }
    tips.push([p[0], p[1] + h * .08, p[2]]);
    for (const t of tips) for (let j = 0; j < 2; j++) {
      const bare = o.bare, twig = C(0x8a7a44), rb = h * rng.range(.2, .29), c = mulC(mixC(COL.leaf, COL.leafL, rng()), .75 + .4 * rng()), cx = t[0] + rng.range(-.25, .25), cy = t[1] + rng.range(-.05, .3), cz = t[2] + rng.range(-.25, .25);
      if (!bare) S.ico(rb, cx, cy, cz, c, { sc: [1.15, .48, 1.15], d: 1, l: L_THATCH, sway: .2, r: [rng.range(-.2, .2), rng() * TAU, rng.range(-.2, .2)], cf: v => .6 + .4 * sat(v.y / (rb * .5) + .5) });
      for (let s = 0; s < 7; s++) {
        const a = rng() * TAU, rad = rb * rng.range(.45, 1.05), x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad, len = rng.range(.5, 1.5), y0 = cy - rb * .1, wa = rng() * TAU, ww = bare ? .022 : .045, wx = Math.cos(wa) * ww, wz = Math.sin(wa) * ww, cc = bare ? mulC(twig, .6 + .5 * rng()) : mulC(mixC(COL.leaf, COL.leafL, rng()), .6 + .3 * rng());
        ribbon(S, [x - wx, y0, z - wz], [x + wx, y0, z + wz], [x + wx * .4, y0 - len, z + wz * .4], [x - wx * .4, y0 - len, z - wz * .4], cc, [.2, .2, .95, .95]);
      }
    }
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + rng(); S.seg([Math.cos(a) * h * .04, h * .17, Math.sin(a) * h * .04], [Math.cos(a) * h * .22, -.1, Math.sin(a) * h * .22], h * .03, h * .018, bark, { l: L_WOOD, n: 5 }); }
  },
  charred(S, rng, h) { PROP.tree(S, rng, h, { bark: mulC(COL.bark, .7 + .3 * rng()), tip: [.6, .16, .03], tipEmis: .09 }); },
  reeds(S, rng) {
    for (let k = 0, n = rng.int(5, 9); k < n; k++) {
      const x = rng.range(-.3, .3), z = rng.range(-.3, .3), hh = rng.range(.6, 1.35), lx = rng.range(-.18, .18), lz = rng.range(-.18, .18), c = mulC(mixC(COL.tuftA, COL.tuftB, rng()), .8 + .4 * rng());
      S.seg([x, -.08, z], [x + lx * .4, hh * .5, z + lz * .4], .022, .018, c, { n: 3, jit: 0 });
      S.seg([x + lx * .4, hh * .5, z + lz * .4], [x + lx, hh, z + lz], .018, .008, c, { n: 3, sway: .5, jit: 0 });
      if (rng() < .45) S.seg([x + lx * .8, hh * .8, z + lz * .8], [x + lx * 1.02, hh * 1.02, z + lz * 1.02], .042, .038, C(0x4a3220), { n: 5, sway: .5 });
    }
  },
  lily(S, rng) {
    for (let k = 0, n = rng.int(2, 4); k < n; k++) {
      const x = rng.range(-.4, .4), z = rng.range(-.4, .4), r = rng.range(.13, .26);
      S.cyl(r, .012, x, .006, z, mulC(mixC(COL.leaf, COL.leafL, rng()), 1.1 + .4 * rng()), { n: 7, jit: .05, r: [0, rng() * TAU, 0] });
      if (rng() < .3) S.ico(.05, x + r * .3, .05, z, C(0xe8c8d8), { d: 0, emis: .03, sc: [1, .7, 1] });
    }
  },
  log(S, rng) {
    const len = rng.range(1.5, 2.6), r = rng.range(.14, .2), bark = mulC(COL.bark, .9 + .4 * rng());
    S.seg([-len / 2, r * .8, 0], [len / 2, r * .9, 0], r, r * .85, bark, { l: L_WOOD, n: 7 });
    for (const s of [-1, 1]) S.cyl(r * (s < 0 ? .98 : .83), .02, s * len / 2, r * (s < 0 ? .8 : .9), 0, mulC(COL.woodL, .7), { n: 7, l: L_WOOD, r: [0, 0, HPI] });
    for (let k = 0; k < 2; k++) { const x = rng.range(-len * .3, len * .3), a = rng.range(-1, 1); S.seg([x, r, 0], [x + rng.range(-.15, .15), r + .35 * Math.cos(a), .35 * Math.sin(a)], r * .35, r * .2, bark, { l: L_WOOD, n: 5 }); }
  },
  jar(S, rng, col) {
    const c = mulC(col || C(0x9a5a3c), .8 + .35 * rng()), s = rng.range(.8, 1.25);
    S.cyl(.2 * s, .22 * s, 0, .11 * s, 0, c, { n: 8, rt: .62 }); S.cyl(.2 * s, .2 * s, 0, .32 * s, 0, c, { n: 8, rt: 1.0 }); S.cyl(.2 * s, .14 * s, 0, .49 * s, 0, c, { n: 8, rt: 2.0 });
    S.cyl(.09 * s, .1 * s, 0, .6 * s, 0, mulC(c, .9), { n: 8, rt: 1.25 }); S.cyl(.105 * s, .02 * s, 0, .655 * s, 0, COL.black, { n: 8, jit: 0 });
  },
  icicles(S, rng, len, n, maxH) {
    for (let k = 0; k < n; k++) { const x = (k + .5) / n * len - len / 2 + rng.range(-.05, .05), h = rng.range(.15, maxH) * (rng() < .2 ? 1.5 : 1); S.cone(.04 + .035 * rng(), h, x, -h / 2, rng.range(-.04, .04), COL.ice, { n: 5, r: [PI, 0, 0], rough: .14, emis: .012, jit: .1 }); }
  },
  drift(S, rng, r, col) { S.ico(r, 0, r * .04, 0, col, { sc: [1.25, .3, .85], d: 2, smooth: true, rough: .75, jit: .03 }); },
  // 소나무(적송): 굽은 붉은 줄기 끝에 구름처럼 납작한 솔잎 뭉치.
  sonamu(S, rng, h) {
    const bark = mulC(mixC(COL.bark, C(0x7a4630), .55), .8 + .35 * rng()), N = 5, knots = [];
    let p = [0, -.1, 0], d = [rng.range(-.3, .3), 1, rng.range(-.3, .3)], r = h * .055;
    for (let k = 0; k < N; k++) {
      const l = h * .8 / N * rng.range(.85, 1.15), dl = Math.hypot(d[0], d[1], d[2]), q = [p[0] + d[0] / dl * l, p[1] + d[1] / dl * l, p[2] + d[2] / dl * l];
      S.seg(p, q, r, r * .82, bark, { l: L_WOOD, n: 6, sway: k >= 3 ? .05 : 0 }); p = q; r *= .82; if (k >= 2) knots.push([q, r]);
      d = [d[0] * .4 + rng.range(-.55, .55), 1, d[2] * .4 + rng.range(-.55, .55)];
    }
    const pad = (c, rad) => { const hy = rad * .36; S.ico(rad, c[0], c[1], c[2], mulC(mixC(COL.leaf, COL.leafL, rng() * .7), .8 + .35 * rng()), { sc: [1.25, .36, 1.25], d: 1, l: L_THATCH, sway: .16, emis: bf_leafEmis, r: [rng.range(-.12, .12), rng() * TAU, rng.range(-.12, .12)], cf: v => .6 + .4 * sat(v.y / hy * .5 + .5) }); };
    pad([p[0], p[1] + h * .03, p[2]], h * rng.range(.24, .3));
    for (const [q, qr] of knots) for (let j = 0, n = rng() < .6 ? 2 : 1; j < n; j++) {
      const a = rng() * TAU, len = h * rng.range(.2, .34), e = [q[0] + Math.cos(a) * len, q[1] + len * rng.range(.05, .3), q[2] + Math.sin(a) * len];
      S.seg(q, e, qr * .6, qr * .3, bark, { l: L_WOOD, n: 4, sway: .1 }); pad([e[0], e[1] + h * .02, e[2]], h * rng.range(.15, .23));
    }
  },
  // 잎 넓은 나무(느티나무·참나무).
  broadleaf(S, rng, h, o = {}) {
    const bark = mulC(COL.bark, .85 + .35 * rng()), la = o.leaf || COL.leaf, lb = o.leafL || COL.leafL;
    const top = [rng.range(-.1, .1) * h, h * .42, rng.range(-.1, .1) * h];
    S.seg([0, -.1, 0], top, h * .07, h * .05, bark, { l: L_WOOD, n: 6 });
    const blob = (c, rad) => S.ico(rad, c[0], c[1], c[2], mulC(mixC(la, lb, rng()), .78 + .4 * rng()), { sc: [1.1, .8, 1.1], d: 1, l: L_THATCH, sway: .14, r: [rng() * .4, rng() * TAU, rng() * .4], cf: v => .58 + .42 * sat(v.y / rad * .6 + .5) });
    blob([top[0], top[1] + h * .3, top[2]], h * .26);
    for (let k = 0, n = rng.int(3, 5); k < n; k++) { const a = k / n * TAU + rng(), len = h * rng.range(.2, .3), e = [top[0] + Math.cos(a) * len, top[1] + h * rng.range(.08, .25), top[2] + Math.sin(a) * len]; S.seg(top, e, h * .035, h * .018, bark, { l: L_WOOD, n: 4 }); blob(e, h * rng.range(.17, .23)); }
  },
  // 잎이 진 버드나무(이른 봄).
  willowBare(S, rng, h) { PROP.willow(S, rng, h, { bare: true }); },
  // 억새: 지난해의 마른 줄기와 흰 이삭.
  eoksae(S, rng) {
    const base = mulC(mixC(COL.tuftA, COL.tuftB, rng()), .9 + .3 * rng()), plume = mulC(C(0xd9cfae), .8 + .3 * rng());
    for (let k = 0, n = rng.int(7, 11); k < n; k++) {
      const a = rng() * TAU, x = Math.cos(a) * rng.range(0, .22), z = Math.sin(a) * rng.range(0, .22), hh = rng.range(.8, 1.5), lx = Math.cos(a) * rng.range(.1, .4), lz = Math.sin(a) * rng.range(.1, .4);
      const m = [x + lx * .45, hh * .6, z + lz * .45], t = [x + lx, hh, z + lz];
      S.seg([x, -.06, z], m, .02, .014, base, { n: 3, jit: 0 }); S.seg(m, t, .014, .006, base, { n: 3, sway: .55, jit: 0 });
      if (rng() < .7) S.seg([lerp(m[0], t[0], .5), lerp(m[1], t[1], .5), lerp(m[2], t[2], .5)], [t[0] + lx * .25, t[1] + .12, t[2] + lz * .25], .05, .012, plume, { n: 4, sway: .7, jit: 0 });
    }
  },
  // 잔불 더미: 타다 남은 들보와 잉걸.
  emberHeap(S, rng) {
    const ch = () => mulC(COL.bark, .45 + .3 * rng());
    S.ico(.6, 0, .02, 0, C(0x1d1917), { sc: [1.3, .28, 1.1], d: 1, l: L_DIRT });
    for (let k = 0; k < 6; k++) { const a = rng() * TAU, l = rng.range(.6, 1.2), x = rng.range(-.3, .3), z = rng.range(-.3, .3); S.seg([x - Math.cos(a) * l * .5, .06 + rng() * .1, z - Math.sin(a) * l * .5], [x + Math.cos(a) * l * .5, .12 + rng() * .35, z + Math.sin(a) * l * .5], .07, .05, ch(), { l: L_WOOD, n: 5, emis: k & 1 ? .04 : 0 }); }
    for (let k = 0; k < 7; k++) S.ico(rng.range(.04, .09), rng.range(-.5, .5), .1 + rng() * .12, rng.range(-.5, .5), [.85, .25, .03], { d: 0, emis: rng.range(.15, .3), jit: 0 });
  },
});

// 전장별 치장. X = { B, rng, drop, find, beside, free, at, H, placed, slope, E(수비 시대 색), A(침공군 색) }
const BIOME_DRESS = {
  // 안시성(645): 요동의 산성 고갯길 — 통나무와 바위, 당군이 쌓은 토산
  ashen(X) {
    const { rng, drop, A } = X;
    drop(T => PROP.tosan(T, rng, A), 3.3, { far: 3.6, maxSlope: .5 });
    for (let k = 0; k < 3; k++) drop(T => PROP.log(T, rng), .9, { far: 1.2 });
    for (let k = 0; k < 2; k++) drop(T => PROP.nokgak(T, rng, 2.4), 1.0, { far: 1.4 });
  },
  // 귀주성(1231): 한겨울 — 눈더미, 얼어붙은 해자 가의 마른 갈대
  frost(X) {
    const { B, rng, drop } = X, snow = B.bio.coverCol;
    for (let k = 0; k < 30; k++) { const r = rng.range(.5, 1.25); drop(T => PROP.drift(T, rng, r, snow), r * .35, { roadMin: .5, ao: null, steep: true }); }
    for (const q of B.ponds) for (let k = 0; k < 6; k++) { const a = rng() * TAU, d = q.r + rng.range(.5, 1.2); X.at(q.x + Math.cos(a) * d, q.z + Math.sin(a) * d, T => PROP.reeds(T, rng), 0); }
    for (let k = 0; k < 2; k++) drop(T => PROP.log(T, rng), .9, { far: 1.2 });
    for (let k = 0; k < 2; k++) drop(T => PROP.nokgak(T, rng, 2.4), 1.0, { far: 1.4 });
    if (B.ponds[0]) B.env.push({ x: B.ponds[0].x, y: B.ponds[0].y + .9, z: B.ponds[0].z, c: 0x7fc8ff, I: 5, d: 7 });
  },
  // 살수(612): 청천강 강변 습지 — 갈대밭, 연잎, 나룻배, 반딧불
  fen(X) {
    const { B, rng, drop } = X, reedAt = [];
    for (let k = 0; k < 64; k++) {
      const u = rng.int(2, B.SP.length - 2), a = B.SP[u - 1], b = B.SP[u + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, off = rng.sign() * rng.range(.95, 2.1), x = B.SP[u][0] - dz / l * off, z = B.SP[u][1] + dx / l * off;
      if (Math.abs(x) > BH - .8 || Math.abs(z) > BH - .8 || B.dRoadAt(x, z) < ROAD_HALF + .9) continue;
      X.at(x, z, T => PROP.reeds(T, rng), 0); reedAt.push([x, z]);
    }
    for (const q of B.ponds) {
      for (let k = 0; k < 11; k++) { const a = rng() * TAU, d = q.r * rng.range(.75, 1.25); X.at(q.x + Math.cos(a) * d, q.z + Math.sin(a) * d, T => PROP.reeds(T, rng), 0); }
      for (let k = 0; k < 4; k++) { const a = rng() * TAU, d = q.r * rng.range(0, .55), T = new Soup(); PROP.lily(T, rng); B.put(T, q.x + Math.cos(a) * d, q.z + Math.sin(a) * d, { y: q.y + .012, ao: null }); }
    }
    for (let k = 0; k < 14; k++) drop(T => PROP.reeds(T, rng), .3, { ao: null, water: 3.2 });
    if (B.ponds[0]) { const q = B.ponds[0], a = rng() * TAU, T = new Soup(); PROP.boat(T, rng); B.put(T, q.x + Math.cos(a) * q.r * .45, q.z + Math.sin(a) * q.r * .45, { y: q.y - .03, ry: rng() * TAU, ao: null }); }
    // 반딧불이 모이는 갈대숲의 은은한 빛
    for (let k = 0; k < Math.min(2, reedAt.length); k++) { const p = reedAt[Math.floor(reedAt.length * (k + .5) / 2)]; B.env.push({ x: p[0], y: X.H(p[0], p[1]) + .8, z: p[1], c: 0xa8e05a, I: 4, d: 6 }); }
    for (let k = 0; k < 4; k++) drop(T => PROP.log(T, rng), .9, { far: 1.2 });
  },
  // 진주성(1592): 불타는 성 밖 — 불탄 집터와 잔불, 불빛이 비치는 남강
  ember(X) {
    const { B, rng, drop } = X, hot = [];
    for (let k = 0; k < 3; k++) { const p = drop(T => PROP.choga(T, rng, { burnt: true, w: rng.range(1.9, 2.5) }), 1.8, { far: 1.6 }); if (p) hot.push(p); }
    for (let k = 0; k < 4; k++) { const len = rng.range(2.2, 3.4); drop(T => PROP.palisade(T, rng, len), 1.0, { far: 1.3, r: [rng.range(-.25, .25), rng() * TAU, rng.range(-.2, .2)] }); }
    for (let k = 0; k < 5; k++) { const p = drop(T => PROP.emberHeap(T, rng), .8, { far: 2.0 }); if (p) { B.fires.push({ x: p[0], y: X.H(p[0], p[1]) + .14, z: p[1], size: .5, fx: { layers: k < 3 ? 2 : 0, smoke: 1.3, embers: 1.1, glow: .55 } }); if (k < 3) hot.push(p); } }
    for (let k = 0; k < 3; k++) drop(T => PROP.nokgak(T, rng, 2.4), 1.0, { far: 1.4 });
    // 불빛: 다리 밑 강물, 그리고 불타는 집터 두 곳
    B.env.push({ x: B.bridge.x, y: B.wlc + .7, z: B.bridge.z, c: 0xff6a24, I: 34, d: 9, flick: 1 });
    for (const p of hot.slice(0, 2)) B.env.push({ x: p[0], y: X.H(p[0], p[1]) + 1.0, z: p[1], c: 0xff6a24, I: 40, d: 9, flick: 1 });
    if (hot.length < 2 && B.ponds[0]) { const q = B.ponds[0]; B.env.push({ x: q.x, y: q.y + .8, z: q.z, c: 0xff6a24, I: 30, d: 9, flick: 1 }); }
  },
  // 행주산성(1593): 이른 봄 저녁의 한강 가 — 마른 갈대·억새, 잎 진 버드나무, 나룻배, 목책
  dunes(X) {
    const { B, rng, drop, beside } = X;
    for (let k = 0; k < 30; k++) drop(T => PROP.eoksae(T, rng), .35, { far: .7, ao: null });
    for (let k = 0; k < 44; k++) {
      const u = rng.int(2, B.SP.length - 2), a = B.SP[u - 1], b = B.SP[u + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, off = rng.sign() * rng.range(.95, 2.0), x = B.SP[u][0] - dz / l * off, z = B.SP[u][1] + dx / l * off;
      if (Math.abs(x) > BH - .8 || Math.abs(z) > BH - .8 || B.dRoadAt(x, z) < ROAD_HALF + .9) continue;
      X.at(x, z, T => PROP.reeds(T, rng), 0);
    }
    for (const q of B.ponds) {
      for (let k = 0; k < 2; k++) { const a = rng() * TAU, d = q.r + rng.range(1.1, 1.9), h = rng.range(3, 4.2); X.at(q.x + Math.cos(a) * d, q.z + Math.sin(a) * d, T => PROP.willowBare(T, rng, h), .6); }
      for (let k = 0; k < 10; k++) { const a = rng() * TAU, d = q.r * rng.range(.8, 1.25); X.at(q.x + Math.cos(a) * d, q.z + Math.sin(a) * d, T => PROP.reeds(T, rng), 0); }
    }
    if (B.ponds[0]) { const q = B.ponds[0], a = rng() * TAU, T = new Soup(); PROP.boat(T, rng); B.put(T, q.x + Math.cos(a) * q.r * .5, q.z + Math.sin(a) * q.r * .5, { y: q.y - .03, ry: rng() * TAU, ao: null }); }
    // 행주산성은 목책으로 지킨 성이다
    for (let k = 0; k < 4; k++) { const p = beside(B.L * .35, B.L - 5, .75, .3); if (p) { const len = rng.range(2.8, 4.4); drop(T => PROP.palisade(T, rng, len), 1.0, { at: p, ry: -p[2] }); } }
  },
};
