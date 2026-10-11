"""Shared pieces for the Manim explainer scenes (one scene file per term).

CaptionScene records the time of every caption a scene shows and writes a
matching WebVTT file to assets/videos/<TERM_ID>.vtt, so captions can never
drift from the animation. All motion uses `ease` (smooth = ease-in-out);
never linear, never overshoot.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from manim import *  # noqa: E402,F401,F403

config.background_color = "#0b0b10"
Text.set_default(font="Helvetica Neue")

COLORS = ["#7c9eff", "#ff5fa8", "#7cffb2"]  # blue, pink, green
SOFT = "#c8cae0"
VIDEOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "videos")


def ease(t):
    return smooth(t)


def _fmt(sec):
    return f"{int(sec // 60):02d}:{sec % 60:06.3f}"


class CaptionScene(Scene):
    TERM_ID = ""  # set on each subclass

    def setup(self):
        self.cues = []
        self._cap = None
        self._cap_start = 0.0

    def caption(self, text):
        t = self.renderer.time
        if self._cap is not None:
            self.cues.append((self._cap_start, t, self._cap))
        self._cap, self._cap_start = text, t

    def write_vtt(self):
        lines = ["WEBVTT", ""]
        for i, (a, b, text) in enumerate(self.cues, 1):
            lines += [str(i), f"{_fmt(a)} --> {_fmt(b)}", text, ""]
        with open(os.path.join(VIDEOS_DIR, f"{self.TERM_ID}.vtt"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
