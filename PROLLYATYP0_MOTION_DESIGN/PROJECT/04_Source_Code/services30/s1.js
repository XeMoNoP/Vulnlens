// SCENE 1 — OPENING (0–4 s). Reference: @Mounnna (logo construction → faceted assembly).
// 1A: frame 0 is already a readable picture — the exact star at ~44% of frame height, built from
// its six bevelled PBR graphite blades, with bright lime construction lines, key/fill separation
// and real cast shadows on a graphite wall. The blades settle into place.
// 1B: one blade performs a genuine 3D flip toward camera (thickness, occlusion and shadow stay
// visible). Its leading lime edge lands on a fixed screen line that S2's dashboard bezel continues.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CUE } from './cues.js';
import { HAND } from './handoff.js';
import { E, inv, lerp, clamp, el, css, C, FONT } from '../src/lib.js';
import { STAR } from '../src/logo3d.js';
import { buildStar, graphite, DEPTH, BEVEL } from './star3d.js';

export const EDGE = [510, 300, 1410, 293];   // screen line of the lime edge at 4.0 s (S2's bezel starts here)
export const TILT = 18;                       // degrees the face leans back from the edge (keeps the edge thickness hidden)

export function initS1({ renderer, stage, env }) {
  const scene = new THREE.Scene();
  scene.environment = env; scene.environmentIntensity = 0.55;
  const FOV = 30, F = 540 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 5, 20000);
  const k = 236 / STAR.r;                                   // star radius 236 px → ~44% of frame height
  const centre = new THREE.Vector3(0, 22, 0);

  // set: white studio wall receiving soft shadows (white background throughout the film)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.95, metalness: 0.0 }));
  wall.position.z = -230; wall.receiveShadow = true; scene.add(wall);
  // soft light pool on the wall behind the star (silhouette separation)
  const pool = new THREE.SpotLight(0xffffff, 1.2, 4000, 0.6, 0.95, 1.2); pool.position.set(260, 380, 1400); pool.target.position.set(80, 40, -230); scene.add(pool, pool.target);
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-760, 820, 980); key.target.position.copy(centre);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -900, right: 900, top: 900, bottom: -900, near: 100, far: 4000 }); key.shadow.bias = -0.0002; key.shadow.radius = 14; key.shadow.blurSamples = 24;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0x9aa6c8, 0.7); fill.position.set(900, -250, 600); scene.add(fill);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.lime), 2.6); rim.position.set(380, 560, -700); rim.target.position.copy(centre); scene.add(rim, rim.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  // the star: six bevelled blades
  const mat = graphite(env);
  const star = buildStar(mat);
  star.group.scale.setScalar(k); star.group.position.copy(centre); scene.add(star.group);

  // construction lines (lime), drawn on from 45% at frame 0
  const lines = [];
  const mkLine = (pts, w, o, dashed, col = C.ink) => {
    const g = new LineGeometry(); g.setPositions(pts.flatMap(p => [p[0], p[1], DEPTH / 2 + BEVEL + 6]));
    const m = new LineMaterial({ color: new THREE.Color(col), linewidth: w, transparent: true, opacity: o, dashed: !!dashed, dashSize: 14, gapSize: 12, worldUnits: false, toneMapped: false, side: THREE.DoubleSide });
    m.resolution.set(1920, 1080);
    const l = new Line2(g, m); if (dashed) l.computeLineDistances();
    l.userData = { segs: pts.length - 1, base: o }; star.group.add(l); lines.push(l); return l;
  };
  const circ = (r, n = 160) => Array.from({ length: n + 1 }, (_, i) => [Math.cos(i / n * Math.PI * 2) * r, Math.sin(i / n * Math.PI * 2) * r]);
  mkLine(circ(STAR.r * 1.1), 7, 1, false, C.lime); mkLine(circ(STAR.r * 1.1), 1.8, 0.9);   // lime highlighter + ink line
  mkLine(circ(STAR.r * 0.36), 1.6, 0.6, true);
  STAR.tips.forEach(a => mkLine([[Math.cos(a) * STAR.r * 0.2, -Math.sin(a) * STAR.r * 0.2], [Math.cos(a) * STAR.r * 1.42, -Math.sin(a) * STAR.r * 1.42]], 1.4, 0.45));
  STAR.cuts.forEach(a => mkLine([[0, 0], [Math.cos(a) * STAR.r * 0.62, -Math.sin(a) * STAR.r * 0.62]], 1.2, 0.4, true));
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, r0 = STAR.r * 1.1, r1 = r0 + (i % 4 ? 10 : 22); mkLine([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], 1.4, 0.7); }

  // flipping blade: the one pointing lower-right; gets a lime leading edge
  const target = -59 * Math.PI / 180;
  const fb = star.blades.reduce((a, b) => Math.abs(Math.atan2(Math.sin(b.axis - target), Math.cos(b.axis - target))) < Math.abs(Math.atan2(Math.sin(a.axis - target), Math.cos(a.axis - target))) ? b : a);
  const flipper = new THREE.Group(); scene.add(flipper);
  const fMat = mat.clone(); const fMesh = new THREE.Mesh(fb.mesh.geometry, fMat); fMesh.castShadow = true; fMesh.receiveShadow = true; flipper.add(fMesh);
  const [p, q] = fb.tip.map(v => new THREE.Vector3(v[0], v[1], 0));
  const eL = q.clone().sub(p).normalize(), mL = p.clone().add(q).multiplyScalar(0.5);
  const uL = mL.clone().negate().sub(eL.clone().multiplyScalar(mL.clone().negate().dot(eL))).normalize();
  const Ls = p.distanceTo(q);
  const limeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), toneMapped: false, transparent: true });
  // lime leading edge: a thin line on the front face along the tip edge
  const strip = new THREE.Mesh(new THREE.BoxGeometry(Ls * 0.98, 11, 4), limeMat);
  strip.position.copy(mL).add(uL.clone().multiplyScalar(5)); strip.position.z = -(DEPTH / 2 + BEVEL + 4);   // on the face that ends up toward camera after the flip strip.rotation.z = Math.atan2(eL.y, eL.x); flipper.add(strip);
  const lStrip = strip.clone(); lStrip.material = limeMat; fb.pivot.add(lStrip);

  // end pose (camera space): strip on EDGE, face leaning back by TILT
  const [ax, ay, bx, by] = EDGE;
  const Lpx = Math.hypot(bx - ax, by - ay), d = Ls * k * F / Lpx;
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const Pc = new THREE.Vector3((mx - 960) / F * d, (540 - my) / F * d, -d);
  const phi = Math.atan2(-(by - ay), bx - ax), beta = THREE.MathUtils.degToRad(TILT);
  const eC = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0);
  const uC = new THREE.Vector3(0, -Math.cos(beta), Math.sin(beta));  // beta < 0: lower part comes toward camera, edge thickness hidden
  const Lb = new THREE.Matrix4().makeBasis(eL, uL, eL.clone().cross(uL));
  const Wb = new THREE.Matrix4().makeBasis(eC, uC, eC.clone().cross(uC));
  const Rc = new THREE.Matrix4().multiplyMatrices(Wb, Lb.clone().transpose());
  const qEndCam = new THREE.Quaternion().setFromRotationMatrix(Rc);
  const posEndCam = Pc.clone().sub(mL.clone().multiplyScalar(k).applyQuaternion(qEndCam));
  HAND.bladeEdge = EDGE;
  window.__s1dbg = () => {
    update(3.99); const pe = (v) => { const w = v.clone().multiplyScalar(k).applyQuaternion(qEndCam).add(posEndCam).applyMatrix4(camera.matrixWorld).project(camera); return [Math.round((w.x + 1) * 960), Math.round((1 - w.y) * 540)]; };
    const sp = new THREE.Vector3(); strip.getWorldPosition(sp); const spp = sp.clone().project(camera);
    return { strip: [Math.round((spp.x + 1) * 960), Math.round((1 - spp.y) * 540)], stripVis: strip.visible && flipper.visible, op: limeMat.opacity, Ls: Math.round(Ls), d: Math.round(d), p: fb.tip, axis: fb.axis, eL: eL.toArray().map(x => +x.toFixed(3)), uL: uL.toArray().map(x => +x.toFixed(3)), endP: pe(p), endQ: pe(q), endCentre: pe(new THREE.Vector3(0, 0, 0)) };
  };

  // DOM: construction labels
  const ui = el('div', { class: 'layer', id: 's1ui' }, stage);
  const lab = (s) => { const dv = el('div', {}, ui, s); css(dv, { position: 'absolute', font: `500 22px ${FONT.mono}`, letterSpacing: '1.5px', color: C.ink, whiteSpace: 'nowrap' }); return dv; };
  const labels = [[lab('R 322'), [STAR.r * 0.8, STAR.r * 0.86]], [lab('6 × 60°'), [-STAR.r * 1.5, -STAR.r * 0.1]], [lab('BEVEL 8'), [STAR.r * 1.2, -STAR.r * 0.75]]];
  const v = new THREE.Vector3();
  // the lime bezel: drawn along the surface's leading edge exactly where S2's dashboard bezel begins
  const bez = el('svg', { width: 1920, height: 1080, style: 'position:absolute;inset:0;overflow:visible' }, ui);
  const bezL = el('line', { x1: EDGE[0], y1: EDGE[1], x2: EDGE[2], y2: EDGE[3], stroke: C.lime, 'stroke-width': 7, pathLength: 1, 'stroke-dasharray': 1 }, bez);

  function cameraAt(t) {
    const o = E.inOut(inv(0, 4, t));
    const th = THREE.MathUtils.degToRad(lerp(-12, 12, o)), ph = THREE.MathUtils.degToRad(lerp(6, 1, o));
    const D = F * lerp(1, 0.93, o);
    camera.position.set(centre.x + Math.sin(th) * Math.cos(ph) * D, centre.y + Math.sin(ph) * D, Math.cos(th) * Math.cos(ph) * D);
    camera.lookAt(centre); camera.updateMatrixWorld();
  }

  const qTmp = new THREE.Quaternion(), qFlip = new THREE.Quaternion();
  function update(t) {
    const on = t < CUE.cut1;
    ui.style.display = on ? '' : 'none';
    if (!on) return null;
    cameraAt(t);

    // lines: 45% drawn at frame 0, complete by 1.2 s, then recede
    const draw = lerp(0.45, 1, E.out(inv(CUE.lines[0], CUE.lines[1], t)));
    const fade = lerp(1, 0.32, E.soft(inv(1.6, 2.6, t))) * (1 - inv(3.0, 3.5, t));
    lines.forEach(l => { l.rotation.z = -0.12 * E.soft(inv(0, 4, t)); });   // construction ring turns slowly: the opening never freezes
    lines.forEach(l => { l.geometry.instanceCount = Math.max(1, Math.round(l.userData.segs * draw)); l.material.opacity = l.userData.base * fade; l.visible = fade > 0.01; });

    // blades settle (slightly exploded at frame 0, so the first picture is complete)
    star.blades.forEach((b, i) => {
      const pr = 1 - E.out(inv(0.0 + i * 0.07, 1.25 + i * 0.07, t));
      const dx = Math.cos(b.axis), dy = Math.sin(b.axis);
      b.pivot.position.set(dx * 70 * pr, dy * 70 * pr, 46 * pr);
      const rest = (i % 2 ? 1 : -1) * 0.025;   // each facet rests at a slightly different angle → distinct highlights
      b.pivot.rotation.set(-dy * (0.28 * pr + rest), dx * (0.28 * pr + rest), (i % 2 ? 0.12 : -0.12) * pr);
    });

    // 1B: the flip
    const flying = t >= CUE.flipLift[0];
    fb.pivot.visible = !flying; flipper.visible = flying;
    lStrip.visible = !flying; limeMat.opacity = Math.max(inv(2.35, 2.9, t), 0);
    if (flying) {
      star.group.updateMatrixWorld(true);
      const lift = E.out(inv(CUE.flipLift[0], CUE.flipLift[1], t)) * 40;
      const posS = new THREE.Vector3(0, 0, lift / k).applyMatrix4(fb.pivot.matrixWorld);
      const qS = star.group.getWorldQuaternion(new THREE.Quaternion());
      const posE = posEndCam.clone().applyMatrix4(camera.matrixWorld);
      const qE = camera.getWorldQuaternion(new THREE.Quaternion()).multiply(qEndCam);
      // still moving at the cut: the ease would finish at 4.25 s, rescaled so the pose is exact at 4.0 s
      const ez = (x) => E.inOut(inv(CUE.flip[0], CUE.flip[1] + 0.25, x)), a = Math.min(1, ez(t) / ez(CUE.flip[1])), b = E.inOut(inv(CUE.flip[0] + 0.1, CUE.flip[1] - 0.2, t));
      flipper.position.copy(posS).lerp(posE, a);
      flipper.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-Math.sin(Math.PI * a) * 120));
      qTmp.copy(qS).slerp(qE, a); qFlip.setFromAxisAngle(eL, Math.PI * 2 * b);
      flipper.quaternion.copy(qTmp).multiply(qFlip);
      // the facet flattens into a surface as it arrives (its thickness can't fill the frame)
      flipper.scale.set(k, k, k * lerp(1, 0.15, E.inOut(inv(3.35, 4.0, t))));
      // …and its lacquer turns into the product's white surface before the cut
      const wv = E.inOut(inv(3.4, 3.95, t));
      fMat.color.setHex(0x1d1e23).lerp(new THREE.Color(0xf4f5f7), wv); fMat.clearcoat = lerp(1, 0.2, wv); fMat.envMapIntensity = lerp(1.35, 0.5, wv); fMat.roughness = lerp(0.34, 0.6, wv);
    }
    key.shadow.camera.updateProjectionMatrix();

    for (const [dv, [x, y]] of labels) {
      v.set(x, y, DEPTH).applyMatrix4(star.group.matrixWorld).project(camera);
      css(dv, { left: `${(v.x + 1) * 960}px`, top: `${(1 - v.y) * 540 - 10}px`, opacity: String(fade * inv(0.2, 0.6, t)) });
    }
    bezL.style.strokeDashoffset = String(1 - E.inOut(inv(3.55, 3.92, t))); bezL.style.opacity = String(t > 3.5 ? 1 : 0);
    return { scene, camera, exposure: 1, bg: '#FFFFFF' };
  }
  return { update };
}
