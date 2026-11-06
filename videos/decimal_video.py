"""Manim scene: "decimal" (term id 4-nf-decimal), 0.3 on a tenths bar.

Render:  videos/render.sh decimal 4-nf-decimal DecimalVideo 14
"""
from common import *

CELLS, SHADED = 10, 3
BAR_W, BAR_H = 6.4, 0.95
BAR_Y = 0.2
DIGIT_Y = 2.75
TENTHS_C, WHOLE_C = COLORS[1], COLORS[0]


class DecimalVideo(CaptionScene):
    TERM_ID = "4-nf-decimal"

    def construct(self):
        left = -BAR_W / 2
        step = BAR_W / CELLS

        # 1. One whole cut in 10 ----------------------------------------
        self.caption("A decimal shows parts smaller than one.")
        bar = Rectangle(width=BAR_W, height=BAR_H, color=WHITE, stroke_width=5).move_to([0, BAR_Y, 0])
        whole = Text("1 whole", font_size=40, color=SOFT).next_to(bar, DOWN, buff=0.35)
        self.sfx("number", step=1)
        self.play(FadeIn(bar, scale=0.95), FadeIn(whole, shift=UP * 0.1), run_time=1.0, rate_func=ease)
        self.wait(1.0)

        self.caption("Cut the whole into 10 equal parts.")
        cuts = [Line([left + step * i, BAR_Y - BAR_H / 2, 0], [left + step * i, BAR_Y + BAR_H / 2, 0],
                     color=WHITE, stroke_width=4) for i in range(1, CELLS)]
        for k in range(3):
            self.sfx("number", k * 0.5, step=k)
        self.play(LaggedStart(*[Create(c) for c in cuts], lag_ratio=0.2), run_time=1.8, rate_func=ease)
        tenth = Text("each part is a tenth", font_size=40, color=SOFT).move_to(whole)
        self.play(FadeOut(whole), FadeIn(tenth), run_time=0.8, rate_func=ease)
        self.wait(1.0)

        # 2. Shade 3 ------------------------------------------------------
        self.caption("Shade 3 of the 10 parts.")
        fills = [Rectangle(width=step - 0.1, height=BAR_H - 0.1, stroke_width=0,
                           fill_color=TENTHS_C, fill_opacity=0.9).move_to([left + step * (i + 0.5), BAR_Y, 0])
                 for i in range(SHADED)]
        for k in range(SHADED):
            self.sfx("number", k * 0.5, step=k + 1)
        self.play(LaggedStart(*[FadeIn(f, scale=0.9) for f in fills], lag_ratio=0.5),
                  run_time=2.0, rate_func=ease)
        self.wait(1.0)

        # 3. Write it -----------------------------------------------------
        self.caption("We write 3 tenths as 0.3.")
        zero = Text("0", font_size=130, weight=BOLD, color=WHOLE_C).move_to([-1.0, DIGIT_Y, 0])
        point = Text(".", font_size=130, weight=BOLD, color=WHITE).move_to([0.0, DIGIT_Y - 0.3, 0])
        three = Text("3", font_size=130, weight=BOLD, color=TENTHS_C).move_to([1.0, DIGIT_Y, 0])
        self.sfx("number", step=4)
        self.play(FadeIn(zero, shift=DOWN * 0.15), run_time=0.6, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(point, shift=DOWN * 0.15), run_time=0.6, rate_func=ease)
        self.sfx("number", step=2)
        self.play(FadeIn(three, shift=DOWN * 0.15), run_time=0.6, rate_func=ease)
        self.wait(1.0)

        # 4. The dot separates -------------------------------------------
        self.caption("The dot separates wholes from parts.")
        wholes_t = Text("wholes", font_size=44, color=WHOLE_C).next_to(zero, DOWN, buff=0.15).shift(LEFT * 0.5)
        parts_t = Text("tenths", font_size=44, color=TENTHS_C).next_to(three, DOWN, buff=0.15).shift(RIGHT * 0.5)
        self.play(point.animate.set_color(YELLOW), FadeIn(wholes_t, shift=UP * 0.1),
                  FadeIn(parts_t, shift=UP * 0.1), run_time=1.0, rate_func=ease)
        self.wait(2.0)

        self.caption("0.3 means 0 wholes and 3 tenths.")
        self.sfx("result")
        self.wait(3.0)

        self.caption(None)
        self.play(FadeOut(VGroup(bar, tenth, *cuts, *fills, zero, point, three, wholes_t, parts_t)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
