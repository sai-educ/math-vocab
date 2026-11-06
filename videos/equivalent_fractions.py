"""Manim scene: "equivalent fractions" (term id 3-nf-equivalent-fractions), 1/2 = 2/4 = 4/8.

Render:  videos/render.sh equivalent_fractions 3-nf-equivalent-fractions EquivalentFractions 15
"""
from common import *

BAR_W, BAR_H = 4.8, 0.85
BAR_X = 0.9  # bar centre; fraction labels sit to the left
ROW_YS = [2.7, 1.3, -0.1]
ROWS = [(1, 2, COLORS[0]), (2, 4, COLORS[1]), (4, 8, COLORS[2])]
LABEL_X = -2.8


def frac(n, d, color, size=54):
    top = Text(str(n), font_size=size, weight=BOLD, color=color)
    bottom = Text(str(d), font_size=size, weight=BOLD, color=color)
    bar = Line(LEFT * 0.4, RIGHT * 0.4, color=WHITE, stroke_width=5)
    return VGroup(top, bar, bottom).arrange(DOWN, buff=0.08)


def make_bar(n, d, color, y):
    left = BAR_X - BAR_W / 2
    step = BAR_W / d
    frame = Rectangle(width=BAR_W, height=BAR_H, color=WHITE, stroke_width=5).move_to([BAR_X, y, 0])
    cuts = [Line([left + step * i, y - BAR_H / 2, 0], [left + step * i, y + BAR_H / 2, 0],
                 color=WHITE, stroke_width=4) for i in range(1, d)]
    fill = Rectangle(width=step * n - 0.1, height=BAR_H - 0.1, stroke_width=0,
                     fill_color=color, fill_opacity=0.9).move_to([left + step * n / 2, y, 0])
    return frame, cuts, fill


class EquivalentFractions(CaptionScene):
    TERM_ID = "3-nf-equivalent-fractions"

    def construct(self):
        shown = []

        def reveal(index, caption, step):
            n, d, color = ROWS[index]
            y = ROW_YS[index]
            frame, cuts, fill = make_bar(n, d, color, y)
            label = frac(n, d, color).move_to([LABEL_X, y, 0])
            self.caption(caption)
            self.sfx("number", step=step)
            self.play(FadeIn(frame, scale=0.95), FadeIn(label, shift=RIGHT * 0.12), run_time=0.9, rate_func=ease)
            self.play(*[Create(c) for c in cuts], run_time=0.8, rate_func=ease) if cuts else None
            self.sfx("tick")
            self.play(FadeIn(fill, scale=0.95), run_time=0.9, rate_func=ease)
            shown.extend([frame, label, fill, *cuts])

        reveal(0, "Ana eats 1/2 of a pizza. Shade 1 of 2 equal parts.", 2)
        self.wait(1.0)
        reveal(1, "Ben eats 2/4 of the same pizza. Shade 2 of 4 parts.", 3)
        self.wait(1.0)
        reveal(2, "Now 4/8. Shade 4 of 8 parts.", 4)
        self.wait(0.6)

        # Same length -----------------------------------------------------
        self.caption("The shaded parts are the same length!")
        mid_x = BAR_X - BAR_W / 2 + BAR_W / 2
        guide = DashedLine([mid_x, ROW_YS[0] + 0.7, 0], [mid_x, ROW_YS[2] - 0.7, 0],
                           color=YELLOW, stroke_width=6, dash_length=0.18)
        self.sfx("result")
        self.play(Create(guide), run_time=1.4, rate_func=ease)
        self.wait(1.4)

        # Equation --------------------------------------------------------
        self.caption("1/2 = 2/4 = 4/8. They are equivalent fractions.")
        parts = [frac(1, 2, COLORS[0]), Text("=", font_size=64, weight=BOLD, color=YELLOW),
                 frac(2, 4, COLORS[1]), Text("=", font_size=64, weight=BOLD, color=YELLOW),
                 frac(4, 8, COLORS[2])]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.4).move_to([0, -2.0, 0])
        for part, (role, step) in zip(parts, (("number", 2), ("operation", 0), ("number", 3),
                                              ("operation", 0), ("number", 4))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.1), run_time=0.45, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(*shown, guide, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
