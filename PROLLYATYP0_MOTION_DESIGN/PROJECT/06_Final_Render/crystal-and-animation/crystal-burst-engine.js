// Crystal Burst engine — Prollyatyp0
// One self-contained ES module: builds its own markup + styles inside any element and runs the
// scroll-scrubbed crystal. Used by the HTML embed and the Framer code component.
//
//   import { mountCrystalBurst } from './crystal-burst-engine.js';
//   const cb = await mountCrystalBurst(document.getElementById('crystal-burst'), { model: 'crystal_asterisk.glb' });
//   cb.destroy();
//
// Options
//   model      URL or data: URI of crystal_asterisk.glb (required)
//   mode       'interactive' (the live Prollyatyp0 site behaviour: tumbles + floats, opens into orbiting
//              shards around a glowing portal on hover, rebuilds when the pointer leaves, click = enter)
//              | 'scroll' (scrubbed by page scroll) | 'autoplay' (plays by itself, loops)
//              | 'auto' (scroll normally, autoplay inside an iframe where page scroll can't be read)
//   portal     show the glowing portal when open (interactive mode, default true)
//   portalMedia image or video URL shown inside the portal (default: lavender glow)
//   portalLabel text in the portal (default 'Enter the dream', '' to hide)
//   onEnter    function called when the open crystal is clicked/tapped (also fires 'crystalburst:enter' on the element)
//   onOpen / onClose  functions called when the crystal opens / rebuilds
//   scrollFollow  interactive mode: follow the page scroll top to bottom like the live site (default true).
//                 Mount it in a fixed full-screen layer (position:fixed; inset:0; pointer-events:none) so it
//                 stays on screen while the page moves; hover/click still work through window listeners.
//                 Default journey (keyed to the live page's sections when they exist, otherwise to screen heights):
//                   hero: whole asterisk → About: glides to the side and breaks into loose chunks →
//                   Disciplines: pieces fly off → Works: small pieces drift across the page →
//                   end of page: the pieces collect at one place and join into the asterisk again.
//                 Scrolling back up reverses everything. Scroll speed adds spin.
//   stages     custom journey: [{ at, offset, state, x, y, s }, …] in page order.
//              at = page px | CSS selector (that element's top reaching the screen top) | 'top' | 'end'
//              offset = extra screen heights (+/-) · state = 'whole' | 'loose' | 'gone' | 'drift'
//              x, y = position as a fraction of the screen (x: 0.27 = right, -0.27 = left) · s = scale
//   dock          'right' | 'left' | 'center' — side it glides to while breaking (default 'right')
//   reform        true (default): the pieces join into the asterisk at the end of the page; false = keep drifting
//   reformLength  px before the page end over which they gather (default ~1.2 × window height)
//   reformAt      where they join: 'center' (default) | 'right' | 'left'
//   reformY       vertical offset of that spot, as a fraction of the screen height (default 0, + = up)
//   runway     scroll length in vh for 'scroll' mode (default 400)
//   headline   big text behind the crystal ('' = clean paper, default)
//   caption    small caption that fades in during the drift ('' to hide)
//   hint       show "Scroll to explore" (default true in scroll mode)
//   sound      show the Sound on/off button (default true)
//   paper, ink background and text colours (default #E8E6E1 / #0B0B0B)
//   transparent  true = no background: the page behind (e.g. your marquee text) shows through the canvas
//                and the crystal. The glass then can't bend that page content (WebGL can't see the DOM);
//                use `headline` instead when you want text refracted.
//   poster     optional image URL shown while loading and for reduced-motion / no-WebGL visitors
//
// Storyboard: 1 hero 0–15% · 2 turn 15–35% · 3 fracture 35–45% · 4 burst 45–65% · 5 drift 65–85% · 6 rebuild 85–100%
import * as THREE from 'https://esm.sh/three@0.169.0';
import { GLTFLoader } from 'https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.169.0/examples/jsm/loaders/DRACOLoader.js';

const DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/';
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;800&display=swap';

// ---------- helpers ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const sineInOut = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const cubicInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

const CSS = `
.cbx{position:relative;width:100%;background:var(--cbx-paper);color:var(--cbx-ink);font-family:"Inter Tight",system-ui,sans-serif}
.cbx *,.cbx *::before,.cbx *::after{box-sizing:border-box}
.cbx-sticky{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden}
.cbx.is-fill{height:100%}.cbx.is-fill .cbx-sticky{position:absolute;inset:0;height:100%}
.cbx-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.cbx-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--cbx-paper);transition:opacity .6s ease;pointer-events:none}
.cbx.is-live .cbx-poster{opacity:0}
.cbx-caption,.cbx-hint,.cbx-sound{position:absolute;margin:0;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.cbx-caption{left:clamp(16px,6vw,104px);bottom:56px;opacity:0}
.cbx-hint{right:clamp(16px,16vw,260px);bottom:56px;display:flex;align-items:center;gap:12px}
.cbx-mouse{width:14px;height:22px;border:1px solid currentColor;border-radius:8px;position:relative}
.cbx-mouse::after{content:"";position:absolute;left:50%;top:5px;width:2px;height:4px;margin-left:-1px;background:currentColor;border-radius:1px;animation:cbx-wheel 1.6s ease-in-out infinite}
@keyframes cbx-wheel{0%,100%{transform:translateY(0);opacity:1}60%{transform:translateY(6px);opacity:0}}
.cbx-sound{top:24px;right:clamp(16px,6vw,104px);background:none;border:0;color:inherit;cursor:pointer;padding:8px 0;font-family:inherit}
.cbx-sound:focus-visible{outline:1px solid currentColor;outline-offset:4px}
.cbx-portal-label{position:absolute;left:0;top:0;display:flex;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#fff;opacity:0;pointer-events:none;white-space:pre-line;line-height:1.35;transform:translate(-14px,-50%)}
.cbx-portal-label::before{content:"";flex:none;width:28px;height:28px;border:1px solid currentColor;border-radius:50%;background:radial-gradient(circle,currentColor 0 2px,transparent 3px)}
.cbx.is-static .cbx-canvas,.cbx.is-static .cbx-hint{display:none}
.cbx.is-static .cbx-caption{opacity:1}
@media (max-width:640px){.cbx-caption{bottom:88px}.cbx-hint{left:16px;right:auto;bottom:40px}}
`;

function ensureHeadAssets() {
  if (!document.getElementById('cbx-style')) {
    const s = document.createElement('style'); s.id = 'cbx-style'; s.textContent = CSS; document.head.appendChild(s);
  }
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_HREF; document.head.appendChild(l);
  }
}

export async function mountCrystalBurst(host, opts = {}) {
  const o = {
    model: '', mode: 'scroll', runway: 400, headline: '', caption: 'Design & technology studio — India',
    hint: true, sound: true, paper: '#E8E6E1', ink: '#0B0B0B', poster: '', transparent: false,
    portal: true, portalMedia: '', portalLabel: 'Enter\nthe dream', onEnter: null, onOpen: null, onClose: null,
    scrollFollow: true, stages: null, dock: 'right',
    ringText: 'HERBAL RX · BEVERAGE PACKAGING · OH BELLY · CUP RITUALS · FINSIGHT AI · ',
    ringTextEnd: 'SAY HELLO · START A PROJECT · THE NEXT MEMORY · ',
    reform: true, reformLength: 0, reformAt: 'right', reformY: 0.12, ...opts,
  };
  ensureHeadAssets();
  let mode = o.mode;
  if (mode === 'auto') { let framed = false; try { framed = window.self !== window.top; } catch { framed = true; } mode = framed ? 'autoplay' : 'scroll'; }

  // ---------- markup ----------
  const root = document.createElement('div');
  root.className = 'cbx' + (mode === 'autoplay' || mode === 'interactive' ? ' is-fill' : '');
  root.style.setProperty('--cbx-paper', o.transparent ? 'transparent' : o.paper); root.style.setProperty('--cbx-ink', o.ink);
  if (mode === 'scroll') root.style.height = `${o.runway}vh`;
  root.innerHTML = `
    <div class="cbx-sticky">
      <canvas class="cbx-canvas" aria-hidden="true"></canvas>
      ${o.poster ? `<img class="cbx-poster" alt="Prollyatyp0 crystal asterisk">` : ''}
      <p class="cbx-caption"></p>
      ${mode === 'interactive' && o.portal && o.portalLabel ? '<p class="cbx-portal-label"></p>' : ''}
      ${mode === 'scroll' && o.hint ? '<div class="cbx-hint"><span class="cbx-mouse"></span>Scroll to explore</div>' : ''}
      ${o.sound ? '<button class="cbx-sound" type="button" aria-pressed="false">Sound off</button>' : ''}
    </div>`;
  if (o.poster) root.querySelector('.cbx-poster').src = o.poster;
  root.querySelector('.cbx-caption').textContent = mode === 'interactive' ? '' : (o.caption || '');
  if (root.querySelector('.cbx-portal-label')) root.querySelector('.cbx-portal-label').textContent = o.portalLabel;
  host.appendChild(root);

  const cleanups = [];
  const api = {
    root, progress: 0, seek() {},
    destroy() { cleanups.splice(0).reverse().forEach((f) => { try { f(); } catch { /* ignore */ } }); root.remove(); },
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!webglOK()) { root.classList.add('is-static'); root.style.height = ''; return api; }
  try {
    await run(root, o, mode, reduce, api, cleanups);
  } catch (err) {
    console.error('[crystal-burst]', err);
    root.classList.add('is-static'); root.style.height = '';
  }
  return api;
}

async function run(root, o, mode, reduce, api, cleanups) {
  const canvas = root.querySelector('.cbx-canvas');
  const caption = root.querySelector('.cbx-caption');
  const hint = root.querySelector('.cbx-hint');
  const soundBtn = root.querySelector('.cbx-sound');
  const sticky = root.querySelector('.cbx-sticky');
  const headlineText = (o.headline || '').trim();
  if (reduce) { root.style.height = ''; root.classList.add('is-fill'); if (hint) hint.remove(); }

  // ---------- renderer / scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!o.transparent, powerPreference: 'high-performance' });
  if (o.transparent) renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  cleanups.push(() => { renderer.setAnimationLoop(null); renderer.dispose(); });

  const scene = new THREE.Scene();
  scene.background = o.transparent ? null : new THREE.Color(o.paper);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeStudio(), 0.02).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const CAM_Z = 9;
  camera.position.set(0, 0, CAM_Z);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3.5, 3, 3); scene.add(key);
  const rimWarm = new THREE.DirectionalLight(0xffd9b8, 2.4); rimWarm.position.set(-2.5, 1.5, -2.5); scene.add(rimWarm);
  const rimCool = new THREE.DirectionalLight(0xc4d4ff, 2.0); rimCool.position.set(2.5, -1.5, -2); scene.add(rimCool);

  // ---------- page plane behind the crystal (paper, optional headline) ----------
  const HEAD_Z = -2.5;
  const OVERSCAN = 1.12;
  const headCanvas = document.createElement('canvas');
  const headTex = new THREE.CanvasTexture(headCanvas);
  headTex.colorSpace = THREE.SRGBColorSpace;
  const headMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: headTex, toneMapped: false }));
  headMesh.position.z = HEAD_Z;
  headMesh.visible = !o.transparent || !!headlineText;
  scene.add(headMesh);
  if (headlineText) { try { await document.fonts.load(`800 200px "Inter Tight"`); } catch { /* fallback */ } }

  function drawPage(w, h) {
    const scale = headlineText ? Math.min(2, renderer.getPixelRatio() * 1.25) : 0.25;
    headCanvas.width = Math.max(2, Math.round(w * OVERSCAN * scale));
    headCanvas.height = Math.max(2, Math.round(h * OVERSCAN * scale));
    const g = headCanvas.getContext('2d');
    if (o.transparent) { g.clearRect(0, 0, headCanvas.width, headCanvas.height); headMesh.material.transparent = true; }
    else { g.fillStyle = o.paper; g.fillRect(0, 0, headCanvas.width, headCanvas.height); }
    if (headlineText) {
      g.fillStyle = o.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      const target = headCanvas.width / OVERSCAN * 0.86;
      let size = 100;
      g.font = `800 ${size}px "Inter Tight", "Helvetica Neue", Arial, sans-serif`;
      size = size * target / g.measureText(headlineText).width;
      g.font = `800 ${size}px "Inter Tight", "Helvetica Neue", Arial, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = `${-0.04 * size}px`;
      g.fillText(headlineText, headCanvas.width / 2, headCanvas.height / 2 + size * 0.04);
    }
    headTex.needsUpdate = true;
  }

  // ---------- soft grey halo + warm light cast on the page ----------
  const halo = makeGlow([[0, 'rgba(60,58,54,0.10)'], [0.5, 'rgba(60,58,54,0.04)'], [1, 'rgba(60,58,54,0)']]);
  const caustic = makeGlow([[0, 'rgba(255,252,244,1)'], [0.35, 'rgba(255,240,222,0.55)'], [1, 'rgba(255,236,214,0)']]);
  halo.position.z = HEAD_Z + 0.01; caustic.position.z = HEAD_Z + 0.02;
  scene.add(halo, caustic);

  // ---------- ice material ----------
  const iceU = { uFrost: { value: 0 } };
  function makeIce(home) {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04,
      transmission: 1, thickness: 0.9, ior: 1.5,
      attenuationColor: new THREE.Color(0xf1f5ff), attenuationDistance: 4,
      iridescence: 0.85, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 620],
      clearcoat: 0.6, clearcoatRoughness: 0.05, specularIntensity: 1,
      envMapIntensity: 1.5, side: THREE.DoubleSide,
    });
    if ('dispersion' in m) m.dispersion = 0.6;
    if (o.transparent) { m.defines = { ...(m.defines || {}), CBX_TRANSPARENT: '' }; m.transparent = true; }
    const uHome = { value: home.clone() };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHome = uHome;
      sh.uniforms.uFrost = iceU.uFrost;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uHome;\nvarying vec3 vIceP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvIceP = position + uHome;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uFrost;
varying vec3 vIceP;
float iceH(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float iceN(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(iceH(i), iceH(i+vec3(1,0,0)), f.x), mix(iceH(i+vec3(0,1,0)), iceH(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(iceH(i+vec3(0,0,1)), iceH(i+vec3(1,0,1)), f.x), mix(iceH(i+vec3(0,1,1)), iceH(i+vec3(1,1,1)), f.x), f.y), f.z); }
float iceF(vec3 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * iceN(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }`)
        .replace('void main() {', `void main() {
  float veins = pow(1.0 - abs(iceF(vIceP * 1.6 + 3.1) * 2.0 - 1.0), 160.0) * smoothstep(0.6, 0.7, iceN(vIceP * 1.1 + 5.0));
  float frostPatch = smoothstep(0.64, 0.86, iceF(vIceP * 2.2 + 7.0));
  float grain = iceN(vIceP * 38.0);
  float frost = clamp(frostPatch * 0.3 * (0.5 + grain) + uFrost * (0.7 + 0.3 * grain), 0.0, 1.0);
  float iceMask = clamp(veins * 0.6 + frost, 0.0, 1.0);`)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.98, 1.0), iceMask);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.32, frost);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.92, 0.96, 1.0) * (veins * 0.4 + uFrost * 0.12);')
        .replace('#include <transmission_fragment>',
          THREE.ShaderChunk.transmission_fragment.replace('material.transmission = transmission;', 'material.transmission = transmission * (1.0 - 0.75 * iceMask);'))
        // gem trick: look "through" the crystal into the studio along the refracted ray, one IOR per channel
        .replace('#include <opaque_fragment>', `
#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
  {
    vec3 vI = -geometryViewDir;
    vec3 rR = inverseTransformDirection( refract( vI, normal, 0.645 ), viewMatrix );
    vec3 rG = inverseTransformDirection( refract( vI, normal, 0.660 ), viewMatrix );
    vec3 rB = inverseTransformDirection( refract( vI, normal, 0.678 ), viewMatrix );
    vec3 inside = vec3(
      textureCubeUV( envMap, envMapRotation * rR, 0.015 ).r,
      textureCubeUV( envMap, envMapRotation * rG, 0.015 ).g,
      textureCubeUV( envMap, envMapRotation * rB, 0.015 ).b ) * envMapIntensity;
    float clearAmt = 0.62 * ( 1.0 - iceMask );
    outgoingLight = mix( outgoingLight, outgoingLight * 0.5 + inside * 0.72, clearAmt );
    #ifdef CBX_TRANSPARENT
      // nothing behind to refract: keep the facet structure, frost and veins visible as partial alpha
      float facet = clamp( dot( inside, vec3( 0.333 ) ) * 0.9 + iceMask * 0.8, 0.0, 1.0 );
      diffuseColor.a = max( diffuseColor.a, 0.18 + 0.62 * facet );
    #endif
  }
#endif
#include <opaque_fragment>`);
    };
    return m;
  }

  // ---------- load model ----------
  const loader = new GLTFLoader();
  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync(o.model);
  draco.dispose();
  gltf.scene.updateMatrixWorld(true);

  const spin = new THREE.Group();
  const crystal = new THREE.Group();
  crystal.add(spin); scene.add(crystal);

  let whole = null; const shards = [];
  const meshes = []; gltf.scene.traverse((m) => { if (m.isMesh) meshes.push(m); });
  for (const m of meshes) {
    spin.attach(m);
    if (m.name.startsWith('Crystal_Whole')) whole = m; else shards.push(m);
  }
  if (!whole || !shards.length) throw new Error('model is missing Crystal_Whole or shards');

  const box = new THREE.Box3().setFromObject(whole);
  const centre = box.getCenter(new THREE.Vector3());
  for (const m of [whole, ...shards]) m.position.sub(centre);
  const logoSize = box.getSize(new THREE.Vector3());
  whole.material = makeIce(whole.position);
  for (const m of shards) m.material = makeIce(m.position);

  const rnd = mulberry32(20261117);
  const shardData = shards.map((m) => {
    const home = m.position.clone();
    let dir = new THREE.Vector3(home.x, home.y, 0);
    if (dir.lengthSq() < 1e-4) dir.set(rnd() - 0.5, rnd() - 0.5, 0);
    dir.normalize();
    return {
      m, home, homeQ: m.quaternion.clone(), dir,
      speed: 0.7 + rnd() * 0.6,
      zkick: -0.35 + rnd() * 1.35,
      axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      spinAmt: 1.4 + rnd() * 2.2,
      depth: 0.4 + rnd() * 0.9,
    };
  });

  // ---------- small ice chips ----------
  const CHIPS = window.innerWidth < 760 ? 26 : 48;
  const chipMat = new THREE.MeshPhysicalMaterial({
    color: 0xf5f7fa, roughness: 0.18, transmission: 0.55, thickness: 0.15, ior: 1.45,
    iridescence: 0.4, envMapIntensity: 1.4, flatShading: true,
  });
  const chips = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1, 0), chipMat, CHIPS);
  chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  chips.frustumCulled = false;
  spin.add(chips);
  const chipData = Array.from({ length: CHIPS }, () => {
    const s = shardData[Math.floor(rnd() * shardData.length)];
    const origin = s.home.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.2));
    const dir = new THREE.Vector3(origin.x + (rnd() - 0.5) * 0.6, origin.y + (rnd() - 0.5) * 0.6, 0).normalize();
    return {
      origin, dir, speed: 1.6 + rnd() * 2.6, z: (rnd() - 0.2) * 2.2,
      size: 0.018 + Math.pow(rnd(), 2.2) * 0.07,
      axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), spinAmt: 4 + rnd() * 10,
    };
  });
  const cm = new THREE.Matrix4(), cq = new THREE.Quaternion(), cs = new THREE.Vector3(), cp = new THREE.Vector3();

  // ---------- crack lines along the fracture seams ----------
  const crackPos = [];
  const tmp = new THREE.Vector3();
  for (const s of shardData) {
    const eg = new THREE.EdgesGeometry(s.m.geometry, 35);
    const mat = new THREE.Matrix4().compose(s.home, s.homeQ, s.m.scale);
    const a = eg.attributes.position;
    for (let i = 0; i < a.count; i++) { tmp.fromBufferAttribute(a, i).applyMatrix4(mat); crackPos.push(tmp.x, tmp.y, tmp.z); }
    eg.dispose();
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.Float32BufferAttribute(crackPos, 3));
  const crackMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, toneMapped: false });
  const cracks = new THREE.LineSegments(crackGeo, crackMat);
  cracks.renderOrder = 10;
  spin.add(cracks);

  // ---------- layout ----------
  let unit = 1, VW = 1, VH = 1;
  function layout() {
    const r = sticky.getBoundingClientRect();
    const vw = Math.max(1, r.width), vh = Math.max(1, r.height);
    VW = vw; VH = vh;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    const dist = CAM_Z - HEAD_Z;
    const ph = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    headMesh.scale.set(ph * camera.aspect * OVERSCAN, ph * OVERSCAN, 1);
    drawPage(vw, vh);
    const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    unit = Math.min((vH * 0.52) / logoSize.y, (vH * camera.aspect * 0.62) / logoSize.x);
    crystal.scale.setScalar(unit);
  }
  layout();
  const ro = new ResizeObserver(layout); ro.observe(sticky);
  cleanups.push(() => ro.disconnect());

  // ---------- progress source ----------
  let target = 0, p = 0;
  // CSS sticky breaks inside containers that clip (overflow hidden/auto), which many site builders use.
  // In that case pin the viewport with a transform instead.
  let jsPin = false;
  if (mode === 'scroll' && !reduce) {
    for (let el = root.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (/(hidden|auto|scroll|clip)/.test(cs.overflow + cs.overflowY + cs.overflowX)) { jsPin = true; break; }
    }
    if (jsPin) { sticky.style.position = 'absolute'; sticky.style.left = '0'; sticky.style.right = '0'; sticky.style.top = '0'; sticky.style.willChange = 'transform'; }
  }
  function readScroll() {
    const r = root.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    target = run > 0 ? clamp01(-r.top / run) : 0;
    if (jsPin) sticky.style.transform = `translate3d(0,${Math.min(Math.max(-r.top, 0), Math.max(run, 0))}px,0)`;
  }
  if (mode === 'scroll' && !reduce) {
    readScroll();
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    cleanups.push(() => { window.removeEventListener('scroll', readScroll); window.removeEventListener('resize', readScroll); });
  }

  // ---------- pointer parallax ----------
  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  const onMove = (e) => { mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight * 2 - 1)); };
  window.addEventListener('pointermove', onMove, { passive: true });
  cleanups.push(() => window.removeEventListener('pointermove', onMove));

  // ---------- sound ----------
  const audio = createAudio();
  cleanups.push(() => audio.close());
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const on = audio.toggle();
      soundBtn.textContent = on ? 'Sound on' : 'Sound off';
      soundBtn.setAttribute('aria-pressed', String(on));
    });
  }

  // ---------- pose: a pure function of p, so it reverses exactly ----------
  const q = new THREE.Quaternion();
  let lastP = 0;
  function pose(p, t) {
    const turn = sineInOut(seg(p, 0.15, 0.35));
    const rebuild = cubicInOut(seg(p, 0.85, 1.0));
    const idleAmp = 1 - 0.7 * seg(p, 0.12, 0.3) + 0.7 * rebuild;

    let k = 0;
    if (p < 0.40) k = 0;
    else if (p < 0.45) k = 0.04 * smooth(seg(p, 0.40, 0.45));
    else if (p < 0.65) k = 0.04 + 0.96 * expoOut(seg(p, 0.45, 0.65));
    else if (p < 0.85) k = 1 + 0.35 * sineInOut(seg(p, 0.65, 0.85));
    else k = 1.35 * (1 - rebuild);

    const broken = p >= 0.40 && p < 0.995;
    whole.visible = !broken;
    for (const s of shardData) s.m.visible = broken;

    const away = 1 - rebuild;
    spin.rotation.set(
      -0.35 * turn * away + 0.07 * Math.sin(t * 0.9) * idleAmp,
      0.75 * turn * away + 0.09 * Math.sin(t * 0.55) * idleAmp,
      0.04 * Math.sin(t * 0.7) * idleAmp,
    );
    crystal.position.y = 0.06 * Math.sin(t * 1.05) * idleAmp;

    iceU.uFrost.value = 0.85 * smooth(seg(p, 0.33, 0.40)) * (1 - smooth(seg(p, 0.45, 0.58)));

    const crack = Math.sin(Math.PI * seg(p, 0.355, 0.445));
    crackMat.opacity = 0.9 * crack;
    cracks.visible = crack > 0.001;
    const shake = 0.012 * crack;
    crystal.position.x = shake * Math.sin(t * 93);
    crystal.position.y += shake * Math.cos(t * 71);

    const drift = clamp01((k - 1) / 0.35);
    for (const s of shardData) {
      if (!broken) break;
      const kk = k * s.speed;
      s.m.position.copy(s.home)
        .addScaledVector(s.dir, kk * 1.25)
        .add(tmp.set(mouseS.x * s.depth * 0.25 * drift, mouseS.y * s.depth * 0.18 * drift, s.zkick * k * 1.4));
      q.setFromAxisAngle(s.axis, s.spinAmt * k + 0.15 * Math.sin(t * 0.6 + s.depth * 7) * drift);
      s.m.quaternion.copy(s.homeQ).premultiply(q);
    }

    const chipLife = smooth(seg(p, 0.44, 0.47)) * (1 - smooth(seg(p, 0.86, 0.93)));
    chips.visible = chipLife > 0.001;
    if (chips.visible) {
      const kc = Math.max(0, k - 0.02);
      chipData.forEach((c, i) => {
        cp.copy(c.origin).addScaledVector(c.dir, kc * c.speed).add(tmp.set(0, -0.05 * kc * kc, c.z * kc));
        cq.setFromAxisAngle(c.axis, c.spinAmt * kc + t * 0.3);
        cs.setScalar(c.size * chipLife);
        chips.setMatrixAt(i, cm.compose(cp, cq, cs));
      });
      chips.instanceMatrix.needsUpdate = true;
    }

    const together = 1 - smooth(clamp01(k / 0.8));
    const hs = unit * logoSize.x;
    halo.scale.setScalar(hs * 2.3 * (1 + 0.25 * (1 - together)));
    halo.material.opacity = 0.35 + 0.65 * together;
    caustic.position.set(hs * (0.14 + 0.08 * Math.sin(spin.rotation.y)), -hs * 0.62 + crystal.position.y, caustic.position.z);
    caustic.scale.set(hs * 1.05, hs * 0.8, 1);
    caustic.material.opacity = 0.85 * together;

    const push = smooth(seg(p, 0.45, 0.65)) * (1 - rebuild);
    camera.position.set(mouseS.x * 0.12, mouseS.y * 0.08, CAM_Z * (1 - 0.03 * push));
    camera.lookAt(0, 0, 0);

    if (caption) caption.style.opacity = reduce ? '1' : (smooth(seg(p, 0.65, 0.72)) * (1 - smooth(seg(p, 0.85, 0.9)))).toFixed(3);
    if (hint) hint.style.opacity = (1 - smooth(seg(p, 0.02, 0.08))).toFixed(3);

    if (p > lastP) {
      if (lastP < 0.37 && p >= 0.37) audio.tick();
      if (lastP < 0.45 && p >= 0.45) audio.shatter();
      if (lastP < 0.93 && p >= 0.93) audio.lock();
    }
    audio.swell(turn * (1 - seg(p, 0.35, 0.45)));
    lastP = p;
  }

  // ---------- interactive mode: the live-site behaviour ----------
  // idle: tumble + float · hover: frost flash, crack, open into orbiting shards around a portal ·
  // leave: shards fly home · click while open: enter (callback/event)
  const RING = 1.12;               // ring radius, in logo units
  let openT = 0, open = 0, leaveAt = 0;
  const portalLabel = root.querySelector('.cbx-portal-label');
  let portal = null;
  if (mode === 'interactive' && o.portal) {
    portal = makePortal(o.portalMedia, o.paper);
    portal.position.z = -0.45;
    crystal.add(portal);
    cleanups.push(() => portal.userData.dispose());
  }
  const ringData = shardData.map((s) => ({
    a: Math.atan2(s.home.y, s.home.x),
    r: RING * (0.88 + 0.3 * rnd()),
    z: (rnd() - 0.3) * 0.7,
    bob: rnd() * Math.PI * 2,
    // 'drift' state: a spot somewhere on screen (fractions of the half-screen) and a smaller size
    dx: rnd() * 2 - 1, dy: rnd() * 2 - 1, dz: (rnd() - 0.6) * 1.6, dPh: rnd() * Math.PI * 2, dScale: 0.04 + rnd() * 0.07,
  }));
  // like the live site: only a few noticeable chunks drift across the page, the rest are slivers
  // Works on the live site: one chunk on the left, one smaller lower down, the rest tiny specks
  if (ringData[3]) Object.assign(ringData[3], { dx: -0.58, dy: 0.12, dz: 0.2, dScale: 0.7 });
  if (ringData[13]) Object.assign(ringData[13], { dx: -0.12, dy: -0.62, dz: 0, dScale: 0.38 });
  const driftW = new THREE.Vector3();
  const qInv = new THREE.Quaternion(), ringV = new THREE.Vector3();

  // hover: like the live site the crystal opens into 3–4 BIG chunks (groups of shards moving rigidly) around
  // the portal, not a ring of small shards. Each shard joins the chunk whose direction is closest to its own.
  // 3 big chunks like the live site: one above the portal, two at its lower left/right, overlapping its rim
  const CHUNKS = [
    { a: 1.45, r: 0.98, z: 0.45 },   // top (slightly right of centre)
    { a: 3.85, r: 0.95, z: 0.5 },    // lower left
    { a: 5.55, r: 0.97, z: 0.55 },   // lower right
  ];
  for (const s of shardData) {
    const ang = Math.atan2(s.home.y, s.home.x);
    let best = 0, bd = 9;
    CHUNKS.forEach((c, k) => { const d = Math.abs(Math.atan2(Math.sin(ang - c.a), Math.cos(ang - c.a))); if (d < bd) { bd = d; best = k; } });
    s.chunk = best;
  }
  CHUNKS.forEach((c, k) => {
    const mem = shardData.filter((s) => s.chunk === k);
    c.centre = mem.reduce((acc, s) => acc.add(s.home), new THREE.Vector3()).divideScalar(Math.max(1, mem.length));
    c.axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    c.turn = 0.7 + rnd() * 0.9;
    c.q = new THREE.Quaternion();
  });
  const openPos = new THREE.Vector3(), openQ = new THREE.Quaternion(), offV = new THREE.Vector3();

  // orbiting text ring around the crystal (hero: project names; end: "Say hello"), as on the live site
  const ringFont = '500 52px "Inter Tight", system-ui, sans-serif';
  try { await document.fonts.load(ringFont); } catch { /* fallback font */ }
  function makeTextRing(text) {
    const c = document.createElement('canvas'); c.width = 4096; c.height = 96;
    const g = c.getContext('2d');
    g.font = ringFont;
    if ('letterSpacing' in g) g.letterSpacing = '9px';
    const w = g.measureText(text).width || 1;
    const n = Math.max(1, Math.floor(c.width / w));
    g.setTransform(c.width / (n * w), 0, 0, 1, 0, 0);     // stretch slightly so the text tiles seamlessly
    g.fillStyle = o.ink; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) g.fillText(text, i * w, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false, opacity: 0 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.13, 180, 1, true), mat);
    // a flat ellipse seen almost edge-on, tilted down to the left (as on the live site)
    const tilt = new THREE.Group(); tilt.rotation.set(0.36, 0, 0.3); tilt.add(band);
    tilt.visible = false;
    crystal.add(tilt);
    cleanups.push(() => { tex.dispose(); mat.dispose(); band.geometry.dispose(); });
    return { tilt, band, mat };
  }
  const ringHero = mode === 'interactive' && o.ringText ? makeTextRing(o.ringText) : null;
  const ringEnd = mode === 'interactive' && o.ringTextEnd ? makeTextRing(o.ringTextEnd) : null;

  function pxPerUnit() { return VH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z) * unit; }
  function centreOnScreen() {
    const r = sticky.getBoundingClientRect();
    const k = pxPerUnit() / unit;
    return { x: r.left + VW / 2 + crystal.position.x * k, y: r.top + VH / 2 - crystal.position.y * k };
  }
  function overCrystal(cx, cy) {
    if (curLoose > 0.02) return false;          // only interactive while it is whole (hero, and again at the end)
    const c = centreOnScreen();
    const rad = (open > 0.5 ? RING + 0.35 : 0.95) * pxPerUnit() * (crystal.scale.x / unit);
    return Math.hypot(cx - c.x, cy - c.y) < rad;
  }

  // ---- page-scroll choreography (live-site behaviour), keyframed to page sections ----
  // states: whole (one asterisk) · loose (docked to the side, broken into floating chunks) ·
  //         gone (pieces flown off screen) · drift (small pieces floating sparsely across the page)
  const followScroll = mode === 'interactive' && o.scrollFollow !== false && !reduce;
  let syS = window.scrollY, lastSY = window.scrollY, velS = 0, rollExtra = 0, curLoose = 0, lastLoose = 0, lastBurst = 0, stageTick = 0;
  const side = o.dock === 'left' ? -1 : o.dock === 'center' ? 0 : 1;
  const rSide = o.reformAt === 'left' ? -1 : o.reformAt === 'right' ? 1 : 0;
  const STATES = {
    whole: { x: 0, y: 0, s: 1, loose: 0, gone: 0, drift: 0, frost: 0, ring: 0, ring2: 0, burst: 0 },
    loose: { x: 0.235 * side, y: -0.04, s: 0.76, loose: 1, gone: 0, drift: 0, frost: 0, ring: 0, ring2: 0, burst: 0 },
    gone: { x: 0.235 * side, y: -0.04, s: 0.76, loose: 1, gone: 1, drift: 0, frost: 0, ring: 0, ring2: 0, burst: 0 },
    drift: { x: 0, y: 0, s: 0.8, loose: 1, gone: 0, drift: 1, frost: 0, ring: 0, ring2: 0, burst: 0 },
  };
  // burst = the live site's burst (big chunks around the glowing portal), driven by scroll instead of hover
  const KEYS = ['x', 'y', 's', 'loose', 'gone', 'drift', 'frost', 'ring', 'ring2', 'burst'];
  function defaultStages() {
    // Matched second by second to the screen recording of the live site:
    //  hero: whole, tumbling, text ring · stays centred while the hero scrolls away · About: glides right,
    //  about hero size, frosting white · Disciplines: disappears into the cylinder, reappears small at its top
    //  centre (Design/Branding), grows big and wanders (Ecommerce/SaaS/AI), vanishes as the cylinder shrinks ·
    //  Works: a few pieces float in · Say hello: chips gather on the right into the asterisk with its text ring.
    const dockX = 0.275 * side;
    const end = o.reform === false ? { at: 'end', state: 'drift' }
      : { at: 'end', state: 'whole', x: rSide * 0.22, y: o.reformY ?? 0.14, s: 0.6, ring2: 1 };
    const reformFrom = -(o.reformLength ? o.reformLength / window.innerHeight : 0.9);
    const tiny = 0.002;
    if (document.querySelector('.a12-about') && document.querySelector('.a12-works')) {
      return [
        { at: 0, state: 'whole', ring: 1 },                                                     // hero (+ hover portal)
        { at: '.a12-about', offset: -0.82, state: 'whole', ring: 0, burst: 1 },                 // scroll starts → BURST
        { at: '.a12-about', offset: -0.4, state: 'whole', burst: 1 },                           // chunks orbit the portal
        { at: '.a12-about', offset: 0.05, state: 'whole', x: dockX, y: -0.05, s: 0.8, frost: 0.25 }, // rejoin, About: right
        { at: '.a12-disc', offset: -0.55, state: 'whole', x: dockX, y: -0.1, s: 0.8, frost: 0.75 },
        // Disciplines, retimed to the recording (section = 6 screens; 1 screen ≈ 2.7 s of the video):
        { at: '.a12-disc', offset: 0.2, state: 'whole', x: dockX, y: -0.22, s: tiny, frost: 0.9 },     // sinks + fades out at the right
        { at: '.a12-disc', offset: 1.9, state: 'whole', x: 0, y: 0.13, s: tiny, frost: 0.9 },         // hidden (Design band)
        { at: '.a12-disc', offset: 2.15, state: 'whole', x: 0, y: 0.13, s: 0.16, frost: 0.9 },        // reappears small at the top centre
        { at: '.a12-disc', offset: 3.1, state: 'whole', x: 0, y: 0.15, s: 0.22, frost: 0.92 },        // Branding
        { at: '.a12-disc', offset: 3.95, state: 'whole', x: 0, y: 0.26, s: 0.45, frost: 0.92 },       // grows as the camera enters the ring
        { at: '.a12-disc', offset: 4.7, state: 'whole', x: 0, y: 0.25, s: 0.55, frost: 0.92 },        // Ecommerce
        { at: '.a12-disc', offset: 5.15, state: 'whole', x: 0.05, y: 0.14, s: 0.68, frost: 0.92 },    // SaaS: moves right and down
        { at: '.a12-disc', offset: 5.7, state: 'whole', x: 0.04, y: 0.18, s: 0.76, frost: 0.92 },     // AI: biggest (kept on screen)
        { at: '.a12-works', offset: -0.12, state: 'whole', x: 0, y: 0.2, s: tiny, frost: 0.9 },        // gone as the cylinder shrinks
        { at: '.a12-works', offset: 0.35, state: 'drift' },                                     // Works: a few pieces float in
        { at: 'end', offset: reformFrom, state: 'drift' },
        end,                                                                                    // Say hello: rejoined + ring
      ];
    }
    // any other page: the same sequence, spaced by screen heights from the top and from the end
    return [
      { at: 0, state: 'whole', ring: 1 },
      { at: 'top', offset: 0.18, state: 'whole', ring: 0, burst: 1 },
      { at: 'top', offset: 0.6, state: 'whole', burst: 1 },
      { at: 'top', offset: 1.05, state: 'whole', x: dockX, y: -0.05, s: 0.8, frost: 0.25 },
      { at: 'top', offset: 1.7, state: 'whole', x: dockX, y: -0.1, s: 0.8, frost: 0.75 },
      { at: 'top', offset: 2.2, state: 'whole', x: 0, y: 0.2, s: tiny, frost: 0.9 },
      { at: 'top', offset: 2.8, state: 'whole', x: 0, y: 0.17, s: 0.25, frost: 0.9 },
      { at: 'top', offset: 3.8, state: 'whole', x: 0, y: 0.15, s: 0.7, frost: 0.92 },
      { at: 'top', offset: 4.6, state: 'whole', x: 0, y: 0.2, s: tiny, frost: 0.9 },
      { at: 'top', offset: 5.4, state: 'drift' },
      { at: 'end', offset: reformFrom, state: 'drift' },
      end,
    ];
  }
  let stages = [];
  function resolveStages() {
    const vh = window.innerHeight;
    const maxY = Math.max(0, document.documentElement.scrollHeight - vh);
    const defs = Array.isArray(o.stages) && o.stages.length ? o.stages : defaultStages();
    let prev = -Infinity;
    stages = defs.map((d) => {
      let y = 0;
      if (typeof d.at === 'number') y = d.at;
      else if (d.at === 'end') y = maxY;
      else if (d.at === 'top' || d.at == null) y = 0;
      else {
        const el = typeof d.at === 'string' ? document.querySelector(d.at) : d.at;
        y = el && el.getBoundingClientRect ? el.getBoundingClientRect().top + window.scrollY : 0;
      }
      y = Math.max(y + (d.offset || 0) * vh, prev + 1);
      prev = y;
      const p = { ...(STATES[d.state] || STATES.whole) };
      for (const k of KEYS) if (typeof d[k] === 'number') p[k] = d[k];
      return { y, p };
    });
  }
  const P = { x: 0, y: 0, s: 1, loose: 0, gone: 0, drift: 0, frost: 0, ring: 0, ring2: 0, burst: 0 };
  function evalStages(y) {
    Object.assign(P, STATES.whole);
    if (!followScroll || !stages.length) return P;
    const first = stages[0], last = stages[stages.length - 1];
    if (y <= first.y) return Object.assign(P, first.p);
    if (y >= last.y) return Object.assign(P, last.p);
    let i = 0; while (i < stages.length - 2 && y >= stages[i + 1].y) i++;
    const a = stages[i], b = stages[i + 1];
    const k = smooth(clamp01((y - a.y) / (b.y - a.y)));
    for (const key of KEYS) P[key] = a.p[key] + (b.p[key] - a.p[key]) * k;
    return P;
  }
  if (followScroll) {
    resolveStages();
    window.addEventListener('resize', resolveStages);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resolveStages);
    cleanups.push(() => window.removeEventListener('resize', resolveStages));
  }
  api.stages = () => stages.map((s) => ({ ...s.p, scrollAt: Math.round(s.y) }));
  // dev tool: how many visible shards are (partly) outside the screen right now
  api.offscreen = () => {
    const v = new THREE.Vector3(); let out = 0, shown = 0;
    if (whole.visible && crystal.visible) {
      shown++;
      const b = new THREE.Box3().setFromObject(whole);
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
        if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1) { out++; break; }
      }
    }
    for (const s of shardData) {
      if (!s.m.visible || !crystal.visible) continue;
      shown++;
      s.m.getWorldPosition(v); v.project(camera);
      if (Math.abs(v.x) > 0.92 || Math.abs(v.y) > 0.9) out++;
    }
    return { shown, out };
  };
  api.refresh = resolveStages;
  function setOpen(v) {
    if (v === openT) return;
    openT = v;
    if (v) { audio.shatter(); if (typeof o.onOpen === 'function') o.onOpen(); }
    else { audio.lock(); if (typeof o.onClose === 'function') o.onClose(); }
  }
  function enter() {
    root.dispatchEvent(new CustomEvent('crystalburst:enter', { bubbles: true }));
    if (typeof o.onEnter === 'function') o.onEnter();
  }
  if (mode === 'interactive' && !reduce) {
    let cursorSet = false;
    const onPMove = (e) => {
      if (e.pointerType === 'touch') return;
      const isOver = overCrystal(e.clientX, e.clientY);
      if (isOver !== cursorSet) { cursorSet = isOver; document.documentElement.style.cursor = isOver ? 'pointer' : ''; }
      if (isOver) { leaveAt = 0; setOpen(1); } else if (openT && !leaveAt) leaveAt = performance.now() + 250;
    };
    cleanups.push(() => { if (cursorSet) document.documentElement.style.cursor = ''; });
    const onPDown = (e) => {
      const over = overCrystal(e.clientX, e.clientY);
      if (e.pointerType === 'touch') {           // touch: first tap opens, second tap enters, tap outside closes
        if (over && openT && open > 0.75) enter();
        else setOpen(over ? 1 : 0);
      } else if (over && open > 0.75) enter();
    };
    // window listeners, so it also works when the layer has pointer-events:none
    window.addEventListener('pointermove', onPMove, { passive: true });
    window.addEventListener('pointerdown', onPDown);
    cleanups.push(() => { window.removeEventListener('pointermove', onPMove); window.removeEventListener('pointerdown', onPDown); });
  }
  api.open = () => setOpen(1);
  api.close = () => setOpen(0);
  api.freezeOpen = (v) => { open = openT = clamp01(v); };   // dev tool: hold the hover sequence at one point
  Object.defineProperty(api, 'state', { get: () => ({ open, openT, scrollY: Math.round(syS), ...P }) });
  // dev tool: average ms per frame for n synchronous renders (independent of requestAnimationFrame throttling)
  api.benchmark = (n = 30, openAmount = null) => {
    const gl = renderer.getContext(); const px = new Uint8Array(4);
    const keep = open; if (openAmount !== null) open = openT = openAmount;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      if (mode === 'interactive') poseInteractive(i * 0.016, 0.016); else pose(p, i * 0.016);
      renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    const ms = (performance.now() - t0) / n;
    if (openAmount !== null) open = openT = keep;
    return { msPerFrame: +ms.toFixed(2), size: [VW, VH], pixelRatio: renderer.getPixelRatio() };
  };

  const scatV = new THREE.Vector3();
  function poseInteractive(t, dt) {
    // --- page scroll: smoothed position + velocity (adds spin, like the live site) → stage blend ---
    const sy = window.scrollY;
    velS += ((sy - lastSY) / Math.max(dt, 0.001) - velS) * Math.min(1, dt * 8);
    lastSY = sy;
    syS += (sy - syS) * Math.min(1, dt * 6);
    if (Math.abs(sy - syS) < 0.5) syS = sy;
    rollExtra += clamp01(Math.abs(velS) / 3000) * Math.sign(velS) * dt * 2.6;   // scroll speed spins it
    if (followScroll && ++stageTick % 90 === 0) resolveStages();   // pick up layout changes
    evalStages(syS);
    const loose = P.loose, gone = P.gone, drift = P.drift;
    curLoose = loose;
    if (loose > 0.02 && openT) setOpen(0);
    if (lastLoose < 0.5 && loose >= 0.5) audio.shatter();          // breaking
    if (lastLoose > 0.5 && loose <= 0.5) audio.lock();             // pieces join again
    if (lastBurst < 0.5 && P.burst >= 0.5) audio.shatter();       // scroll burst
    if (lastBurst > 0.5 && P.burst <= 0.5) audio.lock();
    lastBurst = P.burst;
    lastLoose = loose;
    crystal.visible = gone < 0.995;

    if (leaveAt && performance.now() > leaveAt) { leaveAt = 0; setOpen(0); }
    // the live site's hover is a timed sequence (~2.4 s in, ~0.9 s out), so open runs linearly in time:
    // 0–0.4 purple streak flows in from the right · 0.4–0.62 explosion · 0.5–0.95 portal grows from a dot
    if (openT > open) open = Math.min(openT, open + dt / 2.4);
    else if (openT < open) open = Math.max(openT, open - dt / 0.9);
    const openEff = Math.max(open, P.burst);              // hover open, or the scroll burst
    const e = expoOut(seg(openEff, 0.4, 0.64));          // the explosion: fast out, slow settle
    const broken = e > 0.002 || loose > 0.01;
    whole.visible = !broken;
    for (const s of shardData) s.m.visible = broken;

    // idle motion, like the live site: a wide rock (face mostly towards you, sometimes nearly edge-on) with a
    // gentle roll. Scrolling adds a full spin that then settles back to the nearest whole turn.
    const TAU = Math.PI * 2;
    rollExtra += (Math.round(rollExtra / TAU) * TAU - rollExtra) * Math.min(1, dt * 0.9);
    const rock = 1 - 0.6 * e;
    spin.rotation.set(
      (0.38 * Math.sin(t * 0.41) + 0.16 * Math.sin(t * 0.17)) * rock,
      (1.0 * Math.sin(t * 0.31) + 0.25 * Math.sin(t * 0.73)) * rock + rollExtra,
      0.22 * Math.sin(t * 0.29) + 0.1 * Math.sin(t * 0.13),
    );
    // dock position (world units at the crystal's depth)
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    const visW = visH * camera.aspect;
    const wide = camera.aspect > 1.05;
    crystal.position.x = wide ? P.x * visW : 0;
    crystal.position.y = 0.07 * Math.sin(t * 1.0) + P.y * visH - (wide ? 0 : visH * 0.18 * loose * (1 - drift) * (1 - gone));
    crystal.scale.setScalar(unit * Math.max(P.s, 0.002));
    crystal.visible = gone < 0.995 && P.s > 0.004;
    crystal.updateMatrixWorld(true);
    qInv.copy(spin.quaternion).invert();
    const sc = crystal.scale.x;

    // the big hover chunks: each one moves out to its spot around the portal and turns as one rigid piece
    if (e > 0.001) {
      CHUNKS.forEach((c) => {
        c.q.setFromAxisAngle(c.axis, (c.turn + t * 0.12) * e);
      });
    }

    // frost flash + crack lines when it opens, when scrolling breaks it, and when the pieces join again
    const brk = Math.sin(Math.PI * clamp01(loose)) * (1 - drift) * (1 - gone);
    // before the explosion the crystal frosts and cracks while the streak arrives
    iceU.uFrost.value = Math.max(0.7 * Math.max(Math.sin(Math.PI * seg(openEff, 0.15, 0.55)), brk), P.frost);
    crackMat.opacity = 0.9 * Math.max(Math.sin(Math.PI * seg(openEff, 0.22, 0.46)), Math.pow(brk, 3));
    cracks.visible = crackMat.opacity > 0.001;

    // shards: hover → 3–4 big chunks around the portal; scroll → loose chunks / drifting across the page
    const orbit = t * 0.12;
    shardData.forEach((s, i) => {
      if (!broken) return;
      const rd = ringData[i];
      // open position: the shard's chunk target (camera-facing, slowly orbiting) + its offset inside the chunk
      const ch = CHUNKS[s.chunk];
      const a = ch.a + orbit * 0.12;
      ringV.set(Math.cos(a) * ch.r, Math.sin(a) * ch.r + 0.05 * Math.sin(t * 0.8 + s.chunk), ch.z).applyQuaternion(qInv);
      offV.copy(s.home).sub(ch.centre).applyQuaternion(ch.q).multiplyScalar(1.06);
      openPos.copy(ringV).add(offV);
      openQ.copy(ch.q).multiply(s.homeQ);
      const looseOnly = loose * (1 - drift);
      // 'gone' no longer throws pieces off screen: they drift out a little and shrink away where they are
      const out = looseOnly * (0.3 + 0.4 * s.speed) + gone * 0.35 * s.speed;
      scatV.copy(s.home).addScaledVector(s.dir, out)
        .add(tmp.set(0.05 * Math.sin(t * 0.8 + s.depth * 9) * loose, 0.05 * Math.cos(t * 0.7 + s.depth * 5) * loose + gone * 0.2 * s.depth, s.zkick * looseOnly * 0.45));
      if (drift > 0.001) {
        // a spot on the screen (world space) that slowly wanders, converted into the crystal's local space
        driftW.set(
          (rd.dx * 0.46 + 0.03 * Math.sin(t * 0.15 + rd.dPh)) * visW,
          (rd.dy * 0.4 + 0.03 * Math.cos(t * 0.13 + rd.dPh)) * visH,
          rd.dz,
        ).sub(crystal.position).divideScalar(sc).applyQuaternion(qInv);
        scatV.lerp(driftW, drift);
      }
      s.m.position.copy(scatV).lerp(openPos, e)
        .add(tmp.set(mouseS.x * s.depth * 0.12 * (e + drift), mouseS.y * s.depth * 0.08 * (e + drift), 0));
      s.m.scale.setScalar(Math.max(1e-3, (1 + (rd.dScale - 1) * drift) * (1 - gone)));
      q.setFromAxisAngle(s.axis, s.spinAmt * (loose * 0.5 + gone * 1.4) + t * 0.15 * loose);
      s.m.quaternion.copy(s.homeQ).premultiply(q).slerp(openQ, e);
    });

    // orbiting text rings (hero / end), hidden while open
    for (const [rg, k] of [[ringHero, P.ring], [ringEnd, P.ring2]]) {
      if (!rg) continue;
      const op = k * (1 - e) * (1 - loose);
      rg.tilt.visible = op > 0.01;
      rg.mat.opacity = 0.92 * op;
      rg.band.rotation.y = -t * 0.22;
    }

    // chips: the explosion scatters them across the whole screen (as on the live site), then they drift;
    // or around the loose chunks / across the page while scrolling
    const chipK = Math.max(e, loose * (1 - gone));
    chips.visible = chipK > 0.01;
    if (chips.visible) {
      chipData.forEach((c, i) => {
        cp.set((((i * 61 + 7) % 100) / 50 - 1) * 0.47 * visW + 0.025 * visW * Math.sin(t * 0.21 + i),
          (((i * 29 + 43) % 100) / 50 - 1) * 0.43 * visH + 0.02 * visH * Math.cos(t * 0.17 + i), c.z * 0.5)
          .sub(crystal.position).divideScalar(sc).applyQuaternion(qInv);
        scatV.copy(c.origin).addScaledVector(c.dir, loose * (1 - drift) * c.speed * 0.35).add(tmp.set(0, 0, c.z * 0.3 * loose));
        if (drift > 0.001) {
          driftW.set((((i * 73) % 100) / 50 - 1) * 0.48 * visW + 0.02 * visW * Math.sin(t * 0.2 + i),
            (((i * 37 + 11) % 100) / 50 - 1) * 0.44 * visH, c.z * 0.4)
            .sub(crystal.position).divideScalar(sc).applyQuaternion(qInv);
          scatV.lerp(driftW, drift);
        }
        cp.lerp(scatV, 1 - e);
        cq.setFromAxisAngle(c.axis, c.spinAmt * chipK + t * 0.4);
        cs.setScalar(c.size * chipK * (1 - 0.35 * drift) * (drift > 0.5 && i % 3 ? 0 : 1));
        chips.setMatrixAt(i, cm.compose(cp, cq, cs));
      });
      chips.instanceMatrix.needsUpdate = true;
    }

    // portal, like the live site: a purple streak flows in from the right edge to the crystal (and flows
    // back out to the right when it closes), collapses to a small dot at the explosion, then grows
    if (portal) {
      const edgeX = (visW * 0.55 - crystal.position.x) / sc;           // just past the right edge, local units
      const flowIn = smooth(seg(openEff, 0.0, 0.4));
      const dot = seg(openEff, 0.4, 0.5);
      const grow = smooth(seg(openEff, 0.5, 0.95));
      const FULL = 2.25;                                               // portal diameter at full size (logo units)
      let px = 0, sx = 0.12, sy = 0.12;
      if (openEff < 0.4) { px = edgeX * (1 - flowIn) + 0.6 * (1 - flowIn); sx = 0.9 + 2.2 * Math.sin(Math.PI * Math.min(1, flowIn * 1.15)); sy = 0.42 + 0.12 * flowIn; }
      else if (openEff < 0.5) { sx = 0.9 + (0.14 - 0.9) * dot; sy = 0.54 + (0.14 - 0.54) * dot; }
      else { sx = sy = 0.12 + (FULL - 0.12) * grow; }
      portal.visible = openEff > 0.002;
      portal.position.x = px;
      portal.scale.set(sx, sy, 1);
      portal.userData.update(t, clamp01(openEff / 0.05));
    }
    if (portalLabel) {
      // "Enter the dream" sits at the pointer while it is over the open portal (the live site's cursor label)
      const pl = smooth(seg(openEff, 0.8, 1.0));
      const r = sticky.getBoundingClientRect();
      const mx = (mouse.x + 1) / 2 * window.innerWidth, my = (1 - mouse.y) / 2 * window.innerHeight;
      const c = (mouse.x || mouse.y) && openT ? { x: mx, y: my } : centreOnScreen();
      portalLabel.style.left = `${c.x - r.left}px`;
      portalLabel.style.top = `${c.y - r.top}px`;
      portalLabel.style.opacity = pl.toFixed(3);
    }

    const together = (1 - e) * (1 - loose);
    const exit = Math.max(gone, drift);
    const hs = crystal.scale.x * logoSize.x;
    // halo/cast light sit on the page plane: project the crystal's x/y onto it (perspective)
    const pk = (CAM_Z - HEAD_Z) / CAM_Z;
    halo.position.x = crystal.position.x * pk; halo.position.y = crystal.position.y * pk;
    halo.scale.setScalar(hs * 2.3 * (1 + 0.35 * e));
    halo.material.opacity = (0.35 + 0.65 * (1 - e)) * (1 - exit);
    caustic.position.set(crystal.position.x * pk + hs * (0.14 + 0.08 * Math.sin(spin.rotation.y)), crystal.position.y * pk - hs * 0.62, caustic.position.z);
    caustic.scale.set(hs * 1.05, hs * 0.8, 1);
    caustic.material.opacity = 0.85 * together;

    camera.position.set(mouseS.x * 0.12, mouseS.y * 0.08, CAM_Z);
    camera.lookAt(0, 0, 0);
    if (caption) caption.style.opacity = '0';
  }

  // ---------- loop (paused off-screen) ----------
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(root);
  cleanups.push(() => io.disconnect());
  const clock = new THREE.Clock();
  let first = true;
  const AUTO_LEN = 10, AUTO_HOLD = 2;   // autoplay: 10 s sequence, 2 s rest, loop
  let frames = 0, slow = 0;   // adaptive quality: drop to 1× resolution if most frames take > 25 ms
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    if (!visible && !first) return;
    if (raw < 0.2) { frames++; if (raw > 0.025) slow++; }    // ignore throttled/background gaps
    if (frames >= 90) {
      if (slow / frames > 0.6 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); layout(); }
      frames = slow = 0;
    }
    const t = clock.elapsedTime;
    if (reduce) target = 0;
    else if (mode === 'scroll') readScroll();
    else if (mode === 'autoplay') target = Math.min(1, (t % (AUTO_LEN + AUTO_HOLD)) / AUTO_LEN);
    if (mode === 'autoplay' && target < p - 0.5) p = target; // loop restart: jump, don't rewind
    p += (target - p) * Math.min(1, dt * 7);
    if (Math.abs(target - p) < 1e-4) p = target;
    mouseS.lerp(mouse, Math.min(1, dt * 3));
    if (mode === 'interactive') poseInteractive(reduce ? 0 : t, dt);
    else pose(p, reduce ? 0 : t);
    renderer.render(scene, camera);
    api.progress = p;
    if (first) { first = false; root.classList.add('is-live'); }
  });

  api.seek = (v) => {
    v = clamp01(v);
    if (mode === 'scroll') {
      const top = window.scrollY + root.getBoundingClientRect().top;
      window.scrollTo(0, top + v * (root.offsetHeight - window.innerHeight));
    }
    target = p = v;
  };
}

// ---------- portal: glowing disc with a soft wavy white rim (optional image/video inside) ----------
// Opaque (blended into the paper colour by hand) so the glass shards in front of it refract it.
function makePortal(media, paper) {
  const uniforms = {
    uTex: { value: null }, uHasTex: { value: 0 }, uTime: { value: 0 }, uOpen: { value: 0 },
    uPaper: { value: new THREE.Color(paper) },
  };
  let video = null, tex = null;
  if (media) {
    if (/\.(mp4|webm|mov)(\?|$)/i.test(media)) {
      video = Object.assign(document.createElement('video'), { src: media, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous' });
      video.play().catch(() => {});
      tex = new THREE.VideoTexture(video);
    } else {
      tex = new THREE.TextureLoader().load(media);
    }
    tex.colorSpace = THREE.SRGBColorSpace;
    uniforms.uTex.value = tex; uniforms.uHasTex.value = 1;
  }
  const mat = new THREE.ShaderMaterial({
    uniforms, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D uTex; uniform float uHasTex; uniform float uTime; uniform float uOpen; uniform vec3 uPaper; varying vec2 vUv;
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x);
        float edge = 0.86 + 0.018 * sin(a * 7.0 + uTime * 1.3) + 0.012 * sin(a * 13.0 - uTime * 0.9) + 0.006 * sin(a * 23.0 + uTime * 2.1);
        float inside = smoothstep(edge, edge - 0.03, r);
        vec3 base = mix(vec3(0.035, 0.02, 0.2), vec3(0.22, 0.16, 0.8), smoothstep(0.95, 0.0, r));
        base += vec3(0.08, 0.05, 0.2) * smoothstep(0.35, 0.0, abs(p.y + 0.15 * sin(p.x * 3.0 + uTime * 0.4)));
        if (uHasTex > 0.5) base = texture2D(uTex, vec2(0.5) + p * 0.5 / 0.86).rgb;
        float rim = smoothstep(edge - 0.14, edge, r) * inside;
        vec3 col = mix(base, vec3(1.0), rim * 0.9);
        float glow = smoothstep(edge + 0.14, edge, r) * (1.0 - inside);
        float alpha = clamp(inside + glow * 0.9, 0.0, 1.0) * uOpen;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(mix(uPaper, mix(vec3(1.0), col, inside), alpha), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = -1;
  mesh.userData.update = (t, k) => { uniforms.uTime.value = t; uniforms.uOpen.value = k; };
  mesh.userData.dispose = () => { if (video) { video.pause(); video.src = ''; } if (tex) tex.dispose(); mat.dispose(); };
  return mesh;
}

// ---------- radial glow plane ----------
function makeGlow(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [off, col] of stops) gr.addColorStop(off, col);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
}

// ---------- reflection studio: dark-to-light gradient room + softbox strips ----------
function makeStudio() {
  const s = new THREE.Scene();
  const geo = new THREE.SphereGeometry(20, 48, 24);
  const col = [];
  const lo = new THREE.Color(0.02, 0.022, 0.03), mid = new THREE.Color(0.16, 0.17, 0.19), hi = new THREE.Color(0.97, 0.97, 0.96);
  const c = new THREE.Color();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 20;
    c.copy(lo).lerp(mid, smooth(clamp01((y + 0.5) / 0.8)));
    c.lerp(hi, smooth(clamp01((y - 0.15) / 0.6)));
    c.multiplyScalar(0.82);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, x, y, z, color, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(9, 3, -8, 11, 11, 0xffffff, 4);
  box(0.6, 26, 13, 2.5, 13, 0xffffff, 7);
  box(0.5, 18, -14, -3, 12, 0xffffff, 4);
  box(1.6, 14, -10, 1, -6, 0xffe6d2, 3);
  box(1.6, 14, 10, -1, -6, 0xd8e2ff, 3);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    box(0.35, 16, Math.cos(a) * 15, (i % 2 ? 2 : -2), -Math.abs(Math.sin(a)) * 15 - 2, 0xffffff, 3 + (i % 3));
  }
  box(12, 0.5, 0, -12, -6, 0xffffff, 3);
  box(12, 0.5, 0, 6, -14, 0xffffff, 4);
  return s;
}

// ---------- Web Audio: synthesised, no audio files ----------
function createAudio() {
  let ctx = null, master = null, on = false, padGain = null;
  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b;
  }
  function start() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    const n = ctx.createBufferSource(); n.buffer = noiseBuffer(2); n.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
    padGain = ctx.createGain(); padGain.gain.value = 0;
    n.connect(lp).connect(padGain).connect(master); n.start();
  }
  function burst(dur, f0, f1, gain, type = 'bandpass', qv = 1) {
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(dur);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = qv;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur);
  }
  function ping(freq, at, dur, gain) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master); osc.start(t); osc.stop(t + dur + 0.02);
  }
  function thump() {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t); osc.frequency.exponentialRampToValueAtTime(42, t + 0.35);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(g).connect(master); osc.start(t); osc.stop(t + 0.5);
  }
  return {
    toggle() { if (!ctx) start(); on = !on; if (on) ctx.resume(); else ctx.suspend(); return on; },
    tick() { if (!on) return; burst(0.05, 7000, 3000, 0.35, 'highpass'); ping(3400, 0, 0.12, 0.05); },
    shatter() {
      if (!on) return;
      burst(0.9, 7500, 1800, 0.45, 'bandpass', 0.8);
      thump();
      for (let i = 0; i < 9; i++) ping(2200 + Math.random() * 4200, Math.random() * 0.5, 0.25 + Math.random() * 0.4, 0.04);
    },
    lock() { if (!on) return; ping(1760, 0, 0.5, 0.07); ping(2640, 0.06, 0.6, 0.05); },
    swell(v) { if (on && padGain) padGain.gain.setTargetAtTime(0.06 * v, ctx.currentTime, 0.1); },
    close() { if (ctx) ctx.close(); },
  };
}
