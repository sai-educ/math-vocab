"""Manim scene: "positive number" (term id 2-md-positive-number), right of zero on a -5..5 line.

Render:  videos/render.sh positive_number 2-md-positive-number PositiveNumber 9
"""
from number_line_kit import *

GREEN = COLORS[2]


class PositiveNumber(CaptionScene):
    TERM_ID = "2-md-positive-number"

    def construct(self):
        nl = NLine(-5, 5, 0.66, 1.0)

        # 1. The line ------------------------------------------------------
        self.caption("Here is a number line from negative 5 to 5.")
        self.play(Create(nl.axis), FadeIn(nl.ticks), run_time=1.2, rate_func=ease)
        self.play(FadeIn(nl.labels), run_time=1.2, rate_func=ease)
        self.wait(0.8)

        # 2. Zero ----------------------------------------------------------
        self.caption("Zero is in the middle.")
        self.sfx("number", step=0)
        self.play(nl.label(0).animate.set_color(YELLOW), run_time=0.8, rate_func=ease)
        self.wait(1.2)

        # 3. Right of zero -------------------------------------------------
        self.caption("Numbers to the right of zero are positive.")
        side = Line([nl.x(0) + 0.05, nl.y, 0], [nl.x(5) + 0.3, nl.y, 0], color=GREEN, stroke_width=12)
        arrow = Arrow([nl.x(0) + 0.1, nl.y + 0.75, 0], [nl.x(5) + 0.2, nl.y + 0.75, 0],
                      color=GREEN, buff=0, stroke_width=8, max_tip_length_to_length_ratio=0.15)
        self.sfx("operation")
        self.play(Create(side), GrowArrow(arrow), run_time=1.6, rate_func=ease)
        for k in range(1, 6):
            self.sfx("number", 0.2 + (k - 1) * 0.3, step=k - 1)
        self.play(LaggedStart(*[nl.label(k).animate.set_color(GREEN) for k in range(1, 6)], lag_ratio=0.3),
                  run_time=2.0, rate_func=ease)
        word = Text("positive", font_size=64, weight=BOLD, color=GREEN).move_to([1.4, -0.9, 0])
        self.play(FadeIn(word, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.4)

        # 4. Leo's marbles -------------------------------------------------
        self.caption("Leo has 3 marbles. He finds 2 more.")
        three = Dot(radius=0.2, color=COLORS[0]).move_to(nl.rest(3))
        two = Dot(radius=0.2, color=COLORS[1]).move_to(nl.rest(2))
        self.sfx("number", step=3)
        self.play(FadeIn(three, scale=0.5), run_time=0.6, rate_func=ease)
        self.sfx("number", 0.0, step=2)
        self.play(FadeIn(two, scale=0.5), run_time=0.6, rate_func=ease)
        self.wait(1.0)

        self.caption("The 3 and the 2 are positive. They are right of zero.")
        facts = VGroup(
            Text("3 > 0", font_size=64, weight=BOLD, color=COLORS[0]),
            Text("2 > 0", font_size=64, weight=BOLD, color=COLORS[1]),
        ).arrange(RIGHT, buff=1.0).move_to([0, -2.2, 0])
        self.play(FadeOut(word), run_time=0.5, rate_func=ease)
        self.sfx("result")
        self.play(FadeIn(facts, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6, rate_func=ease)
        self.write_vtt()
