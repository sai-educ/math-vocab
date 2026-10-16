#!/bin/sh
# Usage: videos/render.sh <scene-file> <term-id> <SceneClass> [poster-second]
#   e.g. videos/render.sh multiplication 3-oa-multiplication Multiplication 9
# Writes assets/videos/<term-id>.mp4 + .poster.jpg (the scene writes the .vtt).
set -e
cd "$(dirname "$0")"
MANIM="${MANIM:-$HOME/manim-env/bin/manim}"
"$MANIM" -qm --disable_caching --media_dir ../.manim-media "$1.py"

# Re-encode small + web-friendly (faststart, AAC audio for the sound cues) and grab a poster.
OUT="../assets/videos/$2.mp4"
ffmpeg -y -loglevel error -i "../.manim-media/videos/$1/720p30/$3.mp4" -c:v libx264 -crf 24 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -af apad -shortest "$OUT"
ffmpeg -y -loglevel error -ss "${4:-9}" -i "$OUT" -frames:v 1 "../assets/videos/$2.poster.jpg"
