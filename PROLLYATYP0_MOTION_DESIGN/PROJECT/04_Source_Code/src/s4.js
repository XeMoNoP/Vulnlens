// SCENE 4 — UI/UX DESIGN (10–13 s). Reference: @TheGrootDev (one shape, never cut; cursor-driven
// morphs; closed-form springs; separate enter/exit timing for content).
// The "Publish" button carried from S3 is one persistent element. Its size, radius and colour
// are sums of closed-form springs, so every frame is a pure function of time. States:
// button → loader → check → toggle (drag) → tabs → search → command palette → toast → check circle.
import { CUE } from './cues.js';
import { E, inv, tw, lerp, clamp, el, css, C, FONT, springSeq, spring, hex, rgb, win } from './lib.js';

export function initS4({ stage }) {
  const Q = CUE.s4;
  const root = el('div', { class: 'layer', id: 's4' }, stage);
  root.innerHTML = `
  <style>
    #s4 { font-family:${FONT.body}; color:${C.ink}; }
    #s4 .cam { position:absolute; inset:0; transform-origin: 960px 540px; }
    #s4 .shape { position:absolute; overflow:hidden; box-sizing:border-box; }
    #s4 .c { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); white-space:nowrap; }
    #s4 .tabs { display:flex; width:640px; justify-content:space-around; font:500 26px ${FONT.body}; position:relative; }
    #s4 .tabs span { position:relative; z-index:1; width:200px; text-align:center; }
    #s4 .ind { position:absolute; top:-16px; height:64px; border-radius:32px; background:${C.ink}; }
    #s4 .search { position:absolute; left:0; top:0; width:900px; height:76px; }
    #s4 .search .q { position:absolute; left:84px; top:20px; font:400 28px ${FONT.body}; }
    #s4 .search .k { position:absolute; right:34px; top:20px; width:64px; height:36px; border-radius:8px; border:1px solid ${C.hair}; font:400 16px ${FONT.mono}; color:${C.grey}; display:flex; align-items:center; justify-content:center; }
    #s4 .res { position:absolute; left:20px; width:860px; height:68px; border-radius:12px; display:flex; align-items:center; font:500 22px ${FONT.body}; }
    #s4 .res i { width:32px; height:32px; border-radius:8px; background:#EEF0F3; margin:0 20px 0 24px; flex:none; }
    #s4 .res small { margin-left:auto; margin-right:120px; font:400 18px ${FONT.body}; color:${C.grey}; }
    #s4 .enter { position:absolute; right:40px; top:18px; width:64px; height:32px; border-radius:8px; background:${C.ink}; color:#fff; font:400 18px ${FONT.mono}; display:flex; align-items:center; justify-content:center; }
    #s4 .chip { display:inline-block; background:${C.lime}; font:500 21px ${FONT.mono}; letter-spacing:1.5px; padding:5px 12px; border-radius:6px; }
  </style>
  <div class="cam">
    <div class="shape">
      <div class="c lbl" style="font:600 40px ${FONT.head};color:#fff">Publish</div>
      <svg class="c loader" width="70" height="70" viewBox="0 0 70 70"><circle cx="35" cy="35" r="27" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7"/><circle class="arc" cx="35" cy="35" r="27" fill="none" stroke="${C.lime}" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="28 72"/></svg>
      <svg class="c check" width="70" height="70" viewBox="0 0 70 70"><path d="M18 36 l12 12 l22 -24" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/></svg>
      <div class="knob" style="position:absolute;top:15px;height:100px;border-radius:50px;background:${C.lime}"></div>
      <div class="c tabsw"><div class="tabs"><div class="ind"></div><span>Overview</span><span>Flows</span><span>Screens</span></div></div>
      <div class="pal">
        <div class="search"><svg style="position:absolute;left:30px;top:22px" width="34" height="34" viewBox="0 0 34 34"><circle cx="14" cy="14" r="11" fill="none" stroke="${C.ink}" stroke-width="3"/><line x1="22" y1="22" x2="31" y2="31" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/></svg>
          <div class="q"><span class="typed"></span><span class="ph" style="color:#9AA0A8">Search projects</span><span class="caret" style="display:inline-block;width:3px;height:34px;background:${C.ink};vertical-align:-6px;margin-left:2px"></span></div><div class="k">⌘K</div></div>
        <div class="sep" style="position:absolute;left:0;right:0;top:96px;height:1px;background:${C.hair}"></div>
        ${[['Onboarding flow', 'Prototype'], ['Onboarding emails', 'Design system'], ['Billing settings', 'Screen'], ['Team invites', 'Flow']].map(([a, b], i) => `<div class="res r${i}" style="top:${110 + i * 80}px"><i></i>${a}<small>${b}</small>${i === 0 ? '<div class="enter">↵</div>' : ''}</div>`).join('')}
      </div>
      <div class="c toast" style="display:flex;align-items:center;gap:18px;font:500 26px ${FONT.body};color:#fff"><svg width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="24" fill="${C.lime}"/><path d="M13 25 l8 8 l16 -17" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>Prototype published</div>
      <svg class="c dock" width="56" height="56" viewBox="0 0 50 50"><path d="M13 25 l8 8 l16 -17" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <svg class="cursor" width="44" height="56" viewBox="0 0 44 56" style="position:absolute;overflow:visible"><path d="M2 2 L2 44 L13 33 L21 52 L29 48 L21 30 L37 30 Z" fill="${C.ink}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>
  </div>
  <div class="ttl" style="position:absolute;left:92px;top:104px"><span class="chip">03 / UI·UX</span><div style="margin-top:14px;font:600 58px ${FONT.head};letter-spacing:-1px">UI/UX Design</div></div>
  <div class="small" style="position:absolute;left:96px;top:104px;font:400 20px ${FONT.mono};letter-spacing:1.5px;color:${C.grey}">03 / UI·UX</div>
  <div class="foot" style="position:absolute;left:96px;bottom:62px;font:400 18px ${FONT.mono};letter-spacing:1.5px;color:${C.grey}">INTERFACES · PROTOTYPES · SYSTEMS</div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const cam = q('.cam'), shape = q('.shape'), cursor = q('.cursor');
  const parts = { lbl: q('.lbl'), loader: q('.loader'), check: q('.check'), knob: q('.knob'), tabs: q('.tabsw'), pal: q('.pal'), toast: q('.toast'), dock: q('.dock') };
  const arc = q('.arc'), checkPath = q('.check path'), ind = q('.ind'), tabSpans = qa('.tabs span'), typed = q('.typed'), ph = q('.ph'), caret = q('.caret'), rows = qa('.res'), enter = q('.enter'), sep = q('.sep');
  const ttl = q('.ttl'), small = q('.small'), foot = q('.foot');

  const ink = hex(C.ink), lime = hex(C.lime), white = [255, 255, 255];
  const ST = [
    [Q.button, 360, 120, 60, ink, 1.25], [Q.loader, 132, 132, 66, ink, 1.55], [Q.check, 132, 132, 66, lime, 1.55], [Q.toggle, 300, 130, 65, ink, 1.4],
    [Q.tabs, 680, 96, 48, white, 1.12], [Q.search, 900, 76, 18, white, 1.0], [Q.palette, 900, 470, 26, white, 1.0], [Q.toast, 470, 84, 42, ink, 1.18], [Q.contract[0], 56, 56, 28, lime, 1.18],
  ];
  const seq = (i, w = 15, z = 0.84) => (t) => springSeq(t, ST[0][i], ST.slice(1).map(s => [s[0], s[i]]), w, z);
  const W_ = seq(1), H_ = seq(2, 17), R_ = seq(3), CAM = seq(5, 9, 0.95);
  const col = (t) => [0, 1, 2].map(c => springSeq(t, ST[0][4][c], ST.slice(1).map(s => [s[0], s[4][c]]), 34, 1));

  const CUR = [[10.0, 1500, 950], [10.26, 1000, 566], [10.42, 1090, 650], [10.95, 1060, 610], [11.04, 880, 548], [Q.drag[0], 880, 548], [Q.drag[1], 1050, 548], [11.42, 1090, 620], [11.58, 975, 556], [Q.tabClick, 975, 556],
    [11.76, 1150, 560], [11.82, 1150, 548], [12.02, 1200, 640], [12.3, 1120, 478], [Q.enter, 1120, 478], [12.7, 1320, 720], [12.95, 1560, 980]];
  const clicks = [Q.click1, Q.tabClick, 11.82, Q.enter];
  const cursorAt = (t) => {
    let i = 0; while (i < CUR.length - 1 && t > CUR[i + 1][0]) i++;
    const a = CUR[i], b = CUR[Math.min(i + 1, CUR.length - 1)];
    const k = a === b ? 1 : (a[0] === Q.drag[0] && b[0] === Q.drag[1] ? E.inOut : E.inOut)(inv(a[0], b[0], t));
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  };

  function update(t) {
    const on = t >= 10 && t < 13;
    root.style.display = on ? '' : 'none';
    if (!on) return null;
    const w = W_(t), h = H_(t), r = Math.min(R_(t), h / 2, w / 2), c = col(t);
    css(shape, { left: `${960 - w / 2}px`, top: `${540 - h / 2}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${r}px`, background: rgb(c),
      boxShadow: `0 ${lerp(10, 30, inv(11.3, 11.6, t))}px ${lerp(26, 60, inv(11.3, 11.6, t))}px -20px rgba(17,17,17,${0.16 + 0.1 * inv(11.3, 11.6, t) * (1 - inv(12.5, 12.6, t))})`,
      border: `${t > 11.4 && t < 12.56 ? 1 : 0}px solid ${C.hair}` });
    cam.style.transform = `scale(${CAM(t)})`;

    // content: separate enter / exit timing so labels never overlap during a morph
    const vis = (e, a, b, blur = true) => { const o = win(t, a, b, 0.08, 0.06); e.style.opacity = String(o); e.style.filter = blur && o < 1 ? `blur(${(1 - o) * 6}px)` : 'none'; e.style.display = o > 0 ? '' : 'none'; return o; };
    vis(parts.lbl, 9.9, Q.click1 + 0.04);
    vis(parts.loader, Q.loader + 0.04, Q.check); arc.setAttribute('transform', `rotate(${(t - Q.loader) * 760} 35 35)`);
    vis(parts.check, Q.check + 0.03, Q.toggle); checkPath.style.strokeDashoffset = String(1 - E.out(inv(Q.check + 0.03, Q.check + 0.22, t)));
    // toggle knob: leading edge and trailing edge on separate springs → stretch while dragging
    const ko = vis(parts.knob, Q.toggle + 0.05, Q.tabs, false);
    if (ko > 0) { const right = spring(t, Q.drag[0], 115, 285, 17, 0.8), left = spring(t, Q.drag[0] + 0.07, 15, 185, 12, 0.86); css(parts.knob, { left: `${left}px`, width: `${right - left}px` }); }
    // tabs: indicator edges on separate springs
    const tbo = vis(parts.tabs, Q.tabs + 0.06, Q.search);
    if (tbo > 0) {
      const l = spring(t, Q.tabClick, 0, 220, 18, 0.82), rr = spring(t, Q.tabClick - 0.04, 200, 420, 14, 0.86);
      css(ind, { left: `${l}px`, width: `${rr - l}px` });
      tabSpans.forEach((s, i) => { s.style.color = (i === 0 && t < Q.tabClick + 0.05) || (i === 1 && t >= Q.tabClick + 0.05) ? '#fff' : C.ink; });
    }
    // search → palette
    vis(parts.pal, Q.search + 0.04, Q.toast);
    const n = Math.floor(14 * inv(Q.type[0], Q.type[1], t));
    typed.textContent = 'Onboarding flo'.slice(0, n); ph.style.display = n ? 'none' : '';
    caret.style.opacity = String((Math.floor(t * 4) % 2 === 0 || (t > Q.type[0] && t < Q.type[1])) ? 1 : 0);
    sep.style.opacity = String(inv(Q.palette + 0.05, Q.palette + 0.2, t));
    rows.forEach((row, i) => { const a = E.out(inv(Q.palette + 0.08 + i * 0.05, Q.palette + 0.4 + i * 0.05, t)); css(row, { opacity: String(a), transform: `translateY(${(1 - a) * 12}px)`, background: i === 0 && t > 12.24 ? '#F4F5F7' : 'transparent' }); });
    rows[0].querySelector('i').style.background = t > 12.24 ? C.lime : '#EEF0F3';
    enter.style.background = t > Q.enter && t < Q.enter + 0.1 ? C.lime : C.ink; enter.style.color = t > Q.enter && t < Q.enter + 0.1 ? C.ink : '#fff';
    enter.style.opacity = String(inv(12.24, 12.3, t));
    vis(parts.toast, Q.toast + 0.05, Q.contract[0]);
    vis(parts.dock, Q.contract[0] + 0.02, 13.2, false);

    // cursor (direct manipulation; dips on clicks)
    const [cx, cy] = cursorAt(t);
    let sc = 1; for (const ct of clicks) sc -= 0.14 * Math.max(0, 1 - Math.abs(t - ct) / 0.07);
    if (t > Q.drag[0] - 0.02 && t < Q.drag[1] + 0.02) sc = 0.88;
    css(cursor, { left: `${cx}px`, top: `${cy}px`, transform: `scale(${sc})`, opacity: String(win(t, 10.0, 12.92, 0.1, 0.1)) });

    // titles
    const ti = E.out(inv(CUE.titleS4[0], CUE.titleS4[0] + 0.6, t)), to = E.in(inv(CUE.titleS4[1], CUE.titleS4[1] + 0.22, t));
    css(ttl, { opacity: String(ti * (1 - to)), transform: `translate(${-60 * to}px, ${24 * (1 - ti)}px)` });
    small.style.opacity = String(win(t, 11.62, 12.86, 0.2, 0.12));
    css(foot, { opacity: String(win(t, 10.3, 11.6, 0.3, 0.2)) });
    return { bg: C.canvas };
  }
  return { update };
}
