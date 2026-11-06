"""Manim scene: "area" (term id 3-md-area), a 4 by 3 rectangle filled with 12 unit squares.

Render:  videos/render.sh area 3-md-area Area 12
"""
from common import *

COLS, ROWS, U = 4, 3, 0.85
CENTER = np.array([0.0, 1.1, 0.0])


class Area(CaptionScene):
    TERM_ID = "3-md-area"

    def construct(self):
        left = CENTER[0] - COLS * U / 2
        top = CENTER[1] + ROWS * U / 2

        # 1. The shape ----------------------------------------------------
        self.caption("Area is the flat space inside a shape.")
        shape = Rectangle(width=COLS * U, height=ROWS * U, color=WHITE, stroke_width=6).move_to(CENTER)
        self.sfx("number", step=2)
        self.play(FadeIn(shape, scale=0.95), run_time=1.0, rate_func=ease)
        self.wait(1.2)

        # 2. Fill with unit squares --------------------------------------
        self.caption("Cover it with square units. Count them one by one.")
        squares, counts = [], []
        for r in range(ROWS):
            for c in range(COLS):
                sq = Square(side_length=U - 0.08, stroke_width=0, fill_color=COLORS[0], fill_opacity=0.85)
                sq.move_to([left + U * (c + 0.5), top - U * (r + 0.5), 0])
                n = Text(str(r * COLS + c + 1), font_size=34, weight=BOLD, color=WHITE).move_to(sq)
                squares.append(sq)
                counts.append(n)
        for i, (sq, n) in enumerate(zip(squares, counts)):
            self.sfx("tick" if i % 4 else "number", step=i // 4 + 1)
            self.play(FadeIn(sq, scale=0.7), FadeIn(n, scale=0.7), run_time=0.45, rate_func=ease)
        self.wait(0.8)

        # 3. The answer ---------------------------------------------------
        self.caption("12 squares cover the rectangle.")
        twelve = Text("12", font_size=96, weight=BOLD, color=YELLOW).move_to([-0.9, -1.75, 0])
        units = Text("square\nunits", font_size=44, color=SOFT, line_spacing=0.7)
        units.next_to(twelve, RIGHT, buff=0.35)
        self.sfx("result")
        self.play(FadeIn(twelve, shift=UP * 0.12), FadeIn(units, shift=UP * 0.12), run_time=0.9, rate_func=ease)
        self.wait(1.0)

        self.caption("The area is 12 square units.")
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(shape, *squares, *counts, twelve, units)), run_time=0.6, rate_func=ease)
        self.write_vtt()
