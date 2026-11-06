"""Manim scene: "even number" (term id 2-oa-even-number), 6 and 8 split into two equal groups.

Render:  videos/render.sh even_number 2-oa-even-number EvenNumber 12
"""
from common import *

LEFT_X, RIGHT_X = -1.1, 1.1
RADIUS = 0.28


class EvenNumber(CaptionScene):
    TERM_ID = "2-oa-even-number"

    def deal(self, n, row_y, top_y, gap, label_y):
        half = n // 2
        row = dots(n, WHITE, [0, row_y, 0], step=0.9, radius=RADIUS)
        self.sfx("number", step=min(n // 2, 5))
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.15),
                  run_time=1.4, rate_func=ease)
        self.wait(0.8)

        self.caption("Split them into two equal groups.")
        ys = [top_y - i * gap for i in range(half)]
        targets = [[LEFT_X, y, 0] for y in ys] + [[RIGHT_X, y, 0] for y in ys]
        for i in range(half):
            self.sfx("tick", 0.25 + i * 0.12)
        self.play(*[d.animate.move_to(t) for d, t in zip(row, targets)], run_time=1.8, rate_func=ease)
        left, right = VGroup(*row[:half]), VGroup(*row[half:])
        self.play(left.animate.set_color(COLORS[0]), right.animate.set_color(COLORS[1]),
                  run_time=0.8, rate_func=ease)
        pairs = VGroup(*[Line([LEFT_X + RADIUS + 0.08, y, 0], [RIGHT_X - RADIUS - 0.08, y, 0],
                              color=SOFT, stroke_width=3, stroke_opacity=0.7) for y in ys])
        self.play(FadeIn(pairs), run_time=0.8, rate_func=ease)
        counts = VGroup(Text(str(half), font_size=64, weight=BOLD, color=COLORS[0]).move_to([LEFT_X, label_y, 0]),
                        Text(str(half), font_size=64, weight=BOLD, color=COLORS[1]).move_to([RIGHT_X, label_y, 0]))
        self.sfx("number", step=min(half, 5))
        self.play(FadeIn(counts, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        return VGroup(row, pairs, counts)

    def construct(self):
        # 1. Six dots -------------------------------------------------------
        self.caption("Here are 6 dots.")
        stuff = self.deal(6, 2.8, 1.6, 0.8, -0.95)
        self.caption("3 and 3. Nothing is left over.")
        self.wait(2.0)
        self.caption("So 6 is an even number.")
        verdict = Text("6 is even", font_size=76, weight=BOLD, color=YELLOW).move_to([0, -2.2, 0])
        self.sfx("result")
        self.play(FadeIn(verdict, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.0)
        self.play(FadeOut(stuff), FadeOut(verdict), run_time=0.7, rate_func=ease)

        # 2. Eight socks ----------------------------------------------------
        self.caption("Maya pairs up 8 socks.")
        stuff = self.deal(8, 2.8, 1.7, 0.7, -1.25)
        self.caption("She makes 4 pairs with nothing left over.")
        self.wait(2.2)
        self.caption("So 8 is even too.")
        verdict = Text("8 is even", font_size=76, weight=BOLD, color=YELLOW).move_to([0, -2.4, 0])
        self.sfx("result")
        self.play(FadeIn(verdict, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.0)

        self.caption(None)
        self.play(FadeOut(stuff), FadeOut(verdict), run_time=0.6, rate_func=ease)
        self.write_vtt()
