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
# Square 1:1 frame: x and y both run -4..4. Keep content inside ~x +/-3.6 and
# y -2.9..3.7 (captions overlay the bottom of the player). To make another
# aspect ratio later, change these three and re-lay out against the new frame.
config.frame_width = 8.0
config.frame_height = 8.0
config.pixel_width = 720
config.pixel_height = 720
Text.set_default(font="Helvetica Neue")

COLORS = ["#7c9eff", "#ff5fa8", "#7cffb2"]  # blue, pink, green
SOFT = "#c8cae0"
SFX_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx")
SFX_GAIN_DB = -9  # quiet: the cues punctuate, the captions carry the meaning
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

    def sfx(self, role, delay=0.0):
        """Play a cue when something is introduced, `delay` seconds from now.

        role: "number" (numbers and groups), "operation" (+ - x / = signs),
        "result" (the answer). WAVs are rendered by sfx/make_sfx.mjs.
        """
        self.add_sound(os.path.join(SFX_DIR, f"{role}.wav"), time_offset=delay, gain=SFX_GAIN_DB)

    def write_vtt(self):
        lines = ["WEBVTT", ""]
        for i, (a, b, text) in enumerate(self.cues, 1):
            lines += [str(i), f"{_fmt(a)} --> {_fmt(b)}", text, ""]
        with open(os.path.join(VIDEOS_DIR, f"{self.TERM_ID}.vtt"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
