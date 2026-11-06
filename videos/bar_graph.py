"""Manim scene: "bar graph" (term id 2-md-bar-graph), favorite fruits; the tallest bar wins.

Render:  videos/render.sh bar_graph 2-md-bar-graph BarGraph 13
"""
from common import *

UNIT = 0.5          # height of one fruit
BASE_Y = -1.5
AXIS_X = -3.0
BAR_W = 1.0
FRUITS = [("Apple", 7, "#ff5fa8"), ("Banana", 4, "#ffd166"), ("Grape", 5, "#7c9eff"), ("Pear", 3, "#7cffb2")]
XS = [-1.8, -0.3, 1.2, 2.7]


class BarGraph(CaptionScene):
    TERM_ID = "2-md-bar-graph"

    def construct(self):
        # 1. Axes ---------------------------------------------------------
        self.caption("A bar graph uses bars to show amounts.")
        title = Text("Favorite fruits", font_size=52, weight=BOLD).move_to(UP * 3.3)
        base = Line([AXIS_X, BASE_Y, 0], [3.4, BASE_Y, 0], color=SOFT, stroke_width=5)
        side = Line([AXIS_X, BASE_Y, 0], [AXIS_X, BASE_Y + 8 * UNIT, 0], color=SOFT, stroke_width=5)
        ticks = VGroup()
        for n in range(2, 9, 2):
            y = BASE_Y + n * UNIT
            ticks.add(Line([AXIS_X, y, 0], [3.4, y, 0], color=SOFT, stroke_width=1.5, stroke_opacity=0.35))
            ticks.add(Text(str(n), font_size=28, color=SOFT).move_to([AXIS_X - 0.3, y, 0]))
        labels = VGroup(*[Text(name, font_size=30, color=c).move_to([x, BASE_Y - 0.4, 0])
                          for (name, _, c), x in zip(FRUITS, XS)])
        self.sfx("number", step=3)
        self.play(FadeIn(title, shift=DOWN * 0.12), Create(base), Create(side), run_time=1.1, rate_func=ease)
        self.play(FadeIn(ticks), FadeIn(labels), run_time=0.9, rate_func=ease)
        self.wait(0.8)

        # 2. Bars grow ----------------------------------------------------
        self.caption("Zoe's class picks a favorite fruit. Each bar shows how many.")
        bars, counts = [], []
        for i, ((name, n, c), x) in enumerate(zip(FRUITS, XS)):
            bar = Rectangle(width=BAR_W, height=n * UNIT, stroke_width=0, fill_color=c, fill_opacity=0.92)
            bar.move_to([x, BASE_Y + n * UNIT / 2, 0])
            count = Text(str(n), font_size=44, weight=BOLD, color=c).next_to(bar, UP, buff=0.15)
            bars.append(bar)
            counts.append(count)
            self.sfx("number", step=i * 2)
            self.play(GrowFromEdge(bar, DOWN), run_time=1.1, rate_func=ease)
            self.play(FadeIn(count, shift=UP * 0.08), run_time=0.4, rate_func=ease)
            self.wait(0.2)
        self.wait(0.6)

        # 3. Tallest bar wins ---------------------------------------------
        self.caption("The apple bar rises highest, so apples won.")
        halo = SurroundingRectangle(VGroup(bars[0], counts[0]), color=YELLOW, buff=0.12,
                                    stroke_width=5, corner_radius=0.1)
        self.sfx("result")
        self.play(Create(halo),
                  *[b.animate.set_fill(opacity=0.35) for b in bars[1:]],
                  run_time=1.2, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(VGroup(title, base, side, ticks, labels, *bars, *counts, halo)), run_time=0.6, rate_func=ease)
        self.write_vtt()
