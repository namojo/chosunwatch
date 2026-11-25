
const UI = (() => {
  const U = {
    ctx: null, s: 3, insetTop: 0, goldShown: 0, hurt: 0, coins: [], msg: null, hover: null, menu: null, armed: null, idle: 99, mx: -1, my: -1, inside: false,
    btns: [], hotBtn: null, press: null, gp: { sel: -1, t: 0, prev: [] , active: false }, goldBump: 0, deny: 0, hintT: 0, titleT: 0, rangeMesh: null, padMesh: null, soundRect: null, cmdRect: null, manual: false, moved: 99, focus: 0, slainBump: 0, lastSlain: 0,
    touch: false, ptrs: new Map(), gest: null, lastTap: { t: -9, x: 0, y: 0 }, waveRect: null, followRect: null, menuRect: null, wake: null, panning: false,
    hud: [], tips: [], tip: null, keys: new Set(), sndArmed: false, vvT: 0, vvN: 0,
  };
  const COLR = { bg: 'rgba(9,11,17,0.86)', bg2: 'rgba(24,27,38,0.94)', bd: '#5d4c35', bdHi: '#e8b04a', tx: '#efe4cd', dim: '#a79e8a', amber: '#e8b04a', ember: '#ff8a3c', cold: '#8fc7ff', red: '#e5553c', dark: '#0b0d14', ok: '#9fd08a' };
  const _pv = new THREE.Vector3(), _o = new THREE.Vector3(), _d = new THREE.Vector3();
  function proj(x, y, z) { _pv.set(x, y, z).project(R.cam); return { x: (_pv.x * .5 + .5) * R.dw, y: (1 - (_pv.y * .5 + .5)) * R.dh }; }
  U.proj = proj;
  U.playerActive = () => U.manual;
  U.setManual = on => { U.manual = !!on; if (!on) { U.menu = null; U.armed = null; } };
  // 배너. 전장이 솟아오르는 동안(phase 'rise')에는 '612년 · 살수대첩' 아래에 그 전장의 사기 한 줄(bio.lore)을 덧붙이고 더 오래 띄운다.
  U.banner = (text, dur, big) => {
    const bio = G.phase === 'rise' && G.B ? G.B.bio : null, sub = bio && bio.lore ? bio.lore : '';
    U.msg = { text, t: 0, dur: sub ? Math.max(dur, 6.4) : dur, big, sub, era: !!bio };
  };
  U.ping = (x, y, z, byPlayer) => { fxTimed(4, x, y + .12, z, 5, 5, byPlayer ? 1.0 : 1.5, byPlayer ? 1.4 : 1.1, byPlayer ? 1.8 : .5, .7, .55, { ground: true }); };
  U.closeMenu = () => { U.menu = null; U.armed = null; };
  U.coinFrom = (x, y, z, value) => {
    if (U.coins.length > 70) { U.goldShown += value; return; }
    const p = proj(x, y, z); U.coins.push({ sx: p.x, sy: p.y, t: 0, T: rr(.55, .8), value, cx: p.x + rr(-60, 60) * U.s, cy: p.y - rr(30, 70) * U.s });
  };

  function plate(x, y, w, h, o = {}) {
    const c = U.ctx, s = U.s; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    c.fillStyle = o.bd || COLR.bd; c.fillRect(x + s, y, w - 2 * s, h); c.fillRect(x, y + s, w, h - 2 * s);
    c.fillStyle = o.bg || COLR.bg; c.fillRect(x + 2 * s, y + s, w - 4 * s, h - 2 * s); c.fillRect(x + s, y + 2 * s, w - 2 * s, h - 4 * s);
    if (o.hi) { c.fillStyle = o.hi; c.fillRect(x + 2 * s, y + s, w - 4 * s, s); }
    if (o.era) { const e = eraCss(); c.fillStyle = e.main; c.fillRect(x + 2 * s, y + s, w - 4 * s, s); c.fillStyle = e.trim; c.fillRect(x + 2 * s, y + s, 2 * s, s); c.fillRect(x + w - 4 * s, y + s, 2 * s, s); }
  }
  // 시대색 강조선: 수비 측(고구려 주홍·고려 비취·조선 쪽빛)의 주색과 장식색. 어두운 판 위에서 보이도록 주색은 조금 밝힌다.
  const _era = {};
  function eraCss() {
    const k = curEra(); if (_era[k]) return _era[k];
    const css = (n, m) => 'rgb(' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.min(255, Math.round(v * m + 14))).join(',') + ')', e = ERA[k];
    return _era[k] = { main: css(e.main, 1.35), trim: css(e.trim, 1) };
  }
  function text(str, x, y, col, o) { return PX.text(U.ctx, str, x, y, U.s, col || COLR.tx, o); }
  const tw = str => PX.measure(str, U.s) * U.s;

  function initUI() {
    const cv = document.getElementById('hud'); U.ctx = cv.getContext('2d'); U.ctx.imageSmoothingEnabled = false;
    const mk = (seg, col) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((seg + 1) * 6), 3)); const idx = [];
      for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.visible = false; m.renderOrder = 6; m.seg = seg; R.scene.add(m); return m;
    };
    U.rangeMesh = mk(96, new THREE.Color(1.5, 1.15, .6)); U.padMesh = mk(40, new THREE.Color(2.2, 1.7, .9));
    U.coarse = U.touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const D = () => R.dpr || 1, pos = e => [e.clientX * D(), e.clientY * D()];
    window.addEventListener('pointerdown', e => {
      const [x, y] = pos(e); U.touch = e.pointerType !== 'mouse'; U.mx = x; U.my = y; U.inside = true; U.gp.active = false; U.moved = 0;
      U.ptrs.set(e.pointerId, { x, y, x0: x, y0: y });
      audioGesture();
      CAM.za = null;
      if (U.ptrs.size === 1) { const b = btnAt(x, y); U.gest = { mode: 'tap', hud: !!b || hudAt(x, y), btn: b }; U.press = b ? b.id : null; }
      else if (U.ptrs.size === 2) { const [a, b] = [...U.ptrs.values()]; U.gest = { mode: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; U.press = null; }
      e.preventDefault();
    }, { passive: false });
    window.addEventListener('pointermove', e => {
      const [x, y] = pos(e), p = U.ptrs.get(e.pointerId);
      if (e.pointerType === 'mouse' || p) { U.mx = x; U.my = y; U.inside = true; U.moved = 0; U.gp.active = false; }
      if (!p) return;
      const g = U.gest;
      if (g && g.mode === 'pinch' && U.ptrs.size >= 2) {
        p.x = x; p.y = y; const [a, b] = [...U.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        camPan(cx - g.cx, cy - g.cy); camZoomAt(d / g.d, cx, cy); g.d = d; g.cx = cx; g.cy = cy; return;
      }
      if (g && g.mode === 'tap' && !g.hud && Math.hypot(x - p.x0, y - p.y0) > (U.touch ? 10 : 6) * D()) { g.mode = 'pan'; U.press = null; }
      if (g && g.mode === 'pan') camPan(x - p.x, y - p.y);
      p.x = x; p.y = y;
    });
    const up = e => {
      const p = U.ptrs.get(e.pointerId); if (!p) return; U.ptrs.delete(e.pointerId); audioGesture(); U.keepAwake();
      const g = U.gest;
      if (U.ptrs.size === 0) { if (g && g.mode === 'tap' && e.type === 'pointerup') onTap(p.x, p.y, g.btn); U.gest = null; U.press = null; if (U.touch) U.inside = false; }
      else if (g && g.mode === 'pinch') U.gest = { mode: 'pan' };
    };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    window.addEventListener('pointerleave', () => { if (!U.ptrs.size) U.inside = false; });
    document.addEventListener('mouseleave', () => { if (!U.ptrs.size) U.inside = false; });
    window.addEventListener('wheel', e => { const [x, y] = pos(e), d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; camZoomTo(camZoomNow() * Math.exp(-clamp(d, -160, 160) * (e.ctrlKey ? .012 : .0024)), x, y, 16); e.preventDefault(); }, { passive: false });
    const stop = e => { if (e.cancelable) e.preventDefault(); };
    for (const ev of ['touchmove', 'touchcancel', 'dblclick', 'gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, stop, { passive: false });
    document.addEventListener('touchstart', e => {
      stop(e); const n = e.touches.length;
      if (n < U.ptrs.size) { const keys = [...U.ptrs.keys()]; for (let i = 0; i < keys.length - n; i++) U.ptrs.delete(keys[i]); if (U.ptrs.size <= 1) { const p = [...U.ptrs.values()][0]; U.gest = p ? { mode: 'tap', hud: !!btnAt(p.x, p.y) || hudAt(p.x, p.y) } : null; } }
    }, { passive: false });
    document.addEventListener('touchend', e => { audioGesture(); stop(e); if (!e.touches.length && U.ptrs.size) setTimeout(() => { if (U.ptrs.size) U.dropTouches(); }, 80); }, { passive: false });
    if (window.visualViewport) for (const ev of ['resize', 'scroll']) window.visualViewport.addEventListener(ev, fixPageZoom);
    try { if (localStorage.getItem('chosunwatch.muted') === '1') AU.muted = true; G.best = +localStorage.getItem('chosunwatch.best') || 0; } catch (e) {}
    window.addEventListener('keyup', e => { U.keys.delete(e.code); });
    window.addEventListener('blur', () => U.keys.clear());
    window.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      if (PAN[e.code] && !e.ctrlKey && !e.metaKey && !e.altKey) { U.keys.add(e.code); e.preventDefault(); }
      if (e.repeat) return; audioGesture(); U.keepAwake(); U.touch = false;
      const k = e.key;
      if (k >= '1' && k <= '4') { pickKind(TOWER_KINDS[+k - 1]); e.preventDefault(); }
      else if (k === ' ' || k === 'Enter') { callWave(); e.preventDefault(); }
      else if (k === 'Escape') { U.closeMenu(); }
      else if (k === 'u' || k === 'U') { const t = (U.menu && U.menu.tower) || (U.hover && U.hover.tower); if (t) { touchInput(); doUpgrade(t); } }
      else if (k === 'x' || k === 'X' || k === 'Delete' || k === 'Backspace') { const t = U.menu && U.menu.tower; if (t) { touchInput(); if (U.menu.sellArm) doSell(t); else { U.menu.sellArm = true; sfx('uiHover', t.x, t.z, .8); } } }
      else if (k === 'p' || k === 'P') { togglePause(); }
      else if (k === 'Tab') { cycleSpeed(); e.preventDefault(); }
      else if (k === '0') { camReset(); }
      else if (k === 'm' || k === 'M') { setMute(!AU.muted); }
      else if (k === '+' || k === '=') { camZoomBy(1.4); }
      else if (k === '-' || k === '_') { camZoomBy(1 / 1.4); }
      else if (k === 'c' || k === 'C') { toggleCommand(); }
      else if (k === 'f' || k === 'F' || k === 'Home') { camReset(); }
    });
  }
  const PAN = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], KeyA: [1, 0], KeyD: [-1, 0], KeyW: [0, 1], KeyS: [0, -1] };
  function togglePause() { G.paused = !G.paused; sfx('uiClick', CAM.x, CAM.z, .6); }
  function cycleSpeed() { G.speed = G.speed % 3 + 1; if (G.paused) G.paused = false; sfx('uiClick', CAM.x, CAM.z, .6); }
  function soundTap() { if (AU.ready && U.sndArmed) setMute(!AU.muted); }
  U.sawMonster = type => { if (G.seen[type]) return; G.seen[type] = 1; if (monTip(type) && U.tips.length < 4) U.tips.push(type); };
  U.keepAwake = () => { try { if (navigator.wakeLock && !document.hidden && (!U.wake || U.wake.released)) navigator.wakeLock.request('screen').then(w => { U.wake = w; }, () => {}); } catch (e) {} };
  U.dropTouches = () => { U.ptrs.clear(); U.gest = null; U.press = null; if (U.touch) U.inside = false; };
  function fixPageZoom() {
    const vv = window.visualViewport, m = document.getElementById('vp'); if (!vv || !m || Math.abs(vv.scale - 1) < .02) { U.vvN = 0; return; }
    const now = performance.now(); if (now - U.vvT < 250 || U.vvN > 12) return; U.vvT = now; U.vvN++;
    const c = 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    m.setAttribute('content', c + ',shrink-to-fit=no'); setTimeout(() => { m.setAttribute('content', c); try { window.scrollTo(0, 0); } catch (e) {} resizeRenderer(); }, 40);
  }
  function setMute(b) { AU.setMuted(b); try { localStorage.setItem('chosunwatch.muted', b ? '1' : '0'); } catch (e) {} }
  function fullscreenOK() { const d = document; return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !(window.navigator.standalone); }
  function isFull() { const d = document; return !!(d.fullscreenElement || d.webkitFullscreenElement); }
  function toggleFull() {
    const d = document, el = d.documentElement;
    try { if (isFull()) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } } catch (e) {}
  }
  function buzz(p) { if (U.touch && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
  function inRect(r, x, y, min = 0) {
    if (!r) return false; const m = min * (R.dpr || 1), mw = Math.max(0, m - r.w) / 2, mh = Math.max(0, m - r.h) / 2;
    return x >= r.x - mw && x <= r.x + r.w + mw && y >= r.y - mh && y <= r.y + r.h + mh;
  }
  function btnAt(x, y) { const m = U.touch ? 44 : 0; for (const b of U.btns) if (inRect(b, x, y, m)) return b; for (const b of U.hud) if (inRect(b, x, y, m)) return b; return null; }
  function hudAt(x, y) { return inRect(U.menuRect, x, y, 0); }
  function callWave() { touchInput(); if (callWaveEarly()) { sfx('uiClick', CAM.x, CAM.z, .8); buzz(10); } else sfx('uiDeny', CAM.x, CAM.z, .5); }
  function audioGesture() { if (!AU.ready) AU.unlock(); }
  function touchInput() { U.idle = 0; U.manual = true; }
  function toggleCommand() { U.setManual(!U.manual); U.idle = 0; sfx('uiClick', CAM.x, CAM.z, .8); }
  function deny() { U.deny = 1; sfx('uiDeny', CAM.x, CAM.z, .6); buzz([18, 40, 18]); }
  function doBuild(pad, kind) { touchInput(); if (buildTower(pad, kind, true)) { sfx('uiClick', pad.x, pad.z, .8); buzz(12); U.menu = null; U.armed = null; return true; } deny(); return false; }
  function doUpgrade(t) { if (upgradeTower(t, true)) { sfx('uiClick', t.x, t.z, .8); buzz(12); U.menu = null; return true; } deny(); return false; }
  function doSell(t) { if (sellTower(t)) { U.menu = null; return true; } return false; }
  function pickKind(kind) {
    touchInput();
    if (U.menu && U.menu.pad && !U.menu.pad.tower) { doBuild(U.menu.pad, kind); return; }
    if (U.hover && !U.hover.tower) { doBuild(U.hover.pad, kind); return; }
    if (U.gp.active && U.gp.sel >= 0 && !G.B.pads[U.gp.sel].tower) { doBuild(G.B.pads[U.gp.sel], kind); return; }
    U.armed = U.armed === kind ? null : kind; U.menu = null; sfx('uiHover', CAM.x, CAM.z, .7);
  }
  function pickPad(mx, my) {
    if (!G.B || G.phase !== 'play') return null;
    const cam = R.cam; _o.set(mx / R.dw * 2 - 1, 1 - my / R.dh * 2, -1).unproject(cam); cam.getWorldDirection(_d);
    let best = null, bd = 1e9; const slop = U.touch ? clamp(24 * (R.viewW || 40) / (R.cssW || 800), 1.55, 2.3) : 1.55;
    for (const pad of G.B.pads) {
      const top = pad.tower ? Math.min(3.4, pad.tower.mounts ? pad.tower.mounts.top : 2) : .1;
      for (let h = 0; h <= top; h += .6) {
        const t = (pad.y + h - _o.y) / _d.y, x = _o.x + _d.x * t, z = _o.z + _d.z * t, d = Math.hypot(x - pad.x, z - pad.z), r = h === 0 ? slop : slop - .55;
        if (d < r && d + h * .01 < bd) { bd = d; best = pad; }
      }
    }
    return best ? { pad: best, tower: best.tower } : null;
  }
  function onTap(x, y, held) {
    const now = performance.now();
    const b = held && inRect(held, x, y, U.touch ? 44 : 8) ? held : btnAt(x, y); if (b) { if (!b.hud) touchInput(); b.fn(); return; }
    if (inRect(U.menuRect, x, y, 0)) return;
    const h = pickPad(x, y);
    if (h) {
      touchInput(); U.lastTap.t = -9;
      if (!h.tower && U.armed) { doBuild(h.pad, U.armed); return; }
      if (U.menu && U.menu.pad === h.pad) { U.menu = null; return; }
      U.menu = { pad: h.pad, tower: h.tower, t: 0, focus: 0, sel: null, sellArm: false }; U.armed = null; sfx('uiHover', h.pad.x, h.pad.z, .9); buzz(6); return;
    }
    if (U.menu || U.armed) { U.menu = null; U.armed = null; U.lastTap.t = -9; return; }
    if (now - U.lastTap.t < 330 && Math.hypot(x - U.lastTap.x, y - U.lastTap.y) < 40 * (R.dpr || 1)) { U.lastTap.t = -9; if (CAM.man && CAM.mzoom > 1.3) camReset(); else camZoomTo(Math.max(1.9, (CAM.man ? CAM.mzoom : CAM.zoom) * 1.6), x, y); }
    else { U.lastTap.t = now; U.lastTap.x = x; U.lastTap.y = y; }
  }
  function setRing(mesh, cx, cz, radius, width) {
    const P = mesh.geometry.attributes.position, a = P.array, H = G.B.heightAt, n = mesh.seg;
    for (let i = 0; i <= n; i++) { const t = i / n * TAU, c = Math.cos(t), s = Math.sin(t); for (let k = 0; k < 2; k++) { const r = radius + (k ? width : 0), x = cx + c * r, z = cz + s * r, o = (i * 2 + k) * 3; a[o] = x; a[o + 1] = H(x, z) + .1; a[o + 2] = z; } }
    P.needsUpdate = true; mesh.visible = true;
  }
  function pollGamepad(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; let gp = null; for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp || !G.B || G.phase !== 'play') return;
    const st = U.gp, b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), was = i => !!st.prev[i], hit = i => b(i) && !was(i);
    let ax = (Math.abs(gp.axes[0]) > .5 ? Math.sign(gp.axes[0]) : 0) + (b(15) ? 1 : 0) - (b(14) ? 1 : 0), ay = (Math.abs(gp.axes[1]) > .5 ? Math.sign(gp.axes[1]) : 0) + (b(13) ? 1 : 0) - (b(12) ? 1 : 0);
    st.t -= dt;
    if ((ax || ay) && st.t <= 0) {
      st.t = .22; st.active = true; touchInput(); audioGesture();
      if (U.menu) { const n = U.btns.length || 1; U.menu.focus = ((U.menu.focus + (ax || ay)) % n + n) % n; sfx('uiHover', CAM.x, CAM.z, .6); }
      else {
        const P = G.B.pads; if (st.sel < 0) st.sel = 0; const cur = proj(P[st.sel].x, P[st.sel].y, P[st.sel].z); let best = -1, bs = 1e9;
        P.forEach((p, i) => { if (i === st.sel) return; const q = proj(p.x, p.y, p.z), dx = q.x - cur.x, dy = q.y - cur.y, along = dx * ax + dy * ay; if (along <= 4) return; const off = Math.abs(-dx * ay + dy * ax), sc = along + off * 2.2; if (sc < bs) { bs = sc; best = i; } });
        if (best >= 0) { st.sel = best; sfx('uiHover', CAM.x, CAM.z, .6); }
      }
    }
    if (!ax && !ay) st.t = 0;
    if (hit(0)) { touchInput(); audioGesture(); st.active = true; if (st.sel < 0) st.sel = 0; if (U.menu) { const bt = U.btns[U.menu.focus]; if (bt) bt.fn(); } else { const pad = G.B.pads[st.sel]; U.menu = { pad, tower: pad.tower, t: 0, focus: 0, sel: null, sellArm: false }; sfx('uiHover', pad.x, pad.z, .9); } }
    if (hit(1)) { U.closeMenu(); touchInput(); }
    if (hit(2)) { const pad = st.sel >= 0 ? G.B.pads[st.sel] : null; if (pad && pad.tower) { touchInput(); doUpgrade(pad.tower); } }
    if (hit(3) || hit(9)) callWave();
    for (let i = 0; i < 16; i++) st.prev[i] = b(i);
  }

  function update(dt) {
    U.idle += dt; U.moved += dt; U.hurt = Math.max(0, U.hurt - dt * 1.6); U.goldBump = Math.max(0, U.goldBump - dt * 5); U.deny = Math.max(0, U.deny - dt * 3); U.titleT += dt; U.slainBump = Math.max(0, U.slainBump - dt * 4);
    if (G.slain !== U.lastSlain) { U.lastSlain = G.slain; U.slainBump = 1; }
    // HUD 배율. 한글은 16px 격자를 배율의 절반으로 찍으므로(PX.hgScale) 배율은 항상 짝수(2k)로 잡아 픽셀이 뭉개지지 않게 한다.
    // 손가락으로 쓰는 화면은 글자가 작아지지 않도록 올림 쪽으로 기울이고, 가장 넓은 고정 판(건설 메뉴 네 칸)이 들어갈 때까지만 줄인다.
    { const dpr = R.dpr || 1, f = clamp(Math.min(R.cssH / 430, R.cssW / 225), 1.6, 4) * dpr, need = 4 * 31 + 3 * 3 + 12 + 8;
      let k = Math.max(1, Math.round(f / 2 + (U.coarse ? .2 : 0)));
      while (k > 1 && need * 2 * k + R.safe[0] + R.safe[2] > R.dw) k--;
      U.s = 2 * k; }
    U.panning = !!(U.gest && U.gest.mode === 'pan');
    if (AU.ready && !U.ptrs.size) U.sndArmed = true;
    if (U.keys.size) { let kx = 0, ky = 0; for (const k of U.keys) { kx += PAN[k][0]; ky += PAN[k][1]; } if (kx || ky) { CAM.za = null; camPan(kx * R.dh * .9 * dt, ky * R.dh * .9 * dt); } }
    if (U.tip) { U.tip.t += dt; if (U.tip.t > 5.2) U.tip = null; } else if (U.tips.length && U.titleT > 9.5) U.tip = { type: U.tips.shift(), t: 0 };
    if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > .02) fixPageZoom();
    pollGamepad(dt);
    if (U.menu) { U.menu.t += dt; if ((U.menu.tower && !U.menu.tower.alive) || G.phase !== 'play') U.menu = null; else if (U.menu.pad.tower !== U.menu.tower) U.menu.tower = U.menu.pad.tower; }
    if (G.phase !== 'play') { U.armed = null; U.hover = null; }
    else U.hover = (U.inside && !U.touch && !U.hotBtn && !U.panning) ? pickPad(U.mx, U.my) : null;
    if (U.goldShown > G.gold) U.goldShown = G.gold;
    if (!U.coins.length && U.goldShown < G.gold) U.goldShown = Math.min(G.gold, U.goldShown + Math.max(1, (G.gold - U.goldShown) * 6 * dt));
    const tgt = U.menu ? U.menu : (U.gp.active && U.gp.sel >= 0 && G.phase === 'play' ? { pad: G.B.pads[U.gp.sel], tower: G.B.pads[U.gp.sel].tower } : U.hover);
    if (tgt && G.B && G.phase === 'play') {
      const pad = tgt.pad, pulse = .5 + .5 * Math.sin(G.t * 5);
      setRing(U.padMesh, pad.x, pad.z, 1.5, .1); U.padMesh.material.opacity = .45 + .25 * pulse;
      let range = 0; if (tgt.tower) range = tgt.tower.range; else { const kind = (U.menu && (U.menu.sel || (U.hotBtn && U.hotBtn.kind))) || U.armed || (U.menu && U.btns[U.menu.focus] && U.gp.active && U.btns[U.menu.focus].kind) || 'archer'; range = TOWER[kind].range[0]; }
      setRing(U.rangeMesh, pad.x, pad.z, range, .07); U.rangeMesh.material.opacity = .34;
    } else { U.padMesh.visible = false; U.rangeMesh.visible = false; }
    R.canvas.style.cursor = U.panning ? 'grabbing' : (U.hotBtn || U.hover || U.hudHot) ? 'pointer' : 'default';
  }

  // 어절 단위 줄바꿈. 한 어절이 줄 폭보다 길면 글자 단위로 끊는다. 여러 줄이면 줄 길이가 고르게 되도록 폭을 좁혀 본다.
  const _wrapMemo = new Map();
  function wrapRaw(str, maxW) {
    const out = []; let cur = '';
    for (const wd of String(str).split(' ')) {
      const t = cur ? cur + ' ' + wd : wd;
      if (tw(t) <= maxW) { cur = t; continue; }
      if (cur) { out.push(cur); cur = ''; }
      for (const ch of wd) { if (cur && tw(cur + ch) > maxW) { out.push(cur); cur = ch; } else cur += ch; }
    }
    if (cur) out.push(cur);
    return out;
  }
  function wrap(str, maxW) {
    const key = U.s + '|' + Math.round(maxW) + '|' + str, hit = _wrapMemo.get(key); if (hit) return hit;
    let best = wrapRaw(str, maxW);
    if (best.length > 1) for (let w = maxW - 4 * U.s; w > maxW * .45; w -= 4 * U.s) { const l = wrapRaw(str, w); if (l.length > best.length) break; best = l; }
    if (_wrapMemo.size > 80) _wrapMemo.clear();
    _wrapMemo.set(key, best); return best;
  }

  function draw() {
    const c = U.ctx, s = U.s, W = R.dw, H = R.dh, pad = 5 * s, LH = PX.LINE * s;
    c.clearRect(0, 0, W, H); U.btns.length = 0; let hot = null;
    const pix = Math.max(1, Math.round(R.dh / R.ih));
    for (const b of G.hbars) {
      const p = proj(b.x, b.y, b.z), w = (b.boss ? 34 : b.man ? 8 : 9) * pix, h = (b.boss ? 2 : 1) * pix, x = Math.round(p.x - w / 2), y = Math.round(p.y);
      if (x < -w || x > W || y < 0 || y > H) continue;
      c.globalAlpha = b.f >= .999 ? .4 : .95;
      c.fillStyle = COLR.dark; c.fillRect(x - pix, y - pix, w + 2 * pix, h + 2 * pix);
      c.fillStyle = b.man ? '#7fb6ea' : (b.f > .5 ? '#d9a13c' : b.f > .25 ? '#e0762c' : '#e04a32'); c.fillRect(x, y, Math.max(pix, Math.round(w * b.f)), h);
      c.globalAlpha = 1;
      if (b.boss) text(b.name, p.x, y - LH - 2 * pix, COLR.tx, { align: 'c', outline: COLR.dark });
    }
    const [iL, iT, iR, iB] = R.safe, Wr = W - iR, Hb = H - iB, tch = U.touch, mouse = U.inside && !tch && !U.panning;
    const over = (x, y, w, h) => mouse && U.mx >= x && U.mx <= x + w && U.my >= y && U.my <= y + h;

    // ── 위쪽: 봉화·군자금·격퇴 / 공세 / 지휘 ──
    const stats = [['flame', '' + G.lives, U.hurt > 0 ? COLR.red : COLR.tx, '00'], ['coin', '' + Math.floor(U.goldShown), U.deny > 0 ? COLR.red : (U.goldBump > 0 ? '#ffe2a0' : COLR.tx), '000'], ['slain', '' + G.slain, U.slainBump > .5 ? '#ffffff' : COLR.tx, '000']];
    let wS = pad; for (const st of stats) wS += PX.iconSize(st[0])[0] * s + 2 * s + Math.max(tw(st[1]), tw(st[3])) + 6 * s; wS += pad - 6 * s;
    const hS = 10 * s + pad * 2 - 2 * s, x0 = 5 * s + iL, y0 = 5 * s + iT + U.insetTop;
    plate(x0, y0, wS, hS, U.hurt > 0 ? { bd: COLR.red } : {});
    let x = x0 + pad; const goldPos = { x: 0, y: 0 };
    for (const st of stats) {
      const [iw, ih] = PX.iconSize(st[0]); const iy = y0 + Math.round((hS - ih * s) / 2);
      PX.icon(c, st[0], x, iy, s, st[0] === 'flame' ? .55 + .45 * (G.lives / G.maxLives) : 1); if (st[0] === 'coin') { goldPos.x = x + iw * s / 2; goldPos.y = iy + ih * s / 2; }
      x += iw * s + 2 * s; text(st[1], x, y0 + Math.round((hS - LH) / 2) + s, st[2]); x += Math.max(tw(st[1]), tw(st[3])) + 6 * s;
    }
    const wn = '제' + Math.max(1, waveNumber()) + '파', callable = G.phase === 'play' && !G.spawning && !G.bossWave && G.nextIn > .4;
    let sub, frac = -1;
    if (G.phase === 'play') {
      if (!G.spawning && !G.bossWave && G.nextIn > 0) {
        const wr = U.waveRect, ask = callable && (tch || (wr && over(wr.x, wr.y, wr.w, wr.h)));
        sub = ask ? '공세 부르기 · +' + Math.round(G.nextIn * 3) : '다음 공세까지 ' + Math.ceil(G.nextIn); frac = 1 - G.nextIn / 6.5;
      } else sub = '남은 적 ' + (G.mons.length + G.queue.length);
    } else sub = G.phase === 'defeat' ? '불씨가 스러졌다' : G.phase === 'clear' ? '적장을 물리쳤다' : G.fell ? '처음부터 다시' : '다음 전장으로';
    const bw = PX.iconSize('banner')[0] * s, wW = Math.max(bw + 3 * s + tw(wn), tw(sub), tw('다음 공세까지 00'), tw('공세 부르기 · +00')) + pad * 2 + 4 * s, hW = LH * 2 + pad * 2 + s;
    const you = U.playerActive(), CT = ['군사가 지휘 중', '직접 지휘 중'], CS = ['터를 눌러 직접 지휘', tch ? '군사에게 맡기기' : '눌러서 군사에게 맡기기'], ct = CT[+you], cs = CS[+you];
    const ic = you ? 'hand' : 'helm', icw = PX.iconSize(ic)[0] * s, g3 = 3 * s;
    const cW = Math.max(PX.iconSize('helm')[0] * s + 3 * s + Math.max(tw(CT[0]), tw(CT[1])), tw(CS[0]), tw(CS[1])) + pad * 2 + 2 * s, xc = Wr - cW - 5 * s;
    // 폭이 모자라면 지휘 판은 둘째 줄 오른쪽으로, 공세 판은 그 왼쪽(또는 셋째 줄 가운데)으로 내려간다.
    let xw = Math.round((iL + Wr) / 2 - wW / 2), yc = y0, yw = y0;
    if (xc < x0 + wS + g3) yc = y0 + hS + g3;
    if (yc !== y0) { if (x0 + wW + g3 <= xc) { xw = x0; yw = yc; } else yw = yc + hW + g3; }
    else if (xw < x0 + wS + g3 || xw + wW > xc - g3) yw = y0 + hW + g3;
    const topH = Math.max(y0 + hS, yc + hW, yw + hW) - y0; R.hudTop = y0 + topH;
    U.hud.length = 0; U.hudHot = false;
    const hotW = callable && over(xw, yw, wW, hW); U.waveRect = callable ? { id: 'wave', x: xw, y: yw, w: wW, h: hW, hot: hotW, fn: callWave, hud: true } : null; if (callable) U.hud.push(U.waveRect); if (hotW) U.hudHot = true;
    plate(xw, yw, wW, hW, hotW ? { bd: COLR.bdHi, bg: COLR.bg2 } : callable && tch ? { bd: '#8a6a3a' } : {});
    const wcx = xw + wW / 2, tx0 = Math.round(wcx - (bw + 3 * s + tw(wn)) / 2);
    PX.icon(c, 'banner', tx0, yw + pad - s, s); text(wn, tx0 + bw + 3 * s, yw + pad, COLR.amber);
    text(sub, wcx, yw + pad + LH + s, callable && (tch || hotW) ? COLR.tx : COLR.dim, { align: 'c' });
    if (frac >= 0) { c.fillStyle = '#2a2620'; c.fillRect(xw + 3 * s, yw + hW - 3 * s, wW - 6 * s, s); c.fillStyle = COLR.amber; c.fillRect(xw + 3 * s, yw + hW - 3 * s, Math.round((wW - 6 * s) * sat(frac)), s); }
    const hotC = over(xc, yc, cW, hW); U.cmdRect = { id: 'cmd', x: xc, y: yc, w: cW, h: hW, hot: hotC, fn: toggleCommand, hud: true }; U.hud.push(U.cmdRect); if (hotC) U.hudHot = true;
    plate(xc, yc, cW, hW, hotC ? { bd: COLR.bdHi, bg: COLR.bg2 } : you ? { bd: COLR.bdHi } : {});
    PX.icon(c, ic, xc + pad, yc + pad - s, s); text(ct, xc + pad + icw + 3 * s, yc + pad, you ? COLR.amber : COLR.tx); text(cs, xc + pad, yc + pad + LH + s, COLR.dim);

    // ── 아래쪽 단추 ──
    const dpr = R.dpr || 1, hB = LH + pad * 2 - s, zb = tch ? Math.max(22 * s, Math.round(40 * dpr)) : hB, yB = Hb - zb - 5 * s; let tipB = null;
    const sq = (id, x, w, fn, tip, icon, on) => {
      const r = { id, x, y: yB, w, h: zb, fn, hud: true }, hot = over(x, yB, w, zb), down = U.press === id, dy = down ? s : 0; U.hud.push(r); if (hot) { U.hudHot = true; tipB = { x: x + w / 2, tip }; }
      plate(x, yB + dy, w, zb, hot || down ? { bd: COLR.bdHi, bg: COLR.bg2 } : on ? { bd: '#8a6a3a' } : {}); icon(x, yB + dy, hot || down); return r;
    };
    const glyph = (g, col) => (x, y) => { const k = Math.max(s, Math.floor(zb / 10)); PX.text(c, g, x + zb / 2, y + Math.round(zb / 2 - 3.5 * k), k, col, { align: 'c' }); };
    const label = (t, col) => (x, y) => { const k = Math.max(s, Math.floor(zb / 15)); PX.text(c, t, x + zb / 2, y + Math.round((zb - PX.LINE * k) / 2) + k, k, col, { align: 'c' }); };
    const bars = (x, y) => { const u = zb / 18; c.fillStyle = COLR.tx; if (G.paused) { for (let i = 0; i < 4; i++) c.fillRect(Math.round(x + (6.5 + i * 1.5) * u), Math.round(y + (5 + i) * u), Math.ceil(1.5 * u), Math.round((8 - 2 * i) * u)); } else { c.fillRect(Math.round(x + 6 * u), Math.round(y + 5 * u), Math.round(2.2 * u), Math.round(8 * u)); c.fillRect(Math.round(x + 9.8 * u), Math.round(y + 5 * u), Math.round(2.2 * u), Math.round(8 * u)); } };
    const corners = (x, y) => { const u = Math.round(zb / 9), q = Math.round(zb / 5), f = isFull(); c.fillStyle = COLR.tx; for (const [ax, ay] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const cx = x + (ax ? zb - q - u : q), cy = y + (ay ? zb - q - u : q), ix = f ? (ax ? -1 : 1) : (ax ? 1 : -1), iy = f ? (ay ? -1 : 1) : (ay ? 1 : -1); c.fillRect(cx, cy, u, u); c.fillRect(cx - ix * u, cy, u, u); c.fillRect(cx, cy - iy * u, u, u); } };
    const play = G.phase === 'play' || G.phase === 'defeat', nR = (fullscreenOK() && tch ? 3 : 2), rightW = nR * zb + (nR - 1) * g3;
    let xl = 5 * s + iL;
    sq('pause', xl, zb, togglePause, G.paused ? '계속 (P)' : '일시 정지 (P)', bars, G.paused); xl += zb + g3;
    sq('speed', xl, zb, cycleSpeed, '빠르기 (Tab)', label(G.speed + 'x', G.speed > 1 ? COLR.amber : COLR.tx), G.speed > 1); xl += zb + g3;
    { const on = AU.ready && !AU.muted, icn = on ? 'sound' : 'mute', k = Math.max(s, Math.floor(zb / 14)), [iw2, ih2] = PX.iconSize(icn), lbl = '눌러서 소리 켜기', wl = iw2 * s + 3 * s + tw(lbl) + pad * 2;
      const wide = !AU.ready && xl + wl + g3 + rightW + 5 * s + iR <= W;
      U.soundRect = sq('sound', xl, wide ? wl : zb, soundTap, AU.ready ? (AU.muted ? '소리 꺼짐 (M)' : '소리 켜짐 (M)') : '소리', (x, y) => { if (wide) { PX.icon(c, icn, x + pad, y + Math.round((zb - ih2 * s) / 2), s, .85); text(lbl, x + pad + iw2 * s + 3 * s, y + Math.round((zb - LH) / 2) + s, COLR.tx); } else PX.icon(c, icn, x + Math.round((zb - iw2 * k) / 2), y + Math.round((zb - ih2 * k) / 2), k, AU.ready ? 1 : .8); }, !AU.ready);
      xl += (wide ? wl : zb) + g3; }
    let xr = Wr - 5 * s - zb; const cur = camZoomNow();
    if (nR === 3) { sq('full', xr, zb, toggleFull, '전체 화면', corners, false); xr -= zb + g3; }
    sq('zin', xr, zb, () => camZoomBy(1.5), '확대 (+)', glyph('+', cur < 2.99 ? COLR.tx : '#5a5448'), false); xr -= zb + g3;
    sq('zout', xr, zb, () => camZoomBy(1 / 1.5), '축소 (-)', glyph('-', cur > camZoomMin() + .01 ? COLR.tx : '#5a5448'), false);
    let yUp = yB - g3;
    if (CAM.man && play) {
      const lbl = '전투 따라가기', w = tw(lbl) + pad * 2, fits = xr - g3 - w >= xl, xf2 = fits ? xr - g3 - w : Wr - w - 5 * s, yf = fits ? yB + Math.round((zb - hB) / 2) : yB - g3 - hB, hotF = over(xf2, yf, w, hB);
      plate(xf2, yf, w, hB, hotF ? { bd: COLR.bdHi, bg: COLR.bg2 } : { bd: '#8a6a3a' }); text(lbl, xf2 + pad, yf + pad, COLR.tx);
      U.followRect = { id: 'follow', x: xf2, y: yf, w, h: hB, hot: hotF, fn: () => { camReset(); sfx('uiClick', CAM.x, CAM.z, .6); }, hud: true }; U.hud.push(U.followRect); if (hotF) U.hudHot = true; if (!fits) yUp = yf - g3;
    } else U.followRect = null;
    if (tipB && !tch) { const w = tw(tipB.tip) + pad * 2, x = clamp(Math.round(tipB.x - w / 2), 4 * s + iL, Wr - w - 4 * s); plate(x, yB - g3 - hB, w, hB, { bd: COLR.bdHi }); text(tipB.tip, x + pad, yB - g3 - hB + pad, COLR.tx); yUp = Math.min(yUp, yB - g3 - hB - g3); }

    // ── 아래 가운데: 일시 정지, 새 적 알림, 조작 안내 ──
    const boxW = Wr - iL - 10 * s;
    if (G.paused) { const k = s + 2, t1 = '일시 정지', w = PX.measure(t1, k) * k + pad * 4, h = PX.LINE * k + pad * 2; plate(Math.round(W / 2 - w / 2), yUp - h, w, h, { bd: COLR.bdHi }); PX.text(c, t1, W / 2, yUp - h + pad + Math.round(k / 2), k, COLR.amber, { align: 'c' }); yUp -= h + g3; }
    if (U.tip && !U.menu) {
      const d = MON[U.tip.type], a = sat(Math.min(U.tip.t * 4, (5.2 - U.tip.t) * 2)), head = (d.boss ? '적장: ' : '새 적: ') + monName(U.tip.type), lines = wrap(monTip(U.tip.type), Math.min(boxW - pad * 2, 160 * s));
      let w = tw(head); for (const l of lines) w = Math.max(w, tw(l)); w += pad * 2; const h = LH * (lines.length + 1) + pad * 2 - s, x = Math.round((iL + Wr - w) / 2), y = yUp - h;
      c.globalAlpha = a; plate(x, y, w, h, { bd: d.boss ? COLR.ember : '#8a6a3a' }); text(head, x + w / 2, y + pad, COLR.amber, { align: 'c' }); lines.forEach((l, k) => text(l, x + w / 2, y + pad + s + (k + 1) * LH, COLR.tx, { align: 'c' })); c.globalAlpha = 1; yUp = y - g3;
    } else {
      const first = U.titleT < 18, a = tch ? sat(Math.min(U.titleT - 9.2, first ? 1 : 3 - U.moved, U.manual && !first ? 0 : 1, 64 - U.titleT)) : sat(Math.min(U.titleT - 9.2, 3 - Math.min(U.moved, U.idle > 20 ? U.moved : 0) + (U.titleT < 20 ? 8 : 0)));
      if (a > .02 && !U.menu && !G.paused) {
        const parts = tch ? ['터를 눌러 짓기', '끌어서 둘러보기', '벌리거나 두 번 눌러 확대'] : ['터를 눌러 짓기', '1~4 지을 것 고르기', '스페이스로 다음 공세 부르기', '휠로 확대, 끌어서 이동'];
        let lines = [parts.join(' · ')]; if (tw(lines[0]) + pad * 2 > boxW) { lines = parts.length > 3 ? [parts.slice(0, 2).join(' · '), parts.slice(2).join(' · ')] : parts; if (lines.some(l => tw(l) + pad * 2 > boxW)) lines = parts; }
        let w = 0; for (const l of lines) w = Math.max(w, tw(l)); w += pad * 2; const h = LH * lines.length + pad * 2 - s, hx = Math.round((iL + Wr - w) / 2), hy = yUp - h;
        if (w <= boxW) { c.globalAlpha = a; plate(hx, hy, w, h); lines.forEach((l, k) => text(l, hx + w / 2, hy + pad + k * LH, COLR.dim, { align: 'c' })); c.globalAlpha = 1; }
      }
    }
    for (let i = U.coins.length - 1; i >= 0; i--) {
      const q = U.coins[i]; q.t += R.frameDt; const u = sat(q.t / q.T), e = u * u * (3 - 2 * u), a = 1 - e;
      const px = a * a * q.sx + 2 * a * e * q.cx + e * e * goldPos.x, py = a * a * q.sy + 2 * a * e * q.cy + e * e * goldPos.y;
      PX.icon(c, 'coin', Math.round(px - 4 * s * .75), Math.round(py - 4 * s * .75), Math.max(2, s - 1), 1);
      if (u >= 1) { U.goldShown = Math.min(G.gold, U.goldShown + q.value); U.goldBump = 1; sfx('coin', CAM.x, CAM.z, .35, rnd()); U.coins.splice(i, 1); }
    }

    // ── 배너: 공세·승패. 전장이 솟아오를 때는 연도·전투 이름 아래 사기 한 줄(m.sub)과 시대색 선 ──
    if (U.msg) {
      const m = U.msg; m.t += R.frameDt; const a = sat(Math.min(m.t * 3, (m.dur - m.t) * 2));
      if (m.t >= m.dur) U.msg = null; else {
        const maxW = Wr - iL - 6 * s; let sc = s + (m.big ? 4 : 2); while (sc > s && PX.measure(m.text, sc) * sc + pad * 4 > maxW) sc -= 2;
        const subs = m.sub ? wrap(m.sub, Math.min(maxW - pad * 4, 136 * s)) : [];
        let w = PX.measure(m.text, sc) * sc; for (const l of subs) w = Math.max(w, tw(l)); w += pad * 4;
        const h = PX.LINE * sc + pad * 2 + (subs.length ? subs.length * LH + s : 0), xb = Math.round(W / 2 - w / 2), yb = Math.max(Math.round(H * .2), y0 + topH + 4 * s);
        c.globalAlpha = a; plate(xb, yb, w, h, { bd: m.big ? COLR.ember : COLR.bdHi, era: m.era });
        PX.text(c, m.text, W / 2, yb + pad + sc, sc, m.big ? '#ffd9a8' : m.era ? COLR.amber : COLR.tx, { align: 'c' });
        subs.forEach((l, k) => text(l, W / 2, yb + pad + PX.LINE * sc + s + k * LH, COLR.tx, { align: 'c' })); c.globalAlpha = 1;
      }
    }

    // ── 터 메뉴: 짓기 / 증축·철거 ──
    U.menuRect = null;
    if (U.menu && G.phase === 'play') {
      const m = U.menu, p = proj(m.pad.x, m.pad.y + (m.tower ? Math.min(3.6, m.tower.mounts.top) : 1.2), m.pad.z), a = sat(m.t * 8), mp = 6 * s, maxT = Wr - iL - 8 * s - mp * 2;
      const button = (bx, by, bw2, bh2, id, enabled, fn, kind, on) => {
        const ov = over(bx, by, bw2, bh2) && !U.gp.active, focused = U.gp.active && U.btns.length === m.focus;
        const b = { id, fn, kind, x: bx, y: by, w: bw2, h: bh2 }; U.btns.push(b); if (ov) hot = b; const down = U.press === id, lit = ov || focused || on || down;
        plate(bx, by + (down ? s : 0), bw2, bh2, { bg: lit ? COLR.bg2 : 'rgba(16,18,27,0.96)', bd: lit ? COLR.bdHi : (enabled ? COLR.bd : '#3a342c'), hi: lit ? 'rgba(232,176,74,0.18)' : null });
        return { lit, dy: down ? s : 0 };
      };
      const place = (wP, hP) => { const below = p.y - hP - 7 * s < y0 + topH + 2 * s && p.y + 26 * s + hP < Hb - 4 * s; return [clamp(Math.round(p.x - wP / 2), 4 * s + iL, Wr - wP - 4 * s), below ? Math.round(p.y + 26 * s) : clamp(Math.round(p.y - hP - 7 * s), Math.min(y0 + topH + 4 * s, Hb - hP - 4 * s), Hb - hP - 4 * s)]; };
      c.globalAlpha = a;
      if (!m.tower) {
        const bwid = 31 * s, bh = 35 * s, gapb = 3 * s, rowW = 4 * bwid + 3 * gapb;
        let lit = null; const fk = U.gp.active ? TOWER_KINDS[m.focus % 4] : null;
        // 설명 줄: 이름 + 쓰임새(판 폭을 넘으면 줄바꿈). 줄 수는 가장 긴 설명에 맞춰 판 높이를 고정한다.
        const lines = k => { const body = k ? [].concat(towerDesc(k) || []) : tch ? ['누르면 쓰임새가 보이고', '한 번 더 누르면 짓는다'] : ['가리키거나 1~4를 눌러', '쓰임새를 살펴본다']; let out = [k ? towerName(k) : '무엇을 지을까']; for (const l of body) out = out.concat(wrapRaw(l, maxT)); return out; };
        let textW = Math.max(tw('한 번 더 눌러 짓기'), tw('군자금이 모자란다')), nL = 3; for (const k of [null].concat(TOWER_KINDS)) { const ls = lines(k); nL = Math.max(nL, ls.length); for (const l of ls) textW = Math.max(textW, tw(l)); }
        const wP = Math.max(rowW, textW) + mp * 2, hP = mp * 2 + LH + 3 * s + bh + 4 * s + LH * nL + (tch ? LH + s : 0), [px, py] = place(wP, hP);
        U.menuRect = { x: px, y: py, w: wP, h: hP };
        plate(px, py, wP, hP, { era: true }); text('여기에 짓기', px + mp, py + mp, COLR.amber);
        const bx0 = px + Math.round((wP - rowW) / 2), by = py + mp + LH + 3 * s;
        TOWER_KINDS.forEach((kind, i) => {
          const d = TOWER[kind], can = G.gold >= d.cost[0], bx = bx0 + i * (bwid + gapb);
          const r = button(bx, by, bwid, bh, 'b' + kind, can, () => { if (U.touch && m.sel !== kind) { m.sel = kind; sfx('uiHover', m.pad.x, m.pad.z, .8); } else doBuild(m.pad, kind); }, kind, m.sel === kind);
          const icn = kind === 'bombard' && curEra() !== 'joseon' ? 'pocha' : d.icon, [iw, ih] = PX.iconSize(icn); PX.icon(c, icn, bx + Math.round((bwid - iw * s) / 2), by + 6 * s + r.dy, s, can ? 1 : .45);  // 화약 이전(고구려·고려)의 포차는 투석기 그림
          if (!tch) text('' + (i + 1), bx + 3 * s, by + 2 * s + r.dy, COLR.dim);
          const cw2 = 8 * s + 2 * s + tw('' + d.cost[0]), cx0 = bx + Math.round((bwid - cw2) / 2);
          PX.icon(c, 'coin', cx0, by + bh - LH - 3 * s + r.dy, s, can ? 1 : .5); text('' + d.cost[0], cx0 + 10 * s, by + bh - LH - 3 * s + r.dy, can ? COLR.amber : COLR.red);
          if (r.lit) lit = kind;
        });
        const ls = lines(lit || fk), ty = by + bh + 5 * s;
        ls.forEach((l, k) => text(l, px + mp, ty + k * LH + (k ? s : 0), k === 0 && (lit || fk) ? COLR.tx : COLR.dim));
        if (tch && m.sel) { const can = G.gold >= TOWER[m.sel].cost[0]; text(can ? '한 번 더 눌러 짓기' : '군자금이 모자란다', px + mp, ty + LH * nL + 2 * s, can ? COLR.amber : COLR.red); }
      } else {
        const t = m.tower, d = t.def, maxed = t.lvl >= 2, upc = maxed ? 0 : d.cost[t.lvl + 1], can = !maxed && G.gold >= upc && t.state === 'active', refund = Math.round(t.spent * .6), L1 = t.lvl + 1;
        const ul = maxed ? '최고 단계' : '증축 ' + upc, sl = (m.sellArm ? '철거 확인 +' : '철거 +') + refund, iw9 = 9 * s, bw3 = Math.max(tw(ul), tw(sl), tw('철거 확인 +' + refund)) + iw9 + 11 * s, bh = (tch ? 24 : 15) * s, by0 = Math.round((bh - LH) / 2) + s;
        const st = t.kind === 'guard' ? '병사 ' + d.n[t.lvl] + ' · 체력 ' + d.hp[t.lvl] : '사거리 ' + d.range[t.lvl].toFixed(1) + ' · 피해 ' + d.dmg[t.lvl];
        const nx = maxed ? '격퇴 ' + t.kills : (t.kind === 'guard' ? '다음: 병사 ' + d.n[L1] + ' · 체력 ' + d.hp[L1] : '다음: 사거리 ' + d.range[L1].toFixed(1) + ' · 피해 ' + d.dmg[L1]);
        const wP = Math.max(bw3 * 2 + 3 * s, tw(towerName(t.kind)) + 26 * s, tw(st), tw(nx)) + mp * 2, hP = mp * 2 + LH * 3 + 7 * s + bh, [px, py] = place(wP, hP);
        U.menuRect = { x: px, y: py, w: wP, h: hP };
        plate(px, py, wP, hP, { era: true }); text(towerName(t.kind), px + mp, py + mp, COLR.amber);
        for (let i = 0; i < 3; i++) PX.icon(c, i <= t.lvl ? 'star' : 'starEmpty', px + wP - mp - (3 - i) * 6 * s, py + mp + s, s);
        text(st, px + mp, py + mp + LH + 2 * s, COLR.tx); text(nx, px + mp, py + mp + LH * 2 + 3 * s, maxed ? COLR.dim : COLR.ok);
        const by = py + mp + LH * 3 + 7 * s, bwf = Math.floor((wP - mp * 2 - 3 * s) / 2);
        let r = button(px + mp, by, bwf, bh, 'up', can, () => doUpgrade(t), null, false);
        PX.icon(c, 'upgrade', px + mp + 4 * s, by + by0 - s + r.dy, s, can ? 1 : .4); text(ul, px + mp + 4 * s + iw9 + 3 * s, by + by0 + r.dy, can ? COLR.tx : (maxed ? COLR.dim : COLR.red));
        r = button(px + mp + bwf + 3 * s, by, bwf, bh, 'sell', true, () => { if (!m.sellArm) { m.sellArm = true; sfx('uiHover', t.x, t.z, .8); } else { buzz(16); doSell(t); } }, null, m.sellArm);
        PX.icon(c, 'sell', px + mp + bwf + 7 * s, by + by0 - s + r.dy, s); text(sl, px + mp + bwf + 7 * s + iw9 + 3 * s, by + by0 + r.dy, m.sellArm ? COLR.ember : COLR.tx);
      }
      c.globalAlpha = 1;
    }
    if (hot !== U.hotBtn && hot) sfx('uiHover', CAM.x, CAM.z, .5);
    U.hotBtn = hot;
    if (U.armed && mouse && G.phase === 'play') { const l = towerName(U.armed) + ': 터를 눌러 짓기', w = tw(l) + pad * 2; const xx = clamp(U.mx + 10 * s, 2 * s, W - w - 2 * s), yy = clamp(U.my + 10 * s, 2 * s, H - LH - pad * 2); plate(xx, yy, w, LH + pad * 2 - s, { bd: COLR.bdHi }); text(l, xx + pad, yy + pad, COLR.tx); }

    // ── 시작 화면: 조선워치 / 612년 · 살수대첩 / 사기 한 줄 / 안내 ──
    if (U.titleT < 9 && !U.menu) {
      const a = sat(Math.min((U.titleT - .4) * 1.5, (8.6 - U.titleT) * 1.2));
      if (a > 0) {
        const bio = G.B.bio, sc = s * 2, t1 = '조선워치', maxW = Wr - iL - 6 * s - pad * 4, head = bio.year ? bio.year + '년 · ' + (bio.title || bio.name) : bio.name;
        const rows = [[head, COLR.amber]]; for (const l of wrap(bio.lore || '', Math.min(maxW, 136 * s))) rows.push([l, COLR.tx]);
        for (const l of wrap('군사가 지휘 중 · 터를 누르면 직접 지휘', maxW)) rows.push([l, COLR.dim]);
        if (G.best > 5) rows.push(['최고 기록: 제' + G.best + '파', COLR.dim]);
        let w = PX.measure(t1, sc) * sc; for (const r of rows) w = Math.max(w, tw(r[0])); w += pad * 4;
        const h = PX.LINE * sc + LH * rows.length + pad * 2 + 6 * s, xx = Math.round((iL + Wr) / 2 - w / 2), yy = Math.max(y0 + topH + g3, Hb - h - 12 * s - zb), cx = xx + w / 2;
        c.globalAlpha = a; plate(xx, yy, w, h, { era: true }); PX.text(c, t1, cx, yy + pad + 2 * s, sc, '#ffd9a8', { align: 'c' });
        rows.forEach((r, k) => text(r[0], cx, yy + pad + PX.LINE * sc + 4 * s + k * LH + (k ? s : 0), r[1], { align: 'c' })); c.globalAlpha = 1;
      }
    }
    if (HASH.fps) { text(R.fpsText || '', 6 * s + iL, Hb - 30 * s, COLR.ok, { outline: COLR.dark }); }
  }
  U.init = initUI; U.update = update; U.draw = draw;
  return U;
})();
