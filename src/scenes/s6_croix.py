"""La Croix et la délivrance : rayons qui s'intensifient, chaînes qui s'écartent à la
rupture, éclats et légère secousse synchronisés sur « l'œuvre du salut ».

Les chaînes sont détourées par couleur (noir / rouge, hors de la zone de la Croix)
et le fond est reconstruit derrière elles ; la Croix reste intacte."""
import math

import numpy as np
from PIL import Image, ImageFilter

from src.animation import fx
from src.animation.camera import layer_offset, to_float
from src.animation.easing import out_cubic, progress, smoothstep
from src.scenes.base import Scene
from src.scenes.s3_demi_evangile import shard_sprite


def component_sides(mask, split=(790, 850)):
    """Étiquette les composantes connexes (à mi-résolution) et renvoie 1 = gauche,
    2 = droite, 0 = centre, selon le centre de gravité de chaque composante."""
    small = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize(
        (mask.shape[1] // 2, mask.shape[0] // 2), Image.NEAREST)) > 0
    lab = np.where(small, np.arange(1, small.size + 1).reshape(small.shape), 0)
    while True:
        p = np.pad(lab, 1)
        nb = np.maximum.reduce([p[1:-1, 1:-1], p[:-2, 1:-1], p[2:, 1:-1], p[1:-1, :-2], p[1:-1, 2:]])
        nb = np.where(small, nb, 0)
        if np.array_equal(nb, lab):
            break
        lab = nb
    ids, inv = np.unique(lab, return_inverse=True)
    xs = np.broadcast_to(np.arange(small.shape[1])[None, :] * 2.0, small.shape).ravel()
    cx = np.bincount(inv.ravel(), xs) / np.maximum(np.bincount(inv.ravel()), 1)
    side_of = np.where(cx < split[0], 1, np.where(cx > split[1], 2, 0))
    side_of[ids == 0] = 0
    side = side_of[inv].reshape(small.shape).astype(np.uint8)
    return np.asarray(Image.fromarray(side).resize((mask.shape[1], mask.shape[0]), Image.NEAREST))


def fill_holes(rgb, hole, exclude, radii=(8, 20, 45, 100, 220)):
    """Reconstruit le fond sous les chaînes : pour chaque pixel masqué, moyenne des
    pixels de fond voisins au plus petit rayon qui en contient assez (sans
    échantillonner les couleurs des chaînes elles-mêmes)."""
    keep = (1 - hole) * (1 - exclude)
    out = rgb.copy()
    todo = hole > 0.5
    for r in radii:
        den = fx.gauss_blur(keep, r)
        est = fx.gauss_blur(rgb * keep[..., None], r) / np.maximum(den, 1e-6)[..., None]
        ok = todo & (den > 0.08) if r != radii[-1] else todo
        out[ok] = est[ok]
        todo &= ~ok
    return out


class SceneCroix(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        a = np.asarray(self.img, np.float32)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        mx, mn = a.max(2), a.min(2)
        chain = ((mx < 150) & (mx - mn < 45)) | ((r > 120) & (g < 95) & (b < 95) & (r > 1.8 * g))
        allowed = np.ones(chain.shape, bool)
        for x0, y0, x1, y1 in self.p["cross_box"]:
            allowed[y0:y1, x0:x1] = False
        allowed[:345] = False
        chain &= allowed
        m = Image.fromarray((chain * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
        m = np.asarray(m.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
        m *= allowed
        side = component_sides(m > 0.02)
        left, right = m * (side == 1), m * (side == 2)
        hole = np.asarray(Image.fromarray(((left + right) > 0.02).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) / 255.0
        support = np.asarray(Image.fromarray((m > 0.02).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) / 255.0
        plate = fill_holes(a / 255, hole.astype(np.float32), support.astype(np.float32))
        self.plate = Image.fromarray((np.clip(plate, 0, 1) * 255).astype(np.uint8))
        self.left = Image.fromarray(np.dstack([a, left * 255]).astype(np.uint8), "RGBA")
        self.right = Image.fromarray(np.dstack([a, right * 255]).astype(np.uint8), "RGBA")
        self.impact = self.t("impact")
        bx, by = self.p["burst_center"]
        self.burst = fx.Particles(
            36, seed=71,
            spawn=lambda r: (bx + r.uniform(-60, 60), by + r.uniform(-120, 80)),
            velocity=lambda r: (r.choice([-1, 1]) * r.uniform(250, 820), r.uniform(-650, -120)),
            gravity=(0, 1500), life=(0.9, 1.4), size=(14, 30), start=self.impact)
        rng = np.random.default_rng(72)
        self.shards = [shard_sprite(rng, 48) for _ in range(8)]
        self.sparks = fx.Particles(
            60, seed=73,
            spawn=lambda r: (bx + r.uniform(-30, 30), by + r.uniform(-200, 0)),
            velocity=lambda r: (r.uniform(-700, 700), r.uniform(-700, 200)),
            gravity=(0, 400), life=(0.4, 0.9), size=(3, 6), start=self.impact)

    def sfx_events(self):
        t0 = self.t("tension_from")
        return [(t0, "rumble", -9.0, self.impact - t0 + 0.05), (self.impact - 0.01, "impact", -9.0)]

    def render(self, t):
        ctx = self.ctx
        dt = t - self.impact
        shake = (0.0, 0.0)
        punch = 1.0
        if 0 <= dt < 0.6:
            decay = math.exp(-dt * 7)
            shake = (9 * decay * math.sin(dt * 71), 7 * decay * math.sin(dt * 53 + 1))
            punch = 1 + 0.035 * math.sin(math.pi * min(dt / 0.35, 1)) * decay
        cam = self.camera(t, zoom_mul=punch, shake=shake)
        f = to_float(cam.render(self.plate))

        # Chaînes : tension croissante puis écartement vers l'extérieur
        tension = smoothstep(progress(t, self.t("tension_from"), self.impact))
        jit = 1.6 * tension * math.sin(t * 47) if dt < 0 else 0.0
        push = out_cubic(progress(t, self.impact, self.impact + 0.9)) * self.p["chain_push"]
        rot = out_cubic(progress(t, self.impact, self.impact + 1.1)) * self.p["chain_rot_deg"]
        for layer, sign, pivot in ((self.left, -1, (0, 640)), (self.right, 1, (1671, 640))):
            lm = layer_offset(sign * push + jit * sign, 0.3 * push + jit * 0.5, -sign * rot, pivot)
            rgba = to_float(cam.render(layer, lm))
            f = f * (1 - rgba[..., 3:4]) + rgba[..., :3] * rgba[..., 3:4]

        # Rayons dorés qui s'intensifient, éclair au moment de la rupture
        cx, cy = cam.to_screen(*self.p["ray_center"])
        build = 0.18 + 0.32 * smoothstep(progress(t, 32.0, self.impact))
        flash = math.exp(-max(dt, 0) * 3.2) if dt >= 0 else 0.0
        f = fx.add(f, fx.rays(ctx, cx, cy, t, count=11, speed=0.03, radius=700), (1.0, 0.84, 0.48), build + 0.45 * flash)
        f = fx.add(f, fx.radial_glow(ctx, cx, cy, (220 + 500 * flash) * cam.s), (1.0, 0.93, 0.75), 0.25 + 0.7 * flash)

        # Éclats rouges et noirs projetés puis dissipés
        if dt >= 0:
            pos, fade, life_p, _ = self.burst.state(t)
            for i, ((x, y), a, s, ph, lp) in enumerate(zip(self.pts(cam, pos), fade, self.burst.size,
                                                             self.burst.phase, life_p)):
                if a > 0.02:
                    a = min(1.0, (1 - lp) * 2.2)
                    spr = self.shards[i % len(self.shards)]
                    size = max(int(s * cam.s), 4)
                    im = spr.resize((size, size), Image.BICUBIC).rotate(math.degrees(ph + lp * 9), Image.BICUBIC, expand=True)
                    rgba = fx.rgba_from_pil(im)
                    h, w = rgba.shape[:2]
                    fx.paste_rgba(f, rgba, x - w / 2, y - h / 2, a)
            pos, fade, _, _ = self.sparks.state(t)
            buf = np.zeros((ctx.h, ctx.w), np.float32)
            for (x, y), a, s in zip(self.pts(cam, pos), fade, self.sparks.size):
                if a > 0.02:
                    fx.add_sprite(buf, fx.soft_dot(s * cam.s / 2), x, y, a)
            f = fx.add(f, np.clip(buf, 0, 1), (1.0, 0.75, 0.4), 1.0)
        return np.clip(f, 0, 1)
