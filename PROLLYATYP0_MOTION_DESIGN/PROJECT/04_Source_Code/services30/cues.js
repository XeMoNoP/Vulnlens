// CUE SHEET — Prollyatyp0 Services Film, 30 s ("One mark. Three dimensions.")
// 30.000 s · 60 fps · 1,800 frames · 120 BPM (beat = 0.5 s = 30 frames).
// The single source of truth for picture and sound. Scene changes land on beats.
export const FPS = 60, DURATION = 30, BPM = 120, BEAT = 0.5;

export const SC = { s1: [0, 4], s2: [4, 10], s3: [10, 18], s4: [18, 24], s5: [24, 30] };

export const CUE = {
  // S1 — opening: readable star from frame 0, blades settle, one blade flips
  lines: [0, 1.2], blades: [0, 1.6], flip: [2.05, 4.0], flipLift: [1.85, 2.15], cut1: 4.0,
  // S2 — SaaS product film
  swing: [4.0, 4.75], ui: 4.35, chart: [4.55, 5.5], titleS2: [4.9, 6.75], cursorS2: [5.55, 6.4], range: 6.05,
  push2: [6.2, 7.0], layers: [7.0, 8.4], lift: [8.9, 9.7], horizon: [9.6, 10.0],
  // S3 — VR world, then AR tabletop
  titleS3: [10.45, 12.6], panels: [10.8, 11.1], crane: [10.0, 14.0],
  rise: [14.0, 14.4], shrink: [14.4, 14.9], visorOff: [14.15, 14.55], arUI: [15.0, 15.25],
  reticle: [15.25, 15.65], select: 15.75, rotate: [16.05, 16.95], carry: [17.35, 18.0],
  // S4 — UI/UX
  s4: { fill: 18.0, button: 18.3, click: 18.95, toggle: 19.05, drag: [19.3, 19.75], card: 20.1, system: [21.0, 21.8], inward: [23.0, 24.0] },
  titleS4: [18.35, 20.9],
  // S5 — brand resolution
  dock: [24.55, 24.75, 24.95, 25.15, 25.35, 25.55], dim: [24.0, 24.6], open: [26.4, 27.9],
  settle: [27.2, 27.7], swap: 27.92, wordmark: [27.72, 28.2], rule: [27.95, 28.25], tagline: 28.0, hold: 28.5,
  motif: [24.5, 25.5, 26.5], resolve: 28.5,
};
