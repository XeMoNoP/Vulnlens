// Builds storyboard.html: the creative treatment and visual storyboard (v3) for the
// Prollyatyp0 Services Film. Frames are SVG drawn from the official traced logo
// (prollyatypo-film/src/logo-data.js); the logo geometry is never altered.
// Run: node build-storyboard.mjs [path-to-prollyatypo-film]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const filmDir = process.argv[2] || path.resolve(here, '../../../../../../prollyatypo-film');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(filmDir, 'src/logo-data.js'), 'utf8'), ctx);
const LOGO = ctx.window.LOGO;
const S = LOGO.star, B = LOGO.bbox;

// ── film palette (brand) ──
const K = '#0B0B0B', W = '#FFFFFF', L = '#D7FF00', BL = '#2A3DFF', INK = '#111111', MUTE = '#666666', HAIR = '#E5E7EB';
const FH = "'Inter Tight', Inter, 'Segoe UI', Arial, sans-serif", FB = "Inter, 'Segoe UI', Arial, sans-serif", FM = "'JetBrains Mono', Consolas, monospace";
const FPS = 60, DUR = 15;

// ── logo geometry ──
const LW_ = B.x1 - B.x0, LH_ = B.y1 - B.y0;
const logoVB = `${B.x0} ${B.y0} ${LW_} ${LH_}`;
const starVB = `${S.cx - S.r} ${S.cy - S.r} ${2 * S.r} ${2 * S.r}`;
const glyphPaths = (extra = '') => LOGO.glyphs.map(g => `<path fill-rule="evenodd" d="${g.d}" ${extra}/>`).join('');
// place a logo of width w centred at (cx, cy); returns star centre + radius on screen
function logoBox(cx, cy, w) { const k = w / LW_, h = LH_ * k, x = cx - w / 2, y = cy - h / 2; return { x, y, w, h, k, sx: x + (S.cx - B.x0) * k, sy: y + (S.cy - B.y0) * k, sr: S.r * k }; }
const starXform = (sx, sy, k) => `translate(${sx - S.cx * k} ${sy - S.cy * k}) scale(${k})`;

const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<path id="starPath" fill-rule="evenodd" d="${S.d}"/>
<symbol id="star" viewBox="${starVB}"><use href="#starPath"/></symbol>
<symbol id="logo" viewBox="${logoVB}"><use href="#starPath"/>${glyphPaths()}</symbol>
<symbol id="wm" viewBox="${logoVB}">${glyphPaths()}</symbol>
<symbol id="logoLine" viewBox="${logoVB}"><path d="${S.d}" vector-effect="non-scaling-stroke"/>${glyphPaths('vector-effect="non-scaling-stroke"')}</symbol>
<symbol id="wmLine" viewBox="${logoVB}">${glyphPaths('vector-effect="non-scaling-stroke"')}</symbol>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L}"/><stop offset=".4" stop-color="${L}" stop-opacity=".85"/><stop offset=".58" stop-color="${L}" stop-opacity="0"/></linearGradient>
<radialGradient id="studioDark" cx=".42" cy=".38" r=".85"><stop offset="0" stop-color="#23252B"/><stop offset=".55" stop-color="#121317"/><stop offset="1" stop-color="#070708"/></radialGradient>
<radialGradient id="keyLeft" cx=".12" cy=".3" r=".6"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".10"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F8FA"/><stop offset=".62" stop-color="#EEF0F3"/><stop offset="1" stop-color="#E2E5EA"/></linearGradient>
<radialGradient id="sweepLight" cx=".3" cy=".25" r=".7"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080C"/><stop offset=".45" stop-color="#151A2B"/><stop offset=".62" stop-color="#2C3249"/><stop offset=".64" stop-color="#3B4158"/></linearGradient>
<linearGradient id="fogBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CFE0" stop-opacity="0"/><stop offset=".5" stop-color="#C9CFE0" stop-opacity=".18"/><stop offset="1" stop-color="#C9CFE0" stop-opacity="0"/></linearGradient>
<linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121317"/><stop offset=".6" stop-color="#1D1F25"/><stop offset="1" stop-color="#16171B"/></linearGradient>
<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3B40"/><stop offset="1" stop-color="#1F2024"/></linearGradient>
<linearGradient id="windowLight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#DDE3F2" stop-opacity=".35"/><stop offset="1" stop-color="#DDE3F2" stop-opacity="0"/></linearGradient>
<radialGradient id="lightOpen" cx=".5" cy=".46" r=".72"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".42" stop-color="#F2F3F5"/><stop offset=".78" stop-color="#5A5C63"/><stop offset="1" stop-color="#16171B"/></radialGradient>
<radialGradient id="contact" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="contactLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="limeGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${L}" stop-opacity=".55"/><stop offset="1" stop-color="${L}" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#0B1020" flood-opacity=".16"/></filter>
<filter id="dof"><feGaussianBlur stdDeviation="3.2"/></filter>
<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker>
</defs></svg>`;

// ── helpers ──
const star = (cx, cy, size, fill, extra = '') => `<use href="#star" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" fill="${fill}" ${extra}/>`;
const useLogo = (id, b, attrs) => `<use href="#${id}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" ${attrs}/>`;
const txt = (x, y, s, size, fill, fam, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="${fam}" ${extra}>${s}</text>`;
const mono = (x, y, s, size = 20, fill = INK, extra = '') => txt(x, y, s, size, fill, FM, `letter-spacing="1.5" ${extra}`);
const head = (x, y, s, size, fill) => txt(x, y, s, size, fill, FH, 'font-weight="600" letter-spacing="-1"');
const chip = (x, y, s) => { const w = s.length * 13 + 22; return `<rect x="${x}" y="${y - 24}" width="${w}" height="34" rx="6" fill="${L}"/>${mono(x + 11, y, s, 21, INK)}`; };
// annotation layer: camera / motion marks (hidden by the toggle; not in the film)
const pill = (x, y, s, dark) => { const w = s.length * 12.4 + 28; return `<g><rect x="${x}" y="${y - 24}" width="${w}" height="34" rx="17" fill="${dark ? '#FFFFFF' : INK}" fill-opacity=".94"/><text x="${x + 14}" y="${y - 1}" font-size="19" fill="${dark ? INK : '#FFFFFF'}" font-family="${FM}">${s}</text></g>`; };
const arrow = (x1, y1, x2, y2, curve = 0, dark) => { const mx = (x1 + x2) / 2 + curve, my = (y1 + y2) / 2 - curve; return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${dark ? '#FFFFFF' : INK}" stroke-width="3" stroke-dasharray="10 9" marker-end="url(#ah)"/>`; };
const anno = (...p) => `<g class="anno">${p.join('')}</g>`;
const frame = (inner, label, bg = W) => `<svg class="frame" viewBox="0 0 1920 1080" role="img" aria-label="${label}"><rect width="1920" height="1080" fill="${bg}"/>${inner}</svg>`;
// deterministic noise
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pt = (a, r, cx, cy) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

// ── product UI (light), demo-safe content: no metrics, no customer data ──
function appWindow(w, h) {
  const sb = 220, top = 64;
  const rows = [['Onboarding flow', 'In design', '#EEF0FF', BL], ['Billing service', 'In review', '#F4F4F5', MUTE], ['Design system', 'Live', '#F5FFD0', '#4A5A00'], ['Partner portal', 'In design', '#EEF0FF', BL], ['Admin console', 'Live', '#F5FFD0', '#4A5A00']];
  const nav = ['Home', 'Projects', 'Analytics', 'Team', 'Settings'];
  const cx = sb + 36, cw = w - sb - 72 - 300;
  return `<rect width="${w}" height="${h}" rx="18" fill="#FFFFFF" stroke="${HAIR}" stroke-width="2" filter="url(#sh)"/>
  <path d="M18 0 H${w - 18} a18 18 0 0 1 18 18 V${top} H0 V18 a18 18 0 0 1 18 -18z" fill="#F7F8FA"/><rect y="${top}" width="${w}" height="1" fill="${HAIR}"/>
  ${[0, 1, 2].map(i => `<circle cx="${28 + i * 24}" cy="32" r="7" fill="#D9DCE1"/>`).join('')}
  <rect x="${w / 2 - 210}" y="16" width="420" height="32" rx="16" fill="#FFFFFF" stroke="${HAIR}"/>${mono(w / 2 - 190, 38, 'app.workspace.dev/projects', 15, '#8A8F98')}
  <rect x="0" y="${top}" width="${sb}" height="${h - top}" fill="#FBFBFC"/><rect x="${sb}" y="${top}" width="1" height="${h - top}" fill="${HAIR}"/>
  ${star(46, top + 46, 30, INK)}${txt(72, top + 54, 'Workspace', 21, INK, FH, 'font-weight="600"')}
  ${nav.map((n, i) => `<rect x="16" y="${top + 96 + i * 50}" width="${sb - 32}" height="38" rx="9" fill="${i === 1 ? '#FFFFFF' : 'none'}" ${i === 1 ? `stroke="${HAIR}"` : ''}/><rect x="32" y="${top + 108 + i * 50}" width="14" height="14" rx="4" fill="${i === 1 ? INK : '#C9CDD3'}"/>${txt(58, top + 121 + i * 50, n, 18, i === 1 ? INK : MUTE, FB)}`).join('')}
  ${txt(cx, top + 66, 'Projects', 34, INK, FH, 'font-weight="600" letter-spacing="-0.5"')}
  <rect x="${w - 230}" y="${top + 34}" width="190" height="44" rx="10" fill="${INK}"/>${txt(w - 135, top + 63, 'New project', 18, '#FFFFFF', FB, 'text-anchor="middle" font-weight="600"')}
  ${['All', 'In design', 'In review', 'Live'].map((t, i) => `<rect x="${cx + i * 118}" y="${top + 100}" width="106" height="34" rx="17" fill="${i === 0 ? L : '#F4F4F5'}"/>${txt(cx + i * 118 + 53, top + 123, t, 16, INK, FB, 'text-anchor="middle"')}`).join('')}
  ${rows.map(([n, s, bg, fg], i) => { const y = top + 160 + i * 64; return `<rect x="${cx}" y="${y}" width="${cw}" height="52" rx="10" fill="#FFFFFF" stroke="${HAIR}"/><rect x="${cx + 16}" y="${y + 14}" width="24" height="24" rx="6" fill="#EEF0F3"/>${txt(cx + 56, y + 32, n, 18, INK, FB, 'font-weight="500"')}<rect x="${cx + cw - 140}" y="${y + 13}" width="118" height="26" rx="13" fill="${bg}"/>${txt(cx + cw - 81, y + 31, s, 14, fg, FB, 'text-anchor="middle" font-weight="600"')}${[0, 1].map(j => `<circle cx="${cx + cw - 190 - j * 20}" cy="${y + 26}" r="12" fill="${j ? '#C7CBF5' : '#D9DCE1'}" stroke="#fff" stroke-width="3"/>`).join('')}`; }).join('')}
  <rect x="${w - 300}" y="${top + 160}" width="260" height="${h - top - 200}" rx="12" fill="#F7F8FA" stroke="${HAIR}"/>${txt(w - 280, top + 196, 'Activity', 18, INK, FB, 'font-weight="600"')}
  <polyline points="${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `${w - 280 + i * 31},${top + 300 - [20, 34, 28, 52, 46, 70, 64, 88][i]}`).join(' ')}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  ${[0, 1, 2].map(i => `<rect x="${w - 280}" y="${top + 340 + i * 44}" width="220" height="12" rx="6" fill="#E9EBEF"/><rect x="${w - 280}" y="${top + 340 + i * 44}" width="${[150, 100, 170][i]}" height="12" rx="6" fill="${i === 0 ? BL : '#C9CDD3'}"/>`).join('')}`;
}

// ── frames ──
const F = {};

// 1A — Wireframe construction (dark studio)
{
  const b = logoBox(960, 520, 1300);
  let g = '';
  g += `<circle cx="${b.sx}" cy="${b.sy}" r="${b.sr}" fill="none" stroke="#FFFFFF" stroke-opacity=".22" stroke-dasharray="4 8"/>`;
  g += `<circle cx="${b.sx}" cy="${b.sy}" r="${b.sr * 0.36}" fill="none" stroke="#FFFFFF" stroke-opacity=".18"/>`;
  S.tips.forEach(a => { const [x1, y1] = pt(a, b.sr * 1.55, b.sx, b.sy), [x2, y2] = pt(a + Math.PI, b.sr * 0.2, b.sx, b.sy); g += `<line x1="${x2}" y1="${y2}" x2="${x1}" y2="${y1}" stroke="#FFFFFF" stroke-opacity=".16"/>`; const [tx, ty] = pt(a, b.sr, b.sx, b.sy); g += `<circle cx="${tx}" cy="${ty}" r="5" fill="${L}"/>`; });
  const base = b.y + (1700 - B.y0) * b.k, cap = b.y + (1240 - B.y0) * b.k, xh = b.y + (1440 - B.y0) * b.k;
  [[cap, '.22', ''], [xh, '.16', 'stroke-dasharray="6 8"'], [base, '.3', '']].forEach(([y, o, d]) => g += `<line x1="${b.x + b.w * 0.2}" x2="${b.x + b.w + 40}" y1="${y}" y2="${y}" stroke="#FFFFFF" stroke-opacity="${o}" ${d}/>`);
  F['1A'] = frame(`<rect width="1920" height="1080" fill="url(#studioDark)"/>${g}
    ${useLogo('logoLine', b, `fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-opacity=".92"`)}
    ${mono(b.sx + b.sr + 18, b.sy - b.sr - 10, 'R 322', 16, '#FFFFFF', 'fill-opacity=".55"')}${mono(b.sx - 40, b.sy + b.sr * 1.62, '6 × 60°', 16, '#FFFFFF', 'fill-opacity=".55"')}
    ${mono(b.x + b.w + 50, base + 6, 'BASELINE', 14, '#FFFFFF', 'fill-opacity=".45"')}${mono(b.x + b.w + 50, cap + 6, 'CAP', 14, '#FFFFFF', 'fill-opacity=".45"')}
    ${mono(96, 1000, 'PROLLYATYP0', 18, '#FFFFFF', 'fill-opacity=".45"')}
    ${anno(pill(1240, 120, 'ORBIT 20° + DOLLY-IN, 35 MM', true), arrow(1420, 150, 1180, 300, 50, true), pill(110, 120, 'LINES DRAW ON IN 54 FRAMES', true))}`,
    'Frame 1A: the Prollyatyp0 logo drawn as a precise white wireframe with construction geometry on a dark graphite studio background', K);
}

// 1B — Faceted assembly (dark studio, lit)
{
  const b = logoBox(960, 540, 1300), k = b.k;
  const missing = new Set([4, 11, 19]);
  let fan = '', shards = '';
  const N = 24, R = b.sr * 1.15;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2;
    const lum = 0.5 + 0.5 * Math.cos(am - (-2.4));
    const c = Math.round(48 + lum * 130 + (i % 2) * 14), fill = `rgb(${c},${c},${c + 5})`;
    const [x0, y0] = pt(a0, R, b.sx, b.sy), [x1, y1] = pt(a1, R, b.sx, b.sy);
    if (!missing.has(i)) fan += `<path d="M${b.sx} ${b.sy} L${x0} ${y0} L${x1} ${y1} Z" fill="${fill}" stroke="${fill}" stroke-width="1"/>`;
    else { const off = 150 + i * 4, rot = 18 + i; const [dx, dy] = [Math.cos(am) * off, Math.sin(am) * off]; shards += `<g transform="translate(${dx} ${dy}) rotate(${rot} ${b.sx} ${b.sy})"><path d="M${b.sx + Math.cos(am) * b.sr * 0.35} ${b.sy + Math.sin(am) * b.sr * 0.35} L${x0 - (x0 - b.sx) * 0.15} ${y0 - (y0 - b.sy) * 0.15} L${x1 - (x1 - b.sx) * 0.15} ${y1 - (y1 - b.sy) * 0.15} Z" fill="${fill}" stroke="${L}" stroke-width="2.5"/></g>`; }
  }
  let ext = '';
  for (let d = 14; d >= 1; d--) ext += `<use href="#starPath" transform="translate(${d * 1.6} ${d * 2.6}) ${starXform(b.sx, b.sy, k)}" fill="${d === 14 ? '#000' : '#0D0D10'}"/>`;
  const wipe = b.x + b.w * 0.62;
  F['1B'] = frame(`<rect width="1920" height="1080" fill="url(#studioDark)"/><rect width="1920" height="1080" fill="url(#keyLeft)"/>
    <ellipse cx="${b.sx + 20}" cy="${b.sy + b.sr + 40}" rx="${b.sr * 1.2}" ry="34" fill="url(#contact)"/>
    <clipPath id="c1b"><use href="#starPath" transform="${starXform(b.sx, b.sy, k)}"/></clipPath>
    ${ext}<g clip-path="url(#c1b)">${fan}</g>
    <use href="#starPath" transform="${starXform(b.sx, b.sy, k)}" fill="none" stroke="url(#rim)" stroke-width="${3.2 / k}"/>
    ${shards}
    <clipPath id="c1bw"><rect x="0" y="0" width="${wipe}" height="1080"/></clipPath><clipPath id="c1bw2"><rect x="${wipe}" y="0" width="${1920 - wipe}" height="1080"/></clipPath>
    <g clip-path="url(#c1bw)">${useLogo('wm', b, 'fill="#F4F4F4"')}</g>
    <g clip-path="url(#c1bw2)">${useLogo('wmLine', b, 'fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.4"')}</g>
    <line x1="${wipe}" x2="${wipe}" y1="${b.y - 20}" y2="${b.y + b.h + 20}" stroke="${L}" stroke-width="3"/>
    ${anno(pill(1250, 120, 'FACETS LOCK ON THE BEAT · 3 IN FLIGHT', true), pill(110, 990, 'CENTRE FACET FLIPS → APP SURFACE · 1.85 s', true), arrow(500, 950, b.sx - 20, b.sy + 30, -60, true))}`,
    'Frame 1B: the star assembles from lit faceted pieces, three still in flight, while the wordmark fills in from its wireframe', K);
}

// 2A — Product hero (bright product-shoot sweep)
F['2A'] = frame(`<rect width="1920" height="1080" fill="url(#sweep)"/><rect width="1920" height="1080" fill="url(#sweepLight)"/>
  <ellipse cx="1120" cy="1000" rx="760" ry="46" fill="url(#contactLight)"/>
  <g transform="translate(470 150) skewY(-7) scale(.96 1)">${appWindow(1340, 800)}</g>
  ${chip(96, 868, '01 / SAAS')}
  ${head(92, 950, 'SaaS Design &amp; Development', 58, INK)}
  ${anno(pill(1250, 110, 'CRANE DOWN 12° · RACK FOCUS TO HEADER'), arrow(1450, 140, 1300, 260, 40), pill(500, 1040, 'UI REGIONS SETTLE 2–4 FRAMES APART'))}`,
  'Frame 2A: a light product interface shown as the hero in three-quarter view on a soft grey studio sweep, with a one-line title');

// 2B — Layer separation (macro, shallow depth of field)
{
  const layer = (x, y, inner, o = '') => `<g transform="translate(${x} ${y}) skewY(-10) skewX(18) scale(1 .9)" ${o}>${inner}</g>`;
  const card = (w, h, t, body) => `<rect width="${w}" height="${h}" rx="16" fill="#FFFFFF" stroke="${HAIR}" stroke-width="2" filter="url(#sh)"/>${txt(24, 44, t, 22, INK, FH, 'font-weight="600"')}${body}`;
  F['2B'] = frame(`<rect width="1920" height="1080" fill="url(#sweep)"/><rect width="1920" height="1080" fill="url(#sweepLight)"/>
    ${layer(180, 260, `<rect width="900" height="560" rx="18" fill="#F7F8FA" stroke="${HAIR}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="30" y="${40 + i * 80}" width="840" height="56" rx="10" fill="#FFFFFF" stroke="${HAIR}"/>`).join('')}`, 'filter="url(#dof)" opacity=".75"')}
    ${layer(420, 200, card(250, 560, 'Navigation', ['Home', 'Projects', 'Analytics', 'Team'].map((n, i) => `<rect x="20" y="${76 + i * 54}" width="210" height="40" rx="9" fill="${i === 1 ? L : '#F4F4F5'}"/>${txt(36, 102 + i * 54, n, 17, INK, FB)}`).join('')), 'filter="url(#dof)"')}
    ${layer(760, 230, card(620, 380, 'Projects', [0, 1, 2, 3].map(i => `<rect x="24" y="${70 + i * 70}" width="572" height="54" rx="10" fill="#FFFFFF" stroke="${HAIR}"/><rect x="40" y="${85 + i * 70}" width="24" height="24" rx="6" fill="#EEF0F3"/><rect x="80" y="${91 + i * 70}" width="${[200, 150, 230, 170][i]}" height="12" rx="6" fill="#C9CDD3"/><rect x="470" y="${84 + i * 70}" width="104" height="26" rx="13" fill="${['#EEF0FF', '#F4F4F5', '#F5FFD0', '#EEF0FF'][i]}"/>`).join('')))}
    ${layer(1180, 470, card(520, 300, 'Invite teammate', `<rect x="24" y="80" width="472" height="52" rx="10" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>${txt(42, 113, 'name@company.com', 18, '#9AA0A8', FB)}<rect x="24" y="210" width="200" height="50" rx="10" fill="${INK}"/>${txt(124, 242, 'Send invite', 17, '#FFFFFF', FB, 'text-anchor="middle" font-weight="600"')}<rect x="240" y="210" width="120" height="50" rx="10" fill="#F4F4F5"/>${txt(300, 242, 'Cancel', 17, INK, FB, 'text-anchor="middle"')}`))}
    ${[[420, 200, 760, 230], [670, 760, 1180, 470]].map(([a, b2, c, d]) => `<line x1="${a}" y1="${b2}" x2="${c}" y2="${d}" stroke="${BL}" stroke-opacity=".35" stroke-dasharray="3 7"/>`).join('')}
    ${mono(96, 120, 'WEB APPS · DASHBOARDS · PLATFORMS', 20, MUTE)}
    ${anno(pill(110, 1010, 'MACRO SLIDE L → R · 85 MM · SHALLOW DOF'), arrow(300, 980, 700, 900, -30), pill(1260, 1010, 'PUSH THROUGH THE MODAL → S3 · 5.75 s'), arrow(1500, 980, 1460, 760, 30))}`,
    'Frame 2B: the interface separates into layered components: canvas, navigation, project list and an invite modal, with shallow depth of field');
}

// 3A — VR: first-person through a procedural world at dusk
{
  const ridge = (base, amp, step, seed, fill, facets) => {
    const pts = []; for (let x = -60, i = 0; x <= 1990; x += step, i++) pts.push([x, base - amp * (0.35 + 0.65 * rnd(seed + i)) * (0.6 + 0.4 * Math.sin(i * 0.7 + seed))]);
    let s = `<polygon points="${pts.map(p => p.join(',')).join(' ')} 1990,1080 -60,1080" fill="${fill}"/>`;
    if (facets) for (let i = 0; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, base + 70]; s += `<polygon points="${pts[i].join(',')} ${pts[i + 1].join(',')} ${m.join(',')}" fill="#FFFFFF" fill-opacity="${0.02 + rnd(seed + i * 3) * 0.05}"/>`; }
    return s;
  };
  const route = 'M960 1080 C 900 900, 1120 820, 1010 720 S 900 640, 960 600';
  const vx = 40, vy = 30, vw = 1840, vh = 1020, vr = 170;
  const visor = `M0 0 H1920 V1080 H0 Z M${vx + vr} ${vy} H${vx + vw - vr} A${vr} ${vr} 0 0 1 ${vx + vw} ${vy + vr} V${vy + vh - vr} A${vr} ${vr} 0 0 1 ${vx + vw - vr} ${vy + vh} H${vx + vr} A${vr} ${vr} 0 0 1 ${vx} ${vy + vh - vr} V${vy + vr} A${vr} ${vr} 0 0 1 ${vx + vr} ${vy} Z`;
  const panel = (x, y, w, h, t, sk) => `<g transform="translate(${x} ${y}) skewY(${sk})"><rect width="${w}" height="${h}" rx="16" fill="#0E1018" fill-opacity=".72" stroke="#FFFFFF" stroke-opacity=".35"/>${txt(20, 36, t, 19, '#FFFFFF', FH, 'font-weight="600"')}${[0, 1].map(i => `<rect x="20" y="${56 + i * 34}" width="${w - 40}" height="20" rx="6" fill="#FFFFFF" fill-opacity=".1"/><rect x="20" y="${56 + i * 34}" width="${(w - 40) * (0.7 - i * 0.3)}" height="20" rx="6" fill="${i ? '#FFFFFF' : L}" fill-opacity="${i ? '.35' : '.9'}"/>`).join('')}</g>`;
  F['3A'] = frame(`<rect width="1920" height="1080" fill="url(#sky)"/>
    <circle cx="1420" cy="250" r="3" fill="#fff" opacity=".7"/><circle cx="560" cy="180" r="2" fill="#fff" opacity=".5"/><circle cx="1180" cy="120" r="2" fill="#fff" opacity=".5"/>
    ${ridge(640, 170, 70, 3, '#2A2F44', false)}<rect y="560" width="1920" height="140" fill="url(#fogBand)"/>
    ${ridge(720, 200, 90, 11, '#1C2032', true)}<rect y="650" width="1920" height="120" fill="url(#fogBand)"/>
    ${ridge(860, 220, 120, 23, '#11131C', true)}
    <path d="${route}" fill="none" stroke="${L}" stroke-width="26" stroke-opacity=".18" stroke-linecap="round"/><path d="${route}" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="960" cy="560" rx="120" ry="150" fill="url(#limeGlow)" opacity=".5"/><ellipse cx="960" cy="560" rx="70" ry="90" fill="none" stroke="${L}" stroke-width="4"/>
    ${panel(330, 330, 300, 140, 'Waypoint 02', 6)}${panel(1300, 300, 300, 140, 'Layers', -6)}
    <line x1="1700" y1="1080" x2="1420" y2="400" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="3"/><circle cx="1420" cy="400" r="9" fill="${L}"/>
    <path d="${visor}" fill="#000" fill-rule="evenodd"/>
    ${chip(120, 128, '02 / AR·VR')}${head(116, 200, 'AR/VR Solutions', 58, '#FFFFFF')}
    ${anno(pill(1120, 1000, 'FIRST-PERSON TRAVEL ALONG ROUTE · HEAD SWAY ±1.5°', true), arrow(1200, 975, 1000, 820, -30, true), pill(1280, 130, 'DUSK → NIGHT LIGHT SHIFT', true))}`,
    'Frame 3A: first-person view inside a VR headset travelling along a lime route through a procedural low-poly landscape at dusk, with spatial panels and a controller ray', K);
}

// 3B — AR: the world becomes a tabletop model in passthrough
{
  const bx = 900, by = 640;
  let mini = '';
  for (let i = 0; i < 14; i++) { const x = bx - 250 + i * 36 + rnd(i) * 10, h = 40 + rnd(i + 40) * 90; mini += `<polygon points="${x - 40},${by + 10} ${x},${by - h} ${x + 46},${by + 10}" fill="${['#2C3146', '#23283A', '#353B52'][i % 3]}"/><polygon points="${x},${by - h} ${x + 46},${by + 10} ${x + 8},${by + 10}" fill="#FFFFFF" fill-opacity=".06"/>`; }
  const sp = (x, y, w, t, v, sk) => `<g transform="translate(${x} ${y}) skewY(${sk})"><rect width="${w}" height="92" rx="16" fill="#0E1018" fill-opacity=".78" stroke="#FFFFFF" stroke-opacity=".35"/>${mono(20, 34, t, 15, '#FFFFFF', 'fill-opacity=".6"')}${txt(20, 72, v, 24, '#FFFFFF', FH, 'font-weight="600"')}</g>`;
  F['3B'] = frame(`<rect width="1920" height="1080" fill="url(#room)"/>
    <rect x="0" y="0" width="520" height="760" fill="url(#windowLight)"/>
    ${[0, 1, 2, 3].map(i => `<rect x="${60 + i * 110}" y="120" width="90" height="520" fill="#DDE3F2" fill-opacity=".05"/>`).join('')}
    <polygon points="0,760 1920,700 1920,1080 0,1080" fill="url(#desk)"/><line x1="0" y1="760" x2="1920" y2="700" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2"/>
    <g transform="translate(1440 520)"><rect width="360" height="220" rx="10" fill="#0C0D10" stroke="#3A3B40" stroke-width="3"/><rect x="14" y="14" width="332" height="192" rx="4" fill="#15171E"/><polygon points="-30,220 390,220 410,240 -50,240" fill="#2A2B30"/></g>
    <ellipse cx="${bx}" cy="${by + 40}" rx="360" ry="70" fill="url(#contact)"/>
    <ellipse cx="${bx}" cy="${by + 14}" rx="300" ry="62" fill="#26282E" stroke="#4A4C52" stroke-width="2"/>
    ${mini}
    <path d="M${bx - 220} ${by + 8} C ${bx - 120} ${by - 20}, ${bx - 20} ${by + 30}, ${bx + 60} ${by - 4} S ${bx + 200} ${by - 10}, ${bx + 240} ${by + 6}" fill="none" stroke="${L}" stroke-width="4"/>
    <ellipse cx="${bx}" cy="${by + 14}" rx="370" ry="86" fill="none" stroke="${L}" stroke-width="2.5" stroke-dasharray="6 10"/>
    ${[-370, 370].map(dx => `<circle cx="${bx + dx}" cy="${by + 14}" r="7" fill="${L}"/>`).join('')}
    ${sp(330, 330, 250, 'SCALE', '1 : 500', 5)}${sp(1080, 300, 260, 'LIGHTING', 'Dusk', -5)}
    <g transform="translate(1180 470)"><rect width="190" height="64" rx="32" fill="${L}"/>${txt(95, 41, 'Publish', 22, INK, FH, 'text-anchor="middle" font-weight="600"')}</g>
    <rect x="1330" y="600" width="170" height="130" rx="56" fill="#E2DED8" transform="rotate(-18 1415 665)"/>
    <line x1="1360" y1="640" x2="1312" y2="548" stroke="#D9D4CD" stroke-width="40" stroke-linecap="round"/>
    <line x1="1440" y1="610" x2="1326" y2="546" stroke="#E9E6E1" stroke-width="36" stroke-linecap="round"/>
    <circle cx="1318" cy="546" r="34" fill="none" stroke="${L}" stroke-width="3"/>
    ${mono(96, 120, '02 / AR·VR · PASSTHROUGH', 20, '#FFFFFF', 'fill-opacity=".7"')}
    ${anno(pill(110, 1010, 'CAMERA RISES; WORLD SCALES TO TABLETOP · 8.0 s', true), pill(1180, 1010, 'PINCH "PUBLISH" → CARRIED INTO S4', true), arrow(1400, 980, 1300, 560, 40, true))}`,
    'Frame 3B: augmented-reality passthrough of a dim studio desk; the procedural world sits on the desk as a tabletop model with spatial panels, and a hand pinches a lime Publish button', K);
}

// 4A — One shape morphing (warm grey canvas)
{
  const cx = 960, cy = 560;
  F['4A'] = frame(`<rect width="1920" height="1080" fill="#F2F2F0"/>
    ${anno(`<rect x="${cx - 640}" y="${cy - 50}" width="220" height="100" rx="50" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-dasharray="6 8"/>${mono(cx - 590, cy + 90, 'PUBLISH', 14, MUTE)}<circle cx="${cx - 330}" cy="${cy}" r="50" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-dasharray="6 8"/>${mono(cx - 368, cy + 90, 'LOADER', 14, MUTE)}`)}
    <rect x="${cx - 210}" y="${cy - 80}" width="420" height="160" rx="80" fill="${INK}"/>
    <ellipse cx="${cx + 95}" cy="${cy}" rx="88" ry="62" fill="${L}"/>
    <path d="M${cx + 40} ${cy + 140} l0 66 l17 -17 l14 32 l12 -6 l-14 -31 l24 0 z" fill="${INK}" stroke="#fff" stroke-width="3"/>
    ${chip(96, 128, '03 / UI·UX')}${head(92, 200, 'UI/UX Design', 58, INK)}
    ${mono(96, 1000, 'INTERFACES · PROTOTYPES · SYSTEMS', 18, MUTE)}
    ${anno(pill(1180, 128, 'LOCKED OFF · CAMERA REFRAMES PER STATE'), pill(1180, 820, 'DRAG: KNOB STRETCHES, LEADING EDGE FIRST'), arrow(1280, 790, cx + 180, cy + 20, 40),
      `<g transform="translate(556 920)">${['Button', 'Loader', 'Check', 'Toggle', 'Tabs', 'Palette', 'Toast'].map((s, i) => `<rect x="${i * 116}" y="0" width="106" height="34" rx="17" fill="${i === 3 ? INK : '#FFFFFF'}" stroke="${INK}" stroke-opacity=".3"/>${mono(i * 116 + 53, 23, s, 14, i === 3 ? '#FFFFFF' : INK, 'text-anchor="middle"')}`).join('')}</g>`)}`,
    'Frame 4A: on a warm grey canvas, the lime Publish button carried from AR has become one persistent black pill morphing into a toggle as a cursor drags its knob');
}

// 4B — Command palette folds into a toast
{
  const x = 510, y = 230, w = 900, h = 470;
  const res = [['Onboarding flow', 'Prototype'], ['Onboarding emails', 'Design system'], ['Billing settings', 'Screen'], ['Team invites', 'Flow']];
  F['4B'] = frame(`<rect width="1920" height="1080" fill="#F2F2F0"/>
    <g filter="url(#sh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#FFFFFF" stroke="${HAIR}" stroke-width="2"/></g>
    <rect x="${x + 28}" y="${y + 26}" width="${w - 56}" height="68" rx="14" fill="#F7F8FA"/>
    <circle cx="${x + 66}" cy="${y + 58}" r="13" fill="none" stroke="${INK}" stroke-width="3"/><line x1="${x + 76}" y1="${y + 68}" x2="${x + 86}" y2="${y + 78}" stroke="${INK}" stroke-width="3"/>
    ${txt(x + 104, y + 70, 'Onboarding flo', 28, INK, FB)}<rect x="${x + 304}" y="${y + 44}" width="3" height="34" fill="${INK}"/>
    <rect x="${x + w - 110}" y="${y + 42}" width="64" height="34" rx="8" fill="#FFFFFF" stroke="${HAIR}"/>${mono(x + w - 78, y + 66, '⌘K', 16, MUTE, 'text-anchor="middle"')}
    ${res.map(([a, c], i) => { const ry = y + 122 + i * 80; return `<rect x="${x + 20}" y="${ry}" width="${w - 40}" height="68" rx="12" fill="${i === 0 ? '#F4F5F7' : '#FFFFFF'}"/>${i === 0 ? `<rect x="${x + 20}" y="${ry + 14}" width="5" height="40" rx="3" fill="${INK}"/>` : ''}<rect x="${x + 44}" y="${ry + 18}" width="32" height="32" rx="8" fill="${i === 0 ? L : '#EEF0F3'}"/>${txt(x + 96, ry + 42, a, 22, INK, FB, 'font-weight="500"')}${txt(x + w - 150, ry + 42, c, 18, MUTE, FB, 'text-anchor="end"')}${i === 0 ? `<rect x="${x + w - 110}" y="${ry + 18}" width="64" height="32" rx="8" fill="${INK}"/>${mono(x + w - 78, ry + 40, '↵', 18, '#FFFFFF', 'text-anchor="middle"')}` : ''}`; }).join('')}
    <path d="M${x + 560} ${y + 182} l0 56 l14 -14 l12 27 l10 -5 l-12 -26 l20 0 z" fill="${INK}" stroke="#fff" stroke-width="3"/>
    <g transform="translate(${960 - 230} 790)" filter="url(#sh)"><rect width="460" height="84" rx="42" fill="${INK}"/><circle cx="46" cy="42" r="24" fill="${L}"/><path d="M34 42 l9 9 l17 -19" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${txt(88, 51, 'Prototype published', 25, '#FFFFFF', FB, 'font-weight="500"')}</g>
    ${mono(96, 128, '03 / UI·UX', 20, MUTE)}
    ${anno(pill(1440, 340, 'PALETTE FOLDS INTO TOAST · 12.6 s'), arrow(1560, 370, 1240, 790, 60), pill(1300, 1010, 'TOAST CHECK → STAR CENTRE · 13.0 s'))}`,
    'Frame 4B: a command palette with a typed search for Onboarding flow and filtered results; below it a black toast reads Prototype published');
}

// 5A — Convergence: carried objects dock into the star as the light opens
{
  const sr = 210, sx = 960, sy = 520;
  const objs = [
    [-2.4, `<path d="M0 -60 L56 40 L-50 46 Z" fill="#4A4C52" stroke="${L}" stroke-width="3"/>`, 'FACET · S1'],
    [-0.75, `<rect x="-90" y="-58" width="180" height="116" rx="12" fill="#FFFFFF" stroke="${HAIR}" stroke-width="2"/><rect x="-90" y="-58" width="180" height="22" rx="10" fill="#F7F8FA"/><rect x="-74" y="-20" width="90" height="10" rx="5" fill="#C9CDD3"/><rect x="-74" y="2" width="140" height="10" rx="5" fill="#E9EBEF"/><rect x="-74" y="24" width="60" height="18" rx="9" fill="${INK}"/>`, 'UI CARD · S2'],
    [0.95, `<ellipse cx="0" cy="30" rx="86" ry="22" fill="#26282E"/><polygon points="-70,30 -30,-40 6,30" fill="#2C3146"/><polygon points="-20,30 24,-60 66,30" fill="#353B52"/><path d="M-70 26 Q0 6 70 24" stroke="${L}" stroke-width="3" fill="none"/>`, 'TERRAIN · S3'],
    [2.55, `<rect x="-90" y="-34" width="180" height="68" rx="34" fill="${INK}"/><circle cx="52" cy="0" r="24" fill="${L}"/>`, 'TOGGLE · S4'],
  ];
  F['5A'] = frame(`<rect width="1920" height="1080" fill="url(#lightOpen)"/>
    ${objs.map(([a]) => { const [ox, oy] = pt(a, 470, sx, sy), [mx, my] = pt(a + 0.5, 300, sx, sy), [ex, ey] = pt(a, sr * 0.9, sx, sy); return `<path d="M${ox} ${oy} Q${mx} ${my} ${ex} ${ey}" fill="none" stroke="${INK}" stroke-opacity=".28" stroke-width="2"/>`; }).join('')}
    <ellipse cx="${sx}" cy="${sy + sr + 30}" rx="${sr}" ry="26" fill="url(#contactLight)"/>
    ${star(sx, sy, sr * 2, INK)}<use href="#starPath" transform="${starXform(sx, sy, sr / S.r)}" fill="none" stroke="url(#rim)" stroke-width="${3 / (sr / S.r)}"/>
    ${objs.map(([a, g]) => { const [ox, oy] = pt(a, 470, sx, sy); return `<g transform="translate(${ox} ${oy}) rotate(${a * 30})" filter="url(#sh)">${g}</g>`; }).join('')}
    ${anno(...objs.map(([a, , l]) => { const [ox, oy] = pt(a, 470, sx, sy); return pill(ox - 70, oy + (oy < sy ? -90 : 120), l); }), pill(110, 1010, 'CONTINUOUS PULL-BACK · NO CUT'), pill(110, 960, 'LIGHT OPENS GRAPHITE → WHITE'))}`,
    'Frame 5A: a black star at the centre while four objects from earlier scenes, a facet, a UI card, a terrain tile and a toggle, travel inward to dock into its blades; the light opens from graphite to white');
}

// 5B — Final frame
{
  const b = logoBox(960, 470, 1180);
  F['5B'] = frame(`${useLogo('logo', b, `fill="${INK}"`)}
    <rect x="890" y="634" width="140" height="12" fill="${L}"/><rect x="890" y="638" width="140" height="3" fill="${INK}"/>
    ${txt(960, 726, 'ENGINEERING DIGITAL EXPERIENCES.', 32, INK, FH, 'text-anchor="middle" letter-spacing="8.5" font-weight="500"')}
    ${anno(pill(110, 120, 'LOCKED OFF · HOLD 14.0 – 15.0 s (60 FRAMES)'), pill(1290, 1010, 'ORIGINAL LOGO, BLACK ON WHITE'))}`,
    'Final frame: the original Prollyatyp0 logo in black on white with the tagline Engineering Digital Experiences');
}

// ── references (one per scene) ──
const REPO = 'https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/';
const REFS = {
  1: { who: '@Mounnna', file: 'mounnna-497266.md', title: 'Logo wireframe and assembly', kind: 'Short prompt (one paragraph)',
    took: ['Draw the logo as a wireframe first', 'Fly faceted pieces in one by one until they assemble the mark', 'A slow, deliberate reveal'],
    left: ['Low-poly shards that replace the logo: here, facets only fill the real star outline, which is never altered', 'App-icon background and typed-out brand name'] },
  2: { who: '@daniel_haida', file: 'daniel-haida-636937.md', title: 'Premium product film (Taxtello)', kind: 'Full prompt in the creator\'s post',
    took: ['One shot, one idea; the product UI is the hero', 'Object-driven transitions and a push through an interface element', 'Copy of three or four words at most', 'Macro product-shoot camera, overlapping arrivals, cubic-bezier(0.16, 1, 0.3, 1)', 'No invented metrics; demo-safe content only'],
    left: ['Taxtello\'s navy-and-gold palette, typeface and German copy', 'Its product screens and storyline'] },
  3: { who: '@mdaman010 · @petert', file: 'mdaman010-610173.md', file2: 'petert-540960.md', title: 'Procedural 3D world · VR intro', kind: 'One-line summary · creator note only',
    took: ['Procedural terrain built in Three.js, not modelled', 'Atmosphere layers and a dusk-to-night light shift', 'Camera choreography along a route, rendered frame by frame', 'From @petert: a VR product intro in Three.js, and its own note that it "felt strange", so we keep spatial UI restrained'],
    left: ['Any Middle-earth content or landmarks', 'Lava, smoke, water and orchestral score', 'Anything from the Meta VR film itself'] },
  4: { who: '@TheGrootDev', file: 'thegrootdev-966114.md', title: 'Morphing UI, one shape never cut', kind: 'Full structured prompt',
    took: ['One persistent shape morphs through every state', 'A visible cursor drives clicks and drags', 'Tightly damped springs; leading and trailing edges on separate springs', 'Search field → command palette → confirmation toast', 'Warm grey canvas; separate enter and exit timing for labels'],
    left: ['All Pokémon graphics, names, colours and branding', 'The loop back to the opening shape (this film resolves into the logo instead)'] },
  5: { who: '@everestchris6', file: 'everestchris6-399895.md', title: 'High-end motion video system', kind: 'Full structured prompt',
    took: ['One object carries the story; transitions come from objects already on screen', 'Carried objects land on the same pixels on both sides of a cut', 'Speeds always change: arrive slowly, leave fast', 'Product-shoot light: soft key to one side, rim light behind', 'Frame one is a finished picture; the film reads with the sound off'],
    left: ['External kit download and parallel builder agents', 'Generated imagery (every shot is built in code)'] },
};

// ── scenes & shots (60 fps) ──
const scenes = [
  { n: 1, name: 'Opening', t: [0, 2], look: 'Dark graphite studio', lang: 'Construction and assembly', cam: 'Slow orbit + dolly-in', out: 'Facet flip', swatch: ['#0B0B0B', '#2B2C31', L],
    sound: 'Low, soft impact at 0.0; a fine metallic tick as each facet locks on the beat; a short tonal tick on the flip.',
    tech: ['Three.js', 'SVG', 'GSAP'], shots: [
    { id: '1A', t: [0, 0.9], title: 'Wireframe', comp: 'The full logo, star and wordmark, as a thin white wireframe centred on a dark graphite sweep, with construction geometry: blade axes, a radius circle and type baselines.',
      angle: 'Eye level, straight on, 35 mm equivalent.', move: 'Starts a slow 20° orbit to the right with a gentle dolly-in.',
      tech: 'SVG stroke draw-on (dash offset computed per frame), finishing in 54 frames; construction lines fade to 20% as they complete.',
      trans: 'In: frame one is already a finished picture, with the wireframe 30% drawn. No fade from black.', light: 'Single soft key from the left; deep falloff; no fill.', text: 'No headline. A small mono "PROLLYATYP0" bottom-left at 45% white.' },
    { id: '1B', t: [0.9, 2], title: 'Faceted assembly', comp: 'Lit, faceted pieces lock into the real star outline, three still in flight. The wordmark fills from its wireframe behind a lime wipe line.',
      angle: 'Eye level, 10° to the right of centre (from the orbit).', move: 'The orbit continues and settles; the dolly ends 8% closer.',
      tech: 'Three.js: star outline extruded from the traced path; 24 facets clipped to that outline, each landing on a beat-locked spring. Wordmark fill by mask only.',
      trans: 'Out at 1.85 s: facet flip. The centre facet turns 180° and its back face is the corner of the app window in S2.', light: 'Soft key from top-left, lime rim behind the star, soft contact shadow.', text: 'None. The logo is the only typography.' } ] },
  { n: 2, name: 'SaaS Design & Development', t: [2, 6], look: 'Bright product-shoot sweep', lang: 'Macro product film', cam: 'Crane-down, then lateral slide', out: 'Push through the interface', swatch: ['#F7F8FA', '#FFFFFF', BL],
    sound: 'A glass-like tonal tick as the app lands at 2.0; restrained tactile clicks as UI regions settle; soft low-frequency movement under the slide.',
    tech: ['HTML/CSS', 'GSAP'], shots: [
    { id: '2A', t: [2, 4], title: 'Product hero', comp: 'One large, light product interface (a projects workspace) in three-quarter view on a soft grey sweep, filling 70% of the frame. Demo-safe content only: no figures or customer names.',
      angle: 'Three-quarter, 12° above the screen plane.', move: 'Crane down 12° while focus racks from the window edge to the page header.',
      tech: 'UI rebuilt in HTML/CSS (not a screenshot) so each region can move; CSS 3D transforms; regions arrive 2–4 frames apart on cubic-bezier(0.16, 1, 0.3, 1).',
      trans: 'In: the window corner continues the flipped facet\'s motion and position.', light: 'Large soft key from top-left, faint cool fill, soft contact shadow under the window.', text: 'Bottom-left: lime index chip "01 / SAAS" and one line, "SaaS Design & Development", Inter Tight 600.' },
    { id: '2B', t: [4, 6], title: 'Layer separation', comp: 'The interface separates into its layers: canvas, navigation, project list and an invite modal. Faint blue alignment lines show how the layers stack.',
      angle: 'High three-quarter, 35° down.', move: 'Macro lateral slide left to right at 85 mm with shallow depth of field.',
      tech: 'The same HTML layers pulled apart in Z with CSS 3D; depth of field faked with per-layer blur by depth; no spinning cards.',
      trans: 'Out at 5.75 s: the camera pushes through the modal; its glass becomes the headset visor of S3.', light: 'Same key; deeper layers fall slightly darker and softer.', text: 'Top-left: small mono "WEB APPS · DASHBOARDS · PLATFORMS" in grey. No headline.' } ] },
  { n: 3, name: 'AR/VR Solutions', t: [6, 10], look: 'Immersive dusk world, then dim passthrough room', lang: 'Spatial, first-person', cam: 'First-person travel, then rise and scale-out', out: 'Pinch carries the button', swatch: ['#151A2B', '#2C3249', L],
    sound: 'Wide air pad; spatial pings panned to each panel; a soft low swell as the world shrinks; a haptic click on the pinch at 9.6 s.',
    tech: ['Three.js', 'WebGL/GLSL', 'GSAP'], shots: [
    { id: '3A', t: [6, 8], title: 'Inside the headset', comp: 'First-person view through a headset visor: procedural low-poly ridges in atmospheric layers, a lime route to a ring portal, two spatial panels anchored in the world and a controller ray.',
      angle: 'First-person, eye height 1.6 m, level horizon.', move: 'Forward travel along the route with gentle head sway (±1.5°); the only handheld feel in the film.',
      tech: 'Three.js terrain from GLSL noise displacement; height fog and sky gradient in shaders; the camera follows a spline route; panels are HTML positioned from 3D every frame.',
      trans: 'In: the S2 modal fills the frame, then its glass becomes the visor edge.', light: 'Dusk shifting towards night: cool sky light, faint lime emissive route, fog in the valleys.', text: 'Top-left inside the visor: lime chip "02 / AR·VR" and "AR/VR Solutions", Inter Tight 600, white.' },
    { id: '3B', t: [8, 10], title: 'AR tabletop', comp: 'Passthrough AR in a dim studio: the same procedural world is now a tabletop model on a desk, with AR anchor rings, two spatial panels and a hand pinching a lime "Publish" button.',
      angle: 'Seated eye height, 30° down onto the desk.', move: 'The camera rises out of the world as it scales down onto the desk (8.0–8.6 s), then holds.',
      tech: 'Same Three.js scene scaled by 1/500 into a desk scene; anchor rings as GLSL rings; the hand is a simple, stylised mesh.',
      trans: 'Out at 9.6 s: the pinched "Publish" button flattens and slides to frame centre, becoming the shape in S4.', light: 'Window light from the left, practical glow from the laptop, the model lit like a product.', text: 'Mono labels on the spatial panels only ("SCALE 1 : 500", "LIGHTING Dusk").' } ] },
  { n: 4, name: 'UI/UX Design', t: [10, 13], look: 'Warm grey design canvas', lang: 'One shape, never cut', cam: 'Locked off; reframes per state', out: 'Toast morphs into the star', swatch: ['#F2F2F0', INK, L],
    sound: 'Dry, close clicks on every beat (6 states); a toggle snap; a soft keyboard patter under the typed search; a confirmation tone on the toast.',
    tech: ['SVG', 'HTML/CSS'], shots: [
    { id: '4A', t: [10, 11.5], title: 'Morphing component', comp: 'The lime "Publish" pill from 3B, now one persistent black shape at centre, mid-morph from button to toggle while the cursor drags its knob. A state rail (annotation only) shows the sequence.',
      angle: 'Flat, orthographic, straight on.', move: 'Locked-off camera; small punch-in reframes so each state fills the frame.',
      tech: 'SVG/HTML driven by closed-form springs (pure function of time); the knob\'s leading and trailing edges use separate springs; no CSS transitions.',
      trans: 'In: the AR button arrives on the same pixels it left.', light: 'Flat, even studio light; soft 12% shadows only.', text: 'Top-left: lime chip "03 / UI·UX" and "UI/UX Design", Inter Tight 600, ink.' },
    { id: '4B', t: [11.5, 13], title: 'Palette to toast', comp: 'The shape opens into a command palette with a typed search ("Onboarding flo") and filtered results; on Enter it folds into a "Prototype published" toast.',
      angle: 'Flat, straight on.', move: 'Locked off; one reframe as the palette folds down into the toast.',
      tech: 'Same persistent container: search field → palette → toast. Old and new labels have separate exit and enter timing so they never overlap.',
      trans: 'Out at 13.0 s: the toast contracts and its check circle becomes the star\'s centre (shape morph into the logo mark).', light: 'Flat studio light.', text: 'Product copy only, inside the UI. Small grey mono "03 / UI·UX" top-left.' } ] },
  { n: 5, name: 'Closing', t: [13, 15], look: 'Graphite opening to white', lang: 'Convergence and resolve', cam: 'Continuous pull-back', out: 'Hold, then cut to black', swatch: ['#16171B', '#FFFFFF', L],
    sound: 'One soft whoosh as the objects converge; the brand film\'s three-note motif on 13.0 / 13.5 / 14.0; a resolved tone that decays by 15.0.',
    tech: ['Three.js', 'SVG', 'GSAP'], shots: [
    { id: '5A', t: [13, 14], title: 'Convergence', comp: 'The black star at centre. One object from each scene (a facet, a UI card, a terrain tile, the toggle) travels in on a curved path and docks into a blade as the light opens from graphite to white.',
      angle: 'Straight on, 40° above the floor plane.', move: 'One continuous pull-back with no cut; objects arrive slowly and settle.',
      tech: 'Three.js for the carried objects (the same assets as their scenes); the star is the traced logo; light change through the background shader.',
      trans: 'Continuous into the final frame; the wordmark wipes out from behind the star.', light: 'Key light expands from centre until the frame is white; the rim on the star fades as the light opens.', text: 'None until the logo resolves.' },
    { id: '5B', t: [14, 15], title: 'Final frame', comp: 'The original Prollyatyp0 logo in black, centred just above the middle; a short ink rule on a lime band; the tagline below.',
      angle: 'Straight on.', move: 'Locked off. Holds still for 60 frames.',
      tech: 'SVG: the traced logo exactly as supplied. The tagline rises 8 px and fades in, one word at a time, 3 frames apart, by 14.25 s.',
      trans: 'Out: cut to black on frame 900.', light: 'Even white.', text: 'Centred tagline "ENGINEERING DIGITAL EXPERIENCES." in Inter Tight 500, tracked 0.26 em, 74 px below the rule.' } ] },
];

// ── page ──
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tc = s => `${String(Math.floor(s)).padStart(2, '0')}:${String(Math.round((s % 1) * FPS)).padStart(2, '0')}`;
const fr = s => Math.round(s * FPS);
const fRange = t => `f${fr(t[0])}–${fr(t[1]) - 1}`;
const fields = [['Scene', sc => `S${sc.n} · ${esc(sc.name)}`], ['Timestamp', (sc, s) => `${s.t[0].toFixed(2)}–${s.t[1].toFixed(2)} s · ${fRange(s.t)} · ${fr(s.t[1] - s.t[0])} frames`],
  ['GitHub reference', sc => { const r = REFS[sc.n]; return `<a href="${REPO + r.file}">${r.file}</a>${r.file2 ? ` · <a href="${REPO + r.file2}">${r.file2}</a>` : ''} <span class="muted">(${esc(r.who)})</span>`; }],
  ['Composition', (sc, s) => esc(s.comp)], ['Camera angle', (sc, s) => esc(s.angle)], ['Camera movement', (sc, s) => esc(s.move)], ['Lighting', (sc, s) => esc(s.light)],
  ['Animation technique', (sc, s) => esc(s.tech)], ['Transition', (sc, s) => esc(s.trans)], ['Text placement', (sc, s) => esc(s.text)]];
const wideFields = new Set(['Composition', 'Animation technique']);

const timeline = (() => {
  const Wd = 1200, px = Wd / DUR, cols = ['#111111', '#E9ECF2', '#1E2335', '#F2F2F0', '#FFFFFF'], fg = ['#FFFFFF', INK, '#FFFFFF', INK, INK];
  let s = `<svg class="tl" viewBox="0 0 ${Wd} 238" role="img" aria-label="Timeline: five scenes and ten shots over 15 seconds, 900 frames at 60 fps">`;
  scenes.forEach((sc, i) => { const x = sc.t[0] * px, w = (sc.t[1] - sc.t[0]) * px;
    s += `<rect x="${x + 1}" y="0" width="${w - 2}" height="62" rx="8" fill="${cols[i]}" stroke="${HAIR}"/><text x="${x + 12}" y="24" font-size="12" fill="${fg[i]}" fill-opacity=".7" font-family="${FM}">S${sc.n} · ${fRange(sc.t)}</text><text x="${x + 12}" y="48" font-size="15" font-weight="600" fill="${fg[i]}" font-family="${FH}">${esc(sc.name)}</text>`;
    s += `<text x="${x + 6}" y="128" font-size="12" fill="${MUTE}" font-family="${FB}">${esc(sc.cam.length * 6.4 > w ? sc.cam.split(/[;,+]/)[0] : sc.cam)}</text>`;
    sc.shots.forEach(sh => { const sx = sh.t[0] * px, sw = (sh.t[1] - sh.t[0]) * px; s += `<a href="#shot-${sh.id}"><rect x="${sx + 1}" y="72" width="${sw - 2}" height="32" rx="6" fill="#F7F8FA" stroke="${HAIR}"/><text x="${sx + 9}" y="93" font-size="12.5" fill="${INK}" font-family="${FM}">${sh.id}${sw > 120 ? ' ' + esc(sh.title) : ''}</text></a>`; }); });
  [2, 6, 10, 13].forEach(t => { const x = t * px; s += `<path d="M${x} 140 l7 7 l-7 7 l-7 -7 z" fill="${L}" stroke="${INK}" stroke-width="1"/>`; });
  s += `<text x="0" y="172" font-size="11" fill="${MUTE}" font-family="${FM}">◆ SCENE CHANGES, ALL ON THE BEAT</text>`;
  for (let b = 0; b <= 30; b++) { const x = b * 0.5 * px; s += `<line x1="${x}" x2="${x}" y1="186" y2="${b % 2 ? 194 : 202}" stroke="#9CA3AF"/>`; if (b % 2 === 0) { const sec = b / 2, anc = b === 0 ? 'start' : b === 30 ? 'end' : 'middle'; s += `<text x="${x}" y="220" font-size="11.5" fill="${INK}" font-family="${FM}" text-anchor="${anc}">${sec}s</text><text x="${x}" y="235" font-size="10" fill="${MUTE}" font-family="${FM}" text-anchor="${anc}">f${sec * FPS}</text>`; } }
  return s + '</svg>';
})();

const refCards = scenes.map(sc => { const r = REFS[sc.n]; return `
  <article class="ref">
    <div class="ref-top"><span class="tag">S${sc.n} · ${esc(sc.name)}</span><span class="kind">${esc(r.kind)}</span></div>
    <h3>${esc(r.title)}</h3>
    <p class="who">${esc(r.who)} · <a href="${REPO + r.file}">${r.file}</a>${r.file2 ? ` · <a href="${REPO + r.file2}">${r.file2}</a>` : ''}</p>
    <div class="ref-cols"><div><h4>Adapted</h4><ul>${r.took.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h4>Left out</h4><ul>${r.left.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
  </article>`; }).join('');

const lookCards = scenes.map(sc => `
  <div class="look"><div class="look-sw">${sc.swatch.map(c => `<i style="background:${c}"></i>`).join('')}</div>
  <div class="look-b"><span class="tag">S${sc.n} · ${sc.t[0]}–${sc.t[1]} s</span><b>${esc(sc.name)}</b><dl class="mini"><div><dt>Look</dt><dd>${esc(sc.look)}</dd></div><div><dt>Motion</dt><dd>${esc(sc.lang)}</dd></div><div><dt>Camera</dt><dd>${esc(sc.cam)}</dd></div><div><dt>Exit</dt><dd>${esc(sc.out)}</dd></div></dl></div></div>`).join('');

const shotHTML = scenes.map(sc => `
<section class="scene" id="scene-${sc.n}">
  <header class="scene-head">
    <div><span class="tag">Scene ${sc.n}</span><h3>${esc(sc.name)}</h3></div>
    <div class="scene-meta"><span>${sc.t[0].toFixed(2)}–${sc.t[1].toFixed(2)} s</span><span>${fRange(sc.t)}</span><span>Ref: ${esc(REFS[sc.n].who)}</span></div>
  </header>
  ${sc.shots.map(s => `
  <article class="shot" id="shot-${s.id}">
    <figure>${F[s.id]}<figcaption><b>${s.id} · ${esc(s.title)}</b><span>${tc(s.t[0])} → ${tc(s.t[1])} (s:frame)</span></figcaption></figure>
    <dl class="spec">${fields.map(([l, f]) => `<div${wideFields.has(l) ? ' class="wide"' : ''}><dt>${l}</dt><dd>${f(sc, s)}</dd></div>`).join('')}</dl>
  </article>`).join('')}
</section>`).join('');

const transitions = [
  ['1.85 → 2.00', '1B → 2A', 'Facet flip', 'The star\'s centre facet turns 180°; its back face is the app window\'s corner.', 'Facet → window corner'],
  ['4.00', '2A → 2B', 'Layer separation', 'No cut: the window comes apart into its layers as the camera slides.', 'The interface'],
  ['5.75 → 6.00', '2B → 3A', 'Push through the interface', 'The camera pushes through the invite modal; its glass becomes the headset visor.', 'Modal glass → visor'],
  ['8.00 → 8.60', '3A → 3B', 'Miniature scale-out', 'The camera rises out of the world as it shrinks onto a desk.', 'The procedural world'],
  ['9.60 → 10.00', '3B → 4A', 'Pinch carry', 'The pinched "Publish" button flattens and slides to frame centre.', 'Lime button'],
  ['11.50', '4A → 4B', 'Shape morph', 'The same container grows into the command palette.', 'Persistent shape'],
  ['13.00', '4B → 5A', 'Morph into the mark', 'The toast contracts; its check circle becomes the star\'s centre.', 'Check → star'],
  ['13.00 → 14.00', '5A', 'Convergence', 'Objects from every scene dock into the blades as the light opens.', 'Facet, card, terrain, toggle'],
  ['15.00', '5B → end', 'Cut to black', 'A clean cut on frame 900 after a 60-frame hold.', 'Logo'],
];

const techCols = ['Three.js', 'WebGL/GLSL', 'GSAP', 'SVG', 'HTML/CSS'];

const html = `<title>Precision Cut Treatment</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: an agency creative treatment on white. Cover with hero frame → concept → research → direction → timeline → large frames with spec grids → transitions → sound → technology → approval. */
:root{
  color-scheme:light;
  --bg:#FFFFFF; --bg2:#F7F8FA; --fg:#111111; --fg2:#666666; --line:#E5E7EB; --lime:#D7FF00; --blue:#2A3DFF;
  --head:${FH}; --body:${FB}; --mono:${FM};
}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font-family:var(--body);font-size:16px;line-height:1.6;margin:0;-webkit-font-smoothing:antialiased}
.wrap{max-width:1280px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3,h4{font-family:var(--head);font-weight:600;letter-spacing:-.02em;text-wrap:balance;margin:0;color:var(--fg)}
h2{font-size:clamp(30px,4vw,48px);line-height:1.08;margin-bottom:16px}
h3{font-size:clamp(20px,2.2vw,26px);line-height:1.2}
h4{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg2);font-weight:600;margin-bottom:8px;font-family:var(--body)}
p{max-width:68ch;margin:0 0 12px;color:var(--fg)}
a{color:var(--blue);text-decoration-thickness:1px;text-underline-offset:3px}
a:focus-visible,button:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.muted{color:var(--fg2)}
.label{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg2);display:flex;align-items:center;gap:10px;margin-bottom:14px}
.label::before{content:"";width:18px;height:2px;background:var(--fg)}
.tag{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg2)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.topbar{border-bottom:1px solid var(--line);position:sticky;top:env(safe-area-inset-top,0px);background:rgba(255,255,255,.94);backdrop-filter:blur(8px);z-index:5}
.topbar .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-block:12px;flex-wrap:wrap}
.topbar svg{height:22px;width:auto;display:block}
.topbar nav{display:flex;gap:18px;flex-wrap:wrap;font-size:13.5px}
.topbar nav a{color:var(--fg2);text-decoration:none}.topbar nav a:hover{color:var(--fg)}
section.block{padding-block:72px;border-top:1px solid var(--line)}
section.block.alt{background:var(--bg2)}
.cover{padding-block:64px 72px}
.cover-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:32px}
.cover h1{font-size:clamp(52px,9vw,128px);line-height:.92;letter-spacing:-.045em;font-weight:700}
.cover .lede{font-size:clamp(18px,1.8vw,21px);line-height:1.5;max-width:62ch}
.hero-frame svg{width:100%;height:auto;display:block;border-radius:14px;box-shadow:0 30px 80px -30px rgba(17,17,17,.35)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));border:1px solid var(--line);border-radius:12px;overflow:hidden;margin:0}
.facts>div{padding:16px 18px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-width:0;margin-bottom:-1px}
.facts dt{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg2)}
.facts dd{margin:4px 0 0;font-family:var(--head);font-weight:600;font-size:18px;font-variant-numeric:tabular-nums}
.facts dd small{display:block;font:400 12.5px var(--body);color:var(--fg2);margin-top:2px}
.state{display:inline-flex;align-items:center;gap:8px;background:var(--lime);color:var(--fg);font:600 13px var(--body);padding:5px 12px;border-radius:999px}
.state::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--fg)}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:40px}
.two>*{min-width:0}
.statement{font-family:var(--head);font-weight:600;font-size:clamp(26px,3vw,36px);line-height:1.18;letter-spacing:-.02em;max-width:24ch}
.arc{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin-top:36px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.arc>div{padding:16px;border-right:1px solid var(--line);background:var(--bg)}
.arc>div:last-child{border-right:0}
.arc b{display:block;font-family:var(--head);font-size:19px}
.arc span{font-family:var(--mono);font-size:12px;color:var(--fg2)}
@media (max-width:760px){.arc{grid-template-columns:1fr 1fr}.arc>div{border-bottom:1px solid var(--line)}}
.refs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:18px;margin-top:28px}
.ref{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}
.ref-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.ref .kind{font-size:12.5px;color:var(--fg2)}
.ref .who{font-size:14px;color:var(--fg2);margin:6px 0 14px;overflow-wrap:anywhere}
.ref-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:16px}
.ref ul{margin:0;padding-left:18px;font-size:14px}.ref li{margin-bottom:5px}
.looks{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:14px;margin-top:28px}
.look{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--bg);min-width:0}
.look-sw{display:grid;grid-template-columns:2fr 1fr 1fr;height:64px;border-bottom:1px solid var(--line)}.look-sw i{display:block}
.look-b{padding:14px 16px}.look-b b{display:block;font-family:var(--head);font-size:17px;margin:2px 0 8px}
dl.mini{margin:0;display:grid;gap:6px}.mini div{display:grid;grid-template-columns:70px 1fr;gap:8px}.mini dt{font-family:var(--mono);font-size:11px;color:var(--fg2);text-transform:uppercase;padding-top:2px}.mini dd{margin:0;font-size:13.5px}
.palette{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,120px),1fr));gap:12px;margin-top:12px}
.sw{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--bg)}.sw i{display:block;height:56px;border-bottom:1px solid var(--line)}.sw div{padding:8px 10px;font-size:13px}.sw span{display:block;font-family:var(--mono);font-size:11.5px;color:var(--fg2)}
.typo{display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px}
.typo>div{border:1px solid var(--line);border-radius:10px;padding:14px 18px;background:var(--bg)}
.typo .t1{font-family:var(--head);font-weight:600;font-size:30px;letter-spacing:-.02em}.typo .t2{font-family:var(--body);font-size:17px}.typo .t3{font-family:var(--mono);font-size:15px}
.typo small{display:block;margin-top:4px;font-family:var(--mono);font-size:11px;color:var(--fg2);letter-spacing:.06em}
.scroll{overflow-x:auto}
.tl{width:100%;min-width:760px;height:auto;display:block}
.toolbar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:8px 0}
button.toggle{font:500 14px var(--body);background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:999px;padding:8px 16px;cursor:pointer}
button.toggle[aria-pressed="true"]{border-color:var(--fg);background:var(--fg);color:#fff}
body.no-anno .anno{display:none}
.scene{padding-top:40px;margin-top:40px;border-top:1px solid var(--line)}
.scene-head{display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.scene-head h3{font-size:clamp(26px,3vw,36px);margin-top:4px}
.scene-meta{display:flex;gap:8px;flex-wrap:wrap}
.scene-meta span{font-family:var(--mono);font-size:12.5px;border:1px solid var(--line);border-radius:999px;padding:4px 11px;background:var(--bg)}
.shot{margin-bottom:56px;scroll-margin-top:72px}
figure{margin:0}
svg.frame{width:100%;height:auto;display:block;border-radius:12px;border:1px solid var(--line);box-shadow:0 24px 60px -34px rgba(17,17,17,.4);max-width:100%}
figcaption{display:flex;justify-content:space-between;gap:12px;margin-top:12px;font-size:14px;flex-wrap:wrap}
figcaption span{font-family:var(--mono);color:var(--fg2);font-size:13px}
dl.spec{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:24px;margin:20px 0 0;border-top:1px solid var(--line)}
dl.spec>div{padding:12px 0 14px;border-bottom:1px solid var(--line);min-width:0}
dl.spec>div.wide{grid-column:span 3}
dl.spec dt{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg2);margin-bottom:3px}
dl.spec dd{margin:0;font-size:14.5px;overflow-wrap:anywhere}
@media (max-width:860px){dl.spec{grid-template-columns:1fr}dl.spec>div.wide{grid-column:auto}}
table{border-collapse:collapse;width:100%;font-size:14.5px;background:var(--bg)}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg2);font-weight:500;background:var(--bg2)}
td.mono{font-family:var(--mono);font-size:13px;white-space:nowrap}
.tablebox{border:1px solid var(--line);border-radius:12px;overflow:hidden}
.tablebox.scroll{overflow-x:auto}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--fg)}
.approve{border:2px solid var(--fg);border-radius:16px;padding:32px;background:var(--bg)}
.options{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin-top:20px}
.options div{border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--bg2)}
.options b{display:block;font-family:var(--head);font-size:17px;margin-bottom:4px}
.options span{font-size:14px;color:var(--fg2)}
footer{padding-block:32px;color:var(--fg2);font-size:13px;border-top:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
${defs}
<div class="topbar"><div class="wrap">
  <svg viewBox="0 0 ${LW_} ${LH_}" role="img" aria-label="Prollyatyp0"><use href="#logo" x="0" y="0" width="${LW_}" height="${LH_}" fill="${INK}"/></svg>
  <nav aria-label="Sections"><a href="#concept">Concept</a><a href="#research">Research</a><a href="#direction">Direction</a><a href="#timeline">Timeline</a><a href="#storyboard">Storyboard</a><a href="#approval">Approval</a></nav>
</div></div>

<header class="cover"><div class="wrap cover-grid">
  <div>
    <div class="label">Creative treatment · Services film · Storyboard v3</div>
    <h1>Precision Cut</h1>
  </div>
  <p class="lede">A 15-second film for Prollyatyp0's three services. Five scenes, each with its own motion language and its own reference, joined by one idea: the six-bladed star is built, carries us through SaaS, AR/VR and UI/UX, and takes every world back into the logo.</p>
  <div class="hero-frame">${F['1B']}</div>
  <dl class="facts">
    <div><dt>Duration</dt><dd>15.00 s<small>900 frames</small></dd></div>
    <div><dt>Frame rate</dt><dd>60 fps<small>Matches the brand film master (1,800 frames / 30 s)</small></dd></div>
    <div><dt>Format</dt><dd>1920 × 1080<small>16:9</small></dd></div>
    <div><dt>Delivery</dt><dd>H.264 MP4<small>Rendered after approval</small></dd></div>
    <div><dt>Status</dt><dd><span class="state">Awaiting approval</span><small>No animation written</small></dd></div>
  </dl>
</div></header>

<section class="block" id="concept"><div class="wrap">
  <div class="label">Executive concept</div>
  <div class="two">
    <div><p class="statement">The mark is built, does the work, and is whole again.</p></div>
    <div>
      <p>Prollyatyp0 builds software, spaces and interfaces. The film shows that as one continuous act of making. We open on the logo as a technical drawing and assemble it from lit facets. Then it opens into a product interface, an immersive world and a design canvas. In the last two seconds, one object from each world travels back and docks into the star.</p>
      <p>Each scene looks and moves differently: a dark construction studio, a bright product shoot, a first-person VR journey, a flat design canvas and a final convergence. What stays constant is the light (soft key to one side, rim behind), the type, the brand colours, and one carried object at every handoff.</p>
    </div>
  </div>
  <div class="arc" aria-label="Story arc">
    <div><span>S1 · 0–2 s</span><b>Construct</b></div><div><span>S2 · 2–6 s</span><b>Build</b></div><div><span>S3 · 6–10 s</span><b>Immerse</b></div><div><span>S4 · 10–13 s</span><b>Refine</b></div><div><span>S5 · 13–15 s</span><b>Resolve</b></div>
  </div>
</div></section>

<section class="block alt" id="research"><div class="wrap">
  <div class="label">Repository research</div>
  <h2>A different reference for every scene</h2>
  <p>I read each prompt file in <a href="https://github.com/yihui-dev/awesome-opus5-5-videos">yihui-dev/awesome-opus5-5-videos</a> before adapting it. <a href="https://github.com/yassirtelgua/Motion-graphics-prompts">yassirtelgua/Motion-graphics-prompts</a> is an earlier snapshot of the same collection (475 vs 703 prompts, same README and data schema). It holds four of these five files, but not the MDaman010 entry. Both repositories are MIT-licensed. Each reference supplies technique only. No footage, layouts, characters, palettes or music are copied.</p>
  <div class="refs">${refCards}</div>
</div></section>

<section class="block" id="direction"><div class="wrap">
  <div class="label">Visual direction</div>
  <h2>Five looks, one film</h2>
  <p>Each scene has a distinct environment, motion language, camera and exit. No camera move or transition repeats.</p>
  <div class="looks">${lookCards}</div>
  <div class="two" style="margin-top:44px">
    <div><h4>Film palette</h4><div class="palette">
      ${[['Ink', '#111111', 'Logo, type, UI'], ['White', '#FFFFFF', 'S2, S4, final'], ['Graphite', '#16171B', 'S1, S3, S5 open'], ['Lime', L, 'Edges, route, accents'], ['Blue', BL, 'Product UI details']].map(([n, c, u]) => `<div class="sw"><i style="background:${c}"></i><div><b>${n}</b><span>${c}</span>${u}</div></div>`).join('')}
    </div></div>
    <div><h4>Typography</h4><div class="typo">
      <div><div class="t1">UI/UX Design</div><small>INTER TIGHT 600 · TITLES, TAGLINE</small></div>
      <div><div class="t2">Prototype published</div><small>INTER · PRODUCT UI</small></div>
      <div><div class="t3">f600 · 10.00 s · R 322</div><small>JETBRAINS MONO · LABELS, DATA</small></div>
    </div></div>
  </div>
</div></section>

<section class="block alt" id="timeline"><div class="wrap">
  <div class="label">Timeline</div>
  <h2>900 frames at 60 fps</h2>
  <p>120 BPM, so one beat is 0.5 s (30 frames). Every scene change lands on a beat. Select a shot to jump to its frame.</p>
  <div class="scroll" style="margin-top:20px">${timeline}</div>
</div></section>

<section class="block" id="storyboard"><div class="wrap">
  <div class="label">Storyboard</div>
  <h2>Ten frames</h2>
  <div class="toolbar"><button class="toggle" id="annoToggle" type="button" aria-pressed="true">Camera &amp; motion marks: on</button><span class="muted" style="font-size:14px">Labelled pills and dashed arrows describe camera and motion; they don't appear in the film.</span></div>
  ${shotHTML}
</div></section>

<section class="block alt" id="transitions"><div class="wrap">
  <div class="label">Transition breakdown</div>
  <h2>Every handoff comes from an object on screen</h2>
  <div class="tablebox scroll"><table>
    <thead><tr><th>Time (s)</th><th>Shots</th><th>Transition</th><th>What happens</th><th>Carried object</th></tr></thead>
    <tbody>${transitions.map(r => `<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td><b>${esc(r[2])}</b></td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</tbody>
  </table></div>
</div></section>

<section class="block" id="sound"><div class="wrap">
  <div class="label">Sound design</div>
  <h2>Quiet, precise, on the beat</h2>
  <p>An original score at 120 BPM, synthesised and rendered offline like the brand film's, so no third-party audio is needed. One soft whoosh per real scene change; clicks only on real on-screen actions. The film must still read with the sound off.</p>
  <div class="tablebox scroll" style="margin-top:20px"><table>
    <thead><tr><th>Scene</th><th>Time</th><th>Sound</th></tr></thead>
    <tbody>${scenes.map(sc => `<tr><td><b>S${sc.n} · ${esc(sc.name)}</b></td><td class="mono">${sc.t[0]}–${sc.t[1]} s</td><td>${esc(sc.sound)}</td></tr>`).join('')}</tbody>
  </table></div>
</div></section>

<section class="block alt" id="technology"><div class="wrap">
  <div class="label">Technology</div>
  <h2>Only the tools each scene needs</h2>
  <div class="tablebox scroll"><table>
    <thead><tr><th>Scene</th>${techCols.map(t => `<th>${t}</th>`).join('')}</tr></thead>
    <tbody>${scenes.map(sc => `<tr><td><b>S${sc.n} · ${esc(sc.name)}</b></td>${techCols.map(t => `<td>${sc.tech.includes(t) ? '<span class="dot" role="img" aria-label="used"></span>' : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <p style="margin-top:18px">Output for every scene: the brand film's deterministic headless-Chrome frame capture (every frame a pure function of time), 4-subframe motion blur, then FFmpeg to H.264 at 60 fps. The existing 30-second brand film is not modified.</p>
</div></section>

<section class="block" id="approval"><div class="wrap">
  <div class="approve">
    <div class="label">Approval gate</div>
    <h2>Production starts only after your approval</h2>
    <p>No animation code has been written and no video has been rendered. Reply with one of the following:</p>
    <div class="options">
      <div><b>Approve</b><span>Begin production as storyboarded.</span></div>
      <div><b>Change shots</b><span>Name a shot ID, e.g. "3A: daytime instead of dusk".</span></div>
      <div><b>Change style</b><span>Camera, animation, timing or durations.</span></div>
      <div><b>Reject</b><span>Ask for a new concept.</span></div>
    </div>
  </div>
</div></section>

<footer><div class="wrap">Prollyatyp0 · Services Film "Precision Cut" · Storyboard v3 · References used under their MIT licences, with creator credit.</div></footer>
<script>
(function(){
  var b=document.getElementById('annoToggle');
  function set(on){document.body.classList.toggle('no-anno',!on);b.setAttribute('aria-pressed',on);b.textContent='Camera & motion marks: '+(on?'on':'off');try{localStorage.setItem('anno',on?'1':'0')}catch(e){}}
  var init=true;try{init=localStorage.getItem('anno')!=='0'}catch(e){}
  set(init);
  b.addEventListener('click',function(){set(b.getAttribute('aria-pressed')!=='true')});
})();
</script>
`;

fs.writeFileSync(path.join(here, 'storyboard.html'), html);
console.log('storyboard.html written', (html.length / 1024).toFixed(0) + ' KB');
