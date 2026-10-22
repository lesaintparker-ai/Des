"""Le demi-évangile.

L'illustration de la Bible ouverte n'a pas été fournie : la scène est construite
avec de la typographie animée sur fond de fumée, puis un écran partagé utilisant
les illustrations originales de la Croix (mise en lumière) et du baptême
(volontairement estompé : « oublié »)."""
import math

import numpy as np
from PIL import Image, ImageDraw

from src.animation import fx
from src.animation.easing import fade_window, out_back, out_cubic, progress, smoothstep
from src.animation.text import place_centered, text_layer
from src.common import T, path
from src.scenes.base import Scene

BG_A = np.array([0.045, 0.045, 0.055], np.float32)
BG_B = np.array([0.11, 0.095, 0.09], np.float32)
CARD_W, CARD_H = 800, 450


def rounded_mask(w, h, r):
    ss = 3
    im = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255


def shard_sprite(rng, size):
    ss = 4
    s = size * ss
    pts = [(s / 2 + math.cos(a) * s * rng.uniform(0.25, 0.5), s / 2 + math.sin(a) * s * rng.uniform(0.2, 0.5))
           for a in sorted(rng.uniform(0, 2 * math.pi, 5))]
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon(pts, fill=(205, 20, 25, 255))
    inner = [(s / 2 + (x - s / 2) * 0.72 - s * 0.05, s / 2 + (y - s / 2) * 0.72 - s * 0.03) for x, y in pts]
    d.polygon(inner, fill=(22, 18, 20, 255))
    return im.resize((size, size), Image.LANCZOS)


class SceneDemiEvangile(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        k = ctx.k
        self.cw, self.chh = int(CARD_W * k), int(CARD_H * k)
        self.round = rounded_mask(self.cw, self.chh, int(18 * k))
        bw = max(int(3 * k), 1)
        self.edge = self.round - np.pad(rounded_mask(self.cw - 2 * bw, self.chh - 2 * bw, int(16 * k)), bw)
        self.cross = Image.open(path(cfg["cross_image"])).convert("RGB")
        self.bapt = Image.open(path(cfg["baptism_image"])).convert("RGB")
        self.lines = []
        for ln in self.p["lines"]:
            layer = text_layer(ln["text"], ln["font"], ln["weight"], int(ln["size"] * k), tuple(ln["color"]),
                               tracking=0.12 if ln["font"] == "sans" else 0.04,
                               glow=(236, 170, 70, 0.55) if ln["font"] == "title" else None)
            self.lines.append((layer, T(ln["at"]), ln["y"] * k))
        cap = self.p["captions"]
        self.cap_cross = text_layer(cap[0], "title", "Bold", int(40 * k), (238, 196, 104), tracking=0.18)
        self.cap_bapt = text_layer(cap[1], "title", "Bold", int(40 * k), (150, 150, 155), tracking=0.18)
        rng = np.random.default_rng(5)
        self.shards = [shard_sprite(rng, int(rng.uniform(14, 30) * k)) for _ in range(14)]
        self.shard_state = [(rng.uniform(0, 1), rng.uniform(0, 1), rng.uniform(-1, 1), rng.uniform(0, 6.28),
                             rng.uniform(-25, 25)) for _ in range(14)]

    def project(self, t, x, y):
        return self.ctx.w / 2, self.ctx.h / 2

    def card(self, img, t, zoom):
        """Vignette 16:9 de l'illustration avec un lent zoom intérieur."""
        iw, ih = img.size
        cw, ch = iw / zoom, ih / zoom
        box = (iw / 2 - cw / 2, ih / 2 - ch / 2, iw / 2 + cw / 2, ih / 2 + ch / 2)
        c = np.asarray(img.resize((self.cw, self.chh), Image.BICUBIC, box=box), np.float32) / 255
        return c

    def background(self, t, drift):
        ctx = self.ctx
        g = fx.radial_glow(ctx, ctx.w * 0.5, ctx.h * 0.45, ctx.w * 0.6)
        f = BG_A[None, None, :] + (BG_B - BG_A)[None, None, :] * g[..., None]
        sm = fx.upscale(fx.smoke(ctx, t, seed=21, speed=(22, -6), lo=0.4, hi=0.9, offset=(drift * 0.2, 0)), ctx.w, ctx.h)
        f = fx.over(f, sm * 0.55, (0.26, 0.25, 0.27))
        sm2 = fx.upscale(fx.smoke(ctx, t, seed=4, speed=(-14, -10), lo=0.5, hi=0.95), ctx.w, ctx.h)
        return fx.over(f, sm2 * 0.35, (0.02, 0.02, 0.025))

    def render(self, t):
        ctx, k = self.ctx, self.ctx.k
        drift = (t - 10.5) * 4.0
        f = self.background(t, drift)

        # Fragments rouges qui dérivent lentement (plan intermédiaire)
        for spr, (u, v, vr, ph, vx) in zip(self.shards, self.shard_state):
            x = ((u * ctx.w + (t * vx + drift * 0.6) * k) % (ctx.w + 80 * k)) - 40 * k
            y = ((v * ctx.h - t * 14 * k) % (ctx.h + 80 * k)) - 40 * k
            rot = math.degrees(ph + t * vr * 0.6)
            layer = fx.rgba_from_pil(spr.rotate(rot, Image.BICUBIC, expand=True))
            place_centered(f, layer, x, y, 0.55)

        # Partie A : la question
        t_out = self.t("text_out")
        for layer, at, y in self.lines:
            a = fade_window(t, at, t_out + 0.6, 0.5, 0.6)
            if a > 0:
                rise = (1 - out_cubic(progress(t, at, at + 0.7))) * 22 * k - smoothstep(progress(t, t_out, t_out + 0.6)) * 14 * k
                place_centered(f, layer, ctx.w / 2 + drift * 0.3 * k, y + rise, a)

        # Partie B : la Croix est montrée… le baptême est oublié
        cx_l, cx_r, cy = ctx.w * 0.27 + drift * 0.6 * k, ctx.w * 0.73 + drift * 0.6 * k, ctx.h * 0.47
        t_c, t_b, t_f = self.t("cross_in") - 0.3, self.t("baptism_in") - 0.15, self.t("cross_flash")
        a_c = smoothstep(progress(t, t_c, t_c + 0.7))
        if a_c > 0:
            gl = fx.radial_glow(ctx, cx_l, cy, 520 * k)
            flash = math.exp(-max(t - t_f, 0) * 2.2) * (t >= t_f)
            f = fx.add(f, gl, (1.0, 0.78, 0.38), a_c * (0.28 + 0.25 * flash))
            card = self.card(self.cross, t, 1.03 + 0.05 * progress(t, t_c, t_c + 4))
            card = fx.add(card, np.ones(card.shape[:2], np.float32), (1.0, 0.9, 0.7), 0.25 * flash)
            sc = 0.94 + 0.06 * out_back(progress(t, t_c, t_c + 0.8), 1.2)
            self.paste_card(f, card, cx_l, cy + (1 - out_cubic(progress(t, t_c, t_c + 0.8))) * 30 * k, sc, a_c,
                            border=(0.93, 0.74, 0.36))
            place_centered(f, self.cap_cross, cx_l, cy + self.chh / 2 + 52 * k, a_c)
        a_b = smoothstep(progress(t, t_b, t_b + 0.9))
        if a_b > 0:
            card = self.card(self.bapt, t, 1.02)
            card = fx.desaturate(card, 0.85) * 0.55 + 0.03
            local = fx.upscale(fx.smoke(fx.Ctx(self.cw, self.chh), t, seed=9, speed=(18, -4), lo=0.3, hi=0.8),
                               self.cw, self.chh)
            card = fx.over(card, 0.35 + 0.4 * local, (0.07, 0.07, 0.08))
            self.paste_card(f, card, cx_r, cy, 0.97 + 0.03 * a_b, a_b * 0.85, border=(0.35, 0.35, 0.37))
            place_centered(f, self.cap_bapt, cx_r, cy + self.chh / 2 + 52 * k, a_b * 0.8)
        return np.clip(f * fx.vignette(ctx, 0.35), 0, 1)

    def paste_card(self, f, card, cx, cy, scale, alpha, border):
        h, w = card.shape[:2]
        rgba = np.dstack([card, self.round])
        edge = self.edge  # liseré
        rgba[..., :3] = rgba[..., :3] * (1 - edge[..., None]) + np.asarray(border, np.float32) * edge[..., None]
        if abs(scale - 1) > 0.002:
            im = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")
            im = im.resize((max(int(w * scale), 1), max(int(h * scale), 1)), Image.BICUBIC)
            rgba = np.asarray(im, np.float32) / 255
        place_centered(f, rgba, cx, cy, alpha)
