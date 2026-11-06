"""Manim scene: "array" (term ids 2-oa-array, 3-oa-array), 3 rows of 4 and 3 x 4 = 12.

Render:  videos/render.sh array 2-oa-array ArrayVideo 12   (then cp to 3-oa-array.*)
"""
from common import *

ROWS, COLS = 3, 4
STEP = 0.85
GRID_CENTER = np.array([0.6, 1.3, 0.0])


class ArrayVideo(CaptionScene):
    TERM_ID = "2-oa-array"

    def construct(self):
        # 1. Deal out the dots, one row at a time -------------------------
        self.caption("An array is objects in equal rows and columns.")
        rows = []
        for r in range(ROWS):
            row = VGroup(*[Dot(radius=0.24, color=COLORS[r]) for _ in range(COLS)])
            row.arrange(RIGHT, buff=STEP - 0.48)
            rows.append(row)
        grid = VGroup(*rows).arrange(DOWN, buff=STEP - 0.48).move_to(GRID_CENTER)
        for r, row in enumerate(rows):
            self.sfx("number", step=r + 1)
            self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.2),
                      run_time=0.9, rate_func=ease)
            self.wait(0.2)
        self.wait(0.8)

        # 2. Rows ---------------------------------------------------------
        self.caption("This array has 3 rows. Each row has 4.")
        brace_l = Brace(grid, LEFT, buff=0.25, color=SOFT)
        lab_rows = Text("3 rows", font_size=44, weight=BOLD, color=SOFT)
        lab_rows.next_to(brace_l, LEFT, buff=0.2)
        row_box = SurroundingRectangle(rows[0], buff=0.17, corner_radius=0.2,
                                       color=YELLOW, stroke_width=4)
        self.sfx("number", step=3)
        self.play(GrowFromCenter(brace_l), FadeIn(lab_rows, shift=RIGHT * 0.12),
                  Create(row_box), run_time=1.1, rate_func=ease)
        self.wait(1.6)
        self.play(FadeOut(row_box), run_time=0.5, rate_func=ease)

        # 3. Columns ------------------------------------------------------
        self.caption("It has 4 columns. Each column has 3.")
        cols = [VGroup(*[row[c] for row in rows]) for c in range(COLS)]
        brace_t = Brace(grid, UP, buff=0.25, color=SOFT)
        lab_cols = Text("4 columns", font_size=44, weight=BOLD, color=SOFT)
        lab_cols.next_to(brace_t, UP, buff=0.15)
        col_box = SurroundingRectangle(cols[0], buff=0.17, corner_radius=0.2,
                                       color=YELLOW, stroke_width=4)
        self.sfx("number", step=4)
        self.play(GrowFromCenter(brace_t), FadeIn(lab_cols, shift=DOWN * 0.12),
                  Create(col_box), run_time=1.1, rate_func=ease)
        self.wait(1.6)
        self.play(FadeOut(col_box), run_time=0.5, rate_func=ease)

        # 4. Multiplication fact -----------------------------------------
        self.caption("3 rows of 4 is 3 × 4.")
        parts = [Text(t, font_size=84, weight=BOLD, color=c)
                 for t, c in (("3", COLORS[0]), ("×", WHITE), ("4", COLORS[1]))]
        fact = VGroup(*parts).arrange(RIGHT, buff=0.4).move_to(DOWN * 1.3)
        for part, (role, step) in zip(parts, (("number", 3), ("operation", 0), ("number", 4))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(1.0)

        # 5. Count them ---------------------------------------------------
        self.caption("Count the dots. 3 × 4 = 12.")
        answer = VGroup(Text("=", font_size=84, weight=BOLD),
                        Text("12", font_size=84, weight=BOLD, color=YELLOW))
        answer.arrange(RIGHT, buff=0.4)
        full = VGroup(fact, answer).arrange(RIGHT, buff=0.4).move_to(DOWN * 1.3)
        self.play(fact.animate.move_to(full[0]), run_time=0.7, rate_func=ease)
        self.sfx("operation")
        self.play(FadeIn(answer[0], shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.sfx("result")
        self.play(FadeIn(answer[1], shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(FadeOut(VGroup(grid, brace_l, lab_rows, brace_t, lab_cols, fact, answer)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
