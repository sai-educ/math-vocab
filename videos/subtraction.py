"""Manim scene: "subtraction" (term id 1-oa-subtraction), 9 - 4 = 5.

Render:  videos/render.sh subtraction 1-oa-subtraction Subtraction 8
"""
from common import *

START, TAKE = 9, 4
ROW_Y = 1.3


class Subtraction(CaptionScene):
    TERM_ID = "1-oa-subtraction"

    def construct(self):
        # 1. Start amount -------------------------------------------------
        self.caption("Subtraction takes an amount away.")
        row = dots(START, COLORS[0], [0, ROW_Y, 0])
        start_n = Text(str(START), font_size=64, weight=BOLD, color=COLORS[0]).next_to(row, UP, buff=0.5)
        self.sfx("number", step=5)
        self.play(FadeIn(start_n, shift=DOWN * 0.12),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.1),
                  run_time=1.5, rate_func=ease)
        self.wait(1.0)

        # 2. Take some away -----------------------------------------------
        self.caption("Take 4 away.")
        gone = VGroup(*row[START - TAKE:])
        kept = VGroup(*row[:START - TAKE])
        for i in range(TAKE):
            self.sfx("tick", i * 0.4)
        self.play(LaggedStart(*[d.animate.set_color(GREY_D).set_opacity(0.45) for d in gone],
                              lag_ratio=0.45),
                  run_time=1.9, rate_func=ease)
        crosses = VGroup(*[Cross(d, stroke_color=PINK, stroke_width=5, scale_factor=0.9) for d in gone])
        take_n = Text("−4", font_size=44, weight=BOLD, color=COLORS[1]).next_to(gone, UP, buff=0.4)
        self.sfx("operation")
        self.play(Create(crosses), FadeIn(take_n, shift=DOWN * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.0)

        # 3. What is left -------------------------------------------------
        self.caption("Count what is left.")
        for i in range(START - TAKE):
            self.sfx("tick", i * 0.3)
        self.play(FadeOut(gone), FadeOut(crosses), FadeOut(take_n), FadeOut(start_n),
                  run_time=0.8, rate_func=ease)
        self.play(kept.animate.move_to([0, ROW_Y, 0]), run_time=0.8, rate_func=ease)
        nums = VGroup(*[Text(str(i + 1), font_size=34, color=SOFT).next_to(d, DOWN, buff=0.2)
                        for i, d in enumerate(kept)])
        self.play(LaggedStart(*[FadeIn(n, shift=UP * 0.08) for n in nums], lag_ratio=1.0),
                  run_time=0.3 * (START - TAKE), rate_func=ease)
        brace = Brace(kept, UP, color=YELLOW, buff=0.2)
        left_t = Text("left: 5", font_size=40, weight=BOLD, color=YELLOW).next_to(brace, UP, buff=0.15)
        self.sfx("result")
        self.play(GrowFromCenter(brace), FadeIn(left_t, shift=DOWN * 0.12), run_time=0.9, rate_func=ease)
        self.wait(1.2)

        # 4. Number sentence ----------------------------------------------
        self.caption("9 − 4 = 5. Nine minus four equals five.")
        parts = [Text(t, font_size=70, weight=BOLD, color=c)
                 for t, c in (("9", COLORS[0]), ("−", WHITE), ("4", COLORS[1]),
                              ("=", WHITE), ("5", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.35).move_to(DOWN * 1.9)
        for part, (role, step) in zip(parts, (("number", 5), ("operation", 0), ("number", 3),
                                              ("operation", 0), ("result", 0))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.0)

        self.caption(None)
        self.play(FadeOut(VGroup(kept, nums, brace, left_t, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
