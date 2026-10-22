"""Ouverture : le prédicateur, la lumière dorée et les fidèles aux cœurs brisés."""
import math

import numpy as np

from src.animation import fx
from src.animation.easing import progress, smoothstep
from src.scenes.base import Scene

GOLD = (1.0, 0.80, 0.42)


class SceneEglise(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        # Étincelles qui montent doucement dans la lumière de la chaire
        self.sparks = fx.Particles(
            46, seed=11,
            spawn=lambda r: (r.uniform(380, 1260), r.uniform(120, 470)),
            velocity=lambda r: (r.uniform(-6, 6), r.uniform(-28, -12)),
            life=(2.2, 4.0), size=(3, 7), start=-6.0, rate=12)

    def render(self, t):
        ctx = self.ctx
        cam = self.camera(t)
        f = self.base(cam)
        dim = smoothstep(progress(t, self.t("dim_from"), self.t("dim_to") + 0.8)) * self.p["dim_amount"]

        # Faisceaux : respiration lente et décalée de chaque projecteur
        tx, ty = cam.to_screen(*self.p["beam_target"])
        light = np.zeros((ctx.h, ctx.w), np.float32)
        for i, (sx, sy) in enumerate(self.p["spotlights"]):
            x0, y0 = cam.to_screen(sx, sy)
            flick = 0.55 + 0.45 * math.sin(t * (1.1 + 0.23 * i) + i * 1.7)
            light += fx.beam(ctx, x0, y0, tx, ty, 18 * cam.s, 170 * cam.s) * flick
        f = fx.add(f, light, GOLD, 0.16 * (1 - dim * 2.5))

        gx, gy = cam.to_screen(*self.p["glow_center"])
        pulse = 0.5 + 0.5 * math.sin(t * 1.6)
        f = fx.add(f, fx.radial_glow(ctx, gx, gy, 300 * cam.s), (1.0, 0.86, 0.55), (0.10 + 0.06 * pulse) * (1 - dim * 3))

        # Étincelles
        pos, fade, _, _ = self.sparks.state(t, loop=True)
        sp = self.pts(cam, pos)
        buf = np.zeros((ctx.h, ctx.w), np.float32)
        for (x, y), a, s, ph in zip(sp, fade, self.sparks.size, self.sparks.phase):
            if a > 0.01:
                tw = 0.6 + 0.4 * math.sin(t * 5 + ph)
                fx.add_sprite(buf, fx.sparkle(s * cam.s / 1.6), x, y, a * tw)
        f = fx.add(f, np.clip(buf, 0, 1), (1.0, 0.9, 0.62), 0.85 * (1 - dim * 2))

        # Quand la narration évoque l'absence de paix : l'or s'éteint un peu
        if dim > 0:
            f = fx.desaturate(f, dim * 1.2) * (1 - dim * 0.5)
        return np.clip(f * fx.vignette(ctx, 0.28), 0, 1)
