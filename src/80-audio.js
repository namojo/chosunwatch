const AU = (function () {
  const api = { ready: false, muted: false, unlock: unlock, setMuted: setMuted, setPaused: setPaused, play: play, setAmbience: setAmbience, update: update };

  let ctx = null, sr = 44100;
  let nMaster = null, nMute = null, nSfx = null, nAmb = null, nMusic = null, nRevIn = null;
  let bufWhite = null, bufPink = null, bufBrown = null;
  let V = null;
  const shapeCurves = {};
  const ends = [];
  const last = {};
  const tgt = { fire: 0, wind: 0, tension: 0 }, cur = { fire: 0, wind: 0, tension: 0 }, app = { fire: -1, wind: -1, heat: -1 };
  const bed = { windG: null, gustG: null, windLP: [], whG: null, whF: null, fireG: null, popBus: null, droneG: null, droneLP: null, drone: [], disG: null, timer: 0, popAcc: 0 };

  // ── 국악 음계와 전장별 조(調) ──
  // 계면조(라 선법)는 비장하게, 평조(솔 선법)는 밝고 당당하게. 값은 으뜸음 기준 반음.
  const MODE = { gye: [0, 3, 5, 7, 10], pyeong: [0, 2, 5, 7, 9] };
  // root: 드론 으뜸음(미디), dg: 대금 으뜸, gy: 가야금/거문고 으뜸, geo: 거문고풍(고구려), slow: 선율 호흡, dis: 불협 드론
  const KEYS = {
    fen: { root: 38, mode: 'gye', dg: 62, gy: 50, geo: 1, slow: 1, dis: 0 },        // 살수 — D 계면
    ashen: { root: 40, mode: 'gye', dg: 64, gy: 52, geo: 1, slow: 1, dis: 0 },      // 안시성 — E 계면
    frost: { root: 33, mode: 'gye', dg: 57, gy: 45, geo: 0, slow: 1.25, dis: 0 },   // 귀주성 — A 계면, 낮고 느리게
    ember: { root: 43, mode: 'pyeong', dg: 67, gy: 55, geo: 0, slow: 0.95, dis: 1 }, // 진주성 — G 평조 + 불협 드론
    dunes: { root: 36, mode: 'pyeong', dg: 60, gy: 48, geo: 0, slow: 1, dis: 0 },   // 행주산성 — C 평조
  };
  // mode: 0 장단 없음(드론+독주), 1 자진모리, 2 휘모리, -1 다음 박에 장단 시작
  const mus = { key: KEYS.fen, keyName: 'fen', heat: 0, mode: 0, steps: 12, step: 0, stepAt: 0, stepLen: 0.208, pat: '', bar: 0, plan: [], phraseAt: 0, hold: 0, deg: 0, pmD: null, pmG: null, turn: 0, motif: null, geo: true, phase: '', intro: false, tPrev: 0, log: null };
  const gs = { ok: false, key: 'fen', era: '', phase: 'play', n: 0, sp: false, bw: false, lr: 1 };
  const dbg = { live: 0, made: 0, swept: 0, err: 0, msg: '' };
  const liveSet = new Set();
  // 음량(음악 버스 안에서의 피크). 귀로 확인하지 못한 음색이므로 원작 음악의 실측 수준에 맞춰 낮게 잡았다.
  const LV = { drone0: 0.05, drone1: 0.07, dg: 0.13, gy: 0.16, geo: 0.19, tp: 0.05, jg: 1.15, buk: 1.1, jing: 0.34, kk: 0.15 };
  let rawOut = false, inTest = false;

  const rnd = Math.random;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (x, a, b) => (x < a ? a : x > b ? b : x);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function gn(dest, v) { const g = ctx.createGain(); g.gain.value = v === undefined ? 0 : v; if (dest) g.connect(dest); return g; }
  function flt(dest, type, f, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; if (dest) b.connect(dest); return b; }
  function panNode(pan, dest) {
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = cl(pan, -1, 1); if (dest) p.connect(dest); return p; }
    return gn(dest, 1);
  }
  function shape(dest, drive) {
    const ws = ctx.createWaveShaper();
    let c = shapeCurves[drive];
    if (!c) { c = new Float32Array(1024); const n = Math.tanh(drive); for (let i = 0; i < 1024; i++) c[i] = Math.tanh(drive * (i / 511.5 - 1)) / n; shapeCurves[drive] = c; }
    ws.curve = c; ws.oversample = '2x'; if (dest) ws.connect(dest); return ws;
  }
  function keep(src, e) { if (V && e > V.lastT) { V.last = src; V.lastT = e; } }
  function osc(type, f, t, dur, dest) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (dest) o.connect(dest);
    const e = t + dur + 0.03; o.start(t); o.stop(e); keep(o, e); return o;
  }
  function noi(t, dur, dest, buf, rate) {
    const s = ctx.createBufferSource(); s.buffer = buf || bufWhite; s.loop = true; if (rate) s.playbackRate.value = rate; if (dest) s.connect(dest);
    const e = t + dur + 0.03; s.start(t, rnd() * (s.buffer.duration - 0.1)); s.stop(e); keep(s, e); return s;
  }
  function loopSrc(buf, dest, rate) {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; if (rate) s.playbackRate.value = rate; s.connect(dest);
    s.start(ctx.currentTime, rnd() * (buf.duration - 0.1)); return s;
  }
  function loopOsc(type, f, dest) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; if (dest) o.connect(dest); o.start(); return o; }

  function ad(param, t, peak, a, d) { param.setValueAtTime(0.0001, t); param.linearRampToValueAtTime(Math.max(0.0002, peak), t + a); param.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function sw(param, t, f0, f1, dur) { param.setValueAtTime(Math.max(1, f0), t); param.exponentialRampToValueAtTime(Math.max(1, f1), t + dur); }

  function grains(dest, t, n, span, peak, dMin, dMax, f0, f1, q, shp) {
    const g = gn(dest, 0), f = flt(g, 'bandpass', (f0 + f1) * 0.5, q || 4);
    const ts = [];
    for (let i = 0; i < n; i++) { let u = rnd(); if (shp === 1) u = u * u; else if (shp === 2) u = 1 - u * u; ts.push(u * span); }
    ts.sort((a, b) => a - b);
    let end = t + 0.01;
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < n; i++) {
      const ti = t + ts[i], room = i < n - 1 ? ts[i + 1] - ts[i] - 0.004 : 9;
      if (room < 0.004) continue;
      const d = Math.min(rr(dMin, dMax), room), a = peak * rr(0.35, 1) * (shp === 1 ? 1 - 0.6 * ts[i] / span : 1);
      f.frequency.setValueAtTime(rr(f0, f1), ti);
      g.gain.setValueAtTime(0.0001, ti);
      g.gain.linearRampToValueAtTime(Math.max(0.0002, a), ti + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.0015 + d);
      end = ti + 0.0015 + d;
    }
    noi(t, end - t + 0.02, f);
    return end;
  }

  function voice(pan, gain, send, bus) {
    const out = gn(null, gain);
    const tail = panNode(pan, bus || nSfx); out.connect(tail);
    let wet = null;
    if (send > 0) { wet = gn(nRevIn, send); tail.connect(wet); }
    const live = !inTest; if (live) { dbg.live++; dbg.made++; }
    return { out: out, tail: tail, wet: wet, last: null, lastT: 0, live: live };
  }
  function finishVoice(v) {
    const done = () => {
      if (v.fin) return;
      v.fin = true; liveSet.delete(v);
      if (v.live) { v.live = false; dbg.live--; }
      try { v.out.disconnect(); v.tail.disconnect(); if (v.wet) v.wet.disconnect(); } catch (e) {}
    };
    v.done = done;
    if (v.last) { v.last.onended = done; if (v.live) liveSet.add(v); } else done();
    if (V === v) V = null;
  }
  // 안전망: 메인 스레드가 오래 멈추면(탭 정지·긴 프레임) ended 이벤트가 유실될 수 있다. 끝난 지 한참 된 발음은 직접 거둔다.
  function sweep(now) { liveSet.forEach((v) => { if (now > v.lastT + 1.5) { dbg.swept++; v.done(); } }); }

  function makeBuffers() {
    const mk = (secs, fill) => {
      const len = (sr * secs) | 0, fade = (sr * 0.06) | 0, x = new Float32Array(len + fade);
      fill(x);
      let pk = 0; for (let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
      const b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0), k = 1 / (pk || 1);
      for (let i = 0; i < len; i++) d[i] = x[i] * k;
      for (let i = 0; i < fade; i++) { const u = i / fade; d[i] = (x[i] * u + x[len + i] * (1 - u)) * k; }
      return b;
    };
    bufWhite = mk(2, (x) => { for (let i = 0; i < x.length; i++) x[i] = rnd() * 2 - 1; });
    bufPink = mk(5, (x) => {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < x.length; i++) {
        const w = rnd() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        x[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      }
    });
    bufBrown = mk(5, (x) => { let b = 0; for (let i = 0; i < x.length; i++) { b = (b + 0.02 * (rnd() * 2 - 1)) / 1.02; x[i] = b; } });
  }
  function makeImpulse() {
    const len = (sr * 2.9) | 0, b = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      const e1 = 0.17 + ch * 0.021, e2 = 0.31 - ch * 0.027;
      for (let i = 0; i < len; i++) {
        const t = i / sr, w = rnd() * 2 - 1;
        const a = cl(0.2 + t * 0.42, 0, 0.94);
        lp += (w - lp) * (1 - a);
        let env = Math.exp(-t * 2.5) * (t < 0.022 ? t / 0.022 : 1);
        if (t > e1 && t < e1 + 0.02) env += 0.5 * Math.exp(-(t - e1) * 160);
        if (t > e2 && t < e2 + 0.025) env += 0.32 * Math.exp(-(t - e2) * 130);
        d[i] = lp * env * (1 + a * 2.2);
      }
    }
    return b;
  }

  function ding(d, t, f, peak) {
    const g = gn(d); osc('sine', f, t, 0.3, g); ad(g.gain, t, peak, 0.002, 0.2);
    const g2 = gn(d); osc('sine', f * 2.42, t, 0.15, g2); ad(g2.gain, t, peak * 0.3, 0.001, 0.06);
  }
  function whoomp(d, t, peak, len) {
    const w = gn(d), wf = flt(w, 'lowpass', 300, 1.2); noi(t, len + 0.2, wf);
    wf.frequency.setValueAtTime(180, t); wf.frequency.exponentialRampToValueAtTime(1100, t + len * 0.25); wf.frequency.exponentialRampToValueAtTime(320, t + len);
    ad(w.gain, t, peak, len * 0.18, len * 0.9);
    const g = gn(d), o = osc('sine', 70, t, len * 0.7, g); sw(o.frequency, t, 62, 115, len * 0.5); ad(g.gain, t, peak * 0.6, len * 0.15, len * 0.5);
  }
  // ── 국악기 음색 (목적지 d에 바로 꽂는 것들: 효과음과 음악이 함께 쓴다) ──
  // 북(전고): 떨어지는 사인 + 짧은 저역 노이즈 + 채가 가죽을 치는 소리
  function bukHit(d, t, vel) {
    const g = gn(d), o = osc('sine', 90, t, 0.56, g); sw(o.frequency, t, 92, 48, 0.12); ad(g.gain, t, vel, 0.004, 0.5);
    const g2 = gn(d), o2 = osc('sine', 180, t, 0.24, g2); sw(o2.frequency, t, 190, 118, 0.08); ad(g2.gain, t, vel * 0.4, 0.003, 0.2);
    const n = gn(d), nf = flt(n, 'lowpass', 300, 0.7); noi(t, 0.05, nf); ad(n.gain, t, vel * 0.7, 0.002, 0.02);
    const c = gn(d), cf = flt(c, 'bandpass', 720, 1.5); noi(t, 0.04, cf); ad(c.gain, t, vel * 0.22, 0.001, 0.014);
  }
  // 장구 북편(쿵)
  function kungHit(d, t, vel) {
    const g = gn(d), o = osc('sine', 100, t, 0.36, g); sw(o.frequency, t, 112, 70, 0.09); ad(g.gain, t, vel, 0.003, 0.3);
    const g2 = gn(d), o2 = osc('triangle', 200, t, 0.14, g2); sw(o2.frequency, t, 224, 150, 0.06); ad(g2.gain, t, vel * 0.22, 0.002, 0.1);
    const n = gn(d), nf = flt(n, 'lowpass', 420); noi(t, 0.04, nf); ad(n.gain, t, vel * 0.4, 0.002, 0.016);
  }
  // 장구 채편(덕)
  function deokHit(d, t, vel) {
    const n = gn(d), nf = flt(n, 'bandpass', 1800 * rr(0.94, 1.06), 3); noi(t, 0.06, nf); ad(n.gain, t, vel, 0.0008, 0.03);
    const g = gn(d), o = osc('triangle', 400, t, 0.07, g); sw(o.frequency, t, 430, 330, 0.04); ad(g.gain, t, vel * 0.3, 0.001, 0.045);
    const c = gn(d), cf = flt(c, 'highpass', 4200); noi(t, 0.02, cf); ad(c.gain, t, vel * 0.18, 0.0005, 0.006);
  }
  // 징: 비정수 배음 + 느린 맥놀이. 치고 나면 음이 살짝 올라가고, 높은 배음은 늦게 피어난다('웅—').
  const JR = [1, 1.48, 2.1, 2.76, 3.4, 4.25], JA = [1, 0.62, 0.5, 0.3, 0.2, 0.1];
  function jing(d, t, f0, peak, dur) {
    const lp = flt(d, 'lowpass', 2600, 0.5), k = peak / 2.2;
    for (let i = 0; i < 6; i++) {
      const dd = dur / (1 + i * 0.55), at = 0.008 + i * 0.03, pair = i < 4 ? 2 : 1;
      for (let s = 0; s < pair; s++) {
        const g = gn(lp), o = osc('sine', f0 * JR[i] + (s ? 0.7 : -0.7) * (1 + i * 0.3), t, at + dd + 0.02, g);
        o.detune.setValueAtTime(-22, t); o.detune.linearRampToValueAtTime(4, t + 0.4);
        ad(g.gain, t, k * JA[i] / pair, at, dd);
      }
    }
    const n = gn(d), nf = flt(n, 'lowpass', 520, 0.8); noi(t, 0.08, nf); ad(n.gain, t, peak * 0.35, 0.003, 0.05);
  }
  // 꽹과리: 높은 비정수 배음 + 쇳소리 노이즈. dec 짧으면 막음(지), 길면 울림(갱).
  const KR = [1, 1.51, 2.04, 2.7, 3.37, 4.3], KA = [0.5, 1, 0.8, 0.6, 0.4, 0.25];
  function kkwaeng(d, t, peak, dec) {
    const f0 = 870 * rr(0.985, 1.015), lp = flt(d, 'lowpass', 6200, 0.5), k = peak / 2.4;
    for (let i = 0; i < 6; i++) {
      const g = gn(lp), dd = dec / (1 + i * 0.3);
      osc(i & 1 ? 'triangle' : 'sine', f0 * KR[i] * rr(0.997, 1.003), t, dd + 0.03, g);
      ad(g.gain, t, k * KA[i], 0.001, dd);
    }
    const n = gn(lp), nf = flt(n, 'bandpass', 3300, 1.2); noi(t, 0.05, nf); ad(n.gain, t, peak * 0.45, 0.0006, Math.min(0.03, dec * 0.3));
  }
  // 나발: 톱니파 한 음. 입술로 밀어 올려 붙이고, 로우패스가 열리며 '뿌—' 하고 벌어진다. 음정은 바꾸지 않는다.
  function nabal(d, t, f, dur, peak) {
    const env = gn(d), pk = flt(env, 'peaking', 950, 1.2); pk.gain.value = 6;
    const lp = flt(pk, 'lowpass', 300, 1.1), sh = shape(lp, 1.6);
    const os = [osc('sawtooth', f * 0.996, t, dur + 0.5, gn(sh, 0.4)), osc('sawtooth', f * 1.004, t, dur + 0.5, gn(sh, 0.4)), osc('square', f, t, dur + 0.5, gn(sh, 0.16))];
    const drift = gn(null, 5); osc('sine', rr(2.3, 3.1), t, dur + 0.5, drift);
    for (let i = 0; i < os.length; i++) {
      const p = os[i].detune; drift.connect(p);
      p.setValueAtTime(-110, t); p.linearRampToValueAtTime(0, t + 0.07);
      p.setValueAtTime(0, t + dur); p.linearRampToValueAtTime(-45, t + dur + 0.3);
    }
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 0.25); lp.frequency.linearRampToValueAtTime(1750, t + dur * 0.7); lp.frequency.setTargetAtTime(340, t + dur, 0.12);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(peak * 0.7, t + 0.09); env.gain.linearRampToValueAtTime(peak, t + dur * 0.7); env.gain.setTargetAtTime(0.0001, t + dur, 0.09);
    const n = gn(env, 0.03), nf = flt(n, 'bandpass', 1500, 1); noi(t, dur + 0.4, nf);
  }
  // 나각(소라): 사인+삼각파에 숨소리. 5도 아래에서 밀어 올려 한 음에 머문다.
  function nagak(d, t, f, dur, peak) {
    const env = gn(d), lp = flt(env, 'lowpass', 1100, 0.7);
    const os = [osc('sine', f, t, dur + 0.5, gn(lp, 0.7)), osc('triangle', f, t, dur + 0.5, gn(lp, 0.45)), osc('sine', f * 2, t, dur + 0.5, gn(lp, 0.12))];
    const wob = gn(null, 0); osc('sine', rr(3, 3.7), t, dur + 0.5, wob);
    wob.gain.setValueAtTime(0, t + 0.4); wob.gain.linearRampToValueAtTime(9, t + dur);
    for (let i = 0; i < os.length; i++) {
      const p = os[i].detune; wob.connect(p);
      p.setValueAtTime(-702, t); p.linearRampToValueAtTime(-40, t + 0.2); p.linearRampToValueAtTime(0, t + 0.45);
      p.setValueAtTime(0, t + dur); p.linearRampToValueAtTime(-90, t + dur + 0.3);
    }
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(peak * 0.5, t + 0.15); env.gain.linearRampToValueAtTime(peak, t + dur * 0.65); env.gain.setTargetAtTime(0.0001, t + dur, 0.12);
    const b = gn(env, 0.07), bf = flt(b, 'bandpass', f * 3, 0.9); noi(t, dur + 0.4, bf);
  }
  const S = {};
  S.bow = (d, t) => {
    const k = rr(0.92, 1.1);
    const g = gn(d), bp = flt(g, 'bandpass', 900 * k, 1.1);
    const o = osc('triangle', 210 * k, t, 0.2, bp); sw(o.frequency, t, 230 * k, 118 * k, 0.11);
    const o2 = osc('sawtooth', 425 * k, t, 0.12, gn(bp, 0.25)); sw(o2.frequency, t, 470 * k, 240 * k, 0.08);
    ad(g.gain, t, 0.9, 0.002, 0.14);
    const w = gn(d), wf = flt(w, 'bandpass', 1800, 1.3); noi(t, 0.22, wf); sw(wf.frequency, t, 2400, 700, 0.18); ad(w.gain, t + 0.005, 0.22, 0.02, 0.15);
  };
  S.arrowHit = (d, t) => {
    const k = rr(0.85, 1.2);
    const g = gn(d), o = osc('sine', 170 * k, t, 0.12, g); sw(o.frequency, t, 190 * k, 70 * k, 0.07); ad(g.gain, t, 0.55, 0.002, 0.08);
    const n = gn(d), nf = flt(n, 'bandpass', 520 * k, 5); noi(t, 0.08, nf); ad(n.gain, t, 0.5, 0.001, 0.05);
    const c = gn(d), cf = flt(c, 'highpass', 2600); noi(t, 0.04, cf); ad(c.gain, t, 0.16, 0.0005, 0.014);
  };
  S.cannon = (d, t, p) => {
    const k = rr(0.9, 1.08) * (1 - 0.18 * p), sh = shape(d, 2.2);
    const g = gn(sh), o = osc('sine', 120 * k, t, 0.9, g); sw(o.frequency, t, 125 * k, 33 * k, 0.4); ad(g.gain, t, 1.0, 0.003, 0.7);
    const g2 = gn(sh), o2 = osc('triangle', 64 * k, t, 0.6, g2); sw(o2.frequency, t, 70 * k, 28 * k, 0.5); ad(g2.gain, t, 0.5, 0.004, 0.5);
    const b = gn(sh), bf = flt(b, 'lowpass', 1200, 0.7); noi(t, 0.7, bf); sw(bf.frequency, t, 1600, 140, 0.45); ad(b.gain, t, 0.7, 0.002, 0.5);
    const c = gn(d), cf = flt(c, 'highpass', 1100); noi(t, 0.1, cf); ad(c.gain, t, 0.5, 0.0008, 0.05);
    const r = gn(d), rf = flt(r, 'lowpass', 230, 0.5); noi(t + 0.05, 1.5, rf, bufBrown); ad(r.gain, t + 0.05, 0.5, 0.12, 1.2);
  };
  S.explode = (d, t, p) => {
    const k = rr(0.88, 1.12) * (1 - 0.25 * p), L = 1 + 0.5 * p, sh = shape(d, 1.8);
    const g = gn(sh), o = osc('sine', 90 * k, t, 0.6 * L, g); sw(o.frequency, t, 95 * k, 30 * k, 0.32 * L); ad(g.gain, t, 0.95, 0.003, 0.45 * L);
    const b = gn(sh), bf = flt(b, 'lowpass', 2600, 0.8); noi(t, 0.7 * L, bf); sw(bf.frequency, t, 3000, 180, 0.4 * L); ad(b.gain, t, 0.75, 0.002, 0.45 * L);
    const m = gn(d), mf = flt(m, 'bandpass', 420 * k, 0.9); noi(t, 0.5, mf); ad(m.gain, t, 0.35, 0.004, 0.3 * L);
    grains(d, t + 0.12, 9 + ((p * 6) | 0), 0.8 * L, 0.2, 0.015, 0.05, 500, 2400, 5, 1);
    const r = gn(d), rf = flt(r, 'lowpass', 180); noi(t + 0.05, 1.1 * L, rf, bufBrown); ad(r.gain, t + 0.05, 0.4, 0.1, 0.9 * L);
  };
  S.charge = (d, t) => {
    const k = rr(0.94, 1.06), D = 0.55, lp = flt(d, 'lowpass', 3200), g = gn(lp);
    const o = osc('sine', 380 * k, t, D, g); sw(o.frequency, t, 380 * k, 1500 * k, D);
    const o2 = osc('triangle', 572 * k, t, D, gn(g, 0.35)); sw(o2.frequency, t, 572 * k, 2270 * k, D);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + D * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + D);
    const n = gn(d), nf = flt(n, 'bandpass', 2000, 3); noi(t, D, nf); sw(nf.frequency, t, 1500, 5200, D);
    n.gain.setValueAtTime(0.0001, t); n.gain.exponentialRampToValueAtTime(0.05, t + D * 0.9); n.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.02);
  };
  S.zap = (d, t, p) => {
    const k = rr(0.9, 1.1), lp = flt(d, 'lowpass', 7500);
    const c = gn(lp), cf = flt(c, 'highpass', 1700); noi(t, 0.1, cf); ad(c.gain, t, 0.8, 0.0005, 0.045);
    const t2 = t + rr(0.03, 0.07), c2 = gn(lp), cf2 = flt(c2, 'bandpass', 2600 * k, 0.8); noi(t2, 0.12, cf2); ad(c2.gain, t2, 0.5, 0.0005, 0.07);
    const z = gn(lp, 0), zf = flt(z, 'bandpass', 2100 * k, 2.2), zo = osc('sawtooth', 96 * k, t, 0.24, zf); sw(zo.frequency, t, 130 * k, 70 * k, 0.2);
    z.gain.setValueAtTime(0, t);
    for (let i = 0; i < 9; i++) z.gain.setValueAtTime(rnd() < 0.7 ? rr(0.15, 0.4) : 0.02, t + 0.002 + i * 0.022);
    z.gain.linearRampToValueAtTime(0, t + 0.23);
    grains(lp, t + 0.02, 10, 0.28, 0.3, 0.004, 0.014, 2800, 6000, 3, 1);
    const r = gn(d), rf = flt(r, 'lowpass', 170); noi(t, 1.0, rf, bufBrown); ad(r.gain, t + 0.01, 0.55 + 0.25 * p, 0.03, 0.8);
    const th = gn(d), to = osc('sine', 70, t, 0.3, th); sw(to.frequency, t, 80, 38, 0.2); ad(th.gain, t, 0.45, 0.003, 0.22);
    // 솟대에 매단 방울(무구): 벼락 끝에 짧게 떤다
    const bt = t + 0.05, bg = gn(lp), am = gn(bg, 0.6); osc('sine', rr(24, 31), bt, 0.3, gn(am.gain, 0.4));
    for (let i = 0; i < 3; i++) osc('sine', [2960, 3730, 4870][i] * k, bt, 0.3, gn(am, 0.33));
    ad(bg.gain, bt, 0.05, 0.004, 0.24);
  };
  S.clash = (d, t) => {
    const f0 = rr(1500, 2300), lp = flt(d, 'lowpass', 7000);
    const R = [1, 1.48, 2.08, 2.57, 3.31, 4.13], A = [0.3, 0.22, 0.2, 0.13, 0.09, 0.06];
    for (let i = 0; i < 6; i++) { const g = gn(lp); osc(i % 2 ? 'sine' : 'triangle', f0 * R[i] * rr(0.995, 1.005), t, 0.4, g); ad(g.gain, t, A[i], 0.001, rr(0.2, 0.32) / (1 + i * 0.45)); }
    const c = gn(lp), cf = flt(c, 'highpass', 3000); noi(t, 0.03, cf); ad(c.gain, t, 0.35, 0.0005, 0.012);
    const b = gn(lp), bf = flt(b, 'bandpass', 1200, 2.5); noi(t, 0.06, bf); ad(b.gain, t, 0.35, 0.001, 0.035);
  };
  S.slash = (d, t) => {
    const k = rr(0.85, 1.2);
    const s = gn(d), sf = flt(s, 'bandpass', 2600, 1.5); noi(t, 0.08, sf); sw(sf.frequency, t, 1500, 4200, 0.05); ad(s.gain, t, 0.12, 0.02, 0.035);
    const t1 = t + 0.04;
    const c = gn(d), cf = flt(c, 'bandpass', 800 * k, 1.4); noi(t1, 0.14, cf); sw(cf.frequency, t1, 900 * k, 280 * k, 0.08); ad(c.gain, t1, 0.7, 0.002, 0.08);
    const g = gn(d), o = osc('sine', 150 * k, t1, 0.1, g); sw(o.frequency, t1, 160 * k, 75 * k, 0.06); ad(g.gain, t1, 0.5, 0.002, 0.07);
    const b = gn(d), bf = flt(b, 'bandpass', 1700 * k, 9); noi(t1, 0.05, bf); ad(b.gain, t1, 0.25, 0.001, 0.03);
  };
  // (키 이름은 원작 그대로) 경장 병사·기병이 쓰러지는 소리: 가벼운 '툭' + 가죽·장비 스치는 소리. 쥐 울음은 뺐다.
  S.ratSqueal = (d, t) => {
    const k = rr(0.85, 1.2);
    const g = gn(d), o = osc('sine', 150 * k, t, 0.16, g); sw(o.frequency, t, 165 * k, 70 * k, 0.09); ad(g.gain, t, 0.24, 0.003, 0.11);
    const n = gn(d), nf = flt(n, 'bandpass', 900 * k, 1.2); noi(t, 0.12, nf); sw(nf.frequency, t, 1300 * k, 500 * k, 0.09); ad(n.gain, t, 0.15, 0.004, 0.08);
    grains(d, t + 0.03, 3, 0.16, 0.08, 0.008, 0.02, 1500, 3200, 8, 1);
  };
  S.boneRattle = (d, t) => {
    grains(d, t, 8 + ((rnd() * 4) | 0), 0.38, 0.5, 0.012, 0.04, 600, 1900, 11, 1);
    grains(d, t + 0.02, 4, 0.3, 0.3, 0.02, 0.05, 250, 520, 8, 1);
    const g = gn(d), o = osc('sine', 210, t, 0.08, g); sw(o.frequency, t, 230, 130, 0.05); ad(g.gain, t, 0.3, 0.002, 0.05);
  };
  S.squelch = (d, t, p) => {
    const k = rr(0.8, 1.2) * (1 - 0.3 * p);
    const g = gn(d), f = flt(g, 'lowpass', 500, 7); noi(t, 0.35, f);
    f.frequency.setValueAtTime(320 * k, t); f.frequency.exponentialRampToValueAtTime(1500 * k, t + 0.07); f.frequency.exponentialRampToValueAtTime(260 * k, t + 0.26);
    ad(g.gain, t, 0.5, 0.008, 0.26);
    const b = gn(d), o = osc('sine', 170 * k, t, 0.3, b);
    o.frequency.setValueAtTime(190 * k, t); o.frequency.exponentialRampToValueAtTime(85 * k, t + 0.09); o.frequency.exponentialRampToValueAtTime(230 * k, t + 0.2);
    ad(b.gain, t, 0.4, 0.005, 0.2);
    for (let i = 0; i < 3; i++) {
      const ti = t + 0.1 + i * rr(0.05, 0.09), dg = gn(d), f0 = rr(420, 800) * k, q = osc('sine', f0, ti, 0.06, dg);
      sw(q.frequency, ti, f0, f0 * 1.9, 0.035); ad(dg.gain, ti, 0.12, 0.003, 0.035);
    }
  };
  S.batScreech = (d, t) => {
    const k = rr(0.88, 1.15), lp = flt(d, 'lowpass', 5200), bp = flt(lp, 'bandpass', 3300 * k, 3.5);
    for (let i = 0; i < 2; i++) {
      const ti = t + i * rr(0.06, 0.085), g = gn(bp), o = osc('square', 3600 * k, ti, 0.07, g);
      sw(o.frequency, ti, 3900 * k, 2500 * k, 0.055); ad(g.gain, ti, 0.07, 0.004, 0.05);
    }
    const n = gn(lp), nf = flt(n, 'bandpass', 2400, 1); noi(t, 0.16, nf); ad(n.gain, t, 0.05, 0.01, 0.12);
  };
  S.roar = (d, t, p) => {
    const k = rr(0.92, 1.06) * (1 - 0.15 * p), D = 1.25;
    const env = gn(d), am = gn(env, 0.65);
    osc('sawtooth', rr(22, 28), t, D + 0.3, gn(am.gain, 0.35));
    const f1 = flt(am, 'bandpass', 380, 4), f2 = flt(gn(am, 0.4), 'bandpass', 1050, 6), f3 = flt(gn(am, 0.9), 'lowpass', 170);
    const pre = shape(f1, 3); pre.connect(f2); pre.connect(f3);
    const src = gn(pre, 0.5), base = [80 * k, 81.3 * k, 40 * k];
    const os = [osc('sawtooth', base[0], t, D + 0.2, src), osc('sawtooth', base[1], t, D + 0.2, src), osc('square', base[2], t, D + 0.2, gn(src, 0.5))];
    for (let i = 0; i < 3; i++) {
      const b = base[i], fr = os[i].frequency;
      fr.setValueAtTime(b * 0.85, t); fr.linearRampToValueAtTime(b * 1.3, t + 0.3); fr.linearRampToValueAtTime(b * 1.1, t + 0.7); fr.linearRampToValueAtTime(b * 0.65, t + D);
    }
    f1.frequency.setValueAtTime(330, t); f1.frequency.linearRampToValueAtTime(640, t + 0.35); f1.frequency.linearRampToValueAtTime(420, t + D);
    f2.frequency.setValueAtTime(900, t); f2.frequency.linearRampToValueAtTime(1300, t + 0.35); f2.frequency.linearRampToValueAtTime(950, t + D);
    const n = gn(am, 0.12), nf = flt(n, 'bandpass', 700, 0.9); noi(t, D + 0.2, nf);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(0.85, t + 0.12); env.gain.linearRampToValueAtTime(0.7, t + 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.15);
  };
  S.bossStep = (d, t, p) => {
    const k = rr(0.9, 1.1) * (1 - 0.2 * p), sh = shape(d, 1.6);
    const g = gn(sh), o = osc('sine', 60 * k, t, 0.5, g); sw(o.frequency, t, 66 * k, 29 * k, 0.26); ad(g.gain, t, 1.0, 0.004, 0.36);
    const n = gn(sh), nf = flt(n, 'lowpass', 150); noi(t, 0.4, nf, bufBrown); ad(n.gain, t, 0.9, 0.004, 0.25);
    const c = gn(d), cf = flt(c, 'bandpass', 900, 0.8); noi(t + 0.015, 0.2, cf); ad(c.gain, t + 0.015, 0.1, 0.004, 0.13);
    grains(d, t + 0.05, 4, 0.25, 0.07, 0.01, 0.03, 700, 2000, 4, 1);
  };
  S.bossDie = (d, t) => {
    const D = 1.5, k = rr(0.95, 1.05);
    const env = gn(d), am = gn(env, 0.7); osc('sawtooth', 19, t, D + 0.3, gn(am.gain, 0.3));
    const f1 = flt(am, 'bandpass', 420, 4), f3 = flt(gn(am, 0.8), 'lowpass', 170);
    const pre = shape(f1, 2.5); pre.connect(f3);
    const src = gn(pre, 0.5), a = osc('sawtooth', 92 * k, t, D + 0.2, src), b = osc('sawtooth', 93.5 * k, t, D + 0.2, src);
    sw(a.frequency, t, 100 * k, 36 * k, D); sw(b.frequency, t, 101.6 * k, 37 * k, D);
    f1.frequency.setValueAtTime(560, t); f1.frequency.exponentialRampToValueAtTime(230, t + D);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(0.8, t + 0.1); env.gain.linearRampToValueAtTime(0.5, t + D * 0.8); env.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.2);
    const tc = t + 1.15, sh = shape(d, 2);
    const g = gn(sh), o = osc('sine', 75, tc, 0.9, g); sw(o.frequency, tc, 80, 24, 0.5); ad(g.gain, tc, 1.0, 0.004, 0.7);
    const n = gn(sh), nf = flt(n, 'lowpass', 1800, 0.7); noi(tc, 0.9, nf); sw(nf.frequency, tc, 2200, 120, 0.6); ad(n.gain, tc, 0.75, 0.003, 0.6);
    grains(d, tc + 0.1, 16, 1.1, 0.28, 0.02, 0.07, 300, 1800, 5, 1);
    const r = gn(d), rf = flt(r, 'lowpass', 140); noi(tc, 1.4, rf, bufBrown); ad(r.gain, tc, 0.6, 0.1, 1.2);
  };
  S.coin = (d, t, p) => {
    const f = 1560 * Math.pow(2, (p * 5 + rr(-0.4, 0.4)) / 12), lp = flt(d, 'lowpass', 6500);
    const g = gn(lp); osc('sine', f, t, 0.15, g); ad(g.gain, t, 0.2, 0.002, 0.09);
    const g2 = gn(lp); osc('sine', f * 2.42, t, 0.1, g2); ad(g2.gain, t, 0.06, 0.001, 0.05);
    ding(lp, t + 0.055, f * 1.498, 0.2);
    const c = gn(lp), cf = flt(c, 'highpass', 3500); noi(t, 0.02, cf); ad(c.gain, t, 0.06, 0.0005, 0.008);
  };
  S.hammer = (d, t, p) => {
    const k = rr(0.82, 1.22) * (1 + 0.3 * (p - 0.5));
    const n = gn(d), nf = flt(n, 'bandpass', 760 * k, 9); noi(t, 0.07, nf); ad(n.gain, t, 1.0, 0.001, 0.035);
    const g = gn(d), o = osc('sine', 200 * k, t, 0.08, g); sw(o.frequency, t, 215 * k, 140 * k, 0.05); ad(g.gain, t, 0.45, 0.001, 0.05);
    const m = gn(d); osc('sine', 2900 * k, t, 0.06, m); ad(m.gain, t, 0.045, 0.001, 0.035);
    const c = gn(d), cf = flt(c, 'highpass', 2200); noi(t, 0.02, cf); ad(c.gain, t, 0.12, 0.0005, 0.008);
  };
  S.buildDone = (d, t) => {
    const g = gn(d), o = osc('sine', 125, t, 0.25, g); sw(o.frequency, t, 130, 58, 0.14); ad(g.gain, t, 0.8, 0.003, 0.18);
    const n = gn(d), nf = flt(n, 'lowpass', 600); noi(t, 0.15, nf); ad(n.gain, t, 0.5, 0.002, 0.09);
    whoomp(d, t + 0.1, 0.5, 0.5);
    grains(d, t + 0.2, 7, 0.5, 0.12, 0.004, 0.02, 1800, 5000, 3, 1);
    kkwaeng(d, t + 0.24, 0.06, 0.11); // 다 지었다는 꽹과리 한 점(막음)
  };
  S.sell = (d, t) => {
    grains(d, t, 9, 0.42, 0.7, 0.03, 0.07, 280, 900, 6, 1);
    const g = gn(d), o = osc('sine', 110, t + 0.08, 0.25, g); sw(o.frequency, t + 0.08, 120, 55, 0.15); ad(g.gain, t + 0.08, 0.6, 0.004, 0.18);
    const lp = flt(d, 'lowpass', 6500);
    for (let i = 0; i < 3; i++) ding(lp, t + 0.26 + i * 0.085, 1500 * Math.pow(2, (i * 2) / 12), 0.16);
  };
  // 공세 신호: 북 한 번이 앞을 열고, 나발이 전장의 으뜸음으로 길게 한 음.
  S.horn = (d, t) => {
    bukHit(d, t, 0.7);
    nabal(d, t + 0.1, mtof(mus.key.root + 12) * rr(0.99, 1.01), 1.6, 0.42);
  };
  // 적장 등장: 징과 북으로 열고, 나각이 두 번 운다. 둘째 소리 아래로 나발이 깔리고 북이 몰아친다.
  S.hornBoss = (d, t) => {
    const f = mtof(mus.key.root + 12) * rr(0.995, 1.005);
    jing(d, t, 178, 0.36, 7);
    bukHit(d, t, 0.5);
    nagak(d, t + 0.25, f * 1.4983, 1.15, 0.24);
    nagak(d, t + 1.75, f * 1.4983, 1.9, 0.27);
    nabal(d, t + 1.75, f, 1.9, 0.17);
    let tb = t + 1.75, gap = 0.4, i = 0;
    while (tb < t + 3.55) { bukHit(d, tb, 0.18 + 0.03 * i); gap = Math.max(0.095, gap * 0.82); tb += gap; i++; }
    bukHit(d, t + 3.72, 0.55);
  };
  // 적이 성문을 넘었다: 작은 징(광쇠) 한 점. 배음비를 징처럼 바꾸고 치고 나서 음이 살짝 올라간다.
  S.leak = (d, t) => {
    const f = 196 * rr(0.97, 1.03), lp = flt(d, 'lowpass', 1900);
    const R = [0.5, 1, 1.48, 2.1, 2.76, 3.4], A = [0.35, 0.5, 0.3, 0.2, 0.14, 0.08], D = [1.3, 1.1, 0.8, 0.6, 0.45, 0.3];
    for (let i = 0; i < 6; i++) { const g = gn(lp), o = osc('sine', f * R[i], t, D[i] + 0.1, g); o.detune.setValueAtTime(-24, t); o.detune.linearRampToValueAtTime(3, t + 0.35); ad(g.gain, t, A[i] * 0.6, 0.006, D[i]); }
    const th = gn(d), tf = flt(th, 'lowpass', 300); noi(t, 0.12, tf); ad(th.gain, t, 0.4, 0.003, 0.08);
    const fl = gn(d), am = gn(fl, 0.5), ff = flt(am, 'bandpass', 520, 0.8); noi(t, 0.75, ff); osc('sine', rr(15, 21), t, 0.75, gn(am.gain, 0.5));
    sw(ff.frequency, t, 900, 260, 0.6); ad(fl.gain, t + 0.02, 0.4, 0.06, 0.55);
  };
  S.footmanDie = (d, t) => {
    const k = rr(0.9, 1.1);
    const g = gn(d), o = osc('sine', 115 * k, t, 0.25, g); sw(o.frequency, t, 120 * k, 50 * k, 0.14); ad(g.gain, t, 0.75, 0.003, 0.17);
    const n = gn(d), nf = flt(n, 'lowpass', 420); noi(t, 0.2, nf); ad(n.gain, t, 0.5, 0.003, 0.12);
    grains(d, t + 0.04, 6, 0.36, 0.22, 0.02, 0.06, 1700, 3600, 10, 1);
  };
  S.uiHover = (d, t) => {
    const g = gn(d); osc('sine', rr(1250, 1400), t, 0.05, g); ad(g.gain, t, 0.07, 0.002, 0.03);
    const c = gn(d), cf = flt(c, 'bandpass', 3000, 2); noi(t, 0.02, cf); ad(c.gain, t, 0.05, 0.0005, 0.008);
  };
  S.uiClick = (d, t) => {
    const g = gn(d), o = osc('triangle', 900, t, 0.09, g); sw(o.frequency, t, 880, 1320, 0.035); ad(g.gain, t, 0.18, 0.002, 0.06);
    const w = gn(d); osc('sine', 300, t, 0.06, w); ad(w.gain, t, 0.15, 0.001, 0.035);
    const c = gn(d), cf = flt(c, 'bandpass', 2300, 1.5); noi(t, 0.03, cf); ad(c.gain, t, 0.2, 0.0005, 0.012);
  };
  S.uiDeny = (d, t) => {
    const lp = flt(d, 'lowpass', 700);
    for (let i = 0; i < 2; i++) {
      const ti = t + i * 0.11, g = gn(lp); osc('triangle', i ? 128 : 158, ti, 0.1, g); osc('square', i ? 64 : 79, ti, 0.1, gn(g, 0.3));
      g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(0.3, ti + 0.008); g.gain.setValueAtTime(0.3, ti + 0.06); g.gain.linearRampToValueAtTime(0.0001, ti + 0.085);
    }
  };
  S.crumble = (d, t) => {
    const D = 3.0;
    const r = gn(d), rf = flt(r, 'lowpass', 130, 0.6); noi(t, D + 0.4, rf, bufBrown); sw(rf.frequency, t, 170, 60, D);
    r.gain.setValueAtTime(0.0001, t); r.gain.linearRampToValueAtTime(1.0, t + 0.35); r.gain.linearRampToValueAtTime(0.7, t + D * 0.6); r.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.3);
    const s = gn(d), o = osc('sine', 44, t, D, s); sw(o.frequency, t, 48, 30, D); ad(s.gain, t, 0.5, 0.4, D - 0.4);
    grains(d, t + 0.1, 26, D - 0.3, 0.5, 0.05, 0.2, 180, 700, 3, 0);
    grains(d, t + 0.2, 16, D - 0.5, 0.2, 0.01, 0.04, 800, 2600, 5, 0);
  };
  S.rise = (d, t) => {
    const D = 3.0;
    const r = gn(d), rf = flt(r, 'lowpass', 70, 0.7); noi(t, D + 0.5, rf, bufBrown); sw(rf.frequency, t, 55, 240, D * 0.9);
    r.gain.setValueAtTime(0.0001, t); r.gain.exponentialRampToValueAtTime(0.9, t + D * 0.85); r.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.35);
    const s = gn(d), o = osc('sine', 32, t, D + 0.2, s); sw(o.frequency, t, 30, 62, D * 0.9);
    s.gain.setValueAtTime(0.0001, t); s.gain.exponentialRampToValueAtTime(0.45, t + D * 0.85); s.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.2);
    grains(d, t + 0.5, 14, D - 0.5, 0.55, 0.05, 0.12, 240, 720, 8, 2);
    const tf = t + D - 0.05, g = gn(d), o2 = osc('sine', 90, tf, 0.5, g); sw(o2.frequency, tf, 95, 42, 0.25); ad(g.gain, tf, 0.9, 0.004, 0.4);
    const n = gn(d), nf = flt(n, 'lowpass', 500); noi(tf, 0.3, nf); ad(n.gain, tf, 0.5, 0.003, 0.2);
  };
  S.beaconOut = (d, t) => {
    const w = gn(d), am = gn(w, 0.7), wf = flt(am, 'bandpass', 2400, 1.4); noi(t, 2.0, wf); sw(wf.frequency, t, 2600, 110, 1.7);
    osc('sine', 13, t, 2.0, gn(am.gain, 0.3));
    w.gain.setValueAtTime(0.0001, t); w.gain.linearRampToValueAtTime(0.7, t + 0.25); w.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    const lw = gn(d), lf = flt(lw, 'lowpass', 400); noi(t, 1.6, lf, bufBrown); sw(lf.frequency, t, 500, 70, 1.4); ad(lw.gain, t, 0.6, 0.2, 1.3);
    // 패전의 징: 불이 꺼진 자리에 낮게 한 번, 길게
    const td = t + 0.7;
    jing(d, td, 148, 0.62, 8);
    bukHit(d, td, 0.3);
    const a = gn(d), af = flt(a, 'bandpass', 3200, 0.7); noi(td, 2.6, af, bufPink);
    a.gain.setValueAtTime(0.0001, td); a.gain.linearRampToValueAtTime(0.06, td + 1.0); a.gain.exponentialRampToValueAtTime(0.0001, td + 2.6);
  };
  S.ignite = (d, t, p) => {
    whoomp(d, t, 0.75, 0.7 + 0.3 * p);
    grains(d, t + 0.12, 12, 0.9, 0.16, 0.004, 0.02, 1800, 5200, 3, 1);
    const r = gn(d), rf = flt(r, 'bandpass', 420, 0.7); noi(t + 0.1, 1.1, rf); ad(r.gain, t + 0.1, 0.18, 0.15, 0.85);
    // 봉화가 오를 때(p=1)만: 꽹과리가 '갠지갠지 갱—' 하고 반짝인다
    if (p >= 0.999) {
      const ts = [0.3, 0.42, 0.53, 0.63];
      for (let i = 0; i < 4; i++) kkwaeng(d, t + ts[i], 0.07 + 0.015 * i, i & 1 ? 0.07 : 0.18);
      kkwaeng(d, t + 0.74, 0.15, 0.7);
    }
  };
  S.splash = (d, t) => {
    const k = rr(0.85, 1.15);
    const g = gn(d), f = flt(g, 'bandpass', 1300 * k, 0.8); noi(t, 0.4, f); sw(f.frequency, t, 900 * k, 2200 * k, 0.12); ad(g.gain, t, 0.45, 0.012, 0.28);
    const b = gn(d), o = osc('sine', 300 * k, t, 0.1, b); sw(o.frequency, t, 320 * k, 110 * k, 0.07); ad(b.gain, t, 0.4, 0.003, 0.07);
    grains(d, t + 0.08, 5, 0.32, 0.12, 0.006, 0.02, 2000, 4200, 6, 1);
  };

  const DEF = {
    bow: [S.bow, 0.05, 0.18, 1, 0.3, 0.55],
    arrowHit: [S.arrowHit, 0.045, 0.12, 0, 0.15, 0.5],
    cannon: [S.cannon, 0.09, 0.45, 2, 1.6, 0.9],
    explode: [S.explode, 0.08, 0.5, 2, 1.5, 0.85],
    charge: [S.charge, 0.12, 0.3, 0, 0.6, 0.6],
    zap: [S.zap, 0.09, 0.45, 1, 1.1, 0.7],
    clash: [S.clash, 0.06, 0.25, 1, 0.4, 0.55],
    slash: [S.slash, 0.06, 0.15, 1, 0.2, 0.55],
    ratSqueal: [S.ratSqueal, 0.09, 0.2, 0, 0.3, 0.5],
    boneRattle: [S.boneRattle, 0.07, 0.2, 1, 0.45, 0.6],
    squelch: [S.squelch, 0.08, 0.2, 1, 0.45, 0.6],
    batScreech: [S.batScreech, 0.09, 0.3, 0, 0.2, 0.5],
    roar: [S.roar, 0.6, 0.5, 3, 1.5, 0.85],
    bossStep: [S.bossStep, 0.12, 0.35, 2, 0.6, 0.9],
    bossDie: [S.bossDie, 1.0, 0.5, 3, 2.6, 0.9],
    coin: [S.coin, 0.035, 0.15, 0, 0.35, 0.5],
    hammer: [S.hammer, 0.05, 0.2, 0, 0.12, 0.5],
    buildDone: [S.buildDone, 0.12, 0.3, 1, 0.8, 0.65],
    sell: [S.sell, 0.15, 0.25, 1, 0.8, 0.6],
    horn: [S.horn, 1.0, 0.6, 3, 2.3, 0.75],
    hornBoss: [S.hornBoss, 1.5, 0.65, 3, 5.0, 0.8],
    leak: [S.leak, 0.15, 0.45, 2, 1.4, 0.7],
    footmanDie: [S.footmanDie, 0.09, 0.25, 1, 0.5, 0.6],
    uiHover: [S.uiHover, 0.04, 0, 2, 0.06, 0.6],
    uiClick: [S.uiClick, 0.04, 0.05, 3, 0.1, 0.7],
    uiDeny: [S.uiDeny, 0.1, 0.05, 3, 0.25, 0.7],
    crumble: [S.crumble, 1.0, 0.5, 3, 3.4, 0.9],
    rise: [S.rise, 1.0, 0.5, 3, 3.5, 0.85],
    beaconOut: [S.beaconOut, 1.5, 0.6, 3, 5.0, 0.85],
    ignite: [S.ignite, 0.15, 0.35, 2, 1.3, 0.7],
    splash: [S.splash, 0.09, 0.3, 0, 0.5, 0.5],
  };
  const CAP = [16, 22, 28, 34];

  function play(name, pan, gain, p) {
    if (!api.ready) return;
    const df = DEF[name];
    if (!df) return;
    const g = gain === undefined ? 1 : +gain;
    if (!(g > 0.003)) return;
    const now = ctx.currentTime;
    if (now - (last[name] === undefined ? -9 : last[name]) < df[1]) return;
    let c = 0;
    for (let i = ends.length - 1; i >= 0; i--) { if (ends[i] <= now) { ends[i] = ends[ends.length - 1]; ends.pop(); } else c++; }
    if (c >= CAP[df[3]]) return;
    last[name] = now;
    const t = now + 0.006 + rnd() * 0.014;
    const v = voice(+pan || 0, cl(g, 0, 1.5) * df[5], df[2], nSfx);
    V = v;
    try { df[0](v.out, t, cl(+p || 0, 0, 1)); } catch (e) { dbg.err++; dbg.msg = name + ': ' + e; }
    finishVoice(v);
    ends.push(t + df[4]);
  }

  function startBeds() {
    bed.windG = gn(nAmb, 0); bed.windG.connect(gn(nRevIn, 0.12));
    bed.gustG = gn(bed.windG, 0.7);
    for (let i = 0; i < 2; i++) { const lf = flt(flt(panNode(i ? 0.55 : -0.55, bed.gustG), 'highpass', 110, 0.5), 'lowpass', 420, 0.4); loopSrc(bufPink, gn(lf, 2.6), 0.8 + i * 0.13); bed.windLP.push(lf); }
    bed.whG = gn(bed.gustG, 0); bed.whF = flt(bed.whG, 'bandpass', 800, 7); loopSrc(bufPink, gn(bed.whF, 3), 1.0);
    bed.fireG = gn(nAmb, 0);
    const hiss = flt(flt(gn(bed.fireG, 0.1), 'lowpass', 4500), 'highpass', 900); loopSrc(bufWhite, hiss, 1.0);
    const roarG = gn(bed.fireG, 0.32), roarF = flt(flt(roarG, 'highpass', 75, 0.5), 'lowpass', 280, 0.5); loopSrc(bufBrown, roarF, 1.0);
    loopOsc('sine', 6.7, gn(roarG.gain, 0.1)); loopOsc('sine', 2.3, gn(roarG.gain, 0.07));
    bed.popBus = gn(bed.fireG, 2.0); bed.popBus.connect(gn(nRevIn, 0.1));
    bed.droneG = gn(nMusic, 0); bed.droneG.connect(gn(nRevIn, 0.3));
    bed.droneLP = flt(bed.droneG, 'lowpass', 300, 0.6);
    const dv = gn(null, 4); loopOsc('sine', 4.9, dv);
    // 드론(지속음): 으뜸음 둘(맥놀이) + 아래 옥타브 + 위 5도. 전장이 바뀌면 setKey가 으뜸음을 옮긴다.
    const f0 = mtof(mus.key.root); bed.drone = [];
    [[1, -5, 0.5], [1, 6, 0.5], [0.5, 0, 0.3], [1.4983, 3, 0.14]].forEach((a) => { const o = loopOsc('sawtooth', f0 * a[0], gn(bed.droneLP, a[2])); o.detune.value = a[1]; dv.connect(o.detune); bed.drone.push([o, a[0]]); });
    // 불협 드론(진주성): 으뜸음 한 옥타브 위의 반음 윗소리가 거칠게 맥논다
    bed.disG = gn(bed.droneLP, mus.key.dis ? 1 : 0);
    bed.drone.push([loopOsc('sawtooth', f0 * 2.1189, gn(bed.disG, 0.09)), 2.1189]);
  }
  function setKey(name, now) {
    const K = KEYS[name] || KEYS.fen;
    mus.key = K; mus.keyName = name; mus.geo = !!K.geo; mus.deg = 0; mus.pmD = mus.pmG = null;
    if (!bed.disG) return;
    const f0 = mtof(K.root);
    for (let i = 0; i < bed.drone.length; i++) bed.drone[i][0].frequency.setTargetAtTime(f0 * bed.drone[i][1], now, 0.9);
    bed.disG.gain.setTargetAtTime(K.dis ? 1 : 0, now, 1.2);
  }
  function pop() {
    const t = ctx.currentTime + rnd() * 0.08, big = rnd() < 0.12;
    const g = gn(null, 0), f = flt(g, 'bandpass', big ? rr(500, 1100) : rr(1400, 5200), rr(1.5, 6));
    const out = panNode(rr(-0.7, 0.7), bed.popBus); g.connect(out);
    const s = ctx.createBufferSource(); s.buffer = bufWhite; s.connect(f);
    const dur = big ? rr(0.025, 0.05) : rr(0.004, 0.018);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(big ? 0.5 : rr(0.12, 0.4), t + 0.0008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, rnd() * 1.8); s.stop(t + dur + 0.02);
    s.onended = () => { try { g.disconnect(); out.disconnect(); } catch (e) {} };
  }
  function setAmbience(fire, wind, tension) {
    tgt.fire = cl(+fire || 0, 0, 1); tgt.wind = cl(+wind || 0, 0, 1); tgt.tension = cl(+tension || 0, 0, 1);
  }

  // ── 생성 음악: 드론 + 5음 선율(시김새) + 장단 ──
  // 화성 진행은 없다. 지속음 위에서 대금·가야금(거문고)이 5음 음계를 오가고, 긴장도가 오르면 장구·북이 장단을 친다.
  function degMidi(base, d, sc) { const o = Math.floor(d / 5); return base + 12 * o + sc[d - o * 5]; }
  function logNote(inst, t, m) { if (mus.log) mus.log.push([inst, Math.round(t * 1000) / 1000, m]); }

  // 시김새 ① 음높이 꾸밈 — detune(센트)을 움직이므로 배음 전체가 함께 밀린다.
  //   kk: 꺾는 음(윗음에서 잠깐 머물다 뚝 떨어진다) / push: 아래에서 밀어 올림 / fall: 퇴성 / rise: 추성
  function sigim(os, t, dur, o) {
    const bend = o.fall ? -o.fall : o.rise ? o.rise : 0;
    for (let i = 0; i < os.length; i++) {
      const p = os[i].detune;
      if (o.kk) { p.setValueAtTime(o.kk, t); p.setValueAtTime(o.kk, t + o.kkT); p.linearRampToValueAtTime(0, t + o.kkT + 0.03); }
      else if (o.push) { p.setValueAtTime(-o.push, t); p.linearRampToValueAtTime(0, t + 0.06); }
      else p.setValueAtTime(0, t);
      if (bend && dur > 0.3) { const t1 = t + dur - Math.min(0.22, dur * 0.3); p.setValueAtTime(0, t1); p.linearRampToValueAtTime(bend, t + dur + 0.1); }
    }
  }
  // 시김새 ② 농현 — 느리고 깊게, 뒤로 갈수록 더 깊게 떤다.
  function nong(os, t, dur, rate, depth, delay) {
    if (!(depth > 0) || dur < 0.45) return;
    const g = gn(null, 0); osc('sine', rate, t, dur + 0.2, g);
    g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(depth * 0.6, t + delay + (dur - delay) * 0.4); g.gain.linearRampToValueAtTime(depth, t + dur);
    for (let i = 0; i < os.length; i++) g.connect(os[i].detune);
  }
  // 조와 음의 자리에 따라 시김새를 고른다.
  //   계면조: 3음은 굵게 떨고(떠는 음), 5→3은 꺾어 내리고, 맺는 음은 흘려 내린다.
  //   평조: 농현이 얕고 빠르며, 올라가는 긴 음은 끝을 밀어 올린다(추성).
  function orn(sc, d, pm, m, dur, last) {
    const semi = sc[d - Math.floor(d / 5) * 5], o = {};
    const down = pm !== null && m < pm, up = pm !== null && m > pm;
    if (sc === MODE.gye) {
      if (down && (semi === 3 || rnd() < 0.3)) { o.kk = Math.min(300, (pm - m) * 100); o.kkT = semi === 3 ? rr(0.07, 0.11) : rr(0.05, 0.08); }
      else o.push = up ? rr(60, 110) : 107;
      o.nong = semi === 3 ? 44 : semi === 7 ? 36 : semi === 0 ? 16 : 24;
      o.rate = semi === 3 || semi === 7 ? rr(4.2, 4.9) : rr(5, 5.8);
      if (last) o.fall = rr(90, 140); else if (dur > 1.2 && rnd() < 0.45) o.fall = rr(40, 70);
    } else {
      if (down && rnd() < 0.25) { o.kk = Math.min(200, (pm - m) * 100); o.kkT = rr(0.05, 0.08); }
      else o.push = up ? rr(50, 90) : 107;
      o.nong = semi === 0 || semi === 7 ? 22 : 14;
      o.rate = rr(5.2, 6);
      if (last) o.fall = rr(30, 60); else if (up && dur > 0.9 && rnd() < 0.4) o.rise = rr(50, 90);
    }
    if (o.kk) o.kkT = Math.min(o.kkT, dur * 0.35);
    return o;
  }

  // 대금: 삼각파 + 숨소리, 높고 센 음에서는 청(갈대 막)이 운다.
  function daegeum(t, m, dur, vel, o) {
    const f = mtof(m), v = voice(rr(-0.3, 0.05), 1, 0.75, nMusic); V = v;
    logNote('dg', t, m);
    const env = gn(v.out), lp = flt(env, 'lowpass', Math.min(5200, 1500 + f * 3), 0.5), L = dur + 0.4;
    const os = [osc('triangle', f, t, L, gn(lp, 0.8)), osc('sine', f * 2, t, L, gn(lp, 0.2)), osc('sine', f * 3, t, L, gn(lp, 0.07))];
    const ch = cl((m - 60) / 16, 0, 1) * 0.7 + 0.3 * vel;
    os.push(osc('sawtooth', f, t, L, flt(gn(env, 0.4 * ch), 'bandpass', 3000, 2.5)));
    const br = gn(env, 0.09), bf = flt(br, 'bandpass', cl(f * 2.5, 1400, 3200), 0.8); noi(t, L, bf);
    br.gain.setValueAtTime(0.3, t); br.gain.setTargetAtTime(0.09, t + 0.03, 0.05);
    sigim(os, t, dur, o);
    nong(os, t, dur, o.rate || 5.2, o.nong === undefined ? 24 : o.nong, Math.min(0.35, dur * 0.3));
    const a = cl(dur * 0.2, 0.05, 0.13), pk = vel * LV.dg;
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(pk * 0.75, t + a); env.gain.linearRampToValueAtTime(pk, t + dur * 0.6); env.gain.setTargetAtTime(0.0001, t + dur, 0.07);
    finishVoice(v);
  }
  // 가야금: 짧게 뜯고 로우패스가 닫히며 사그라든다. 뜯은 뒤에 농현.
  // 고구려 전장(mus.geo)에서는 거문고: 한 옥타브 안의 낮은 음역, 술대로 내리치는 짧고 단단한 어택, 느리고 굵은 농현.
  function gayageum(t, m, vel, o) {
    const geo = mus.geo;
    if (geo) while (m > mus.key.gy + 12) m -= 12;
    const f = mtof(m), v = voice(rr(-0.05, 0.35), 1, 0.6, nMusic); V = v;
    logNote(geo ? 'geo' : 'gy', t, m);
    const dec = (geo ? 1.7 : 1.25) * Math.pow(261 / f, 0.3) * (o.len || 1);
    const env = gn(v.out), lp = flt(env, 'lowpass', 2000, geo ? 1.4 : 0.9);
    sw(lp.frequency, t, Math.min(geo ? 2600 : 5200, f * (geo ? 6 : 8)), Math.max(260, f * (geo ? 1.3 : 1.7)), dec * 0.45);
    const os = [osc('sawtooth', f, t, dec + 0.1, gn(lp, 0.45)), osc('triangle', f, t, dec + 0.1, gn(lp, 0.6)), osc('sine', f * 2.003, t, dec * 0.6, gn(lp, 0.15))];
    if (o.push) o.push *= 0.35;
    sigim(os, t, Math.min(dec, 0.9), o);
    nong(os, t, dec, geo ? rr(4.3, 5.1) : rr(5.2, 6.4), o.nong === undefined ? (geo ? 30 : 22) : o.nong * (geo ? 1.15 : 0.8), 0.12);
    ad(env.gain, t, vel * (geo ? LV.geo : LV.gy), geo ? 0.002 : 0.004, dec);
    // 뜯는 소리: 가야금은 손끝, 거문고는 술대가 줄과 대모(玳瑁)를 함께 친다
    const n = gn(v.out), nf = flt(n, 'bandpass', geo ? 850 : 2400, geo ? 2 : 1.2); noi(t, 0.05, nf); ad(n.gain, t, vel * (geo ? 0.11 : 0.035), 0.001, geo ? 0.02 : 0.01);
    if (geo) { const g = gn(v.out), b = osc('sine', 150, t, 0.07, g); sw(b.frequency, t, 170, 95, 0.04); ad(g.gain, t, vel * 0.05, 0.001, 0.05); }
    finishVoice(v);
  }
  // 태평소: 톱니+펄스에 콧소리 포먼트 둘, 빠른 농현. 적장전에만, 낮은 음량으로.
  function tpso(t, m, dur, vel, o) {
    const f = mtof(m), v = voice(rr(-0.15, 0.15), 1, 0.5, nMusic); V = v;
    logNote('tp', t, m);
    const env = gn(v.out), src = gn(null, 1), L = dur + 0.25;
    src.connect(flt(env, 'bandpass', 1100, 6)); src.connect(flt(gn(env, 0.7), 'bandpass', 2600, 6)); src.connect(flt(gn(env, 0.25), 'lowpass', 1800, 0.5));
    const os = [osc('sawtooth', f, t, L, gn(src, 0.6)), osc('square', f, t, L, gn(src, 0.3))];
    sigim(os, t, dur, o);
    nong(os, t, dur, rr(6.4, 7.2), Math.min(26, o.nong || 20), 0.05);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(vel * LV.tp, t + 0.02); env.gain.setTargetAtTime(0.0001, t + dur, 0.04);
    finishVoice(v);
  }
  // 장구·북·징·꽹과리를 음악 버스에 올리는 얇은 포장. c: D 덩, K 쿵, T 덕, G 기덕, B 북
  function drum(c, t, vel) {
    logNote(c, t, 0);
    if (c === 'B') { const v = voice(rr(-0.08, 0.08), 1, 0.4, nMusic); V = v; bukHit(v.out, t, vel * LV.buk); finishVoice(v); return; }
    if (c === 'D' || c === 'K') { const v = voice(-0.3, 1, 0.3, nMusic); V = v; kungHit(v.out, t, vel * LV.jg); finishVoice(v); }
    if (c !== 'K') {
      const v = voice(0.3, 1, 0.3, nMusic); V = v;
      if (c === 'G') deokHit(v.out, t - 0.028, vel * LV.jg * 0.5);
      deokHit(v.out, t, vel * LV.jg * (c === 'D' ? 0.7 : 1));
      finishVoice(v);
    }
  }
  function gong(t, f0, peak, dur) { logNote('jing', t, 0); const v = voice(0, 1, 0.6, nMusic); V = v; jing(v.out, t, f0, peak, dur); finishVoice(v); }
  function kk(t, peak, dec) { logNote('kk', t, 0); const v = voice(0.2, 1, 0.35, nMusic); V = v; kkwaeng(v.out, t, peak, dec); finishVoice(v); }

  // 선율 걸음: 한두 칸씩 오르내리되 음역 끝에서는 돌아선다.
  function nextDeg(d, lo, hi) {
    const r = rnd(); let s = r < 0.36 ? -1 : r < 0.72 ? 1 : r < 0.84 ? -2 : r < 0.95 ? 2 : 0;
    if (s > 0 && d >= hi - 1 && rnd() < 0.6) s = -s;
    if (s < 0 && d <= lo + 1 && rnd() < 0.6) s = -s;
    return cl(d + s, lo, hi);
  }
  // 맺는 음: 가까운 으뜸음(또는 5도)으로.
  function cadence(d, lo, hi) {
    const c = rnd() < 0.65 ? [0, 5, 10, -5] : [3, 8, -2];
    let best = 0, bd = 99;
    for (let i = 0; i < c.length; i++) if (c[i] >= lo && c[i] <= hi && Math.abs(c[i] - d) < bd) { bd = Math.abs(c[i] - d); best = c[i]; }
    return best;
  }
  // 장단 없는 때의 한 가락(자유 박): 대금 독주가 주가 되고, 가끔 현이 받는다. 직전 가락을 되받기도 한다.
  function phrase(t) {
    const K = mus.key, sc = MODE[K.mode], dg = rnd() < (mus.turn ? 0.35 : 0.8);
    mus.turn = dg ? 1 : 0;
    const lo = -2, hi = dg ? 7 : 8, rep = !!mus.motif && mus.motif.dg === dg && rnd() < 0.4;
    const n = rep ? mus.motif.st.length : dg ? 3 + ((rnd() * 4) | 0) : 2 + ((rnd() * 4) | 0), st = [];
    let d = cl(mus.deg + (rep ? (rnd() < 0.5 ? 1 : -1) : 0), lo, hi), pm = dg ? mus.pmD : mus.pmG, tt = t;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1; let s = 0, c = 2;
      if (rep) { s = mus.motif.st[i][0]; c = mus.motif.st[i][1]; d = cl(d + s, lo, hi); if (last) d = cadence(d, lo, hi); }
      else {
        if (last) d = cadence(d, lo, hi); else if (i) { const p = d; d = nextDeg(d, lo, hi); s = d - p; }
        if (!last) c = rnd() < 0.45 ? 0 : 1;
      }
      st.push([s, c]);
      if (dg) {
        let m = degMidi(K.dg, d, sc); while (m > 81) m -= 12;
        const dur = (c === 2 ? rr(2.2, 3.4) : c === 0 ? rr(0.4, 0.75) : rr(0.9, 1.7)) * K.slow;
        daegeum(tt, m, dur, rr(0.7, 1), orn(sc, d, pm, m, dur, last));
        pm = m; tt += dur * (last ? 1 : 0.97);
      } else {
        const m = degMidi(K.gy, d, sc), gap = (c === 2 ? 1.8 : c === 0 ? rr(0.28, 0.45) : rr(0.6, 1.1)) * K.slow, o = orn(sc, d, pm, m, gap, last);
        if (c === 0) o.nong = 0;
        gayageum(tt, m, rr(0.6, 1), o);
        pm = m; tt += gap;
      }
    }
    mus.motif = { dg: dg, st: st }; mus.deg = d;
    if (dg) mus.pmD = pm; else mus.pmG = pm;
    return tt;
  }
  // 다스름: 새 전장의 조를 알린다. 현이 으뜸–5도–옥타브를 짚고 대금이 으뜸음을 길게 분다.
  function dasreum(t) {
    const K = mus.key, sc = MODE[K.mode], ds = [0, 3, 5], ts = [0, 0.55, 1.05];
    for (let i = 0; i < 3; i++) gayageum(t + ts[i] * K.slow, degMidi(K.gy, ds[i], sc), 0.65 + 0.15 * i, { nong: i === 2 ? 34 : 0 });
    const m = degMidi(K.dg, 0, sc), dur = 2.8 * K.slow;
    daegeum(t + 1.7 * K.slow, m, dur, 0.85, { push: 107, nong: sc === MODE.gye ? 30 : 20, rate: 5 });
    mus.deg = 0; mus.pmD = m; mus.hold = t + 2.5; mus.phraseAt = t + 1.7 * K.slow + dur + rr(3, 6);
  }
  // 승전: 휘모리 두 마디에 꽹과리 '갱 · 갠지 갱 · 갠지', 징으로 열고 징으로 맺는다. 선율은 평조로 달려 올라간다.
  function winGarak(t) {
    const K = mus.key, sc = MODE.pyeong, sl = 0.165, pat = 'D.TK.TK.';
    gong(t, 176, LV.jing, 5.5);
    for (let i = 0; i < 16; i++) {
      const s = i & 7, ti = t + i * sl + rr(-0.006, 0.006), c = pat[s], roll = i >= 12;
      if (c !== '.') drum(c, ti, (c === 'D' ? 0.26 : c === 'K' ? 0.2 : 0.15) * (s === 0 ? 1.1 : 0.9));
      if (!(s & 1) || roll) drum('B', ti, roll ? 0.16 + 0.04 * (i - 12) : s === 0 ? 0.28 : 0.2);
      if (s === 0 || s === 4) kk(ti, LV.kk, 0.5); else if (s === 2 || s === 6) kk(ti, LV.kk * 0.75, 0.22); else if (s === 3 || s === 7) kk(ti, LV.kk * 0.5, 0.09);
      if (i >= 8 && !(s & 1)) gayageum(ti, degMidi(K.gy, (s >> 1) + 1, sc), 0.7, { nong: 0, len: 0.6 });
    }
    const te = t + 16 * sl;
    gong(te, 176, LV.jing * 1.15, 6.5); drum('D', te, 0.3); drum('B', te, 0.32); kk(te, LV.kk, 0.7);
    gayageum(te, degMidi(K.gy, 5, sc), 0.9, { nong: 26 });
    let m = degMidi(K.dg, 5, sc); while (m > 81) m -= 12;
    daegeum(te + 0.05, m, 2.4, 0.85, { push: 107, nong: 20, rate: 5.6 });
    mus.deg = 0; mus.pmD = mus.pmG = null;
  }
  // 패전: 대금이 계면조로 내려앉는다(떠는 음 → 꺾는 음 → 흘려 내리는 으뜸음). 맺는 음 아래로 낮은 현 한 번.
  function lament(t) {
    const K = mus.key, sc = MODE.gye, ds = [3, 2, 1, 0], du = [1.5, 0.6, 1.3, 3.2];
    let tt = t, pm = null;
    for (let i = 0; i < 4; i++) {
      const m = degMidi(K.dg, ds[i], sc), dur = du[i] * K.slow;
      if (i === 3) gayageum(tt, degMidi(K.gy, 0, sc), 0.7, { nong: 0 });
      daegeum(tt, m, dur, i === 3 ? 0.85 : 0.75, orn(sc, ds[i], pm, m, dur, i === 3));
      pm = m; tt += dur * 0.97;
    }
    mus.deg = 0; mus.pmD = pm;
  }

  // 장단(덩=D, 쿵=K, 덕=T, 기덕=G). 자진모리 12칸(♩.≈96), 휘모리 8칸(♩≈150). 네 마디째는 잔가락으로 몬다.
  const JAJIN = ['D..K..K.TK..', 'D..K..K.TK..', 'D..T..K.TK..', 'D.TK..K.TK..', 'D..K..K.GK..'], JAJIN_FILL = ['D.TK.TK.TK..', 'D..K.TK.TKT.'];
  const HWI = ['D.TK.TK.', 'D.TK.TK.', 'D.TKTTK.', 'DTTK.TK.'], HWI_FILL = ['D.TKTKTK', 'DTTKTTKT'];
  // 한 마디의 선율 계획: [칸, 악기(g 현 / d 대금 / t 태평소), 음계 칸, 길이(칸 수), 세기, 맺음]
  const RIFF = [[0, 3, 6, 9], [0, 6, 8, 9], [0, 3, 6, 8, 9], [3, 6, 9], [0, 2, 3, 6, 9], [0, 6, 9]];
  const TRIFF = [[0, 2, 3, 4, 6], [0, 2, 4, 6], [0, 3, 4, 6, 7], [0, 1, 2, 4, 6]];
  function planBar(hw) {
    const P = mus.plan, b4 = mus.bar & 3, h = mus.heat;
    P.length = 0;
    if (hw) {
      // 휘모리: 낮은 현이 정박을 짚고 태평소가 짧게 몰아친다
      P.push([0, 'g', 0, 4, 0.8, 0]);
      if (b4 === 3) for (let i = 0; i < 4; i++) P.push([4 + i, 'g', i, 1, 0.55 + 0.08 * i, 0]);
      else if (rnd() < 0.8) P.push([4, 'g', rnd() < 0.6 ? 3 : -2, 4, 0.65, 0]);
      if (b4 === 0 || b4 === 2) {
        const r = TRIFF[(rnd() * TRIFF.length) | 0]; let d = cl(mus.deg, 2, 7);
        for (let i = 0; i < r.length; i++) { if (i) d = nextDeg(d, 2, 7); P.push([r[i], 't', d, (i < r.length - 1 ? r[i + 1] : 8) - r[i], rr(0.7, 1), 0]); }
        mus.deg = d;
      } else if (b4 === 1) { const d = rnd() < 0.5 ? 5 : 3; P.push([0, 't', d, 5, 0.9, 0]); P.push([6, 't', d + 1, 2, 0.7, 0]); mus.deg = d + 1; }
      else P.push([0, 't', 5, 6, 0.95, 1]);
      return;
    }
    // 자진모리: 현이 장구 가락을 따라 뜯고, 대금이 긴 음으로 얹힌다
    if (rnd() < 0.55 + 0.4 * h) {
      const r = RIFF[(rnd() * RIFF.length) | 0]; let d = cl(mus.deg, -2, 6);
      for (let i = 0; i < r.length; i++) {
        const last = i === r.length - 1;
        if ((b4 === 3 && last) || (r[i] === 0 && rnd() < 0.5)) d = cadence(d, -2, 6); else if (i) d = nextDeg(d, -2, 6);
        P.push([r[i], 'g', d, (last ? 12 : r[i + 1]) - r[i], rr(0.55, 0.9) * (r[i] === 0 ? 1.1 : 1), 0]);
      }
      mus.deg = d;
    }
    if (b4 === 1 && rnd() < 0.65) { const s = rnd() < 0.5 ? 0 : 6; P.push([s, 'd', [3, 5, 7, 8][(rnd() * 4) | 0], s ? 6 : 8, 0.8, 0]); }
    else if (b4 === 3 && rnd() < 0.5) { const top = rnd() < 0.5 ? 7 : 8; P.push([0, 'd', top, 3, 0.75, 0]); P.push([3, 'd', top - 1, 3, 0.7, 0]); P.push([6, 'd', 5, 6, 0.85, 1]); }
  }
  // 마디 머리: 긴장도로 장단을 고른다(들고 날 때의 문턱을 달리해 오락가락하지 않게).
  function beginBar(t) {
    const h = mus.heat, want = h >= (mus.mode === 2 ? 0.6 : 0.72) ? 2 : h >= (mus.mode ? 0.17 : 0.27) ? 1 : 0;
    if (!want) {
      if (mus.mode > 0) drum('D', t, 0.16);   // 덩 한 번으로 장단을 닫는다
      mus.mode = 0; mus.plan.length = 0; mus.phraseAt = t + rr(2.5, 5);
      return;
    }
    if (want !== mus.mode) { mus.mode = want; mus.bar = 0; }
    const hw = want === 2, fill = (mus.bar & 3) === 3, set = hw ? (fill ? HWI_FILL : HWI) : (fill ? JAJIN_FILL : JAJIN);
    mus.steps = hw ? 8 : 12;
    mus.stepLen = hw ? 30 / (140 + 12 * h) : 20 / (90 + 16 * h);
    mus.pat = mus.bar === 0 ? set[0] : set[(rnd() * set.length) | 0];
    planBar(hw);
    mus.bar++;
  }
  function playStep(t) {
    const s = mus.step, c = mus.pat[s], hw = mus.mode === 2, k = 0.55 + 0.5 * mus.heat;
    // 격자에서 살짝 밀고 당긴다(±8ms), 강박은 세게
    if (c !== '.') drum(c, t + rr(-0.008, 0.008), (c === 'D' ? 0.26 : c === 'K' ? 0.2 : 0.15) * k * (s === 0 ? 1.1 : rr(0.78, 0.95)));
    if (hw) { if (!(s & 1)) drum('B', t + rr(-0.006, 0.006), (s === 0 ? 0.3 : s === 4 ? 0.24 : 0.19) * k); }
    else if (mus.heat > 0.45 && (s === 0 || s === 6)) drum('B', t + rr(-0.006, 0.006), (s === 0 ? 0.2 : 0.14) * k);
    const P = mus.plan, K = mus.key, sc = MODE[K.mode];
    for (let i = 0; i < P.length; i++) {
      const e = P[i]; if (e[0] !== s) continue;
      const dur = e[3] * mus.stepLen;
      if (e[1] === 'g') {
        const m = degMidi(K.gy, e[2], sc), o = orn(sc, e[2], mus.pmG, m, dur, false);
        o.len = hw ? 0.6 : 0.8; if (e[3] < 3) o.nong = 0;
        gayageum(t, m, e[4], o); mus.pmG = m;
      } else {
        let m = degMidi(K.dg, e[2], sc); while (m > 81) m -= 12;
        const o = orn(sc, e[2], mus.pmD, m, dur, !!e[5]);
        if (e[1] === 'd') daegeum(t, m, dur * 0.95, e[4], o); else tpso(t, m, dur * 0.9, e[4], o);
        mus.pmD = m;
      }
    }
  }
  function musicTick(now) {
    if (mus.intro) { mus.intro = false; dasreum(now + 0.6); }
    if (now < mus.hold) return;
    if (mus.mode === 0) {
      if (mus.heat >= 0.27) { mus.mode = -1; mus.step = 0; mus.bar = 0; mus.stepAt = now + 0.15; }
      else {
        if (now > mus.phraseAt - 0.2 && (!gs.ok || gs.phase === 'play')) mus.phraseAt = phrase(Math.max(mus.phraseAt, now + 0.1)) + rr(4.5, 9) * mus.key.slow;
        return;
      }
    }
    if (mus.stepAt < now - 1) { mus.step = 0; mus.stepAt = now + 0.1; }   // 오래 멈췄다 돌아오면 마디 머리부터
    let n = 0;
    while (mus.stepAt < now + 0.4 && n++ < 24) {
      if (mus.step === 0) { beginBar(mus.stepAt); if (mus.mode === 0) return; }
      if (mus.stepAt > now - 0.1) playStep(Math.max(mus.stepAt, now + 0.02));
      mus.stepAt += mus.stepLen; mus.step = (mus.step + 1) % mus.steps;
    }
  }
  // 긴장도에 따라 드론을 키우고 연다.
  function applyHeat(now) {
    if (Math.abs(mus.heat - app.heat) < 0.004) return;
    app.heat = mus.heat;
    bed.droneG.gain.setTargetAtTime(LV.drone0 + LV.drone1 * mus.heat, now, 0.3);
    bed.droneLP.frequency.setTargetAtTime(270 + 230 * mus.heat, now, 0.3);
    nMusic.gain.setTargetAtTime(0.5 + 0.15 * mus.heat, now, 0.3);
  }
  // 게임 상태(G)를 읽어 조·긴장도·사건을 정한다. 본체는 tension(적장 생존)만 넘기므로 나머지는 여기서 읽는다.
  function conduct(now) {
    try {
      const B = G.B;
      gs.key = B.bio.key; gs.era = B.bio.era || ''; gs.phase = G.phase; gs.n = G.mons.length; gs.sp = !!G.spawning; gs.bw = !!G.bossWave;
      gs.lr = G.maxLives > 0 ? G.lives / G.maxLives : 1; gs.ok = true;
    } catch (e) { gs.ok = false; }
    let h = cur.tension;
    if (gs.ok) {
      if (gs.key !== mus.keyName) setKey(gs.key, now);
      if (gs.era) mus.geo = gs.era === 'goguryeo';   // 고구려 전장의 현악기는 거문고
      if (gs.phase !== 'play') h = 0;
      else {
        let b = 0.06 + 0.5 * cl(gs.n / 26, 0, 1) + (gs.sp ? 0.08 : 0) + (gs.bw ? 0.1 : 0);
        if (gs.lr < 0.4) b += 0.45 * (1 - gs.lr / 0.4);   // 봉화가 위태롭다
        h = Math.max(b, cur.tension);
      }
      if (gs.phase !== mus.phase) {
        const was = mus.phase; mus.phase = gs.phase;
        if (was) {
          if (gs.phase === 'clear') { mus.mode = 0; mus.plan.length = 0; winGarak(now + 0.12); mus.hold = now + 5; }
          else if (gs.phase === 'defeat') { mus.mode = 0; mus.plan.length = 0; lament(now + 1.6); mus.hold = now + 9; }
          else if (gs.phase === 'play' && was === 'rise') dasreum(now + 0.6);
        }
      }
    }
    // 프레임이 아니라 오디오 시계로 따라간다(프레임이 느려도 장단이 제때 든다)
    const adt = cl(now - mus.tPrev, 0, 1); mus.tPrev = now;
    mus.heat += (cl(h, 0, 1) - mus.heat) * (1 - Math.exp(-adt * 1.4));
    applyHeat(now);
  }
  function sync() { api.ready = !!ctx && ctx.state === 'running'; }
  function build() {
    sr = ctx.sampleRate;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -8; lim.knee.value = 4; lim.ratio.value = 16; lim.attack.value = 0.002; lim.release.value = 0.18;
    lim.connect(ctx.destination);
    const sh = (dest, type, f, g, q) => { const b = flt(dest, type, f, q); b.gain.value = g; return b; };
    nMaster = gn(sh(sh(sh(flt(flt(rawOut ? ctx.destination : lim, 'highpass', 32, 0.7), 'highpass', 32, 0.7), 'highshelf', 3000, 6), 'peaking', 1200, 3, 0.7), 'lowshelf', 180, -10), 0); nMaster.gain.setValueAtTime(0.0001, ctx.currentTime); nMaster.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.6);
    nMute = gn(nMaster, api.muted ? 0 : 1);
    nSfx = gn(nMute, 1); nAmb = gn(nMute, 0.9); nMusic = gn(nMute, 0.5);
    makeBuffers();
    const conv = ctx.createConvolver(); conv.buffer = makeImpulse();
    conv.connect(gn(nMute, 0.5));
    nRevIn = gn(null, 1); nRevIn.connect(flt(conv, 'highpass', 120));
    startBeds();
    mus.mode = 0; mus.hold = 0; mus.plan.length = 0; mus.intro = true; mus.phraseAt = ctx.currentTime + 8;
  }
  function unlock() {
    if (!ctx) {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return false;
      try { ctx = new AC(); build(); ctx.onstatechange = sync; }
      catch (e) { try { if (ctx && ctx.close) ctx.close(); } catch (e2) {} ctx = null; api.ready = false; return false; }
    }
    if (ctx.state !== 'running' && ctx.resume) { const pr = ctx.resume(); if (pr && pr.then) pr.then(sync, () => {}); }
    sync();
    return api.ready;
  }
  let pausedByPage = false;
  function setPaused(b) {
    if (!ctx) return;
    if (b && ctx.state === 'running') { pausedByPage = true; if (ctx.suspend) ctx.suspend(); }
    else if (!b && pausedByPage) { pausedByPage = false; if (ctx.resume) { const pr = ctx.resume(); if (pr && pr.then) pr.then(sync, () => {}); } }
  }
  function setMuted(b) {
    api.muted = !!b;
    if (ctx && nMute) nMute.gain.setTargetAtTime(api.muted ? 0 : 1, ctx.currentTime, 0.06);
  }
  function setP(key, param, v, now) { if (Math.abs(v - app[key]) > 0.004) { app[key] = v; param.setTargetAtTime(v, now, 0.12); } }
  function update(dt) {
    if (!ctx) return;
    sync();
    if (!api.ready) return;
    dt = cl(+dt || 0.016, 0, 0.1);
    const now = ctx.currentTime, k = 1 - Math.exp(-dt * 2.5);
    cur.fire += (tgt.fire - cur.fire) * k; cur.wind += (tgt.wind - cur.wind) * k; cur.tension += (tgt.tension - cur.tension) * k;
    setP('fire', bed.fireG.gain, cur.fire, now);
    setP('wind', bed.windG.gain, cur.wind, now);
    bed.timer -= dt;
    if (bed.timer <= 0) {
      bed.timer = rr(2, 5);
      sweep(now);
      const tc = rr(1.2, 3), f = rr(200, 520) * (0.7 + 0.6 * cur.wind);
      for (let i = 0; i < bed.windLP.length; i++) bed.windLP[i].frequency.setTargetAtTime(f * rr(0.85, 1.15), now, tc);
      bed.gustG.gain.setTargetAtTime(rr(0.45, 1.0), now, tc);
      const w = rnd(); bed.whG.gain.setTargetAtTime(w * w * 0.3, now, tc); bed.whF.frequency.setTargetAtTime(rr(600, 1100), now, tc);
    }
    if (cur.fire > 0.02) {
      bed.popAcc += dt * (1.5 + 13 * cur.fire);
      let n = 0;
      while (bed.popAcc >= 1 && n++ < 4) { bed.popAcc -= rr(0.5, 1.5); pop(); }
      if (bed.popAcc > 4) bed.popAcc = 0;
    }
    // 음악이 잘못되어도 게임 루프는 멈추지 않게 한다. 오류는 dbg()로 드러난다.
    try { conduct(now); musicTick(now); } catch (e) { dbg.err++; dbg.msg = 'music: ' + (e && e.stack || e); }
  }

  // ── 검증 훅 (window.__au) ──
  // 헤드리스에서는 소리를 들을 수 없으므로 OfflineAudioContext로 렌더해 피크·RMS·NaN을 잰다.
  //   __au.test('horn', { key: 'frost' })            효과음 하나
  //   __au.test('music', { key: 'fen', heat: 0.5, secs: 30 })   음악(heat→heat1로 긴장도 변화)
  //   __au.test('win' | 'lament' | 'dasreum', { key })
  //   옵션 raw: 리미터를 건너뛴 값
  function stats(what, o, rate, buf, notes, root) {
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, win = (rate * 0.5) | 0;
    let pk = 0, sq = 0, nan = 0, clip = 0, lastI = 0, wsq = 0, wmax = 0;
    for (let i = 0; i < n; i++) {
      const a = L[i], b = R[i];
      if (a !== a || b !== b) { nan++; continue; }
      const m = Math.max(Math.abs(a), Math.abs(b));
      if (m > pk) pk = m;
      if (m >= 0.999) clip++;
      if (m > 0.002) lastI = i;
      sq += a * a + b * b; wsq += a * a + b * b;
      if (i % win === win - 1) { if (wsq > wmax) wmax = wsq; wsq = 0; }
    }
    const r3 = (x) => Math.round(x * 1000) / 1000, cnt = {}, pcs = {}; let seq = '';
    for (let i = 0; i < notes.length; i++) {
      const e = notes[i]; cnt[e[0]] = (cnt[e[0]] || 0) + 1;
      if (e[2]) pcs[(((e[2] - root) % 12) + 12) % 12] = 1; else if (e[0].length === 1 && e[0] !== 'B' && seq.length < 40) seq += e[0];
    }
    return { what: what, key: o.key || 'fen', raw: !!o.raw, peak: r3(pk), rms: r3(Math.sqrt(sq / (2 * n))), rmsMax: r3(Math.sqrt(wmax / (2 * win))), nan: nan, clip: clip, tail: r3(lastI / rate), cnt: cnt, pcs: Object.keys(pcs).map(Number).sort((a, b) => a - b), seq: seq };
  }
  function test(what, o) {
    o = o || {};
    const OC = typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext);
    if (!OC) return Promise.resolve({ what: what, error: 'no OfflineAudioContext' });
    const secs = +o.secs || 6, rate = 44100, notes = [];
    const sv = [ctx, sr, nMaster, nMute, nSfx, nAmb, nMusic, nRevIn, bufWhite, bufPink, bufBrown, V, api.ready, gs.ok, app.heat];
    const bedS = Object.assign({}, bed), musS = Object.assign({}, mus), planS = mus.plan;
    let oc = null, error = '', root = 0;
    try {
      oc = new OC(2, Math.ceil(secs * rate), rate);
      inTest = true; rawOut = !!o.raw; ctx = oc; bed.windLP = []; bed.drone = []; bed.disG = null; mus.plan = []; mus.motif = null; gs.ok = false; app.heat = -1;
      setKey(o.key || 'fen', 0); root = mus.key.root;
      build();
      nMaster.gain.cancelScheduledValues(0); nMaster.gain.setValueAtTime(0.5, 0); nMute.gain.value = 1;
      mus.log = notes; mus.intro = false;
      if (DEF[what]) { const df = DEF[what], v = voice(0, (o.gain === undefined ? 1 : +o.gain) * df[5], df[2], nSfx); V = v; df[0](v.out, 0.1, cl(+o.p || 0, 0, 1)); finishVoice(v); }
      else if (what === 'win') winGarak(0.1);
      else if (what === 'lament') lament(0.1);
      else if (what === 'dasreum') dasreum(0.1);
      else if (what === 'music') {
        const h0 = +o.heat || 0, h1 = o.heat1 === undefined ? h0 : +o.heat1;
        mus.phraseAt = 0.5;
        for (let now = 0; now < secs - 0.4; now += 0.05) { mus.heat = h0 + (h1 - h0) * now / secs; applyHeat(now); musicTick(now); }
      } else error = 'unknown: ' + what;
    } catch (e) { error = String(e && e.stack || e); }
    [ctx, sr, nMaster, nMute, nSfx, nAmb, nMusic, nRevIn, bufWhite, bufPink, bufBrown, V, api.ready, gs.ok, app.heat] = sv;
    Object.assign(bed, bedS); Object.assign(mus, musS); mus.plan = planS; inTest = false; rawOut = false;
    if (error) return Promise.resolve({ what: what, error: error });
    return oc.startRendering().then((buf) => stats(what, o, rate, buf, notes, root));
  }
  api.test = test;
  api.dbg = () => ({ ready: api.ready, key: mus.keyName, mode: mus.key.mode, geo: mus.geo, jangdan: mus.mode, heat: Math.round(mus.heat * 100) / 100, bar: mus.bar, phase: mus.phase, live: dbg.live, made: dbg.made, swept: dbg.swept, ends: ends.length, err: dbg.err, msg: dbg.msg, t: ctx ? Math.round(ctx.currentTime * 10) / 10 : 0 });
  if (typeof window !== 'undefined') window.__au = api;
  return api;
})();
