"""Typographie : rendu de lignes de texte en calques RGBA (avec ombre portée douce)."""
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from src.common import font


@lru_cache(maxsize=64)
def text_layer(text, font_name, weight, size, color, tracking=0.0, shadow=None, glow=None):
    """Retourne un tableau float32 (h, w, 4). color/shadow/glow sont des tuples RGB(A).
    tracking = espacement supplémentaire entre lettres, en fraction de la taille."""
    f = font(font_name, size, weight)
    spacing = tracking * size
    widths = [f.getlength(ch) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    asc, desc = f.getmetrics()
    pad = int(size * 0.6)
    w, h = int(total) + 2 * pad, asc + desc + 2 * pad
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    x = pad
    for ch, cw in zip(text, widths):
        d.text((x, pad), ch, font=f, fill=255)
        x += cw + spacing
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if glow:
        g = mask.filter(ImageFilter.GaussianBlur(size * 0.25))
        layer = Image.new("RGBA", (w, h), tuple(glow[:3]) + (0,))
        layer.putalpha(g.point(lambda v: int(v * (glow[3] if len(glow) > 3 else 0.6))))
        out = Image.alpha_composite(out, layer)
    if shadow:
        s = mask.filter(ImageFilter.GaussianBlur(max(size * 0.06, 1)))
        layer = Image.new("RGBA", (w, h), tuple(shadow[:3]) + (0,))
        layer.putalpha(s.point(lambda v: int(v * (shadow[3] if len(shadow) > 3 else 0.5))))
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        off = max(int(size * 0.04), 1)
        sh.paste(layer, (off, off))
        out = Image.alpha_composite(out, sh)
    fill = Image.new("RGBA", (w, h), tuple(color[:3]) + (0,))
    fill.putalpha(mask)
    out = Image.alpha_composite(out, fill)
    return np.asarray(out, np.float32) / 255.0


def place_centered(frame, layer, cx, cy, opacity=1.0):
    from src.animation.fx import paste_rgba
    h, w = layer.shape[:2]
    return paste_rgba(frame, layer, cx - w / 2, cy - h / 2, opacity)
