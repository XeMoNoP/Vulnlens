// SCENE 4 — UI/UX DESIGN (18–24 s). Reference: @TheGrootDev (one persistent shape, cursor-driven
// morphs, tightly damped closed-form springs, separate enter/exit timing for content).
// 4A: on a bright white canvas the carried AR ring becomes ONE large component: lime circle →
// button → toggle (dragged) → information card. Colour changes are clip-path reveals of a new
// colour layer (no blended olive/grey intermediates).
// 4B: the card becomes the desktop screen of a responsive prototype system on the six blade axes,
// linked by restrained pink connectors; the screens then travel inward to set up the logo assembly.
import { CUE } from './cues.js';
import { E, inv, lerp, clamp, el, css, C, FONT, springSeq, spring, win } from '../src/lib.js';
import { ITEMS, HUB, protoPose, screenHTML } from './proto.js';

const PINK = '#FF5BD9';
export function initS4({ stage }) {
  const Q = CUE.s4;
  const root = el('div', { class: 'layer', id: 's4' }, stage);
  const it0 = ITEMS[0];
  root.innerHTML = `
  <style>
    #s4 { font-family:${FONT.body}; color:${C.ink}; }
    #s4 .shape { position:absolute; overflow:hidden; box-sizing:border-box; }
    #s4 .shape .lay { position:absolute; inset:0; }
    #s4 .c { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); white-space:nowrap; }
    #s4 .item { position:absolute; background:#fff; border:2px solid ${C.hair}; overflow:hidden; box-shadow:0 30px 60px -30px rgba(17,17,17,.28); transform-origin:50% 50%; }
    #s4 .chip { display:inline-block; vertical-align:middle; background:${C.lime}; font:500 20px ${FONT.mono}; letter-spacing:1.5px; padding:6px 12px; border-radius:6px; margin-right:16px; }
  </style>
  <svg class="links" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">${ITEMS.map(() => `<path fill="none" stroke="${PINK}" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1"/><circle r="6" fill="${PINK}"/>`).join('')}</svg>
  ${ITEMS.slice(1).map(it => `<div class="item it${it.i}" style="width:${it.w}px;height:${it.h}px;border-radius:${it.kind === 'phone' ? 34 : it.kind === 'tablet' ? 26 : 18}px">${screenHTML(it.kind)}</div>`).join('')}
  <svg class="hub" width="64" height="64" viewBox="${LOGO.star.cx - LOGO.star.r} ${LOGO.star.cy - LOGO.star.r} ${LOGO.star.r * 2} ${LOGO.star.r * 2}" style="position:absolute;left:${HUB[0] - 32}px;top:${HUB[1] - 32}px"><path fill="${C.ink}" fill-rule="evenodd" d="${LOGO.star.d}"/></svg>
  <div class="cam4" style="position:absolute;inset:0;transform-origin:960px 540px"><div class="shape">
    <div class="lay base"></div><div class="lay over"></div>
    <div class="c lbl" style="font:600 54px ${FONT.head};color:#fff;letter-spacing:-.5px">Publish prototype</div>
    <div class="knob" style="position:absolute;top:20px;height:160px;border-radius:80px;background:${C.lime}"></div>
    <div class="cardc" style="position:absolute;left:0;top:0;width:960px;height:560px;padding:56px 64px;box-sizing:border-box">
      <div style="display:flex;align-items:center;gap:22px"><div style="width:84px;height:84px;border-radius:22px;background:${C.lime}"></div><div><div style="font:600 50px ${FONT.head};letter-spacing:-1px">Onboarding flow</div><div style="font:400 26px ${FONT.body};color:${C.grey};margin-top:4px">Prototype · 6 screens</div></div></div>
      <div style="margin-top:46px;height:16px;border-radius:8px;background:#EEF0F3"><div class="prog" style="height:16px;border-radius:8px;background:${C.ink};width:0"></div></div>
      <div style="display:flex;gap:14px;margin-top:40px">${['Desktop', 'Tablet', 'Mobile'].map(s => `<span style="padding:12px 22px;border-radius:24px;background:#F4F4F5;font:500 22px ${FONT.body}">${s}</span>`).join('')}</div>
      <div style="position:absolute;right:64px;bottom:56px;padding:20px 34px;border-radius:32px;background:${C.ink};color:#fff;font:600 24px ${FONT.body}">Open prototype</div>
    </div>
    <div class="deskc" style="position:absolute;left:0;top:0;width:${it0.w}px;height:${it0.h}px">${screenHTML('desktop')}</div>
  </div>
  <svg class="cursor" width="66" height="84" viewBox="0 0 44 56" style="position:absolute;overflow:visible"><path d="M2 2 L2 44 L13 33 L21 52 L29 48 L21 30 L37 30 Z" fill="${C.ink}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg></div>
  <div class="ttl" style="position:absolute;left:0;right:0;top:92px;text-align:center"><span class="chip">03 / UI·UX</span><span style="vertical-align:middle;font:600 52px ${FONT.head};letter-spacing:-1px">UI/UX Design</span></div>
  <div class="foot" style="position:absolute;left:0;right:0;top:104px;text-align:center;font:400 19px ${FONT.mono};letter-spacing:2px;color:${C.grey}">RESPONSIVE PROTOTYPE SYSTEM</div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const shape = q('.shape'), base = q('.base'), over = q('.over'), lbl = q('.lbl'), knob = q('.knob'), cardc = q('.cardc'), deskc = q('.deskc'), prog = q('.prog');
  const cursor = q('.cursor'), ttl = q('.ttl'), foot = q('.foot'), hub = q('.hub'), cam4 = q('.cam4');
  const items = ITEMS.map(it => it.i === 0 ? shape : q(`.it${it.i}`));
  const links = qa('.links path'), linkDots = qa('.links circle');

  // shape: size and radius are sums of closed-form springs (pure functions of time)
  const ST = [[Q.fill, 160, 160, 80], [Q.button, 690, 188, 94], [Q.toggle, 470, 200, 100], [Q.card, 960, 560, 34]];
  const sp = (j, w = 16, z = 0.84) => (t) => springSeq(t, ST[0][j], ST.slice(1).map(s => [s[0], s[j]]), w, z);
  const SW = sp(1), SH = sp(2, 18), SR = sp(3);
  // colour transitions as clip-path reveals: [time, from, to, originX(0..1), originY]
  const COL = [[Q.fill, C.lime, C.lime, 0.5, 0.5], [Q.button, C.lime, C.ink, 0.5, 0.5], [Q.card, C.ink, '#FFFFFF', 0.7, 0.6]];
  const CUR = [[18.0, 1500, 980], [18.82, 1080, 600], [Q.click, 1080, 600], [19.2, 930, 560], [Q.drag[0], 930, 560], [Q.drag[1], 1110, 560], [19.95, 1260, 640], [Q.card - 0.02, 1240, 650], [20.6, 1380, 780], [21.0, 1560, 1000]];
  const cursorAt = (t) => { let i = 0; while (i < CUR.length - 1 && t > CUR[i + 1][0]) i++; const a = CUR[i], b = CUR[Math.min(i + 1, CUR.length - 1)]; const k = a === b ? 1 : E.inOut(inv(a[0], b[0], t)); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; };

  function update(t) {
    const on = t >= 18 && t < 24.02;
    root.style.display = on ? '' : 'none';
    if (!on) return null;

    // geometry: 4A centred component; 4B the card becomes the desktop screen (item 0)
    const sys = E.inOut(inv(Q.system[0], Q.system[1], t));
    cam4.style.transform = `scale(${lerp(1.35, 1, E.inOut(inv(Q.system[0], Q.system[0] + 0.6, t)))})`;
    const p0 = protoPose(0, t);
    let w = SW(t), h = SH(t), r = Math.min(SR(t), h / 2);
    let cx = 960, cy = 540, sc = 1;
    if (t >= Q.system[0]) { w = lerp(960, it0.w, sys); h = lerp(560, it0.h, sys); r = lerp(34, 18, sys); cx = lerp(960, p0.x, sys); cy = lerp(540, p0.y, sys); sc = p0.sc; }
    css(shape, { left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${r}px`, transform: `scale(${sc}) rotate(${t >= Q.system[0] ? p0.rot : 0}deg)`,
      boxShadow: t >= Q.card ? '0 40px 80px -40px rgba(17,17,17,.32)' : 'none', border: t >= Q.card + 0.15 ? `2px solid ${C.hair}` : '0px solid transparent' });
    // colour reveal
    let ci = 0; for (let i = 0; i < COL.length; i++) if (t >= COL[i][0]) ci = i;
    const [ct, fromC, toC, ox, oy] = COL[ci];
    const rk = E.out(inv(ct, ct + 0.28, t));
    base.style.background = fromC; over.style.background = toC;
    over.style.clipPath = `circle(${rk * Math.hypot(w, h)}px at ${ox * 100}% ${oy * 100}%)`;
    // the S3 anchor ring arrives as an outline; the fill grows inward
    if (t < Q.button) { const fk = E.out(inv(Q.fill, Q.fill + 0.22, t)); base.style.background = 'transparent'; over.style.background = C.lime; over.style.clipPath = `circle(${fk * 80}px at 50% 50%)`; shape.style.border = '8px solid ' + C.lime; }

    // content with separate enter/exit timing
    const vis = (e, a, b) => { const o = win(t, a, b, 0.1, 0.07); e.style.opacity = String(o); e.style.display = o > 0 ? '' : 'none'; return o; };
    vis(lbl, Q.button + 0.18, Q.click + 0.03);
    const ko = vis(knob, Q.toggle + 0.08, Q.card);
    if (ko > 0) { const right = spring(t, Q.drag[0], 180, 450, 16, 0.8), left = spring(t, Q.drag[0] + 0.07, 20, 290, 12, 0.86); css(knob, { left: `${left}px`, width: `${right - left}px` }); }
    const cO = vis(cardc, Q.card + 0.18, Q.system[0] + 0.35);
    if (cO > 0) { [...cardc.children].forEach((ch, i) => { const a = E.out(inv(Q.card + 0.2 + i * 0.06, Q.card + 0.6 + i * 0.06, t)); ch.style.opacity = String(a); ch.style.transform = `translateY(${(1 - a) * 14}px)`; }); prog.style.width = `${70 * E.out(inv(Q.card + 0.45, Q.card + 1.1, t))}%`; }
    const dO = vis(deskc, Q.system[0] + 0.3, 30);
    deskc.style.transform = `scale(${w / it0.w}, ${h / it0.h})`; deskc.style.transformOrigin = '0 0';

    // the rest of the prototype system: other screens arrive along their blade axes
    ITEMS.forEach((it, i) => {
      const p = protoPose(i, t);
      const a = E.out(inv(Q.system[0] + 0.25 + i * 0.07, Q.system[0] + 0.85 + i * 0.07, t));
      if (i > 0) {
        const dx = (HUB[0] - it.x) * (1 - a) * 0.8, dy = (HUB[1] - it.y) * (1 - a) * 0.8;
        css(items[i], { left: `${p.x - it.w / 2 + dx}px`, top: `${p.y - it.h / 2 + dy}px`, opacity: String(inv(0, 0.25, a)), transform: `scale(${p.sc * lerp(0.6, 1, a)}) rotate(${p.rot}deg)` });
      }
      // pink connector from the hub to the item edge
      const ex = lerp(HUB[0], p.x, 0.72), ey = lerp(HUB[1], p.y, 0.72);
      const la = E.inOut(inv(Q.system[0] + 0.55 + i * 0.07, Q.system[0] + 1.2 + i * 0.07, t)) * (1 - inv(Q.inward[0], Q.inward[0] + 0.4, t));
      links[i].setAttribute('d', `M${HUB[0]} ${HUB[1]} L${ex} ${ey}`);
      links[i].style.strokeDashoffset = String(1 - la); links[i].style.opacity = String(la > 0 ? 1 : 0);
      const pulse = ((t - 21.95 - i * 0.09) % 0.55 + 0.55) % 0.55 / 0.55, pk = t > 21.95 && t < Q.inward[0] ? E.inOut(pulse) : 1;
      linkDots[i].setAttribute('cx', lerp(HUB[0], ex, pk)); linkDots[i].setAttribute('cy', lerp(HUB[1], ey, pk)); linkDots[i].style.opacity = String(inv(0.85, 1, la));
    });
    hub.style.opacity = String(E.out(inv(Q.system[0] + 0.4, Q.system[0] + 0.8, t)) * (1 - inv(Q.inward[1] - 0.4, Q.inward[1], t)));

    // cursor
    const [ux, uy] = cursorAt(t);
    let s2 = 1.0; [Q.click, Q.card - 0.02].forEach(c => { s2 -= 0.14 * Math.max(0, 1 - Math.abs(t - c) / 0.07); }); if (t > Q.drag[0] - 0.02 && t < Q.drag[1] + 0.02) s2 = 0.88;
    css(cursor, { left: `${ux}px`, top: `${uy}px`, transform: `scale(${s2})`, opacity: String(win(t, 18.05, 20.95, 0.15, 0.15)) });

    const ti = E.out(inv(CUE.titleS4[0], CUE.titleS4[0] + 0.6, t)), to = E.in(inv(CUE.titleS4[1], CUE.titleS4[1] + 0.25, t));
    css(ttl, { opacity: String(ti * (1 - to)), transform: `translateY(${(1 - ti) * -20 - to * 16}px)` });
    foot.style.opacity = String(win(t, Q.system[0] + 0.5, Q.inward[0] + 0.2, 0.3, 0.25));
    return { bg: '#FFFFFF' };
  }
  return { update };
}
