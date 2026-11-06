"""Manim scene: "number line" (term id 2-md-number-line), 0 to 5, then Ivy hops 8 to 13.

Render:  videos/render.sh number_line 2-md-number-line NumberLine 6
"""
from number_line_kit import *


class NumberLine(CaptionScene):
    TERM_ID = "2-md-number-line"

    def construct(self):
        # 1. The line and its numbers -------------------------------------
        self.caption("A number line is a line with numbers on it.")
        nl = NLine(0, 5, 1.28, 1.0)
        self.play(Create(nl.axis), FadeIn(nl.ticks), run_time=1.2, rate_func=ease)
        for k in range(6):
            self.sfx("number", 0.15 + k * 0.4, step=k)
        self.play(LaggedStart(*[FadeIn(l, shift=UP * 0.1) for l in nl.labels], lag_ratio=0.4),
                  run_time=2.4, rate_func=ease)
        self.wait(0.8)

        # 2. In order -----------------------------------------------------
        self.caption("The numbers are in order.")
        self.play(LaggedStart(*[l.animate.set_color(COLORS[2]) for l in nl.labels], lag_ratio=0.25),
                  run_time=2.0, rate_func=ease)
        self.wait(0.6)
        self.play(*[l.animate.set_color(WHITE) for l in nl.labels], run_time=0.6, rate_func=ease)

        # 3. Same distance apart -----------------------------------------
        self.caption("They are the same distance apart.")
        bars = VGroup(*[
            Line([nl.x(k) + 0.08, nl.y + 0.65, 0], [nl.x(k + 1) - 0.08, nl.y + 0.65, 0],
                     color=COLORS[k % 2], stroke_width=9) for k in range(5)])
        self.sfx("operation")
        self.play(LaggedStart(*[FadeIn(b) for b in bars], lag_ratio=0.3), run_time=2.0, rate_func=ease)
        self.wait(1.4)
        self.play(FadeOut(bars), FadeOut(nl.all()), run_time=0.7, rate_func=ease)

        # 4. Ivy hops -----------------------------------------------------
        self.caption("Ivy starts at 8 and hops to 13.")
        nl2 = NLine(8, 13, 1.28, 0.6)
        ivy = Dot(radius=0.2, color=COLORS[1]).move_to(nl2.rest(8))
        name = Text("Ivy", font_size=44, weight=BOLD, color=COLORS[1]).next_to(ivy, UP, buff=0.2)
        self.play(FadeIn(nl2.all()), run_time=1.0, rate_func=ease)
        self.sfx("number", step=4)
        self.play(FadeIn(ivy, scale=0.5), FadeIn(name), run_time=0.8, rate_func=ease)
        self.wait(1.0)
        self.play(FadeOut(name), run_time=0.4, rate_func=ease)

        self.caption("She counts 5 hops.")
        for k in range(1, 6):
            p0, p1 = nl2.rest(8 + k - 1), nl2.rest(8 + k)
            arc = hop_path(p0, p1)
            count = Text(str(k), font_size=44, weight=BOLD, color=YELLOW).move_to(
                [(p0[0] + p1[0]) / 2, nl2.y + 1.35, 0])
            self.sfx("number", 0.45, step=k - 1)
            self.play(MoveAlongPath(ivy, arc), Create(arc), run_time=0.9, rate_func=ease)
            self.play(FadeIn(count, shift=UP * 0.08), run_time=0.3, rate_func=ease)
            self.wait(0.15)
        self.wait(0.6)

        # 5. How far apart -----------------------------------------------
        self.caption("13 is 5 hops away from 8.")
        answer = Text("5 hops", font_size=76, weight=BOLD, color=YELLOW).move_to([0, -1.5, 0])
        self.sfx("result")
        self.play(FadeIn(answer, shift=UP * 0.12), run_time=0.8, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6, rate_func=ease)
        self.write_vtt()
