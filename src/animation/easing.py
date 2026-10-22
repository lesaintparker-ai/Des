"""Courbes d'accélération / décélération et interpolation de keyframes."""
import math

from src.common import T


def clamp(x, lo=0.0, hi=1.0):
    return lo if x < lo else hi if x > hi else x


def progress(t, t0, t1):
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return clamp((t - t0) / (t1 - t0))


def smoothstep(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def in_out_cubic(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def in_out_sine(x):
    return -(math.cos(math.pi * clamp(x)) - 1) / 2


def out_cubic(x):
    return 1 - (1 - clamp(x)) ** 3


def out_back(x, s=1.4):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def in_quad(x):
    return clamp(x) ** 2


def fade_window(t, t_in, t_out, d_in=0.4, d_out=0.4):
    """Opacité 0→1 à partir de t_in puis 1→0 jusqu'à t_out."""
    a = smoothstep(progress(t, t_in, t_in + d_in))
    if t_out is not None:
        a *= 1 - smoothstep(progress(t, t_out - d_out, t_out))
    return a


class Keyframes:
    """Interpole des vecteurs [t, v1, v2, ...] avec un easing in-out entre chaque clé."""

    def __init__(self, keys, ease=in_out_sine):
        self.keys = sorted(([T(k[0])] + [float(v) for v in k[1:]] for k in keys), key=lambda k: k[0])
        self.ease = ease

    def __call__(self, t):
        ks = self.keys
        if t <= ks[0][0]:
            return ks[0][1:]
        for a, b in zip(ks, ks[1:]):
            if t <= b[0]:
                p = self.ease(progress(t, a[0], b[0]))
                return [va + (vb - va) * p for va, vb in zip(a[1:], b[1:])]
        return ks[-1][1:]
