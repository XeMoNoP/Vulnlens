// SCENE 5 — BRAND RESOLUTION (24–30 s). Reference: @everestchris6 (one object carries the story,
// transitions emerge from objects already on screen, consistent identity, precise easing).
// 5A: the six prototype screens travel in along the blade axes and fold into the six 3D blades of
// the exact mark; the star aligns under a broad soft light (no flat spotlight circle), then settles
// onto the logo position with a 0.5 s weighted spring (≤2% overshoot, no snap).
// 5B: the exact logo, wordmark and tagline; everything is complete by 28.45 s and the frame holds
// completely still for 90 frames (28.5–30.0 s).
import * as THREE from 'three';
import { CUE } from './cues.js';
import { E, inv, lerp, clamp, el, css, C, FONT, springRemain, mixHex, win } from '../src/lib.js';
import { buildStar, buildSolid, graphite } from './star3d.js';
import { ITEMS, protoPose, screenHTML, STAR_C, STAR_R } from './proto.js';

export function initS5({ renderer, stage, env }) {
  const LG = window.LOGO, S = LG.star, B = LG.bbox, LW = B.x1 - B.x0, LH = B.y1 - B.y0;
  const kL = 1180 / LW, lx = 960 - 590, ly = 470 - LH * kL / 2;
  const fx = lx + (S.cx - B.x0) * kL, fy = ly + (S.cy - B.y0) * kL, fr = S.r * kL;

  const scene = new THREE.Scene();
  scene.environment = env; scene.environmentIntensity = 0.8;
  const FOV = 12, F = 540 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 50, 20000);
  camera.position.set(0, 0, F); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const mat = graphite(env); mat.envMapIntensity = 1.1;
  const star = buildStar(mat, { castShadow: false });
  scene.add(star.group);
  // solid hub star: grows from the 4B hub while the blades fold onto it; then it is the whole mark
  const solid = buildSolid(mat); star.group.add(solid);
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-900, 1100, 1400); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6f5, 0.9); fill.position.set(1200, -200, 900); scene.add(fill);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.lime), 1.4); rim.position.set(400, 700, -900); scene.add(rim);
  // map each prototype item to its blade
  const bladeOf = ITEMS.map(it => star.blades.find(b => b === it.blade) || star.blades.reduce((a, c) => Math.hypot(c.centroid[0] - it.blade.centroid[0], c.centroid[1] - it.blade.centroid[1]) < Math.hypot(a.centroid[0] - it.blade.centroid[0], a.centroid[1] - it.blade.centroid[1]) ? c : a));

  const root = el('div', { class: 'layer', id: 's5' }, stage);
  root.innerHTML = `
  <div class="shadow" style="position:absolute;width:620px;height:70px;background:radial-gradient(ellipse at 50% 50%, rgba(17,17,17,.20), rgba(17,17,17,0) 70%)"></div>
  ${ITEMS.map(it => `<div class="item p${it.i}" style="position:absolute;width:${it.w}px;height:${it.h}px;border-radius:${it.kind === 'phone' ? 34 : it.kind === 'tablet' ? 26 : 18}px;background:#fff;border:2px solid ${C.hair};overflow:hidden;box-shadow:0 30px 60px -30px rgba(17,17,17,.28)">${screenHTML(it.kind)}</div>`).join('')}
  <svg class="logo" width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
    <path class="lstar" fill="${C.ink}" fill-rule="evenodd" transform="translate(${lx} ${ly}) scale(${kL}) translate(${-B.x0} ${-B.y0})" d="${S.d}"/>
    <defs><clipPath id="wmclip"><rect x="${fx + fr * 0.98}" y="0" width="1920" height="1080"/></clipPath></defs>
    <g clip-path="url(#wmclip)"><g class="wm">${LG.glyphs.map(g => `<path class="gl" fill="${C.ink}" fill-rule="evenodd" transform="translate(${lx} ${ly}) scale(${kL}) translate(${-B.x0} ${-B.y0})" d="${g.d}"/>`).join('')}</g></g>
  </svg>
  <div class="rule" style="position:absolute;left:900px;top:640px;width:120px;height:8px;border-radius:4px;background:${C.lime}"></div>
  <div class="tag" style="position:absolute;left:0;right:0;top:700px;text-align:center;font:500 25px ${FONT.head};letter-spacing:6px;color:${C.ink};white-space:nowrap">${'ENGINEERING DIGITAL EXPERIENCES.'.split(' ').map(w => `<span style="display:inline-block;margin:0 6px">${w}</span>`).join('')}</div>`;
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const items = ITEMS.map(it => q(`.p${it.i}`)), lstar = q('.lstar'), glyphs = qa('.gl'), rule = q('.rule'), words = qa('.tag span'), shadow = q('.shadow');
  const glyphT = `translate(${lx} ${ly}) scale(${kL}) translate(${-B.x0} ${-B.y0})`;

  function update(t) {
    const on = t >= 24;
    root.style.display = on ? '' : 'none';
    if (!on) return null;

    // prototype screens continue inward from S4 and fade as their blade folds up
    ITEMS.forEach((it, i) => {
      const p = protoPose(i, t), td = CUE.dock[i];
      css(items[i], { left: `${p.x - it.w / 2}px`, top: `${p.y - it.h / 2}px`, transform: `scale(${p.sc}) rotate(${p.rot}deg)`, opacity: String(1 - inv(td - 0.12, td + 0.02, t)), display: t > td + 0.05 ? 'none' : '' });
    });

    // star: blades fold up as screens dock; alignment; weighted 0.5 s settle onto the logo position
    const settle = t >= CUE.settle[0] ? clamp(1 - springRemain(t - CUE.settle[0], 13, 0.8), -0.1, 1.1) : 0;
    const cx = lerp(STAR_C[0], fx, settle), cy = lerp(STAR_C[1], fy, settle), r = lerp(STAR_R, fr, settle);
    star.group.position.set(cx - 960, 540 - cy, 0);
    star.group.scale.setScalar(r / S.r);
    const al = E.inOut(inv(25.6, CUE.settle[0], t));
    star.group.rotation.set(THREE.MathUtils.degToRad(lerp(8, 0, al)), THREE.MathUtils.degToRad(lerp(-16, 0, al)), THREE.MathUtils.degToRad(lerp(-10, 0, E.out(inv(24.4, CUE.settle[1], t)))));
    star.blades.forEach(b => { b.pivot.visible = false; });
    const allDocked = CUE.dock[5] + 0.45;
    const hg = E.inOut(inv(24.0, 25.6, t));
    solid.scale.setScalar(t < allDocked ? lerp(32 / STAR_R, 0.985, hg) : 1); solid.position.z = t < allDocked ? -14 : 0;
    // finish blends from lacquer to flat ink across the settle (no hard material swap)
    const fl = E.inOut(inv(CUE.settle[0], CUE.settle[1] + 0.1, t));
    mat.color.setHex(0x1d1e23).lerp(new THREE.Color(0x111111), fl); mat.clearcoat = lerp(1, 0, fl); mat.envMapIntensity = lerp(1.1, 0.15, fl); mat.roughness = lerp(0.34, 0.9, fl);
    key.intensity = lerp(2.6, 0.4, fl); fill.intensity = lerp(0.9, 0.1, fl); rim.intensity = lerp(1.4, 0, fl);
    ITEMS.forEach((it, i) => {
      const b = bladeOf[i], td = CUE.dock[i];
      if (t < td - 0.06) return;
      const k = E.out(inv(td - 0.06, td + 0.42, t));
      b.pivot.visible = t < allDocked;
      const dx = Math.cos(b.axis), dy = Math.sin(b.axis);
      b.pivot.position.set(0, 0, 10 * (1 - k));
      b.pivot.rotation.set(-dy * 1.1 * (1 - k), dx * 1.1 * (1 - k), 0.5 * (1 - k));
      b.pivot.scale.setScalar(lerp(0.45, 1, k));
    });
    // controlled light: key swings slightly as the mark aligns
    key.position.set(lerp(-1300, -900, al), 1100, 1400); key.intensity = lerp(2.2, 2.6, al);

    // swap to the exact flat logo once the 3D star sits frontal on its logo position
    const sw = E.soft(inv(CUE.swap - 0.18, CUE.swap, t));
    lstar.style.opacity = String(sw);
    const show3d = t < CUE.swap + 0.02;
    const wa = E.out(inv(CUE.wordmark[0], CUE.wordmark[1] + 0.1, t));
    q('.wm').setAttribute('transform', `translate(${(1 - wa) * -(LW * kL * 0.82)} 0)`);
    rule.style.transform = `scaleX(${E.out(inv(CUE.rule[0], CUE.rule[1], t))})`;
    words.forEach((w, i) => { const a = E.out(inv(CUE.tagline + i * 0.04, CUE.tagline + i * 0.04 + 0.3, t)); css(w, { opacity: String(a), transform: `translateY(${(1 - a) * 8}px)` }); });
    css(shadow, { left: `${cx - 310}px`, top: `${cy + r * 1.08}px`, opacity: String(win(t, 25.4, CUE.settle[0] + 0.1, 0.4, 0.25)), transform: `scaleX(${r / STAR_R})` });

    // broad soft light: white → gently dimmed edges (assembly) → opens fully to white
    const dim = E.inOut(inv(CUE.dim[0], CUE.dim[1], t)) * (1 - E.inOut(inv(CUE.open[0], CUE.open[1], t)));
    const edge = mixHex('#FFFFFF', '#E4E7EC', dim), mid = mixHex('#FFFFFF', '#F4F5F7', dim);
    const bg = `radial-gradient(ellipse 150% 115% at 50% 22%, #FFFFFF 0%, ${mid} 46%, ${edge} 100%)`;
    return show3d ? { scene, camera, exposure: 1, bg } : { bg };
  }
  return { update };
}
