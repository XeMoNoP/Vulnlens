// Shared, pure helpers. Every value in the film is a function of time t (seconds).
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, t) => clamp((t - a) / (b - a));
export const mix = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

// cubic-bezier(x1, y1, x2, y2) solved for y at x (Newton + bisection)
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u, dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-6) return sy(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
    let lo = 0, hi = 1; u = x;
    for (let i = 0; i < 30; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}
// house curves
export const E = {
  out: bezier(0.16, 1, 0.3, 1),        // premium settle (cubic-bezier(0.16, 1, 0.3, 1))
  inOut: bezier(0.65, 0, 0.35, 1),
  in: bezier(0.55, 0, 0.9, 0.35),       // leave fast
  soft: bezier(0.4, 0, 0.2, 1),
  linear: (x) => x,
};
// tween helper: value from a→b over [t0, t1] with easing
export const tw = (t, t0, t1, a, b, ease = E.out) => lerp(a, b, ease(inv(t0, t1, t)));

// Closed-form damped spring step response (pure function of time since the step).
// Returns the fraction of the step still remaining (1 at d=0 → 0 at rest).
export function springRemain(d, w = 16, z = 0.86) {
  if (d <= 0) return 1;
  if (z >= 1) return Math.exp(-w * d) * (1 + w * d);
  const wd = w * Math.sqrt(1 - z * z);
  return Math.exp(-z * w * d) * (Math.cos(wd * d) + (z * w / wd) * Math.sin(wd * d));
}
// A value that is retargeted many times: one spring per change, summed.
// steps = [[t_i, target_i], ...] in time order, v0 = initial value.
export function springSeq(t, v0, steps, w = 16, z = 0.86) {
  let v = v0, prev = v0;
  for (const [ti, target] of steps) { v += (target - prev) * (1 - springRemain(t - ti, w, z)); prev = target; }
  return v;
}
export const spring = (t, t0, a, b, w = 16, z = 0.86) => b + (a - b) * springRemain(t - t0, w, z);

// deterministic noise
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
export function fbm(x, y, oct = 5) { let a = 0.5, f = 1, s = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

// hex → css rgba / mixing
export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const mixHex = (a, b, k) => rgb(mix(hex(a), hex(b), clamp(k)));

// window [a, b] visibility with short fades (seconds)
export const win = (t, a, b, fi = 0.12, fo = 0.12) => Math.min(inv(a, a + fi, t), 1 - inv(b - fo, b, t));

// small DOM helper
export function el(tag, attrs = {}, parent, html) {
  const ns = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'use', 'defs', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'symbol', 'text', 'mask', 'ellipse', 'polygon'].includes(tag);
  const e = ns ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export const css = (e, o) => { for (const k in o) e.style[k] = o[k]; };

// brand
export const C = { ink: '#111111', black: '#0B0B0B', white: '#FFFFFF', lime: '#D7FF00', blue: '#2A3DFF', grey: '#666666', hair: '#E5E7EB', canvas: '#F2F2F0', sweep: '#F7F8FA', graphite: '#16171B' };
export const FONT = { head: "'Inter Tight', sans-serif", body: "Inter, sans-serif", mono: "'JetBrains Mono', monospace" };
