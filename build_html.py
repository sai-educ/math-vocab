"""
Regenerates index.html from index_template.html + vocab_data.json.

Run this AFTER build_data.py whenever the vocabulary content changes:

    python3 build_data.py   # rebuilds vocab_data.json + vocab_bank/*.md
    python3 build_html.py   # rebuilds index.html from the template + JSON

index_template.html contains a single placeholder token, __VOCAB_DATA__,
inside a <script type="application/json"> tag. This script swaps that
token for the actual contents of vocab_data.json and writes the result
to index.html. Everything else in the template (layout, styles, the
Three.js knowledge graph, the Fish Audio "Listen" button, etc.) is
copied through unchanged.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(HERE, "vocab_data.json")) as f:
    data = f.read()
json.loads(data)  # sanity check: fail fast if the JSON is malformed

with open(os.path.join(HERE, "index_template.html")) as f:
    template = f.read()

if "__VOCAB_DATA__" not in template:
    raise SystemExit("index_template.html is missing the __VOCAB_DATA__ placeholder.")

html = template.replace("__VOCAB_DATA__", data)

out_path = os.path.join(HERE, "index.html")
with open(out_path, "w") as f:
    f.write(html)

print(f"Wrote {out_path} ({len(html):,} bytes)")
