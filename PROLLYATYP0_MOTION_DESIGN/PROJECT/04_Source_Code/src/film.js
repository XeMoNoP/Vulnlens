// FILM — composes the five scenes on one timeline. FILM.seek(t) renders exactly the
// frame at time t (seconds): no clocks, no timers, no state carried between frames.
import * as THREE from 'three';
import { DURATION, FPS } from './cues.js';
import { initS1 } from './s1.js';
import { initS2 } from './s2.js';
import { initS3 } from './s3.js';
import { initS4 } from './s4.js';
import { initS5 } from './s5.js';

const stage = document.getElementById('stage');
const bg = document.getElementById('bg');
const canvas = document.getElementById('gl');

const ready = (async () => {
  await Promise.all([
    document.fonts.load('600 100px "Inter Tight"'), document.fonts.load('500 100px "Inter Tight"'),
    document.fonts.load('400 100px "Inter"'), document.fonts.load('600 100px "Inter"'),
    document.fonts.load('400 100px "JetBrains Mono"'), document.fonts.load('500 100px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(1920, 1080, false);
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const ctx = { renderer, stage, THREE };
  // order = stacking order of each scene's DOM layers
  const scenes = [initS1(ctx), initS3(ctx), initS2(ctx), initS4(ctx), initS5(ctx)];

  function seek(t) {
    t = Math.min(Math.max(t, 0), DURATION - 1e-6);
    let three = null, bgCss = '#0B0B0B';
    for (const s of scenes) {
      const r = s.update(t);
      if (r && r.scene) three = r;
      if (r && r.bg) bgCss = r.bg;
    }
    bg.style.background = bgCss;
    if (three) {
      canvas.style.display = '';
      renderer.setClearColor(0x000000, 0);
      renderer.render(three.scene, three.camera);
      canvas.style.opacity = three.opacity == null ? '1' : String(three.opacity);
    } else {
      canvas.style.display = 'none';
    }
    return t;
  }
  window.FILM.seek = seek;
  window.FILM.debug = { renderer, THREE };
  return true;
})();

window.FILM = { ready, DURATION, FPS, seek: () => {} };

// interactive scrubbing when opened directly: ?t=12.5, ←/→ one frame, shift = 1 s, space = play
if (!navigator.webdriver) {
  ready.then(() => {
    const ui = document.getElementById('ui');
    const fit = () => { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `scale(${s})`; };
    fit(); addEventListener('resize', fit);
    let t = parseFloat(new URLSearchParams(location.search).get('t') || '0'), playing = false, last = 0;
    const show = () => { FILM.seek(t); ui.textContent = `t=${t.toFixed(3)}s  f${Math.round(t * FPS)}  ${playing ? '▶' : '❚❚'}  (space, ←/→, shift)`; };
    addEventListener('keydown', (e) => {
      if (e.key === ' ') { playing = !playing; last = performance.now(); }
      if (e.key === 'ArrowRight') t = Math.min(DURATION - 1 / FPS, t + (e.shiftKey ? 1 : 1 / FPS));
      if (e.key === 'ArrowLeft') t = Math.max(0, t - (e.shiftKey ? 1 : 1 / FPS));
      show();
    });
    const loop = (now) => { if (playing) { t += (now - last) / 1000; last = now; if (t >= DURATION) t = 0; show(); } requestAnimationFrame(loop); };
    show(); requestAnimationFrame(loop);
  });
} else {
  document.getElementById('ui').style.display = 'none';
}
