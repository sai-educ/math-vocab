"""Manim scene: "odd number" (term id 2-oa-odd-number), 7 splits into 3 and 3 with 1 left over.

Render:  videos/render.sh odd_number 2-oa-odd-number OddNumber 12
"""
from common import *

LEFT_X, RIGHT_X = -1.1, 1.1
RADIUS = 0.28
ROWS = [1.9, 1.1, 0.3]


class OddNumber(CaptionScene):
    TERM_ID = "2-oa-odd-number"

    def construct(self):
        # 1. Seven crackers -------------------------------------------------
        self.caption("Leo has 7 crackers.")
        row = dots(7, WHITE, [0, 2.9, 0], step=0.9, radius=RADIUS)
        self.sfx("number", step=4)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.15),
                  run_time=1.6, rate_func=ease)
        self.wait(1.0)

        # 2. Try to make pairs ----------------------------------------------
        self.caption("He tries to split them into two equal groups.")
        targets = [[LEFT_X, y, 0] for y in ROWS] + [[0, -0.85, 0]] + [[RIGHT_X, y, 0] for y in ROWS]
        for i in range(3):
            self.sfx("tick", 0.25 + i * 0.12)
        self.play(*[d.animate.move_to(t) for d, t in zip(row, targets)], run_time=1.8, rate_func=ease)
        left, right, extra = VGroup(*row[:3]), VGroup(*row[4:]), row[3]
        self.play(left.animate.set_color(COLORS[0]), right.animate.set_color(COLORS[1]),
                  run_time=0.8, rate_func=ease)
        pairs = VGroup(*[Line([LEFT_X + RADIUS + 0.08, y, 0], [RIGHT_X - RADIUS - 0.08, y, 0],
                              color=SOFT, stroke_width=3, stroke_opacity=0.7) for y in ROWS])
        self.play(FadeIn(pairs), run_time=0.8, rate_func=ease)
        counts = VGroup(Text("3", font_size=64, weight=BOLD, color=COLORS[0]).move_to([LEFT_X - 0.9, -0.85, 0]),
                        Text("3", font_size=64, weight=BOLD, color=COLORS[1]).move_to([RIGHT_X + 0.9, -0.85, 0]))
        self.sfx("number", step=2)
        self.play(FadeIn(counts, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        self.wait(0.8)

        # 3. One left over --------------------------------------------------
        self.caption("3 and 3, and 1 is left alone.")
        ring = Circle(radius=0.48, color=YELLOW, stroke_width=6).move_to(extra)
        self.sfx("operation")
        self.play(extra.animate.set_color(YELLOW), Create(ring), run_time=1.0, rate_func=ease)
        note = Text("1 left over", font_size=60, weight=BOLD, color=YELLOW).move_to([0, -2.1, 0])
        self.play(FadeIn(note, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.0)

        # 4. Odd ------------------------------------------------------------
        self.caption("So 7 is an odd number.")
        verdict = Text("7 is odd", font_size=76, weight=BOLD, color=YELLOW).move_to([0, -2.1, 0])
        self.sfx("result")
        self.play(FadeOut(note), FadeIn(verdict, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6, rate_func=ease)
        self.write_vtt()
