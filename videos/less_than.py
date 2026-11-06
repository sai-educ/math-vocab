"""Manim scene: "less than" (term id k-cc-less-than), 2 birds is less than 9 birds.

Render:  videos/render.sh less_than k-cc-less-than LessThan 12
"""
from common import *

SAM_N, MAYA_N = 2, 9
SAM_C, MAYA_C = COLORS[0], COLORS[1]
SAM_X, MAYA_X = -2.2, 1.7
DOT_Y = 2.35


class LessThan(CaptionScene):
    TERM_ID = "k-cc-less-than"

    def construct(self):
        # 1. Two groups ---------------------------------------------------
        self.caption("Sam counts 2 birds. Maya counts 9 birds.")
        sam = dots(SAM_N, SAM_C, [SAM_X, DOT_Y, 0])
        maya = VGroup(*[Dot(radius=0.2, color=MAYA_C) for _ in range(MAYA_N)])
        maya.arrange_in_grid(rows=3, cols=3, buff=0.2).move_to([MAYA_X, DOT_Y, 0])
        for k in range(SAM_N):
            self.sfx("tick", 0.2 + k * 0.3)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in sam], lag_ratio=0.5),
                  run_time=1.2, rate_func=ease)
        for k in range(MAYA_N):
            self.sfx("tick", 0.2 + k * 0.12)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in maya], lag_ratio=0.15),
                  run_time=1.8, rate_func=ease)
        names = [Text(t, font_size=44, color=c).move_to([x, 0.85, 0])
                 for t, c, x in (("Sam", SAM_C, SAM_X), ("Maya", MAYA_C, MAYA_X))]
        nums = [Text(str(n), font_size=84, weight=BOLD, color=c).move_to([x, 0.1, 0])
                for n, c, x in ((SAM_N, SAM_C, SAM_X), (MAYA_N, MAYA_C, MAYA_X))]
        self.sfx("number", step=1)
        self.play(FadeIn(names[0]), FadeIn(nums[0], shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.sfx("number", step=4)
        self.play(FadeIn(names[1]), FadeIn(nums[1], shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(0.8)

        # 2. The smaller one ----------------------------------------------
        self.caption("Sam has fewer. Sam's number is the smaller one.")
        ring = SurroundingRectangle(sam, color=YELLOW, buff=0.28, corner_radius=0.2, stroke_width=5)
        small = Text("smaller", font_size=48, weight=BOLD, color=YELLOW).move_to([SAM_X, -0.7, 0])
        self.sfx("operation")
        self.play(Create(ring), FadeIn(small, shift=UP * 0.1), run_time=1.1, rate_func=ease)
        self.wait(1.8)

        # 3. The sign -----------------------------------------------------
        self.caption("2 is less than 9. We write 2 < 9.")
        y = -1.9
        two = Text("2", font_size=96, weight=BOLD, color=SAM_C).move_to([-1.9, y, 0])
        nine = Text("9", font_size=96, weight=BOLD, color=MAYA_C).move_to([1.9, y, 0])
        sign = Text("<", font_size=110, weight=BOLD, color=YELLOW).move_to([-0.3, y, 0])
        self.sfx("number", step=1)
        self.play(FadeIn(two, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(sign, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.sfx("number", step=4)
        self.play(FadeIn(nine, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(1.2)

        # 4. Open mouth ---------------------------------------------------
        self.caption("The open side of the sign faces the bigger number.")
        arrow = Arrow([0.3, y, 0], [1.1, y, 0], color=YELLOW, buff=0, stroke_width=6,
                      max_tip_length_to_length_ratio=0.5)
        self.play(FadeIn(arrow, shift=RIGHT * 0.15), run_time=0.8, rate_func=ease)
        self.wait(3.0)

        self.caption(None)
        self.play(FadeOut(VGroup(sam, maya, *names, *nums, ring, small, two, nine, sign, arrow)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
