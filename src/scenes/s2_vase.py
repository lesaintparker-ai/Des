"""Le piège de la repentance quotidienne : le vase qu'on ne parvient pas à nettoyer."""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from src.animation import fx
from src.animation.easing import out_cubic, progress
from src.scenes.base import Scene

INK = (0.035, 0.035, 0.045)
GRAVITY = 2400.0      # px source / s²
FORM = 0.45           # durée de formation de la goutte au bout de la coulure


class SceneVase(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        self.period = self.p["drip_period"]
        self.floor = self.p["floor_y"]

    def drops(self, t):
        """Gouttes actives : (x, y, échelle, temps depuis l'impact ou None)."""
        out = []
        t0 = -0.8
        for i, (x, y, ph) in enumerate(self.p["drips"]):
            fall = math.sqrt(2 * max(self.floor + (i % 3) * 8 - y, 10) / GRAVITY)
            per = self.period * (1 + 0.13 * (i % 4))
            cycle_start = t0 + ph * self.period
            k = math.floor((t - cycle_start) / per)
            for c in (k, k - 1):
                start = cycle_start + c * per
                age = t - start
                if age < 0:
                    continue
                if age < FORM:
                    out.append((x, y, 0.35 + 0.65 * age / FORM, None, y))
                elif age < FORM + fall:
                    a = age - FORM
                    out.append((x, y + 0.5 * GRAVITY * a * a, 1.0, None, y))
                elif age < FORM + fall + 0.5:
                    out.append((x, self.floor + (i % 3) * 8, 1.0, age - FORM - fall, y))
        return out

    def impacts(self, t_from, t_to):
        times = []
        for i, (x, y, ph) in enumerate(self.p["drips"]):
            fall = math.sqrt(2 * max(self.floor + (i % 3) * 8 - y, 10) / GRAVITY)
            per = self.period * (1 + 0.13 * (i % 4))
            start = -0.8 + ph * self.period
            while start + FORM + fall < t_to:
                hit = start + FORM + fall
                if hit >= t_from:
                    times.append((hit, i))
                start += per
        return sorted(times)

    def sfx_events(self):
        start, end = 4.3, 10.4  # uniquement quand la scène du vase est à l'écran
        return [(t, "drip", -17.0 - (i % 3) * 2.5) for t, i in self.impacts(start, end)]

    def render(self, t):
        ctx = self.ctx
        cam = self.camera(t)
        f = self.base(cam)
        alpha = np.zeros((ctx.h, ctx.w), np.float32)

        # Extension lente de la flaque
        g = out_cubic(progress(t, self.t("puddle_grow_from"), self.t("puddle_grow_from") + 2.6))
        if g > 0:
            im = Image.new("L", (ctx.w, ctx.h), 0)
            d = ImageDraw.Draw(im)
            for j, (px, py) in enumerate(self.p["puddle_edges"]):
                rx = (18 + 38 * g) * cam.s * (1 + 0.08 * math.sin(t * 2 + j))
                ry = (6 + 11 * g) * cam.s
                sx, sy = cam.to_screen(px, py)
                d.ellipse([sx - rx, sy - ry, sx + rx, sy + ry], fill=255)
            im = im.filter(ImageFilter.GaussianBlur(1.2 * ctx.k))
            alpha = np.maximum(alpha, np.asarray(im, np.float32) / 255)

        # Gouttes qui se forment, tombent, puis éclaboussent la flaque
        for x, y, scale, hit_age, _ in self.drops(t):
            sx, sy = cam.to_screen(x, y)
            if hit_age is None:
                spr = fx.drop_sprite(max(int(13 * cam.s * scale), 3))
                h, w = spr.shape
                region_y, region_x = int(sy - h * 0.15), int(sx - w / 2)
                ya, xa = max(region_y, 0), max(region_x, 0)
                yb, xb = min(region_y + h, ctx.h), min(region_x + w, ctx.w)
                if ya < yb and xa < xb:
                    alpha[ya:yb, xa:xb] = np.maximum(alpha[ya:yb, xa:xb],
                                                     spr[ya - region_y:yb - region_y, xa - region_x:xb - region_x])
            else:
                # Petite onde concentrique sur la flaque
                r = (8 + 70 * out_cubic(hit_age / 0.5)) * cam.s
                ring = Image.new("L", (ctx.w, ctx.h), 0)
                ImageDraw.Draw(ring).ellipse([sx - r, sy - r * 0.22, sx + r, sy + r * 0.22],
                                             outline=int(255 * (1 - hit_age / 0.5)), width=max(int(2 * ctx.k), 1))
                f = fx.add(f, np.asarray(ring, np.float32) / 255, (0.55, 0.55, 0.6), 0.6)
        f = fx.over(f, alpha, INK)
        return np.clip(f * fx.vignette(ctx, 0.12), 0, 1)
