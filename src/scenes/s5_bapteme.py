"""Le baptême de Jésus au Jourdain : eau vivante, gouttes, ondes et fumée qui s'éloigne."""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from src.animation import fx
from src.animation.easing import progress, smoothstep
from src.scenes.base import Scene

WATER = (0.12, 0.62, 0.95)


class SceneBapteme(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        p = self.p
        sx, sy = p["splash_center"]
        hit = self.t("splash_at")
        self.splash = fx.Particles(
            34, seed=51,
            spawn=lambda r: (sx + r.uniform(-90, 90), sy + r.uniform(-10, 10)),
            velocity=lambda r: (r.uniform(-260, 260), r.uniform(-620, -260)),
            gravity=(0, 1500), life=(0.7, 1.1), size=(3, 7), start=hit)
        # Gouttes qui retombent du côté gauche de la chevelure (sans passer devant le visage)
        self.drips = fx.Particles(
            26, seed=52,
            spawn=lambda r: (r.uniform(748, 800), r.uniform(520, 600)),
            velocity=lambda r: (0, r.uniform(40, 120)),
            gravity=(0, 900), life=(0.45, 0.7), size=(3, 5), start=-30, rate=3.2)
        x0, y0, x1, y1 = p["smoke_region"]
        a = np.asarray(self.img, np.float32)
        dark = (a.max(2) < 110).astype(np.uint8) * 255
        region = np.zeros_like(dark)
        region[y0:y1, x0:x1] = dark[y0:y1, x0:x1]
        self.smoke_mask = Image.fromarray(region).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(30))

    def ripple_displace(self, f, cam, t):
        """Ondulation horizontale uniquement sous la ligne d'eau (personnages épargnés)."""
        ctx = self.ctx
        _, top = cam.to_screen(0, self.p["water_top"])
        _, full = cam.to_screen(0, self.p["water_full"])
        y0 = int(max(top, 0))
        if y0 >= ctx.h:
            return f
        ys = np.arange(y0, ctx.h, dtype=np.float32)
        amp = np.clip((ys - top) / max(full - top, 1), 0, 1) * 3.2 * ctx.k * cam.s / 1.15
        dx = amp * np.sin(ys * 0.045 / ctx.k + t * 2.6) + amp * 0.5 * np.sin(ys * 0.11 / ctx.k - t * 1.7)
        xs = np.arange(ctx.w, dtype=np.float32)[None, :] - dx[:, None]
        x0 = np.clip(np.floor(xs).astype(np.int32), 0, ctx.w - 1)
        x1 = np.clip(x0 + 1, 0, ctx.w - 1)
        w = (xs - np.floor(xs))[..., None]
        rows = f[y0:]
        idx = np.arange(rows.shape[0])[:, None]
        f[y0:] = rows[idx, x0] * (1 - w) + rows[idx, x1] * w
        return f

    def render(self, t):
        ctx = self.ctx
        cam = self.camera(t)
        f = self.base(cam)
        f = self.ripple_displace(f, cam, t)

        # Ondes circulaires (uniquement dans l'eau, devant les personnages)
        rx, ry = cam.to_screen(*self.p["ripple_center"])
        ring = Image.new("L", (ctx.w, ctx.h), 0)
        d = ImageDraw.Draw(ring)
        for i in range(3):
            age = (t + i * 0.8) % 2.4
            r = (40 + 260 * age / 2.4) * cam.s
            a = int(200 * math.sin(math.pi * age / 2.4))
            d.ellipse([rx - r, ry - r * 0.16, rx + r, ry + r * 0.16], outline=a, width=max(int(3 * ctx.k), 1))
        ring = np.asarray(ring.filter(ImageFilter.GaussianBlur(1.2 * ctx.k)), np.float32) / 255
        _, wt = cam.to_screen(0, self.p["water_top"])
        rows = np.clip((np.arange(ctx.h, dtype=np.float32) - wt) / (12 * cam.s), 0, 1)[:, None]
        f = fx.add(f, ring * rows, (0.85, 0.97, 1.0), 0.75)

        # Accent lumineux discret sur l'eau
        f = fx.add(f, fx.radial_glow(ctx, rx, ry, 520 * cam.s) * rows, (0.55, 0.85, 1.0), 0.12 + 0.04 * math.sin(t * 1.4))

        # Fumée noire : dérive vers l'extérieur, plus marquée au mot « transférés »
        mask = np.asarray(cam.render(self.smoke_mask), np.float32) / 255
        boost = smoothstep(progress(t, self.t("smoke_boost_at") - 0.3, self.t("smoke_boost_at") + 1.0))
        sm = fx.upscale(fx.smoke(ctx, t, seed=61, speed=(48 + 40 * boost, -26 - 20 * boost), lo=0.42, hi=0.82), ctx.w, ctx.h)
        f = fx.over(f, sm * mask * (0.25 + 0.25 * boost), (0.08, 0.08, 0.09))
        hl = fx.upscale(fx.smoke(ctx, t, seed=62, speed=(70, -35), lo=0.6, hi=0.92), ctx.w, ctx.h)
        f = fx.add(f, hl * mask, (0.55, 0.55, 0.6), 0.1)

        # Gouttes et éclaboussures
        buf = np.zeros((ctx.h, ctx.w), np.float32)
        for system, loop in ((self.drips, True), (self.splash, False)):
            pos, fade, _, _ = system.state(t, loop=loop)
            for (x, y), a, s in zip(self.pts(cam, pos), fade, system.size):
                if a > 0.01:
                    fx.add_sprite(buf, fx.soft_dot(s * cam.s / 2), x, y, a)
        a = np.clip(buf, 0, 1)
        f = fx.over(f, a * 0.9, WATER)
        f = fx.add(f, a, (0.9, 0.98, 1.0), 0.25)
        return np.clip(f * fx.vignette(ctx, 0.1), 0, 1)
