"""Manim scene: "regroup" (term id 2-nbt-regroup), 14 ones trade 10 for 1 ten.

Render:  videos/render.sh regroup 2-nbt-regroup Regroup 12
"""
from common import *

TENS_C, ONES_C = COLORS[0], COLORS[1]
SIDE = 0.42
PITCH = 0.56
ROW_Y = 0.9
LEFT_X, RIGHT_X = -1.7, 1.9


def one():
    return Square(side_length=SIDE, color=ONES_C, fill_opacity=0.9, stroke_width=0)


def grid_positions(cols, rows, cx, cy):
    return [np.array([cx + (c - (cols - 1) / 2) * PITCH, cy + ((rows - 1) / 2 - r) * PITCH, 0])
            for r in range(rows) for c in range(cols)]


def ten_rod():
    cells = VGroup(*[Square(side_length=0.21, color=TENS_C, fill_opacity=0.9, stroke_width=0)
                     for _ in range(10)])
    return cells.arrange(DOWN, buff=0.025)


class Regroup(CaptionScene):
    TERM_ID = "2-nbt-regroup"

    def construct(self):
        # 1. 14 ones ------------------------------------------------------
        self.caption("Here are 14 ones.")
        label = Text("14 ones", font_size=64, weight=BOLD, color=ONES_C).move_to([0, 2.7, 0])
        ones = VGroup(*[one() for _ in range(14)])
        for sq, pos in zip(ones, grid_positions(7, 2, 0, ROW_Y)):
            sq.move_to(pos)
        self.sfx("number", step=3)
        self.play(FadeIn(label, shift=DOWN * 0.1), run_time=0.7, rate_func=ease)
        for k in range(14):
            self.sfx("tick", k * 0.09)
        self.play(LaggedStart(*[FadeIn(s, scale=0.5) for s in ones], lag_ratio=0.12),
                  run_time=1.8, rate_func=ease)
        self.wait(1.0)

        # 2. Group ten of them -------------------------------------------
        self.caption("10 ones can trade for 1 ten.")
        targets = grid_positions(5, 2, LEFT_X, ROW_Y) + grid_positions(2, 2, RIGHT_X, ROW_Y)
        self.play(*[sq.animate.move_to(p) for sq, p in zip(ones, targets)], run_time=1.8, rate_func=ease)
        ten_group, four_group = VGroup(*ones[:10]), VGroup(*ones[10:])
        box = SurroundingRectangle(ten_group, color=YELLOW, buff=0.18, corner_radius=0.12, stroke_width=5)
        self.sfx("operation")
        self.play(Create(box), run_time=1.0, rate_func=ease)
        self.wait(0.8)

        # 3. The trade ----------------------------------------------------
        self.caption("Trade them for 1 ten.")
        rod = ten_rod().move_to([LEFT_X, ROW_Y, 0])
        self.sfx("result")
        self.play(FadeOut(ten_group), FadeIn(rod, scale=0.8), FadeOut(box), run_time=1.6, rate_func=ease)
        self.wait(0.8)

        # 4. Labels -------------------------------------------------------
        self.caption("Now we have 1 ten and 4 ones.")
        ten_t = Text("1 ten", font_size=48, weight=BOLD, color=TENS_C).move_to([LEFT_X, -0.65, 0])
        ones_t = Text("4 ones", font_size=48, weight=BOLD, color=ONES_C).move_to([RIGHT_X, -0.65, 0])
        self.sfx("number", step=2)
        self.play(FadeIn(ten_t, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        self.sfx("number", step=1)
        self.play(FadeIn(ones_t, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        self.wait(0.8)

        # 5. Same amount --------------------------------------------------
        self.caption("It is still the same amount: 14.")
        final = Text("14 = 1 ten + 4 ones", font_size=52, weight=BOLD, color=YELLOW).move_to([0, -1.9, 0])
        self.sfx("result")
        self.play(FadeIn(final, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(label, rod, four_group, ten_t, ones_t, final)), run_time=0.6, rate_func=ease)
        self.write_vtt()
