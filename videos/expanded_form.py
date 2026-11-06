"""Manim scene: "expanded form" (term id 2-nbt-expanded-form), 346 = 300 + 40 + 6.

Render:  videos/render.sh expanded_form 2-nbt-expanded-form ExpandedForm 14
"""
from common import *

HUND_C, TENS_C, ONES_C = COLORS[2], COLORS[0], COLORS[1]
XS = [-2.3, 0, 2.3]
DIGIT_Y = 2.6


def picture_for(kind, color, x, y):
    """Small block picture: hundreds squares, tens rods, or ones dots."""
    if kind == "h":
        items = [Square(side_length=0.4, color=color, fill_opacity=0.9, stroke_width=0) for _ in range(3)]
        return VGroup(*items).arrange(RIGHT, buff=0.1).move_to([x, y, 0])
    if kind == "t":
        items = [Rectangle(width=0.12, height=0.7, color=color, fill_opacity=0.9, stroke_width=0)
                 for _ in range(4)]
        return VGroup(*items).arrange(RIGHT, buff=0.14).move_to([x, y, 0])
    items = [Dot(radius=0.11, color=color) for _ in range(6)]
    return VGroup(*items).arrange_in_grid(rows=2, cols=3, buff=0.14).move_to([x, y, 0])


class ExpandedForm(CaptionScene):
    TERM_ID = "2-nbt-expanded-form"

    def construct(self):
        # 1. The number ---------------------------------------------------
        self.caption("Let's take apart 346.")
        whole = Text("346", font_size=120, weight=BOLD, color=WHITE).move_to([0, DIGIT_Y, 0])
        self.sfx("number", step=4)
        self.play(FadeIn(whole, shift=DOWN * 0.15), run_time=0.9, rate_func=ease)
        self.wait(0.8)

        digits = VGroup(*[Text(t, font_size=120, weight=BOLD, color=c).move_to([x, DIGIT_Y, 0])
                          for t, c, x in zip("346", (HUND_C, TENS_C, ONES_C), XS)])
        self.play(ReplacementTransform(whole, digits), run_time=1.0, rate_func=ease)

        # 2. Place names --------------------------------------------------
        self.caption("Each digit has a place.")
        names = VGroup(*[Text(t, font_size=36, color=c).move_to([d.get_x(), DIGIT_Y - 1.0, 0])
                         for t, c, d in zip(("hundreds", "tens", "ones"), (HUND_C, TENS_C, ONES_C), digits)])
        self.play(LaggedStart(*[FadeIn(n, shift=UP * 0.1) for n in names], lag_ratio=0.4),
                  run_time=1.4, rate_func=ease)
        self.wait(0.8)

        # 3. What each is worth ------------------------------------------
        self.caption("The 3 is worth 300. The 4 is worth 40. The 6 is worth 6.")
        vals = VGroup(*[Text(t, font_size=64, weight=BOLD, color=c).move_to([x, 0.2, 0])
                        for t, c, x in zip(("300", "40", "6"), (HUND_C, TENS_C, ONES_C), XS)])
        pics = VGroup(picture_for("h", HUND_C, XS[0], -1.1), picture_for("t", TENS_C, XS[1], -1.1),
                      picture_for("o", ONES_C, XS[2], -1.1))
        for i in range(3):
            self.sfx("number", i * 1.2, step=[4, 2, 0][i])
            self.play(FadeIn(vals[i], shift=UP * 0.12), FadeIn(pics[i], shift=UP * 0.12),
                      run_time=1.0, rate_func=ease)
            self.wait(0.2)
        self.wait(0.6)

        # 4. Add them -----------------------------------------------------
        self.caption("Write them as a sum: 300 + 40 + 6.")
        pluses = VGroup(*[Text("+", font_size=64, weight=BOLD, color=WHITE).move_to([x, 0.2, 0])
                          for x in (-1.0, 1.15)])
        for k in range(2):
            self.sfx("operation", k * 0.5)
        self.play(FadeOut(names), FadeOut(pics), LaggedStart(*[FadeIn(p) for p in pluses], lag_ratio=0.6),
                  run_time=1.4, rate_func=ease)
        self.wait(0.8)

        eq = Text("=", font_size=64, weight=BOLD, color=YELLOW).move_to([0, 1.4, 0])
        self.sfx("result")
        self.play(FadeIn(eq), run_time=0.8, rate_func=ease)
        self.wait(0.8)

        # 5. Name ---------------------------------------------------------
        self.caption("This is expanded form.")
        tag = Text("expanded form", font_size=52, weight=BOLD, color=YELLOW).move_to([0, -1.6, 0])
        self.play(FadeIn(tag, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(digits, vals, pluses, eq, tag)), run_time=0.6, rate_func=ease)
        self.write_vtt()
