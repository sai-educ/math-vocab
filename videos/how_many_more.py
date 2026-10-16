"""Manim scene: "how many more" (term id 1-oa-how-many-more), 8 - 5 = 3.

Render:  videos/render.sh how_many_more 1-oa-how-many-more HowManyMore 12
"""
from common import *

MAYA, LEO = 8, 5
STEP, DOT_R = 0.62, 0.2
ROW_LEFT = -1.7


def dot_row(count, color, y):
    row = VGroup(*[Dot(radius=DOT_R, color=color) for _ in range(count)])
    row.arrange(RIGHT, buff=STEP - 2 * DOT_R)
    return row.move_to([0, y, 0]).align_to([ROW_LEFT, 0, 0], LEFT)


def name_tag(name, count, color, y):
    tag = VGroup(Text(name, font_size=34, color=color),
                 Text(str(count), font_size=64, weight=BOLD, color=color))
    return tag.arrange(DOWN, buff=0.1).move_to([-2.9, y, 0])


class HowManyMore(CaptionScene):
    TERM_ID = "1-oa-how-many-more"

    def construct(self):
        # 1. Two amounts --------------------------------------------------
        self.caption("Maya has 8 stickers. Leo has 5.")
        maya = dot_row(MAYA, COLORS[0], 2.0)
        leo = dot_row(LEO, COLORS[1], 0.4)
        maya_tag = name_tag("Maya", MAYA, COLORS[0], 2.0)
        leo_tag = name_tag("Leo", LEO, COLORS[1], 0.4)
        self.sfx("number", step=4)
        self.play(FadeIn(maya_tag, shift=RIGHT * 0.12),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in maya], lag_ratio=0.12),
                  run_time=1.4, rate_func=ease)
        self.wait(0.5)
        self.sfx("number", step=2)
        self.play(FadeIn(leo_tag, shift=RIGHT * 0.12),
                  LaggedStart(*[FadeIn(d, scale=0.5) for d in leo], lag_ratio=0.12),
                  run_time=1.2, rate_func=ease)
        self.wait(1.0)

        # 2. Match them up ------------------------------------------------
        self.caption("Match them up, one to one.")
        links = VGroup(*[Line(maya[i].get_bottom() + DOWN * 0.08, leo[i].get_top() + UP * 0.08,
                              color=SOFT, stroke_width=3, stroke_opacity=0.7)
                         for i in range(LEO)])
        self.play(LaggedStart(*[Create(l) for l in links], lag_ratio=0.25),
                  run_time=1.8, rate_func=ease)
        self.wait(0.8)

        # 3. The extras are how many more ---------------------------------
        self.caption("The extras are how many more.")
        extras = VGroup(*maya[LEO:])
        brace = Brace(extras, DOWN, color=YELLOW, buff=0.15)
        more = Text("3 more", font_size=40, weight=BOLD, color=YELLOW)
        more.next_to(brace, DOWN, buff=0.15)
        self.play(extras.animate.set_color(YELLOW), run_time=0.9, rate_func=ease)
        self.sfx("result")
        self.play(GrowFromCenter(brace), FadeIn(more, shift=UP * 0.12),
                  run_time=0.9, rate_func=ease)
        self.wait(1.6)

        # 4. Subtract to find it ------------------------------------------
        self.caption("8 − 5 = 3. Maya has 3 more.")
        parts = [Text(t, font_size=70, weight=BOLD, color=c)
                 for t, c in (("8", COLORS[0]), ("−", WHITE), ("5", COLORS[1]),
                              ("=", WHITE), ("3", YELLOW))]
        eq = VGroup(*parts).arrange(RIGHT, buff=0.35).move_to(DOWN * 1.7)
        for part, (role, step) in zip(parts, (("number", 4), ("operation", 0), ("number", 2),
                                              ("operation", 0), ("result", 0))):
            self.sfx(role, step=step)
            self.play(FadeIn(part, shift=UP * 0.12), run_time=0.5, rate_func=ease)
        self.wait(2.0)

        self.caption(None)
        self.play(FadeOut(VGroup(maya, leo, maya_tag, leo_tag, links, brace, more, eq)),
                  run_time=0.6, rate_func=ease)
        self.write_vtt()
