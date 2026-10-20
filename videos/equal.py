"""Manim scene: "equal" (term ids k-cc-equal, 1-nbt-equal-to), a balance showing 3 = 3.

Render:  videos/render.sh equal k-cc-equal Equal 12   (then copy to 1-nbt-equal-to)
"""
from common import *

N = 3
PIVOT = np.array([0.0, 0.9, 0.0])
HALF = 2.5
TILT = 0.2
BLOCK = 0.5


def pan(end, color, alpha):
    """A hanging pan under a beam end, with N blocks at opacity `alpha`."""
    plate_c = end + DOWN * 1.35
    strings = VGroup(Line(end, plate_c + LEFT * 0.9, color=SOFT, stroke_width=3),
                     Line(end, plate_c + RIGHT * 0.9, color=SOFT, stroke_width=3))
    plate = RoundedRectangle(corner_radius=0.06, width=2.0, height=0.14, color=SOFT,
                             fill_opacity=1, stroke_width=0).move_to(plate_c)
    blocks = VGroup(*[Square(side_length=BLOCK, color=color, fill_opacity=alpha * 0.95,
                             stroke_width=0) for _ in range(N)])
    blocks.arrange(RIGHT, buff=0.12).next_to(plate, UP, buff=0)
    blocks.set_stroke(opacity=0).set_fill(color, opacity=alpha * 0.95)
    return VGroup(strings, plate, blocks)


class Equal(CaptionScene):
    TERM_ID = "k-cc-equal"

    def construct(self):
        tilt, right_alpha = ValueTracker(TILT), ValueTracker(0)

        def ends():
            a = tilt.get_value()
            off = HALF * np.array([np.cos(a), -np.sin(a), 0])
            return PIVOT - off, PIVOT + off

        def beam():
            l, r = ends()
            return Line(l, r, color=WHITE, stroke_width=9)

        post = VGroup(Line(PIVOT, PIVOT + DOWN * 2.2, color=SOFT, stroke_width=6),
                      RoundedRectangle(corner_radius=0.08, width=1.6, height=0.18, color=SOFT,
                                       fill_opacity=1, stroke_width=0).move_to(PIVOT + DOWN * 2.25))
        hub = Dot(PIVOT, radius=0.13, color=YELLOW)
        scale_l = always_redraw(lambda: pan(ends()[0], COLORS[0], 1))
        scale_r = always_redraw(lambda: pan(ends()[1], COLORS[1], right_alpha.get_value()))
        scale_beam = always_redraw(beam)

        # 1. One side is heavier -----------------------------------------
        self.caption("Equal means the same amount.")
        self.sfx("number", step=3)
        self.play(FadeIn(post), FadeIn(scale_beam), FadeIn(scale_l), FadeIn(scale_r), FadeIn(hub),
                  run_time=1.3, rate_func=ease)
        self.add(hub)
        self.wait(1.2)

        # 2. Add to the other side ---------------------------------------
        self.caption("Add 3 to the other side.")
        for k in range(N):
            self.sfx("number", 0.2 + k * 0.3, step=k)
        self.play(right_alpha.animate.set_value(1), run_time=1.4, rate_func=ease)
        self.wait(0.6)
        self.sfx("result")
        self.play(tilt.animate.set_value(0), run_time=1.6, rate_func=ease)
        self.wait(0.8)

        # 3. Level scale --------------------------------------------------
        self.caption("Now both sides match, so the scale is level.")
        self.wait(2.0)

        # 4. Equal sign ---------------------------------------------------
        self.caption("3 = 3. The equal sign says both sides are the same.")
        parts = [Text(t, font_size=76, weight=BOLD, color=c)
                 for t, c in (("3", COLORS[0]), ("=", YELLOW), ("3", COLORS[1]))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.45).move_to(DOWN * 2.35)
        for part, (role, step) in zip(parts, (("number", 3), ("operation", 0), ("number", 3))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.2)

        self.caption(None)
        self.play(FadeOut(VGroup(post, scale_beam, scale_l, scale_r, hub, eq)), run_time=0.6, rate_func=ease)
        self.write_vtt()
