# Prollyatyp0 · Crystal asterisk — developer handoff

The hero crystal for prollyatyp0-studio, built on the **real Prollyatyp0 asterisk logo**. It replaces the
placeholder asterisk currently on the live site, with the same behaviour as the live hero crystal.

Three.js r169 (loaded from esm.sh, no build step, no other dependencies).

## What's in here

| Path | What it is |
|---|---|
| `crystal-burst-engine.js` | The whole effect: one ES module, one function `mountCrystalBurst(element, options)` |
| `assets/crystal_asterisk.glb` | The model: `Crystal_Whole` (intact) + `Shard_00`…`Shard_19` (fracture pieces). Draco-compressed, 176 KB |
| `assets/poster.jpg` | Still frame for loading / reduced motion |
| `examples/live-site.html` | **Start here.** A full-length mock of the live page (same section classes and heights) with the crystal in a fixed transparent layer: hover + the whole top-to-bottom scroll journey |
| `examples/interactive.html`, `examples/scroll.html` | The two other ways to use it |
| `single-file/crystal-burst-embed.html` | Everything inlined (model too), for a paste-in HTML embed |
| `framer/CrystalBurst.tsx` | Framer code component with property controls |
| `source/crystal_asterisk.blend` | Blender source (scene "Crystal_Storyboard") |

Run the examples from a local server, not by opening the files directly (the model won't load from `file://`):

```bash
python -m http.server 8000
```

Then open http://localhost:8000/examples/live-site.html

## Behaviour (matches the live hero)

`mode: 'interactive'`
- **Idle:** the asterisk rolls slowly like a pinwheel, with gentle yaw and pitch, and floats. Soft grey halo,
  warm light cast below it.
- **Hover** (a ~2.4 s sequence, matched frame by frame to the live site):
  1. a purple liquid streak flows in from the right edge to the crystal while it frosts and cracks,
  2. it explodes: 3 big chunks fly out and small ice chips scatter across the whole screen,
  3. the portal appears as a small purple dot and grows into the big glowing disc with a wavy white rim,
  4. open: the 3 chunks (top, lower left, lower right) overlap the portal's rim, chips drift slowly,
     "Enter the dream" appears at the pointer.
- **Pointer leaves** (250 ms grace, ~0.9 s): the same sequence in reverse; the portal shrinks to a dot and
  flows back out to the right as the chunks rejoin.
- **Click while open:** calls `onEnter()` and fires a `crystalburst:enter` DOM event. Open your case study / dream page there.
- **Touch:** the first tap opens it, a tap on the open portal enters, a tap outside closes it.
- **Scroll, top to bottom** (like the live site, where the crystal is a fixed layer over the whole page):

  | Page section | Crystal |
  |---|---|
  | Hero `.a12-hero` | whole asterisk, centre, rocking in 3D, with an orbiting text ring (project names); hover opens it into 3–4 big chunks around the portal |
  | Hero scrolling away | as soon as scrolling starts it **bursts** into the big chunks around the glowing portal (same burst as hover, with frost flash and shatter sound), ring fades; the chunks join again as About arrives |
  | About `.a12-about` | stays **whole**, glides to the right of the About text at about hero size, gradually frosting white |
  | Disciplines `.a12-disc` | sinks and fades out at the right as the section starts; stays hidden during "Design"; reappears small at the top centre inside the ring (Branding); grows as the camera enters the ring (Ecommerce); biggest and frosted white, drifting slightly right (SaaS/AI); vanishes as the cylinder shrinks at the section end. Timed to the recording: 1 screen of scroll ≈ 2.7 s of the video |
  | Works `.a12-works` | a few chunks and slivers float in and drift across the case studies |
  | Contact / end of page | the pieces gather on the right and join into the asterisk again, with the "Say hello" text ring |

  Matched second by second to a screen recording of the live site, with one deliberate change: in
  Disciplines the live crystal grows past the top edge of the screen; here it stays fully on screen.
  `ringText` / `ringTextEnd` set the two ring texts (or `''` to hide them).

  The stages are keyed to the live page's section classes, so they line up automatically on the real page
  (on any other page they fall back to screen heights). Scroll speed adds spin. Scrolling back up reverses
  everything. Hover/click work whenever the asterisk is whole (hero, and again at the end).
  No piece ever leaves the screen (checked at 60 scroll positions on 1440×900 and 375×812;
  `crystal.offscreen()` reports it). The `'gone'` state, if you use it in custom stages, shrinks pieces
  away where they are instead of throwing them off screen.
  To change the journey, pass `stages` (see Options).
- **Sound** (only after the visitor presses the Sound button): a synthesised glass shatter when it opens and a soft lock
  when it closes. No audio files.

The look: ice glass with thin bright crack veins and frost, rainbow dispersion on the edges, and a gem-cut
ridge along each arm.

## Integrating into the existing hero

```html
<!-- your page stays as it is: hero marquee, caption ring, About, Disciplines, Works… -->

<!-- the crystal: one fixed, full-screen, click-through layer above the page (like the live site's canvas) -->
<div id="crystal" style="position:fixed; inset:0; pointer-events:none; z-index:5"></div>
<script type="module">
  import { mountCrystalBurst } from '/crystal/crystal-burst-engine.js';
  const crystal = await mountCrystalBurst(document.getElementById('crystal'), {
    model: '/crystal/assets/crystal_asterisk.glb',
    mode: 'interactive',
    transparent: true,                       // your page text shows through
    scrollFollow: true,                      // the full top-to-bottom journey (keyed to .a12-* sections)
    dock: 'right',
    reform: true, reformAt: 'right',         // pieces rejoin at the end of the page, beside "Say hello"
    portalMedia: '/media/dream.mp4',         // the current portal video/image
    portalLabel: 'Enter\nthe dream',
    sound: false,                            // you already have a site-wide Sound toggle…
    onOpen:  () => { /* e.g. play your own shatter sound */ },
    onClose: () => {},
    onEnter: () => { /* open the case study */ },
  });
  // crystal.open(), crystal.close(), crystal.destroy()
</script>
```

Remove the current placeholder asterisk and its canvas; this replaces them.

### Options

| Option | Default | Notes |
|---|---|---|
| `model` | (required) | URL or data URI of `crystal_asterisk.glb` |
| `mode` | `'scroll'` | `'interactive'` (live-site behaviour) · `'scroll'` (scroll-scrubbed burst, 400vh) · `'autoplay'` (10 s loop) · `'auto'` (scroll, autoplay inside iframes) |
| `transparent` | `false` | No background, so the page shows through. The glass can't bend DOM content (WebGL can't see the DOM); for refracted text use `headline` |
| `headline` | `''` | Text drawn behind the crystal inside WebGL, so it refracts through the glass |
| `portal`, `portalMedia`, `portalLabel` | `true`, `''`, `'Enter\nthe dream'` | The interactive portal |
| `onOpen`, `onClose`, `onEnter` | – | Callbacks (interactive mode) |
| `scrollFollow` | `true` | Interactive mode: follow the page scroll top to bottom (journey above) |
| `dock` | `'right'` | Where it glides to while breaking: `'right'`, `'left'` or `'center'` (phones always centre-low) |
| `reform`, `reformAt`, `reformY`, `reformLength` | `true`, `'right'`, `0.12`, auto | The end-of-page rejoin: on/off, where (`'center'`/`'right'`/`'left'`, vertical offset as a fraction of the screen), and over how many px before the end |
| `stages` | auto | Custom journey: `[{ at, offset, state, x, y, s }, …]` in page order. `at` = px, a CSS selector (that element's top reaching the screen top), `'top'` or `'end'`; `offset` = extra screen heights; `state` = `'whole'`   `burst` = 0–1 opens it into the hover chunks + portal; `ring` / `ring2` = 0–1 show the hero / end text ring.\| `'loose'` \| `'gone'` \| `'drift'`; `x`/`y` = position as a fraction of the screen; `s` = scale; `frost` = 0–1 white frosting. Example: `[{at:0,state:'whole'},{at:'#about',state:'loose'},{at:'#services',offset:.2,state:'gone'},{at:'#work',state:'drift'},{at:'end',state:'whole'}]` |
| `sound` | `true` | Shows the built-in Sound on/off button |
| `paper`, `ink` | `#E8E6E1`, `#0B0B0B` | Background and text colours |
| `poster` | `''` | Image shown while loading and for reduced-motion visitors |
| `runway`, `caption`, `hint` | `400`, …, `true` | Scroll mode only |

Returned object: `open()`, `close()`, `seek(0..1)` (scroll mode), `refresh()` (re-measure sections after
layout changes; also runs on resize and every ~1.5 s), `stages()` (the resolved journey, for debugging),
`destroy()`, `state`, `benchmark(n)`.

## Behaviour details

- `prefers-reduced-motion`: one still frame, no tumble or burst. No WebGL: the poster image (or nothing).
- Rendering pauses when the element is off-screen. Pixel ratio is capped at 1.5 and drops to 1 automatically
  if frames take more than 25 ms. Fewer chips on phones.
- It works inside containers that clip content (scroll mode pins itself with a transform if CSS `sticky` can't).
- Measured: about 9 ms/frame idle, 11 ms/frame open at 1440×900 ×1.5 on an RTX 3060 laptop
  (`crystal.benchmark(30)` in the console).

## The model

- Built from the traced Prollyatyp0 asterisk (18-point outline, exact proportions). Thick solid bars like the
  live site: walls ±0.2 (0.4 deep, about the arm width) plus a shallow facet ridge (0.34 × distance-from-edge,
  softly rounded), ~0.6 deep at the centre. Rebuild script: `blender -b crystal_asterisk.blend --python thicken_build.py`.
- 20-cell Voronoi fracture; each shard's file position is its home position in the intact logo.
- glTF, Y-up, centred, ~2 units wide, facing +Z, smooth normals with sharp edges split. No materials
  (the engine applies the ice material).
- Draco decoder: https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/
- To change the shape or fracture: open `source/crystal_asterisk.blend`, then re-export with the glTF exporter
  (select Crystal_Root, Crystal_Whole and Shard_*; Apply Modifiers; +Y Up; no materials; Draco on).

Don't stretch or re-proportion the logo.
