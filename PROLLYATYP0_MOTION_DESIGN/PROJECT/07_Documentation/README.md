# Crystal Burst — Prollyatyp0 scroll hero

A scroll-driven 3D section: the Prollyatyp0 asterisk as a gem-cut ice crystal that frosts, cracks,
bursts into 20 shards plus ice chips, drifts, and rebuilds. Scrolling up plays it backwards.
The look matches the crystal on the live Prollyatyp0 site (frost veins, rainbow edges, soft grey halo,
warm light cast on the page, frost-over before the break).

## Project structure

```
PROLLYATYP0_MOTION_DESIGN/
  REFERENCES/                      cloned reference repos (git-ignored)
  PROJECT/
    02_Storyboard/storyboard.html  approved storyboard (frames embedded)
    02_Storyboard/frames/          Blender storyboard renders
    03_Assets/crystal_asterisk.glb crystal + 20 shards (Draco-compressed, 180 KB)
    03_Assets/poster.jpg           still frame for loading / reduced motion
    04_Source_Code/crystal-burst/  crystal-burst-engine.js (the whole effect), index.html preview, assets/, build_exports.py
    04_Source_Code/blender/        crystal_asterisk.blend (scene "Crystal_Storyboard")
    06_Final_Render/developer-handoff/  package for the site developer (+ .zip), see its README.md
```

## Run the preview

```bash
python -m http.server 5178 --directory PROLLYATYP0_MOTION_DESIGN/PROJECT/04_Source_Code/crystal-burst
```

Open http://localhost:5178 and scroll. It must be served over http(s); opening the file directly won't load the model.

## Embed it on the site

See `06_Final_Render/developer-handoff/README.md`: engine, model, examples (live-site interactive mode), single-file embed, Framer component; all
generated from `crystal-burst-engine.js` by `build_exports.py`.
The engine injects its own markup, styles and font; it needs no import map and no GSAP.
Option `headline: 'Your words'` puts big type behind the crystal so it refracts through the glass.

## Scroll timeline (400vh section)

| Scroll | Scene |
|---|---|
| 0–15% | Hero: crystal floats, idle wobble |
| 15–35% | Turn: rotates ~40°, light runs over the facets |
| 33–45% | Frost-over and crack lines, then swap to shards |
| 45–65% | Burst: shards + ice chips fly out, 3% camera push-in |
| 65–85% | Drift: shards frame the page, caption fades in, mouse parallax |
| 85–100% | Rebuild: shards return, whole crystal back |

All motion is a pure function of scroll progress, so it is exactly reversible.

## Behaviour and fallbacks

- `prefers-reduced-motion` or no WebGL → a single still image (`assets/poster.jpg`), no 400vh runway.
- Rendering pauses when the section is off-screen. Pixel ratio capped at 1.5; fewer chips on phones.
- Sound is off by default; the "Sound off/on" button enables synthesised glass sounds (tick, shatter, lock). No audio files.
- Preview/test hook: `crystalBurst.seek(0.55)` in the browser console jumps to a scroll position.

## Editing the model

Open `04_Source_Code/blender/crystal_asterisk.blend`, scene **Crystal_Storyboard**. The crystal is generated
from the traced logo outline (18 points): a gem "roof" rises from the outline to a ridge along each arm,
then a 20-cell Voronoi fracture makes the shards. Re-export with the glTF exporter
(selection: Crystal_Root, Crystal_Whole, Shard_*; Apply Modifiers; Y-up; no materials; Draco on).

## Not done yet

- The final MP4 (1920×1080, 30 fps) of the sequence: it comes after you approve this preview.
