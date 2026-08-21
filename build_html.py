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
import math
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
CUELUME = os.path.join(HERE, "node_modules", "cuelume", "dist")
INTER_FILES = os.path.join(HERE, "node_modules", "@fontsource", "inter", "files")

# Mirrors the layout math in src/graph3d.js's buildGraph() (GRADES, RG/RD/RT,
# domainsForGradeAll/termsForAll) so the landing page's decorative backdrop is
# the same shaped constellation as the real app, without shipping the app's
# vocab data, definitions or icons to render it — only bare positions, grouped
# by level and (for the domain shape/colour) domain code.
GRAPH_GRADES = ["K", "1", "2", "3", "4", "5"]
GRAPH_DOMAIN_ORDER = ["CC", "OA", "NBT", "NF", "MD", "G"]
GRAPH_RG, GRAPH_RD, GRAPH_RT = 34, 13, 6.2


def graph_domains_for_grade(data, grade):
    present = {d["domainCode"] for d in data if d["grade"] == grade}
    return [code for code in GRAPH_DOMAIN_ORDER if code in present]


def graph_terms_for(data, grade, code):
    return [d for d in data if d["grade"] == grade and d["domainCode"] == code]


def build_graph_layout(data):
    """[level, domainCode, x, y, z, parentIndex] per node — grade/domain/term
    only; the root (the sun) is always at the origin and is handled directly
    by the renderer, same as graph3d.js's ORIGIN-anchored root node."""
    nodes = []

    def add(level, domain_code, pos, parent):
        nodes.append([level, domain_code, round(pos[0], 3), round(pos[1], 3), round(pos[2], 3), parent])
        return len(nodes) - 1

    for gi, grade in enumerate(GRAPH_GRADES):
        theta = (gi / len(GRAPH_GRADES)) * math.pi * 2
        gpos = (
            GRAPH_RG * math.cos(theta),
            9 * math.sin(theta * 1.6 + gi),
            GRAPH_RG * math.sin(theta),
        )
        grade_idx = add("g", None, gpos, -1)

        doms = graph_domains_for_grade(data, grade)
        for di, code in enumerate(doms):
            theta_d = (di / len(doms)) * math.pi * 2 + gi * 0.7
            dpos = (
                gpos[0] + GRAPH_RD * math.cos(theta_d),
                gpos[1] + GRAPH_RD * 0.55 * math.sin(theta_d * 1.4 + di),
                gpos[2] + GRAPH_RD * math.sin(theta_d),
            )
            dom_idx = add("d", code, dpos, grade_idx)

            terms = graph_terms_for(data, grade, code)
            for ti in range(len(terms)):
                theta_t = (ti / len(terms)) * math.pi * 2 + di * 0.9
                tpos = (
                    dpos[0] + GRAPH_RT * math.cos(theta_t),
                    dpos[1] + GRAPH_RT * 0.6 * math.sin(theta_t * 1.7 + ti),
                    dpos[2] + GRAPH_RT * math.sin(theta_t),
                )
                add("t", None, tpos, dom_idx)

    return nodes

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
    "catDialogue.js",
    "cat.js",
    "catSettings.js",
    "resetProgress.js",
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
        "__GRAPH_LAYOUT__": json.dumps(build_graph_layout(json.loads(data)), separators=(",", ":")),
        "__GRAPH_SCRIPT__": read(SRC, "graphBackdrop.js").strip(),
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

    # mapping.html is an internal, hand-authored cross-reference (Usable Math
    # slide/hint -> vocab term) — same self-contained, copy-as-is pattern as
    # roadmap.html, and not linked from the app itself.
    mapping_src = os.path.join(HERE, "mapping.html")
    if os.path.exists(mapping_src):
        os.makedirs(public_dir, exist_ok=True)
        shutil.copyfile(mapping_src, os.path.join(public_dir, "mapping.html"))
        print(f"Copied {mapping_src} -> {os.path.join(public_dir, 'mapping.html')}")

    sun_src = os.path.join(HERE, "assets", "sun.glb")
    if os.path.exists(sun_src):
        public_assets_dir = os.path.join(public_dir, "assets")
        os.makedirs(public_assets_dir, exist_ok=True)
        shutil.copyfile(sun_src, os.path.join(public_assets_dir, "sun.glb"))
        print(f"Copied {sun_src} -> {os.path.join(public_assets_dir, 'sun.glb')}")
    else:
        print("Warning: assets/sun.glb not found; the root node will fall back to its plain sphere.")

    # Term visuals (assets/visuals/*) follow the same lazy-loaded, not-inlined
    # pattern as the sun model: fetched on demand when a term with one is
    # opened, rather than bloated into the single-file HTML.
    visuals_src_dir = os.path.join(HERE, "assets", "visuals")
    if os.path.isdir(visuals_src_dir):
        public_visuals_dir = os.path.join(public_dir, "assets", "visuals")
        os.makedirs(public_visuals_dir, exist_ok=True)
        for name in os.listdir(visuals_src_dir):
            shutil.copyfile(
                os.path.join(visuals_src_dir, name),
                os.path.join(public_visuals_dir, name),
            )
        print(f"Copied {visuals_src_dir} -> {public_visuals_dir}")

    # Pixel cat sprite sheet (assets/cat/*, see src/cat.js) — same
    # lazy-loaded, not-inlined pattern as the sun model and term visuals
    # above. The .txt licence ships with it, since the art is MIT and the
    # licence has to travel with any copy of it.
    cat_src_dir = os.path.join(HERE, "assets", "cat")
    if os.path.isdir(cat_src_dir):
        public_cat_dir = os.path.join(public_dir, "assets", "cat")
        os.makedirs(public_cat_dir, exist_ok=True)
        for name in os.listdir(cat_src_dir):
            shutil.copyfile(
                os.path.join(cat_src_dir, name),
                os.path.join(public_cat_dir, name),
            )
        print(f"Copied {cat_src_dir} -> {public_cat_dir}")
    else:
        print("Warning: assets/cat not found; the pixel cat will have no sprite sheet.")


if __name__ == "__main__":
    main()
