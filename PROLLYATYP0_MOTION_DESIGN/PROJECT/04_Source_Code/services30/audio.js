// SCORE v2 (30 s services film): original, synthesised with the Web Audio API and rendered
// offline (sample-exact, reproducible; no third-party audio).
// Premium electronic at 120 BPM in F minor (i–VI–III–VII: Fm · D♭ · A♭ · E♭, one chord per bar).
// Arrangement follows the picture: tense intro → drop on the SaaS cut (4 s) → wide half-time VR
// section → build into the AR shrink (14 s) → full groove for UI/UX (18 s) → drop and Prollyatyp0
// three-note motif (F5 · C6 · A♭5) for the brand resolve → final hit on the lockup (28.5 s) and a clean tail.
import { CUE, DURATION } from './cues.js';

export async function renderScore() {
  const SR = 48000, Q = CUE, Q4 = CUE.s4, BEAT = 0.5, S16 = BEAT / 4;
  const ac = new OfflineAudioContext(2, SR * DURATION, SR);
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const noise = ac.createBuffer(2, SR * 2, SR);
  for (let c = 0; c < 2; c++) { const d = noise.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  const ir = ac.createBuffer(2, SR * 2.6, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < d.length; i++) { lp = lp * 0.5 + (rnd() * 2 - 1) * 0.5; d[i] = lp * Math.pow(1 - i / d.length, 2.2) * (i < 400 ? i / 400 : 1); } }

  // ── buses: drums / music (side-chained to the kick) / fx → glue → limiter
  const master = ac.createGain(); master.gain.setValueAtTime(0.85, 0); master.gain.setValueAtTime(0.85, 29.0); master.gain.linearRampToValueAtTime(0.0001, DURATION - 0.01);
  const glue = ac.createDynamicsCompressor(); Object.assign(glue, {}); glue.threshold.value = -16; glue.ratio.value = 2.5; glue.attack.value = 0.01; glue.release.value = 0.2; glue.knee.value = 8;
  const lim = ac.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 16; lim.attack.value = 0.001; lim.release.value = 0.08;
  master.connect(glue); glue.connect(lim); lim.connect(ac.destination);
  const verb = ac.createConvolver(); verb.buffer = ir; const vOut = ac.createGain(); vOut.gain.value = 0.5; verb.connect(vOut); vOut.connect(master);
  const drums = ac.createGain(); drums.gain.value = 0.95; drums.connect(master);
  const music = ac.createGain(); music.gain.value = 1; music.connect(master);
  const fx = ac.createGain(); fx.gain.value = 0.85; fx.connect(master);
  // music-bus filter: sweeps for builds and the half-time VR section
  const mFilt = ac.createBiquadFilter(); mFilt.type = 'lowpass'; mFilt.Q.value = 0.8; mFilt.connect(music);
  const mf = mFilt.frequency;
  mf.setValueAtTime(500, 0); mf.exponentialRampToValueAtTime(5200, 3.95); mf.setValueAtTime(16000, 4.0);
  mf.setValueAtTime(16000, 9.0); mf.exponentialRampToValueAtTime(2400, 10.0); mf.setValueAtTime(1800, 10.0); mf.exponentialRampToValueAtTime(9000, 13.95);
  mf.setValueAtTime(900, 14.4); mf.exponentialRampToValueAtTime(14000, 17.95); mf.setValueAtTime(16000, 18.0);
  mf.setValueAtTime(16000, 27.2); mf.exponentialRampToValueAtTime(1400, 28.45); mf.setValueAtTime(16000, 28.5);
  const music2 = mFilt; // everything melodic goes through the sweep filter

  const out = (node, bus, pan = 0, send = 0) => { const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(bus); if (send) { const s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } };
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, Math.max(0, t)); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const nz = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, (t * 0.37) % 1.7); s.stop(t + dur + 0.05); return s; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const duck = music.gain;
  const kicks = [];

  // ── drums
  function kick(t, amp = 1) {
    kicks.push(t);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.07); o.frequency.exponentialRampToValueAtTime(44, t + 0.35);
    env(g, t, 0.002, 0.95 * amp, 0.34); o.connect(g); out(g, drums); o.start(t); o.stop(t + 0.42);
    const n = nz(t, 0.02), hp = filt('highpass', 3000), cg = ac.createGain(); env(cg, t, 0.0005, 0.25 * amp, 0.012); n.connect(hp); hp.connect(cg); out(cg, drums);   // click
  }
  function clap(t, amp = 1) {
    for (const d of [0, 0.011, 0.023]) { const n = nz(t + d, 0.25), bp = filt('bandpass', 1500, 1.1), g = ac.createGain(); env(g, t + d, 0.002, (d ? 0.18 : 0.32) * amp, d === 0.023 ? 0.18 : 0.03); n.connect(bp); bp.connect(g); out(g, drums, 0, 0.35); }
  }
  function hat(t, amp = 1, open = false, pan = 0.15) {
    const n = nz(t, open ? 0.3 : 0.05), hp = filt('highpass', 8200), g = ac.createGain(); env(g, t, 0.001, (open ? 0.11 : 0.085) * amp, open ? 0.22 : 0.035); n.connect(hp); hp.connect(g); out(g, drums, pan, 0.06);
  }
  function snareRoll(t0, t1) { for (let t = t0, i = 0; t < t1 - 0.01; i++) { const k = (t - t0) / (t1 - t0); clap(t, 0.25 + 0.75 * k * k); t += k < 0.5 ? BEAT / 2 : k < 0.8 ? BEAT / 4 : BEAT / 8; } }

  // ── bass, pluck arp, stabs, pad
  function bass(t, note, dur, amp = 0.32) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), lp = filt('lowpass', 900, 3), g = ac.createGain();
    o.type = 'sawtooth'; o2.type = 'sine'; o.frequency.value = midi(note); o2.frequency.value = midi(note - 12);
    lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(260, t + dur * 0.8);
    env(g, t, 0.006, amp, dur); o.connect(lp); o2.connect(g); lp.connect(g); out(g, music2);
    [o, o2].forEach(x => { x.start(t); x.stop(t + dur + 0.05); });
  }
  function pluck(t, note, amp = 0.09, pan = 0) {
    const o = ac.createOscillator(), lp = filt('lowpass', 4000, 6), g = ac.createGain(); o.type = 'square'; o.frequency.value = midi(note);
    lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    env(g, t, 0.002, amp, 0.2); o.connect(lp); lp.connect(g); out(g, music2, pan, 0.28); o.start(t); o.stop(t + 0.25);
  }
  function stab(t, notes, amp = 0.12) {
    for (const [i, n] of notes.entries()) for (const det of [-9, 9]) {
      const o = ac.createOscillator(), lp = filt('lowpass', 3000, 2), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
      lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.3);
      env(g, t, 0.004, amp / notes.length, 0.32); o.connect(lp); lp.connect(g); out(g, music2, (i - 1) * 0.35, 0.4); o.start(t); o.stop(t + 0.4);
    }
  }
  function pad(t0, t1, notes, amp = 0.05, pan = 0) {
    for (const [i, n] of notes.entries()) for (const det of [-7, 7]) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(amp / notes.length, t0 + 0.25); g.gain.setValueAtTime(amp / notes.length, Math.max(t0 + 0.26, t1 - 0.2)); g.gain.linearRampToValueAtTime(0.0001, t1 + 0.3);
      o.connect(g); out(g, music2, pan + (i - 1.5) * 0.3, 0.5); o.start(t0); o.stop(t1 + 0.35);
    }
  }
  function bell(t, note, amp = 0.16, dur = 1.8, pan = 0) {
    const f = midi(note), car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
    mod.connect(mg); mg.connect(car.frequency); env(g, t, 0.003, amp, dur); car.connect(g); out(g, music, pan, 0.6);
    car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
  }

  // ── fx
  function riser(t0, t1, amp = 0.16) {
    const n = nz(t0, t1 - t0), bp = filt('bandpass', 400, 1.2), g = ac.createGain();
    bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(9000, t1);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t1 - 0.02); g.gain.linearRampToValueAtTime(0.0001, t1);
    n.connect(bp); bp.connect(g); out(g, fx, 0, 0.3);
    const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
    const lp = filt('lowpass', 1800); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(amp * 0.25, t1 - 0.02); og.gain.linearRampToValueAtTime(0.0001, t1);
    o.connect(lp); lp.connect(og); out(og, fx, 0, 0.3); o.start(t0); o.stop(t1 + 0.02);
  }
  function downlifter(t, dur = 0.8, amp = 0.12) {
    const n = nz(t, dur), bp = filt('bandpass', 6000, 1), g = ac.createGain(); bp.frequency.setValueAtTime(7000, t); bp.frequency.exponentialRampToValueAtTime(200, t + dur);
    env(g, t, 0.01, amp, dur); n.connect(bp); bp.connect(g); out(g, fx, 0, 0.5);
  }
  function impact(t, amp = 0.6) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2);
    env(g, t, 0.004, amp, 1.4); o.connect(g); out(g, fx); o.start(t); o.stop(t + 1.6);
    const n = nz(t, 1.6), lp = filt('lowpass', 3000), ng = ac.createGain(); lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(150, t + 1.2);
    env(ng, t, 0.003, amp * 0.3, 1.3); n.connect(lp); lp.connect(ng); out(ng, fx, 0, 0.8);
  }
  function whoosh(t, dur = 0.5, amp = 0.12, pan = 0) {
    const n = nz(t, dur + 0.1), bp = filt('bandpass', 400, 0.9), g = ac.createGain(); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.7); bp.frequency.exponentialRampToValueAtTime(900, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + dur * 0.65); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); out(g, fx, pan, 0.4);
  }
  function tick(t, f = 5200, amp = 0.07, pan = 0) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; env(g, t, 0.001, amp, 0.08); o.connect(g); out(g, fx, pan, 0.3); o.start(t); o.stop(t + 0.12); }
  function click(t, amp = 0.12, pan = 0, f = 3200) { const n = nz(t, 0.03), bp = filt('bandpass', f, 2.2), g = ac.createGain(); env(g, t, 0.0008, amp, 0.025); n.connect(bp); bp.connect(g); out(g, fx, pan, 0.08); }

  // ── harmony
  const CH = [[65, 68, 72], [61, 65, 68], [68, 72, 75], [63, 67, 70]];   // Fm, D♭, A♭, E♭ (one per 2 s bar)
  const ROOT = [41, 37, 44, 39];
  const chordAt = (t) => Math.floor(t / 2) % 4;
  const arpPat = [0, 1, 2, 3, 2, 1, 0, 2];  // 3 = octave of the root

  // S1 (0–4): tense, filtered arpeggio rising into the drop
  impact(0.0, 0.45);
  for (let t = 0; t < 4 - 1e-6; t += S16) { const c = CH[chordAt(t)], i = Math.round(t / S16); const n = arpPat[i % 8] === 3 ? c[0] + 12 : c[arpPat[i % 8]]; pluck(t, n, 0.05 + 0.04 * t / 4, (i % 2 ? 0.25 : -0.25)); }
  pad(0, 4, [53, 60, 65, 68], 0.045);
  [1.0, 1.25, 1.5, 1.62].forEach((t, i) => tick(t, 6000 - i * 400, 0.06, -0.4 + i * 0.25));
  riser(2.0, 4.0, 0.18); snareRoll(3.0, 4.0); whoosh(Q.flip[1] - 0.5, 0.5, 0.1);

  // full groove helper
  function groove(t0, t1, { kickAmp = 1, claps = true, hats = true, openHats = false, bassOn = true, arp = true, half = false, stabs = false } = {}) {
    for (let t = t0; t < t1 - 1e-6; t += S16) {
      const i = Math.round(t / S16), c = CH[chordAt(t)], r = ROOT[chordAt(t)];
      const onBeat = i % 4 === 0, beatIdx = Math.round(t / BEAT);
      if (onBeat && (!half || beatIdx % 2 === 0)) kick(t, kickAmp);
      if (claps && onBeat && beatIdx % 2 === 1 && !half) clap(t);
      if (claps && half && onBeat && beatIdx % 4 === 2) clap(t, 0.8);
      if (hats && i % 2 === 1) hat(t + (i % 4 === 3 ? 0.012 : 0), i % 4 === 3 ? 1 : 0.6, false, (i % 4 === 1 ? -0.2 : 0.2));
      if (openHats && i % 4 === 2) hat(t, 0.9, true, 0.3);
      if (bassOn && (i % 4 === 2 || (i % 8 === 7))) bass(t, r + (i % 8 === 7 ? 12 : 0), 0.22);
      if (arp) { const n = arpPat[i % 8] === 3 ? c[0] + 12 : c[arpPat[i % 8]]; pluck(t, n + 12 * (half ? 0 : (i % 16 > 11 ? 1 : 0)), 0.06, (i % 2 ? 0.3 : -0.3)); }
      if (stabs && i % 16 === 0) stab(t, c.map(n => n - 12), 0.13);
    }
  }

  // S2 (4–10): the drop — full groove; open hats from the layer shot; build into the VR handoff
  impact(4.0, 0.5); stab(4.0, CH[2].map(n => n - 12), 0.16); downlifter(4.0, 1.0, 0.08);
  groove(4.0, 7.0);
  groove(7.0, 9.0, { openHats: true, stabs: true });
  groove(9.0, 10.0, { claps: false, openHats: false, arp: true });
  snareRoll(9.0, 10.0); riser(8.5, 10.0, 0.2);
  click(Q.range, 0.16); tick(Q.range + 0.02, 4400, 0.06);
  // S3 (10–14): wide half-time VR section; (14–18) AR: build back up
  impact(10.0, 0.55); downlifter(10.0, 1.2, 0.1);
  pad(10, 14, [49, 56, 61, 65, 68], 0.07);
  groove(10.0, 13.0, { half: true, hats: true, bassOn: true, arp: true });
  groove(13.0, 14.0, { half: false, claps: false, bassOn: false, arp: true });
  riser(13.0, 14.0, 0.17); snareRoll(13.5, 14.0);
  Q.panels.forEach((t, i) => bell(t, [80, 84][i], 0.06, 0.8, i ? 0.6 : -0.6));
  impact(14.0, 0.5); whoosh(14.0, 0.8, 0.14); downlifter(14.4, 0.6, 0.12);
  pad(14.4, 18, [53, 60, 65, 68], 0.05);
  groove(15.0, 17.0, { claps: false, openHats: false, bassOn: true, arp: true });
  groove(17.0, 18.0, { claps: true, bassOn: true, arp: true, openHats: true });
  bell(Q.arUI[0], 77, 0.06, 0.6, -0.3); bell(Q.arUI[0] + 0.12, 80, 0.06, 0.6, 0.3);
  click(Q.select, 0.16, 0.2, 1800); tick(Q.select + 0.01, 1500, 0.06);
  for (let i = 0; i < 6; i++) click(Q.rotate[0] + i * 0.15, 0.04, 0.3, 3800);
  riser(17.0, 18.0, 0.18); whoosh(Q.carry[0], 0.6, 0.1);
  // S4 (18–24): full energy, every UI action on a hit
  impact(18.0, 0.45); stab(18.0, CH[1].map(n => n - 12), 0.15);
  groove(18.0, 21.0);
  groove(21.0, 23.0, { openHats: true, stabs: true });
  groove(23.0, 24.0, { claps: false });
  snareRoll(23.0, 24.0); riser(22.5, 24.0, 0.2);
  click(Q4.button, 0.1); click(Q4.click, 0.16); click(Q4.toggle + 0.05, 0.1); click(Q4.drag[0], 0.08); click(Q4.drag[1] + 0.02, 0.12, 0.1, 2400); click(Q4.card - 0.02, 0.14);
  [0, 1, 2, 3, 4, 5].forEach(i => tick(Q4.system[0] + 0.55 + i * 0.07, 5200 + i * 260, 0.04, [-0.5, 0.5, -0.3, 0.3, -0.6, 0.6][i]));
  // S5 (24–30): drop with the motif; drums out for the settle; final hit on the lockup
  impact(24.0, 0.6); stab(24.0, CH[0].map(n => n - 12), 0.17);
  groove(24.0, 27.0, { openHats: true, stabs: false });
  groove(27.0, 27.2, { claps: false, hats: false, arp: false });
  Q.dock.forEach((t, i) => tick(t, 6800, 0.045, [0.5, 0.4, -0.4, -0.5, -0.3, 0.3][i]));
  Q.motif.forEach((t, i) => bell(t, [77, 84, 80][i], 0.2, 1.9, [-0.2, 0.2, 0][i]));
  pad(24.0, 28.5, [53, 60, 65, 68, 72], 0.06);
  riser(27.2, 28.5, 0.16); whoosh(Q.settle[0], 0.5, 0.08);
  impact(Q.resolve, 0.75); kick(Q.resolve, 1.1); clap(Q.resolve, 1);
  stab(Q.resolve, [53, 60, 65, 68], 0.2); pad(Q.resolve, 29.6, [41, 53, 60, 65, 68, 72], 0.08);
  bell(Q.resolve, 77, 0.17, 1.6, -0.2); bell(Q.resolve + 0.25, 84, 0.13, 1.4, 0.2); bell(Q.resolve + 0.5, 80, 0.12, 1.2);

  // side-chain: music breathes with every kick
  duck.setValueAtTime(1, 0);
  for (const k of kicks.sort((a, b) => a - b)) { duck.setValueAtTime(1, Math.max(0, k - 0.002)); duck.linearRampToValueAtTime(0.42, k + 0.012); duck.setTargetAtTime(1, k + 0.03, 0.07); }

  return ac.startRendering();
}
