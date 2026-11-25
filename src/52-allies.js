
// 아군(수비 측) 병사 장비와 그리기. 시대(curEra())에 따라 고구려/고려/조선 병사로 바뀐다.
// 뼈대 애니메이션은 src/50-rig.js 의 rigHuman(kit, spec, e) 를 그대로 쓴다.
//
// 구조: 시대마다 병사 키트 한 벌(KIT.ally[era] = { kit, weapon, shield })을 만든다. 한 전장에는 한 시대만
// 나오고 n=0인 PartBatch는 숨겨지므로 드로콜은 늘지 않는다. 다른 모듈이 직접 참조하는 KIT.foot,
// KIT.item.blade, KIT.item.shieldH는 "지금 시대의 것"으로 넘겨 주는 대리 객체다(put만 있으면 된다).
// 대리 객체는 실제 PartBatch의 put을 부르므로 RIG_CAPTURE(사망 파편)도 그대로 따라온다.
SPEC.foot = { hip: .59, pelvisH: .1, torsoH: .46, shX: .23, shY: .4, uArm: .27, lArm: .27, hipX: .09, uLeg: .29, lLeg: .29, stride: .55, lean: .06, stoop: 0, eyeX: 0, eyeY: 0, eyeZ: 0, top: 1.4 };

function tw_footKit(era, cap) {
  const k = {}, limb = cap * 2, E = ERA[era], main = C(E.main), sub = C(E.sub), trim = C(E.trim);
  const skin = COL.skin, lea = COL.leather, hair = C(0x16141a), cl = () => ({ l: L_CLOTH, jit: 0 }), mt = r => ({ l: L_METAL, rough: r || .5 });
  const face = S => { S.box(.19, .2, .19, 0, .12, 0, skin, { jit: .04 }); S.box(.2, .13, .1, 0, .13, -.06, hair, {}); for (const s of [-1, 1]) S.box(.03, .03, .02, s * .05, .14, .098, COL.black, { jit: 0 }); };
  const arm = (sleeve, cuff) => {
    k.uArm = new PartBatch(S => { S.box(.11, .27, .11, 0, -.13, 0, sleeve, cl()); if (cuff) S.box(.135, .09, .135, 0, -.03, 0, cuff, mt(.45)); }, limb, { rad: .07, shadow: false });
    k.lArm = new PartBatch(S => { S.box(.09, .24, .09, 0, -.12, 0, cuff ? lea : sleeve, cuff ? {} : cl()); S.box(.09, .08, .09, 0, -.27, 0, skin, {}); }, limb, { rad: .07, shadow: false });
  };
  const leg = (baji, boot) => {
    k.uLeg = new PartBatch(S => { S.box(.125, .28, .125, 0, -.14, 0, baji, cl()); }, limb, { rad: .08, shadow: false });
    k.lLeg = new PartBatch(S => { S.box(.105, .28, .105, 0, -.14, 0, boot, {}); S.box(.11, .06, .2, 0, -.29, .045, mulC(boot, .8), {}); }, limb, { rad: .08, shadow: false });
  };
  if (era === 'goguryeo') {
    // 붉은 옷 위에 쇠 찰갑, 새 깃을 꽂은 절풍.
    const red = mulC(main, 1.4), lam = mulC(COL.ironL, 1.2), gold = mulC(trim, .9), cap2 = C(0x2c2a33);
    k.pelvis = new PartBatch(S => { S.box(.3, .15, .2, 0, -.01, 0, lam, mt(.55)); S.box(.31, .045, .21, 0, -.085, 0, red, cl()); S.box(.305, .045, .205, 0, .065, 0, gold, mt(.45)); }, cap, { rad: .12 });
    k.torso = new PartBatch(S => {
      S.box(.33, .4, .21, 0, .21, 0, red, cl()); S.box(.36, .27, .235, 0, .17, 0, lam, mt(.5));
      for (const y of [.1, .19]) S.box(.365, .018, .24, 0, y, 0, mulC(lam, .55), { jit: 0 });
      S.box(.42, .09, .25, 0, .385, 0, lam, mt(.5)); S.box(.2, .06, .255, 0, .345, 0, red, cl()); S.box(.16, .08, .16, 0, .45, 0, skin, {});
    }, cap, { rad: .17 });
    k.head = new PartBatch(S => {
      face(S); S.cyl(.11, .05, 0, .225, 0, red, { n: 6, l: L_CLOTH }); S.cone(.1, .17, 0, .33, -.01, cap2, { n: 6 });
      for (const s of [-1, 1]) { S.box(.024, .25, .07, s * .11, .38, -.02, COL.bone, { r: [-.15, 0, -s * .42], jit: 0 }); S.box(.026, .06, .072, s * .155, .475, -.035, red, { r: [-.15, 0, -s * .42], jit: 0 }); }
    }, cap, { rad: .14 });
    arm(red, lam); leg(C(0xb9ae94), C(0x2a2622));
  } else if (era === 'goryeo') {
    // 비취색 포에 미색 깃, 꼭지 달린 투구와 목가리개.
    const jade = mulC(main, 1.3), ivory = mulC(sub, .85), gold = mulC(trim, .95), helm = mulC(COL.steel, 1.05);
    k.pelvis = new PartBatch(S => { S.box(.3, .2, .2, 0, -.03, 0, jade, cl()); S.box(.305, .05, .205, 0, .065, 0, gold, mt(.45)); }, cap, { rad: .12 });
    k.torso = new PartBatch(S => {
      S.box(.34, .4, .22, 0, .21, 0, jade, cl()); S.box(.1, .36, .23, 0, .21, 0, ivory, cl());
      S.box(.42, .08, .25, 0, .39, 0, mulC(jade, .75), cl()); S.box(.16, .08, .16, 0, .45, 0, skin, {});
    }, cap, { rad: .17 });
    k.head = new PartBatch(S => {
      face(S); S.add(gDome(8, 3), { s: [.16, .14, .16], p: [0, .2, 0], c: helm, l: L_METAL, rough: .42 }); S.cyl(.175, .035, 0, .2, 0, gold, { n: 8, l: L_METAL, rough: .45 });
      S.cone(.03, .13, 0, .4, 0, gold, { n: 4, l: L_METAL }); S.box(.26, .15, .06, 0, .1, -.1, ivory, cl()); for (const s of [-1, 1]) S.box(.04, .14, .14, s * .115, .11, -.03, ivory, cl());
    }, cap, { rad: .14 });
    arm(jade, null); leg(ivory, C(0x2e2a28));
  } else {
    // 쪽빛 군복에 붉은 전대, 검은 전립(벙거지)과 붉은 상모.
    const blue = mulC(main, 1.75), red = mulC(sub, 1.25), white = mulC(trim, .9), felt = C(0x2a2a33);
    k.pelvis = new PartBatch(S => { S.box(.31, .17, .21, 0, -.02, 0, blue, cl()); S.box(.315, .055, .215, 0, .06, 0, red, cl()); S.box(.05, .16, .03, .08, -.03, .11, red, cl()); }, cap, { rad: .12 });
    k.torso = new PartBatch(S => {
      S.box(.34, .4, .22, 0, .21, 0, blue, cl()); S.box(.2, .05, .23, 0, .4, 0, white, cl()); S.box(.055, .22, .02, .03, .3, .112, white, { l: L_CLOTH, jit: 0, r: [0, 0, .5] });
      S.box(.4, .08, .24, 0, .39, 0, mulC(blue, .8), cl()); S.box(.16, .08, .16, 0, .45, 0, skin, {});
    }, cap, { rad: .17 });
    k.head = new PartBatch(S => {
      face(S); S.cyl(.235, .025, 0, .225, 0, felt, { n: 8 }); S.add(gDome(8, 3), { s: [.125, .13, .125], p: [0, .235, 0], c: felt });
      S.cyl(.13, .03, 0, .25, 0, red, { n: 8, l: L_CLOTH }); S.sph(.035, 0, .375, 0, red, { w: 5, h: 3, smooth: false }); S.box(.025, .12, .025, 0, .32, -.12, red, { r: [.5, 0, 0], jit: 0 });
    }, cap, { rad: .16 });
    arm(blue, null); leg(white, C(0x7a6a48));
  }
  return k;
}
// 시대별 무기와 방패.
function tw_allyArms(era, cap) {
  const E = ERA[era], main = C(E.main), sub = C(E.sub), trim = C(E.trim), steel = mulC(COL.steel, 1.15), N = { rad: .2, shadow: false };
  if (era === 'goguryeo') return {                      // 창과 긴 네모 방패
    weapon: new PartBatch(S => { S.box(.034, 1.5, .034, 0, .28, 0, COL.woodL, { l: L_WOOD, jit: 0 }); S.cone(.04, .2, 0, 1.13, 0, steel, { n: 4, l: L_METAL, rough: .3 }); S.box(.07, .09, .07, 0, .98, 0, mulC(main, 1.4), { l: L_CLOTH, jit: 0 }); }, cap, { rad: .05, shadow: false }),
    shield: new PartBatch(S => { S.box(.34, .5, .045, 0, -.02, 0, mulC(main, 1.3), { l: L_WOOD, jit: 0 }); S.box(.36, .05, .05, 0, .2, .004, mulC(trim, .9), { l: L_METAL, rough: .45, jit: 0 }); S.box(.36, .05, .05, 0, -.24, .004, mulC(trim, .9), { l: L_METAL, rough: .45, jit: 0 }); S.sph(.07, 0, -.02, .03, mulC(trim, .9), { l: L_METAL, w: 6, h: 4, smooth: false }); }, cap, N),
  };
  if (era === 'goryeo') return {                        // 환도와 둥근 방패
    weapon: new PartBatch(S => { S.box(.04, .13, .04, 0, 0, 0, COL.leather, {}); S.box(.14, .03, .06, 0, .075, 0, mulC(trim, .9), { l: L_METAL, rough: .4 }); S.box(.05, .54, .02, 0, .36, 0, steel, { l: L_METAL, rough: .3, r: [0, 0, -.04] }); S.cone(.028, .09, .012, .67, 0, steel, { n: 4, l: L_METAL, rough: .3 }); }, cap, { rad: .05, shadow: false }),
    shield: new PartBatch(S => { S.cyl(.26, .05, 0, -.02, 0, mulC(main, 1.2), { n: 8, r: [HPI, 0, 0], l: L_WOOD, jit: 0 }); S.add(gTorus(8, .1, 4), { s: .25, p: [0, -.02, .012], c: mulC(sub, .85), l: L_METAL }); S.sph(.07, 0, -.02, .04, mulC(trim, .95), { l: L_METAL, w: 6, h: 4, smooth: false }); }, cap, N),
  };
  return {                                              // 의병의 죽창(방패 없음)
    weapon: new PartBatch(S => { const bam = C(0x8f9a52); S.box(.036, 1.45, .036, 0, .3, 0, bam, { l: L_WOOD, jit: 0 }); for (const y of [-.1, .3, .7]) S.box(.044, .025, .044, 0, y, 0, mulC(bam, .65), { jit: 0 }); S.cone(.03, .18, 0, 1.11, 0, mulC(bam, 1.25), { n: 4 }); }, cap, { rad: .05, shadow: false }),
    shield: null,
  };
}
function tw_allyKit(era) { return KIT.ally[era] || KIT.ally[curEra()] || KIT.ally.joseon; }
function initAllyKits() {
  const E = KIT.item, A = KIT.ally = {};
  for (const era of ['goguryeo', 'goryeo', 'joseon']) A[era] = Object.assign({ kit: tw_footKit(era, 48) }, tw_allyArms(era, 48));
  // 현재 시대의 PartBatch로 넘겨 주는 대리 객체(61-monsters.js, 62-game.js가 KIT.foot/blade/shieldH를 직접 쓴다).
  const proxy = pick => ({ rad: .1, put(m, f, t) { const b = pick(tw_allyKit()); if (b) b.put(m, f, t); } });
  KIT.foot = {}; for (const part of ['pelvis', 'torso', 'head', 'uArm', 'lArm', 'uLeg', 'lLeg']) KIT.foot[part] = proxy(a => a.kit[part]);
  E.blade = proxy(a => a.weapon); E.shieldH = proxy(a => a.shield);
  // 맥궁·각궁: 양 끝이 바깥으로 되휜 짧은 활.
  E.bow = new PartBatch(S => {
    const at = t => [0, t * .33, (1 - t * t) * .11 + smooth(.62, 1, Math.abs(t)) * .07]; let p = at(-1);
    for (let i = 1; i <= 8; i++) { const q = at(i / 8 * 2 - 1); S.seg(p, q, .017, .017, COL.woodL, { n: 4, l: L_WOOD }); p = q; }
    S.box(.03, .09, .03, 0, 0, .11, COL.leather, { jit: 0 }); S.seg(at(-1), at(1), .005, .005, COL.bone, { n: 3, jit: 0 });
  }, 48, { rad: .1, shadow: false });
  KIT.arrow = new PartBatch(S => { S.box(.022, .022, .5, 0, 0, 0, COL.woodL, { jit: 0 }); S.cone(.035, .09, 0, 0, .29, COL.ember, { n: 4, r: [HPI, 0, 0], emis: .9, jit: 0 }); for (const r of [0, HPI]) S.box(.07, .006, .1, 0, 0, -.2, COL.bone, { r: [0, 0, r], jit: 0 }); }, 120, { shadow: false });
  // 탄: 조선 = 진천뢰(무쇠 탄과 타는 심지), 고구려 = 불 단지, 고려 = 쇳물 솥.
  KIT.shell = new PartBatch(S => { S.sph(.12, 0, 0, 0, mulC(COL.iron, .8), { l: L_METAL, w: 7, h: 5, smooth: false, rough: .5 }); S.box(.04, .04, .04, 0, .12, 0, COL.ember, { emis: 1, jit: 0 }); }, 24, {});
  A.jar = new PartBatch(S => tw_jar(S, 0, -.13, 0, 1, true), 24, {});
  A.pot = new PartBatch(S => tw_pot(S, 0, -.12, 0, 1.05), 24, {});
}
function drawFootman(f) {
  const a = tw_allyKit(f.tower && f.tower.era);
  f.weapon = a.weapon; f.shield = f.torch ? null : a.shield; f.wScale = 1;
  rigHuman(a.kit, SPEC.foot, f);
  if (f.torch && f.flame) { const p = RIGOUT.torch; f.flame.x = p.x; f.flame.y = p.y; f.flame.z = p.z; f.lx = p.x; f.ly = p.y + .2; f.lz = p.z; }
  if (f.hp < f.maxHp) G.hbars.push({ x: f.x, y: f.y + 1.55 * f.scale, z: f.z, f: sat(f.hp / f.maxHp), boss: false, man: true });
}
