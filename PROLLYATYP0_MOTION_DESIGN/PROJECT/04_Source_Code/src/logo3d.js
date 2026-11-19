// The official logo (traced vectors in 03_Assets/logo/logo-data.js) parsed into three.js shapes.
// Geometry is used exactly as supplied: no redrawing, no distortion.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const L = window.LOGO;
export const STAR = L.star, BBOX = L.bbox;

let cache = null;
export function logoShapes() {
  if (cache) return cache;
  const paths = [L.star.d, ...L.glyphs.map(g => g.d)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${paths.map(d => `<path fill="#000" fill-rule="evenodd" d="${d}"/>`).join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.map(p => SVGLoader.createShapes(p));
  cache = { star: shapes[0], glyphs: shapes.slice(1).flat() };
  return cache;
}

// outline polylines (outer + holes) for a list of shapes, in logo units
export function outlines(shapes, div = 24) {
  const out = [];
  for (const s of shapes) {
    out.push(s.getPoints(div));
    for (const h of s.holes) out.push(h.getPoints(div));
  }
  return out;
}

// Triangulate the star and subdivide into small triangles, so it can be built from facets.
export function starTriangles(maxEdge = 70) {
  const { star } = logoShapes();
  const tris = [];
  for (const s of star) {
    const ex = s.extractPoints(14);
    const pts = ex.shape, holes = ex.holes;
    const all = pts.concat(...holes);
    const faces = THREE.ShapeUtils.triangulateShape(pts, holes);
    for (const f of faces) tris.push([all[f[0]], all[f[1]], all[f[2]]].map(p => [p.x, p.y]));
  }
  const out = [];
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const split = (t) => {
    const [a, b, c] = t;
    if (Math.max(d(a, b), d(b, c), d(c, a)) <= maxEdge) { out.push(t); return; }
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    split([a, ab, ca]); split([ab, b, bc]); split([ca, bc, c]); split([ab, bc, ca]);
  };
  tris.forEach(split);
  return out;
}

// Build a solid prism geometry (top, bottom, sides) from triangles in logo units.
export function prismGeometry(tris, depth) {
  const pos = [];
  const push = (...v) => pos.push(...v);
  for (const [a, b, c] of tris) {
    push(a[0], a[1], 0, b[0], b[1], 0, c[0], c[1], 0);
    push(a[0], a[1], -depth, c[0], c[1], -depth, b[0], b[1], -depth);
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      push(p[0], p[1], 0, p[0], p[1], -depth, q[0], q[1], 0);
      push(q[0], q[1], 0, p[0], p[1], -depth, q[0], q[1], -depth);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
