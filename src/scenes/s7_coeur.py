"""Le cœur purifié : respiration de l'image, pulsation du cœur lumineux, rayons et particules."""
import math

import numpy as np

from src.animation import fx
from src.scenes.base import Scene


class SceneCoeur(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        hx, hy = self.p["heart"]
        self.motes = fx.Particles(
            60, seed=81,
            spawn=lambda r: (hx + r.uniform(-700, 700), hy + r.uniform(-150, 450)),
            velocity=lambda r: (r.uniform(-10, 10), r.uniform(-60, -25)),
            life=(2.5, 4.5), size=(3, 8), start=30, rate=14)

    def render(self, t):
        ctx = self.ctx
        breath = 1 + 0.006 * math.sin(2 * math.pi * t / self.p["breath_period"])
        cam = self.camera(t, zoom_mul=breath)
        f = self.base(cam)
        hx, hy = cam.to_screen(*self.p["heart"])

        f = fx.add(f, fx.rays(ctx, hx, hy, t, count=9, speed=0.02, sharp=8, radius=800), (1.0, 0.9, 0.55),
                   0.16 + 0.06 * min(max(t - 38, 0) / 4, 1))
        dt = t - self.t("pulse_at")
        pulse = (1 - math.exp(-max(dt, 0) * 8)) * math.exp(-max(dt, 0) * 1.6) if dt > 0 else 0.0
        gentle = 0.5 + 0.5 * math.sin(2 * math.pi * t / 1.9)
        f = fx.add(f, fx.radial_glow(ctx, hx, hy, (150 + 60 * pulse) * cam.s), (1.0, 0.95, 0.75),
                   0.3 + 0.05 * gentle + 0.35 * pulse)

        pos, fade, _, _ = self.motes.state(t, loop=True)
        buf = np.zeros((ctx.h, ctx.w), np.float32)
        for (x, y), a, s, ph in zip(self.pts(cam, pos), fade, self.motes.size, self.motes.phase):
            if a > 0.01:
                fx.add_sprite(buf, fx.soft_dot(s * cam.s / 2), x + math.sin(t + ph) * 8 * ctx.k, y, a * 0.8)
        f = fx.add(f, np.clip(buf, 0, 1), (1.0, 0.88, 0.5), 0.9)
        return np.clip(f, 0, 1)
