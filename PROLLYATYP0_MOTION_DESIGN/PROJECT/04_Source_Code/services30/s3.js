// SCENE 3 — AR/VR SOLUTIONS (10–18 s). References: @mdaman010 (procedural world, atmosphere,
// camera choreography), @petert (VR intro in three.js — keep spatial UI restrained) and
// @ivanainai (premium studio presentation of one 3D object).
// 3A: the SaaS chart line becomes the route of a detailed dusk world — layered ridges with rock/snow
// material variation, dusk rim light, layered fog, distant ranges, landmarks — on a controlled crane.
// 3B: the world becomes a clay architectural model on a walnut plinth on a real desk (PBR, cast and
// contact shadows, reflected light, scale cues). A reticle selects it (pinch), it rotates 60° on a
// turntable with tracked anchors, and the lime AR anchor ring is carried into S4.
import * as THREE from 'three';
import { CUE } from './cues.js';
import { HAND } from './handoff.js';
import { E, inv, lerp, clamp, el, css, C, FONT, fbm, mixHex, springRemain } from '../src/lib.js';

export function initS3({ stage, env }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 1, 40000);
  const model = new THREE.Group(); scene.add(model);
  const room = new THREE.Group(); scene.add(room);

  // ── terrain
  const routeX = (z) => 160 * Math.sin(z * 0.0017) + 70 * Math.sin(z * 0.0043 + 1.3);
  const ridge = (x, z) => { const n = fbm(x * 0.0011 + 3.1, z * 0.0011 + 7.7, 6); return 1 - Math.abs(2 * n - 1); };
  const H = (x, z) => {
    const m = THREE.MathUtils.smoothstep(Math.abs(x - routeX(z)), 80, 620);
    const far = THREE.MathUtils.smoothstep(-z, 400, 3600);
    const mount = Math.pow(ridge(x, z), 1.8) * (280 + 380 * far) + fbm(x * 0.005, z * 0.005, 3) * 46;
    return -10 + m * mount + (1 - m) * fbm(x * 0.012, z * 0.012, 2) * 12;
  };
  const tg = new THREE.PlaneGeometry(8000, 8000, 220, 220); tg.rotateX(-Math.PI / 2); tg.translate(0, 0, -3000);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, H(tp.getX(i), tp.getZ(i)));
  const geo = tg.toNonIndexed(); geo.computeVertexNormals();
  // material variation by height and slope (dusk palette) + a clay palette for the AR model
  const gp = geo.attributes.position, gn = geo.attributes.normal, nV = gp.count;
  const col = new Float32Array(nV * 3), clay = new Float32Array(nV * 3);
  const cMoss = new THREE.Color(0xc9cec6), cRock = new THREE.Color(0xaab0bd), cRock2 = new THREE.Color(0x8f96a6), cSnow = new THREE.Color(0xffffff), cClay = new THREE.Color(0xe9e4da), cClay2 = new THREE.Color(0xcfc8bb), tmp = new THREE.Color();
  for (let i = 0; i < nV; i++) {
    const y = gp.getY(i), slope = 1 - gn.getY(i), x = gp.getX(i), z = gp.getZ(i);
    tmp.copy(cMoss).lerp(cRock, THREE.MathUtils.smoothstep(y + slope * 120, 20, 140));
    tmp.lerp(cRock2, THREE.MathUtils.smoothstep(y, 220, 420) * 0.7);
    tmp.lerp(cSnow, THREE.MathUtils.smoothstep(y - slope * 160, 430, 560));
    const j = (fbm(x * 0.03, z * 0.03, 2) - 0.5) * 0.12; tmp.offsetHSL(0, 0, j);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
    tmp.copy(cClay2).lerp(cClay, clamp(0.4 + y / 500)); clay.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('clay', new THREE.BufferAttribute(clay, 3));

  const U = { uWipe: { value: 1e4 }, uR: { value: 1e6 }, uC: { value: new THREE.Vector2() }, uClay: { value: 0 }, uRim: { value: 0 }, uRimCol: { value: new THREE.Color(0xffffff) } };
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true });
  terrainMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 clay; varying vec3 vModelPos; uniform float uClay; uniform float uR; uniform vec2 uC; uniform float uWipe;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vModelPos = position;
        float ed = max(abs(position.x - uC.x), abs(position.z - uC.y));
        float edge = 1.0 - smoothstep(uR * 0.78, uR * 0.97, ed);
        float base = -12.0;
        float hy = mix(transformed.y, base + (transformed.y - base) * 0.62, uClay);
        transformed.y = mix(transformed.y, mix(base, hy, edge), uClay);`)
      .replace('#include <color_vertex>', '#include <color_vertex>\nvColor = mix(vColor, clay, smoothstep(uWipe - 30.0, uWipe + 30.0, position.y));');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vModelPos; uniform float uR; uniform vec2 uC; uniform float uRim; uniform vec3 uRimCol;')
      .replace('void main() {', 'void main() {\nif (max(abs(vModelPos.x - uC.x), abs(vModelPos.z - uC.y)) > uR) discard;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
        totalEmissiveRadiance += uRimCol * fres * uRim * smoothstep(60.0, 300.0, vModelPos.y) * 0.5;`);
  };
  const terrain = new THREE.Mesh(geo, terrainMat); terrain.castShadow = true; terrain.receiveShadow = true; model.add(terrain);

  // ── route, landmarks
  const pts = []; for (let z = 200; z >= -3600; z -= 70) pts.push(new THREE.Vector3(routeX(z), H(routeX(z), z) + 3, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  const limeBasic = (o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), toneMapped: false, fog: false, ...o });
  const sqClip = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uR = U.uR; sh.uniforms.uC = U.uC;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvMP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMP; uniform float uR; uniform vec2 uC;').replace('void main() {', 'void main() {\nif (max(abs(vMP.x - uC.x), abs(vMP.z - uC.y)) > uR * 0.97) discard;'); }; return m; };
  const routeMat = sqClip(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ink), toneMapped: false, fog: false, transparent: true })); const route = new THREE.Mesh(new THREE.TubeGeometry(curve, 800, 2.8, 8), routeMat); model.add(route);
  const glowMat = sqClip(limeBasic({ transparent: true, opacity: 0.5, depthWrite: false }));
  model.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 800, 7, 8), glowMat));
  const ringPos = curve.getPointAt(0.56).add(new THREE.Vector3(0, 95, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(78, 3.4, 16, 120), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ink), toneMapped: false, fog: false }));
  const ringLime = new THREE.Mesh(new THREE.TorusGeometry(78, 9, 16, 120), limeBasic({ transparent: true, opacity: 0.8, depthWrite: false })); ring.add(ringLime); ring.position.copy(ringPos); ring.lookAt(curve.getPointAt(0.2).add(new THREE.Vector3(0, 80, 0))); model.add(ring);
  const stone = new THREE.MeshStandardMaterial({ color: 0x23252c, roughness: 0.55, metalness: 0.2 });
  const monoliths = [];
  [[0.3, -270, 210], [0.34, 290, 250], [0.47, -300, 190]].forEach(([u, dx, h]) => {
    const p = curve.getPointAt(u); const g = new THREE.Group(); g.position.set(p.x + dx, H(p.x + dx, p.z) - 6, p.z);
    const b = new THREE.Mesh(new THREE.BoxGeometry(46, h, 46), stone); b.position.y = h / 2; b.castShadow = true; g.add(b);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(3, h * 0.72, 47), limeBasic()); slit.position.y = h * 0.55; g.add(slit);
    g.rotation.y = 0.35 * Math.sign(dx); model.add(g); monoliths.push(g);
  });
  // distant ranges (layered silhouettes, atmospheric perspective)
  const ranges = [];
  [[-5200, 520, 0xc9ced8, 0.0], [-7200, 760, 0xd9dce4, 1.0], [-9400, 900, 0xe6e8ee, 2.0]].forEach(([z, h, c, s]) => {
    const sh = new THREE.Shape(); sh.moveTo(-14000, -400);
    for (let x = -14000; x <= 14000; x += 260) sh.lineTo(x, h * (0.35 + 0.65 * Math.pow(fbm(x * 0.00035 + s * 9, s, 4), 1.6)));
    sh.lineTo(14000, -400); sh.lineTo(-14000, -400);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: c, fog: false })); m.position.z = z; model.add(m); ranges.push(m);
  });
  // layered fog sheets
  const fogTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(cv); })();
  const fogSheets = [];
  [[60, -900, 2600], [110, -1700, 3600], [40, -2400, 4200], [160, -3200, 5200]].forEach(([y, z, s], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.45), new THREE.MeshBasicMaterial({ map: fogTex, color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(routeX(z) + (i % 2 ? 260 : -260), y, z); model.add(m); fogSheets.push(m);
  });

  // sky dome (GLSL): dusk band at the horizon, deep blue zenith
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, transparent: true, uniforms: { uOpacity: { value: 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vDir; uniform float uOpacity;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){ float y = vDir.y;
        vec3 warm = vec3(1.0,1.0,1.0), band = vec3(0.98,0.985,0.99), mid = vec3(0.93,0.945,0.965), zen = vec3(0.88,0.905,0.94);
        vec3 c = mix(warm, band, smoothstep(-0.02, 0.05, y)); c = mix(c, mid, smoothstep(0.05, 0.22, y)); c = mix(c, zen, smoothstep(0.22, 0.7, y));
        float s = 0.0;
        gl_FragColor = vec4(c, uOpacity); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), skyMat); scene.add(sky);
  scene.fog = new THREE.Fog(0xf3f4f7, 450, 4600);

  // dusk lights: low warm sun ahead (rim), cool sky fill
  const hemi = new THREE.HemisphereLight(0xffffff, 0xaeb2bc, 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-2200, 2600, 1400); scene.add(sun);
  const cool = new THREE.DirectionalLight(0x9aa8d6, 0.55); cool.position.set(800, 900, 1500); scene.add(cool);

  // ── AR room (daylight studio) around the model centre Cl
  const Cl = curve.getPointAt(0.4); Cl.y = -12;
  U.uC.value.set(Cl.x, Cl.z);
  const HALF = 720, S1 = 46 / HALF;
  const rMats = []; const rm = (o) => { const m = new THREE.MeshPhysicalMaterial({ fog: false, transparent: true, envMap: env, ...o }); rMats.push(m); return m; };
  const box = (w, h, d, mat, x, y, z, parent = room) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(Cl.x + x, Cl.y + y, Cl.z + z); b.castShadow = true; b.receiveShadow = true; parent.add(b); return b; };
  const deskTop = -10;  // desk surface (world, relative to Cl.y)
  box(620, 8, 320, rm({ color: 0xa27a52, roughness: 0.52, clearcoat: 0.2 }), 30, deskTop - 4, 10);
  const wallM = new THREE.Mesh(new THREE.PlaneGeometry(3200, 1800), rm({ color: 0xf6f6f4, roughness: 0.95 })); wallM.position.set(Cl.x, Cl.y + 300, Cl.z - 280); wallM.receiveShadow = true; room.add(wallM);
  const floorM = new THREE.Mesh(new THREE.PlaneGeometry(3200, 1800), rm({ color: 0xe9e7e2, roughness: 0.9 })); floorM.rotation.x = -Math.PI / 2; floorM.position.set(Cl.x, Cl.y - 160, Cl.z); room.add(floorM);
  // walnut plinth with a bevel
  const pl = new THREE.Shape(); const pw = HALF * S1 * 1.12, pr = 4; pl.moveTo(-pw + pr, -pw); pl.lineTo(pw - pr, -pw); pl.quadraticCurveTo(pw, -pw, pw, -pw + pr); pl.lineTo(pw, pw - pr); pl.quadraticCurveTo(pw, pw, pw - pr, pw); pl.lineTo(-pw + pr, pw); pl.quadraticCurveTo(-pw, pw, -pw, pw - pr); pl.lineTo(-pw, -pw + pr); pl.quadraticCurveTo(-pw, -pw, -pw + pr, -pw);
  const plGeo = new THREE.ExtrudeGeometry(pl, { depth: 9, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2 }); plGeo.rotateX(-Math.PI / 2);
  const plinth = new THREE.Mesh(plGeo, rm({ color: 0x3a281d, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 })); plinth.castShadow = plinth.receiveShadow = true; room.add(plinth);
  // props for scale: laptop, notebook, mug
  const alu = rm({ color: 0xc9ccd2, metalness: 0.9, roughness: 0.28 });
  const lap = new THREE.Group(); lap.position.set(Cl.x + 205, Cl.y + deskTop, Cl.z - 70); lap.rotation.y = -0.5; room.add(lap);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(150, 3.5, 100), alu); lb.position.y = 1.8; lb.castShadow = true; lap.add(lb);
  const ls = new THREE.Mesh(new THREE.BoxGeometry(150, 98, 3), alu); ls.position.set(0, 50, -50); ls.rotation.x = -0.2; ls.castShadow = true; lap.add(ls);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(138, 86), rm({ color: 0x101218, emissive: 0x1b2030, emissiveIntensity: 1, roughness: 0.2 })); scr.position.set(0, 50, -48.3); scr.rotation.x = -0.2; lap.add(scr);
  box(64, 2.4, 88, rm({ color: 0x2b2e36, roughness: 0.7 }), -138, deskTop + 1.2, 78).rotation.y = 0.22;
  const mug = new THREE.Group(); mug.position.set(Cl.x - 120, Cl.y + deskTop, Cl.z - 70); room.add(mug);
  const mugM = rm({ color: 0xf3f1ec, roughness: 0.35, clearcoat: 0.6 });
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(10, 9, 24, 32, 1, true), mugM); mb.position.y = 12; mb.castShadow = true; mug.add(mb);
  const mbot = new THREE.Mesh(new THREE.CircleGeometry(9, 32), mugM); mbot.rotation.x = -Math.PI / 2; mbot.position.y = 0.5; mug.add(mbot);
  const mh = new THREE.Mesh(new THREE.TorusGeometry(6, 1.6, 10, 24, Math.PI * 1.2), mugM); mh.position.set(10.5, 13, 0); mh.rotation.z = -Math.PI * 0.6; mh.castShadow = true; mug.add(mh);
  // room light: soft daylight from the left with shadows
  const roomKey = new THREE.DirectionalLight(0xfff2e4, 0); roomKey.position.set(Cl.x - 420, Cl.y + 520, Cl.z + 260); roomKey.target.position.copy(Cl);
  roomKey.castShadow = true; roomKey.shadow.mapSize.set(2048, 2048); Object.assign(roomKey.shadow.camera, { left: -340, right: 340, top: 340, bottom: -340, near: 50, far: 1600 }); roomKey.shadow.bias = -0.0003; roomKey.shadow.radius = 8; roomKey.shadow.blurSamples = 16;
  scene.add(roomKey, roomKey.target);
  const roomFill = new THREE.HemisphereLight(0xffffff, 0x9a8f80, 0); scene.add(roomFill);
  // AR anchor ring on the desk
  const anchorMat = limeBasic({ transparent: true });
  const anchor = new THREE.Mesh(new THREE.RingGeometry(70, 71.6, 160), anchorMat); anchor.rotation.x = -Math.PI / 2; anchor.position.set(Cl.x, Cl.y + deskTop + 0.6, Cl.z); room.add(anchor);

  // ── DOM overlay
  const ui = el('div', { class: 'layer', id: 's3ui' }, stage);
  ui.innerHTML = `
  <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
    <defs><radialGradient id="lens3" cx=".5" cy=".5" r=".62"><stop offset=".74" stop-color="#8A90A0" stop-opacity="0"/><stop offset="1" stop-color="#8A90A0" stop-opacity=".16"/></radialGradient></defs>
    <path class="morphg" fill="none" stroke="${C.lime}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path class="morph" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect class="lensv" width="1920" height="1080" fill="url(#lens3)"/>
    <path class="visor" fill="#ECEEF2" fill-rule="evenodd" stroke="#111" stroke-opacity=".18" stroke-width="2"/>
    <g class="ar" fill="none" stroke-linecap="round">
      ${[0, 1, 2, 3].map(() => '<path class="br" stroke-width="4"/>').join('')}
      <path class="scl" stroke="#111" stroke-width="2.5"/>
    </g>
    <circle class="ret" fill="none" stroke="${C.lime}" stroke-width="4"/><circle class="retdot" r="5" fill="${C.lime}" stroke="${C.ink}" stroke-width="2"/>
  </svg>
  ${[['WAYPOINT 02', 'Studio Ridge', 0.72], ['LAYERS', 'Terrain · Route · Light', 0.45]].map(([a, b, w], i) => `<div class="vp vp${i}" style="position:absolute;width:470px;box-sizing:border-box;padding:22px 26px;border-radius:20px;background:rgba(255,255,255,.86);border:1.5px solid rgba(17,17,17,.12);box-shadow:0 24px 50px -28px rgba(17,17,17,.35);color:#111;transform-origin:0 0">
    <div style="font:500 17px ${FONT.mono};letter-spacing:2px;opacity:.72">${a}</div><div style="font:600 36px ${FONT.head};letter-spacing:-.5px;margin-top:6px">${b}</div>
    <div style="margin-top:16px;height:12px;border-radius:6px;background:#E5E7EB"><div style="height:12px;width:${w * 100}%;border-radius:6px;background:${C.lime}"></div></div></div>`).join('')}
  <div class="t3" style="position:absolute;left:0;right:0;top:92px;text-align:center;color:#111"><span style="display:inline-block;background:${C.lime};color:${C.ink};font:500 20px ${FONT.mono};letter-spacing:1.5px;padding:6px 12px;border-radius:6px;vertical-align:middle;margin-right:16px">02 / AR·VR</span><span style="font:600 52px ${FONT.head};letter-spacing:-1px;vertical-align:middle">AR/VR Solutions</span></div>
  <div class="card" style="position:absolute;width:330px;box-sizing:border-box;padding:18px 22px;border-radius:16px;background:rgba(255,255,255,.9);border:1.5px solid ${C.hair};box-shadow:0 18px 40px -20px rgba(0,0,0,.35);color:${C.ink}">
    <div class="cst" style="font:500 15px ${FONT.mono};letter-spacing:1.5px;color:${C.grey}">AR · PLACED</div>
    <div style="font:600 28px ${FONT.head};margin-top:4px">Studio Ridge</div>
    <div class="crot" style="font:400 18px ${FONT.body};color:${C.grey};margin-top:4px">Terrain model · 1 : 500</div></div>
  <div class="sclab" style="position:absolute;font:500 17px ${FONT.mono};letter-spacing:1.5px;color:#111;white-space:nowrap">1 : 500 · 920 m</div>
  <div class="white" style="position:absolute;inset:0;background:#fff"></div>
  <svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible"><ellipse class="carry" fill="none" stroke="${C.lime}" stroke-width="7"/></svg>`;
  const q = (s) => ui.querySelector(s), qa = (s) => [...ui.querySelectorAll(s)];
  const visorEl = q('.visor'), lensv = q('.lensv'), morph = q('.morph'), morphg = q('.morphg'), vps = [q('.vp0'), q('.vp1')], t3 = q('.t3');
  const brs = qa('.br'), scl = q('.scl'), sclab = q('.sclab'), card = q('.card'), cst = q('.cst'), crot = q('.crot'), ret = q('.ret'), retdot = q('.retdot'), carry = q('.carry'), white = q('.white');
  const rr = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const v3 = new THREE.Vector3();
  const proj = (p) => { v3.copy(p).project(camera); return [(v3.x + 1) * 960, (1 - v3.y) * 540, v3.z]; };

  // camera choreography (model space): high start looking at the horizon → crane down the route
  const camStart = new THREE.Vector3(routeX(300), 300, 300);
  const fpAt = (t) => {
    const k = E.inOut(inv(CUE.crane[0], CUE.crane[1], t));
    const u = lerp(0.0, 0.2, k);
    const onRoute = curve.getPointAt(u).add(new THREE.Vector3(0, 70, 0));
    const pos = camStart.clone().lerp(onRoute, E.soft(k));
    const lookFar = new THREE.Vector3(routeX(-4000), 240, -9000), lookRoute = curve.getPointAt(Math.min(1, u + 0.12)).add(new THREE.Vector3(0, 40, 0));
    const look = lookFar.lerp(lookRoute, E.inOut(inv(10.4, 13.2, t)));
    return { pos, look };
  };
  const highLocal = Cl.clone().add(new THREE.Vector3(-260, 1500, 1900));
  const deskCam = Cl.clone().add(new THREE.Vector3(-40, 74, 236)), deskLook = Cl.clone().add(new THREE.Vector3(14, 16, 0));
  // HAND: horizon y at 10.0 s (infinity point straight ahead of the start pose)
  { const f = fpAt(10); camera.position.copy(f.pos); camera.lookAt(f.look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const dir = f.look.clone().sub(f.pos); dir.y = 0; dir.normalize().multiplyScalar(1e7);
    HAND.horizonY = proj(f.pos.clone().add(dir))[1]; }

  let rot = 0;
  function place(t) {
    const ka = E.inOut(inv(CUE.rise[0], CUE.rise[1], t)), kb = E.inOut(inv(CUE.shrink[0], CUE.shrink[1], t));
    const s = Math.pow(S1, kb);
    rot = THREE.MathUtils.degToRad(60) * E.inOut(inv(CUE.rotate[0], CUE.rotate[1], t));
    model.scale.setScalar(s); model.rotation.y = rot;
    const R = new THREE.Vector3(Cl.x, 0, Cl.z).multiplyScalar(s).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    model.position.set(Cl.x - R.x, Cl.y * (1 - s), Cl.z - R.z);
    plinth.position.set(Cl.x, Cl.y - 10.2, Cl.z); plinth.rotation.y = rot;
    const fp = fpAt(t);
    const camL = fp.pos.clone().lerp(highLocal, ka), lookL = fp.look.clone().lerp(Cl, ka);
    // before the shrink, the model has no rotation, so local→world is p*s + offset
    const w = (p) => p.clone().multiplyScalar(s).add(new THREE.Vector3(Cl.x * (1 - s), Cl.y * (1 - s), Cl.z * (1 - s)));
    const drift = new THREE.Vector3(16 * E.soft(inv(14.9, 18, t)), -6 * E.soft(inv(14.9, 18, t)), -10 * E.soft(inv(14.9, 18, t)));
    camera.position.copy(w(camL)).lerp(deskCam.clone().add(drift), kb);
    camera.lookAt(w(lookL).lerp(deskLook, kb));
    camera.fov = lerp(58, 40, kb); camera.near = lerp(1, 0.5, kb); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    return { ka, kb, s };
  }

  function update(t) {
    const on = t >= 10 && t < 18.02;
    ui.style.display = on ? '' : 'none';
    if (!on) return null;
    const { ka, kb, s } = place(t);
    U.uR.value = lerp(1e5, HALF, E.inOut(inv(CUE.rise[0] - 0.05, CUE.rise[1] + 0.05, t)));
    U.uClay.value = E.inOut(inv(CUE.shrink[0], CUE.shrink[1] + 0.1, t));
    U.uWipe.value = t < CUE.shrink[0] - 0.1 ? 1e4 : lerp(820, -120, E.inOut(inv(CUE.shrink[0] - 0.1, CUE.shrink[1] + 0.05, t)));
    U.uRim.value = 1 - U.uClay.value;
    terrainMat.roughness = lerp(0.9, 0.75, U.uClay.value);
    scene.fog.near = 500 * s; scene.fog.far = lerp(5200, 60000, kb) * s;
    skyMat.uniforms.uOpacity.value = 1 - inv(14.1, 14.5, t); sky.visible = skyMat.uniforms.uOpacity.value > 0;
    ranges.forEach(m => { m.visible = ka < 0.9; }); fogSheets.forEach(m => { m.material.opacity = 0.6 * (1 - ka); m.visible = ka < 1; });
    ring.visible = ka < 0.95; monoliths.forEach(m => { m.visible = true; });
    hemi.intensity = lerp(1.25, 0.3, kb); sun.intensity = lerp(2.3, 0, kb); cool.intensity = lerp(0.55, 0, kb);
    const rIn = inv(10.5, 10.72, t); routeMat.opacity = rIn; glowMat.opacity = 0.5 * rIn;

    // room + daylight
    const ra = inv(0.55, 1, kb);
    room.visible = ra > 0; rMats.forEach(m => { m.opacity = ra; m.transparent = ra < 1; m.depthWrite = ra >= 1; });
    roomKey.intensity = 3.2 * ra; roomFill.intensity = 0.9 * ra;
    scene.environment = ra > 0 ? env : null; scene.environmentIntensity = 0.6 * ra;
    anchorMat.opacity = inv(14.95, 15.2, t) * (t < CUE.carry[0] ? 1 : 0);
    const sel = t >= CUE.select ? 1 : 0;
    routeMat.color.set(C.lime);

    // ── overlay
    // the S2 chart line arrives as a horizontal lime line at the horizon, then becomes the projected route
    const mk = E.inOut(inv(10.0, 10.7, t));
    if (t < 10.75) {
      const samples = 40, rp = [];
      for (let i = 0; i <= samples; i++) { const u = 0.002 + i / samples * 0.5; const p = proj(curve.getPointAt(u).applyMatrix4(model.matrixWorld)); rp.push(p); }
      const d = rp.map((p, i) => { const hx = -20 + i / samples * 1960; return `${i ? 'L' : 'M'}${lerp(hx, p[0], mk).toFixed(1)} ${lerp(HAND.horizonY, p[1], mk).toFixed(1)}`; }).join(' ');
      morph.setAttribute('d', d); morphg.setAttribute('d', d); morph.style.opacity = morphg.style.opacity = String(1 - inv(10.55, 10.75, t));
    } else morph.style.opacity = morphg.style.opacity = '0';

    // visor (VR) opens outward as we leave the headset
    const vo = E.in(inv(CUE.visorOff[0], CUE.visorOff[1], t)), vi = E.soft(inv(10.05, 10.75, t));
    const vx = lerp(lerp(-200, 40, vi), -300, vo), vy = lerp(lerp(-160, 30, vi), -260, vo), vw = lerp(lerp(2320, 1840, vi), 2520, vo), vh = lerp(lerp(1400, 1020, vi), 1600, vo);
    visorEl.setAttribute('d', `M-500 -500 H2500 V1600 H-500 Z ${rr(vx, vy, vw, vh, lerp(170, 320, vo))}`);
    visorEl.style.display = vo < 1 ? '' : 'none'; lensv.style.opacity = String((1 - vo) * vi);
    const ti = E.out(inv(CUE.titleS3[0], CUE.titleS3[0] + 0.6, t)), to = E.in(inv(CUE.titleS3[1], CUE.titleS3[1] + 0.25, t));
    css(t3, { opacity: String(ti * (1 - to)), transform: `translateY(${(1 - ti) * -20 - to * 16}px)` });

    // spatial panels anchored in the world (readable, scale with distance)
    [[0.27, -260, 150, 0], [0.33, 250, 175, 1]].forEach(([u, dx, dy, i]) => {
      const p = curve.getPointAt(u).add(new THREE.Vector3(dx, dy, 0)).applyMatrix4(model.matrixWorld);
      const [x, y, z] = proj(p); const dist = camera.position.distanceTo(p);
      const sc = clamp(1150 / dist, 0.95, 1.4); const a = E.out(inv(CUE.panels[i], CUE.panels[i] + 0.5, t)) * (1 - inv(13.7, 14.05, t)) * (z < 1 ? 1 : 0);
      css(vps[i], { left: `${clamp(x - (i ? 0 : 470 * sc), 60, 1860 - 470 * sc)}px`, top: `${clamp(y - 80 * sc, 220, 860)}px`, opacity: String(a), transform: `scale(${sc * lerp(0.92, 1, a)}) skewY(${i ? -3 : 3}deg)`, transformOrigin: i ? '0 0' : '100% 0' });
    });

    // AR tracking: plinth top corners → brackets, front edge → scale marker, card above
    const arA = E.out(inv(CUE.arUI[0], CUE.arUI[1], t)) * (1 - inv(CUE.carry[0], CUE.carry[0] + 0.25, t));
    const pw = HALF * S1 * 1.12, yTop = Cl.y - 12 * s + 0.5;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const c = new THREE.Vector3(a * pw, 0, b * pw).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).add(new THREE.Vector3(Cl.x, yTop, Cl.z)); return proj(c); });
    const bcol = sel ? C.ink : '#6B7080', bw = sel ? 5 : 3.5;
    brs.forEach((b, i) => { const p = corners[i], n1 = corners[(i + 1) % 4], n0 = corners[(i + 3) % 4]; const L = 0.2;
      b.setAttribute('d', `M${lerp(p[0], n0[0], L)} ${lerp(p[1], n0[1], L)} L${p[0]} ${p[1]} L${lerp(p[0], n1[0], L)} ${lerp(p[1], n1[1], L)}`); b.setAttribute('stroke', bcol); b.setAttribute('stroke-width', bw); });
    const f0 = corners[3], f1 = corners[2];
    scl.setAttribute('d', `M${f0[0]} ${f0[1] + 26} L${f1[0]} ${f1[1] + 26} M${f0[0]} ${f0[1] + 18} L${f0[0]} ${f0[1] + 34} M${f1[0]} ${f1[1] + 18} L${f1[0]} ${f1[1] + 34}`);
    css(sclab, { left: `${(f0[0] + f1[0]) / 2 - 80}px`, top: `${(f0[1] + f1[1]) / 2 + 40}px`, opacity: String(arA) });
    q('.ar').style.opacity = String(arA);
    const top = proj(new THREE.Vector3(Cl.x - 40, Cl.y + 70, Cl.z));
    css(card, { left: `${clamp(top[0] - 470, 60, 1530)}px`, top: `${clamp(top[1] - 190, 120, 700)}px`, opacity: String(arA), transform: `translateY(${(1 - arA) * 12}px)`, borderColor: sel ? C.lime : C.hair, borderWidth: sel ? '2.5px' : '1.5px' });
    cst.textContent = sel ? 'AR · SELECTED' : 'AR · PLACED'; cst.style.color = sel ? C.ink : C.grey;
    crot.textContent = t >= CUE.rotate[0] ? `Rotation ${Math.round(THREE.MathUtils.radToDeg(rot))}°` : 'Terrain model · 1 : 500';
    // reticle: approaches, pinches (select), then drags to rotate
    const mc = proj(new THREE.Vector3(Cl.x, Cl.y + 8, Cl.z));
    const rk = E.inOut(inv(CUE.reticle[0], CUE.reticle[1], t)), dragK = E.inOut(inv(CUE.rotate[0], CUE.rotate[1], t));
    const rx = lerp(1560, mc[0], rk) + 170 * dragK, ry = lerp(760, mc[1], rk) + 10 * dragK;
    const pinch = t >= CUE.select - 0.12 ? (t < CUE.select ? E.inOut(inv(CUE.select - 0.12, CUE.select, t)) : (t < CUE.rotate[1] + 0.1 ? 1 : 1 - E.out(inv(CUE.rotate[1] + 0.1, CUE.rotate[1] + 0.3, t)))) : 0;
    const ra2 = Math.min(inv(CUE.reticle[0] - 0.1, CUE.reticle[0] + 0.1, t), 1 - inv(CUE.carry[0] - 0.2, CUE.carry[0], t));
    ret.setAttribute('cx', rx); ret.setAttribute('cy', ry); ret.setAttribute('r', lerp(30, 18, pinch)); ret.style.opacity = String(ra2);
    retdot.setAttribute('cx', rx); retdot.setAttribute('cy', ry); retdot.setAttribute('r', lerp(5, 18, pinch)); retdot.style.opacity = String(ra2 * lerp(1, 0.9, pinch));

    // carried AR anchor ring → S4's component (screen centre), with the room over-exposing to white
    const ck = E.inOut(inv(CUE.carry[0], 17.75, t));
    if (t >= CUE.carry[0]) {
      const c0 = proj(new THREE.Vector3(Cl.x, Cl.y + deskTop + 0.6, Cl.z));
      const e1 = proj(new THREE.Vector3(Cl.x + 71.7, Cl.y + deskTop + 0.6, Cl.z)), e2 = proj(new THREE.Vector3(Cl.x, Cl.y + deskTop + 0.6, Cl.z + 71.7));
      const rx0 = Math.abs(e1[0] - c0[0]), ry0 = Math.abs(e2[1] - c0[1]);
      css(carry, { opacity: '1' });
      carry.setAttribute('cx', lerp(c0[0], 960, ck)); carry.setAttribute('cy', lerp(c0[1], 540, ck));
      carry.setAttribute('rx', lerp(rx0, 108, ck)); carry.setAttribute('ry', lerp(ry0, 108, ck)); carry.setAttribute('stroke-width', lerp(4, 10.8, ck));
    } else carry.style.opacity = '0';
    // the white canvas is revealed from inside the carried ring (no fade)
    const wr = E.in(inv(17.75, 18.0, t));
    white.style.opacity = '1'; white.style.clipPath = `circle(${wr > 0 ? lerp(108, 1200, wr) : 0}px at 960px 540px)`;
    const exposure = 1;

    const bg = '#FFFFFF';
    return { scene, camera, exposure, bg };
  }
  return { update };
}
