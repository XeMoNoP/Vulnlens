// SCENE 2 — SAAS DESIGN & DEVELOPMENT (4–10 s). References: @daniel_haida (product UI is the hero,
// one idea per shot, object-led transitions) and @HowDevelop (15 s launch pacing; every transition
// demonstrates something; no fake dashboards → this interface is visibly marked DEMO DATA).
// 2A: the dashboard's lime top bezel continues the flipped blade's lime edge, the window swings up
// to face camera, the chart draws on and one real UI state changes (7D → 30D).
// 2B: a few controlled depth layers; the chart line lifts off the screen and becomes the VR horizon.
import { CUE } from './cues.js';
import { HAND } from './handoff.js';
import { E, inv, lerp, clamp, el, css, C, FONT, mixHex, springRemain } from '../src/lib.js';
import { EDGE, TILT } from './s1.js';

const W = 1600, H = 800, SB = 250;
const star = (s, f) => `<svg width="${s}" height="${s}" viewBox="${LOGO.star.cx - LOGO.star.r} ${LOGO.star.cy - LOGO.star.r} ${LOGO.star.r * 2} ${LOGO.star.r * 2}"><path fill="${f}" fill-rule="evenodd" d="${LOGO.star.d}"/></svg>`;
// demo series (clearly synthetic): deploys per day
const S7 = [5, 8, 6, 9, 7, 11, 9];
const S30 = [3, 4, 6, 5, 7, 6, 8, 7, 5, 6, 8, 9, 7, 8, 6, 9, 10, 8, 7, 9, 11, 9, 8, 10, 12, 10, 9, 11, 10, 12];
const N = 60, resample = (a) => Array.from({ length: N }, (_, i) => { const x = i / (N - 1) * (a.length - 1), j = Math.floor(x), f = x - j; return a[j] + (a[Math.min(j + 1, a.length - 1)] - a[j]) * f; });
const R7 = resample(S7), R30 = resample(S30);
const CW = 1210, CH = 300;

export function initS2({ stage }) {
  const root = el('div', { class: 'layer', id: 's2' }, stage);
  root.innerHTML = `
  <style>
    #s2 { font-family:${FONT.body}; color:${C.ink}; }
    #s2 .light { position:absolute; inset:0; background: radial-gradient(ellipse 120% 90% at 30% 10%, rgba(255,255,255,.95), rgba(255,255,255,0) 65%); }
    #s2 .cam { position:absolute; inset:0; perspective:2015px; perspective-origin:960px 540px; }
    #s2 .win { position:absolute; left:${960 - W / 2}px; top:0; width:${W}px; height:${H}px; transform-origin:50% 0; transform-style:preserve-3d; }
    #s2 .base { position:absolute; inset:0; background:#fff; border:2px solid ${C.hair}; border-top:7px solid ${C.lime}; border-radius:20px; box-shadow:0 50px 100px -40px rgba(11,16,32,.35),0 14px 34px -14px rgba(11,16,32,.14); }
    #s2 .bar { position:absolute; left:0; right:0; top:0; height:62px; background:${C.sweep}; border-bottom:1px solid ${C.hair}; border-radius:14px 14px 0 0; }
    #s2 .dots i { position:absolute; top:24px; width:14px; height:14px; border-radius:7px; background:#D9DCE1; }
    #s2 .url { position:absolute; left:${W / 2 - 240}px; top:15px; width:480px; height:34px; border-radius:17px; background:#fff; border:1px solid ${C.hair}; font:400 16px ${FONT.mono}; color:#8A8F98; line-height:34px; text-align:center; }
    #s2 .demo { position:absolute; right:24px; top:14px; height:34px; padding:0 14px; border-radius:8px; border:1.5px solid ${C.ink}; font:500 16px ${FONT.mono}; letter-spacing:1.5px; line-height:32px; }
    #s2 .side { position:absolute; left:0; top:69px; width:${SB}px; bottom:0; background:#FBFBFC; border-right:1px solid ${C.hair}; border-radius:0 0 0 18px; }
    #s2 .brand { position:absolute; left:30px; top:28px; display:flex; gap:12px; align-items:center; font:600 24px ${FONT.head}; }
    #s2 .nav { position:absolute; left:16px; top:96px; width:${SB - 32}px; }
    #s2 .nav div { height:46px; border-radius:10px; display:flex; align-items:center; gap:14px; padding-left:16px; margin-bottom:8px; font-size:21px; color:${C.grey}; }
    #s2 .nav div i { width:16px; height:16px; border-radius:5px; background:#C9CDD3; }
    #s2 .nav .on { background:#fff; border:1px solid ${C.hair}; color:${C.ink}; } #s2 .nav .on i { background:${C.ink}; }
    #s2 .main { position:absolute; left:${SB}px; right:0; top:69px; bottom:0; transform-style:preserve-3d; }
    #s2 .h1 { position:absolute; left:44px; top:28px; font:600 46px ${FONT.head}; letter-spacing:-1px; }
    #s2 .seg { position:absolute; right:44px; top:34px; width:312px; height:52px; border-radius:26px; background:#F1F2F4; }
    #s2 .seg span { position:absolute; top:0; width:104px; height:52px; display:flex; align-items:center; justify-content:center; font:600 20px ${FONT.body}; z-index:1; }
    #s2 .seg .ind { position:absolute; top:4px; height:44px; border-radius:22px; background:${C.ink}; }
    #s2 .mets { position:absolute; left:44px; right:44px; top:112px; height:150px; display:flex; gap:24px; transform-style:preserve-3d; }
    #s2 .met { flex:1; border:1px solid ${C.hair}; border-radius:16px; background:#fff; padding:20px 26px; box-sizing:border-box; }
    #s2 .met small { display:block; font:500 20px ${FONT.body}; color:${C.grey}; }
    #s2 .met b { display:block; margin-top:10px; font:600 54px ${FONT.head}; letter-spacing:-1.5px; font-variant-numeric:tabular-nums; }
    #s2 .chartc { position:absolute; left:44px; right:44px; top:286px; height:${CH + 120}px; border:1px solid ${C.hair}; border-radius:16px; background:#fff; }
    #s2 .chartc h3 { position:absolute; left:26px; top:18px; margin:0; font:600 24px ${FONT.head}; }
    #s2 .chartc svg { position:absolute; left:40px; top:78px; overflow:visible; }
    #s2 .title { position:absolute; left:0; right:0; top:912px; text-align:center; }
    #s2 .title .chip { display:inline-block; background:${C.lime}; font:500 18px ${FONT.mono}; letter-spacing:1.5px; padding:5px 11px; border-radius:6px; }
    #s2 .title span.t { display:block; margin-top:8px; font:600 42px ${FONT.head}; letter-spacing:-1px; }
    #s2 .mono { position:absolute; left:0; right:0; top:70px; text-align:center; font:400 20px ${FONT.mono}; letter-spacing:2px; color:${C.grey}; }
    #s2 .cursor { position:absolute; }
    #s2 .hz { position:absolute; inset:0; overflow:visible; }
  </style>
  <div class="light"></div>
  <div class="cam"><div class="win">
    <div class="base"><div class="bar"><span class="dots"><i style="left:22px"></i><i style="left:46px"></i><i style="left:70px"></i></span><div class="url">app.workspace.example/releases</div><div class="demo">DEMO DATA</div></div></div>
    <div class="side"><div class="brand"><span style="width:30px;height:30px;border-radius:9px;background:${C.ink};display:inline-block"></span>Workspace</div><div class="nav">${['Overview', 'Releases', 'Projects', 'Team', 'Settings'].map((n, i) => `<div class="${i === 1 ? 'on' : ''}"><i></i>${n}</div>`).join('')}</div></div>
    <div class="main">
      <div class="h1">Release overview</div>
      <div class="seg"><div class="ind"></div><span style="left:0">7D</span><span style="left:104px">30D</span><span style="left:208px">90D</span></div>
      <div class="mets">${['Deploys', 'Median build', 'Uptime'].map((l, i) => `<div class="met m${i}"><small>${l}</small><b>—</b></div>`).join('')}</div>
      <div class="chartc"><h3>Deploys per day</h3>
        <svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
          ${[0, 1, 2, 3].map(i => `<line x1="0" x2="${CW}" y1="${i * CH / 3}" y2="${i * CH / 3}" stroke="#ECEEF1"/>`).join('')}
          <path class="area" fill="${C.lime}" fill-opacity=".38"/>
          <path class="line" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
          <circle class="dot" r="9" fill="${C.lime}" stroke="${C.ink}" stroke-width="3"/>
        </svg>
        <div class="ax" style="position:absolute;left:40px;right:40px;bottom:14px;display:flex;justify-content:space-between;font:400 16px ${FONT.mono};color:${C.grey}"></div>
      </div>
    </div>
  </div></div>
  <svg class="hz" width="1920" height="1080"><path class="hzg" fill="none" stroke="${C.lime}" stroke-width="16" stroke-linecap="round"/><path class="hzl" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/></svg>
  <div class="title"><span class="chip">01 / SAAS</span><span class="t">SaaS Design &amp; Development</span></div>
  <div class="mono">WEB APPS · DASHBOARDS · PLATFORMS</div>
  <svg class="cursor" width="52" height="66" viewBox="0 0 44 56"><path d="M2 2 L2 44 L13 33 L21 52 L29 48 L21 30 L37 30 Z" fill="${C.ink}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const win = q('.win'), base = q('.base'), side = q('.side'), main = q('.main'), mets = q('.mets'), chartc = q('.chartc'), h1 = q('.h1'), seg = q('.seg'), ind = q('.ind');
  const line = q('.line'), area = q('.area'), dot = q('.dot'), ax = q('.ax'), title = q('.title'), mono = q('.mono'), cursor = q('.cursor'), hzl = q('.hzl'), hzg = q('.hzg');
  const metB = qa('.met b'), navs = qa('.nav div'), metEls = qa('.met');

  // pose of the window: x, y = screen position of its top-centre; s scale; rx, ry, rz degrees
  const [ax0, ay0, bx0, by0] = EDGE;
  const P0 = { x: (ax0 + bx0) / 2, y: (ay0 + by0) / 2, s: Math.hypot(bx0 - ax0, by0 - ay0) / W, rx: TILT, ry: 0, rz: Math.atan2(by0 - ay0, bx0 - ax0) * 180 / Math.PI };
  const P1 = { x: 960, y: 104, s: 1, rx: 3, ry: -2, rz: 0 };
  const P2 = { x: 960, y: 104, s: 1.035, rx: 3, ry: -2, rz: 0 };
  const P3 = { x: 1010, y: -70, s: 1.2, rx: 2, ry: -2, rz: 0 };      // closer on metrics + chart (phone-readable)
  const P4 = { x: 1060, y: 60, s: 0.94, rx: 14, ry: -20, rz: 0 };     // 3/4 view with depth layers
  const P5 = { x: 960, y: 40, s: 1.0, rx: 0, ry: 0, rz: 0 };          // frontal for the lift
  const Lp = (a, b, k) => Object.fromEntries(Object.keys(a).map(n => [n, lerp(a[n], b[n], k)]));
  function pose(t) {
    if (t < CUE.swing[1]) return Lp(P0, P1, E.soft(inv(CUE.swing[0], CUE.swing[1], t)));
    if (t < CUE.push2[0]) return Lp(P1, P2, E.soft(inv(CUE.swing[1], CUE.push2[0], t)));
    if (t < CUE.push2[1]) return Lp(P2, P3, E.inOut(inv(CUE.push2[0], CUE.push2[1], t)));
    if (t < CUE.layers[1]) return Lp(P3, P4, E.inOut(inv(CUE.layers[0], CUE.layers[1], t)));
    if (t < CUE.lift[0]) return Lp(P4, { ...P4, ry: -22, x: 1040 }, E.soft(inv(CUE.layers[1], CUE.lift[0], t)));
    return Lp({ ...P4, ry: -22, x: 1040 }, P5, E.inOut(inv(CUE.lift[0], CUE.lift[0] + 0.55, t)));
  }

  const chartPath = (vals, flat, ext) => {
    const max = 13, pts = vals.map((v, i) => [i / (N - 1) * CW, CH - v / max * CH]);
    const mean = pts.reduce((a, p) => a + p[1], 0) / N;
    return pts.map(([x, y]) => [lerp(x, lerp(-ext, CW + ext, x / CW), flat), lerp(y, CH * 0.5, flat)]);
  };
  const dStr = (p) => p.map((v, i) => `${i ? 'L' : 'M'}${v[0].toFixed(1)} ${v[1].toFixed(1)}`).join(' ');

  function update(t) {
    const on = t >= 4 && t < 10.05;
    root.style.display = on ? '' : 'none';
    if (!on) return null;
    const p = pose(t);
    win.style.transform = `translate3d(${p.x - 960}px, ${p.y}px, 0) rotateZ(${p.rz}deg) rotateX(${-p.rx}deg) rotateY(${p.ry}deg) scale(${p.s})`;

    // UI arrives (2–4 frames apart, premium settle)
    const arr = (e, t0, dy = 14) => { const a = E.out(inv(t0, t0 + 0.5, t)); css(e, { opacity: String(a), transform: `translateY(${(1 - a) * dy}px)` }); };
    navs.forEach((n, i) => arr(n, CUE.ui + i * 0.05)); arr(h1, CUE.ui + 0.04); arr(seg, CUE.ui + 0.1);
    metEls.forEach((m, i) => arr(m, CUE.ui + 0.12 + i * 0.07, 18));

    // range state 7D → 30D at CUE.range: indicator springs, chart morphs, numbers change
    const r = t >= CUE.range ? 1 - springRemain(t - CUE.range, 15, 0.86) : 0;
    css(ind, { left: `${4 + 104 * r}px`, width: '96px' });
    qa('.seg span').forEach((s, i) => { s.style.color = (i === (r > 0.5 ? 1 : 0)) ? '#fff' : C.ink; });
    const m = E.inOut(inv(CUE.range, CUE.range + 0.6, t));
    const vals = R7.map((v, i) => lerp(v, R30[i], m));
    const vsets = [['48', '196'], ['3m 12s', '3m 04s'], ['99.9%', '99.95%']];
    metB.forEach((b, i) => { b.textContent = m < 0.5 ? vsets[i][0] : vsets[i][1]; b.style.opacity = String(m < 0.5 ? 1 - inv(0.3, 0.5, m) : inv(0.5, 0.7, m)); b.style.transform = `translateY(${m < 0.5 ? -8 * inv(0.3, 0.5, m) : 8 * (1 - inv(0.5, 0.7, m))}px)`; });
    ax.innerHTML = (m < 0.5 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Oct 19', 'Oct 26', 'Nov 2', 'Nov 9', 'Nov 16']).map(s => `<span>${s}</span>`).join('');
    ax.style.opacity = String((m < 0.5 ? 1 - inv(0.3, 0.5, m) : inv(0.5, 0.7, m)) * (1 - inv(CUE.lift[0], CUE.lift[0] + 0.2, t)));

    // chart: draw-on, then (lift) flatten and extend into the horizon
    const flat = E.inOut(inv(CUE.lift[0] + 0.15, CUE.lift[1], t)), ext = 900 * E.inOut(inv(CUE.lift[0] + 0.3, CUE.lift[1] + 0.05, t));
    const pts = chartPath(vals, flat, ext);
    const draw = E.inOut(inv(CUE.chart[0], CUE.chart[1], t));
    const nd = Math.max(2, Math.round(N * draw));
    const vis = pts.slice(0, nd);
    line.setAttribute('d', dStr(vis));
    area.setAttribute('d', `${dStr(vis)} L${vis[vis.length - 1][0]} ${CH} L0 ${CH} Z`);
    area.style.opacity = String(1 - inv(CUE.lift[0], CUE.lift[0] + 0.3, t));
    const end = vis[vis.length - 1]; dot.setAttribute('cx', end[0]); dot.setAttribute('cy', end[1]); dot.style.opacity = String(draw * (1 - inv(CUE.lift[0], CUE.lift[0] + 0.2, t)));

    // depth layers (2B), and everything but the chart line falls away during the lift
    const L = E.out(inv(CUE.layers[0], CUE.layers[0] + 1.0, t)), fall = E.in(inv(CUE.lift[0], CUE.lift[0] + 0.6, t));
    side.style.transform = `translateZ(${70 * L}px) translateY(${fall * 1100}px)`;
    mets.style.transform = `translateZ(${140 * L}px) translateY(${fall * 1000}px)`;
    chartc.style.transform = `translateZ(${230 * L * (1 - fall)}px)`;
    chartc.style.boxShadow = `0 ${30 * L}px ${70 * L}px -30px rgba(11,16,32,${0.3 * L})`;
    const cardFade = inv(CUE.lift[0] + 0.25, CUE.lift[0] + 0.6, t);
    chartc.style.background = `rgba(255,255,255,${1 - cardFade})`; chartc.style.borderColor = `rgba(229,231,235,${1 - cardFade})`;
    chartc.querySelector('h3').style.opacity = String(1 - cardFade); qa('.chartc line').forEach(l => l.style.opacity = String(1 - cardFade));
    base.style.transform = `translateY(${fall * 1150}px)`; h1.style.visibility = seg.style.visibility = fall > 0.6 ? 'hidden' : '';
    line.style.stroke = C.ink; line.style.strokeWidth = String(lerp(5, 5, flat));

    // hand-over: a flat overlay line takes the chart line's screen position and settles on the horizon
    const ho = t >= CUE.horizon[0];
    line.style.visibility = ho ? 'hidden' : '';
    if (ho) {
      const rr = line.getBoundingClientRect(), sr = stage.getBoundingClientRect(), sc = sr.width / 1920;
      const y0 = (rr.top + rr.height / 2 - sr.top) / sc, x0 = (rr.left - sr.left) / sc, x1 = (rr.right - sr.left) / sc;
      const k2 = E.out(inv(CUE.horizon[0], CUE.horizon[1], t));
      const y = lerp(y0, HAND.horizonY, k2);
      const dd = `M${lerp(x0, -20, k2)} ${y} L${lerp(x1, 1940, k2)} ${y}`;
      hzl.setAttribute('d', dd); hzg.setAttribute('d', dd);
      hzl.style.opacity = hzg.style.opacity = '1';
    } else hzl.style.opacity = hzg.style.opacity = '0';

    // cursor clicks 30D
    const ca = Math.min(inv(CUE.cursorS2[0], CUE.cursorS2[0] + 0.15, t), 1 - inv(CUE.cursorS2[1] - 0.1, CUE.cursorS2[1], t));
    const segR = seg.getBoundingClientRect(), sR = stage.getBoundingClientRect(), sc2 = sR.width / 1920;
    const tx = (segR.left - sR.left) / sc2 + 156 * p.s, ty = (segR.top - sR.top) / sc2 + 30 * p.s;
    const kk = E.inOut(inv(CUE.cursorS2[0], CUE.range - 0.04, t));
    const click = 1 - 0.15 * Math.max(0, 1 - Math.abs(t - CUE.range) / 0.07);
    css(cursor, { left: `${lerp(1500, tx, kk)}px`, top: `${lerp(980, ty, kk)}px`, opacity: String(ca), transform: `scale(${click})` });

    const ti = E.out(inv(CUE.titleS2[0], CUE.titleS2[0] + 0.6, t)), to = E.in(inv(CUE.titleS2[1], CUE.titleS2[1] + 0.25, t));
    css(title, { opacity: String(ti * (1 - to)), transform: `translateY(${(1 - ti) * 26 + to * 20}px)` });
    css(mono, { opacity: String(Math.min(E.out(inv(7.2, 7.7, t)), 1 - inv(8.8, 9.1, t))) });

    const dusk = E.inOut(inv(CUE.lift[0] + 0.2, 10.0, t));
    q('.light').style.opacity = '1';
    return { bg: `linear-gradient(180deg, ${mixHex('#FFFFFF', '#F2F4F8', dusk)} 0%, ${mixHex('#FAFBFC', '#FFFFFF', dusk)} ${lerp(62, 48, dusk)}%, ${mixHex('#F1F3F6', '#FFFFFF', dusk)} 100%)` };
  }
  return { update };
}
