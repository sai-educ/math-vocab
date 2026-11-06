"""Manim scene: "fourths" (term id 1-g-fourths), a pizza cut into four equal parts, one shaded.

Render:  videos/render.sh fourths 1-g-fourths Fourths 12
"""
from common import *

R = 1.7
CENTER = np.array([0.0, 1.0, 0.0])
FILL = COLORS[1]
GAP = 0.2
# Quarter k covers angles k*90 .. (k+1)*90 degrees; the outward direction is its middle.
OUT = [np.array([np.cos(PI / 4 + k * PI / 2), np.sin(PI / 4 + k * PI / 2), 0]) for k in range(4)]



class Fourths(CaptionScene):
    TERM_ID = "1-g-fourths"

    def construct(self):
        # Sector.move_to centers on its bounding box; build around the true center instead.
        def q(k):
            s = Sector(radius=R, angle=PI / 2, start_angle=k * PI / 2, color=FILL, fill_opacity=0.9,
                       stroke_color=WHITE, stroke_width=4, arc_center=CENTER)
            return s

        quarters = [q(k) for k in range(4)]
        pizza = VGroup(*quarters)

        # 1. One whole ----------------------------------------------------
        self.caption("Ana has one whole pizza.")
        tag = Text("1 whole", font_size=48, weight=BOLD, color=SOFT).move_to(DOWN * 1.7)
        self.sfx("number", step=3)
        self.play(FadeIn(pizza, scale=0.9), FadeIn(tag, shift=UP * 0.12), run_time=1.1, rate_func=ease)
        self.wait(1.3)

        # 2. Cut in four --------------------------------------------------
        self.caption("She cuts it into 4 equal parts.")
        cut_v = DashedLine(CENTER + UP * (R + 0.3), CENTER + DOWN * (R + 0.3), color=YELLOW,
                           stroke_width=5, dash_length=0.18)
        cut_h = DashedLine(CENTER + LEFT * (R + 0.3), CENTER + RIGHT * (R + 0.3), color=YELLOW,
                           stroke_width=5, dash_length=0.18)
        self.sfx("operation")
        self.play(Create(cut_v), run_time=0.9, rate_func=ease)
        self.sfx("operation", 0.1)
        self.play(Create(cut_h), run_time=0.9, rate_func=ease)
        self.sfx("tick", 0.3)
        self.play(*[quarters[k].animate.shift(OUT[k] * GAP) for k in range(4)],
                  FadeOut(cut_v), FadeOut(cut_h), FadeOut(tag), run_time=1.0, rate_func=ease)
        self.wait(0.5)

        # 3. Count the parts ---------------------------------------------
        self.caption("Count the parts: 1, 2, 3, 4. All the same size.")
        nums = []
        for k in range(4):
            n = Text(str(k + 1), font_size=56, weight=BOLD, color=WHITE)
            n.move_to(CENTER + OUT[k] * (GAP + 0.85))
            nums.append(n)
            self.sfx("number", step=k + 1)
            self.play(FadeIn(n, scale=0.8), run_time=0.5, rate_func=ease)
            self.wait(0.35)
        self.wait(0.9)

        # 4. Shade one fourth --------------------------------------------
        self.caption("Each part is one fourth. Four equal parts are fourths.")
        word = Text("1 fourth", font_size=64, weight=BOLD, color=YELLOW).move_to(DOWN * 1.9)
        self.sfx("result")
        self.play(*[quarters[k].animate.set_fill(FILL, opacity=0.0) for k in (1, 2, 3)],
                  quarters[0].animate.set_fill(YELLOW, opacity=0.9),
                  *[FadeOut(nums[k]) for k in (1, 2, 3)],
                  FadeOut(nums[0]),
                  FadeIn(word, shift=UP * 0.12), run_time=1.2, rate_func=ease)
        self.wait(2.6)

        self.caption(None)
        self.play(FadeOut(VGroup(pizza, word)), run_time=0.6, rate_func=ease)
        self.write_vtt()
