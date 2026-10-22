"""Appel à l'action : la vraie couverture du livre, halo doré, textes et icône de messagerie.

Aucune coordonnée (lien, numéro, compte) n'est inventée : seul l'appel générique
« message privé » est affiché."""
import math

import numpy as np
from PIL import Image, ImageDraw

from src.animation import fx
from src.animation.easing import out_back, out_cubic, progress, smoothstep
from src.animation.text import place_centered, text_layer
from src.scenes.base import Scene

GREEN = (24, 72, 44)
GOLD = (196, 146, 52)
INK = (34, 34, 40)


def fit_layer(text, font_name, weight, size, color, max_w, tracking):
    """Réduit la taille du texte jusqu'à ce qu'il tienne dans la colonne."""
    layer = text_layer(text, font_name, weight, size, color, tracking=tracking)
    while size > 8 and layer.shape[1] - 1.2 * size > max_w:
        size -= 2
        layer = text_layer(text, font_name, weight, size, color, tracking=tracking)
    return layer


def chat_icon(size):
    """Bulle de discussion générique (aucun logo de marque)."""
    ss = 4
    s = size * ss
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([s * 0.04, s * 0.08, s * 0.96, s * 0.74], radius=s * 0.2, fill=GOLD + (255,))
    d.polygon([(s * 0.22, s * 0.66), (s * 0.18, s * 0.94), (s * 0.46, s * 0.70)], fill=GOLD + (255,))
    for i in range(3):
        cx = s * (0.30 + 0.20 * i)
        d.ellipse([cx - s * 0.06, s * 0.35, cx + s * 0.06, s * 0.47], fill=(255, 255, 255, 255))
    return np.asarray(im.resize((size, size), Image.LANCZOS), np.float32) / 255


def badge(text, k):
    t = text_layer(text, "sans", "Bold", int(34 * k), (255, 255, 255), tracking=0.16)
    h, w = int(70 * k), int(t.shape[1] - 34 * 1.2 * k + 70 * k)
    ss = 3
    im = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], radius=h * ss // 2, fill=GOLD + (255,))
    b = np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255
    place_centered(b, t, w / 2, h / 2)
    b[..., 3] = np.maximum(b[..., 3], 0)
    return b


class SceneLivre(Scene):
    def __init__(self, cfg, ctx):
        super().__init__(cfg, ctx)
        k = ctx.k
        x0, y0, x1, y1 = self.p["book_crop"]
        crop = np.asarray(self.img.crop((x0, y0, x1, y1)), np.float32) / 255
        # Matte : le fond blanc de l'illustration devient transparent, le livre reste identique
        alpha = np.clip((0.996 - crop.min(2)) / 0.10, 0, 1)
        self.book = Image.fromarray((np.dstack([crop, alpha]) * 255).astype(np.uint8), "RGBA")
        self.book_h = int(810 * k)
        self.book_w = int(self.book.width * self.book_h / self.book.height)
        col_w = 820 * k
        self.badge = badge(self.p["badge"], k)
        self.title = [fit_layer(s, "title", "Bold", int(58 * k), GREEN, col_w, 0.03) for s in self.p["title"]]
        self.cta = [fit_layer(s, "sans", "SemiBold", int(34 * k), INK, col_w, 0.06) for s in self.p["cta"]]
        self.icon = chat_icon(int(92 * k))

    def project(self, t, x, y):
        return self.ctx.w * 0.3, self.ctx.h / 2

    def render(self, t):
        ctx, k = self.ctx, self.ctx.k
        f = np.full((ctx.h, ctx.w, 3), 0.996, np.float32)
        f = fx.add(f, fx.radial_glow(ctx, ctx.w * 0.75, ctx.h * 0.5, ctx.w * 0.6), (1.0, 0.96, 0.88), 0.5)

        # Livre : entrée douce, très léger zoom continu et flottement
        t_in = self.t("book_in")
        a = smoothstep(progress(t, t_in, t_in + 0.8))
        bx = ctx.w * 0.295
        by = ctx.h * 0.52 + (1 - out_cubic(progress(t, t_in, t_in + 1.1))) * 80 * k + math.sin(t * 1.7) * 6 * k
        sc = (0.9 + 0.1 * out_cubic(progress(t, t_in, t_in + 1.1))) * (1 + 0.02 * progress(t, t_in, t_in + 14))
        f = fx.add(f, fx.radial_glow(ctx, bx, by, 470 * k), (1.0, 0.8, 0.4), 0.38 * a)
        if a > 0:
            im = self.book.resize((int(self.book_w * sc), int(self.book_h * sc)), Image.BICUBIC)
            place_centered(f, np.asarray(im, np.float32) / 255, bx, by, a)

        cx = ctx.w * 0.745
        # Badge « LIVRE GRATUIT »
        tb = self.t("badge_at")
        pb = progress(t, tb, tb + 0.6)
        if pb > 0:
            s = 0.6 + 0.4 * out_back(pb, 2.0)
            b = self.badge
            im = Image.fromarray((b * 255).astype(np.uint8), "RGBA").resize(
                (max(int(b.shape[1] * s), 1), max(int(b.shape[0] * s), 1)), Image.BICUBIC)
            place_centered(f, np.asarray(im, np.float32) / 255, cx, 250 * k, smoothstep(pb * 2))

        # Titre (une ligne par moitié du titre prononcé)
        for layer, key, y in ((self.title[0], "title_at", 395), (self.title[1], "title2_at", 478)):
            tt = self.t(key) - 0.15
            p = progress(t, tt, tt + 0.7)
            if p > 0:
                place_centered(f, layer, cx, (y + (1 - out_cubic(p)) * 24) * k, smoothstep(p))
        tt = self.t("title_at")
        p = out_cubic(progress(t, tt + 0.3, tt + 1.6))
        if p > 0:
            half = 300 * k * p
            y = int(560 * k)
            f[y:y + max(int(3 * k), 1), int(cx - half):int(cx + half)] = np.asarray(GOLD, np.float32) / 255

        # Icône de messagerie + appel à l'action
        tc = self.t("cta_at")
        pi = progress(t, tc - 0.2, tc + 0.4)
        if pi > 0:
            s = 0.4 + 0.6 * out_back(pi, 2.2)
            ic = self.icon
            im = Image.fromarray((ic * 255).astype(np.uint8), "RGBA").resize(
                (max(int(ic.shape[1] * s), 1), max(int(ic.shape[0] * s), 1)), Image.BICUBIC)
            place_centered(f, np.asarray(im, np.float32) / 255, cx, 660 * k, smoothstep(pi * 2))
        for i, (layer, y) in enumerate(zip(self.cta, (775, 828))):
            p = progress(t, tc + 0.15 + 0.25 * i, tc + 0.85 + 0.25 * i)
            if p > 0:
                place_centered(f, layer, cx, (y + (1 - out_cubic(p)) * 18) * k, smoothstep(p))
        return np.clip(f, 0, 1)
