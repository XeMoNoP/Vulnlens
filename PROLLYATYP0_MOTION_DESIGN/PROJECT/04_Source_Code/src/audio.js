// SCORE — original, synthesised with the Web Audio API and rendered offline (sample-exact,
// reproducible; no third-party audio). 120 BPM in F minor. Quiet and precise: soft pads,
// a low pulse, one soft whoosh per real scene change, clicks only on real on-screen actions,
// and the Prollyatyp0 three-note motif (F5 · C6 · A♭5) from the brand film at the resolve.
// Every event is scheduled from CUE, the same sheet that drives the picture.
import { CUE, DURATION } from './cues.js';

export async function renderScore() {
  const SR = 48000, Q = CUE, Q4 = CUE.s4;
  const ac = new OfflineAudioContext(2, SR * DURATION, SR);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const noise = ac.createBuffer(2, SR * 2, SR);
  for (let c = 0; c < 2; c++) { const d = noise.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  const ir = ac.createBuffer(2, SR * 3, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < d.length; i++) { lp = lp * 0.6 + (rnd() * 2 - 1) * 0.4; d[i] = lp * Math.pow(1 - i / d.length, 2.4) * (i < 600 ? i / 600 : 1); } }

  const master = ac.createGain(); master.gain.value = 0.9;
  master.gain.setValueAtTime(0.9, 14.4); master.gain.linearRampToValueAtTime(0.0, DURATION - 0.01);
  const shelf = ac.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 8000; shelf.gain.value = -3;
  const glue = ac.createDynamicsCompressor(); glue.threshold.value = -18; glue.ratio.value = 2; glue.attack.value = 0.02; glue.release.value = 0.25;
  const lim = ac.createDynamicsCompressor(); lim.threshold.value = -3; lim.ratio.value = 14; lim.attack.value = 0.002; lim.release.value = 0.1;
  master.connect(shelf); shelf.connect(glue); glue.connect(lim); lim.connect(ac.destination);
  const verb = ac.createConvolver(); verb.buffer = ir; const vOut = ac.createGain(); vOut.gain.value = 0.55; verb.connect(vOut); vOut.connect(master);
  const music = ac.createGain(); music.gain.value = 0.85; music.connect(master);
  const sfx = ac.createGain(); sfx.gain.value = 0.9; sfx.connect(master);

  const out = (node, bus, pan = 0, send = 0) => { const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(bus); if (send) { const s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } };
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, Math.max(0, t)); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const nz = (t, dur) => { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, (t * 0.37) % 1.7); s.stop(t + dur + 0.05); return s; };
  const filt = (type, f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };

  // ── instruments
  function pad(t0, t1, notes, amp = 0.05, cutoff = 1400, pan = 0) {
    for (const [i, n] of notes.entries()) for (const det of [-6, 6]) {
      const o = ac.createOscillator(), g = ac.createGain(), lp = filt('lowpass', cutoff, 0.5);
      o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(amp / notes.length, t0 + 0.35); g.gain.setValueAtTime(amp / notes.length, t1 - 0.3); g.gain.linearRampToValueAtTime(0.0001, t1 + 0.4);
      o.connect(lp); lp.connect(g); out(g, music, pan + (i - 1) * 0.25, 0.5); o.start(t0); o.stop(t1 + 0.5);
    }
  }
  function sub(t, amp = 0.35, f = 49) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); env(g, t, 0.005, amp, 0.32); o.connect(g); out(g, music); o.start(t); o.stop(t + 0.45); }
  function impact(t, amp = 0.5) { sub(t, amp, 41); const n = nz(t, 1.2), lp = filt('lowpass', 900), g = ac.createGain(); lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(180, t + 0.9); env(g, t, 0.01, amp * 0.18, 0.9); n.connect(lp); lp.connect(g); out(g, sfx, 0, 0.6); }
  function tick(t, f = 5200, amp = 0.09, pan = 0) { const o = ac.createOscillator(), g = ac.createGain(), m = ac.createOscillator(), mg = ac.createGain(); o.type = 'sine'; o.frequency.value = f; m.frequency.value = f * 1.41; mg.gain.value = f * 0.6; m.connect(mg); mg.connect(o.frequency); env(g, t, 0.001, amp, 0.12); o.connect(g); out(g, sfx, pan, 0.35); o.start(t); m.start(t); o.stop(t + 0.2); m.stop(t + 0.2); }
  function click(t, amp = 0.12, pan = 0, f = 3200) { const n = nz(t, 0.03), bp = filt('bandpass', f, 2.2), g = ac.createGain(); env(g, t, 0.0008, amp, 0.025); n.connect(bp); bp.connect(g); out(g, sfx, pan, 0.08); }
  function whoosh(t, dur = 0.5, amp = 0.12, pan = 0) { const n = nz(t, dur + 0.1), bp = filt('bandpass', 400, 0.9), g = ac.createGain(); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.7); bp.frequency.exponentialRampToValueAtTime(900, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(amp, t + dur * 0.65); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); out(g, sfx, pan, 0.4); }
  function bell(t, note, amp = 0.16, dur = 1.6, pan = 0) {
    const f = midi(note), car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
    mod.connect(mg); mg.connect(car.frequency); env(g, t, 0.004, amp, dur); car.connect(g); out(g, music, pan, 0.6);
    car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
  }
  function ping(t, note, pan) { bell(t, note, 0.06, 0.7, pan); }
  function swell(t0, t1, amp = 0.1) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(55, t0); o.frequency.exponentialRampToValueAtTime(38, t1); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(amp, (t0 + t1) / 2); g.gain.linearRampToValueAtTime(0.0001, t1); o.connect(g); out(g, music); o.start(t0); o.stop(t1 + 0.05); }

  // ── harmony per scene (F minor family), restrained
  pad(0.0, 2.05, [53, 60, 67], 0.045, 900);           // S1 Fm(add9) — dark, low cutoff
  pad(2.0, 6.05, [56, 63, 67, 72], 0.05, 1800);        // S2 A♭maj7 — open, brighter
  pad(6.0, 10.05, [49, 56, 63, 68], 0.06, 1100, 0);    // S3 D♭ add9 — wide, reverberant
  pad(10.0, 13.05, [51, 58, 63, 67], 0.035, 2200);     // S4 E♭ — light, dry
  pad(13.0, 15.0, [53, 56, 60, 65], 0.055, 1500);      // S5 Fm resolve

  // low pulse on the beat (S2–S4), very quiet; none in S1 and the hold
  for (let b = 2.0; b < 12.9; b += 0.5) sub(b, b >= 6 && b < 8 ? 0.16 : 0.12);

  // ── S1
  impact(0.0, 0.45);
  for (const t of Q.facetLand) tick(t, 6200 - (t - 1) * 1400, 0.07, (t - 1.3) * 1.2);
  tick(Q.flip[0], 3600, 0.08); whoosh(1.62, 0.38, 0.07);
  // ── S2
  tick(2.0, 2600, 0.1); bell(2.0, 72, 0.05, 0.9);
  [2.12, 2.24, 2.36, 2.5].forEach((t, i) => click(t, 0.05, -0.3 + i * 0.2, 2600 + i * 300));
  click(Q.titleS2[0], 0.06); swell(4.0, 5.4, 0.06); click(Q.modal + 0.1, 0.07, 0.3);
  whoosh(5.5, 0.5, 0.12);
  // ── S3
  impact(6.0, 0.25);
  Q.panelsS3.forEach((t, i) => ping(t, [80, 84][i], i ? 0.6 : -0.6));
  swell(7.9, 8.8, 0.12); whoosh(8.0, 0.65, 0.1);
  Q.arPanels.forEach((t, i) => ping(t, [77, 80][i], i ? 0.5 : -0.5));
  click(Q.pinch, 0.14, 0.2, 1800); tick(Q.pinch + 0.01, 1500, 0.05);
  whoosh(9.6, 0.4, 0.08);
  // ── S4 (dry, close)
  click(Q4.click1, 0.14); tick(Q4.check, 4200, 0.07); click(Q4.toggle, 0.08);
  click(Q4.drag[0], 0.07); click(Q4.drag[1] + 0.02, 0.1, 0.1, 2400); click(Q4.tabClick, 0.12); click(11.82, 0.1);
  for (let i = 0; i < 14; i++) click(Q4.type[0] + i * (Q4.type[1] - Q4.type[0]) / 14, 0.035, (i % 2 ? 0.15 : -0.15), 4200 + (i % 3) * 300);
  click(Q4.enter, 0.14, 0, 2200);
  bell(Q4.toast, 79, 0.06, 0.6); bell(Q4.toast + 0.08, 84, 0.05, 0.8);
  // ── S5
  whoosh(12.85, 0.45, 0.09);
  Q.motif.forEach((t, i) => bell(t, [77, 84, 80][i], 0.17, 1.8, [-0.2, 0.2, 0][i]));
  Q.dock.forEach((t, i) => tick(t, 7000, 0.035, [-0.5, 0.5, 0.5, -0.5][i]));
  impact(14.0, 0.18);
  pad(14.0, 15.0, [65, 68, 72], 0.04, 2400);

  return ac.startRendering();
}
