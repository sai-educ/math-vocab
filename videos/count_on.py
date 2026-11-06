"""Manim scene: "count on" (term id 1-nbt-count-on), start at 6 and count on 7, 8, 9.

Render:  videos/render.sh count_on 1-nbt-count-on CountOn 14
"""
from common import *

START, MORE = 6, 3
LINE_Y = -0.3
TOP_Y = 2.6
NUM_C = COLORS[0]
MORE_C = COLORS[2]


def tick_x(n):
    return -3.0 + (n - 5) * 1.2


class CountOn(CaptionScene):
    TERM_ID = "1-nbt-count-on"

    def construct(self):
        # 1. Omar has 6 ---------------------------------------------------
        self.caption("Omar has 6 marbles.")
        row = dots(START + MORE, NUM_C, [0, TOP_Y, 0], step=0.6, radius=0.2)
        have, extra = VGroup(*row[:START]), VGroup(*row[START:])
        extra.set_fill(MORE_C, opacity=0).set_stroke(MORE_C, width=4)
        for k in range(START):
            self.sfx("tick", 0.2 + k * 0.12)
        self.play(LaggedStart(*[FadeIn(d, scale=0.5) for d in have], lag_ratio=0.15),
                  run_time=1.5, rate_func=ease)
        line = Line([-3.4, LINE_Y, 0], [3.4, LINE_Y, 0], color=SOFT, stroke_width=5)
        ticks = VGroup(*[Line([tick_x(n), LINE_Y - 0.15, 0], [tick_x(n), LINE_Y + 0.15, 0],
                              color=SOFT, stroke_width=5) for n in range(5, 11)])
        labels = {n: Text(str(n), font_size=46, weight=BOLD, color=SOFT).move_to([tick_x(n), LINE_Y - 0.7, 0])
                  for n in range(5, 11)}
        self.play(FadeIn(line), FadeIn(ticks), *[FadeIn(t) for t in labels.values()],
                  run_time=1.0, rate_func=ease)
        self.wait(0.6)

        # 2. Gets 3 more --------------------------------------------------
        self.caption("He gets 3 more marbles.")
        self.sfx("number", step=2)
        self.play(FadeIn(extra), run_time=1.0, rate_func=ease)
        self.wait(1.0)

        # 3. Start at 6 ---------------------------------------------------
        self.caption("Do not start over at 1. Start at 6.")
        marker = Dot(radius=0.22, color=COLORS[1]).move_to([tick_x(START), LINE_Y, 0])
        six_box = SurroundingRectangle(labels[START], color=YELLOW, buff=0.12, corner_radius=0.1,
                                       stroke_width=5)
        self.sfx("number", step=4)
        self.play(FadeIn(marker, scale=0.5), Create(six_box), run_time=1.0, rate_func=ease)
        self.wait(1.6)

        # 4. Count on -----------------------------------------------------
        self.caption("Count on: 7, 8, 9.")
        hop_labels = []
        for k in range(MORE):
            a, b = tick_x(START + k), tick_x(START + k + 1)
            arc = ArcBetweenPoints([a, LINE_Y + 0.25, 0], [b, LINE_Y + 0.25, 0], angle=-PI * 0.7,
                                   color=YELLOW, stroke_width=5)
            num = Text(str(START + k + 1), font_size=60, weight=BOLD, color=MORE_C).move_to([(a + b) / 2, 0.75, 0])
            hop_labels.append(num)
            self.sfx("number", 0.3, step=k + 1)
            self.play(marker.animate.move_to([b, LINE_Y, 0]), Create(arc),
                      FadeIn(num, shift=UP * 0.1),
                      extra[k].animate.set_fill(MORE_C, opacity=1),
                      run_time=1.1, rate_func=ease)
            self.wait(0.5)
        self.wait(0.4)

        # 5. Result -------------------------------------------------------
        self.caption("Now Omar has 9 marbles.")
        nine = Text("9", font_size=110, weight=BOLD, color=YELLOW).move_to([0, -1.95, 0])
        self.sfx("result")
        self.play(FadeIn(nine, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.4)

        self.caption(None)
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6, rate_func=ease)
        self.write_vtt()
