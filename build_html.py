"""
Regenerates index.html from index_template.html + src/* + vocab_data.json.

Run this AFTER build_data.py whenever the vocabulary content changes:

    python3 build_data.py   # rebuilds vocab_data.json + vocab_bank/*.md
    python3 build_html.py   # rebuilds index.html from the template + sources

index.html stays a single self-contained file so it can be opened straight
from disk or dropped on any static host. The source is split into focused
files under src/ for maintainability, and this script inlines them:

    __STYLES__      <- src/styles.css
    __VOCAB_DATA__  <- vocab_data.json
    __SCRIPTS__     <- src/*.js, concatenated in SCRIPT_ORDER

Script order matters: each file relies on constants and helpers defined by
the ones before it.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")

SCRIPT_ORDER = (
    "constants.js",
    "graph3d.js",
    "tts.js",
    "ui.js",
    "about.js",
    "main.js",
)


def read(*parts: str) -> str:
    with open(os.path.join(*parts), encoding="utf-8") as handle:
        return handle.read()


def build_scripts() -> str:
    chunks = []
    for name in SCRIPT_ORDER:
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            raise SystemExit(f"Missing source file: src/{name}")
        banner = f"/* ---------- src/{name} ---------- */"
        chunks.append(f"{banner}\n{read(path).strip()}\n")
    return "\n".join(chunks)


def main() -> None:
    data = read(HERE, "vocab_data.json")
    json.loads(data)  # sanity check: fail fast if the JSON is malformed

    template = read(HERE, "index_template.html")
    for token in ("__STYLES__", "__VOCAB_DATA__", "__SCRIPTS__"):
        if token not in template:
            raise SystemExit(f"index_template.html is missing the {token} placeholder.")

    html = (
        template
        .replace("__STYLES__", read(SRC, "styles.css").strip())
        .replace("__SCRIPTS__", build_scripts())
        .replace("__VOCAB_DATA__", data)
    )

    out_path = os.path.join(HERE, "index.html")
    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(html)

    print(f"Wrote {out_path} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
