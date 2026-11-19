// Values one scene computes at init and the next scene reads, so carried objects land on
// exactly the same pixels on both sides of a handoff (deterministic; written once at init).
export const HAND = {
  bladeEdge: null,   // S1 → S2: screen line [x1, y1, x2, y2] of the flipped blade's lime edge at 4.0 s
  horizonY: 520,     // S3 → S2: screen y of the VR horizon at 10.0 s
};
