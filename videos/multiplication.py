"""Manim scene: "multiplication" (term id 3-oa-multiplication).

Render:  videos/render.sh multiplication 3-oa-multiplication Multiplication 8
"""
from common import *

GROUPS, PER_GROUP = 3, 4


class Multiplication(CaptionScene):
    TERM_ID = "3-oa-multiplication"

    def construct(self):
        # 1. Name the parts of 3 x 4 -------------------------------------
        self.caption("3 × 4 means 3 groups of 4.")
        three = Text("3", font_size=88, weight=BOLD, color=COLORS[0])
        times = Text("×", font_size=88, weight=BOLD)
        four = Text("4", font_size=88, weight=BOLD, color=COLORS[1])
        eq = VGroup(three, times, four).arrange(RIGHT, buff=0.5).move_to(UP * 0.4)
        lab3 = Text("groups", font_size=30, color=COLORS[0]).next_to(three, DOWN, buff=0.3)
        lab4 = Text("in each group", font_size=30, color=COLORS[1]).next_to(four, DOWN, buff=0.3)
        self.sfx("number")
        self.sfx("operation", 0.25)
        self.sfx("number", 0.5)
        self.play(FadeIn(eq, scale=0.92), run_time=0.9, rate_func=ease)
        self.sfx("number")
        self.sfx("number", 0.2)
        self.play(FadeIn(lab3, shift=UP * 0.12), FadeIn(lab4, shift=UP * 0.12),
                  run_time=0.8, rate_func=ease)
        self.wait(1.1)

        head = VGroup(three.copy(), times.copy(), four.copy())
        head.arrange(RIGHT, buff=0.3).scale(0.8).to_edge(UP, buff=0.4)
        self.play(FadeOut(lab3), FadeOut(lab4),
                  Transform(eq, head), run_time=0.8, rate_func=ease)

        # 2. Build the groups, counting up -------------------------------
        self.caption("Each group adds 4 more.")
        boxes, dots = [], []
        for g in range(GROUPS):
            box = RoundedRectangle(corner_radius=0.2, width=1.9, height=1.9,
                                   color=COLORS[g], stroke_width=4)
            grid = VGroup(*[Dot(radius=0.17, color=COLORS[g]) for _ in range(PER_GROUP)])
            grid.arrange_in_grid(rows=2, cols=2, buff=0.4).move_to(box)
            boxes.append(box)
            dots.append(grid)
        row = VGroup(*[VGroup(b, d) for b, d in zip(boxes, dots)])
        row.arrange(RIGHT, buff=0.5).shift(UP * 0.1)
        counter = None
        for g in range(GROUPS):
            new = Text(str((g + 1) * PER_GROUP), font_size=60, weight=BOLD, color=YELLOW)
            new.move_to(DOWN * 2.1)
            self.sfx("number")
            self.play(FadeIn(boxes[g], scale=0.9),
                      LaggedStart(*[FadeIn(d, scale=0.5) for d in dots[g]], lag_ratio=0.2),
                      (FadeIn(new) if counter is None else ReplacementTransform(counter, new)),
                      run_time=1.1, rate_func=ease)
            counter = new
            self.wait(0.15)
        self.wait(0.5)

        # 3. Line them up as an array ------------------------------------
        self.caption("Line them up: 3 rows of 4.")
        step = 0.8
        moves = []
        for g in range(GROUPS):
            for i, d in enumerate(dots[g]):
                target = np.array([(i - 1.5) * step, (1 - g) * step - 0.05, 0])
                moves.append(d.animate.move_to(target))
        self.play(*[FadeOut(b) for b in boxes], *moves, run_time=1.6, rate_func=ease)
        self.wait(1.0)

        # 4. Land on the answer ------------------------------------------
        self.caption("3 × 4 = 12. Multiplying counts equal groups fast.")
        answer = Text("= 12", font_size=70, weight=BOLD, color=YELLOW)
        answer.next_to(eq, RIGHT, buff=0.3)
        self.sfx("operation")
        self.sfx("result", 0.3)
        self.play(FadeIn(answer, shift=LEFT * 0.2), run_time=0.8, rate_func=ease)
        self.wait(1.7)

        self.caption(None)
        self.play(FadeOut(VGroup(eq, answer, counter, *dots)), run_time=0.6, rate_func=ease)
        self.write_vtt()
