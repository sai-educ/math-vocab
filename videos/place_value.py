"""Manim scene: "place value" (term ids 1/2/3/4-nbt-place-value), 47 then 528.

Render:  videos/render.sh place_value 2-nbt-place-value PlaceValue 14   (copy to the other grade ids)
"""
from common import *

TENS_C, ONES_C, HUND_C = COLORS[0], COLORS[1], COLORS[2]
DIGIT_Y = 2.3


def digit(text, color, x):
    return Text(text, font_size=120, weight=BOLD, color=color).move_to([x, DIGIT_Y, 0])


def tag(text, color, under):
    return Text(text, font_size=34, color=color).next_to(under, DOWN, buff=0.25)


def rod(color):
    cells = VGroup(*[Square(side_length=0.15, color=color, fill_opacity=0.9, stroke_width=0)
                     for _ in range(10)])
    return cells.arrange(DOWN, buff=0.025)


class PlaceValue(CaptionScene):
    TERM_ID = "2-nbt-place-value"

    def construct(self):
        # 1. Two digits ---------------------------------------------------
        self.caption("A digit's value depends on where it sits.")
        four, seven = digit("4", TENS_C, -1.3), digit("7", ONES_C, 1.3)
        self.sfx("number", step=4)
        self.play(FadeIn(four, shift=DOWN * 0.15), run_time=0.7, rate_func=ease)
        self.sfx("number", step=2)
        self.play(FadeIn(seven, shift=DOWN * 0.15), run_time=0.7, rate_func=ease)
        self.wait(0.8)

        # 2. Tens and ones ------------------------------------------------
        self.caption("The 4 is in the tens place. The 7 is in the ones place.")
        tens_t, ones_t = tag("tens", TENS_C, four), tag("ones", ONES_C, seven)
        self.sfx("operation")
        self.play(FadeIn(tens_t, shift=UP * 0.1), run_time=0.6, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(ones_t, shift=UP * 0.1), run_time=0.6, rate_func=ease)
        self.wait(1.0)

        # 3. Show the amounts --------------------------------------------
        self.caption("4 tens is 40. 7 ones is 7.")
        rods = VGroup(*[rod(TENS_C) for _ in range(4)]).arrange(RIGHT, buff=0.22)
        rods.move_to([-1.3, -0.35, 0])
        ones = VGroup(*[Square(side_length=0.2, color=ONES_C, fill_opacity=0.9, stroke_width=0)
                        for _ in range(7)])
        ones.arrange_in_grid(rows=2, cols=4, buff=0.12).move_to([1.3, -0.35, 0])
        for k in range(4):
            self.sfx("number", k * 0.4, step=k)
        self.play(LaggedStart(*[FadeIn(r, shift=DOWN * 0.15) for r in rods], lag_ratio=0.4),
                  run_time=1.6, rate_func=ease)
        for k in range(7):
            self.sfx("tick", k * 0.14)
        self.play(LaggedStart(*[FadeIn(o, scale=0.5) for o in ones], lag_ratio=0.15),
                  run_time=1.3, rate_func=ease)
        forty = Text("40", font_size=60, weight=BOLD, color=TENS_C).move_to([-1.3, -1.9, 0])
        seven_v = Text("7", font_size=60, weight=BOLD, color=ONES_C).move_to([1.3, -1.9, 0])
        self.sfx("result")
        self.play(FadeIn(forty, shift=UP * 0.1), FadeIn(seven_v, shift=UP * 0.1), run_time=0.8, rate_func=ease)
        self.wait(1.2)

        # 4. Add them -----------------------------------------------------
        self.caption("40 + 7 = 47")
        self.play(FadeOut(VGroup(rods, ones, tens_t, ones_t, four, seven)), run_time=0.6, rate_func=ease)
        parts = [Text(t, font_size=76, weight=BOLD, color=c)
                 for t, c in (("40", TENS_C), ("+", WHITE), ("7", ONES_C), ("=", WHITE), ("47", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.3).move_to(UP * 0.4)
        self.play(FadeOut(forty), FadeOut(seven_v), run_time=0.01)
        for part, (role, step) in zip(parts, (("number", 4), ("operation", 0), ("number", 2),
                                              ("operation", 0), ("result", 0))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(1.6)
        self.play(FadeOut(eq), run_time=0.6, rate_func=ease)

        # 5. Bigger numbers -----------------------------------------------
        self.caption("Bigger numbers work the same way.")
        d = [digit("5", HUND_C, -2.2), digit("2", TENS_C, 0), digit("8", ONES_C, 2.2)]
        for i, x in enumerate(d):
            self.sfx("number", i * 0.5, step=[4, 2, 0][i])
        self.play(LaggedStart(*[FadeIn(x, shift=DOWN * 0.15) for x in d], lag_ratio=0.6),
                  run_time=1.6, rate_func=ease)
        names = [tag(t, c, x) for t, c, x in zip(("hundreds", "tens", "ones"),
                                                 (HUND_C, TENS_C, ONES_C), d)]
        self.play(LaggedStart(*[FadeIn(n, shift=UP * 0.1) for n in names], lag_ratio=0.4),
                  run_time=1.3, rate_func=ease)
        self.wait(0.6)
        self.caption("The 5 is worth 500. The 2 is worth 20. The 8 is worth 8.")
        vals = [Text(t, font_size=56, weight=BOLD, color=c).move_to([x.get_x(), -0.2, 0])
                for t, c, x in zip(("500", "20", "8"), (HUND_C, TENS_C, ONES_C), d)]
        for i in range(3):
            self.sfx("number", i * 0.7, step=[4, 2, 0][i])
        self.play(LaggedStart(*[FadeIn(v, shift=UP * 0.12) for v in vals], lag_ratio=0.8),
                  run_time=2.2, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(*d, *names, *vals)), run_time=0.6, rate_func=ease)
        self.write_vtt()
