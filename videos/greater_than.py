"""Manim scene: "greater than" (term id k-cc-greater-than), 7 dots versus 4 dots and 7 > 4.

Render:  videos/render.sh greater_than k-cc-greater-than GreaterThan 14
"""
from common import *

BIG, SMALL = 7, 4
GROUP_Y = 2.5
NUM_Y = 0.5
STEP = 0.62
DOT_R = 0.22
LEFT_X, RIGHT_X = -1.9, 1.9


def group(count, color, cx):
    """Dots in rows of 4, centered on (cx, GROUP_Y)."""
    dots_ = VGroup(*[Dot(radius=DOT_R, color=color) for _ in range(count)])
    dots_.arrange_in_grid(rows=(count + 3) // 4, cols=4, buff=STEP - 2 * DOT_R)
    return dots_.move_to([cx, GROUP_Y, 0])


def greater_sign(color):
    """A '>' drawn as two round-capped strokes (open side faces left)."""
    kw = dict(color=color, stroke_width=14, cap_style=CapStyleType.ROUND)
    return VGroup(Line([-0.4, 0.55, 0], [0.4, 0, 0], **kw), Line([0.4, 0, 0], [-0.4, -0.55, 0], **kw))


class GreaterThan(CaptionScene):
    TERM_ID = "k-cc-greater-than"

    def construct(self):
        # 1. Two groups ---------------------------------------------------
        self.caption("Here are two groups of dots. Which is bigger?")
        left = group(BIG, COLORS[0], LEFT_X)
        right = group(SMALL, COLORS[1], RIGHT_X)
        self.sfx("number", step=4)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in left], lag_ratio=0.1),
                  run_time=1.3, rate_func=ease)
        self.sfx("number", step=2)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in right], lag_ratio=0.1),
                  run_time=1.0, rate_func=ease)
        self.wait(1.0)

        # 2. Numbers ------------------------------------------------------
        self.caption("Count each group. 7 and 4.")
        seven = Text(str(BIG), font_size=100, weight=BOLD, color=COLORS[0]).move_to([LEFT_X, NUM_Y, 0])
        four = Text(str(SMALL), font_size=100, weight=BOLD, color=COLORS[1]).move_to([RIGHT_X, NUM_Y, 0])
        self.sfx("number", step=4)
        self.play(FadeIn(seven, shift=UP * 0.12), run_time=0.6, rate_func=ease)
        self.sfx("number", step=2)
        self.play(FadeIn(four, shift=UP * 0.12), run_time=0.6, rate_func=ease)
        self.wait(1.0)

        # 3. Extras make it bigger ---------------------------------------
        self.caption("The left group has 3 extra dots. It is bigger.")
        extras = VGroup(*left[SMALL:])
        self.play(extras.animate.set_color(YELLOW), run_time=1.0, rate_func=ease)
        more = Text("bigger", font_size=48, weight=BOLD, color=YELLOW).move_to([LEFT_X, -0.5, 0])
        self.sfx("result")
        self.play(FadeIn(more, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(1.6)

        # 4. The sign -----------------------------------------------------
        self.caption("This is the greater than sign. Its mouth opens toward the bigger number.")
        sign = greater_sign(YELLOW).move_to([0, NUM_Y, 0])
        self.sfx("operation")
        self.play(Create(sign), run_time=1.2, rate_func=ease)
        self.wait(2.6)

        # 5. Say it -------------------------------------------------------
        self.caption("7 > 4. Seven is greater than four.")
        say = Text("7 is greater than 4", font_size=48, weight=BOLD).move_to(DOWN * 1.6)
        self.play(FadeIn(say, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(left, right, seven, four, more, sign, say)), run_time=0.6, rate_func=ease)
        self.write_vtt()
