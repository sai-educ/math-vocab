"""Manim scene: "repeated addition" (term id 2-oa-repeated-addition), 3 + 3 + 3 + 3 = 12.

Render:  videos/render.sh repeated_addition 2-oa-repeated-addition RepeatedAddition 12
"""
from common import *

GROUPS, PER = 4, 3
PLATE_R = 0.7
SPACING = 1.75
PLATE_Y = 2.0
NUM_Y = 0.5
GRAPE = "#b58cff"


class RepeatedAddition(CaptionScene):
    TERM_ID = "2-oa-repeated-addition"

    def construct(self):
        xs = [(g - (GROUPS - 1) / 2) * SPACING for g in range(GROUPS)]

        def plate(x):
            return Circle(radius=PLATE_R, color=SOFT, stroke_width=4,
                          fill_color=SOFT, fill_opacity=0.12).move_to([x, PLATE_Y, 0])

        def grapes(x):
            tri = VGroup(*[Dot(radius=0.17, color=GRAPE) for _ in range(PER)])
            tri[0].move_to([x, PLATE_Y + 0.22, 0])
            tri[1].move_to([x - 0.22, PLATE_Y - 0.17, 0])
            tri[2].move_to([x + 0.22, PLATE_Y - 0.17, 0])
            return tri

        # 1. Idea ---------------------------------------------------------
        self.caption("Repeated addition: add the same number again and again.")
        self.wait(2.2)

        # 2. Plates one at a time ----------------------------------------
        self.caption("Nina puts 3 grapes on each plate.")
        all_plates, all_grapes, nums, signs = [], [], [], []
        for g, x in enumerate(xs):
            p, gr = plate(x), grapes(x)
            n = Text("3", font_size=72, weight=BOLD, color=COLORS[g % 3 if g < 3 else 0])
            n.move_to([x, NUM_Y, 0])
            self.sfx("number", step=g + 1)
            anims = [FadeIn(p, scale=0.9),
                     LaggedStart(*[FadeIn(d, scale=0.5) for d in gr], lag_ratio=0.25),
                     FadeIn(n, shift=UP * 0.12)]
            if g > 0:
                s = Text("+", font_size=72, weight=BOLD, color=YELLOW)
                s.move_to([(xs[g - 1] + x) / 2, NUM_Y, 0])
                self.sfx("operation")
                anims.append(FadeIn(s))
                signs.append(s)
            self.play(*anims, run_time=1.1, rate_func=ease)
            all_plates.append(p)
            all_grapes.append(gr)
            nums.append(n)
            self.wait(0.5)
        self.wait(0.6)

        # 3. The sum ------------------------------------------------------
        self.caption("Add 3 + 3 + 3 + 3.")
        row = VGroup(*nums, *signs)
        box = SurroundingRectangle(row, buff=0.25, corner_radius=0.2, color=YELLOW, stroke_width=4)
        self.play(Create(box), run_time=0.9, rate_func=ease)
        self.wait(1.2)
        self.play(FadeOut(box), run_time=0.5, rate_func=ease)

        # 4. Answer -------------------------------------------------------
        self.caption("3 + 3 + 3 + 3 = 12 grapes.")
        eq = Text("=", font_size=84, weight=BOLD)
        twelve = Text("12", font_size=96, weight=BOLD, color=YELLOW)
        ans = VGroup(eq, twelve).arrange(RIGHT, buff=0.4).move_to(DOWN * 1.1)
        self.sfx("operation")
        self.play(FadeIn(eq, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.sfx("result")
        self.play(FadeIn(twelve, shift=UP * 0.12), run_time=0.6, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(*all_plates, *all_grapes, *nums, *signs, ans)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
