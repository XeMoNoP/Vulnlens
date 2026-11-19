// The official six-blade star split into its six blades along its natural notches
// (LOGO.star.cuts), each extruded with a real bevel. The front faces together are exactly
// the supplied star outline (bevelOffset = -bevelSize keeps the outline unchanged).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { logoShapes, STAR } from '../src/logo3d.js';

export const DEPTH = 64, BEVEL = 12;

export function bladeShapes() {
  const shape = logoShapes().star[0];
  const pts = shape.extractPoints(24).shape.map(p => [p.x - STAR.cx, -(p.y - STAR.cy)]); // y up, centred
  const ang = (p) => Math.atan2(-p[1], p[0]);           // angle in the original (y-down) frame
  const rad = (p) => Math.hypot(p[0], p[1]);
  const dA = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  // notch = closest outline point to the centre near each cut angle
  const notch = STAR.cuts.map(c => {
    let best = -1, br = Infinity;
    pts.forEach((p, i) => { if (dA(ang(p), c) < 0.3 && rad(p) < br) { br = rad(p); best = i; } });
    return best;
  }).sort((a, b) => a - b);
  const blades = [];
  for (let k = 0; k < notch.length; k++) {
    const a = notch[k], b = notch[(k + 1) % notch.length];
    const arc = []; for (let i = a; ; i = (i + 1) % pts.length) { arc.push(pts[i]); if (i === b) break; }
    const poly = [[0, 0], ...arc];
    // tip edge: the longest convex-hull edge whose ends are both far from the centre (the outer edge)
    const hull = (P) => { const s = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
      for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of s.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1)); };
    const hp = hull(arc); let te = [hp[0], hp[1]], tl = 0;
    for (let i = 0; i < hp.length; i++) { const a2 = hp[i], b2 = hp[(i + 1) % hp.length]; if (rad(a2) < STAR.r * 0.6 || rad(b2) < STAR.r * 0.6) continue; const l = Math.hypot(b2[0] - a2[0], b2[1] - a2[1]); if (l > tl) { tl = l; te = [a2, b2]; } }
    let cx = 0, cy = 0; arc.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= arc.length; cy /= arc.length;
    const s = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])));
    blades.push({ shape: s, poly, tip: te, centroid: [cx, cy], axis: Math.atan2(cy, cx) });
  }
  return blades;
}

export function graphite(envMap) {
  // satin-black lacquer: reads as the black logo, glossy clearcoat picks up soft studio highlights
  return new THREE.MeshPhysicalMaterial({ color: 0x1d1e23, metalness: 0.3, roughness: 0.34, clearcoat: 1.0, clearcoatRoughness: 0.1, envMap, envMapIntensity: 1.35, sheen: 0.2, sheenColor: new THREE.Color(0x8a90a0) });
}

// Build a group of six blade meshes (logo units, y up, centred on the star centre).
export function buildStar(material, { castShadow = true } = {}) {
  const group = new THREE.Group();
  const blades = bladeShapes().map((b, i) => {
    const geo = new THREE.ExtrudeGeometry(b.shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL * 0.75, bevelOffset: -BEVEL * 0.75, bevelSegments: 5, curveSegments: 8 });
    geo.translate(0, 0, -DEPTH / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = castShadow; mesh.receiveShadow = true;
    const pivot = new THREE.Group(); pivot.add(mesh); group.add(pivot);
    return { ...b, mesh, pivot, index: i };
  });
  return { group, blades };
}

export function buildSolid(material) {
  const shape = logoShapes().star[0];
  const pts = shape.extractPoints(24).shape.map(p => new THREE.Vector2(p.x - STAR.cx, -(p.y - STAR.cy)));
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL * 0.75, bevelOffset: -BEVEL * 0.75, bevelSegments: 5, curveSegments: 8 });
  geo.translate(0, 0, -DEPTH / 2);
  return new THREE.Mesh(geo, material);
}

export function envFor(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return env;
}
