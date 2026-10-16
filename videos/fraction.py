"""Manim scene: "fraction" (term id 3-nf-fraction), the fraction 3/4.

Render:  videos/render.sh fraction 3-nf-fraction Fraction 9
"""
from common import *

PARTS, SHADED = 4, 3
BAR_W, BAR_H = 6.8, 2.0
NUM_COLOR, DEN_COLOR = COLORS[0], COLORS[1]


class Fraction(CaptionScene):
    TERM_ID = "3-nf-fraction"

    def construct(self):
        # 1. One whole ----------------------------------------------------
        self.caption("A fraction names part of a whole.")
        bar = RoundedRectangle(corner_radius=0.15, width=BAR_W, height=BAR_H,
                               color=WHITE, stroke_width=5).shift(DOWN * 0.6)
        whole = Text("1 whole", font_size=34, color=SOFT).next_to(bar, DOWN, buff=0.35)
        self.sfx("number")
        self.play(FadeIn(bar, scale=0.95), run_time=1.0, rate_func=ease)
        self.sfx("number", step=2)
        self.play(FadeIn(whole, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.4)

        # 2. Cut into equal parts: the bottom number --------------------
        self.caption("Cut the whole into 4 equal parts.")
        step = BAR_W / PARTS
        x0 = bar.get_left()[0]
        cuts = [Line([x0 + step * (i + 1), bar.get_top()[1], 0],
                     [x0 + step * (i + 1), bar.get_bottom()[1], 0],
                     color=WHITE, stroke_width=4) for i in range(PARTS - 1)]
        for k in range(PARTS - 1):
            self.sfx("number", k * 0.33, step=k)
        self.play(LaggedStart(*[Create(c) for c in cuts], lag_ratio=0.35),
                  FadeOut(whole), run_time=1.6, rate_func=ease)

        bar_line = Line(LEFT * 0.7, RIGHT * 0.7, color=WHITE, stroke_width=6)
        den = Text("4", font_size=78, weight=BOLD, color=DEN_COLOR)
        bar_line.move_to(UP * 2.35)
        den.next_to(bar_line, DOWN, buff=0.18)
        den_lab = Text("equal parts\nin the whole", font_size=26, color=DEN_COLOR, line_spacing=0.6)
        den_lab.next_to(den, RIGHT, buff=0.7, aligned_edge=LEFT).align_to(den, DOWN)
        self.sfx("operation")
        self.sfx("number", 0.2, step=2)
        self.play(FadeIn(bar_line), FadeIn(den, shift=UP * 0.15),
                  FadeIn(den_lab, shift=LEFT * 0.15), run_time=1.0, rate_func=ease)
        self.wait(1.0)

        # 3. Shade some parts: the top number -----------------------------
        self.caption("Shade 3 of the parts.")
        fills = []
        for i in range(SHADED):
            f = Rectangle(width=step - 0.12, height=BAR_H - 0.12, stroke_width=0,
                          fill_color=NUM_COLOR, fill_opacity=0.9)
            f.move_to([x0 + step * (i + 0.5), bar.get_center()[1], 0])
            fills.append(f)
        for k in range(SHADED):
            self.sfx("number", k * 0.47, step=k * 2)
        self.play(LaggedStart(*[FadeIn(f, scale=0.92) for f in fills], lag_ratio=0.45),
                  run_time=2.0, rate_func=ease)
        num = Text("3", font_size=78, weight=BOLD, color=NUM_COLOR)
        num.next_to(bar_line, UP, buff=0.18)
        num_lab = Text("parts\nwe have", font_size=26, color=NUM_COLOR, line_spacing=0.6).next_to(num, RIGHT, buff=0.7, aligned_edge=LEFT)
        self.sfx("number", step=4)
        self.play(FadeIn(num, shift=DOWN * 0.15), FadeIn(num_lab, shift=LEFT * 0.15),
                  run_time=0.9, rate_func=ease)
        self.wait(0.9)

        # 4. Name it ------------------------------------------------------
        self.caption("3 out of 4 equal parts is the fraction 3/4.")
        frac = VGroup(num, bar_line, den)
        self.sfx("result")
        self.play(FadeOut(num_lab), FadeOut(den_lab),
                  frac.animate.scale(1.1).move_to(UP * 2.35), run_time=0.9, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(FadeOut(VGroup(frac, bar, *cuts, *fills)), run_time=0.6, rate_func=ease)
        self.write_vtt()
