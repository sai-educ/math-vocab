"""Manim scene: "tens" (term id 1-nbt-tens), ten dots become one ten, then 3 tens = 30.

Render:  videos/render.sh tens 1-nbt-tens Tens 14
"""
from common import *

TEN_C = COLORS[0]
X0 = -1.4
CELL = 0.34
BAR_YS = [2.95, 2.1, 1.25]


def ten_bar(y):
    cells = VGroup(*[Square(side_length=CELL, color=TEN_C, fill_opacity=0.9, stroke_width=0)
                     for _ in range(10)])
    cells.arrange(RIGHT, buff=0.03).move_to([X0, y, 0])
    frame = RoundedRectangle(corner_radius=0.1, width=cells.width + 0.2, height=CELL + 0.2,
                             color=WHITE, stroke_width=4).move_to(cells)
    return VGroup(cells, frame)


class Tens(CaptionScene):
    TERM_ID = "1-nbt-tens"

    def construct(self):
        # 1. Ten dots -----------------------------------------------------
        self.caption("Ben has 10 straws.")
        row = dots(10, TEN_C, [X0, BAR_YS[0], 0], step=0.5, radius=0.17)
        for k in range(10):
            self.sfx("tick", 0.2 + k * 0.1)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.12),
                  run_time=1.6, rate_func=ease)
        self.wait(0.6)

        # 2. Bundle into one ten -----------------------------------------
        self.caption("He bundles them into one group of ten.")
        bar = ten_bar(BAR_YS[0])
        self.sfx("number", step=3)
        self.play(*[ReplacementTransform(d, c) for d, c in zip(row, bar[0])],
                  run_time=1.4, rate_func=ease)
        self.play(Create(bar[1]), run_time=0.7, rate_func=ease)
        one_ten = Text("1 ten = 10", font_size=52, weight=BOLD, color=YELLOW).move_to([X0, 1.95, 0])
        self.sfx("result")
        self.play(FadeIn(one_ten, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        self.wait(1.5)

        # 3. Three tens ---------------------------------------------------
        self.caption("He makes 3 bundles. That is 3 tens.")
        self.play(FadeOut(one_ten), run_time=0.5, rate_func=ease)
        bars = [bar, ten_bar(BAR_YS[1]), ten_bar(BAR_YS[2])]
        for k in (1, 2):
            self.sfx("number", step=k + 2)
            self.play(FadeIn(bars[k], shift=DOWN * 0.15), run_time=0.8, rate_func=ease)
            self.wait(0.3)
        brace = Brace(VGroup(*bars), RIGHT, color=YELLOW, buff=0.2)
        three_tens = Text("3 tens", font_size=52, weight=BOLD, color=YELLOW).next_to(brace, RIGHT, buff=0.2)
        self.sfx("number", step=4)
        self.play(Create(brace), FadeIn(three_tens, shift=LEFT * 0.1), run_time=0.9, rate_func=ease)
        self.wait(1.4)

        # 4. 30 -----------------------------------------------------------
        self.caption("10 + 10 + 10 = 30. So 3 tens is 30.")
        toks = [("10", TEN_C), ("+", WHITE), ("10", TEN_C), ("+", WHITE), ("10", TEN_C),
                ("=", WHITE), ("30", YELLOW)]
        parts = [Text(t, font_size=62, weight=BOLD, color=c) for t, c in toks]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.22).move_to([0, -0.3, 0])
        for part, (t, _) in zip(parts, toks):
            role = "operation" if t in "+=" else "result" if t == "30" else "number"
            self.sfx(role, step=3)
            self.play(FadeIn(part, shift=UP * 0.1), run_time=0.4, rate_func=ease)
        self.wait(1.0)
        big = Text("3 tens = 30", font_size=84, weight=BOLD, color=YELLOW).move_to([0, -1.9, 0])
        self.sfx("result")
        self.play(FadeIn(big, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6, rate_func=ease)
        self.write_vtt()
