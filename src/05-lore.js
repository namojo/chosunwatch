
// 조선워치 세계관 계약(contract). 다른 모듈은 이 표의 키와 헬퍼만 믿고 작업한다.
// - 전장(biome)은 bio.era(수비 측 시대)와 bio.army(침공군)를 가진다. (src/29-biome.js)
// - 적 표시 이름/설명: MON[type].names[army] / MON[type].tips[army] 가 있으면 그것을, 없으면 MON[type].name / tip.
// - 타워 표시 이름/설명: TOWER[kind].eras[era] = { name, short, desc } 가 있으면 그것을, 없으면 기본값.
// 색은 0xRRGGBB. main = 주색, sub = 보조색, trim = 장식(금속/테두리).
const ERA = {
  goguryeo: { name: '고구려', main: 0xa8281c, sub: 0x17161c, trim: 0xd9a441, crest: '삼족오' },
  goryeo: { name: '고려', main: 0x3f8f86, sub: 0xe8e0cc, trim: 0xc9a24a, crest: '청자 비취' },
  joseon: { name: '조선', main: 0x24457a, sub: 0xb3272d, trim: 0xe6dcc0, crest: '태극·오방' },
};
const ARMY = {
  sui: { name: '수나라군', short: '수', main: 0x9a5a22, sub: 0xcaa23a, trim: 0x5a4632 },
  tang: { name: '당나라군', short: '당', main: 0x8f1d2c, sub: 0xd0a030, trim: 0x9aa0a8 },
  mongol: { name: '몽골군', short: '몽골', main: 0x3b6ea5, sub: 0xe6e2d6, trim: 0x6a4a2e },
  wa: { name: '왜군', short: '왜', main: 0x1a1a1f, sub: 0xa51c1c, trim: 0xe8e4da },
};
function curBio() { return (G.B && G.B.bio) || BIOMES[0]; }
function curEra() { return curBio().era || 'joseon'; }
function curArmy() { return curBio().army || 'wa'; }
function monName(type, army) { const d = MON[type], a = army || curArmy(); return (d.names && d.names[a]) || d.name; }
function monTip(type, army) { const d = MON[type], a = army || curArmy(); return (d.tips && d.tips[a]) || d.tip; }
function towerInfo(kind, era) { const d = TOWER[kind], e = d.eras && d.eras[era || curEra()]; return e || d; }
function towerName(kind, era) { return towerInfo(kind, era).name || TOWER[kind].name; }
function towerShort(kind, era) { return towerInfo(kind, era).short || TOWER[kind].short; }
function towerDesc(kind, era) { return towerInfo(kind, era).desc || TOWER[kind].desc; }
