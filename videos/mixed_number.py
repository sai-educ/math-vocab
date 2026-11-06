"""Manim scene: "mixed number" (term id 4-nf-mixed-number), 1 3/4 as one full bar plus 3 of 4 parts.

Render:  videos/render.sh mixed_number 4-nf-mixed-number MixedNumber 14
(then cp the mp4/.poster.jpg/.vtt to assets/videos/5-nf-mixed-number.*)
"""
from common import *

BAR_W, BAR_H = 3.0, 1.3
BAR_Y = 1.7
LEFT_X, RIGHT_X = -1.8, 1.8
WHOLE_C, FRAC_C = COLORS[0], COLORS[1]


def stacked_fraction(num, den, size, color):
    n = Text(str(num), font_size=size, weight=BOLD, color=color)
    d = Text(str(den), font_size=size, weight=BOLD, color=color)
    bar = Line(LEFT * size * 0.0075, RIGHT * size * 0.0075, color=color, stroke_width=6)
    return VGroup(n, bar, d).arrange(DOWN, buff=0.1)


def part_fills(cx, count):
    step = BAR_W / 4
    x0 = cx - BAR_W / 2
    return [Rectangle(width=step - 0.1, height=BAR_H - 0.1, stroke_width=0,
                      fill_color=(WHOLE_C if count == 4 else FRAC_C), fill_opacity=0.9)
            .move_to([x0 + step * (i + 0.5), BAR_Y, 0]) for i in range(count)]


def cut_lines(cx):
    step = BAR_W / 4
    return [Line([cx - BAR_W / 2 + step * (i + 1), BAR_Y - BAR_H / 2, 0],
                 [cx - BAR_W / 2 + step * (i + 1), BAR_Y + BAR_H / 2, 0], color=WHITE, stroke_width=3)
            for i in range(3)]


class MixedNumber(CaptionScene):
    TERM_ID = "4-nf-mixed-number"

    def construct(self):
        # 1. One whole bar ------------------------------------------------
        self.caption("A mixed number joins a whole number and a fraction.")
        left_bar = RoundedRectangle(corner_radius=0.12, width=BAR_W, height=BAR_H, color=WHITE,
                                    stroke_width=5).move_to([LEFT_X, BAR_Y, 0])
        left_cuts = cut_lines(LEFT_X)
        left_fill = part_fills(LEFT_X, 4)
        self.sfx("number", step=3)
        self.play(FadeIn(left_bar, scale=0.95), run_time=0.9, rate_func=ease)
        self.wait(1.4)
        self.play(Create(VGroup(*left_cuts)), LaggedStart(*[FadeIn(f) for f in left_fill], lag_ratio=0.2),
                  run_time=1.3, rate_func=ease)
        one = Text("1", font_size=84, weight=BOLD, color=WHITE if False else WHOLE_C).move_to([LEFT_X, 0.0, 0])
        self.caption("This bar is full. That is 1 whole.")
        self.sfx("number", step=2)
        self.play(FadeIn(one, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(1.2)

        # 2. Part of another bar -----------------------------------------
        self.caption("Ana has a second bar with 4 equal parts.")
        right_bar = RoundedRectangle(corner_radius=0.12, width=BAR_W, height=BAR_H, color=WHITE,
                                     stroke_width=5).move_to([RIGHT_X, BAR_Y, 0])
        right_cuts = cut_lines(RIGHT_X)
        self.sfx("operation")
        self.play(FadeIn(right_bar, scale=0.95), run_time=0.9, rate_func=ease)
        self.sfx("number", step=1)
        self.play(Create(VGroup(*right_cuts)), run_time=0.9, rate_func=ease)
        self.wait(0.6)
        self.caption("She shades 3 of the 4 parts.")
        right_fill = part_fills(RIGHT_X, 3)
        for k in range(3):
            self.sfx("number", k * 0.45, step=k * 2)
        self.play(LaggedStart(*[FadeIn(f, scale=0.92) for f in right_fill], lag_ratio=0.5),
                  run_time=1.9, rate_func=ease)
        three_fourths = stacked_fraction(3, 4, 56, FRAC_C).move_to([RIGHT_X, 0.0, 0])
        self.sfx("number", step=4)
        self.play(FadeIn(three_fourths, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(1.2)

        # 3. Put them together -------------------------------------------
        self.caption("1 whole and 3/4 together make 1 3/4.")
        mixed = VGroup(Text("1", font_size=100, weight=BOLD, color=WHOLE_C),
                       stacked_fraction(3, 4, 64, FRAC_C)).arrange(RIGHT, buff=0.25).move_to([0, -1.5, 0])
        self.sfx("result")
        self.play(TransformFromCopy(one, mixed[0]), TransformFromCopy(three_fourths, mixed[1]),
                  run_time=1.4, rate_func=ease)
        word = Text("mixed number", font_size=52, weight=BOLD, color=YELLOW).move_to([0, -2.65, 0])
        self.play(FadeIn(word, shift=UP * 0.1), run_time=0.8, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(left_bar, *left_cuts, *left_fill, one, right_bar, *right_cuts, *right_fill,
                                 three_fourths, mixed, word)), run_time=0.6, rate_func=ease)
        self.write_vtt()
