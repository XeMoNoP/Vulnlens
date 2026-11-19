# Prollyatyp0 Services Film: "Precision Cut"

15.00 s · 1920 × 1080 · 60 fps (900 frames) · H.264 MP4 · original synthesised score.
Status: **preview awaiting approval** (Phase 6). The final master has not been rendered yet.

## Project structure

```
PROLLYATYP0_MOTION_DESIGN/
  REFERENCES/                 cloned reference repos (git-ignored, read-only)
  PROJECT/
    01_Creative_Brief/        brief.md
    02_Storyboard/            storyboard.html (approved v3) + build-storyboard.mjs
    03_Assets/                logo/ (official traced logo, untouched), fonts/ (OFL)
    04_Source_Code/
      src/index.html          stage: DOM layers + one WebGL canvas
      src/film.js             FILM.seek(t): renders exactly the frame at time t
      src/cues.js             cue sheet: the single source of truth for picture and sound
      src/lib.js              easing (cubic-bezier 0.16,1,0.3,1), closed-form springs, noise
      src/logo3d.js           official logo paths → three.js shapes (no redrawing)
      src/s1.js … s5.js       one module per scene
      src/audio.js            Web Audio score, rendered offline
      scripts/render.mjs      headless Chrome capture → FFmpeg
    05_Preview/               preview MP4, soundtrack.wav, QC stills/contact sheets
    06_Final_Render/          final master (after preview approval)
    07_Documentation/         this file
```

## Scenes and references

| Scene | Time | Built with | Reference |
|---|---|---|---|
| S1 Opening | 0–2 s | three.js (Line2 wireframe, 24 lit facet prisms from the triangulated star, clipping-plane wipe) | @Mounnna |
| S2 SaaS | 2–6 s | HTML/CSS 3D + GSAP timeline seeked per frame | @daniel_haida |
| S3 AR/VR | 6–10 s | three.js procedural terrain, GLSL sky (dusk → night) and disc clip, spline camera | @mdaman010, @petert |
| S4 UI/UX | 10–13 s | HTML/SVG, one persistent element driven by summed closed-form springs | @TheGrootDev |
| S5 Closing | 13–15 s | SVG with the official logo paths, DOM carried objects | @everestchris6 |

## How to run

```bash
cd PROLLYATYP0_MOTION_DESIGN/PROJECT/04_Source_Code
npm install
node scripts/render.mjs --stills 1.4,7.0,14.8   # QC stills + contact sheet → 05_Preview/stills
node scripts/render.mjs --preview                # 1080p30 preview, no motion blur → 05_Preview
node scripts/render.mjs                          # final 1080p60 master, 4 sub-frames/frame → 06_Final_Render
```

To scrub interactively, serve the `PROJECT` folder (for example `npx http-server PROJECT`) and open `/04_Source_Code/src/index.html?t=7.5`. Arrow keys step one frame, Shift+arrow steps one second, and Space plays.

Requirements: Node 20+, FFmpeg on PATH, Chrome or Edge installed.

## Rendering notes

- Every frame is a pure function of time: no timers and no real-time animation, so the same `t` always gives the same pixels.
- Chrome runs with GPU rasterisation off. With it on, Skia's path cache occasionally redrew the large star path at a stale position (a "ghost star" near 13.87 s in sequential renders).
- Audio is loudness-normalised at mux time (`loudnorm I=-16 TP=-1.5`). The preview measures −14.7 LUFS integrated with a −1.5 dBFS peak.

## Differences from the approved storyboard

- **S5:** built in SVG/DOM rather than three.js, so the star and wordmark are the exact traced logo paths throughout the settle.
- **S3:** terrain height is generated on the CPU (deterministic fBm). The sky, fog shift and disc clip are GLSL.
- **5B:** the final frame is completely still from about 14.3 s, which is roughly 40 frames rather than the storyboarded 60. The tagline finishes at about 14.3 s instead of 14.25 s.
