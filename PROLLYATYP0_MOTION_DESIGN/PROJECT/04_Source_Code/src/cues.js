// CUE SHEET: the single source of truth for picture and sound.
// 15.000 s · 60 fps · 900 frames · 120 BPM (beat = 0.5 s = 30 frames).
export const FPS = 60, DURATION = 15, BPM = 120, BEAT = 0.5;
export const W = 1920, H = 1080;

export const SCENES = {
  s1: [0, 2], s2: [2, 6], s3: [6, 10], s4: [10, 13], s5: [13, 15],
};

export const CUE = {
  // S1 — construction
  wireIn: 0.0, wireDone: 0.9, facetsIn: 0.72,
  facetLand: [1.0, 1.25, 1.5, 1.62],    // facet groups lock (last group of three lands late)
  wipe: [1.0, 1.7], flip: [1.72, 2.0],
  // S2 — product film
  appSettle: 2.9, rows: 2.1, titleS2: [2.55, 3.9], craneEnd: 4.0,
  layers: [4.0, 5.55], modal: 4.3, pushModal: [5.6, 6.0],
  // S3 — immersive
  titleS3: [6.35, 7.55], panelsS3: [6.4, 6.55], night: [6.0, 8.0],
  rise: [8.0, 8.35], shrink: [8.35, 8.7], arPanels: [8.75, 8.85], hand: 8.9, pinch: 9.42, carry: [9.6, 10.0],
  // S4 — one shape
  s4: { button: 10.0, click1: 10.3, loader: 10.34, check: 10.75, toggle: 11.0, drag: [11.06, 11.36], tabs: 11.45, tabClick: 11.62,
        search: 11.84, type: [11.9, 12.26], palette: 11.96, enter: 12.45, toast: 12.55, contract: [12.88, 13.0] },
  titleS4: [10.2, 11.5],
  // S5 — convergence & resolve
  starGrow: [13.0, 13.45], dock: [13.4, 13.48, 13.56, 13.62], settle: [13.64, 13.96],
  wordmark: [13.94, 14.16], rule: [14.0, 14.18], tagline: 14.02, holdFrom: 14.3,
  motif: [13.0, 13.5, 14.0],
};
