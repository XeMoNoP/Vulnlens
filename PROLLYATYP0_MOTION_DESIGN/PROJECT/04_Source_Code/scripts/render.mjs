// RENDER PIPELINE — Prollyatyp0 Services Films
//   --comp src (default): 15 s "Precision Cut"   |   --comp services30: 30 s "One mark. Three dimensions."
//   --from A --to B renders only that time range (scene previews); stills/preview/final go to per-comp folders.
//   node scripts/render.mjs --stills 0.5,3,7 [--scale 0.5]   → 05_Preview/stills/*.png + contact sheet
//   node scripts/render.mjs --audio-only                       → 05_Preview/soundtrack.wav
//   node scripts/render.mjs --preview                          → 05_Preview/Prollyatyp0_ServicesFilm_preview_1080p30.mp4
//   node scripts/render.mjs                                    → 06_Final_Render/Prollyatyp0_ServicesFilm_1080p60.mp4
// Frames are captured from headless Chrome (FILM.seek(t) is a pure function of time) and piped
// into FFmpeg. The final master averages 4 sub-frames per frame (180° shutter) for motion blur.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(here, '../..');
const PREVIEW = path.join(PROJECT, '05_Preview'), FINAL = path.join(PROJECT, '06_Final_Render');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const COMP = val('--comp') || 'src';
const CFG = { src: { dur: 15, out: '', name: 'Prollyatyp0_ServicesFilm', pfps: 30 }, services30: { dur: 30, out: 'services30_30s', name: 'Prollyatyp0_ServicesFilm_30s', pfps: 60 } }[COMP];
if (!CFG) throw new Error('unknown --comp ' + COMP);
const DURATION = CFG.dur, FPS = 60;
const FROM = parseFloat(val('--from') || '0'), TO = parseFloat(val('--to') || String(DURATION));
const PDIR = path.join(PREVIEW, CFG.out), FDIR = path.join(FINAL, CFG.out);

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(PROJECT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(PROJECT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const scale = parseFloat(val('--scale') || '1');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-partial-raster', '--disable-gpu-rasterization', '--disable-oop-rasterization', '--disable-features=PaintHolding', '--disable-threaded-animation'] });
const page = await browser.newPage();
page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: scale });
await page.goto(`http://127.0.0.1:${PORT}/04_Source_Code/${COMP}/index.html`, { waitUntil: 'load' });
await page.evaluate(() => FILM.ready);
const cdp = await page.createCDPSession();

async function grab(t) {
  // Paint an empty stage first, then seek and wait two animation frames, so no stale paint
  // from an earlier frame can survive into this one (Chrome reuses SVG paint between frames).
  await page.evaluate((t) => new Promise(r => {
    const st = document.getElementById('stage');
    st.style.visibility = 'hidden';
    requestAnimationFrame(() => { FILM.seek(t); st.style.visibility = ''; requestAnimationFrame(() => requestAnimationFrame(r)); });
  }), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: false, captureBeyondViewport: false, fromSurface: true });
  return Buffer.from(data, 'base64');
}

async function renderAudio(dir) {
  const b64 = await page.evaluate(async () => {
    const mod = await import('./audio.js');
    const buf = await mod.renderScore();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    const g = 0.891 / pk; // peak-normalise to -1 dBFS
    const pcm = new Int16Array(n * 2);
    for (let i = 0; i < n; i++) { pcm[i * 2] = Math.max(-1, Math.min(1, L[i] * g)) * 32767; pcm[i * 2 + 1] = Math.max(-1, Math.min(1, R[i] * g)) * 32767; }
    let s = ''; const u8 = new Uint8Array(pcm.buffer);
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { data: btoa(s), rate: buf.sampleRate };
  });
  const data = Buffer.from(b64.data, 'base64');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(b64.rate, 24);
  hdr.writeUInt32LE(b64.rate * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'soundtrack.wav');
  fs.writeFileSync(file, Buffer.concat([hdr, data]));
  console.log('audio →', file, (data.length / 4 / b64.rate).toFixed(3) + ' s');
  return file;
}

function ffmpeg(argv) {
  const ff = spawn('ffmpeg', argv, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  return { ff, done };
}

async function renderVideo({ fps, sub, file, crf, preset, wav }) {
  const f0 = Math.round(FROM * fps), f1 = Math.round(TO * fps), rate = fps * sub, len = (f1 - f0) / fps;
  const vf = sub > 1 ? [`tmix=frames=${sub}:weights=${Array(sub).fill(1).join(' ')}`, `select='eq(mod(n\\,${sub})\\,${sub - 1})'`, `setpts=N/(${fps}*TB)`].join(',') : 'null';
  const { ff, done } = ffmpeg(['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(rate), '-c:v', 'png', '-i', '-', '-ss', String(FROM), '-i', wav,
    '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-t', String(len), '-movflags', '+faststart', file]);
  const shutter = 0.5 / fps, t0 = Date.now();
  for (let i = f0; i < f1; i++) {
    for (let k = 0; k < sub; k++) {
      const png = await grab(i / fps + (sub > 1 ? shutter * k / sub : 0));
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (i % fps === 0) { const el = (Date.now() - t0) / 1000; console.log(`frame ${i}/${f1}  ${el.toFixed(0)} s elapsed  eta ${((el / (i - f0 + 1)) * (f1 - i)).toFixed(0)} s`); }
  }
  ff.stdin.end(); await done;
  console.log('video →', file);
}

try {
  const tag = (FROM > 0 || TO < DURATION) ? `_${FROM.toFixed(2)}-${TO.toFixed(2)}` : '';
  if (has('--audio-only')) await renderAudio(PDIR);
  else if (has('--stills')) {
    const dir = path.join(PDIR, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    const times = (val('--stills') || '').split(',').filter(Boolean).map(Number);
    let i = 0;
    for (const t of times) fs.writeFileSync(path.join(dir, `s_${String(i++).padStart(2, '0')}_${t.toFixed(2)}.png`), await grab(t));
    // contact sheet
    const list = fs.readdirSync(dir).filter(f => f.startsWith('s_')).sort();
    const cols = 4, rows = Math.ceil(list.length / cols);
    fs.mkdirSync(path.join(dir, 'seq'), { recursive: true });
    list.forEach((f, j) => fs.copyFileSync(path.join(dir, f), path.join(dir, 'seq', `${String(j).padStart(3, '0')}.png`)));
    const { done } = ffmpeg(['-y', '-v', 'error', '-i', path.join(dir, 'seq', '%03d.png'), '-vf', `scale=480:-1,tile=${cols}x${rows}:padding=6:color=gray`, '-frames:v', '1', path.join(dir, 'contact.png')]);
    await done; fs.rmSync(path.join(dir, 'seq'), { recursive: true });
    console.log('stills:', list.length, '→', dir);
  } else if (has('--preview')) {
    const wav = await renderAudio(PDIR);
    await renderVideo({ fps: CFG.pfps, sub: 1, file: path.join(PDIR, `${CFG.name}_preview_1080p${CFG.pfps}${tag}.mp4`), crf: 18, preset: 'veryfast', wav });
  } else {
    fs.mkdirSync(FDIR, { recursive: true });
    const wav = await renderAudio(FDIR);
    await renderVideo({ fps: FPS, sub: parseInt(val('--sub') || '4'), file: path.join(FDIR, `${CFG.name}_1080p60${tag}.mp4`), crf: 14, preset: 'slow', wav });
  }
} finally {
  await browser.close();
  server.close();
}
