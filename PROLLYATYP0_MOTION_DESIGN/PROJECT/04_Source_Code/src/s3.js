// SCENE 3 — AR/VR SOLUTIONS (6–10 s). References: @mdaman010 (procedural 3D world, atmosphere,
// camera choreography along a route) and @petert (VR intro in three.js; keep spatial UI restrained).
// 3A: first-person through a headset visor, travelling a lime route through procedural terrain
// at dusk, with spatial panels and a controller ray. 3B: the camera rises out of the world as it
// shrinks onto a desk in AR passthrough; a hand pinches "Publish", which is carried into S4.
import * as THREE from 'three';
import { CUE } from './cues.js';
import { E, inv, tw, lerp, clamp, el, css, C, FONT, fbm, noise2, mixHex, springRemain } from './lib.js';

export function initS3({ stage }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 16 / 9, 1, 30000);
  const model = new THREE.Group(); scene.add(model);           // the procedural world (scaled in 3B)
  const room = new THREE.Group(); scene.add(room);             // AR passthrough room (3B)

  // ── procedural terrain with a valley carved along the route
  const routeX = (z) => 150 * Math.sin(z * 0.0019) + 70 * Math.sin(z * 0.0047 + 1.3);
  const ridge = (x, z) => { const n = fbm(x * 0.0012 + 3.1, z * 0.0012 + 7.7, 5); return 1 - Math.abs(2 * n - 1); };
  const H = (x, z) => {
    const m = THREE.MathUtils.smoothstep(Math.abs(x - routeX(z)), 70, 560);
    const far = THREE.MathUtils.smoothstep(-z, 600, 3200);
    const mount = Math.pow(ridge(x, z), 1.7) * (300 + 260 * far) + fbm(x * 0.004, z * 0.004, 3) * 40;
    return -10 + m * mount + (1 - m) * fbm(x * 0.01, z * 0.01, 2) * 10;
  };
  const tg = new THREE.PlaneGeometry(7000, 7000, 190, 190); tg.rotateX(-Math.PI / 2); tg.translate(0, 0, -2600);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, H(tp.getX(i), tp.getZ(i)));
  const terrainGeo = tg.toNonIndexed(); terrainGeo.computeVertexNormals();

  // disc clip (3B): fragments outside radius uR of uC (model space) are discarded
  const clipU = { uR: { value: 1e6 }, uC: { value: new THREE.Vector2() } };
  const discClip = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uR = clipU.uR; sh.uniforms.uC = clipU.uC;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vModelPos;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvModelPos = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vModelPos; uniform float uR; uniform vec2 uC;').replace('void main() {', 'void main() {\nif (length(vModelPos.xz - uC) > uR) discard;');
    };
    return m;
  };
  const terrainMat = discClip(new THREE.MeshStandardMaterial({ color: 0x252a3d, roughness: 0.92, metalness: 0.0, flatShading: true }));
  const terrain = new THREE.Mesh(terrainGeo, terrainMat); model.add(terrain);

  // ── the route (lime) and the ring portal
  const pts = []; for (let z = 120; z >= -3200; z -= 80) pts.push(new THREE.Vector3(routeX(z), H(routeX(z), z) + 2.5, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  const routeMat = discClip(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), toneMapped: false, fog: false }));
  model.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 700, 1.5, 8), routeMat));
  const glowMat = discClip(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  model.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 700, 6, 8), glowMat));
  const ringPos = curve.getPointAt(0.5).add(new THREE.Vector3(0, 80, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(64, 2.8, 12, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), toneMapped: false, fog: false }));
  ring.position.copy(ringPos); ring.lookAt(curve.getPointAt(0.2).add(new THREE.Vector3(0, 40, 0))); model.add(ring);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(215,255,0,.55)'); r.addColorStop(1, 'rgba(215,255,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const ringGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  ringGlow.position.copy(ringPos); ringGlow.scale.set(320, 320, 1); model.add(ringGlow);

  // ── spatial panels (canvas textures; HTML-style UI drawn per panel)
  const panelTex = (title) => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 280; const g = c.getContext('2d');
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    rr(2, 2, 596, 276, 32); g.fillStyle = 'rgba(14,16,24,0.78)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff'; g.font = '600 38px "Inter Tight"'; g.fillText(title, 40, 78);
    rr(40, 118, 520, 40, 12); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); rr(40, 118, 364, 40, 12); g.fillStyle = 'rgba(215,255,0,.92)'; g.fill();
    rr(40, 186, 520, 40, 12); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); rr(40, 186, 208, 40, 12); g.fillStyle = 'rgba(255,255,255,.38)'; g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  const mkPanel = (title, u, dx, dy) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 70), new THREE.MeshBasicMaterial({ map: panelTex(title), transparent: true, toneMapped: false, fog: false, depthWrite: false }));
    m.position.copy(curve.getPointAt(u)).add(new THREE.Vector3(dx, dy, 0));
    m.lookAt(curve.getPointAt(0.13).add(new THREE.Vector3(0, 40, 0)));
    model.add(m); return m;
  };
  const panels = [mkPanel('Waypoint 02', 0.37, -175, 70), mkPanel('Layers', 0.41, 190, 96)];

  // ── sky dome with a dusk → night shift (GLSL)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, transparent: true,
    uniforms: { uNight: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `varying vec3 vDir; uniform float uNight; uniform float uOpacity;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){ float y = clamp(vDir.y, -0.2, 1.0);
        vec3 horizon = mix(vec3(0.33,0.35,0.47), vec3(0.16,0.18,0.25), uNight);
        vec3 band = mix(vec3(0.42,0.43,0.52), vec3(0.18,0.19,0.27), uNight);
        vec3 zenith = mix(vec3(0.05,0.06,0.10), vec3(0.02,0.02,0.04), uNight);
        vec3 col = mix(band, horizon, smoothstep(0.0, 0.06, y)); col = mix(col, zenith, smoothstep(0.06, 0.55, y));
        vec3 q = floor(vDir * 420.0); float s = step(0.9965, h(q)) * smoothstep(0.08, 0.4, y) * (0.35 + 0.65 * uNight);
        col += vec3(s) * 0.8; gl_FragColor = vec4(col, uOpacity); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 16), skyMat); scene.add(sky);
  scene.fog = new THREE.Fog(0x3b4158, 380, 3000);
  const fogDusk = new THREE.Color(0x4a5068), fogNight = new THREE.Color(0x232736);

  // lights
  const hemi = new THREE.HemisphereLight(0x9aa3c8, 0x0b0c12, 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xc9cfe8, 1.5); sun.position.set(-2000, 900, -600); scene.add(sun);
  const limeL = new THREE.PointLight(new THREE.Color(C.lime), 0, 900, 1.6); limeL.position.copy(ringPos); model.add(limeL);

  // ── AR room (3B), placed around the disc centre Cw
  const Cl = curve.getPointAt(0.41); Cl.y = H(Cl.x, Cl.z);
  clipU.uC.value.set(Cl.x, Cl.z);
  const S1 = 44 / 700;  // final model scale (disc radius 700 → 44)
  const roomMats = [];
  const rm = (o) => { const m = new THREE.MeshStandardMaterial({ fog: false, transparent: true, ...o }); roomMats.push(m); return m; };
  const box = (w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(Cl.x + x, Cl.y + y, Cl.z + z); room.add(b); return b; };
  box(1400, 8, 520, rm({ color: 0x34353b, roughness: 0.55, metalness: 0.1 }), 40, -6.5, 20);            // desk
  box(2600, 1400, 10, rm({ color: 0x17181d, roughness: 1 }), 0, 300, -420);                                 // back wall
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(47, 49, 5, 96), rm({ color: 0x26282e, roughness: 0.5, metalness: 0.2 })); disc.position.set(Cl.x, Cl.y - 3.2, Cl.z); room.add(disc);
  const lap = new THREE.Group(); lap.position.set(Cl.x + 205, Cl.y - 2.2, Cl.z - 40); lap.rotation.y = -0.35; room.add(lap);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(150, 3, 100), rm({ color: 0x2a2b30, roughness: 0.5, metalness: 0.4 })); lb.position.set(0, 0, 0); lap.add(lb);
  const ls = new THREE.Mesh(new THREE.BoxGeometry(150, 96, 3), rm({ color: 0x0c0d10, emissive: 0x1a1d27, emissiveIntensity: 1, roughness: 0.3 })); ls.position.set(0, 48, -50); ls.rotation.x = -0.18; lap.add(ls);
  const roomKey = new THREE.DirectionalLight(0xdde3f2, 0); roomKey.position.set(Cl.x - 900, Cl.y + 500, Cl.z + 300); roomKey.target.position.copy(Cl); scene.add(roomKey, roomKey.target);
  // AR anchor ring
  const ringPts = Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Cl.x + Math.cos(i / 128 * Math.PI * 2) * 60, Cl.y + 0.5, Cl.z + Math.sin(i / 128 * Math.PI * 2) * 60));
  const anchorMat = new THREE.LineDashedMaterial({ color: new THREE.Color(C.lime), dashSize: 2.2, gapSize: 3.4, transparent: true, toneMapped: false, fog: false });
  const anchor = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), anchorMat); anchor.computeLineDistances(); room.add(anchor);
  const dotM = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), transparent: true, toneMapped: false, fog: false });
  [-60, 60].forEach(dx => { const d = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 8), dotM); d.position.set(Cl.x + dx, Cl.y + 0.6, Cl.z); room.add(d); });

  // ── DOM overlay: visor, dark glass, ray, title, AR panels, hand, Publish button
  const ui = el('div', { class: 'layer', id: 's3ui' }, stage);
  ui.innerHTML = `
  <svg width="1920" height="1080" style="position:absolute;inset:0">
    <defs><radialGradient id="lens" cx=".5" cy=".5" r=".62"><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
    <path class="glass" fill="#0E1016"/>
    <rect class="lensv" width="1920" height="1080" fill="url(#lens)"/>
    <line class="ray" stroke="#fff" stroke-opacity=".8" stroke-width="3"/><circle class="raydot" r="9" fill="${C.lime}"/>
    <path class="visor" fill="#000" fill-rule="evenodd"/>
  </svg>
  <div class="t3" style="position:absolute;left:120px;top:104px;color:#fff">
    <span style="display:inline-block;background:${C.lime};color:${C.ink};font:500 21px ${FONT.mono};letter-spacing:1.5px;padding:5px 12px;border-radius:6px">02 / AR·VR</span>
    <div style="margin-top:14px;font:600 58px ${FONT.head};letter-spacing:-1px">AR/VR Solutions</div></div>
  <div class="mono3" style="position:absolute;left:96px;top:98px;font:400 20px ${FONT.mono};letter-spacing:1.5px;color:rgba(255,255,255,.7)">02 / AR·VR · PASSTHROUGH</div>
  <div class="fade" style="position:absolute;inset:0;background:${C.canvas}"></div>
  ${['SCALE|1 : 500', 'LIGHTING|Dusk'].map((s, i) => { const [a, b] = s.split('|'); return `<div class="arp arp${i}" style="position:absolute;width:${i ? 260 : 250}px;height:92px;border-radius:16px;background:rgba(14,16,24,.78);border:1px solid rgba(255,255,255,.35);box-sizing:border-box;padding:16px 20px;color:#fff"><div style="font:400 15px ${FONT.mono};letter-spacing:1.5px;opacity:.6">${a}</div><div style="font:600 24px ${FONT.head};margin-top:6px">${b}</div></div>`; }).join('')}
  <div class="btn" style="position:absolute;display:flex;align-items:center;justify-content:center;font-family:${FONT.head};font-weight:600;white-space:nowrap"><span>Publish</span></div>
  <svg class="hand" width="420" height="420" viewBox="0 0 420 420" style="position:absolute;overflow:visible">
    <rect x="120" y="150" width="170" height="130" rx="56" fill="#E2DED8" transform="rotate(-18 205 215)"/>
    <line class="thumb" x1="150" y1="190" x2="102" y2="98" stroke="#D9D4CD" stroke-width="40" stroke-linecap="round"/>
    <line class="index" x1="230" y1="160" x2="150" y2="60" stroke="#E9E6E1" stroke-width="36" stroke-linecap="round"/>
    <circle class="pinchring" cx="108" cy="94" r="34" fill="none" stroke="${C.lime}" stroke-width="3"/>
  </svg>`;
  const q = (s) => ui.querySelector(s);
  const vis = q('.visor'), glass = q('.glass'), ray = q('.ray'), rayDot = q('.raydot'), t3 = q('.t3'), mono3 = q('.mono3');
  const arp = [q('.arp0'), q('.arp1')], btn = q('.btn'), hand = q('.hand'), idx = q('.index'), ringEl = q('.pinchring'), fade = q('.fade'), lensv = q('.lensv');
  const rrPath = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const v3 = new THREE.Vector3();
  const project = (p) => { v3.copy(p).project(camera); return [(v3.x + 1) * 960, (1 - v3.y) * 540]; };

  // camera poses
  const fpPose = (t) => {
    const u = 0.015 + 0.215 * E.soft(inv(6, 8.25, t));
    const pos = curve.getPointAt(u).add(new THREE.Vector3(0, 34 + 2 * Math.sin(t * 3.1), 0));
    const look = curve.getPointAt(Math.min(1, u + 0.05)).add(new THREE.Vector3(Math.sin(t * 1.7) * 6, 26 + Math.sin(t * 2.3) * 3, 0));
    return { pos, look, roll: 0.026 * Math.sin(t * 2.2) };
  };
  const highLocal = Cl.clone().add(new THREE.Vector3(60, 720, 820));
  const deskCam = Cl.clone().add(new THREE.Vector3(-8, 82, 150)), deskLook = Cl.clone().add(new THREE.Vector3(10, 10, 0));

  function update(t) {
    const on = t >= 6 && t < 10;
    ui.style.display = on ? '' : 'none';
    if (!on) return null;
    const night = E.soft(inv(CUE.night[0], CUE.night[1], t));
    skyMat.uniforms.uNight.value = night;
    scene.fog.color.copy(fogDusk).lerp(fogNight, night);
    hemi.intensity = lerp(1.1, 0.7, night); sun.intensity = lerp(1.5, 0.75, night);
    limeL.intensity = 2.2 * inv(6.2, 6.8, t);

    // ── camera: first person → rise (local) → shrink onto desk (world)
    const fp = fpPose(t);
    const ka = E.inOut(inv(CUE.rise[0], CUE.rise[1], t)), kb = E.inOut(inv(CUE.shrink[0], CUE.shrink[1], t));
    let pos, look, roll = fp.roll * (1 - ka);
    const camLocal = fp.pos.clone().lerp(highLocal, ka), lookLocal = fp.look.clone().lerp(Cl, ka);
    const s = Math.pow(S1, kb);
    model.scale.setScalar(s); model.position.copy(Cl).multiplyScalar(1 - s);
    const toW = (p) => p.clone().multiplyScalar(s).add(model.position);
    const drift = new THREE.Vector3(10 * E.soft(inv(8.7, 10, t)), 0, 0);
    pos = toW(camLocal).lerp(deskCam.clone().add(drift), kb); look = toW(lookLocal).lerp(deskLook, kb);
    camera.position.copy(pos); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(look); camera.updateMatrixWorld();
    camera.near = lerp(1, 0.5, kb); camera.far = 30000; camera.updateProjectionMatrix();
    sky.position.copy(camera.position);
    scene.fog.near = 380 * s; scene.fog.far = lerp(3000, 9000, kb) * s;
    clipU.uR.value = lerp(9000, 700, E.inOut(inv(CUE.rise[0] - 0.05, CUE.rise[1] + 0.05, t)));
    skyMat.uniforms.uOpacity.value = 1 - inv(8.08, 8.4, t);
    sky.visible = skyMat.uniforms.uOpacity.value > 0.001;
    ring.visible = ringGlow.visible = t < CUE.rise[1];

    // room (passthrough) fades in at the end of the shrink
    const ra = inv(0.5, 1, kb);
    room.visible = ra > 0;
    terrainMat.color.setHex(0x252a3d).lerp(new THREE.Color(0x56607f), kb);
    terrainMat.emissive.setHex(0x0e1018).multiplyScalar(kb);
    hemi.intensity *= lerp(1, 1.9, kb);
    roomMats.forEach(m => { m.opacity = ra; });
    roomKey.intensity = 1.6 * ra;
    anchorMat.opacity = inv(8.62, 8.85, t); dotM.opacity = anchorMat.opacity;
    anchor.visible = anchorMat.opacity > 0;

    // panels in the world
    panels.forEach((p, i) => { const a = E.out(inv(CUE.panelsS3[i], CUE.panelsS3[i] + 0.5, t)); p.material.opacity = a * (1 - ka); p.scale.setScalar(lerp(0.85, 1, a)); p.visible = p.material.opacity > 0.01; });

    // ── overlay
    const vo = E.in(inv(8.15, 8.45, t)); // visor opens outward as we leave VR
    const vx = lerp(40, -260, vo), vy = lerp(30, -220, vo), vw = lerp(1840, 2440, vo), vh = lerp(1020, 1520, vo), vr = lerp(170, 300, vo);
    vis.setAttribute('d', `M-400 -400 H2400 V1500 H-400 Z ${rrPath(vx, vy, vw, vh, vr)}`);
    vis.style.display = vo < 1 ? '' : 'none'; lensv.style.opacity = String(1 - vo);
    glass.setAttribute('d', rrPath(40, 30, 1840, 1020, 170)); glass.style.opacity = String(1 - E.soft(inv(6.0, 6.32, t)));
    const rv = Math.min(inv(6.7, 6.9, t), 1 - inv(7.8, 8.0, t));
    const [px, py] = project(panels[1].getWorldPosition(new THREE.Vector3()));
    ray.setAttribute('x1', 1700); ray.setAttribute('y1', 1080); ray.setAttribute('x2', lerp(1700, px, E.out(inv(6.7, 6.95, t)))); ray.setAttribute('y2', lerp(1080, py, E.out(inv(6.7, 6.95, t))));
    ray.style.opacity = rayDot.style.opacity = String(rv); rayDot.setAttribute('cx', px); rayDot.setAttribute('cy', py);
    const ti = E.out(inv(CUE.titleS3[0], CUE.titleS3[0] + 0.6, t)), to = E.in(inv(CUE.titleS3[1], CUE.titleS3[1] + 0.25, t));
    css(t3, { opacity: String(ti * (1 - to)), transform: `translate(${-60 * to}px, ${24 * (1 - ti)}px)` });
    mono3.style.opacity = String(Math.min(inv(8.7, 9.0, t), 1 - inv(9.55, 9.75, t)));

    // AR panels anchored above the model
    [[Cl.clone().add(new THREE.Vector3(-74, 58, 0)), CUE.arPanels[0], -5], [Cl.clone().add(new THREE.Vector3(80, 70, -10)), CUE.arPanels[1], 5]].forEach(([p, t0, sk], i) => {
      const [x, y] = project(p); const a = E.out(inv(t0, t0 + 0.45, t)) * (1 - inv(9.55, 9.75, t));
      css(arp[i], { left: `${x - 125}px`, top: `${y - 46}px`, opacity: String(a), transform: `skewY(${-sk}deg) translateY(${(1 - a) * 18}px)` });
    });

    // hand + Publish button; pinch at 9.42; the button is carried to S4 from 9.6
    const bp0 = project(Cl.clone().add(new THREE.Vector3(70, 46, 20)));
    const carry = E.inOut(inv(CUE.carry[0], CUE.carry[1], t));
    const press = t >= CUE.pinch ? 1 - 0.06 * springRemain(t - CUE.pinch, 30, 0.5) : 1;
    const bw = lerp(190, 360, carry), bh = lerp(64, 120, carry);
    const bx = lerp(bp0[0], 960, carry), by = lerp(bp0[1], 540, carry);
    const ba = E.out(inv(8.95, 9.3, t));
    css(btn, { left: `${bx - bw / 2}px`, top: `${by - bh / 2}px`, width: `${bw}px`, height: `${bh}px`, borderRadius: `${bh / 2}px`, background: mixHex(C.lime, C.ink, inv(0.15, 0.7, carry)),
      color: mixHex(C.ink, '#FFFFFF', inv(0.15, 0.7, carry)), fontSize: `${lerp(22, 40, carry)}px`, opacity: String(ba), transform: `scale(${press * lerp(0.9, 1, ba)})` });
    const hin = E.out(inv(CUE.hand, CUE.hand + 0.4, t)), hout = E.in(inv(9.55, 9.85, t));
    css(hand, { left: `${bp0[0] + 58 - 108 + 200 * (1 - hin)}px`, top: `${bp0[1] + 6 - 94 + 260 * (1 - hin) + 500 * hout}px`, opacity: String(hin * (1 - hout)) });
    const pin = E.inOut(inv(CUE.pinch - 0.14, CUE.pinch, t)) * (1 - E.inOut(inv(9.5, 9.62, t)));
    idx.setAttribute('x2', lerp(150, 112, pin)); idx.setAttribute('y2', lerp(60, 90, pin));
    ringEl.style.opacity = String(pin); ringEl.setAttribute('r', lerp(34, 22, pin));
    fade.style.opacity = String(E.soft(inv(9.62, 9.95, t)));

    return { scene, camera, bg: t < 8.08 ? '#000000' : 'linear-gradient(180deg,#121317 0%,#1D1F25 60%,#16171B 100%)' };
  }
  return { update };
}
