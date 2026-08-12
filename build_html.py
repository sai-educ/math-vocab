"""
Builds the two pages of the site from the sources in src/.

    python3 build_data.py   # rebuilds vocab_data.json + vocab_bank/*.md
    python3 build_html.py   # rebuilds index.html + app.html

Output:

    index.html          the local landing page  (landing_template.html + landing.css)
    app.html            the local tool itself   (app_template.html + src/*)
    public/index.html   the deployable landing page
    public/app.html     the deployable tool
    public/roadmap.html the deployable roadmap (copied as-is; public/ is
                         gitignored, so Vercel only ever sees this file
                         through a build step — it is never committed there)
    public/assets/sun.glb  the root node's 3D model, copied as-is

Both are single self-contained files with all CSS and JS inlined, so they can
be opened straight from disk, dropped on any static host, and used offline
once loaded. Nothing is fetched at runtime except the three CDN libraries the
3D graph needs, and the app degrades cleanly without them.

cuelume (MIT) is an ES module split across a few files. Rather than shipping
node_modules or adding a bundler, its two needed modules are concatenated in
dependency order, their import/export syntax stripped, and the result wrapped
in an IIFE exposed as `window.Cuelume`.
"""
import base64
import json
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
CUELUME = os.path.join(HERE, "node_modules", "cuelume", "dist")
INTER_FILES = os.path.join(HERE, "node_modules", "@fontsource", "inter", "files")

# Order matters: each file uses names defined by the ones before it.
APP_SCRIPTS = (
    "constants.js",
    "icons.js",
    "sound.js",
    "graph3d.js",
    "narration.js",
    "tts.js",
    "ui.js",
    "about.js",
    "curriculum.js",
    "panelResize.js",
    "main.js",
)

# recipes defines the palette; engine plays it. bind() is unused here.
CUELUME_MODULES = ("sounds/recipes.js", "audio/engine.js")

# Only the weights actually used in the CSS (400 is the implicit body
# default; 650/750/800 fall back to 700, which the browser handles on its
# own without a dedicated file).
INTER_WEIGHTS = (400, 600, 700)

_IMPORT_RE = re.compile(r"^import\s[\s\S]*?;\s*$", re.MULTILINE)
_EXPORT_RE = re.compile(r"^export\s+(?=(?:const|let|var|function|class)\b)", re.MULTILINE)


def read(*parts: str) -> str:
    with open(os.path.join(*parts), encoding="utf-8") as handle:
        return handle.read()


def bundle_cuelume() -> str:
    """Inline cuelume as a `window.Cuelume` global."""
    if not os.path.isdir(CUELUME):
        raise SystemExit(
            "node_modules/cuelume is missing. Run `npm install` before building."
        )

    parts = []
    for name in CUELUME_MODULES:
        source = read(CUELUME, *name.split("/"))
        source = _IMPORT_RE.sub("", source)
        source = _EXPORT_RE.sub("", source)
        parts.append(f"/* cuelume/{name} */\n{source.strip()}")

    body = "\n\n".join(parts)
    return (
        "/* ---------- cuelume (MIT, github.com/Danilaa1/cuelume) ---------- */\n"
        "window.Cuelume = (function () {\n"
        f"{body}\n"
        "return { play, setEnabled, setVolume, sounds };\n"
        "}());"
    )


def bundle_inter_fonts() -> str:
    """Inline Inter (OFL) as base64 @font-face rules, so typography survives
    offline use and no request ever leaves the page to Google Fonts."""
    if not os.path.isdir(INTER_FILES):
        raise SystemExit(
            "node_modules/@fontsource/inter is missing. Run `npm install` before building."
        )

    faces = []
    for weight in INTER_WEIGHTS:
        path = os.path.join(INTER_FILES, f"inter-latin-{weight}-normal.woff2")
        with open(path, "rb") as handle:
            encoded = base64.b64encode(handle.read()).decode("ascii")
        faces.append(
            "@font-face{font-family:'Inter';font-style:normal;"
            f"font-weight:{weight};font-display:swap;"
            f"src:url(data:font/woff2;base64,{encoded}) format('woff2');}}"
        )
    return (
        "/* ---------- Inter (OFL, fonts.google.com/specimen/Inter) ---------- */\n"
        + "\n".join(faces)
    )


def bundle_app_scripts() -> str:
    chunks = [bundle_cuelume()]
    for name in APP_SCRIPTS:
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            raise SystemExit(f"Missing source file: src/{name}")
        chunks.append(f"/* ---------- src/{name} ---------- */\n{read(path).strip()}")
    return "\n\n".join(chunks)


def render(template_name: str, replacements: dict) -> str:
    template = read(HERE, template_name)
    for token in replacements:
        if token not in template:
            raise SystemExit(f"{template_name} is missing the {token} placeholder.")
    # Data goes last so its contents are never scanned for placeholder tokens.
    for token, value in sorted(replacements.items(), key=lambda kv: kv[0] == "__VOCAB_DATA__"):
        template = template.replace(token, value)
    return template


def write(output_dir: str, name: str, html: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, name)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(html)
    print(f"Wrote {path} ({len(html):,} bytes)")


def main() -> None:
    data = read(HERE, "vocab_data.json")
    json.loads(data)  # fail fast if the JSON is malformed

    fonts_css = bundle_inter_fonts()

    app_html = render("app_template.html", {
        "__STYLES__": fonts_css + "\n\n" + read(SRC, "styles.css").strip(),
        "__SCRIPTS__": bundle_app_scripts(),
        "__VOCAB_DATA__": data,
    })

    index_html = render("landing_template.html", {
        "__STYLES__": fonts_css + "\n\n" + read(SRC, "landing.css").strip(),
        "__TERM_COUNT__": str(len(json.loads(data))),
    })

    public_dir = os.path.join(HERE, "public")
    for output_dir in (HERE, public_dir):
        write(output_dir, "app.html", app_html)
        write(output_dir, "index.html", index_html)

    # roadmap.html is hand-authored and already self-contained (no template
    # placeholders), so it only needs copying into the deploy output — but it
    # does need that, since public/ is gitignored and Vercel builds from a
    # clean checkout that has never heard of it otherwise.
    roadmap_src = os.path.join(HERE, "roadmap.html")
    if os.path.exists(roadmap_src):
        os.makedirs(public_dir, exist_ok=True)
        shutil.copyfile(roadmap_src, os.path.join(public_dir, "roadmap.html"))
        print(f"Copied {roadmap_src} -> {os.path.join(public_dir, 'roadmap.html')}")
    else:
        print("Warning: roadmap.html not found at repo root; public/roadmap.html was not updated.")

    sun_src = os.path.join(HERE, "assets", "sun.glb")
    if os.path.exists(sun_src):
        public_assets_dir = os.path.join(public_dir, "assets")
        os.makedirs(public_assets_dir, exist_ok=True)
        shutil.copyfile(sun_src, os.path.join(public_assets_dir, "sun.glb"))
        print(f"Copied {sun_src} -> {os.path.join(public_assets_dir, 'sun.glb')}")
    else:
        print("Warning: assets/sun.glb not found; the root node will fall back to its plain sphere.")


if __name__ == "__main__":
    main()
