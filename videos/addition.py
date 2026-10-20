"""Manim scene: "addition" (term id 2-oa-addition), 5 + 3 = 8.

Render:  videos/render.sh addition 2-oa-addition Addition 12
"""
from common import *

A, B = 5, 3
ROW_Y = 1.3


class Addition(CaptionScene):
    TERM_ID = "2-oa-addition"

    def construct(self):
        # 1. Two groups ---------------------------------------------------
        self.caption("Addition puts amounts together.")
        left = dots(A, COLORS[0], [-1.9, ROW_Y, 0])
        right = dots(B, COLORS[1], [2.5, ROW_Y, 0])
        left_n = Text(str(A), font_size=64, weight=BOLD, color=COLORS[0]).next_to(left, UP, buff=0.5)
        right_n = Text(str(B), font_size=64, weight=BOLD, color=COLORS[1]).next_to(right, UP, buff=0.5)
        self.sfx("number", step=4)
        self.play(FadeIn(left_n, shift=DOWN * 0.12),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in left], lag_ratio=0.12),
                  run_time=1.3, rate_func=ease)
        self.wait(0.4)
        self.sfx("number", step=2)
        self.play(FadeIn(right_n, shift=DOWN * 0.12),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in right], lag_ratio=0.12),
                  run_time=1.1, rate_func=ease)
        self.wait(1.0)

        # 2. Join them ----------------------------------------------------
        self.caption("Join the two groups into one.")
        joined = dots(A + B, WHITE, [0, ROW_Y, 0])
        everyone = VGroup(*left, *right)
        self.play(FadeOut(left_n), FadeOut(right_n), run_time=0.5, rate_func=ease)
        self.play(*[d.animate.move_to(t.get_center()) for d, t in zip(everyone, joined)],
                  run_time=1.6, rate_func=ease)
        self.wait(0.8)

        # 3. Count the total ----------------------------------------------
        self.caption("Count them all to find the total.")
        nums = VGroup(*[Text(str(i + 1), font_size=34, color=SOFT).next_to(d, DOWN, buff=0.2)
                        for i, d in enumerate(everyone)])
        for i in range(A + B):
            self.sfx("tick", i * 0.28)
        self.play(LaggedStart(*[FadeIn(n, shift=UP * 0.08) for n in nums], lag_ratio=1.0),
                  run_time=0.28 * (A + B), rate_func=ease)
        brace = Brace(everyone, UP, color=YELLOW, buff=0.2)
        total = Text("total: 8", font_size=40, weight=BOLD, color=YELLOW).next_to(brace, UP, buff=0.15)
        self.sfx("result")
        self.play(GrowFromCenter(brace), FadeIn(total, shift=DOWN * 0.12),
                  run_time=0.9, rate_func=ease)
        self.wait(1.2)

        # 4. Write it as a number sentence --------------------------------
        self.caption("5 + 3 = 8. Five plus three equals eight.")
        parts = [Text(t, font_size=70, weight=BOLD, color=c)
                 for t, c in (("5", COLORS[0]), ("+", WHITE), ("3", COLORS[1]),
                              ("=", WHITE), ("8", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.35).move_to(DOWN * 1.9)
        for part, (role, step) in zip(parts, (("number", 4), ("operation", 0), ("number", 2),
                                              ("operation", 0), ("result", 0))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.0)

        self.caption(None)
        self.play(FadeOut(VGroup(everyone, nums, brace, total, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
