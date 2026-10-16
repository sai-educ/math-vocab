"""Manim scene: "division" (term id 3-oa-division), 12 ÷ 3 = 4.

Render:  videos/render.sh division 3-oa-division Division 8
"""
from common import *

TOTAL, GROUPS = 12, 3
PER_GROUP = TOTAL // GROUPS


class Division(CaptionScene):
    TERM_ID = "3-oa-division"

    def construct(self):
        # 1. Name the parts of 12 ÷ 3 -----------------------------------
        self.caption("12 ÷ 3 means share 12 into 3 equal groups.")
        twelve = Text("12", font_size=88, weight=BOLD)
        divide = Text("÷", font_size=88, weight=BOLD)
        three = Text("3", font_size=88, weight=BOLD, color=COLORS[0])
        eq = VGroup(twelve, divide, three).arrange(RIGHT, buff=0.5).move_to(UP * 0.4)
        lab12 = Text("in all", font_size=30, color=SOFT).next_to(twelve, DOWN, buff=0.3)
        lab3 = Text("equal groups", font_size=30, color=COLORS[0]).next_to(three, DOWN, buff=0.3)
        self.sfx("number", step=3)
        self.sfx("operation", 0.25)
        self.sfx("number", 0.5, step=2)
        self.play(FadeIn(eq, scale=0.92), run_time=0.9, rate_func=ease)
        self.sfx("number", step=3)
        self.sfx("number", 0.2, step=2)
        self.play(FadeIn(lab12, shift=UP * 0.12), FadeIn(lab3, shift=UP * 0.12),
                  run_time=0.8, rate_func=ease)
        self.wait(1.1)

        head = VGroup(twelve.copy(), divide.copy(), three.copy())
        head.arrange(RIGHT, buff=0.3).scale(0.8).to_edge(UP, buff=0.4)

        # the 12 dots, loose, and 3 empty groups to share them into
        pile = VGroup(*[Dot(radius=0.17, color=WHITE) for _ in range(TOTAL)])
        pile.arrange_in_grid(rows=2, cols=6, buff=0.35).move_to(UP * 1.75)
        boxes = VGroup(*[RoundedRectangle(corner_radius=0.2, width=1.9, height=1.9,
                                          color=COLORS[g], stroke_width=4) for g in range(GROUPS)])
        boxes.arrange(RIGHT, buff=0.5).move_to(DOWN * 0.45)
        self.sfx("number", 0.3)  # the pile of 12 and the 3 groups appear
        self.play(FadeOut(lab12), FadeOut(lab3), Transform(eq, head),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in pile], lag_ratio=0.05),
                  *[FadeIn(b, scale=0.92) for b in boxes], run_time=1.2, rate_func=ease)

        # 2. Deal them out, one to each group in turn ---------------------
        self.caption("Deal them out, one to each group at a time.")
        slot = 0.37
        offsets = [(-slot, slot), (slot, slot), (-slot, -slot), (slot, -slot)]
        moves = []
        for i, dot in enumerate(pile):
            g, k = i % GROUPS, i // GROUPS
            ox, oy = offsets[k]
            target = boxes[g].get_center() + np.array([ox, oy, 0])
            moves.append(dot.animate.move_to(target).set_color(COLORS[g]))
        for i in range(TOTAL):
            self.sfx("tick", i * 0.25)
        self.play(LaggedStart(*moves, lag_ratio=0.2), run_time=4.0, rate_func=ease)
        self.wait(0.4)

        # 3. Count each group ---------------------------------------------
        self.caption("Each group gets 4.")
        counts = VGroup(*[Text("4", font_size=56, weight=BOLD, color=YELLOW)
                          .next_to(boxes[g], DOWN, buff=0.2) for g in range(GROUPS)])
        for k in range(GROUPS):
            self.sfx("number", k * 0.26, step=k * 2)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.12) for c in counts], lag_ratio=0.3),
                  run_time=1.4, rate_func=ease)
        self.wait(0.8)

        # 4. Land on the answer, check with multiplication ----------------
        self.caption("12 ÷ 3 = 4. Check it: 3 × 4 = 12.")
        answer = Text("= 4", font_size=70, weight=BOLD, color=YELLOW).next_to(eq, RIGHT, buff=0.3)
        self.sfx("operation")
        self.sfx("result", 0.3)
        self.play(FadeIn(answer, shift=LEFT * 0.2), run_time=0.8, rate_func=ease)
        check = Text("3 × 4 = 12", font_size=34, color=SOFT).move_to(DOWN * 2.85)
        self.sfx("operation")
        self.play(FadeIn(check, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(1.3)

        self.caption(None)
        self.play(FadeOut(VGroup(eq, answer, check, boxes, counts, *pile)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
