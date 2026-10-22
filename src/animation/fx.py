"""Effets procéduraux : fumée, rayons, halos, particules, masques de transition.

Les champs « doux » (fumée, rayons, halos) sont calculés en basse résolution
puis agrandis : rendu plus rapide et naturellement lisse.
"""
import math
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


class Ctx:
    """Résolution de rendu. k = facteur par rapport au 1920x1080 de référence."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.k = w / 1920.0
        self.lw, self.lh = max(w // 4, 2), max(h // 4, 2)


# --------------------------------------------------------------------------- bruit

@lru_cache(maxsize=8)
def noise_field(seed, size=512, beta=3.1):
    """Bruit fractal périodique (tuilable) dans [0, 1]."""
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((size, size))
    fy = np.fft.fftfreq(size)[:, None]
    fx = np.fft.fftfreq(size)[None, :]
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    spec = np.fft.fft2(white) / f ** (beta / 2)
    spec[0, 0] = 0
    n = np.real(np.fft.ifft2(spec))
    n = (n - n.min()) / (n.max() - n.min())
    return np.tile(n.astype(np.float32), (2, 2))


def sample_noise(seed, ox, oy, out_w, out_h, scale=1.0):
    """Fenêtre de bruit défilante (ox, oy en texels) de taille out_w x out_h (basse résolution)."""
    field = noise_field(seed)
    size = field.shape[0] // 2
    sw = min(int(out_w * scale), size)
    sh = min(int(out_h * scale), size)
    x0 = int(ox) % size
    y0 = int(oy) % size
    win = field[y0:y0 + sh, x0:x0 + sw]
    if (sw, sh) != (out_w, out_h):
        win = np.asarray(Image.fromarray(win, "F").resize((out_w, out_h), Image.BILINEAR))
    return win


def upscale(arr, w, h):
    """Agrandit un champ float32 (2D) basse résolution vers w x h."""
    return np.asarray(Image.fromarray(arr.astype(np.float32), "F").resize((w, h), Image.BILINEAR))


def smooth_band(x, lo, hi):
    y = np.clip((x - lo) / (hi - lo), 0, 1)
    return y * y * (3 - 2 * y)


def smoke(ctx, t, seed=1, speed=(30.0, -8.0), scale=0.9, lo=0.45, hi=0.85, offset=(0, 0)):
    """Fumée animée (2 octaves qui défilent à vitesses différentes), densité 0..1, basse résolution."""
    a = sample_noise(seed, offset[0] + t * speed[0], offset[1] + t * speed[1], ctx.lw, ctx.lh, scale)
    b = sample_noise(seed + 7, offset[0] * 1.7 - t * speed[0] * 0.6, offset[1] * 1.7 + t * speed[1] * 1.9 + 50,
                     ctx.lw, ctx.lh, scale * 0.55)
    return smooth_band(0.62 * a + 0.38 * b, lo, hi)


# --------------------------------------------------------------------------- lumière

def low_grid(ctx):
    ys, xs = np.mgrid[0:ctx.lh, 0:ctx.lw].astype(np.float32)
    return xs * (ctx.w / ctx.lw), ys * (ctx.h / ctx.lh)


def radial_glow(ctx, cx, cy, radius, power=2.0):
    """Halo radial (en pixels écran), intensité 0..1, pleine résolution."""
    xs, ys = low_grid(ctx)
    d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / max(radius, 1)
    g = np.exp(-(d ** power))
    return upscale(g, ctx.w, ctx.h)


def rays(ctx, cx, cy, t, count=14, speed=0.04, sharp=6.0, radius=900, seed=3):
    """Rayons lumineux tournant lentement autour de (cx, cy), intensité 0..1."""
    xs, ys = low_grid(ctx)
    th = np.arctan2(ys - cy, xs - cx)
    r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    rng = np.random.default_rng(seed)
    ph = rng.uniform(0, 2 * np.pi, 3)
    v = (0.5 + 0.5 * np.cos(count * th + t * speed * 2 * np.pi + ph[0])) ** sharp
    v += 0.6 * (0.5 + 0.5 * np.cos((count + 5) * th - t * speed * 1.3 * 2 * np.pi + ph[1])) ** (sharp * 1.5)
    v *= np.exp(-r / (radius * ctx.k)) * np.clip(r / (40 * ctx.k), 0, 1)
    return upscale(np.clip(v, 0, 1.5), ctx.w, ctx.h)


def beam(ctx, x0, y0, x1, y1, width0, width1):
    """Faisceau conique de (x0,y0) vers (x1,y1), intensité 0..1."""
    xs, ys = low_grid(ctx)
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    px, py = xs - x0, ys - y0
    along = px * ux + py * uy
    across = np.abs(-px * uy + py * ux)
    p = np.clip(along / L, 0, 1.4)
    width = width0 + (width1 - width0) * p
    v = np.exp(-(across / np.maximum(width, 1)) ** 2) * (along > 0) * np.exp(-p * 0.9)
    return upscale(v, ctx.w, ctx.h)


# --------------------------------------------------------------------------- composition

def add(frame, light, color, amount=1.0):
    """Lumière additive douce (screen) : préserve les blancs."""
    c = np.asarray(color, np.float32)[None, None, :]
    l = np.clip(light[..., None] * amount, 0, 1) * c
    return 1 - (1 - frame) * (1 - l)


def over(frame, alpha, color):
    """Couleur unie posée avec un masque alpha (2D)."""
    a = np.clip(alpha, 0, 1)[..., None]
    return frame * (1 - a) + np.asarray(color, np.float32)[None, None, :] * a


def blend(a, b, mask):
    m = np.clip(mask, 0, 1)
    if m.ndim == 2:
        m = m[..., None]
    return a * (1 - m) + b * m


def paste_rgba(frame, rgba, x, y, opacity=1.0):
    """Colle une image RGBA float (h,w,4) en (x,y) écran (coin haut-gauche), avec découpage."""
    h, w = rgba.shape[:2]
    H, W = frame.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
    if x0 >= x1 or y0 >= y1 or opacity <= 0:
        return frame
    src = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    a = src[..., 3:4] * opacity
    region = frame[y0:y1, x0:x1, :3]
    frame[y0:y1, x0:x1, :3] = region * (1 - a) + src[..., :3] * a
    return frame


def add_sprite(buf, sprite, x, y, gain=1.0):
    """Ajoute un sprite 2D (h,w) centré en (x,y) dans un buffer d'intensité."""
    h, w = sprite.shape
    H, W = buf.shape
    x0, y0 = int(round(x - w / 2)), int(round(y - h / 2))
    xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w, W), min(y0 + h, H)
    if xa >= xb or ya >= yb:
        return
    buf[ya:yb, xa:xb] += sprite[ya - y0:yb - y0, xa - x0:xb - x0] * gain


@lru_cache(maxsize=256)
def soft_dot(radius):
    """Point lumineux gaussien de rayon donné (pixels entiers)."""
    r = max(int(radius), 1)
    ys, xs = np.mgrid[-2 * r:2 * r + 1, -2 * r:2 * r + 1].astype(np.float32)
    return np.exp(-(xs * xs + ys * ys) / (r * r * 0.6))


@lru_cache(maxsize=64)
def sparkle(radius):
    """Étincelle en croix (4 branches) + cœur lumineux."""
    r = max(int(radius), 2)
    ys, xs = np.mgrid[-3 * r:3 * r + 1, -3 * r:3 * r + 1].astype(np.float32)
    core = np.exp(-(xs * xs + ys * ys) / (r * r * 0.35))
    arms = np.exp(-np.abs(xs) / (r * 0.12)) * np.exp(-np.abs(ys) / (r * 1.3))
    arms += np.exp(-np.abs(ys) / (r * 0.12)) * np.exp(-np.abs(xs) / (r * 1.3))
    return np.clip(core + 0.7 * arms, 0, 1)


@lru_cache(maxsize=64)
def drop_sprite(size):
    """Goutte d'encre (forme de larme), alpha 0..1, anticrénelée par sur-échantillonnage."""
    s = max(int(size), 3)
    ss = 4
    w, h = s * ss, int(s * 2.1) * ss
    im = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(im)
    d.ellipse([0, h - w, w - 1, h - 1], fill=255)
    d.polygon([(w * 0.5, 0), (w * 0.08, h - w * 0.55), (w * 0.92, h - w * 0.55)], fill=255)
    im = im.resize((s, int(s * 2.1)), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255.0


def rgba_from_pil(img):
    return np.asarray(img.convert("RGBA"), np.float32) / 255.0


def vignette(ctx, strength=0.35, power=2.2):
    xs, ys = low_grid(ctx)
    d = np.sqrt(((xs - ctx.w / 2) / (ctx.w / 2)) ** 2 + ((ys - ctx.h / 2) / (ctx.h / 2)) ** 2) / math.sqrt(2)
    return upscale(1 - strength * d ** power, ctx.w, ctx.h)[..., None]


def box_blur(arr, r, axis):
    r = max(int(r), 1)
    pad = [(0, 0)] * arr.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(arr, pad, mode="edge"), axis=axis, dtype=np.float64)
    n = arr.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)


def gauss_blur(arr, sigma):
    """Flou ~gaussien (3 flous boîte) pour tableaux float, 2D ou 3D."""
    r = int(round(sigma * 0.95))
    for _ in range(3):
        arr = box_blur(box_blur(arr, r, 0), r, 1)
    return arr


def desaturate(frame, amount):
    lum = frame @ np.array([0.299, 0.587, 0.114], np.float32)
    return frame * (1 - amount) + lum[..., None] * amount


def blur(frame, radius):
    if radius <= 0.3:
        return frame
    img = Image.fromarray((np.clip(frame, 0, 1) * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255.0


class Particles:
    """Système de particules déterministe : l'état à l'instant t est calculé
    analytiquement (pas d'accumulation), ce qui permet le rendu en parallèle."""

    def __init__(self, n, seed, spawn, life, velocity, gravity=(0.0, 0.0), size=(2, 5), start=0.0, rate=None):
        rng = np.random.default_rng(seed)
        self.n = n
        self.t0 = start + (rng.uniform(0, n / rate, n) if rate else np.zeros(n))
        self.pos = np.array([spawn(rng) for _ in range(n)], np.float32)
        self.vel = np.array([velocity(rng) for _ in range(n)], np.float32)
        self.life = rng.uniform(life[0], life[1], n)
        self.size = rng.uniform(size[0], size[1], n)
        self.phase = rng.uniform(0, 2 * np.pi, n)
        self.g = np.asarray(gravity, np.float32)

    def state(self, t, loop=False):
        age = t - self.t0
        if loop:
            age = np.mod(age, self.life)
        alive = (age >= 0) & (age <= self.life)
        a = np.clip(age, 0, None)[:, None]
        p = self.pos + self.vel * a + 0.5 * self.g[None, :] * a * a
        life_p = np.clip(age / self.life, 0, 1)
        fade = np.sin(np.pi * life_p) * alive
        return p, fade, life_p, alive
