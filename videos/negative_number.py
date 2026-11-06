"""Manim scene: "negative number" (term id 2-md-negative-number), left of zero, then a thermometer.

Render:  videos/render.sh negative_number 2-md-negative-number NegativeNumber 9
"""
from number_line_kit import *

PINK = COLORS[1]
ZERO_Y, STEP = 1.6, 0.6  # thermometer: height of 0 and of one degree
TUBE_X, TUBE_BOTTOM = -1.0, -1.75


def temp_y(n):
    return ZERO_Y + STEP * n


class NegativeNumber(CaptionScene):
    TERM_ID = "2-md-negative-number"

    def construct(self):
        nl = NLine(-5, 5, 0.66, 1.0)

        # 1. The line ------------------------------------------------------
        self.caption("Zero is in the middle of the number line.")
        self.play(Create(nl.axis), FadeIn(nl.ticks), run_time=1.2, rate_func=ease)
        self.play(FadeIn(nl.labels), nl.label(0).animate.set_color(YELLOW), run_time=1.2, rate_func=ease)
        self.wait(0.6)

        # 2. Left of zero --------------------------------------------------
        self.caption("Numbers to the left of zero are negative.")
        side = Line([nl.x(-5) - 0.3, nl.y, 0], [nl.x(0) - 0.05, nl.y, 0], color=PINK, stroke_width=12)
        arrow = Arrow([nl.x(0) - 0.1, nl.y + 0.75, 0], [nl.x(-5) - 0.2, nl.y + 0.75, 0],
                      color=PINK, buff=0, stroke_width=8, max_tip_length_to_length_ratio=0.15)
        self.sfx("operation")
        self.play(Create(side), GrowArrow(arrow), run_time=1.6, rate_func=ease)
        for j, k in enumerate(range(-1, -6, -1)):
            self.sfx("number", 0.2 + j * 0.3, step=j)
        self.play(LaggedStart(*[nl.label(k).animate.set_color(PINK) for k in range(-1, -6, -1)],
                              lag_ratio=0.3), run_time=2.0, rate_func=ease)
        self.wait(1.0)

        # 3. The minus sign ------------------------------------------------
        self.caption("They have a minus sign.")
        big = VGroup(Text(MINUS, font_size=96, weight=BOLD, color=YELLOW),
                     Text("3", font_size=96, weight=BOLD, color=PINK)).arrange(RIGHT, buff=0.08)
        big.move_to([0, -1.3, 0])
        self.sfx("operation")
        self.play(FadeIn(big, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(1.8)

        # 4. Thermometer ---------------------------------------------------
        self.caption("Maya reads the thermometer. It says negative 3.")
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.7, rate_func=ease)
        level = ValueTracker(0)
        tube = RoundedRectangle(corner_radius=0.25, width=0.5, height=temp_y(2.5) - TUBE_BOTTOM,
                                color=SOFT, stroke_width=5).move_to(
            [TUBE_X, (temp_y(2.5) + TUBE_BOTTOM) / 2, 0])
        bulb = Circle(radius=0.42, color=SOFT, stroke_width=5, fill_color="#0b0b10", fill_opacity=1
                      ).move_to([TUBE_X, TUBE_BOTTOM - 0.2, 0])
        bulb_fill = Circle(radius=0.32, color=COLORS[0], stroke_width=0, fill_opacity=0.95
                           ).move_to(bulb.get_center())
        liquid = always_redraw(lambda: Rectangle(
            width=0.24, height=temp_y(level.get_value()) - TUBE_BOTTOM,
            stroke_width=0, fill_color=COLORS[0], fill_opacity=0.95
        ).move_to([TUBE_X, (temp_y(level.get_value()) + TUBE_BOTTOM) / 2, 0]))
        ticks = VGroup(*[Line([TUBE_X + 0.3, temp_y(n), 0], [TUBE_X + 0.55, temp_y(n), 0],
                              color=SOFT, stroke_width=4) for n in range(2, -6, -1)])
        nums = VGroup(*[Text(fmt(n), font_size=44, weight=BOLD,
                             color=YELLOW if n == 0 else (PINK if n < 0 else WHITE)
                             ).move_to([TUBE_X + 1.2, temp_y(n), 0]) for n in range(2, -6, -1)])
        zero_line = Line([TUBE_X - 0.5, temp_y(0), 0], [TUBE_X + 0.55, temp_y(0), 0],
                         color=YELLOW, stroke_width=5)
        thermo = VGroup(bulb, bulb_fill, tube, ticks, nums, zero_line)
        self.play(FadeIn(thermo), run_time=1.0, rate_func=ease)
        self.add(liquid, bulb_fill)
        self.wait(0.8)

        # 5. Three steps below zero ---------------------------------------
        self.caption("That is 3 steps below zero.")
        for k in range(1, 4):
            self.sfx("number", 0.3, step=k - 1)
            label = Text(f"{k} step" + ("s" if k > 1 else ""), font_size=44, weight=BOLD, color=PINK
                         ).move_to([2.3, temp_y(-k) + 0.3 * 0, 0])
            self.play(level.animate.set_value(-k), FadeIn(label, shift=LEFT * 0.1),
                      run_time=1.2, rate_func=ease)
            self.wait(0.4)
        result = Text(f"{MINUS}3", font_size=80, weight=BOLD, color=PINK).move_to([2.3, 2.5, 0])
        self.sfx("result")
        self.play(FadeIn(result, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6, rate_func=ease)
        self.write_vtt()
