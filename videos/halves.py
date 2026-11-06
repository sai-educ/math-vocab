"""Manim scene: "halves" (term id 1-g-halves), a circle cut into two equal parts, one shaded.

Render:  videos/render.sh halves 1-g-halves Halves 12
"""
from common import *

R = 1.7
CENTER = np.array([0.0, 1.0, 0.0])
FILL = COLORS[0]


class Halves(CaptionScene):
    TERM_ID = "1-g-halves"

    def construct(self):
        # 1. One whole ----------------------------------------------------
        self.caption("Leo has one whole apple.")
        left = Sector(radius=R, angle=PI, start_angle=PI / 2, color=FILL, fill_opacity=0.9,
                      stroke_color=WHITE, stroke_width=4)
        right = Sector(radius=R, angle=PI, start_angle=-PI / 2, color=FILL, fill_opacity=0.9,
                       stroke_color=WHITE, stroke_width=4)
        whole = VGroup(left, right).move_to(CENTER)
        tag = Text("1 whole", font_size=48, weight=BOLD, color=SOFT).move_to(DOWN * 1.5)
        self.sfx("number", step=3)
        self.play(FadeIn(whole, scale=0.9), FadeIn(tag, shift=UP * 0.12), run_time=1.1, rate_func=ease)
        self.wait(1.4)

        # 2. Cut in two ---------------------------------------------------
        self.caption("He cuts it into 2 equal parts.")
        cut = DashedLine(CENTER + UP * (R + 0.35), CENTER + DOWN * (R + 0.35), color=YELLOW,
                         stroke_width=5, dash_length=0.18)
        self.sfx("operation")
        self.play(Create(cut), run_time=1.1, rate_func=ease)
        self.sfx("tick", 0.3)
        self.play(left.animate.shift(LEFT * 0.25), right.animate.shift(RIGHT * 0.25),
                  FadeOut(cut), FadeOut(tag), run_time=1.0, rate_func=ease)
        two = Text("2 equal parts", font_size=48, weight=BOLD, color=SOFT).move_to(DOWN * 1.5)
        self.sfx("number", step=2)
        self.play(FadeIn(two, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.4)

        # 3. They match ---------------------------------------------------
        self.caption("Both parts are the same size.")
        self.play(left.animate.shift(RIGHT * 0.25), right.animate.shift(LEFT * 0.25),
                  run_time=0.8, rate_func=ease)
        self.wait(0.4)
        self.play(left.animate.shift(LEFT * 0.25), right.animate.shift(RIGHT * 0.25),
                  run_time=0.8, rate_func=ease)
        self.wait(1.2)

        # 4. Shade one half ----------------------------------------------
        self.caption("Each part is one half. Two equal parts are halves.")
        word = Text("1 half", font_size=64, weight=BOLD, color=YELLOW).move_to(DOWN * 1.5)
        self.sfx("result")
        self.play(right.animate.set_fill(FILL, opacity=0.0),
                  left.animate.set_fill(YELLOW, opacity=0.9),
                  ReplacementTransform(two, word), run_time=1.2, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(left, right, word)), run_time=0.6, rate_func=ease)
        self.write_vtt()
