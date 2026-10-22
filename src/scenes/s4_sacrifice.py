"""L'Ancien Testament : l'imposition des mains sur l'agneau et le transfert symbolique."""
import math

import numpy as np

from src.animation import fx
from src.animation.easing import progress, smoothstep
from src.scenes.base import Scene


class SceneSacrifice(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        hx, hy = self.p["hands"]
        tx, ty = self.p["transfer_to"]
        t0 = self.t("transfer_from")
        # Particules sombres qui glissent des mains vers la fumée (le long du dos de l'agneau)
        self.motes = fx.Particles(
            70, seed=41,
            spawn=lambda r: (hx + r.uniform(-25, 35), hy + r.uniform(-10, 25)),
            velocity=lambda r: ((tx - hx) / r.uniform(1.6, 2.6), (ty - hy) / r.uniform(1.6, 2.6) + r.uniform(-20, 20)),
            life=(1.4, 2.4), size=(4, 9), start=t0 - 0.2, rate=28)
        # Fumée animée limitée à la zone où l'illustration montre déjà la fumée
        x0, y0, x1, y1 = self.p["smoke_region"]
        a = np.asarray(self.img, np.float32)
        dark = (a.max(2) < 120).astype(np.float32)
        region = np.zeros_like(dark)
        region[y0:y1, x0:x1] = 1
        from PIL import Image, ImageFilter
        m = Image.fromarray((dark * region * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(31))
        self.smoke_mask = m.filter(ImageFilter.GaussianBlur(28))

    def render(self, t):
        ctx = self.ctx
        cam = self.camera(t)
        f = self.base(cam)

        # Lumière douce sur le Tabernacle
        tx, ty = cam.to_screen(*self.p["tabernacle"])
        f = fx.add(f, fx.radial_glow(ctx, tx, ty, 300 * cam.s), (1.0, 0.85, 0.5), 0.16 + 0.05 * math.sin(t * 1.3))

        # Ondulation de fumée (calque multiplicatif, masqué sur la fumée existante)
        mask = np.asarray(cam.render(self.smoke_mask), np.float32) / 255
        boost = smoothstep(progress(t, self.t("transfer_from"), self.t("transfer_from") + 1.2))
        sm = fx.upscale(fx.smoke(ctx, t, seed=31, speed=(42, -9), lo=0.42, hi=0.8, offset=(-cam.cx * 0.25, 0)), ctx.w, ctx.h)
        f = fx.over(f, sm * mask * (0.32 + 0.18 * boost), (0.09, 0.09, 0.1))
        lift = fx.upscale(fx.smoke(ctx, t, seed=32, speed=(55, -14), lo=0.55, hi=0.9), ctx.w, ctx.h)
        f = fx.add(f, lift * mask, (0.5, 0.5, 0.55), 0.12)

        # Mains : légère lumière au moment de l'imposition
        hx, hy = cam.to_screen(*self.p["hands"])
        hand_glow = smoothstep(progress(t, self.t("transfer_from") - 0.3, self.t("transfer_from") + 0.8))
        f = fx.add(f, fx.radial_glow(ctx, hx, hy, 130 * cam.s), (1.0, 0.9, 0.65), 0.22 * hand_glow)

        # Transfert symbolique
        pos, fade, life_p, _ = self.motes.state(t)
        sp = self.pts(cam, pos)
        buf = np.zeros((ctx.h, ctx.w), np.float32)
        for (x, y), a, s, ph, lp in zip(sp, fade, self.motes.size, self.motes.phase, life_p):
            if a > 0.01:
                wob = math.sin(ph + lp * 6) * 10 * cam.s
                fx.add_sprite(buf, fx.soft_dot(s * cam.s / 2), x, y + wob, a * 0.85)
        f = fx.over(f, np.clip(buf, 0, 1) * 0.8, (0.06, 0.06, 0.07))
        return np.clip(f * fx.vignette(ctx, 0.1), 0, 1)
