"""Manim scene: "tally chart" (term id 1-md-tally-chart), marks in fives: 5 + 3 = 8.

Render:  videos/render.sh tally_chart 1-md-tally-chart TallyChart 11
"""
from common import *

MARK_H = 1.5
MARK_GAP = 0.4
MARK_Y = 1.0
FIRST_X = -2.3
SECOND_X = 1.1


def mark(x, color):
    return Line([x, MARK_Y - MARK_H / 2, 0], [x, MARK_Y + MARK_H / 2, 0],
                color=color, stroke_width=10)


def slash(x_left, x_right, color):
    return Line([x_left - 0.25, MARK_Y - MARK_H * 0.38, 0], [x_right + 0.25, MARK_Y + MARK_H * 0.38, 0],
                color=color, stroke_width=10)


class TallyChart(CaptionScene):
    TERM_ID = "1-md-tally-chart"

    def construct(self):
        # 1. Title --------------------------------------------------------
        self.caption("A tally chart counts with small marks.")
        title = Text("Bus riders", font_size=56, weight=BOLD, color=WHITE).move_to(UP * 3.0)
        self.sfx("number", step=3)
        self.play(FadeIn(title, shift=DOWN * 0.12), run_time=0.9, rate_func=ease)
        self.wait(1.0)

        # 2. Four marks ---------------------------------------------------
        self.caption("Theo draws one mark for each rider.")
        first = [mark(FIRST_X + i * MARK_GAP, COLORS[0]) for i in range(4)]
        for i, m in enumerate(first):
            self.sfx("tick", 0.15 + i * 0.7)
            self.play(Create(m), run_time=0.55, rate_func=ease)
            self.wait(0.15)
        self.wait(0.6)

        # 3. The fifth mark crosses ---------------------------------------
        self.caption("The fifth mark crosses the other four.")
        cross = slash(first[0].get_x(), first[3].get_x(), YELLOW)
        self.sfx("operation")
        self.play(Create(cross), run_time=1.0, rate_func=ease)
        self.wait(0.6)
        five = Text("5", font_size=72, weight=BOLD, color=YELLOW).move_to([FIRST_X + 0.6, -0.4, 0])
        self.caption("That group is 5.")
        self.sfx("number", step=4)
        self.play(FadeIn(five, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(1.0)

        # 4. Three more ---------------------------------------------------
        self.caption("3 more riders. Start a new group.")
        second = [mark(SECOND_X + i * MARK_GAP, COLORS[1]) for i in range(3)]
        for i, m in enumerate(second):
            self.sfx("tick", 0.15 + i * 0.7)
            self.play(Create(m), run_time=0.55, rate_func=ease)
            self.wait(0.15)
        three = Text("3", font_size=72, weight=BOLD, color=COLORS[1]).move_to([SECOND_X + 0.4, -0.4, 0])
        self.sfx("number", step=2)
        self.play(FadeIn(three, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(0.8)

        # 5. Total --------------------------------------------------------
        self.caption("5 + 3 = 8 riders.")
        parts = [Text(t, font_size=76, weight=BOLD, color=c)
                 for t, c in (("5", YELLOW), ("+", WHITE), ("3", COLORS[1]), ("=", WHITE), ("8", COLORS[2]))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.35).move_to(DOWN * 1.9)
        for part, (role, step) in zip(parts, (("number", 4), ("operation", 0), ("number", 2),
                                              ("operation", 0), ("result", 0))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(FadeOut(VGroup(title, *first, cross, five, *second, three, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
