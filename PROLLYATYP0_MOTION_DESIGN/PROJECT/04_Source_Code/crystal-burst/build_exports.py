"""Build the website exports of Crystal Burst from crystal-burst-engine.js.

Output: ../../06_Final_Render/developer-handoff/  (+ a .zip of it next to the folder)
  crystal-burst-engine.js        the whole effect (ES module)
  assets/                        crystal_asterisk.glb (Draco), poster.jpg
  examples/                      live-site.html (fixed layer: hover + scroll like the live site), interactive.html, scroll.html
  single-file/crystal-burst-embed.html   everything inlined, for paste-in HTML embeds
  framer/CrystalBurst.tsx        Framer code component
  source/crystal_asterisk.blend  Blender source
  README.md                      developer guide

Run:  python build_exports.py
"""
import base64
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parent.parent
OUT = PROJECT / "06_Final_Render" / "developer-handoff"
ENGINE = (HERE / "crystal-burst-engine.js").read_text(encoding="utf-8")
GLB = base64.b64encode((HERE / "assets" / "crystal_asterisk.glb").read_bytes()).decode()
POSTER = base64.b64encode((HERE / "assets" / "poster.jpg").read_bytes()).decode()
MODEL_URI = f"data:model/gltf-binary;base64,{GLB}"
POSTER_URI = f"data:image/jpeg;base64,{POSTER}"
ENGINE_INLINE = ENGINE.replace("export async function mountCrystalBurst", "async function mountCrystalBurst", 1)
assert "async function mountCrystalBurst" in ENGINE_INLINE
# pasted embeds may have no <meta charset>: write every non-ASCII character as a \uXXXX escape
ENGINE_INLINE = "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in ENGINE_INLINE)

if OUT.exists():
    shutil.rmtree(OUT)
for d in ("assets", "examples", "single-file", "framer", "source"):
    (OUT / d).mkdir(parents=True)

shutil.copy(HERE / "crystal-burst-engine.js", OUT / "crystal-burst-engine.js")
shutil.copy(HERE / "assets" / "crystal_asterisk.glb", OUT / "assets" / "crystal_asterisk.glb")
shutil.copy(HERE / "assets" / "poster.jpg", OUT / "assets" / "poster.jpg")
blend = HERE.parent / "blender" / "crystal_asterisk.blend"
if blend.exists():
    shutil.copy(blend, OUT / "source" / "crystal_asterisk.blend")
README = HERE / "DEVELOPER_README.md"
shutil.copy(README, OUT / "README.md")

# ---------- examples (import the engine from ../) ----------
def page(title, body_css, body_html, opts):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;800&display=swap" rel="stylesheet">
<style>
  html, body {{ margin: 0; background: #E8E6E1; overflow-x: hidden; }}
{body_css}
</style>
</head>
<body>
{body_html}
<script type="module">
  import {{ mountCrystalBurst }} from '../crystal-burst-engine.js';
  window.crystalBurst = await mountCrystalBurst(document.getElementById('crystal'), {{
{opts}
  }});
</script>
</body>
</html>
"""

# the live-site setup: tested page from the source folder, with paths pointed at the package layout
live = (HERE / "hero-overlay.html").read_text(encoding="utf-8")
live = re.sub(r"\./crystal-burst-engine\.js(\?v=\d+)?", "../crystal-burst-engine.js", live)
live = live.replace("'assets/crystal_asterisk.glb'", "'../assets/crystal_asterisk.glb'")
assert "../crystal-burst-engine.js" in live and "../assets/crystal_asterisk.glb" in live
(OUT / "examples" / "live-site.html").write_text(live, encoding="utf-8")

(OUT / "examples" / "interactive.html").write_text(page(
    "Crystal Burst · interactive",
    "  #crystal { height: 100vh; height: 100svh; }",
    '<div id="crystal"></div>',
    """    model: '../assets/crystal_asterisk.glb',
    poster: '../assets/poster.jpg',
    mode: 'interactive',
    onEnter: () => alert('enter: open the case study here'),"""), encoding="utf-8")

(OUT / "examples" / "scroll.html").write_text(page(
    "Crystal Burst · scroll",
    "  .after { height: 80vh; display: grid; place-items: center; font: 500 12px system-ui; letter-spacing: .14em; text-transform: uppercase; color: #6F6C66; }",
    '<div id="crystal"></div>\n<div class="after">Next section</div>',
    """    model: '../assets/crystal_asterisk.glb',
    poster: '../assets/poster.jpg',
    mode: 'scroll',
    runway: 400,"""), encoding="utf-8")

# ---------- single-file embed ----------
embed = f"""<!-- Prollyatyp0 · Crystal Burst · self-contained embed (model and code are all inside).
     Paste it once anywhere in the page (e.g. end of <body>). It adds a fixed, full-screen, click-through
     crystal layer that behaves like the live site: hover to open, scroll to glide right, break and fly off. -->
<div id="prollyatyp0-crystal-burst" style="position:fixed;inset:0;pointer-events:none;z-index:5"></div>
<script type="module">
{ENGINE_INLINE}
mountCrystalBurst(document.getElementById('prollyatyp0-crystal-burst'), {{
  model: "{MODEL_URI}",
  mode: 'interactive',   // 'interactive' (live-site behaviour) | 'scroll' | 'autoplay' | 'auto'
  transparent: true,     // the page shows through
  scrollFollow: true,    // the live site's journey: whole in the hero → whole, docked right by About →
                         // frosted above the Disciplines cylinder → breaks and drifts through Works →
                         // rejoins beside "Say hello" (always fully on screen)
  dock: 'right',
  reform: true,          // false = pieces keep drifting at the end
  reformAt: 'right',
  sound: false,
  portalLabel: 'Enter\\nthe dream',
  onEnter: () => {{}},     // open the case study here
}});
</script>
"""
embed = embed.replace("·", "-").replace("→", "->").replace("—", "-")   # ASCII-only file
assert all(ord(c) < 128 for c in embed), "embed must be ASCII-only"
(OUT / "single-file" / "crystal-burst-embed.html").write_text(embed, encoding="utf-8")

# ---------- Framer code component ----------
framer = f"""// @ts-nocheck
// Prollyatyp0 · Crystal Burst — Framer code component
// Assets → Code → + → New component file "CrystalBurst", replace everything with this file, drag onto the page.
// Interactive (live-site behaviour): put it in a Fixed position layer, 100vw × 100vh, above the page, so it stays
// on screen while scrolling (whole in the hero → docked right by About → frosted above the cylinder → breaks and drifts through Works →
// rejoin at the end), and turn on Transparent.
// Scroll mode: height Fit (it makes its own runway).
import {{ useEffect, useRef }} from "react"
import {{ addPropertyControls, ControlType, RenderTarget }} from "framer"

{ENGINE_INLINE}

const MODEL = "{MODEL_URI}"
const POSTER = "{POSTER_URI}"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function CrystalBurst(props) {{
    const ref = useRef(null)
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const mode = onCanvas && props.mode === "scroll" ? "autoplay" : props.mode
    useEffect(() => {{
        if (!ref.current) return
        let api = null
        let dead = false
        mountCrystalBurst(ref.current, {{
            model: props.model || MODEL,
            poster: POSTER,
            mode,
            runway: props.runway,
            transparent: props.transparent,
            headline: props.headline,
            caption: props.caption,
            hint: props.hint,
            sound: props.sound && !onCanvas,
            paper: props.paper,
            ink: props.ink,
            portalMedia: props.portalMedia,
            portalLabel: props.portalLabel,
            scrollFollow: props.scrollFollow && !onCanvas,
            dock: props.dock,
            reform: props.reform,
            reformAt: props.reformAt,
            onEnter: () => {{ if (props.link && !onCanvas) window.location.href = props.link }},
        }}).then((a) => {{ if (dead) a.destroy(); else api = a }})
        return () => {{ dead = true; if (api) api.destroy() }}
    }}, [mode, props.model, props.runway, props.transparent, props.headline, props.caption, props.hint, props.sound, props.paper, props.ink, props.portalMedia, props.portalLabel, props.link, props.scrollFollow, props.dock, props.reform, props.reformAt])
    return <div ref={{ref}} style={{{{ position: "relative", width: "100%", height: mode === "scroll" ? "auto" : "100%", ...props.style }}}} />
}}

CrystalBurst.defaultProps = {{
    mode: "interactive",
    runway: 400,
    transparent: false,
    headline: "",
    caption: "Design & technology studio — India",
    hint: true,
    sound: true,
    paper: "#E8E6E1",
    ink: "#0B0B0B",
    portalLabel: "Enter\\nthe dream",
    link: "",
    scrollFollow: true,
    dock: "right",
    reform: true,
    reformAt: "right",
}}

addPropertyControls(CrystalBurst, {{
    mode: {{ type: ControlType.Enum, title: "Mode", options: ["interactive", "scroll", "autoplay"], optionTitles: ["Hover", "Scroll", "Auto"] }},
    link: {{ type: ControlType.Link, title: "Enter link", hidden: (p) => p.mode !== "interactive" }},
    portalMedia: {{ type: ControlType.File, title: "Portal media", allowedFileTypes: ["mp4", "webm", "jpg", "jpeg", "png", "webp"], hidden: (p) => p.mode !== "interactive" }},
    portalLabel: {{ type: ControlType.String, title: "Portal label", displayTextArea: true, hidden: (p) => p.mode !== "interactive" }},
    scrollFollow: {{ type: ControlType.Boolean, title: "Scroll journey", hidden: (p) => p.mode !== "interactive" }},
    dock: {{ type: ControlType.Enum, title: "Dock", options: ["right", "left", "center"], hidden: (p) => p.mode !== "interactive" || !p.scrollFollow }},
    reform: {{ type: ControlType.Boolean, title: "Rejoin at end", hidden: (p) => p.mode !== "interactive" || !p.scrollFollow }},
    reformAt: {{ type: ControlType.Enum, title: "Rejoin at", options: ["right", "center", "left"], hidden: (p) => p.mode !== "interactive" || !p.scrollFollow || !p.reform }},
    transparent: {{ type: ControlType.Boolean, title: "Transparent" }},
    runway: {{ type: ControlType.Number, title: "Scroll length", min: 150, max: 800, step: 50, unit: "vh", hidden: (p) => p.mode !== "scroll" }},
    headline: {{ type: ControlType.String, title: "Text behind", placeholder: "Empty = none" }},
    caption: {{ type: ControlType.String, title: "Caption", hidden: (p) => p.mode === "interactive" }},
    hint: {{ type: ControlType.Boolean, title: "Scroll hint", hidden: (p) => p.mode !== "scroll" }},
    sound: {{ type: ControlType.Boolean, title: "Sound button" }},
    paper: {{ type: ControlType.Color, title: "Background", hidden: (p) => p.transparent }},
    ink: {{ type: ControlType.Color, title: "Text" }},
    model: {{ type: ControlType.File, title: "Model (.glb)", allowedFileTypes: ["glb"] }},
}})
"""
(OUT / "framer" / "CrystalBurst.tsx").write_text(framer, encoding="utf-8")

# ---------- zip ----------
zip_base = OUT.parent / "prollyatyp0-crystal-burst-developer-handoff"
shutil.make_archive(str(zip_base), "zip", OUT.parent, OUT.name)

for f in sorted(OUT.rglob("*")):
    if f.is_file():
        print(f"{f.relative_to(OUT)}  {f.stat().st_size / 1024:.0f} KB")
print(f"zip: {zip_base.name}.zip  {(zip_base.with_suffix('.zip')).stat().st_size / 1024:.0f} KB")
