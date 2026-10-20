"""Manim scene: "percentage" (term id 5-nf-percentage), 90 out of 100 = 90%.

Render:  videos/render.sh percentage 5-nf-percentage Percentage 12
"""
from common import *

SIDE, CELL, GAP = 10, 0.3, 0.05
FILLED_COLS = 9
GRID_CENTER = [0, 0.9, 0]


class Percentage(CaptionScene):
    TERM_ID = "5-nf-percentage"

    def construct(self):
        # 1. Out of 100 ---------------------------------------------------
        self.caption("Percent means out of 100.")
        cells = [[Square(side_length=CELL, stroke_color=SOFT, stroke_width=1.5,
                         fill_color=COLORS[0], fill_opacity=0)
                  for _ in range(SIDE)] for _ in range(SIDE)]  # cells[col][row]
        grid = VGroup(*[c for col in cells for c in col])
        grid.arrange_in_grid(rows=SIDE, cols=SIDE, buff=GAP, flow_order="dr")
        grid.move_to(GRID_CENTER)
        label = Text("100 equal parts", font_size=36, color=SOFT).next_to(grid, DOWN, buff=0.4)
        self.sfx("number", step=3)
        self.play(LaggedStart(*[FadeIn(c, scale=0.6) for c in grid], lag_ratio=0.012),
                  run_time=1.8, rate_func=ease)
        self.sfx("number", step=1)
        self.play(FadeIn(label, shift=UP * 0.12), run_time=0.7, rate_func=ease)
        self.wait(1.2)

        # 2. Fill 90 ------------------------------------------------------
        self.caption("Ana got 90 of the 100 right.")
        for k in range(FILLED_COLS):
            self.sfx("tick", k * 0.28)
        columns = [VGroup(*[grid[k * SIDE + r] for r in range(SIDE)]) for k in range(FILLED_COLS)]
        self.play(LaggedStart(*[col.animate.set_fill(COLORS[2], opacity=0.95).set_stroke(COLORS[2])
                                for col in columns], lag_ratio=0.8),
                  FadeOut(label), run_time=0.28 * FILLED_COLS + 0.8, rate_func=ease)
        ninety = Text("90 out of 100", font_size=44, weight=BOLD, color=COLORS[2]).next_to(grid, DOWN, buff=0.4)
        self.sfx("number", step=4)
        self.play(FadeIn(ninety, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.4)

        # 3. 90% ----------------------------------------------------------
        self.caption("90 out of 100 is 90 percent.")
        pct = Text("90%", font_size=96, weight=BOLD, color=YELLOW).next_to(grid, DOWN, buff=0.3)
        self.play(FadeOut(ninety), run_time=0.4, rate_func=ease)
        self.sfx("result")
        self.play(FadeIn(pct, scale=0.9), run_time=0.9, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(FadeOut(VGroup(grid, pct)), run_time=0.6, rate_func=ease)
        self.write_vtt()
