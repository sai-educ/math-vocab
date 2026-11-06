"""Helpers shared by the number line, positive number and negative number scenes."""
from common import *

MINUS = "−"


def fmt(n):
    return f"{MINUS}{abs(n)}" if n < 0 else str(n)


class NLine:
    """A drawn number line from `lo` to `hi`; `x(n)` gives the x position of n."""

    def __init__(self, lo, hi, spacing, y, label_size=44):
        self.lo, self.hi, self.spacing, self.y = lo, hi, spacing, y
        mid = (lo + hi) / 2
        self._x0 = -mid * spacing
        pad = 0.3
        self.axis = seg(self.x(lo) - pad, self.x(hi) + pad, y)
        self.ticks = VGroup(*[vtick(self.x(n), y) for n in range(lo, hi + 1)])
        self.labels = VGroup(*[self._label(n, label_size) for n in range(lo, hi + 1)])

    def _label(self, n, size):
        """Digit label; a negative gets a short drawn minus so neighbours never touch."""
        digit = Text(str(abs(n)), font_size=size, weight=BOLD, color=WHITE)
        label = VGroup(digit)
        if n < 0:
            bar = Line(LEFT * 0.07, RIGHT * 0.07, stroke_width=6, color=WHITE)
            bar.next_to(digit, LEFT, buff=0.04)
            label = VGroup(bar, digit)
        return label.move_to([self.x(n), self.y - 0.6, 0])

    def x(self, n):
        return self._x0 + n * self.spacing

    def label(self, n):
        return self.labels[n - self.lo]

    def tick(self, n):
        return self.ticks[n - self.lo]

    def rest(self, n, lift=0.24):
        """Where a counter sits when it stands at n."""
        return np.array([self.x(n), self.y + lift, 0])

    def all(self):
        return VGroup(self.axis, self.ticks, self.labels)


def seg(x0, x1, y):
    return Line([x0, y, 0], [x1, y, 0], color=SOFT, stroke_width=6)


def vtick(x, y):
    return Line([x, y - 0.17, 0], [x, y + 0.17, 0], color=SOFT, stroke_width=5)


def hop_path(p0, p1, height=0.75, color=COLORS[1]):
    """A smooth arc from p0 to p1 (sine hump, no bounce)."""
    return ParametricFunction(
        lambda t: np.array([p0[0] + (p1[0] - p0[0]) * t, p0[1] + height * np.sin(PI * t), 0]),
        t_range=[0, 1], color=color, stroke_width=5)
