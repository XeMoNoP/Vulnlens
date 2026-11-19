// Shared layout of the responsive prototype system (S4B) and its inward travel into the star
// (S5A). Both scenes call protoPose(i, t) so every screen lands on the same pixels across the cut.
import { CUE } from './cues.js';
import { E, inv, lerp, clamp, C, FONT } from '../src/lib.js';
import { bladeShapes } from './star3d.js';
import { STAR } from '../src/logo3d.js';

export const STAR_C = [960, 500], STAR_R = 236;            // S5 star placement (screen px), same size as S1
const kS = STAR_R / STAR.r;
const blades = bladeShapes();
// blade centroid on screen (y down) for each tip angle
const bladeAt = (tip) => {
  const b = blades.reduce((a, c) => { const d = (x) => Math.abs(Math.atan2(Math.sin(x.axis + tip), Math.cos(x.axis + tip))); return d(c) < d(a) ? c : a; });
  return [STAR_C[0] + b.centroid[0] * kS, STAR_C[1] - b.centroid[1] * kS, b];
};
const tipAt = (deg) => STAR.tips.reduce((a, b) => Math.abs(b * 180 / Math.PI - deg) < Math.abs(a * 180 / Math.PI - deg) ? b : a);

// six items on the six blade axes (screen px, y down)
export const ITEMS = [
  { kind: 'desktop', w: 560, h: 350, x: 1478, y: 478, tip: tipAt(-4) },
  { kind: 'phone', w: 200, h: 390, x: 1186, y: 808, tip: tipAt(59) },
  { kind: 'button', w: 270, h: 150, x: 724, y: 808, tip: tipAt(122) },
  { kind: 'tablet', w: 320, h: 470, x: 452, y: 508, tip: tipAt(-179) },
  { kind: 'toggle', w: 250, h: 150, x: 724, y: 214, tip: tipAt(-122) },
  { kind: 'card', w: 270, h: 160, x: 1112, y: 196, tip: tipAt(-61) },
].map((it, i) => { const [bx, by, blade] = bladeAt(it.tip); return { ...it, i, bx, by, blade }; });

export const HUB = [960, 500];
// pose of item i at time t (only meaningful for t ≥ system start)
export function protoPose(i, t) {
  const it = ITEMS[i];
  const k = E.inOut(inv(CUE.s4.inward[0], CUE.dock[i], t));       // travels inward along its blade axis
  // slow push-in on the whole system while it holds (no frozen frames), shared by S4 and S5
  const z = 1 + 0.06 * E.inOut(inv(CUE.s4.system[1] - 0.2, CUE.s4.inward[0] + 0.3, t));
  const sx = HUB[0] + (it.x - HUB[0]) * z, sy = HUB[1] + (it.y - HUB[1]) * z;
  const x = lerp(sx, it.bx, k), y = lerp(sy, it.by, k);
  const sc = lerp(z, 0.22, E.in(k));
  const rot = lerp(0, (it.tip * 180 / Math.PI) + 90, E.inOut(inv(CUE.s4.inward[0] + 0.4, CUE.dock[i], t))) * 0.25;
  return { x, y, w: it.w, h: it.h, sc, rot, k };
}

// responsive screen content (same "Onboarding flow" product, demo copy)
export function screenHTML(kind) {
  const lime = C.lime, ink = C.ink, grey = C.grey, hair = C.hair;
  const bar = (w, c = '#E9EBEF', h = 12) => `<div style="height:${h}px;width:${w}%;border-radius:${h / 2}px;background:${c};margin-top:10px"></div>`;
  if (kind === 'desktop') return `<div style="height:36px;background:${C.sweep};border-bottom:1px solid ${hair};display:flex;align-items:center;gap:8px;padding-left:14px">${'<i style="width:10px;height:10px;border-radius:5px;background:#D9DCE1;display:block"></i>'.repeat(3)}</div>
    <div style="display:flex;height:calc(100% - 37px)"><div style="width:120px;background:#FBFBFC;border-right:1px solid ${hair};padding:16px 14px;box-sizing:border-box">${bar(80, '#C9CDD3')}${bar(60)}${bar(70)}${bar(55)}</div>
    <div style="flex:1;padding:22px 26px;box-sizing:border-box"><div style="font:600 30px ${FONT.head};letter-spacing:-.5px">Onboarding flow</div><div style="font:400 17px ${FONT.body};color:${grey};margin-top:4px">Step 2 of 6 · Workspace setup</div>
    <div style="margin-top:16px;height:10px;border-radius:5px;background:#E9EBEF"><div style="height:10px;width:34%;border-radius:5px;background:${ink}"></div></div>
    <div style="display:flex;gap:14px;margin-top:20px">${[0, 1].map(j => `<div style="flex:1;border:1px solid ${hair};border-radius:12px;padding:14px;height:96px;box-sizing:border-box"><div style="width:30px;height:30px;border-radius:8px;background:${j ? '#EEF0F3' : lime}"></div>${bar(70, '#C9CDD3', 10)}${bar(50, '#E9EBEF', 10)}</div>`).join('')}</div>
    <div style="margin-top:18px;width:170px;height:44px;border-radius:22px;background:${ink};color:#fff;font:600 17px ${FONT.body};display:flex;align-items:center;justify-content:center">Continue</div></div></div>`;
  if (kind === 'tablet') return `<div style="padding:26px 24px;box-sizing:border-box"><div style="width:60px;height:8px;border-radius:4px;background:#D9DCE1;margin:0 auto 18px"></div><div style="font:600 28px ${FONT.head};letter-spacing:-.5px">Onboarding flow</div><div style="font:400 16px ${FONT.body};color:${grey};margin-top:4px">Step 2 of 6</div>
    ${[0, 1, 2].map(j => `<div style="border:1px solid ${hair};border-radius:12px;padding:14px;margin-top:14px;display:flex;gap:12px;align-items:center"><div style="width:34px;height:34px;border-radius:9px;background:${j ? '#EEF0F3' : lime};flex:none"></div><div style="flex:1">${bar(80, '#C9CDD3', 10)}${bar(55, '#E9EBEF', 10)}</div></div>`).join('')}
    <div style="margin-top:18px;height:46px;border-radius:23px;background:${ink};color:#fff;font:600 17px ${FONT.body};display:flex;align-items:center;justify-content:center">Continue</div></div>`;
  if (kind === 'phone') return `<div style="padding:18px 16px;box-sizing:border-box"><div style="width:70px;height:20px;border-radius:10px;background:#111;margin:0 auto 16px"></div><div style="font:600 22px ${FONT.head};letter-spacing:-.3px">Onboarding</div><div style="font:400 14px ${FONT.body};color:${grey};margin-top:2px">Step 2 of 6</div>
    ${[0, 1, 2].map(j => `<div style="border:1px solid ${hair};border-radius:10px;padding:10px;margin-top:10px;display:flex;gap:10px;align-items:center"><div style="width:26px;height:26px;border-radius:7px;background:${j ? '#EEF0F3' : lime};flex:none"></div><div style="flex:1">${bar(80, '#C9CDD3', 8)}</div></div>`).join('')}
    <div style="margin-top:16px;height:40px;border-radius:20px;background:${ink};color:#fff;font:600 15px ${FONT.body};display:flex;align-items:center;justify-content:center">Continue</div></div>`;
  if (kind === 'button') return `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px"><div style="font:500 13px ${FONT.mono};letter-spacing:1.5px;color:${grey}">BUTTON</div><div style="width:210px;height:58px;border-radius:29px;background:${ink};color:#fff;font:600 19px ${FONT.head};display:flex;align-items:center;justify-content:center">Publish prototype</div></div>`;
  if (kind === 'toggle') return `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px"><div style="font:500 13px ${FONT.mono};letter-spacing:1.5px;color:${grey}">TOGGLE</div><div style="width:120px;height:56px;border-radius:28px;background:${ink};position:relative"><div style="position:absolute;right:6px;top:6px;width:44px;height:44px;border-radius:22px;background:${lime}"></div></div></div>`;
  return `<div style="padding:18px 20px;box-sizing:border-box"><div style="font:500 13px ${FONT.mono};letter-spacing:1.5px;color:${grey}">CARD</div><div style="font:600 21px ${FONT.head};margin-top:6px">Onboarding flow</div><div style="margin-top:12px;height:8px;border-radius:4px;background:#E9EBEF"><div style="height:8px;width:70%;border-radius:4px;background:${lime}"></div></div><div style="font:400 14px ${FONT.body};color:${grey};margin-top:10px">Prototype · 6 screens</div></div>`;
}
