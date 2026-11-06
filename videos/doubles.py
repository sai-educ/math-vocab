"""Manim scene: "doubles" (term id 1-oa-doubles), 4 + 4 = 8.

Render:  videos/render.sh doubles 1-oa-doubles Doubles 14
"""
from common import *

N = 4
RED_C, BLUE_C = COLORS[1], COLORS[0]
LEFT_X, RIGHT_X = -1.7, 1.7
GROUP_Y = 2.3


def group(color, x):
    g = VGroup(*[Dot(radius=0.26, color=color) for _ in range(N)])
    return g.arrange_in_grid(rows=2, cols=2, buff=0.28).move_to([x, GROUP_Y, 0])


class Doubles(CaptionScene):
    TERM_ID = "1-oa-doubles"

    def construct(self):
        # 1. Red beads ----------------------------------------------------
        self.caption("Nina has 4 red beads.")
        left = group(RED_C, LEFT_X)
        for k in range(N):
            self.sfx("tick", 0.2 + k * 0.15)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in left], lag_ratio=0.2),
                  run_time=1.4, rate_func=ease)
        self.wait(0.6)

        # 2. Blue beads, a mirror -----------------------------------------
        self.caption("She has 4 blue beads too. The two groups match.")
        mirror = DashedLine([0, 3.4, 0], [0, 1.2, 0], color=SOFT, stroke_width=4)
        right = group(BLUE_C, RIGHT_X)
        self.play(Create(mirror), run_time=0.8, rate_func=ease)
        for k in range(N):
            self.sfx("tick", 0.2 + k * 0.15)
        self.play(TransformFromCopy(left, right), run_time=1.6, rate_func=ease)
        four_l = Text("4", font_size=84, weight=BOLD, color=RED_C).move_to([LEFT_X, 0.45, 0])
        four_r = Text("4", font_size=84, weight=BOLD, color=BLUE_C).move_to([RIGHT_X, 0.45, 0])
        self.sfx("number", step=3)
        self.play(FadeIn(four_l, shift=UP * 0.1), run_time=0.5, rate_func=ease)
        self.sfx("number", step=3)
        self.play(FadeIn(four_r, shift=UP * 0.1), run_time=0.5, rate_func=ease)
        self.wait(1.0)

        # 3. A double -----------------------------------------------------
        self.caption("A double adds a number to itself.")
        word = Text("double", font_size=56, weight=BOLD, color=YELLOW).move_to([0, -0.7, 0])
        self.sfx("operation")
        self.play(FadeIn(word, shift=UP * 0.1), run_time=0.8, rate_func=ease)
        self.wait(1.8)

        # 4. Equation -----------------------------------------------------
        self.caption("4 + 4 = 8. Nina knows it right away.")
        y = -1.9
        xs = [-2.4, -1.2, 0.0, 1.2, 2.4]
        toks = [("4", RED_C, "number", 3), ("+", WHITE, "operation", 0), ("4", BLUE_C, "number", 3),
                ("=", WHITE, "operation", 0), ("8", YELLOW, "result", 0)]
        parts = [Text(t, font_size=84, weight=BOLD, color=c).move_to([x, y, 0])
                 for (t, c, _, _), x in zip(toks, xs)]
        for part, (_, _, role, step) in zip(parts, toks):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(3.0)

        self.caption(None)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6, rate_func=ease)
        self.write_vtt()
