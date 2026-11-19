// SCENE 1 — OPENING (0–2 s). Reference: @Mounnna (logo wireframe → faceted assembly).
// Dark graphite studio. The official logo is drawn as a wireframe with construction
// geometry, then the star assembles from lit facets while the wordmark fills behind a
// lime wipe. At 1.72 s a facet flips over: its back face is the white app surface of S2.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CUE } from './cues.js';
import { E, inv, tw, lerp, clamp, el, css, C, FONT, springRemain } from './lib.js';
import { logoShapes, outlines, starTriangles, prismGeometry, STAR, BBOX } from './logo3d.js';

export function initS1({ renderer, stage }) {
  const scene = new THREE.Scene();
  const FOV = 30, D0 = 540 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 10, 20000);

  // logo group: logo units → screen pixels (1300 px wide, centred at 960,520)
  const LW = BBOX.x1 - BBOX.x0, k = 1300 / LW;
  const lcx = (BBOX.x0 + BBOX.x1) / 2, lcy = (BBOX.y0 + BBOX.y1) / 2;
  const logo = new THREE.Group();
  logo.scale.set(k, -k, k);
  logo.position.set(-lcx * k, lcy * k + 20, 0);
  scene.add(logo);
  const target = new THREE.Vector3(0, 20, 0);
  const toWorld = (x, y, z = 0) => new THREE.Vector3(x, y, z).applyMatrix4(logo.matrixWorld);
  logo.updateMatrixWorld(true);

  // lights: soft key from the left, lime rim from behind
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-900, 700, 1200); scene.add(key);
  const fill = new THREE.DirectionalLight(0xb8c0d8, 0.5); fill.position.set(900, -300, 600); scene.add(fill);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.lime), 3.2); rim.position.set(500, 700, -900); scene.add(rim);

  const lineMats = [];
  const mkLine = (pts, color, width, opacity, dashed) => {
    const g = new LineGeometry(); g.setPositions(pts.flatMap(p => [p.x ?? p[0], p.y ?? p[1], p.z ?? 0]));
    const m = new LineMaterial({ color: new THREE.Color(color), linewidth: width, transparent: true, opacity, dashed: !!dashed, dashSize: 10, gapSize: 16, worldUnits: false, toneMapped: false, side: THREE.DoubleSide });
    m.resolution.set(1920, 1080); lineMats.push(m);
    const l = new Line2(g, m); if (dashed) l.computeLineDistances();
    l.userData.segs = pts.length - 1;
    return l;
  };

  // ── wireframe: star + wordmark outlines
  const { star, glyphs } = logoShapes();
  const starWire = outlines(star, 40).map(p => mkLine(p, '#FFFFFF', 1.7, 0.95));
  const glyphWire = outlines(glyphs, 18).map(p => mkLine(p, '#FFFFFF', 1.5, 0.92));
  starWire.forEach(l => logo.add(l)); glyphWire.forEach(l => logo.add(l));

  // ── construction geometry around the star and the type
  const cons = new THREE.Group(); logo.add(cons);
  const circ = (r, n = 120) => Array.from({ length: n + 1 }, (_, i) => [STAR.cx + Math.cos(i / n * Math.PI * 2) * r, STAR.cy + Math.sin(i / n * Math.PI * 2) * r]);
  const consLines = [mkLine(circ(STAR.r), '#FFFFFF', 1, 0.28, true), mkLine(circ(STAR.r * 0.36), '#FFFFFF', 1, 0.2)];
  for (const a of STAR.tips) consLines.push(mkLine([[STAR.cx - Math.cos(a) * STAR.r * 0.2, STAR.cy - Math.sin(a) * STAR.r * 0.2], [STAR.cx + Math.cos(a) * STAR.r * 1.55, STAR.cy + Math.sin(a) * STAR.r * 1.55]], '#FFFFFF', 1, 0.18));
  const bx0 = BBOX.x0 + LW * 0.2, bx1 = BBOX.x1 + 40 / k;
  for (const [y, o, dsh] of [[1240, 0.24, 0], [1440, 0.16, 1], [1700, 0.32, 0]]) consLines.push(mkLine([[bx0, y], [bx1, y]], '#FFFFFF', 1, o, dsh));
  consLines.forEach(l => cons.add(l));
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), transparent: true, toneMapped: false });
  const dots = STAR.tips.map(a => { const m = new THREE.Mesh(new THREE.CircleGeometry(5 / k, 20), dotMat); m.position.set(STAR.cx + Math.cos(a) * STAR.r, STAR.cy + Math.sin(a) * STAR.r, 1); cons.add(m); return m; });

  // ── facets: the star triangulated, grouped into 24 wedges around its centre
  const tris = starTriangles(64);
  const N = 24, bins = Array.from({ length: N }, () => []);
  for (const t of tris) {
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3 - STAR.cx, cy = (t[0][1] + t[1][1] + t[2][1]) / 3 - STAR.cy;
    const a = (Math.atan2(cy, cx) + Math.PI * 2) % (Math.PI * 2);
    bins[Math.floor(a / (Math.PI * 2) * N) % N].push(t);
  }
  const lateSet = new Set([4, 11, 19]);
  const facetMat = new THREE.MeshStandardMaterial({ color: 0x2c2d33, metalness: 0.42, roughness: 0.38, flatShading: true, side: THREE.DoubleSide });
  const facets = [];
  bins.forEach((b, i) => {
    if (!b.length) return;
    const g = prismGeometry(b.map(t => t.map(([x, y]) => [x - STAR.cx, y - STAR.cy])), 70);
    const mesh = new THREE.Mesh(g, facetMat);
    const pivot = new THREE.Group(); pivot.position.set(STAR.cx, STAR.cy, 0); pivot.add(mesh); logo.add(pivot);
    const am = (i + 0.5) / N * Math.PI * 2;
    const land = lateSet.has(i) ? CUE.facetLand[3] : CUE.facetLand[i % 3];
    facets.push({ pivot, mesh, am, land, tilt: (i % 2 ? 1 : -1) * 0.07, dist: 520 + (i * 53) % 260 });
  });

  // ── wordmark fill, revealed by a clipping plane that wipes left → right
  const clipFill = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const clipWire = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0xF4F4F4, clippingPlanes: [clipFill], toneMapped: false, side: THREE.DoubleSide });
  const fillMesh = new THREE.Mesh(new THREE.ShapeGeometry(glyphs, 16), fillMat); fillMesh.position.z = 0.5; logo.add(fillMesh);
  glyphWire.forEach(l => { l.material.clippingPlanes = [clipWire]; });
  let gx0 = Infinity, gx1 = -Infinity;
  glyphs.forEach(s => s.getPoints(8).forEach(p => { gx0 = Math.min(gx0, p.x); gx1 = Math.max(gx1, p.x); }));
  const wx0 = toWorld(gx0 - 20, 0).x, wx1 = toWorld(gx1 + 20, 0).x;
  const wipeLine = new THREE.Mesh(new THREE.PlaneGeometry(3, 300), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime), transparent: true, toneMapped: false }));
  wipeLine.position.set(0, toWorld(0, (BBOX.y0 + BBOX.y1) / 2).y, 2); scene.add(wipeLine);

  // ── the flipping facet (front: white app surface, back: graphite facet)
  const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return new THREE.ShapeGeometry(s, 8); };
  const flip = new THREE.Group(); scene.add(flip);
  const front = new THREE.Mesh(rr(1, 1, 0.07), new THREE.MeshBasicMaterial({ color: 0xF7F8FA, toneMapped: false }));
  const back = new THREE.Mesh(rr(1, 1, 0.07), new THREE.MeshStandardMaterial({ color: 0x3a3b42, metalness: 0.4, roughness: 0.4 }));
  back.rotation.y = Math.PI; back.position.z = -0.01; front.position.z = 0.01;
  flip.add(front, back);
  const starW = toWorld(STAR.cx, STAR.cy);

  // ── DOM overlay: corner label + construction labels
  const ui = el('div', { class: 'layer', id: 's1ui' }, stage);
  const corner = el('div', {}, ui, 'PROLLYATYP0');
  css(corner, { position: 'absolute', left: '96px', bottom: '62px', font: `500 18px ${FONT.mono}`, letterSpacing: '2px', color: 'rgba(255,255,255,.45)' });
  const lab = (s) => { const d = el('div', {}, ui, s); css(d, { position: 'absolute', font: `400 15px ${FONT.mono}`, letterSpacing: '1.5px', color: 'rgba(255,255,255,.55)', whiteSpace: 'nowrap' }); return d; };
  const labels = [[lab('R 322'), [STAR.cx + STAR.r * 0.78, STAR.cy - STAR.r * 1.02]], [lab('6 × 60°'), [STAR.cx - 60, STAR.cy + STAR.r * 1.75]], [lab('CAP'), [bx1 + 50 / k, 1240]], [lab('BASELINE'), [bx1 + 50 / k, 1700]]];
  const proj = new THREE.Vector3();

  function update(t) {
    const on = t < CUE.flip[1];
    ui.style.display = on ? '' : 'none';
    if (!on) return null;
    // camera: starts straight on, slow 16° orbit + dolly-in
    const o = E.inOut(inv(0, 2, t));
    const th = THREE.MathUtils.degToRad(lerp(0, 16, o)), ph = THREE.MathUtils.degToRad(lerp(2, -2, o));
    const D = D0 * lerp(1, 0.9, E.soft(inv(0, 2, t))) * lerp(1, 0.86, E.in(inv(CUE.flip[0], CUE.flip[1], t)));
    camera.position.set(target.x + Math.sin(th) * Math.cos(ph) * D, target.y + Math.sin(ph) * D, target.z + Math.cos(th) * Math.cos(ph) * D);
    camera.lookAt(target); camera.updateMatrixWorld();

    // wireframe draw-on: frame one is already 30% drawn; done at 0.9 s
    const draw = lerp(0.3, 1, E.out(inv(0, CUE.wireDone, t)));
    for (const l of [...starWire, ...glyphWire]) l.geometry.instanceCount = Math.max(1, Math.round(l.userData.segs * draw));
    const consA = (1 - inv(0.8, 1.3, t));
    const consDraw = E.out(inv(0.05, 0.85, t));
    consLines.forEach((l, i) => { l.material.opacity = [0.28, 0.2][i] ?? (i < 8 ? 0.18 : [0.24, 0.16, 0.32][i - 8]); l.material.opacity *= consA; l.geometry.instanceCount = Math.max(1, Math.round(l.userData.segs * consDraw)); l.visible = consA > 0.01; });
    dotMat.opacity = consA * inv(0.2, 0.5, t);
    starWire.forEach(l => { l.material.opacity = 0.95 * (1 - 0.85 * inv(1.0, 1.65, t)); });

    // facets fly in and lock on the beat
    for (const f of facets) {
      const t0 = f.land - 0.55;
      f.pivot.visible = t >= t0;
      const p = E.out(inv(t0, f.land, t));
      const rem = 1 - p;
      const settle = springRemain(t - f.land, 22, 0.6) * (t >= f.land ? 1 : 0);
      const dx = Math.cos(f.am), dy = Math.sin(f.am);
      f.pivot.position.set(STAR.cx + dx * f.dist * rem, STAR.cy + dy * f.dist * rem, 520 * rem + 6 * settle);
      f.pivot.rotation.set(-dy * (f.tilt + 0.9 * rem), dx * (f.tilt + 0.9 * rem), 1.2 * rem);
    }

    // wordmark wipe
    const wp = E.inOut(inv(CUE.wipe[0], CUE.wipe[1], t));
    const wx = t < CUE.wipe[0] ? wx0 - 50 : lerp(wx0, wx1, wp);
    clipFill.constant = wx; clipWire.constant = -wx;
    wipeLine.position.x = wx; wipeLine.material.opacity = Math.min(inv(CUE.wipe[0], CUE.wipe[0] + 0.08, t), 1 - inv(CUE.wipe[1] - 0.05, CUE.wipe[1] + 0.05, t));

    // facet flip → white app surface fills the frame
    const ft = inv(CUE.flip[0], CUE.flip[1], t);
    flip.visible = t >= CUE.flip[0];
    if (flip.visible) {
      const r = E.inOut(clamp(ft / 0.7));
      flip.rotation.y = Math.PI * (1 - r);
      const g = E.in(ft);
      flip.scale.set(lerp(150, 3200, g), lerp(150, 1900, g), 1);
      flip.position.set(lerp(starW.x, 0, g), lerp(starW.y, 0, g), lerp(80, 700, g));
    }

    // construction labels follow the 3D layout
    for (const [d, [x, y]] of labels) {
      proj.copy(toWorld(x, y)).project(camera);
      css(d, { left: `${(proj.x + 1) * 960}px`, top: `${(1 - proj.y) * 540 - 10}px`, opacity: String(consA * inv(0.3, 0.6, t)) });
    }
    corner.style.opacity = String(1 - inv(1.4, 1.7, t));
    return { scene, camera, bg: 'radial-gradient(circle at 42% 38%, #25272D 0%, #121317 55%, #070708 100%)' };
  }
  return { update };
}
