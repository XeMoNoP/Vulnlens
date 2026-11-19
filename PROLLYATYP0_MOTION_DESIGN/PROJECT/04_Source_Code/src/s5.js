// SCENE 5 — CLOSING (13–15 s). Reference: @everestchris6 (one object carries the story;
// transitions come from objects already on screen; continuous camera; precise easing).
// The toast's check circle becomes the star's centre. One object from every scene (a facet,
// a UI card, a terrain tile, the toggle) travels in and docks into a blade while the light
// opens from graphite to white. The star settles into the original logo; the wordmark wipes
// out from behind it; the tagline resolves; the frame holds still for 60 frames.
import { CUE } from './cues.js';
import { E, inv, tw, lerp, clamp, el, css, C, FONT, spring, springRemain, mixHex, win } from './lib.js';

export function initS5({ stage }) {
  const LG = window.LOGO, S = LG.star, B = LG.bbox;
  const LW = B.x1 - B.x0, LH = B.y1 - B.y0;
  // final logo layout: 1180 px wide, centred at (960, 470)
  const k = 1180 / LW, lx = 960 - 590, ly = 470 - LH * k / 2;
  const fx = lx + (S.cx - B.x0) * k, fy = ly + (S.cy - B.y0) * k;
  const R0 = 210;                                 // star radius (px) during convergence
  const objAngles = [S.tips[1], S.tips[2], S.tips[4], S.tips[5]];

  const root = el('div', { class: 'layer', id: 's5' }, stage);
  root.innerHTML = `
  <div class="cam5" style="position:absolute;inset:0;transform-origin:960px 540px">
    <div class="shadow" style="position:absolute;width:560px;height:60px;left:680px;top:760px;background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.2), rgba(0,0,0,0) 70%)"></div>
    <svg class="trails" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">${objAngles.map(() => '<path fill="none" stroke="#111" stroke-opacity=".25" stroke-width="2" pathLength="1" stroke-dasharray="1"/>').join('')}</svg>
    <svg class="logo" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
      <defs><linearGradient id="s5rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lime}"/><stop offset=".42" stop-color="${C.lime}" stop-opacity=".85"/><stop offset=".6" stop-color="${C.lime}" stop-opacity="0"/></linearGradient>
        <clipPath id="s5wipe"><rect class="wipe" x="0" y="0" height="1080" width="0"/></clipPath></defs>
      <g clip-path="url(#s5wipe)"><g transform="translate(${lx} ${ly}) scale(${k}) translate(${-B.x0} ${-B.y0})" fill="${C.ink}">${LG.glyphs.map(g => `<path fill-rule="evenodd" d="${g.d}"/>`).join('')}</g></g>
      <g class="star"><path fill="${C.ink}" fill-rule="evenodd" d="${S.d}"/><path class="rimp" fill="none" stroke="url(#s5rim)" stroke-width="3" vector-effect="non-scaling-stroke" d="${S.d}"/></g>
      <circle class="dot" cx="960" cy="540" fill="${C.lime}"/>
      ${objAngles.map(() => `<circle class="flash" fill="none" stroke="${C.lime}" stroke-width="3"/>`).join('')}
    </svg>
    <div class="o o0" style="position:absolute;width:120px;height:110px"><svg width="120" height="110" viewBox="-60 -55 120 110"><path d="M0 -50 L52 40 L-48 46 Z" fill="#4A4C52" stroke="${C.lime}" stroke-width="3"/><path d="M0 -50 L52 40 L4 6 Z" fill="#6A6C74"/></svg></div>
    <div class="o o1" style="position:absolute;width:180px;height:116px;border-radius:12px;background:#fff;border:2px solid ${C.hair};box-shadow:0 20px 40px -18px rgba(17,17,17,.3);overflow:hidden">
      <div style="height:22px;background:${C.sweep}"></div><div style="margin:14px 16px 0;height:10px;width:90px;border-radius:5px;background:#C9CDD3"></div><div style="margin:10px 16px 0;height:10px;width:140px;border-radius:5px;background:#E9EBEF"></div><div style="margin:10px 16px 0;height:18px;width:60px;border-radius:9px;background:${C.ink}"></div></div>
    <div class="o o2" style="position:absolute;width:180px;height:110px"><svg width="180" height="110" viewBox="-90 -60 180 110"><ellipse cx="0" cy="30" rx="86" ry="22" fill="#26282E"/><polygon points="-70,30 -30,-40 6,30" fill="#2C3146"/><polygon points="-20,30 24,-60 66,30" fill="#353B52"/><polygon points="24,-60 66,30 30,30" fill="#454B66"/><path d="M-70 26 Q0 6 70 24" stroke="${C.lime}" stroke-width="3" fill="none"/></svg></div>
    <div class="o o3" style="position:absolute;width:180px;height:68px;border-radius:34px;background:${C.ink}"><div style="position:absolute;left:118px;top:10px;width:48px;height:48px;border-radius:24px;background:${C.lime}"></div></div>
  </div>
  <div class="rule" style="position:absolute;left:890px;top:634px;width:140px;height:12px;background:${C.lime};transform-origin:50% 50%"><div style="position:absolute;left:0;right:0;top:4px;height:3px;background:${C.ink}"></div></div>
  <div class="tag" style="position:absolute;left:0;right:0;top:696px;text-align:center;font:500 32px ${FONT.head};letter-spacing:8.5px;color:${C.ink};white-space:nowrap">${'ENGINEERING DIGITAL EXPERIENCES.'.split(' ').map(w => `<span style="display:inline-block;margin:0 6px">${w}</span>`).join('')}</div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const cam = q('.cam5'), star = q('.star'), rimp = q('.rimp'), dot = q('.dot'), wipe = q('.wipe'), shadow = q('.shadow');
  const objs = qa('.o'), trails = qa('.trails path'), flashes = qa('.flash'), rule = q('.rule'), words = qa('.tag span');
  const pt = (a, r, cx = 960, cy = 520) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

  function update(t) {
    const on = t >= 13;
    root.style.display = on ? '' : 'none';
    if (!on) return null;
    cam.style.transform = `scale(${lerp(1.14, 1, E.soft(inv(13.0, 14.25, t)))})`;

    // star: grows out of the check circle, turns, then settles into the logo position
    const grow = clamp(1 - springRemain(t - CUE.starGrow[0], 11, 0.9));
    const settle = E.inOut(inv(CUE.settle[0], CUE.settle[1], t));
    const rot = lerp(lerp(-70, -12, E.out(inv(13.0, 13.8, t))), 0, settle);
    const scale = lerp(R0 / S.r * grow, k, settle);
    const cx = lerp(960, fx, settle), cy = lerp(lerp(540, 520, E.out(inv(13, 13.4, t))), fy, settle);
    star.setAttribute('transform', `translate(${cx} ${cy}) rotate(${rot}) scale(${scale}) translate(${-S.cx} ${-S.cy})`);
    rimp.style.opacity = String(1 - inv(13.85, 14.15, t));
    dot.setAttribute('r', String(28 * (1 - E.in(inv(13.0, 13.14, t)))));
    const sr = scale * S.r;
    css(shadow, { opacity: String(win(t, 13.15, CUE.settle[0] + 0.12, 0.25, 0.2)), left: `${cx - 280}px`, top: `${cy + sr * 1.12}px`, transform: `scaleX(${clamp(sr / R0)})` });

    // carried objects dock into the blades
    objs.forEach((o, i) => {
      const a = objAngles[i] + rot * Math.PI / 180, td = CUE.dock[i];
      const [x0, y0] = pt(objAngles[i] + 0.15, 900), [mx, my] = pt(objAngles[i] + 0.6, 470), [x1, y1] = pt(a, R0 * 0.82, cx, cy);
      const p = E.out(inv(13.04 + i * 0.04, td, t));
      const x = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * mx + p * p * x1, y = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * my + p * p * y1;
      const w = o.offsetWidth, h = o.offsetHeight;
      css(o, { left: `${x - w / 2}px`, top: `${y - h / 2}px`, transform: `rotate(${(1 - p) * 40 * (i % 2 ? 1 : -1) + objAngles[i] * 20}deg) scale(${lerp(1, 0.3, E.in(inv(td - 0.18, td, t)))})`, opacity: String(t < td ? 1 : 0) });
      trails[i].setAttribute('d', `M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`);
      trails[i].style.strokeDashoffset = String(1 - p); trails[i].style.opacity = String(1 - inv(td, td + 0.25, t));
      const f = inv(td, td + 0.22, t);
      flashes[i].setAttribute('cx', x1); flashes[i].setAttribute('cy', y1); flashes[i].setAttribute('r', String(8 + 30 * E.out(f))); flashes[i].style.opacity = String(t >= td ? 1 - f : 0);
    });

    // wordmark wipes out from behind the star; rule; tagline word by word
    const wx0 = fx + S.r * k * 0.98, wx = lerp(wx0, 1920, E.out(inv(CUE.wordmark[0], CUE.wordmark[1], t)));
    wipe.setAttribute('x', String(wx0)); wipe.setAttribute('width', String(Math.max(0, wx - wx0)));
    rule.style.transform = `scaleX(${E.out(inv(CUE.rule[0], CUE.rule[1], t))})`;
    words.forEach((w, i) => { const a = E.out(inv(CUE.tagline + i * 0.03, CUE.tagline + i * 0.03 + 0.24, t)); css(w, { opacity: String(a), transform: `translateY(${(1 - a) * 8}px)` }); });

    // light opens: warm grey → graphite edges → white
    const edge = t < 13.3 ? mixHex(C.canvas, C.graphite, E.soft(inv(13.0, 13.3, t))) : mixHex(C.graphite, '#FFFFFF', E.inOut(inv(13.35, 14.1, t)));
    const centre = mixHex(C.canvas, '#FFFFFF', inv(13.0, 13.2, t));
    const stop = lerp(38, 100, E.inOut(inv(13.35, 14.1, t)));
    return { bg: `radial-gradient(circle at 50% 47%, ${centre} 0%, ${centre} ${stop * 0.55}%, ${edge} ${Math.max(stop, 60)}%)` };
  }
  return { update };
}
