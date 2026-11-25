const PX = (() => {
  const LINE = 9, CAP = 7, GAP = 1, CACHE_MAX = 500;

  const SRC = {
    '!': '#/#/#/#/#/./#',
    '"': '#.#/#.#',
    '#': '.#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.',
    '$': '..#../.####/#.#../.###./..#.#/####./..#..',
    '%': '##.../##..#/...#./..#../.#.../#..##/...##',
    '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
    "'": '#/#',
    '(': '.#/#./#./#./#./#./.#',
    ')': '#./.#/.#/.#/.#/.#/#.',
    '*': '1:#.#/.#./#.#',
    '+': '2:.#./###/.#.',
    ',': '5:.#/.#/#.',
    '-': '3:###',
    '.': '6:#',
    '/': '..#/..#/.#./.#./.#./#../#..',
    '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
    '1': '..#../.##../..#../..#../..#../..#../.###.',
    '2': '.###./#...#/....#/...#./..#../.#.../#####',
    '3': '.###./#...#/....#/..##./....#/#...#/.###.',
    '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
    '5': '#####/#..../####./....#/....#/#...#/.###.',
    '6': '..##./.#.../#..../####./#...#/#...#/.###.',
    '7': '#####/....#/...#./..#../..#../..#../..#..',
    '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
    '9': '.###./#...#/#...#/.####/....#/...#./.##..',
    ':': '2:#/././#',
    ';': '2:.#/../../.#/.#/#.',
    '<': '1:..#/.#./#../.#./..#',
    '=': '2:###/.../###',
    '>': '1:#../.#./..#/.#./#..',
    '?': '.###./#...#/....#/...#./..#../...../..#..',
    '@': '.###./#...#/#.###/#.#.#/#.###/#..../.###.',
    'A': '.###./#...#/#...#/#####/#...#/#...#/#...#',
    'B': '####./#...#/#...#/####./#...#/#...#/####.',
    'C': '.###./#...#/#..../#..../#..../#...#/.###.',
    'D': '####./#...#/#...#/#...#/#...#/#...#/####.',
    'E': '#####/#..../#..../####./#..../#..../#####',
    'F': '#####/#..../#..../####./#..../#..../#....',
    'G': '.###./#...#/#..../#.###/#...#/#...#/.###.',
    'H': '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    'I': '###/.#./.#./.#./.#./.#./###',
    'J': '...#/...#/...#/...#/...#/#..#/.##.',
    'K': '#...#/#..#./#.#../##.../#.#../#..#./#...#',
    'L': '#.../#.../#.../#.../#.../#.../####',
    'M': '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
    'N': '#...#/#...#/##..#/#.#.#/#..##/#...#/#...#',
    'O': '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    'P': '####./#...#/#...#/####./#..../#..../#....',
    'Q': '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
    'R': '####./#...#/#...#/####./#.#../#..#./#...#',
    'S': '.###./#...#/#..../.###./....#/#...#/.###.',
    'T': '#####/..#../..#../..#../..#../..#../..#..',
    'U': '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    'V': '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    'W': '#...#/#...#/#...#/#.#.#/#.#.#/#.#.#/.#.#.',
    'X': '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    'Y': '#...#/#...#/.#.#./..#../..#../..#../..#..',
    'Z': '#####/....#/...#./..#../.#.../#..../#####',
    '[': '##/#./#./#./#./#./##',
    '\\': '#../#../.#./.#./.#./..#/..#',
    ']': '##/.#/.#/.#/.#/.#/##',
    '^': '.#./#.#',
    '_': '7:####',
    '`': '#./.#',
    'a': '2:.###./....#/.####/#...#/.####',
    'b': '#..../#..../####./#...#/#...#/#...#/####.',
    'c': '2:.###/#.../#.../#.../.###',
    'd': '....#/....#/.####/#...#/#...#/#...#/.####',
    'e': '2:.###./#...#/#####/#..../.###.',
    'f': '..##/.#../####/.#../.#../.#../.#..',
    'g': '2:.####/#...#/#...#/#...#/.####/....#/.###.',
    'h': '#..../#..../####./#...#/#...#/#...#/#...#',
    'i': '#/./#/#/#/#/#',
    'j': '..#/.../..#/..#/..#/..#/..#/..#/##.',
    'k': '#.../#.../#..#/#.#./##../#.#./#..#',
    'l': '#./#./#./#./#./#./.#',
    'm': '2:####./#.#.#/#.#.#/#.#.#/#.#.#',
    'n': '2:####./#...#/#...#/#...#/#...#',
    'o': '2:.###./#...#/#...#/#...#/.###.',
    'p': '2:####./#...#/#...#/#...#/####./#..../#....',
    'q': '2:.####/#...#/#...#/#...#/.####/....#/....#',
    'r': '2:#.##/##../#.../#.../#...',
    's': '2:.####/#..../.###./....#/####.',
    't': '1:.#../####/.#../.#../.#../..##',
    'u': '2:#...#/#...#/#...#/#...#/.####',
    'v': '2:#...#/#...#/#...#/.#.#./..#..',
    'w': '2:#...#/#...#/#.#.#/#.#.#/.#.#.',
    'x': '2:#...#/.#.#./..#../.#.#./#...#',
    'y': '2:#...#/#...#/#...#/#...#/.####/....#/.###.',
    'z': '2:#####/...#./..#../.#.../#####',
    '{': '..#/.#./.#./#../.#./.#./..#',
    '|': '#/#/#/#/#/#/#',
    '}': '#../.#./.#./..#/.#./.#./#..',
    '~': '2:.#.../#.#.#/...#.',
    '·': '3:#',
    '×': '3:#.#/.#./#.#',
    '←': '1:..#../.#.../#####/.#.../..#..',
    '→': '1:..#../...#./#####/...#./..#..',
    '↑': '..#../.###./#.#.#/..#../..#../..#../..#..',
    '↓': '..#../..#../..#../..#../#.#.#/.###./..#..',
    '–': '3:####',
    '…': '6:#.#.#',
  };
  const UNKNOWN_SRC = '1:####/#..#/#..#/#..#/#..#/####';

  function parse(def) {
    let off = 0, s = def;
    if (s.length > 1 && s[1] === ':' && s[0] >= '0' && s[0] <= '9') { off = +s[0]; s = s.slice(2); }
    const rows = s.split('/');
    let w = 0;
    for (const r of rows) if (r.length > w) w = r.length;
    const bits = new Uint8Array(LINE);
    for (let i = 0; i < rows.length && off + i < LINE; i++) {
      const r = rows[i]; let b = 0;
      for (let x = 0; x < r.length; x++) if (r[x] === '#') b |= 1 << x;
      bits[off + i] = b;
    }
    return { w, bits };
  }

  const glyphs = new Map();
  glyphs.set(' ', { w: 3, bits: new Uint8Array(LINE) });
  for (const ch in SRC) glyphs.set(ch, parse(SRC[ch]));
  const UNKNOWN = parse(UNKNOWN_SRC);

  // ── 한글(전각) 글꼴 ─────────────────────────────────────────────────────────────
  // src/71-hangul-data.js(tools/hangul.py 가 GNU Unifont 16px 에서 뽑은 1비트 글리프)를 쓴다.
  // 규칙: 문자열에 7px 라틴 글꼴에 없는 글자(한글 등)가 하나라도 있으면 그 문자열 전체를 16px 격자로 그린다.
  //       16px 격자의 한 픽셀은 HUD 배율 s 의 절반(hgScale)으로 찍는다. 한글의 잉크는 16행 중 2~15행(14px)이라
  //       절반 배율에서 정확히 라틴 대문자 높이(CAP 7)와 같아지고, 줄 간격(LINE 9)도 그대로 맞는다.
  //       숫자·기호만 있는 문자열(군자금 300, 1x)은 원래의 7px 글꼴로 남는다.
  const HG = 16, HG_TOP = 2;
  let hg = null;
  function hgInit() {
    hg = new Map();
    if (typeof hg_DATA === 'undefined') return;
    const load = (chars, bits, bytes) => {
      const bin = bits.map(b => atob(b)).join(''); let i = 0;
      for (const ch of chars.join('')) {
        const rows = new Uint16Array(HG);
        for (let r = 0; r < HG; r++) rows[r] = bytes === 2 ? (bin.charCodeAt(i + r * 2) << 8) | bin.charCodeAt(i + r * 2 + 1) : bin.charCodeAt(i + r) << 8;
        hg.set(ch, { w: bytes * 8, rows }); i += HG * bytes;
      }
    };
    load(hg_DATA.half, hg_DATA.halfBits, 1); load(hg_DATA.full, hg_DATA.fullBits, 2);
  }
  // 생성물에 없는 글자(글꼴 없이 빌드한 뒤 새 문구를 넣은 경우)는 시스템 글꼴로 한 번 래스터해서 쓴다.
  function hgSynth(ch) {
    const rows = new Uint16Array(HG); let w = HG, ink = 0;
    try {
      const cv = document.createElement('canvas'); cv.width = HG; cv.height = HG;
      const c = cv.getContext('2d', { willReadFrequently: true });
      c.font = "14px 'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR','Noto Sans CJK KR',sans-serif"; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
      if (c.measureText(ch).width < 9) w = 8;
      c.fillText(ch, w === 8 ? 0 : 1, 14);
      const d = c.getImageData(0, 0, HG, HG).data;
      for (let r = 0; r < HG; r++) for (let x = 0; x < w; x++) if (d[(r * HG + x) * 4 + 3] > 96) { rows[r] |= 0x8000 >> x; ink++; }
    } catch (e) {}
    if (!ink && ch.trim()) for (let r = 3; r < 15; r++) rows[r] = r === 3 || r === 14 ? 0x3ffc : 0x2004;
    if (ch.trim() && typeof console !== 'undefined') console.warn('PX: glyph not in 71-hangul-data.js, rebuild with Unifont: ' + ch);
    return { w, rows };
  }
  function hgGlyph(ch) {
    if (!hg) hgInit();
    let g = hg.get(ch);
    if (!g) { g = hgSynth(ch); hg.set(ch, g); }
    return g;
  }
  const hgScale = s => Math.max(1, Math.round((s || 2) / 2));
  function isWide(str) {
    for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) > 0x7e && !glyphs.has(str[i])) return true;
    return false;
  }

  // 폭을 "라틴 픽셀 단위"로 돌려준다(곱하기 s = 화면 픽셀). 전각 글자는 8단위, 그 안의 반각 글자는 4단위.
  function measure(str, s) {
    str = String(str);
    let w = 0, n = 0;
    if (isWide(str)) { for (const ch of str) w += hgGlyph(ch).w; return s ? w * hgScale(s) / s : w / 2; }
    for (const ch of str) { w += (glyphs.get(ch) || UNKNOWN).w + GAP; n++; }
    return n ? w - GAP : 0;
  }

  const cache = new Map();
  const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

  function remember(key, entry) {
    cache.set(key, entry);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return entry;
  }

  function run(str, color, shadow, outline, thin) {
    const key = 't\u0001' + str + '\u0001' + color + '\u0001' + shadow + '\u0001' + outline + (thin ? '\u0001t' : '');
    const hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
    const wide = isWide(str), gl = [], rowsN = wide ? HG : LINE, gap = wide ? 0 : GAP;
    let w = 0;
    for (const ch of str) { const g = wide ? hgGlyph(ch) : glyphs.get(ch) || UNKNOWN; gl.push(g); w += g.w + gap; }
    if (gl.length) w -= gap;
    // 한글은 획을 오른쪽으로 한 픽셀 겹쳐 찍어(굵게) HUD 의 굵은 픽셀과 무게를 맞춘다. opts.thin 이면 원래 굵기.
    const o = outline ? 1 : 0, sh = shadow ? 1 : 0, fat = wide && !thin ? 1 : 0;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, w + 2 * o + sh + fat);
    cv.height = rowsN + 2 * o + sh;
    const c = cv.getContext('2d');
    const paint = (dx, dy) => {
      let x = o + dx;
      for (const g of gl) {
        if (wide) {
          for (let r = 0; r < HG; r++) {
            const b = g.rows[r]; if (!b) continue;
            for (let cx = 0; cx < g.w; cx++) if (b & (0x8000 >> cx)) { let n = 1; while (cx + n < g.w && b & (0x8000 >> (cx + n))) n++; c.fillRect(x + cx, o + r + dy, n + fat, 1); cx += n; }
          }
        } else for (let r = 0; r < LINE; r++) {
          let b = g.bits[r], cx = 0;
          while (b) { if (b & 1) c.fillRect(x + cx, o + r + dy, 1, 1); b >>= 1; cx++; }
        }
        x += g.w + gap;
      }
    };
    if (shadow) {
      c.fillStyle = shadow;
      paint(1, 1);
      if (outline) for (const d of DIRS) paint(d[0] + 1, d[1] + 1);
    }
    if (outline) { c.fillStyle = outline; for (const d of DIRS) paint(d[0], d[1]); }
    c.fillStyle = color;
    paint(0, 0);
    return remember(key, { cv, w, o, wide });
  }

  const NOOPT = {};

  // (x, y) 는 글자 윗변(라틴 대문자·한글 잉크의 위쪽) 기준. s 는 HUD(라틴) 배율이고, 한글 문자열은 hgScale(s) 로 찍힌다.
  function text(ctx, str, x, y, s, color, opts) {
    str = String(str);
    if (!str.length) return 0;
    s = Math.max(1, Math.round(s || 1));
    const op = opts || NOOPT;
    const e = run(str, color || '#ffffff', op.shadow || '', op.outline || '', op.thin);
    const k = e.wide ? hgScale(s) : s;
    const wpx = e.w * k;
    let dx = x;
    if (op.align === 'c') dx = x - wpx / 2; else if (op.align === 'r') dx = x - wpx;
    dx = Math.round(dx); const dy = Math.round(y) - (e.wide ? HG_TOP * k : 0);
    const a = op.alpha === undefined ? 1 : op.alpha;
    if (a <= 0) return wpx;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingEnabled = false;
    const ga = ctx.globalAlpha;
    if (a < 1) ctx.globalAlpha = ga * a;
    ctx.drawImage(e.cv, dx - e.o * k, dy - e.o * k, e.cv.width * k, e.cv.height * k);
    if (a < 1) ctx.globalAlpha = ga;
    return wpx;
  }

  const PAL = {
    G: '#e8b04a', g: '#a8742a', Y: '#ffe2a0',
    B: '#e9dfc8', b: '#b9ad93',
    E: '#ff8a3c', e: '#c9481e', d: '#7a2a14',
    C: '#8fc7ff', c: '#4f86c6',
    S: '#9aa3b0', s: '#5b6472', k: '#353b49',
    W: '#8a6a48', w: '#5a4330',
    o: '#0b0d14',
  };

  const ICONS = {
    coin: [
      '..oooo..',
      '.oYYGGo.',
      'oYGGGGgo',
      'oYGgGGgo',
      'oGGgGGgo',
      'oGGGGggo',
      '.oGgggo.',
      '..oooo..',
    ],
    flame: [
      '....o...',
      '...oEo..',
      '...oEEo.',
      '..oEEEo.',
      '.oEEYEEo',
      'oEEYYEEo',
      'oEYYYYEo',
      'oeEYYEeo',
      '.oeEEeo.',
      '..oooo..',
    ],
    slain: [
      'B.......B',
      'sB.....Bs',
      '.sB...Bs.',
      '..sB.Bs..',
      '...sBs...',
      '.G.BsB.G.',
      '..GB.sG..',
      '..WG.GW..',
      '.W.....W.',
    ],
    banner: [
      'S.......',
      'Wddddddd',
      'WeEEEEEe',
      'WeEEYEEe',
      'WeEYEYEe',
      'WeEEYEEe',
      'WeEEEEEe',
      'WeEe.eEe',
      'Wed...de',
      'W.......',
    ],
    hourglass: [
      'WWWWWWW',
      '.S...S.',
      '.SGGGS.',
      '..SGS..',
      '...S...',
      '..SGS..',
      '.S.G.S.',
      '.SGGGS.',
      'WWWWWWW',
    ],
    sound: [
      '...B......',
      '..BB...G..',
      'BBBB....G.',
      'BBBB.G..G.',
      'BBBB.G..G.',
      'BBBB....G.',
      '..bb...G..',
      '...b......',
    ],
    mute: [
      '...B......',
      '..BB......',
      'BBBB.e..e.',
      'BBBB..ee..',
      'BBBB..ee..',
      'BBBB.e..e.',
      '..bb......',
      '...b......',
    ],
    archer: [
      '...WW........',
      '...bWWW......',
      '...b..WW.....',
      '...b...WW....',
      '...b....W.E..',
      '...b....WEYE.',
      'bBSSSSSSSSYYE',
      '...b....WEYE.',
      '...b....W.E..',
      '...b...WW....',
      '...b..WW.....',
      '...bWWW......',
      '...WW........',
    ],
    bombard: [
      '.............',
      '...........S.',
      '.........Sso.',
      '.......SSSso.',
      '.E...SSSSsks.',
      '.e.SSSSsssk..',
      '.SSSSssss....',
      'sSSssssww....',
      'sssssooowww..',
      '.sswoWWWowww.',
      '...woWSWowww.',
      '....oWWWo....',
      '.....ooo.....',
    ],
    spire: [
      '....WW.......',
      '..WWWWb......',
      '.YWWWW.....C.',
      '....WW....CC.',
      '....w....CC..',
      '....w...CCCC.',
      '...ewG....Cc.',
      '....w....Cc..',
      '....w....c...',
      '....w........',
      '...sws.......',
      '..sSsSk......',
      '..sssskk.....',
    ],
    pocha: [
      '..........S..',
      '.........W.E.',
      '........W....',
      '.......W.....',
      '..W...W......',
      '..WW.W.......',
      '...WWW.......',
      '..w.WWW......',
      '.w..w.sSs....',
      '.w..w.sss....',
      'WWWWWWWWWWW..',
      'wwwwwwwwwww..',
      '.oo.....oo...',
    ],
    guard: [
      '..........oB.',
      '.sssssss.oBBo',
      '.sCCCCCCoBBo.',
      '.sCCCCCoBBo..',
      '.sCCccoBBo.s.',
      '.sCCcoBBocCs.',
      '.sCo.BBocCCs.',
      '.sGGoBocCCCs.',
      '..GGGocCCCs..',
      '.oGoGGoCCCs..',
      'oGo.sGocCs...',
      '.o...sscs....',
      '......ss.....',
    ],
    upgrade: [
      '....Y....',
      '...YGG...',
      '..YG.GG..',
      '.YG...GG.',
      '....G....',
      '...GGg...',
      '..GG.gg..',
      '.GG...gg.',
      '.........',
    ],
    sell: [
      '..ooooo..',
      '.oYYGGGo.',
      '.oYGgGGo.',
      '.oGGgGgo.',
      '.oGGGggo.',
      '..ooooo..',
      '..EEEEE..',
      '...EeE...',
      '....e....',
    ],
    helm: [
      '....E....',
      '..SSSSS..',
      '.SBSSSSs.',
      '.SSSSSSs.',
      '.SooSoos.',
      '.SS.S.ss.',
      '.SS.S.ss.',
      '..S...s..',
    ],
    hand: [
      '...oo....',
      '..oBBo...',
      '..oBBo...',
      '..oBBooo.',
      '..oBBbBbo',
      'ooBBBbBbo',
      'oBBBBBBBo',
      '.oBBBBbo.',
      '..ooooo..',
    ],
    star: [
      '..Y..',
      'YGGGG',
      '.GGG.',
      'GG.Gg',
      'G...g',
    ],
    starEmpty: [
      '..s..',
      'sssss',
      '.sss.',
      'ss.ss',
      's...s',
    ],
  };

  const iconMeta = {};
  for (const name in ICONS) {
    const rows = ICONS[name];
    let w = 0;
    for (const r of rows) if (r.length > w) w = r.length;
    iconMeta[name] = [w, rows.length];
  }

  function iconCanvas(name) {
    const key = 'i\u0001' + name;
    const hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
    const rows = ICONS[name], m = iconMeta[name];
    const cv = document.createElement('canvas');
    cv.width = m[0]; cv.height = m[1];
    const c = cv.getContext('2d');
    for (let y = 0; y < rows.length; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const col = PAL[r[x]];
        if (col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
      }
    }
    return remember(key, { cv });
  }

  function icon(ctx, name, x, y, s, alpha) {
    if (!ICONS[name]) return;
    const a = alpha === undefined ? 1 : alpha;
    if (a <= 0) return;
    s = Math.max(1, Math.round(s || 1));
    const e = iconCanvas(name);
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingEnabled = false;
    const ga = ctx.globalAlpha;
    if (a < 1) ctx.globalAlpha = ga * a;
    ctx.drawImage(e.cv, Math.round(x), Math.round(y), e.cv.width * s, e.cv.height * s);
    if (a < 1) ctx.globalAlpha = ga;
  }

  function iconSize(name) {
    const m = iconMeta[name];
    return m ? [m[0], m[1]] : [0, 0];
  }

  return { LINE, CAP, measure, text, icon, iconSize, isWide, hgScale, icons: Object.keys(ICONS), palette: PAL };
})();
