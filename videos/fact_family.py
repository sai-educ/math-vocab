"""Manim scene: "fact family" (term id 1-oa-fact-family), 3, 4 and 7.

Render:  videos/render.sh fact_family 1-oa-fact-family FactFamily 14
"""
from common import *

NUM_C = {3: COLORS[0], 4: COLORS[1], 7: COLORS[2]}
XS = [-2.4, -1.2, 0.0, 1.2, 2.4]
FACTS = [
    ("3", "+", "4", "=", "7"),
    ("4", "+", "3", "=", "7"),
    ("7", "−", "3", "=", "4"),
    ("7", "−", "4", "=", "3"),
]
FACT_YS = [0.3, -0.5, -1.3, -2.1]


def bubble(n, pos):
    ring = Circle(radius=0.45, color=NUM_C[n], stroke_width=6, fill_color="#0b0b10", fill_opacity=1)
    label = Text(str(n), font_size=60, weight=BOLD, color=NUM_C[n])
    return VGroup(ring, label).move_to(pos)


def fact(tokens, y):
    parts = []
    for tok, x in zip(tokens, XS):
        color = NUM_C[int(tok)] if tok.isdigit() else WHITE
        parts.append(Text(tok, font_size=58, weight=BOLD, color=color).move_to([x, y, 0]))
    return VGroup(*parts)


class FactFamily(CaptionScene):
    TERM_ID = "1-oa-fact-family"

    def construct(self):
        # 1. Three numbers ------------------------------------------------
        self.caption("Take three numbers: 3, 4, and 7.")
        top, bl, br = np.array([0, 3.1, 0]), np.array([-1.5, 1.35, 0]), np.array([1.5, 1.35, 0])
        tri = Polygon(top, bl, br, color=SOFT, stroke_width=4)
        b7, b3, b4 = bubble(7, top), bubble(3, bl), bubble(4, br)
        self.play(Create(tri), run_time=1.0, rate_func=ease)
        for b, step in ((b3, 1), (b4, 2), (b7, 4)):
            self.sfx("number", step=step)
            self.play(FadeIn(b, scale=0.7), run_time=0.6, rate_func=ease)
        self.wait(0.8)

        # 2-5. The four facts ---------------------------------------------
        captions = ["Add: 3 + 4 = 7.", "Swap them: 4 + 3 = 7.",
                    "Take away: 7 − 3 = 4.", "And: 7 − 4 = 3."]
        rows = []
        for cap, tokens, y in zip(captions, FACTS, FACT_YS):
            self.caption(cap)
            row = fact(tokens, y)
            rows.append(row)
            self.sfx("operation")
            self.play(FadeIn(row, shift=UP * 0.12), run_time=0.7, rate_func=ease)
            self.sfx("result", 0.1)
            self.wait(1.7)

        # 6. Family -------------------------------------------------------
        self.caption("These 4 facts use the same 3 numbers. They are a fact family.")
        box = SurroundingRectangle(VGroup(*rows), color=YELLOW, buff=0.2, corner_radius=0.2, stroke_width=5)
        self.play(Create(box), run_time=1.0, rate_func=ease)
        self.wait(3.2)

        self.caption(None)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6, rate_func=ease)
        self.write_vtt()
