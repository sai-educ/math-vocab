"""Manim scene: "round" (term id 3-nbt-round), 47 is closer to 50 than 40, so it rounds to 50.

Render:  videos/render.sh round_number 3-nbt-round RoundNumber 14
"""
from common import *

NEAR_C, FAR_C, DOT_C = COLORS[2], COLORS[1], YELLOW
X0, UNIT = -3.2, 0.64  # x of 40, width of one step
LINE_Y = 0.2


def px(value):
    return np.array([X0 + (value - 40) * UNIT, LINE_Y, 0])


class RoundNumber(CaptionScene):
    TERM_ID = "3-nbt-round"

    def construct(self):
        # 1. Number line --------------------------------------------------
        self.caption("Let's round 47 to the nearest ten.")
        line = Line(px(40), px(50), color=SOFT, stroke_width=6)
        ticks = VGroup(*[Line(px(v) + UP * 0.14, px(v) + DOWN * 0.14, color=SOFT, stroke_width=3)
                         for v in range(40, 51)])
        l40 = Text("40", font_size=56, weight=BOLD, color=WHITE).next_to(px(40), DOWN, buff=0.35)
        l50 = Text("50", font_size=56, weight=BOLD, color=WHITE).next_to(px(50), DOWN, buff=0.35)
        self.sfx("number", step=2)
        self.play(Create(line), FadeIn(ticks), run_time=1.3, rate_func=ease)
        self.play(FadeIn(l40), FadeIn(l50), run_time=0.7, rate_func=ease)
        dot = Dot(px(47), radius=0.2, color=DOT_C)
        l47 = Text("47", font_size=64, weight=BOLD, color=DOT_C).next_to(px(47), UP, buff=0.4)
        self.sfx("number", step=4)
        self.play(FadeIn(dot, scale=0.5), FadeIn(l47, shift=DOWN * 0.1), run_time=0.9, rate_func=ease)
        self.wait(1.0)

        # 2. Halfway ------------------------------------------------------
        self.caption("45 is halfway between 40 and 50.")
        mid = Line(px(45) + UP * 0.5, px(45) + DOWN * 0.5, color=WHITE, stroke_width=4)
        l45 = Text("45", font_size=48, color=SOFT).next_to(px(45), DOWN, buff=0.35)
        half = Text("halfway", font_size=34, color=SOFT).next_to(l45, DOWN, buff=0.2)
        self.sfx("operation")
        self.play(FadeIn(mid), FadeIn(l45), FadeIn(half, shift=UP * 0.1), run_time=1.1, rate_func=ease)
        self.wait(1.2)

        # 3. Past halfway -------------------------------------------------
        self.caption("47 is past halfway, on the 50 side.")
        near = Line(px(45), px(50), color=NEAR_C, stroke_width=14).set_opacity(0.8)
        self.play(Create(near), run_time=1.2, rate_func=ease)
        self.wait(1.2)

        # 4. Distances ----------------------------------------------------
        self.caption("47 is 3 away from 50. It is 7 away from 40.")
        d3 = DoubleArrow(px(47) + UP * 1.5, px(50) + UP * 1.5, buff=0, color=NEAR_C, stroke_width=5,
                         max_tip_length_to_length_ratio=0.2, tip_length=0.18)
        t3 = Text("3 away", font_size=40, weight=BOLD, color=NEAR_C).next_to(d3, UP, buff=0.12)
        d7 = DoubleArrow(px(40) + UP * 2.4, px(47) + UP * 2.4, buff=0, color=FAR_C, stroke_width=5,
                         max_tip_length_to_length_ratio=0.1, tip_length=0.18)
        t7 = Text("7 away", font_size=40, weight=BOLD, color=FAR_C).next_to(d7, UP, buff=0.12)
        self.sfx("number", step=1)
        self.play(Create(d3), FadeIn(t3, shift=UP * 0.1), run_time=1.2, rate_func=ease)
        self.sfx("number", step=3)
        self.play(Create(d7), FadeIn(t7, shift=UP * 0.1), run_time=1.4, rate_func=ease)
        self.wait(1.0)

        # 5. Round up -----------------------------------------------------
        self.caption("47 is closer to 50, so we round up to 50.")
        self.sfx("result")
        self.play(dot.animate.move_to(px(50)), l47.animate.next_to(px(50), UP, buff=0.4),
                  run_time=2.0, rate_func=ease)
        self.wait(0.6)
        answer = Text("47 rounds to 50", font_size=60, weight=BOLD, color=YELLOW).move_to([0, -2.3, 0])
        self.play(FadeIn(answer, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(line, ticks, l40, l50, dot, l47, mid, l45, half, near, d3, t3, d7, t7, answer)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
