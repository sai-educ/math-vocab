"""Manim scene: "perimeter" (term ids 3-md-perimeter, 4-md-perimeter), a 4 by 3 rectangle, 4+3+4+3 = 14.

Render:  videos/render.sh perimeter 3-md-perimeter Perimeter 12   (then cp to 4-md-perimeter.*)
"""
from common import *

W, H, U = 4, 3, 0.8  # rectangle size in units, and the length of one unit on screen
CENTER = np.array([0.0, 0.9, 0.0])
SIDE_COLORS = [COLORS[0], COLORS[1], COLORS[0], COLORS[1]]


def num(text, color, pos, size=56):
    return Text(text, font_size=size, weight=BOLD, color=color).move_to(pos)


class Perimeter(CaptionScene):
    TERM_ID = "3-md-perimeter"

    def construct(self):
        left, right = CENTER[0] - W * U / 2, CENTER[0] + W * U / 2
        bottom, top = CENTER[1] - H * U / 2, CENTER[1] + H * U / 2
        corners = [np.array([left, bottom, 0]), np.array([right, bottom, 0]),
                   np.array([right, top, 0]), np.array([left, top, 0])]

        # 1. The shape ----------------------------------------------------
        self.caption("Here is a rectangle. Let's walk around it.")
        shape = Rectangle(width=W * U, height=H * U, color=SOFT, stroke_width=5,
                          fill_color=SOFT, fill_opacity=0.12).move_to(CENTER)
        self.sfx("number", step=2)
        self.play(FadeIn(shape, scale=0.95), run_time=1.0, rate_func=ease)
        walker = Dot(radius=0.2, color=YELLOW).move_to(corners[0])
        self.play(FadeIn(walker, scale=0.5), run_time=0.6, rate_func=ease)
        self.wait(0.6)

        # 2. Walk the four sides -----------------------------------------
        self.caption("The distance all the way around is the perimeter.")
        lengths = [W, H, W, H]
        label_pos = [np.array([CENTER[0], bottom - 0.55, 0]), np.array([right + 0.6, CENTER[1], 0]),
                     np.array([CENTER[0], top + 0.55, 0]), np.array([left - 0.6, CENTER[1], 0])]
        labels, trails = [], []
        for i in range(4):
            a, b = corners[i], corners[(i + 1) % 4]
            trail = Line(a, b, color=SIDE_COLORS[i], stroke_width=10)
            trails.append(trail)
            self.play(MoveAlongPath(walker, Line(a, b)), Create(trail),
                      run_time=lengths[i] * 0.55 + 0.4, rate_func=ease)
            label = num(str(lengths[i]), SIDE_COLORS[i], label_pos[i])
            labels.append(label)
            self.sfx("number", step=lengths[i])
            self.play(FadeIn(label, scale=0.8), run_time=0.45, rate_func=ease)
        self.wait(0.6)

        # 3. Add the sides ------------------------------------------------
        self.caption("Add the sides: 4 + 3 + 4 + 3.")
        parts = [Text(t, font_size=64, weight=BOLD, color=c)
                 for t, c in (("4", COLORS[0]), ("+", WHITE), ("3", COLORS[1]), ("+", WHITE),
                              ("4", COLORS[0]), ("+", WHITE), ("3", COLORS[1]), ("=", WHITE),
                              ("14", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.22).move_to([0, -1.7, 0])
        order = [("number", 4), ("operation", 0), ("number", 2), ("operation", 0), ("number", 4),
                 ("operation", 0), ("number", 2), ("operation", 0), ("result", 0)]
        for part, (role, step) in zip(parts, order):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.1), run_time=0.4, rate_func=ease)
        self.wait(0.5)

        # 4. Answer -------------------------------------------------------
        self.caption("The perimeter is 14 units.")
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(shape, walker, *trails, *labels, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
