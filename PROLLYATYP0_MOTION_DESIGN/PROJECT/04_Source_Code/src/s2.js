// SCENE 2 — SAAS DESIGN & DEVELOPMENT (2–6 s). Reference: @daniel_haida (premium product film).
// Bright product-shoot sweep. The product interface is the hero: rebuilt in HTML/CSS (not a
// screenshot), staged with CSS 3D transforms and a GSAP timeline that is seeked per frame.
// 2A: crane down onto the window as UI regions settle. 2B: the interface separates into its
// layers on a macro slide; an invite modal arrives; the camera pushes through it into S3.
// Demo-safe content only: no metrics, no customer data.
import { CUE } from './cues.js';
import { E, inv, tw, lerp, clamp, el, css, C, FONT, mixHex } from './lib.js';

const starSvg = (size, fill) => `<svg width="${size}" height="${size}" viewBox="${window.LOGO.star.cx - window.LOGO.star.r} ${window.LOGO.star.cy - window.LOGO.star.r} ${window.LOGO.star.r * 2} ${window.LOGO.star.r * 2}"><path fill="${fill}" fill-rule="evenodd" d="${window.LOGO.star.d}"/></svg>`;

export function initS2({ stage }) {
  const root = el('div', { class: 'layer', id: 's2' }, stage);
  root.innerHTML = `
  <style>
    #s2 { font-family: ${FONT.body}; color: ${C.ink}; }
    #s2 .light { position:absolute; inset:0; background: radial-gradient(ellipse at 28% 18%, rgba(255,255,255,.95), rgba(255,255,255,0) 60%); }
    #s2 .floor { position:absolute; left:10%; right:-10%; bottom:40px; height:90px; background: radial-gradient(ellipse at 50% 50%, rgba(11,16,32,.16), rgba(11,16,32,0) 70%); }
    #s2 .cam { position:absolute; inset:0; perspective: 2600px; perspective-origin: 50% 45%; }
    #s2 .rig { position:absolute; left:960px; top:540px; transform-style: preserve-3d; }
    #s2 .app { position:absolute; left:-670px; top:-400px; width:1340px; height:800px; transform-style: preserve-3d; }
    #s2 .base { position:absolute; inset:0; background:#fff; border:2px solid ${C.hair}; border-radius:18px; box-shadow: 0 40px 90px -30px rgba(11,16,32,.28), 0 12px 30px -12px rgba(11,16,32,.12); }
    #s2 .bar { position:absolute; left:0; right:0; top:0; height:64px; background:${C.sweep}; border-bottom:1px solid ${C.hair}; border-radius:16px 16px 0 0; }
    #s2 .dots i { position:absolute; top:25px; width:14px; height:14px; border-radius:50%; background:#D9DCE1; }
    #s2 .url { position:absolute; left:460px; top:16px; width:420px; height:32px; border-radius:16px; background:#fff; border:1px solid ${C.hair}; font: 400 15px ${FONT.mono}; color:#8A8F98; line-height:32px; padding-left:20px; box-sizing:border-box; }
    #s2 .side { position:absolute; left:0; top:64px; width:220px; height:736px; background:#FBFBFC; border-right:1px solid ${C.hair}; border-radius:0 0 0 16px; }
    #s2 .brand { position:absolute; left:30px; top:30px; display:flex; align-items:center; gap:12px; font: 600 21px ${FONT.head}; }
    #s2 .nav { position:absolute; left:16px; top:96px; width:188px; }
    #s2 .nav div { height:38px; border-radius:9px; display:flex; align-items:center; gap:12px; padding-left:16px; margin-bottom:12px; font-size:18px; color:${C.grey}; }
    #s2 .nav div i { width:14px; height:14px; border-radius:4px; background:#C9CDD3; }
    #s2 .nav div.on { background:#fff; border:1px solid ${C.hair}; color:${C.ink}; } #s2 .nav div.on i { background:${C.ink}; }
    #s2 .main { position:absolute; left:220px; top:64px; width:820px; height:736px; border-radius:14px; }
    #s2 .h1 { position:absolute; left:36px; top:30px; font: 600 34px ${FONT.head}; letter-spacing:-.5px; }
    #s2 .new { position:absolute; left:594px; top:34px; width:190px; height:44px; border-radius:10px; background:${C.ink}; color:#fff; font: 600 18px ${FONT.body}; display:flex; align-items:center; justify-content:center; }
    #s2 .chips { position:absolute; left:36px; top:100px; display:flex; gap:12px; }
    #s2 .chips span { width:106px; height:34px; border-radius:17px; background:#F4F4F5; font-size:16px; display:flex; align-items:center; justify-content:center; }
    #s2 .chips span.on { background:${C.lime}; }
    #s2 .rows { position:absolute; left:36px; top:160px; width:748px; }
    #s2 .row { height:52px; border-radius:10px; border:1px solid ${C.hair}; background:#fff; margin-bottom:12px; display:flex; align-items:center; padding:0 16px; box-sizing:border-box; gap:16px; font-weight:500; font-size:18px; }
    #s2 .row .ic { width:24px; height:24px; border-radius:6px; background:#EEF0F3; }
    #s2 .row .av { margin-left:auto; display:flex; } #s2 .row .av i { width:24px; height:24px; border-radius:50%; border:3px solid #fff; margin-left:-8px; background:#D9DCE1; } #s2 .row .av i + i { background:#C7CBF5; }
    #s2 .row .st { width:118px; height:26px; border-radius:13px; font: 600 14px ${FONT.body}; display:flex; align-items:center; justify-content:center; }
    #s2 .act { position:absolute; left:1040px; top:224px; width:260px; height:536px; border-radius:12px; background:${C.sweep}; border:1px solid ${C.hair}; }
    #s2 .act b { position:absolute; left:20px; top:22px; font: 600 18px ${FONT.body}; }
    #s2 .act svg { position:absolute; left:20px; top:70px; }
    #s2 .bars { position:absolute; left:20px; top:190px; width:220px; }
    #s2 .bars div { height:12px; border-radius:6px; background:#E9EBEF; margin-bottom:32px; position:relative; }
    #s2 .bars div i { position:absolute; left:0; top:0; bottom:0; border-radius:6px; background:#C9CDD3; }
    #s2 .modal { position:absolute; left:760px; top:400px; width:520px; height:300px; border-radius:16px; background:#fff; border:2px solid ${C.hair}; box-shadow: 0 40px 80px -30px rgba(11,16,32,.35); }
    #s2 .modal b { position:absolute; left:28px; top:26px; font: 600 24px ${FONT.head}; }
    #s2 .modal .in { position:absolute; left:28px; top:84px; width:464px; height:54px; border:2px solid ${C.ink}; border-radius:10px; font-size:18px; color:#9AA0A8; display:flex; align-items:center; padding-left:18px; box-sizing:border-box; }
    #s2 .modal .send { position:absolute; left:28px; top:212px; width:200px; height:52px; border-radius:10px; background:${C.ink}; color:#fff; font: 600 17px ${FONT.body}; display:flex; align-items:center; justify-content:center; }
    #s2 .modal .cancel { position:absolute; left:244px; top:212px; width:120px; height:52px; border-radius:10px; background:#F4F4F5; font-size:17px; display:flex; align-items:center; justify-content:center; }
    #s2 .title { position:absolute; left:92px; top:842px; }
    #s2 .chip { display:inline-block; background:${C.lime}; font: 500 21px ${FONT.mono}; letter-spacing:1.5px; padding:5px 12px; border-radius:6px; }
    #s2 .title h2 { margin:14px 0 0; font: 600 58px ${FONT.head}; letter-spacing:-1px; white-space:nowrap; }
    #s2 .mono { position:absolute; left:96px; top:98px; font: 400 20px ${FONT.mono}; letter-spacing:1.5px; color:${C.grey}; }
    #s2 .portal { position:absolute; background:#fff; }
  </style>
  <div class="light"></div><div class="floor"></div>
  <div class="cam"><div class="rig"><div class="app">
    <div class="base"><div class="bar"><span class="dots"><i style="left:22px"></i><i style="left:46px"></i><i style="left:70px"></i></span><div class="url">app.workspace.dev/projects</div></div></div>
    <div class="side"><div class="brand">${starSvg(30, C.ink)}Workspace</div>
      <div class="nav">${['Home', 'Projects', 'Analytics', 'Team', 'Settings'].map((n, i) => `<div class="${i === 1 ? 'on' : ''}"><i></i>${n}</div>`).join('')}</div></div>
    <div class="main"><div class="h1">Projects</div><div class="new">New project</div>
      <div class="chips">${['All', 'In design', 'In review', 'Live'].map((n, i) => `<span class="${i ? '' : 'on'}">${n}</span>`).join('')}</div>
      <div class="rows">${[['Onboarding flow', 'In design', '#EEF0FF', C.blue], ['Billing service', 'In review', '#F4F4F5', C.grey], ['Design system', 'Live', '#F5FFD0', '#4A5A00'], ['Partner portal', 'In design', '#EEF0FF', C.blue], ['Admin console', 'Live', '#F5FFD0', '#4A5A00']]
        .map(([n, s, b, f]) => `<div class="row"><span class="ic"></span>${n}<span class="av"><i></i><i></i></span><span class="st" style="background:${b};color:${f}">${s}</span></div>`).join('')}</div></div>
    <div class="act"><b>Activity</b><svg width="220" height="100"><polyline pathLength="1" points="0,88 31,74 62,80 93,56 124,62 155,38 186,44 217,20" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/></svg>
      <div class="bars"><div><i style="width:150px;background:${C.blue}"></i></div><div><i style="width:100px"></i></div><div><i style="width:170px"></i></div></div></div>
    <div class="modal"><b>Invite teammate</b><div class="in">name@company.com</div><div class="send">Send invite</div><div class="cancel">Cancel</div></div>
  </div></div></div>
  <div class="title"><span class="chip">01 / SAAS</span><h2>SaaS Design &amp; Development</h2></div>
  <div class="mono">WEB APPS · DASHBOARDS · PLATFORMS</div>
  <div class="portal"></div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const rig = q('.rig'), app = q('.app'), portal = q('.portal'), modal = q('.modal');
  const spark = q('.act polyline');

  // GSAP timeline in absolute film seconds; seeked every frame (no ticker, no real time)
  const tl = gsap.timeline({ paused: true });
  const out = 'expo.out';
  tl.fromTo(qa('.side .brand, .nav div'), { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.55, ease: out, stagger: 0.05 }, 2.1)
    .fromTo(qa('.main .h1, .main .new'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: out, stagger: 0.06 }, 2.12)
    .fromTo(qa('.chips span'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: out, stagger: 0.05 }, 2.2)
    .fromTo(qa('.row'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: out, stagger: 0.067 }, CUE.rows + 0.12)
    .fromTo(q('.act'), { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.6, ease: out }, 2.26)
    .fromTo(spark, { strokeDashoffset: 1, strokeDasharray: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 2.36)
    .fromTo(qa('.bars i'), { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.6, ease: out, stagger: 0.08 }, 2.5)
    .fromTo(q('.title .chip'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: out }, CUE.titleS2[0])
    .fromTo(q('.title h2'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: out }, CUE.titleS2[0] + 0.06)
    .to(q('.title'), { opacity: 0, x: -60, duration: 0.25, ease: 'power3.in' }, CUE.titleS2[1])
    .fromTo(q('.mono'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: out }, 4.3)
    .to(q('.mono'), { opacity: 0, duration: 0.2, ease: 'power2.in' }, 5.45)
    // 2B: layers separate in depth (the camera then slides past them)
    .fromTo(q('.side'), { z: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }, { z: 120, boxShadow: '0 30px 60px -24px rgba(11,16,32,.28)', duration: 0.9, ease: out }, CUE.layers[0])
    .fromTo(q('.main'), { z: 0, backgroundColor: 'rgba(255,255,255,0)', boxShadow: '0 0 0 rgba(0,0,0,0)' }, { z: 230, backgroundColor: 'rgba(255,255,255,1)', boxShadow: '0 30px 70px -26px rgba(11,16,32,.3)', duration: 1.0, ease: out }, CUE.layers[0] + 0.05)
    .fromTo(q('.act'), { z: 0 }, { z: 170, duration: 0.95, ease: out }, CUE.layers[0] + 0.1)
    .fromTo(q('.base'), { filter: 'blur(0px)' }, { filter: 'blur(2.4px)', duration: 1.0, ease: 'power2.out' }, CUE.layers[0] + 0.2)
    .fromTo(modal, { opacity: 0, z: 330, y: 40 }, { opacity: 1, z: 420, y: 0, duration: 0.7, ease: out }, CUE.modal);

  // camera rig poses
  function pose(t) {
    let p = { x: 1222, y: 780, s: 2.6, rx: 0, ry: 0 };
    const A = { x: 150, y: 10, s: 1, rx: 12, ry: -22 }, Bp = { x: 150, y: 30, s: 1.05, rx: 7, ry: -20 }, Cp = { x: -90, y: 40, s: 0.86, rx: 32, ry: -30 };
    const k1 = E.out(inv(2.0, CUE.appSettle, t)), k2 = E.soft(inv(CUE.appSettle, CUE.craneEnd, t)), k3 = E.inOut(inv(CUE.layers[0], CUE.layers[1], t));
    const L = (a, b, k) => Object.fromEntries(Object.keys(a).map(n => [n, lerp(a[n], b[n], k)]));
    p = L(p, A, k1); if (t > CUE.appSettle) p = L(A, Bp, k2); if (t > CUE.craneEnd) p = L(Bp, Cp, k3);
    return p;
  }

  const visor = { x: 40, y: 30, w: 1840, h: 1020, r: 170 };
  function update(t) {
    const on = t >= 2 && t < 6;
    root.style.display = on ? '' : 'none';
    if (!on) return null;
    const p = pose(t);
    rig.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotateX(${p.rx}deg) rotateY(${p.ry}deg) scale(${p.s})`;
    tl.seek(t, false);

    // push through the modal: a flat portal grows from the modal's screen rect to the visor of S3
    const pt = inv(CUE.pushModal[0], CUE.pushModal[1], t);
    if (t >= CUE.pushModal[0]) {
      const r = modal.getBoundingClientRect(), sr = stage.getBoundingClientRect(), sc = sr.width / 1920;
      const r0 = { x: (r.left - sr.left) / sc, y: (r.top - sr.top) / sc, w: r.width / sc, h: r.height / sc };
      const g = E.in(pt);
      css(portal, { display: '', left: `${lerp(r0.x, visor.x, g)}px`, top: `${lerp(r0.y, visor.y, g)}px`, width: `${lerp(r0.w, visor.w, g)}px`, height: `${lerp(r0.h, visor.h, g)}px`,
        borderRadius: `${lerp(16, visor.r, g)}px`, background: mixHex('#FFFFFF', '#0E1016', inv(0.55, 1, pt)), opacity: String(inv(0, 0.12, pt)) });
      q('.cam').style.opacity = String(1 - inv(0.35, 0.75, pt));
    } else { portal.style.display = 'none'; q('.cam').style.opacity = '1'; }

    const dark = inv(0.5, 1, pt);
    return { bg: dark > 0 ? `linear-gradient(${mixHex('#F7F8FA', '#000000', dark)}, ${mixHex('#E2E5EA', '#000000', dark)})` : 'linear-gradient(180deg, #F7F8FA 0%, #EEF0F3 62%, #E2E5EA 100%)' };
  }
  return { update };
}
