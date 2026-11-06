"""Manim scene: "line plot" (term id 2-md-line-plot), X marks stack above leaf lengths.

Render:  videos/render.sh line_plot 2-md-line-plot LinePlot 14
"""
from common import *

LINE_Y = -0.9
X0, STEP = -2.7, 0.9           # x of the 1 cm tick, distance between ticks
STACK_STEP = 0.5
LENGTHS = [3, 4, 5, 4, 2, 4, 3, 6, 4, 5]   # 10 leaves; 4 cm appears 4 times


def x_of(n):
    return X0 + (n - 1) * STEP


def cross(n, level, color):
    c = np.array([x_of(n), LINE_Y + 0.45 + level * STACK_STEP, 0])
    s = 0.17
    return VGroup(Line(c + [-s, -s, 0], c + [s, s, 0], color=color, stroke_width=7),
                  Line(c + [-s, s, 0], c + [s, -s, 0], color=color, stroke_width=7))


class LinePlot(CaptionScene):
    TERM_ID = "2-md-line-plot"

    def construct(self):
        # 1. Number line --------------------------------------------------
        self.caption("A line plot stacks marks above a number line.")
        title = Text("Leaf lengths", font_size=52, weight=BOLD).move_to(UP * 3.2)
        line = Line([x_of(1) - 0.5, LINE_Y, 0], [x_of(7) + 0.5, LINE_Y, 0], color=WHITE, stroke_width=5)
        ticks = VGroup(*[VGroup(Line([x_of(n), LINE_Y - 0.12, 0], [x_of(n), LINE_Y + 0.12, 0], color=WHITE, stroke_width=4),
                                Text(str(n), font_size=40, color=SOFT).move_to([x_of(n), LINE_Y - 0.5, 0]))
                         for n in range(1, 8)])
        unit = Text("centimeters", font_size=34, color=SOFT).move_to([0, LINE_Y - 1.1, 0])
        self.sfx("number", step=3)
        self.play(FadeIn(title, shift=DOWN * 0.12), Create(line), run_time=1.1, rate_func=ease)
        self.play(FadeIn(ticks), FadeIn(unit), run_time=0.9, rate_func=ease)
        self.wait(0.6)

        # 2. Marks --------------------------------------------------------
        self.caption("Nina measures 10 leaves. She marks an X above each length.")
        stacks, marks = {}, []
        for i, n in enumerate(LENGTHS):
            level = stacks.get(n, 0)
            stacks[n] = level + 1
            x_mark = cross(n, level, COLORS[0] if n != 4 else COLORS[1])
            marks.append(x_mark)
            self.sfx("tick", 0.1)
            self.play(FadeIn(x_mark, shift=DOWN * 0.15), run_time=0.55, rate_func=ease)
            self.wait(0.2)
        self.wait(0.6)

        # 3. Tallest stack ------------------------------------------------
        self.caption("The tallest stack is the most common length.")
        halo = Rectangle(width=0.8, height=4 * STACK_STEP + 0.2, stroke_color=YELLOW, stroke_width=5,
                         fill_opacity=0).round_corners(0.1)
        halo.move_to([x_of(4), LINE_Y + 0.45 + 1.5 * STACK_STEP, 0])
        self.sfx("result")
        self.play(Create(halo), run_time=1.1, rate_func=ease)
        self.wait(1.0)
        self.caption("Most of the X's stack above 4 centimeters.")
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(title, line, ticks, unit, *marks, halo)), run_time=0.6, rate_func=ease)
        self.write_vtt()
