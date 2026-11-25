
// 아군(수비 측) 병사 장비와 그리기. 시대(curEra())에 따라 고구려/고려/조선 병사로 바뀔 수 있다.
// 뼈대 애니메이션은 src/50-rig.js 의 rigHuman(kit, spec, e) 를 그대로 쓴다.
SPEC.foot = { hip: .59, pelvisH: .1, torsoH: .46, shX: .23, shY: .4, uArm: .27, lArm: .27, hipX: .09, uLeg: .29, lLeg: .29, stride: .55, lean: .06, stoop: 0, eyeX: 0, eyeY: 0, eyeZ: 0, top: 1.4 };
function footKit(cap) {
  const k = {}, limb = cap * 2;
    const mail = COL.steel, cloth = mulC(COL.clothB, 1.75), lea = COL.leather;
    k.pelvis = new PartBatch(S => { S.box(.28, .14, .19, 0, 0, 0, mulC(COL.clothD, 1.6), { l: L_CLOTH }); S.box(.3, .05, .2, 0, .06, 0, lea, {}); }, cap, { rad: .12 });
    k.torso = new PartBatch(S => {
      S.box(.34, .4, .22, 0, .21, 0, cloth, { l: L_CLOTH, jit: 0 }); S.box(.12, .34, .23, 0, .2, 0, mulC(cloth, .62), { l: L_CLOTH, jit: 0 });
      S.box(.42, .1, .25, 0, .4, 0, mail, { l: L_METAL, rough: .5 }); S.box(.16, .08, .16, 0, .45, 0, COL.skin, {});
    }, cap, { rad: .17 });
    k.head = new PartBatch(S => {
      S.box(.19, .2, .19, 0, .12, .0, COL.skin, { jit: .04 }); S.box(.2, .08, .1, 0, .06, -.06, mulC(COL.leather, .7), {});
      S.add(gDome(8, 3), { s: [.155, .13, .155], p: [0, .19, 0], c: mail, l: L_METAL, rough: .42 }); S.cyl(.21, .03, 0, .19, 0, mulC(mail, .85), { n: 8, l: L_METAL, rough: .42 });
      for (const s of [-1, 1]) S.box(.03, .03, .02, s * .05, .14, .098, COL.black, { jit: 0 });
    }, cap, { rad: .14 });
    k.uArm = new PartBatch(S => { S.box(.1, .26, .1, 0, -.13, 0, mail, { l: L_METAL, rough: .5 }); S.box(.13, .09, .13, 0, -.03, 0, mulC(mail, 1.1), { l: L_METAL, rough: .45 }); }, limb, { rad: .07, shadow: false });
    k.lArm = new PartBatch(S => { S.box(.085, .24, .085, 0, -.12, 0, lea, {}); S.box(.09, .08, .09, 0, -.27, 0, COL.skin, {}); }, limb, { rad: .07, shadow: false });
    k.uLeg = new PartBatch(S => { S.box(.115, .28, .115, 0, -.14, 0, mulC(COL.clothD, 1.5), { l: L_CLOTH }); }, limb, { rad: .08, shadow: false });
    k.lLeg = new PartBatch(S => { S.box(.1, .28, .1, 0, -.14, 0, mulC(lea, .7), {}); S.box(.11, .06, .2, 0, -.29, .045, mulC(lea, .6), {}); }, limb, { rad: .08, shadow: false });
  return k;
}
function initAllyKits() {
  const E = KIT.item, iron = COL.iron;
  KIT.foot = footKit(40);
  E.blade = new PartBatch(S => { S.box(.04, .13, .04, 0, 0, 0, COL.leather, {}); S.box(.2, .035, .055, 0, .075, 0, COL.brass, { l: L_METAL, rough: .4 }); S.box(.06, .52, .02, 0, .35, 0, mulC(COL.steel, 1.15), { l: L_METAL, rough: .3 }); S.cone(.032, .09, 0, .655, 0, mulC(COL.steel, 1.15), { n: 4, l: L_METAL, rough: .3 }); }, 40, { rad: .05, shadow: false });
  E.shieldH = new PartBatch(S => { const sc = mulC(COL.clothB, 1.6); S.box(.36, .3, .045, 0, .08, 0, sc, { l: L_WOOD, jit: 0 }); S.box(.26, .12, .045, 0, -.12, 0, sc, { l: L_WOOD, jit: 0 }); S.box(.14, .1, .045, 0, -.22, 0, sc, { l: L_WOOD, jit: 0 }); S.box(.07, .5, .05, 0, -.02, .004, mulC(COL.gold, .8), { l: L_METAL, rough: .45, jit: 0 }); S.box(.36, .06, .05, 0, .1, .004, mulC(COL.gold, .8), { l: L_METAL, rough: .45, jit: 0 }); }, 40, { rad: .2, shadow: false });
  E.bow = new PartBatch(S => { let p = [0, -.36, 0]; for (let i = 1; i <= 6; i++) { const t = i / 6 * 2 - 1, q = [0, t * .36, (1 - t * t) * .12]; S.seg(p, q, .016, .016, COL.woodL, { n: 4, l: L_WOOD }); p = q; } S.seg([0, -.36, 0], [0, .36, 0], .005, .005, COL.bone, { n: 3, jit: 0 }); }, 40, { rad: .1, shadow: false });
  KIT.arrow = new PartBatch(S => { S.box(.022, .022, .5, 0, 0, 0, COL.woodL, { jit: 0 }); S.cone(.035, .09, 0, 0, .29, COL.ember, { n: 4, r: [HPI, 0, 0], emis: .9, jit: 0 }); for (const r of [0, HPI]) S.box(.07, .006, .1, 0, 0, -.2, COL.bone, { r: [0, 0, r], jit: 0 }); }, 120, { shadow: false });
  KIT.shell = new PartBatch(S => { S.sph(.12, 0, 0, 0, mulC(COL.iron, .8), { l: L_METAL, w: 7, h: 5, smooth: false, rough: .5 }); S.box(.04, .04, .04, 0, .12, 0, COL.ember, { emis: 1, jit: 0 }); }, 24, {});
}
function drawFootman(f) {
  f.weapon = KIT.item.blade; f.shield = f.torch ? null : KIT.item.shieldH; f.wScale = 1;
  rigHuman(KIT.foot, SPEC.foot, f);
  if (f.torch && f.flame) { const p = RIGOUT.torch; f.flame.x = p.x; f.flame.y = p.y; f.flame.z = p.z; f.lx = p.x; f.ly = p.y + .2; f.lz = p.z; }
  if (f.hp < f.maxHp) G.hbars.push({ x: f.x, y: f.y + 1.55 * f.scale, z: f.z, f: sat(f.hp / f.maxHp), boss: false, man: true });
}
