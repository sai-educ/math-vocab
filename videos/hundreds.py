"""Manim scene: "hundreds" (term id 2-nbt-hundreds), ten tens snap into one hundred, then 3 hundreds = 300.

Render:  videos/render.sh hundreds 2-nbt-hundreds Hundreds 11
"""
from common import *

TENS_C, HUND_C = COLORS[0], COLORS[2]
CELL = 0.2
GAP = 0.03
ROW_Y = 0.95


def rod(color):
    cells = VGroup(*[Square(side_length=CELL, color=color, fill_opacity=0.9, stroke_width=0)
                     for _ in range(10)])
    return cells.arrange(DOWN, buff=GAP)


class Hundreds(CaptionScene):
    TERM_ID = "2-nbt-hundreds"

    def construct(self):
        # 1. Ten tens -----------------------------------------------------
        self.caption("A hundred is a group of 100.")
        rods = VGroup(*[rod(TENS_C) for _ in range(10)]).arrange(RIGHT, buff=0.28)
        rods.move_to([0, ROW_Y, 0])
        label = Text("10 tens", font_size=64, weight=BOLD, color=TENS_C).move_to([0, 2.6, 0])
        self.sfx("number", step=3)
        self.play(FadeIn(label, shift=DOWN * 0.1), run_time=0.7, rate_func=ease)
        for k in range(10):
            self.sfx("tick", k * 0.12)
        self.play(LaggedStart(*[FadeIn(r, shift=DOWN * 0.15) for r in rods], lag_ratio=0.15),
                  run_time=1.8, rate_func=ease)
        self.wait(1.0)

        # 2. Push together ------------------------------------------------
        self.caption("Push the 10 tens together.")
        joined = VGroup(*[rod(TENS_C) for _ in range(10)]).arrange(RIGHT, buff=GAP).move_to([0, ROW_Y, 0])
        self.play(*[Transform(r, j) for r, j in zip(rods, joined)], run_time=1.8, rate_func=ease)
        self.wait(0.6)

        # 3. One hundred --------------------------------------------------
        self.caption("10 tens make 1 hundred!")
        one_hundred = Text("1 hundred", font_size=64, weight=BOLD, color=HUND_C).move_to([0, 2.6, 0])
        self.sfx("result")
        self.play(rods.animate.set_color(HUND_C), Transform(label, one_hundred),
                  run_time=1.4, rate_func=ease)
        self.wait(1.4)

        # 4. Three hundreds -----------------------------------------------
        self.caption("Three hundreds make 300.")
        xs = [-2.5, 0, 2.5]
        squares = [rods] + [rods.copy() for _ in range(2)]
        self.play(FadeOut(label), rods.animate.move_to([xs[0], ROW_Y, 0]), run_time=1.2, rate_func=ease)
        for sq, x in zip(squares[1:], xs[1:]):
            sq.move_to([xs[0], ROW_Y, 0])
        for i in (1, 2):
            self.sfx("number", step=i + 2)
            self.play(squares[i].animate.move_to([xs[i], ROW_Y, 0]), run_time=0.9, rate_func=ease)
        tags = VGroup(*[Text("100", font_size=52, weight=BOLD, color=HUND_C).move_to([x, ROW_Y - 1.7, 0])
                        for x in xs])
        for k in range(3):
            self.sfx("number", k * 0.5, step=k + 2)
        self.play(LaggedStart(*[FadeIn(t, shift=UP * 0.1) for t in tags], lag_ratio=0.6),
                  run_time=1.6, rate_func=ease)
        self.wait(0.8)
        total = Text("3 hundreds = 300", font_size=68, weight=BOLD, color=YELLOW).move_to([0, -2.1, 0])
        self.sfx("result")
        self.play(FadeIn(total, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(*squares, tags, total)), run_time=0.6, rate_func=ease)
        self.write_vtt()
