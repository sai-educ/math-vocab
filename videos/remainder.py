"""Manim scene: "remainder" (term id 4-oa-remainder), 13 shared into 4 groups of 3 with 1 left: 13 / 4 = 3 R 1.

Render:  videos/render.sh remainder 4-oa-remainder Remainder 16
"""
from common import *

TOTAL, GROUPS = 13, 4
EACH = TOTAL // GROUPS          # 3
LEFT = TOTAL - EACH * GROUPS    # 1
ROW_Y = 2.8
BOX_Y = 0.9
BOX_W, BOX_H = 1.55, 1.1
BOX_X = [-2.55, -0.85, 0.85, 2.55]
BOX_COLORS = [COLORS[0], COLORS[1], COLORS[2], "#ffd166"]


class Remainder(CaptionScene):
    TERM_ID = "4-oa-remainder"

    def construct(self):
        assert EACH * GROUPS + LEFT == TOTAL

        # 1. The dots -----------------------------------------------------
        self.caption("Ivy has 13 stickers to share.")
        row = dots(TOTAL, WHITE, [0, ROW_Y, 0], step=0.5, radius=0.17)
        self.sfx("number", step=5)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in row], lag_ratio=0.1),
                  run_time=1.5, rate_func=ease)
        self.wait(0.8)

        # 2. Four groups --------------------------------------------------
        self.caption("She shares them with 4 friends.")
        boxes = VGroup(*[RoundedRectangle(corner_radius=0.12, width=BOX_W, height=BOX_H, color=c,
                                          stroke_width=4).move_to([x, BOX_Y, 0])
                         for x, c in zip(BOX_X, BOX_COLORS)])
        for k in range(GROUPS):
            self.sfx("number", k * 0.3, step=k)
        self.play(LaggedStart(*[Create(b) for b in boxes], lag_ratio=0.3), run_time=1.5, rate_func=ease)
        self.wait(0.8)

        # 3. Deal one at a time ------------------------------------------
        self.caption("Deal one to each friend, again and again.")
        for i in range(EACH * GROUPS):
            g, slot = i % GROUPS, i // GROUPS
            target = [BOX_X[g] + (slot - 1) * 0.42, BOX_Y, 0]
            self.sfx("tick", 0.05)
            self.play(row[i].animate.move_to(target).set_color(BOX_COLORS[g]), run_time=0.5, rate_func=ease)
        self.wait(0.8)

        # 4. Each gets 3 --------------------------------------------------
        self.caption("Each friend gets 3.")
        threes = VGroup(*[Text("3", font_size=48, weight=BOLD, color=c).move_to([x, BOX_Y - 1.0, 0])
                          for x, c in zip(BOX_X, BOX_COLORS)])
        for k in range(GROUPS):
            self.sfx("number", k * 0.2, step=2)
        self.play(LaggedStart(*[FadeIn(t, shift=UP * 0.1) for t in threes], lag_ratio=0.25),
                  run_time=1.3, rate_func=ease)
        self.wait(0.8)

        # 5. One left over -------------------------------------------------
        self.caption("1 sticker is left over. It cannot make another full share.")
        leftover = row[TOTAL - 1]
        self.sfx("operation")
        self.play(leftover.animate.set_color(YELLOW).move_to([0, -1.1, 0]), run_time=1.3, rate_func=ease)
        tag = Text("left over", font_size=40, color=YELLOW).next_to(leftover, DOWN, buff=0.2)
        self.play(FadeIn(tag, shift=UP * 0.1), run_time=0.7, rate_func=ease)
        self.wait(1.0)

        # 6. Equation ------------------------------------------------------
        self.caption("13 ÷ 4 = 3 R 1. The leftover 1 is the remainder.")
        parts = [Text(t, font_size=70, weight=BOLD, color=c)
                 for t, c in (("13", WHITE), ("÷", WHITE), ("4", WHITE), ("=", WHITE),
                              ("3", COLORS[2]), ("R", YELLOW), ("1", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.28).move_to(DOWN * 2.45)
        roles = (("number", 5), ("operation", 0), ("number", 3), ("operation", 0),
                 ("number", 2), ("operation", 0), ("result", 0))
        for part, (role, step) in zip(parts, roles):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.45, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(*row, boxes, threes, tag, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
