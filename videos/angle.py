"""Manim scene: "angle" (term id 4-md-angle), two rays at a vertex, opening wider and narrower.

Render:  videos/render.sh angle 4-md-angle Angle 12
"""
from common import *

VERTEX = np.array([-1.8, 0.2, 0.0])
RAY1_LEN, RAY2_LEN = 3.5, 3.0
ARC_R = 1.0
RAY1_C, RAY2_C, ARC_C = COLORS[0], COLORS[1], YELLOW


def at(angle, length):
    return VERTEX + length * np.array([np.cos(angle), np.sin(angle), 0])


class Angle(CaptionScene):
    TERM_ID = "4-md-angle"

    def construct(self):
        theta = ValueTracker(55 * DEGREES)

        ray1 = Arrow(VERTEX, at(0, RAY1_LEN), buff=0, color=RAY1_C, stroke_width=9,
                     max_tip_length_to_length_ratio=0.12, max_stroke_width_to_length_ratio=20)
        ray2 = always_redraw(lambda: Arrow(
            VERTEX, at(theta.get_value(), RAY2_LEN), buff=0, color=RAY2_C, stroke_width=9,
            max_tip_length_to_length_ratio=0.12, max_stroke_width_to_length_ratio=20))
        arc = always_redraw(lambda: Sector(
            radius=ARC_R, start_angle=0, angle=theta.get_value(), arc_center=VERTEX,
            color=ARC_C, fill_opacity=0.35, stroke_width=5))
        vertex = Dot(VERTEX, radius=0.17, color=ARC_C)

        # 1. Two rays -----------------------------------------------------
        self.caption("A ray starts at a point and goes on and on.")
        self.sfx("number", step=3)
        self.play(GrowArrow(ray1), run_time=1.2, rate_func=ease)
        self.sfx("number", step=1)
        self.add(ray2)
        self.play(FadeIn(ray2), run_time=1.0, rate_func=ease)
        self.wait(0.6)

        # 2. The vertex ---------------------------------------------------
        self.caption("Two rays meet at one point. That point is the vertex.")
        tag = Text("vertex", font_size=44, weight=BOLD, color=ARC_C).move_to(VERTEX + DOWN * 0.7)
        self.sfx("operation")
        self.play(FadeIn(vertex, scale=0.5), FadeIn(tag, shift=UP * 0.1), run_time=0.9, rate_func=ease)
        self.wait(1.4)

        # 3. The opening --------------------------------------------------
        self.caption("The opening between the rays is the angle.")
        label = always_redraw(lambda: Text("angle", font_size=44, weight=BOLD, color=ARC_C).move_to(
            at(theta.get_value() / 2, 1.9)))
        self.sfx("result")
        self.add(arc)
        self.play(FadeIn(arc), FadeOut(tag), FadeIn(label), run_time=1.0, rate_func=ease)
        self.wait(1.6)

        # 4. Wider and narrower ------------------------------------------
        self.caption("Open the rays wider. The angle gets bigger.")
        self.play(theta.animate.set_value(110 * DEGREES), run_time=2.6, rate_func=ease)
        self.wait(0.6)
        self.caption("Close them a little. The angle gets smaller.")
        self.play(theta.animate.set_value(35 * DEGREES), run_time=3.0, rate_func=ease)
        self.wait(0.8)

        self.caption("The angle is the space between the rays.")
        self.play(theta.animate.set_value(60 * DEGREES), run_time=1.6, rate_func=ease)
        self.wait(1.6)

        self.caption(None)
        self.play(FadeOut(VGroup(ray1, ray2, arc, vertex, label)), run_time=0.6, rate_func=ease)
        self.write_vtt()
