# QC / revision ledger: Services Film 30 s ("One mark. Three dimensions.")

Composition: `04_Source_Code/services30/`. Outputs: `05_Preview/services30_30s/`. The 15 s film and the 30 s brand film are untouched.

| # | Issue | Time | Correction | Verification |
|---|---|---|---|---|
| 1 | Blades rendered nearly black against the wall; only bevels visible | 0–4 s, 24–28 s | Lighter, less metallic graphite; darker wall; soft light pool behind the star; resting tilt per blade for distinct facet highlights | Stills at 0, 1.8, 2.6 s: blades read as lit, bevelled solids |
| 2 | Concern that the blade split didn't match the logo | 27.7–27.93 s | Overlaid the 3D star (red) and the SVG logo star (blue) at the swap | Overlap is exact apart from 1–2 px bevel/perspective edges |
| 3 | Flip end pose: mapping the chunky tip edge onto a 1,620 px line produced a full-frame lime band | 3.6–4.0 s | The tip edge now comes from the convex hull of the outer corners. The lime edge is a thin front-face line landing on a 400 px screen line, with the face tilting toward camera. S2's bezel starts on that same line at 0.25 scale | Still at 3.95 s: thin lime edge at the top, blade body below; still at 4.05 s: dashboard continues from it |
| 4 | Terrain read as orange "Mars" rock | 10–14 s | Cooler sun, rim strength 0.9 → 0.5 and limited to higher ridges | Still at 11.0 s: cool dusk, readable ridges, landmarks and panels |
| 5 | AR camera too top-down: no wall or room context, anchor ring too thick, card clipped | 14.9–18 s | Lower, further desk camera; thinner ring (1.6 units); cooler wall, oak desk | Stills at 15.8 and 16.8 s: wall, desk, laptop and plinth visible; brackets and scale marker track |
| 6 | Duplicate identifier `to` in S4 broke module load | — | Renamed the colour variables | Page loads; 32 stills rendered |
| 7 | Dashboard jumped away from the blade edge line | 4.0–4.1 s | Swing easing changed to a soft start | Superseded by #C2 |

## Client direction (revision 2)
- **White background in the full video.** The S1 studio wall, S2 backdrop, S3 VR sky, fog and ranges (high-key) and the S3 room are now white; S4 and S5 were already white. On white, lime lines got an ink core, VR panels became white glass and the visor a light frame.
- **"The intro asterisk can be better."** Satin-black lacquer with clearcoat, 12-unit bevels in 5 segments, VSM soft shadows, tighter blade seams.

## Independent critic, round 1 (preview v1): 5/10, ONE MORE PASS

| # | Critic finding | Correction (revision 2) |
|---|---|---|
| C1 | SaaS→VR grey fade, hard cut, leftover axis labels, popping headset mask, two lime lines | No fades (UI layers slide out of frame); axis labels hidden at the lift; visor eases in over 0.7 s; the 3D route stays hidden until the S2 line has morphed into it (one line). With the white background there is no colour change at the cut |
| C2 | Facet match cut fails: stops, dark→white cut to a tiny card, ribbed bevel | The flip keeps moving through 4.0 s. Its thickness flattens to 15% and its lacquer turns into the white product surface. The lime bezel draws along its leading edge on the exact line where the dashboard bezel starts, at 0.56 scale instead of 0.25 |
| C3 | AR→canvas fade to white | The carried ring reaches the S4 component size, then the white canvas is revealed from inside the ring (clip-path, no opacity) |
| C4 | VR→AR crossfade, laptop half-faded | Height-based clay wipe on the mesh (top to bottom) |
| C5 | Screens never fold into the mark | A solid hub star grows from the 4B hub; each blade folds up in place over its screen; then one solid star mesh. The finish blends lacquer→ink across the 0.5 s settle (no hard swap) |
| C6 | AR defects: route on the desk, prop cut off left | Route clipped to the model square; mug and notebook moved inside the frame; card kept in frame |
| C7 | VR dark silhouettes, small panels, title clashing with monoliths | High-key world; panels ~1.4× larger and clamped inside the frame; monoliths moved away from the route and lowered |
| C8 | Frozen 22.0–22.98 s; near-still opening | Prototype-link pulses travel along every connector during the hold; wider opening orbit and a slowly turning construction ring |
| C9 | 4B layout: clipped tablet, phone touching the caption, mixed connectors | Tablet 470 px tall; phone raised; caption moved to the top; one straight connector style with end dots; screens travel in from the hub along their axes |
| C10 | Opening material and lines weak | Lacquer star; lime highlighter ring plus ink construction; labels 22 px |
| C11 | "3D star may not be the exact logo" | Verified by overlay (red/blue) at the lockup frame: silhouettes coincide. S5 now uses one solid extrusion of the exact path, so there are no internal seams |
| C12 | 9:16 safe area | S2 title stacked and centred (≈560 px wide); tagline 25 px / 6 px tracking (≈600 px) |
| C13 | UI/UX component modest | Whole 4A component scaled 1.35×; morphs start earlier (no static dot) |
| C14 | Striped rule, letter-by-letter wordmark | One solid lime rule; the wordmark arrives as a single masked slide from behind the star |
| C15 | Demo hygiene | Fictional `app.workspace.example` domain; neutral product glyph instead of the Prollyatyp0 mark |

Audio, measured only (not listened): −15.3 LUFS integrated, −1.4 dBFS true peak, no clipping.

## Independent critic, round 2 (preview v3): 6.5/10, ONE MORE PASS

Preview v3 checks: 1,800 frames at 60 fps, 30.000 s; `freezedetect` finds only the final hold (from 28.2 s); −15.3 LUFS, −1.4 dBTP.

**Round-1 verification:**
- **Fixed:** C3 (ring iris), C8 (freezes), C11 (logo exact), C12 (safe titles), C13 (component size), C14 (rule and wordmark), C15 (demo hygiene).
- **Partly fixed:** C1, C2, C4, C5, C6, C7, C9, C10.

**Open items for the next pass, ranked:**
1. **VR and AR look (10–17.7 s):** flat-shaded low-poly terrain, clay props without contact shadows, jagged model edge, ghost VR mountains visible on the AR wall. Use smooth or subdivided terrain, AO/IBL, contact shadows, and remove the leftover VR layer.
2. **VR→AR pops (14.38→14.40 s, 14.88→14.90 s):** the terrain tile snaps and the room crossfades. Make it one continuous pull-back, build the base up, and reveal the room by camera move.
3. **VR panels (11–14 s):** monoliths show through the panels and the left panel is cropped. Use an opaque frosted backing, render panels in front, keep them 80 px inside the mask, and smooth the route kink near the ring.
4. **SaaS→VR (9.2–10.4 s):** the line crosses the stat text; a ghost card holds and double-exposes; the line lands about 90 px below the real horizon and has a black core. Fade the card with the layers, land the line on the true horizon, solid lime.
5. **Facet flip (3.0–4.6 s):** the white surface looks crumpled, there's a stray lime pixel, the facet's mass vanishes at the cut, and the dashboard is empty until 4.6 s. Keep the facet rigid graphite with a light sweep, match its face to the dashboard rectangle, and have content in place before frame 240.
6. **Fold (24.4–25.8 s):** screens are swallowed by the growing star and a card passes through the blades. Move each screen along its axis onto its own blade, in sequence.
7. **4B layout:** the header collides with the CARD tile, the phone overlaps the desktop, connector dots are inconsistent, and the hub is small and flat.
8. **AR tracking:** brackets drift off the corners after the rotation, the scale label overlaps, the left prop is cut off, and the mug has no contact shadow.
9. **Opening lines:** lines are drawn over the blades, the lime ring has a black dashed core, and the bevels show chrome streaks.
10. **Backgrounds:** the tan desk and grey resolve and VR haze go against "white throughout". Use a white or pale desk and push the backgrounds to white.
11. **Tagline:** about 18 px cap height; make it 30–40% larger.
12. **Small holds:** 18.10–18.27 s and 20.85–20.97 s; the iris is a flat disc.

**Clearly met:**
- Delivery format, and a 103-frame still final hold.
- Exact logo and tagline; the star is 40–46% of frame height with no dark lead-in.
- Readable SaaS dashboard marked as demo data, with a state change.
- AR state change.
- Large UI/UX morph.
- Safe titles.
- No dark frames or particles.

Status: preview only; the final MP4 isn't exported yet (awaiting client approval).
