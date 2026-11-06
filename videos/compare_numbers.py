"""Manim scene: "compare numbers" (term id 2-nbt-compare-numbers), 342 vs 328 by place value.

Render:  videos/render.sh compare_numbers 2-nbt-compare-numbers CompareNumbers 14
"""
from common import *

HUND_C, TENS_C, ONES_C = COLORS[2], COLORS[0], COLORS[1]
COL_COLORS = (HUND_C, TENS_C, ONES_C)
XS = [-2.3, 0, 2.3]
HEAD_Y, ROW_A, ROW_B, MID_Y = 3.1, 1.7, -0.2, 0.75


def digit_row(text, y):
    return VGroup(*[Text(t, font_size=100, weight=BOLD, color=c).move_to([x, y, 0])
                    for t, c, x in zip(text, COL_COLORS, XS)])


def column_box(index):
    return RoundedRectangle(corner_radius=0.15, width=1.9, height=3.9, color=YELLOW, stroke_width=5) \
        .move_to([XS[index], (ROW_A + ROW_B) / 2, 0])


class CompareNumbers(CaptionScene):
    TERM_ID = "2-nbt-compare-numbers"

    def construct(self):
        # 1. Two numbers --------------------------------------------------
        self.caption("Which is bigger, 342 or 328?")
        a_whole = Text("342", font_size=100, weight=BOLD, color=WHITE).move_to([0, ROW_A, 0])
        b_whole = Text("328", font_size=100, weight=BOLD, color=WHITE).move_to([0, ROW_B, 0])
        self.sfx("number", step=4)
        self.play(FadeIn(a_whole, shift=DOWN * 0.15), run_time=0.8, rate_func=ease)
        self.sfx("number", step=3)
        self.play(FadeIn(b_whole, shift=DOWN * 0.15), run_time=0.8, rate_func=ease)
        self.wait(1.0)

        # 2. Place value columns -----------------------------------------
        self.caption("Line up the places.")
        a, b = digit_row("342", ROW_A), digit_row("328", ROW_B)
        heads = VGroup(*[Text(t, font_size=38, color=c).move_to([x, HEAD_Y, 0])
                         for t, c, x in zip(("hundreds", "tens", "ones"), COL_COLORS, XS)])
        seps = VGroup(*[Line([x, 3.5, 0], [x, -1.2, 0], color=SOFT, stroke_width=2).set_opacity(0.35)
                        for x in (-1.15, 1.15)])
        self.play(ReplacementTransform(a_whole, a), ReplacementTransform(b_whole, b),
                  FadeIn(heads, shift=UP * 0.1), FadeIn(seps), run_time=1.6, rate_func=ease)
        self.wait(0.8)

        # 3. Hundreds -----------------------------------------------------
        self.caption("Start with the hundreds. 3 and 3 are the same.")
        box = column_box(0)
        eq1 = Text("=", font_size=64, weight=BOLD, color=YELLOW).move_to([XS[0], MID_Y, 0])
        self.play(Create(box), run_time=1.0, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(eq1), run_time=0.7, rate_func=ease)
        self.wait(1.2)

        # 4. Tens ---------------------------------------------------------
        self.caption("They match, so check the tens.")
        new_box = column_box(1)
        self.play(FadeOut(box), FadeIn(new_box), run_time=1.2, rate_func=ease)
        box = new_box
        self.wait(0.8)
        self.caption("4 tens is more than 2 tens.")
        gt = Text(">", font_size=72, weight=BOLD, color=YELLOW).move_to([XS[1], MID_Y, 0])
        self.sfx("result")
        self.play(FadeIn(gt), run_time=0.8, rate_func=ease)
        self.play(a[2].animate.set_opacity(0.3), b[2].animate.set_opacity(0.3),
                  heads[2].animate.set_opacity(0.3), run_time=1.0, rate_func=ease)
        self.wait(1.0)

        # 5. Answer -------------------------------------------------------
        self.caption("So 342 is bigger than 328.")
        answer = Text("342 > 328", font_size=84, weight=BOLD, color=YELLOW).move_to([0, -2.1, 0])
        self.sfx("result")
        self.play(FadeIn(answer, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(a, b, heads, seps, box, eq1, gt, answer)), run_time=0.6, rate_func=ease)
        self.write_vtt()
