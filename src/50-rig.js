
let RIG_CAPTURE = null;
class PartBatch {
  constructor(build, cap, o = {}) {
    const S = new Soup(); build(S); const geo = S.build();
    this.cap = cap; this.n = 0;
    const m = this.mesh = new THREE.InstancedMesh(geo, MAT.inst, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.flash = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1); this.flash.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aFlash', this.flash);
    m.frustumCulled = false; m.castShadow = o.shadow !== false; m.receiveShadow = true; m.count = 0;
    this.rad = o.rad || .1;
    R.scene.add(m); PartBatch.all.push(this);
  }
  put(mat, flash = 0, tint = null) {
    if (RIG_CAPTURE) { RIG_CAPTURE(this, mat, tint); return; }
    if (this.n >= this.cap) return; const i = this.n++;
    mat.toArray(this.mesh.instanceMatrix.array, i * 16);
    const c = this.mesh.instanceColor.array;
    if (tint) { c[i * 3] = tint[0]; c[i * 3 + 1] = tint[1]; c[i * 3 + 2] = tint[2]; } else { c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = 1; }
    this.flash.array[i] = flash;
  }
  end() {
    const m = this.mesh; m.count = this.n; m.visible = this.n > 0;
    if (this.n) {
      for (const a of [m.instanceMatrix, m.instanceColor, this.flash]) { a.clearUpdateRanges(); a.addUpdateRange(0, this.n * a.itemSize); a.needsUpdate = true; }
    }
  }
}
PartBatch.all = [];
function beginParts() { for (const b of PartBatch.all) b.n = 0; }
function endParts() { for (const b of PartBatch.all) b.end(); }

const _rq = new THREE.Quaternion(), _re = new THREE.Euler(), _rv = new THREE.Vector3(), _rs = new THREE.Vector3(), _rm = new THREE.Matrix4();
const _M = []; for (let i = 0; i < 28; i++) _M.push(new THREE.Matrix4());
function xf(out, parent, px, py, pz, rx, ry, rz, sx = 1, sy = 1, sz = 1) {
  _rq.setFromEuler(_re.set(rx, ry, rz, 'XYZ')); _rm.compose(_rv.set(px, py, pz), _rq, _rs.set(sx, sy, sz));
  if (parent) out.multiplyMatrices(parent, _rm); else out.copy(_rm); return out;
}

const KIT = {};
// ── 조선워치: 사람형 공용 키트 ────────────────────────────────────────────────
// 밝은 중립색 천으로 모델링하고 인스턴스 tint로 군대색을 입힌다.
//   e.tint  → 골반·몸통·위팔·허벅지(군복)   e.tintH → 머리(없으면 tint)   e.tintL → 아래팔·정강이(없으면 tint)
function ar_manKit(cap) {
  const k = {}, limb = cap * 2, W = [.84, .84, .84], Wd = [.6, .6, .6], skin = COL.skin, hair = C(0x15110e), lea = mulC(COL.leather, 1.05);
  k.pelvis = new PartBatch(S => {
    S.box(.28, .13, .19, 0, 0, 0, Wd, { l: L_CLOTH }); S.box(.31, .05, .21, 0, .06, 0, [.3, .26, .22], {});
    S.box(.3, .17, .2, 0, -.1, 0, W, { l: L_CLOTH, jit: .04 });
  }, cap, { rad: .12 });
  k.torso = new PartBatch(S => {
    S.box(.34, .4, .22, 0, .21, 0, W, { l: L_CLOTH, jit: 0 }); S.box(.1, .3, .235, 0, .24, 0, Wd, { l: L_CLOTH, jit: 0 });
    S.box(.42, .09, .24, 0, .4, 0, W, { l: L_CLOTH, jit: .03 });
  }, cap, { rad: .17 });
  k.head = new PartBatch(S => {
    S.box(.12, .08, .12, 0, .0, 0, mulC(skin, .85), { jit: 0 });
    S.box(.19, .2, .19, 0, .13, 0, skin, { jit: .04 });
    S.box(.2, .08, .2, 0, .215, -.005, hair, { jit: 0 }); S.box(.2, .15, .07, 0, .13, -.075, hair, { jit: 0 }); S.box(.075, .07, .075, 0, .285, -.02, hair, { jit: 0 });
    for (const s of [-1, 1]) S.box(.03, .028, .02, s * .05, .15, .098, COL.black, { jit: 0 });
  }, cap, { rad: .14 });
  k.uArm = new PartBatch(S => { S.box(.1, .26, .1, 0, -.13, 0, W, { l: L_CLOTH }); S.box(.125, .09, .125, 0, -.035, 0, Wd, { l: L_CLOTH }); }, limb, { rad: .07, shadow: false });
  k.lArm = new PartBatch(S => { S.box(.085, .21, .085, 0, -.105, 0, lea, {}); S.box(.09, .085, .09, 0, -.255, 0, skin, {}); }, limb, { rad: .07, shadow: false });
  k.uLeg = new PartBatch(S => { S.box(.118, .29, .118, 0, -.14, 0, Wd, { l: L_CLOTH }); }, limb, { rad: .08, shadow: false });
  k.lLeg = new PartBatch(S => { S.box(.1, .27, .1, 0, -.135, 0, [.5, .45, .37], { l: L_CLOTH }); S.box(.11, .065, .2, 0, -.29, .045, mulC(lea, .6), {}); }, limb, { rad: .08, shadow: false });
  return k;
}

function initKits() {
  const iron = COL.iron, steel = mulC(COL.steel, 1.1);
  KIT.man = ar_manKit(170);
  const E = KIT.item = {};
  initAllyKits();
  // 환도/왜도 겸용 외날 칼
  E.sword = new PartBatch(S => {
    S.box(.035, .14, .035, 0, 0, 0, COL.woodD, {}); S.box(.1, .025, .06, 0, .08, 0, COL.brass, { l: L_METAL, rough: .4 });
    S.box(.018, .3, .05, 0, .24, 0, steel, { l: L_METAL, rough: .3 }); S.box(.018, .24, .046, 0, .5, -.012, steel, { l: L_METAL, rough: .3, r: [-.1, 0, 0] }); S.cone(.026, .07, 0, .65, -.026, steel, { n: 4, l: L_METAL, rough: .3, rz: .01 });
  }, 150, { rad: .05, shadow: false });
  E.torch = new PartBatch(S => { S.box(.04, .42, .04, 0, .1, 0, COL.woodD, { l: L_WOOD }); S.cyl(.06, .1, 0, .34, 0, mulC(COL.black, 3), { n: 6 }); S.cyl(.05, .03, 0, .4, 0, COL.ember, { n: 6, emis: .5, jit: 0 }); }, 80, { rad: .05, shadow: false });
  // 원방패(밝은 나무 — tint로 군대색)
  E.shieldR = new PartBatch(S => {
    S.cyl(.27, .05, 0, 0, 0, [.72, .66, .58], { n: 8, r: [HPI, 0, 0], l: L_WOOD }); S.add(gTorus(8, .13, 4), { s: .25, p: [0, 0, .01], c: iron, l: L_METAL });
    S.sph(.075, 0, 0, .04, COL.ironL, { l: L_METAL, w: 6, h: 4, smooth: false }); for (let a = 0; a < 2; a++) S.box(.03, .42, .012, 0, 0, .03, iron, { l: L_METAL, r: [0, 0, a * HPI] });
  }, 60, { rad: .2, shadow: false });
  E.helm = new PartBatch(S => { S.add(gDome(8, 3), { s: [.18, .175, .195], p: [0, .16, 0], c: iron, l: L_METAL, rough: .5 }); S.box(.035, .13, .03, 0, .15, .185, COL.ironL, { l: L_METAL }); for (const s of [-1, 1]) S.box(.03, .14, .13, s * .165, .1, .03, iron, { l: L_METAL }); S.cone(.03, .16, 0, .4, 0, COL.ironL, { n: 4, l: L_METAL }); }, 24, { rad: .16, shadow: false });
  E.plate = new PartBatch(S => { S.box(.35, .31, .25, 0, .27, 0, iron, { l: L_METAL, rough: .5 }); S.box(.2, .2, .26, 0, .29, .005, COL.ironL, { l: L_METAL, rough: .45 }); for (const s of [-1, 1]) S.sph(.1, s * .21, .44, 0, COL.ironL, { l: L_METAL, w: 6, h: 4, smooth: false, sc: [1, .8, 1.1] }); }, 24, { rad: .2, shadow: false });
  // 철퇴
  E.club = new PartBatch(S => { S.seg([0, -.12, 0], [0, .62, 0], .04, .05, COL.wood, { l: L_WOOD, n: 6 }); S.ico(.12, 0, .66, 0, iron, { d: 1, l: L_METAL, rough: .5 }); for (let a = 0; a < 6; a++) S.cone(.03, .1, Math.cos(a * 1.05) * .13, .66 + ((a % 2) - .5) * .1, Math.sin(a * 1.05) * .13, COL.ironL, { n: 4, l: L_METAL, r: [Math.sin(a * 1.05) * 1.57, 0, -Math.cos(a * 1.05) * 1.57] }); }, 24, { rad: .1 });
  // 장창(붉은 창영)
  E.spear = new PartBatch(S => {
    S.seg([0, -.6, 0], [0, 1.12, 0], .019, .016, COL.woodD, { l: L_WOOD, n: 5 }); S.cone(.036, .19, 0, 1.21, 0, steel, { n: 4, l: L_METAL, rough: .3 });
    S.ico(.045, 0, 1.08, 0, C(0xb02a22), { d: 0, sc: [1, 1.3, 1] });
  }, 150, { rad: .06, shadow: false });
  // 월도(적장용 긴 자루 칼)
  E.glaive = new PartBatch(S => {
    S.seg([0, -.7, 0], [0, .95, 0], .024, .022, C(0x5a2a1e), { l: L_WOOD, n: 5 }); S.box(.07, .03, .09, 0, .95, 0, COL.brass, { l: L_METAL, rough: .4 });
    S.box(.02, .3, .12, 0, 1.11, .015, steel, { l: L_METAL, rough: .28 }); S.box(.02, .2, .1, 0, 1.33, .05, steel, { l: L_METAL, rough: .28, r: [.3, 0, 0] });
    S.cone(.05, .12, 0, 1.46, .1, steel, { n: 4, l: L_METAL, rough: .28, rz: .012, r: [.5, 0, 0] }); S.ico(.05, 0, .9, 0, C(0xb02a22), { d: 0 });
  }, 12, { rad: .1, shadow: false });
  KIT.coin = new PartBatch(S => { S.cyl(.075, .022, 0, 0, 0, COL.gold, { n: 8, l: L_METAL, rough: .35, emis: .16, jit: 0 }); S.cyl(.05, .026, 0, 0, 0, mulC(COL.gold, 1.3), { n: 8, l: L_METAL, rough: .3, emis: .2, jit: 0 }); }, 160, { shadow: false, rad: .05 });
  KIT.rubble = new PartBatch(S => { S.rock(.14, 0, 0, 0, COL.stone, {}); }, 160, { rad: .1 });
  KIT.plank = new PartBatch(S => { S.box(.12, .6, .05, 0, 0, 0, COL.wood, { l: L_WOOD }); }, 140, { rad: .08 });
  initBestiary();
}

const SPEC = {
  man: { hip: .585, pelvisH: .1, torsoH: .46, shX: .225, shY: .4, uArm: .27, lArm: .27, hipX: .09, uLeg: .29, lLeg: .29, stride: .6, lean: .1, stoop: .04, top: 1.42 },
  hulk: { hip: .585, pelvisH: .1, torsoH: .46, shX: .24, shY: .4, uArm: .27, lArm: .27, hipX: .1, uLeg: .29, lLeg: .29, stride: .5, lean: .1, stoop: .12, top: 1.42 },
};
const RIGOUT = { headM: _M[3], handR: new THREE.Vector3(), handL: new THREE.Vector3(), tip: new THREE.Vector3(), torch: new THREE.Vector3() };
// 사람형 공용 리그. 아군(src/52-allies.js)도 쓰므로 기존 플래그의 동작은 그대로다.
// 조선워치에서 더한 플래그(모두 선택):
//   tintH/tintL  부위별 tint          mount   말 안장 행렬(있으면 그 위에 앉는다)
//   crouch 0..1  웅크려 달리기        roll    몸 전체 앞구르기 각도
//   charge       칼을 치켜들고 돌격    lance   창을 앞으로 겨눔      hoist  두 팔을 머리 위로(운제 운반)
//   girth        몸통 굵기 배율        wTint   무기 tint
//   gear         [{ b: PartBatch, at: 0 몸통 | 1 머리 | 2 골반, t: tint, s: 배율, y: 높이, glow }] 덧입는 장비
function rigHuman(kit, sp, e) {
  const s = e.scale || 1, mv = e.mv, ph = e.ph, fl = e.flash || 0, tint = e.tint || null, fz = e.flinch || 0;
  const tH = e.tintH === undefined ? tint : e.tintH, tL = e.tintL === undefined ? tint : e.tintL, cr = e.crouch || 0, ride = e.mount || null;
  const sw = ride ? 0 : Math.sin(ph) * sp.stride * mv, cw = Math.cos(ph);
  let twist = Math.sin(ph) * .12 * mv, lean = sp.lean * mv + sp.stoop + cr * .75, lunge = 0, dip = 0;
  let shR = .25 * sw - .15, elR = -.35, bladeA = .55, shL = -.7 * sw - .1, elL = -.3, rzR = -.1, rzL = .1;
  if (ride) { twist = 0; lean = .1 * mv; shR = -.35; elR = -.6; shL = -.75 + .05 * Math.sin(ph * 2) * mv; elL = -.85; }
  if (e.shamble) { shR = -1.0 + .12 * Math.sin(ph); elR = -.7; shL = -.75 + .2 * Math.sin(ph + 1); elL = -.5; bladeA = .2; }
  if (e.shield) { shL = -.55; elL = -1.25; rzL = .2; }
  if (e.torch) { shL = -1.25 + .06 * Math.sin(ph * 2); elL = -.5; }
  if (e.heavy) { shR = -.3 + .3 * sw; elR = -.5; bladeA = 1.9; shL = -.2 - .5 * sw; elL = -.6; }
  if (e.claw) { shR = -1.25 + .45 * sw; elR = -.55; shL = -1.25 - .45 * sw; elL = -.55; }
  if (e.staff) { shR = -.75; elR = -.95; bladeA = .12; }
  if (e.charge) { shR = -2.35 + .18 * Math.sin(ph * 2) * mv; elR = -.4; bladeA = .35; lean += .14 * mv; }
  if (e.lance) { shR = -.45; elR = -1.05; bladeA = 1.32; }
  if (e.hoist) { shR = shL = -2.95; elR = elL = -.15; rzR = -.05; rzL = .05; }
  if (e.cast > 0) { const u = easeInOut(Math.min(1, e.cast * 1.6)); shR = lerp(shR, -2.7, u); elR = lerp(elR, -.25, u); if (!ride) { shL = lerp(shL, -2.3, u); elL = lerp(elL, -.4, u); } }
  if (e.drum) { const b = Math.sin(e.beat || 0); shR = -.95 - .5 * Math.max(0, b); elR = -1.15; shL = -.95 - .5 * Math.max(0, -b); elL = -1.15; bladeA = .9; }
  let atk = e.atk;
  if (e.bow) {
    const d = e.draw || 0; shL = -HPI + (e.pitch || 0); elL = -.05; rzL = .05; shR = -HPI + (e.pitch || 0) + .1; elR = -.2 - d * 1.9; twist = .2 + d * .25; atk = -1;
  }
  if (atk >= 0) {
    const t = atk;
    if (t < .38) { const u = easeInOut(t / .38); shR = lerp(shR, -3.35, u); elR = lerp(elR, -.95, u); bladeA = lerp(bladeA, -2.95, u); twist = lerp(twist, -.42, u); lean = lerp(lean, -.12, u); }
    else if (t < .52) { const u = easeIn((t - .38) / .14); shR = lerp(-3.35, -.85, u); elR = lerp(-.95, -.12, u); bladeA = lerp(-2.95, 1.75, u); twist = lerp(-.42, .42, u); lean = lerp(-.12, .26, u); lunge = .14 * u; dip = .05 * u; }
    else { const u = easeOut((t - .52) / .48); shR = lerp(-.85, shR, u); elR = lerp(-.12, elR, u); bladeA = lerp(1.75, bladeA, u); twist = lerp(.42, twist, u); lean = lerp(.26, lean, u); lunge = .14 * (1 - u); dip = .05 * (1 - u); }
  }
  const bob = -sp.uLeg * (1 - Math.cos(sw)) - dip + (e.heavy ? Math.abs(Math.sin(ph)) * .035 * mv : Math.abs(Math.sin(ph)) * .02 * mv);
  let M0;
  if (ride) M0 = _M[0].copy(ride);
  else if (e.roll) { xf(_M[21], null, e.x, e.y + .7 * s, e.z, 0, e.yaw, 0, s, s, s); xf(_M[22], _M[21], 0, 0, 0, e.roll, 0, 0); M0 = xf(_M[0], _M[22], 0, -.7, 0, 0, 0, 0); }
  else { const g = e.girth || 1; M0 = xf(_M[0], null, e.x, e.y, e.z, 0, e.yaw, 0, s * g, s, s * g); }
  const M1 = ride ? xf(_M[1], M0, 0, .04 + Math.abs(Math.sin(ph)) * .02 * mv, lunge * .5, lean * .4 - fz * .18, twist * .5, 0)
    : xf(_M[1], M0, 0, sp.hip + bob - cr * .13, lunge - fz * .06, lean * .4 - fz * .18, twist * .5, (e.shamble ? Math.sin(ph) * .05 * mv : 0));
  kit.pelvis.put(M1, fl, tint);
  const M2 = xf(_M[2], M1, 0, sp.pelvisH, 0, lean * .6 - fz * .4, twist, 0);
  kit.torso.put(M2, fl, tint);
  const M3 = xf(_M[3], M2, 0, sp.torsoH, 0, -lean * (.6 + .3 * cr) - fz * .35 + (e.shamble ? Math.sin(ph * 2) * .05 : 0), -twist * .8, e.shamble ? Math.sin(ph) * .1 * mv : 0);
  kit.head.put(M3, fl, tH);
  const M4 = xf(_M[4], M2, sp.shX, sp.shY, 0, shL + fz * .5, 0, rzL + fz * .3), M5 = xf(_M[5], M4, 0, -sp.uArm, 0, elL, 0, 0);
  kit.uArm.put(M4, fl, tint); kit.lArm.put(M5, fl, tL);
  const M6 = xf(_M[6], M2, -sp.shX, sp.shY, 0, shR + fz * .4, 0, rzR - fz * .3), M7 = xf(_M[7], M6, 0, -sp.uArm, 0, elR, 0, 0);
  kit.uArm.put(M6, fl, tint); kit.lArm.put(M7, fl, tL);
  RIGOUT.handR.set(0, -sp.lArm, 0).applyMatrix4(M7); RIGOUT.handL.set(0, -sp.lArm, 0).applyMatrix4(M5);
  const I = KIT.item, psiR = shR + elR + fz * .4, psiL = shL + elL + fz * .5;
  if (e.weapon) { const M8 = xf(_M[8], M7, 0, -sp.lArm, 0, bladeA - psiR, 0, 0, e.wScale || 1, e.wScale || 1, e.wScale || 1); e.weapon.put(M8, fl, e.wTint || null); RIGOUT.tip.set(0, .6, 0).applyMatrix4(M8); }
  if (e.shield) { const M9 = xf(_M[9], M5, .04, -sp.lArm * .6, .06, -psiL + .05, .25, 0); e.shield.put(M9, fl, e.shieldTint || null); }
  if (e.torch) { const M9 = xf(_M[9], M5, 0, -sp.lArm, 0, .25 - psiL, 0, 0); I.torch.put(M9, 0, null); RIGOUT.torch.set(0, .46, 0).applyMatrix4(M9); }
  if (e.bow) { const M9 = xf(_M[9], M5, 0, -sp.lArm, 0, HPI + .0, 0, 0); I.bow.put(M9, fl, null); }
  if (e.helm) I.helm.put(M3, fl, null);
  if (e.plate) I.plate.put(M2, fl, null);
  if (e.hood) I.hood.put(M3, fl, null); if (e.robe) I.robe.put(M2, fl, null); if (e.drum) I.drum.put(M2, fl, null); if (e.standard) I.standard.put(M2, 0, null);
  if (e.keg) I.keg.put(M2, fl, null); if (e.wraps) { I.wraps.put(M2, fl, null); I.wrapHead.put(M3, fl, null); } if (e.crown) I.crown.put(M3, fl, null);
  if (e.gear) for (const g of e.gear) {
    const P = g.at === 1 ? M3 : g.at === 2 ? M1 : M2;
    g.b.put(g.s ? xf(_M[20], P, 0, g.y || 0, 0, 0, 0, 0, g.s, g.s, g.s) : P, g.glow ? 0 : fl, g.t || null);
  }
  if (ride) {
    const M10 = xf(_M[10], M1, sp.hipX, 0, 0, -1.2, 0, .5), M11 = xf(_M[11], M10, 0, -sp.uLeg, 0, 1.25, 0, 0);
    const M12 = xf(_M[12], M1, -sp.hipX, 0, 0, -1.2, 0, -.5), M13 = xf(_M[13], M12, 0, -sp.uLeg, 0, 1.25, 0, 0);
    kit.uLeg.put(M10, fl, tint); kit.lLeg.put(M11, fl, tL); kit.uLeg.put(M12, fl, tint); kit.lLeg.put(M13, fl, tL);
    return M3;
  }
  const kL = Math.max(0, cw) * 1.0 * mv, kR = Math.max(0, -cw) * 1.0 * mv, cb = cr * .9, ck = cr * 1.3;
  const M10 = xf(_M[10], M1, sp.hipX, 0, 0, -sw - kL * .25 - cb, 0, 0), M11 = xf(_M[11], M10, 0, -sp.uLeg, 0, kL + ck, 0, 0);
  const M12 = xf(_M[12], M1, -sp.hipX, 0, 0, sw - kR * .25 - cb, 0, 0), M13 = xf(_M[13], M12, 0, -sp.uLeg, 0, kR + ck, 0, 0);
  kit.uLeg.put(M10, fl, tint); kit.lLeg.put(M11, fl, tL); kit.uLeg.put(M12, fl, tint); kit.lLeg.put(M13, fl, tL);
  return M3;
}
function rigBat(e, K = KIT.bat, wx = .06, wy = .02) {
  const s = e.scale || 1, fl = e.flash || 0, f = Math.sin(e.ph), tint = e.tint || null;
  const M0 = xf(_M[0], null, e.x, e.y + Math.sin(e.ph * .5) * .08, e.z, -.25 + (e.flinch || 0) * .8, e.yaw, Math.sin(e.ph * .25) * .15, s, s, s);
  K.body.put(M0, fl, tint);
  K.wing.put(xf(_M[1], M0, wx, wy, 0, 0, 0, f * .85 + .15), fl, tint);
  K.wing.put(xf(_M[2], M0, -wx, wy, 0, 0, 0, -(f * .85 + .15), -1, 1, 1), fl, tint);
  return M0;
}

const DEB = [];
const _dq = new THREE.Quaternion(), _dax = new THREE.Vector3(), _dp = new THREE.Vector3(), _ds = new THREE.Vector3(), _dm = new THREE.Matrix4();
function addDebris(batch, mat, tint, vx, vy, vz, spin, life, o = {}) {
  if (DEB.length > 520) return null;
  const d = { batch, p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), vx, vy, vz, w: new THREE.Vector3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(), ws: spin, life, max: life, tint: tint ? tint.slice() : null, rad: o.rad || batch.rad, rest: false, coin: o.coin || 0, bounce: o.bounce === undefined ? .32 : o.bounce, flash: o.flash || 0, goo: o.goo || 0, hold: o.hold || 0 };
  mat.decompose(d.p, d.q, d.s); d.rad *= Math.max(d.s.x, d.s.y); DEB.push(d); return d;
}
function shatter(rigFn, e, impulse, o = {}) {
  const ix = impulse[0], iy = impulse[1], iz = impulse[2], spread = o.spread === undefined ? 1.6 : o.spread;
  RIG_CAPTURE = (batch, mat, tint) => { addDebris(batch, mat, tint, ix + rr(-spread, spread), iy + rr(.4, 2.2) * (o.up || 1), iz + rr(-spread, spread), rr(3, 11), rr(3.2, 5.5) * (o.life || 1), { hold: o.hold ? rr(0, o.hold) : 0 }); };
  try { rigFn(e); } finally { RIG_CAPTURE = null; }
}
function updateDebris(dt, groundAt, onCoin) {
  for (let i = DEB.length - 1; i >= 0; i--) {
    const d = DEB[i]; d.life -= dt;
    if (d.life <= 0) { swapRemove(DEB, i); continue; }
    if (d.hold > 0) { d.hold -= dt; }
    else if (!d.rest) {
      d.vy -= 13 * dt; d.p.x += d.vx * dt; d.p.y += d.vy * dt; d.p.z += d.vz * dt;
      _dq.setFromAxisAngle(d.w, d.ws * dt); d.q.premultiply(_dq);
      const gy = groundAt(d.p.x, d.p.z) + d.rad;
      if (d.p.y < gy) {
        d.p.y = gy;
        if (d.goo) { d.life = 0; continue; }
        if (Math.abs(d.vy) < 1.2) { d.rest = true; d.vy = 0; } else { d.vy = -d.vy * d.bounce; }
        d.vx *= .55; d.vz *= .55; d.ws *= .5;
      }
    } else if (d.life < .9 && !d.coin) { d.p.y -= dt * .22; }
    if (d.coin && d.max - d.life > d.coin) { onCoin(d); swapRemove(DEB, i); continue; }
    let sc = 1; if (!d.coin && d.life < .5) sc = Math.max(.01, d.life / .5);
    _dm.compose(d.p, d.q, _ds.copy(d.s).multiplyScalar(sc));
    d.batch.put(_dm, d.flash, d.tint);
  }
}
function clearDebris() { DEB.length = 0; }
