"""Manim scene: "plus sign" (term id k-oa-plus-sign), 4 + 3 = 7.

Render:  videos/render.sh plus k-oa-plus-sign Plus 6
"""
from common import *

A, B = 4, 3


def plus_shape(size, color):
    bar = dict(width=size, height=size * 0.26, corner_radius=size * 0.1,
               fill_opacity=1, stroke_width=0, color=color)
    return VGroup(RoundedRectangle(**bar), RoundedRectangle(**bar).rotate(PI / 2))


class Plus(CaptionScene):
    TERM_ID = "k-oa-plus-sign"

    def construct(self):
        # 1. The sign -----------------------------------------------------
        self.caption("This is the plus sign.")
        big = plus_shape(2.4, YELLOW).move_to(UP * 0.8)
        self.sfx("operation")
        self.play(GrowFromCenter(big), run_time=1.2, rate_func=ease)
        self.wait(1.0)

        # 2. It means add -------------------------------------------------
        self.caption("It tells you to add.")
        word = Text("add", font_size=48, weight=BOLD, color=YELLOW).next_to(big, DOWN, buff=0.5)
        self.sfx("number", step=3)
        self.play(FadeIn(word, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(1.4)

        # 3. Between two numbers ------------------------------------------
        self.caption("Maya writes 4 + 3. Four plus three.")
        small = plus_shape(0.7, YELLOW).move_to([0, 2.0, 0])
        four = Text(str(A), font_size=80, weight=BOLD, color=COLORS[0]).move_to([-1.7, 2.0, 0])
        three = Text(str(B), font_size=80, weight=BOLD, color=COLORS[1]).move_to([1.7, 2.0, 0])
        self.play(Transform(big, small), FadeOut(word), run_time=1.0, rate_func=ease)
        self.sfx("number", step=4)
        self.play(FadeIn(four, shift=RIGHT * 0.15), run_time=0.6, rate_func=ease)
        self.sfx("number", step=2)
        self.play(FadeIn(three, shift=LEFT * 0.15), run_time=0.6, rate_func=ease)
        self.wait(0.8)

        # 4. Put them together --------------------------------------------
        self.caption("Plus means put them together.")
        left = dots(A, COLORS[0], [-1.7, 0.2, 0], step=0.5, radius=0.17)
        right = dots(B, COLORS[1], [1.9, 0.2, 0], step=0.5, radius=0.17)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in [*left, *right]], lag_ratio=0.1),
                  run_time=1.3, rate_func=ease)
        joined = dots(A + B, WHITE, [0, -0.2, 0], step=0.5, radius=0.17)
        everyone = VGroup(*left, *right)
        self.wait(0.4)
        for i in range(A + B):
            self.sfx("tick", 0.1 + i * 0.07)
        self.play(*[d.animate.move_to(t.get_center()) for d, t in zip(everyone, joined)],
                  run_time=1.4, rate_func=ease)
        self.wait(0.8)

        # 5. Result -------------------------------------------------------
        self.caption("4 + 3 = 7")
        eq_sign = Text("=", font_size=80, weight=BOLD)
        seven = Text("7", font_size=80, weight=BOLD, color=YELLOW)
        ys = -1.3
        xs = [-2.4, -1.2, 0.0, 1.2, 2.4]  # 4 + 3 = 7, evenly spaced
        eq_sign.move_to([xs[3], ys, 0])
        seven.move_to([xs[4], ys, 0])
        sentence = VGroup(four, big, three)
        self.play(four.animate.move_to([xs[0], ys, 0]), big.animate.move_to([xs[1], ys, 0]),
                  three.animate.move_to([xs[2], ys, 0]), run_time=0.9, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(eq_sign, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.sfx("result")
        self.play(FadeIn(seven, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.0)

        self.caption(None)
        self.play(FadeOut(VGroup(four, big, three, everyone, eq_sign, seven)), run_time=0.6, rate_func=ease)
        self.write_vtt()
