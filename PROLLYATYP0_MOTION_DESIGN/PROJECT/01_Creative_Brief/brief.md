# Prollyatyp0 Services Film: Creative Brief (v3)

Status: **storyboard v3 awaiting approval** (Phase 4). No animation code written, no video rendered. The existing 30 s brand film is not modified.

## Project understanding

| Item | Value |
|---|---|
| Objective | Show Prollyatyp0's three services in one premium, cinematic 15-second film |
| Audience | Founders, product leads and enterprise buyers commissioning SaaS, AR/VR or UI/UX work |
| Duration | 15.00 s = **900 frames at 60 fps** (matches the brand film master: `ffprobe` shows 60/1, 1,800 frames, 30.000 s) |
| Format | 1920 × 1080, 16:9, H.264 MP4 |
| Messaging | SaaS Design & Development · AR/VR Solutions · UI/UX Design · "ENGINEERING DIGITAL EXPERIENCES." |
| Brand | Original traced logo (`prollyatypo-film/src/logo-data.js`), never distorted; brand palette; Inter Tight / Inter / JetBrains Mono |
| Presentation | White agency treatment (#FFFFFF / #F7F8FA, ink #111111, grey #666666, borders #E5E7EB, lime #D7FF00 used sparingly, blue #2A3DFF) |

## Concept: "Precision Cut"

The mark is built, does the work, and is whole again. Story arc: Construct → Build → Immerse → Refine → Resolve.

## Scene treatments and references

| Scene | Time / frames | Look and motion language | Camera | Exit | Reference |
|---|---|---|---|---|---|
| S1 Opening | 0–2 s · f0–119 | Dark graphite studio; logo wireframe, then faceted assembly | Orbit 20° + dolly-in | Facet flip | [mounnna-497266](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/mounnna-497266.md) |
| S2 SaaS | 2–6 s · f120–359 | Bright product-shoot sweep; product UI as hero; layer separation | Crane-down, then macro lateral slide | Push through the modal | [daniel-haida-636937](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/daniel-haida-636937.md) |
| S3 AR/VR | 6–10 s · f360–599 | First-person VR through a procedural dusk world, then AR passthrough tabletop | First-person travel, then rise and scale-out | Pinch carries the button | [mdaman010-610173](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/mdaman010-610173.md), [petert-540960](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/petert-540960.md) |
| S4 UI/UX | 10–13 s · f600–779 | Warm grey canvas; one persistent shape morphing, cursor-driven | Locked off; reframes per state | Toast morphs into the star | [thegrootdev-966114](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/thegrootdev-966114.md) |
| S5 Closing | 13–15 s · f780–899 | Objects from every scene converge into the star; light opens graphite → white | Continuous pull-back | Hold 60 frames, cut | [everestchris6-399895](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/everestchris6-399895.md) |

Notes on the references:
- MDaman010 and Petert are short entries (a one-line summary and a creator note), so they're used for technique and as a cautionary reference only.
- MDaman010's file exists only in `awesome-opus5-5-videos`. `Motion-graphics-prompts` is an older snapshot without it.
- No Pokémon, Middle-earth or Taxtello content, palettes or copy are used. Both repositories are MIT-licensed, and each creator is credited.

Full scene-by-scene frames and specifications: `../02_Storyboard/storyboard.html` (rebuilt by `build-storyboard.mjs`).
