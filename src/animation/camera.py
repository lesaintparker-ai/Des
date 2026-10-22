"""Caméra virtuelle : zoom, panoramique, rotation légère et tremblement appliqués
à une illustration plate par transformation affine (aucune déformation locale)."""
import math

import numpy as np
from PIL import Image

from src.common import W, H


class Camera:
    def __init__(self, img_w, img_h, cx, cy, zoom, rot_deg=0.0, shake=(0.0, 0.0), out_w=W, out_h=H):
        self.out_w, self.out_h = out_w, out_h
        cover = max(out_w / img_w, out_h / img_h)
        self.s = cover * max(zoom, 1.0)
        # Empêche de sortir de l'illustration (pas de bandes vides)
        rot = math.radians(rot_deg)
        margin = 1 + abs(math.sin(rot)) * 1.2
        half_w = out_w / (2 * self.s) * margin
        half_h = out_h / (2 * self.s) * margin
        self.cx = min(max(cx, half_w), img_w - half_w) if img_w > 2 * half_w else img_w / 2
        self.cy = min(max(cy, half_h), img_h - half_h) if img_h > 2 * half_h else img_h / 2
        self.cx += shake[0] / self.s
        self.cy += shake[1] / self.s
        self.rot = rot

    def matrix(self):
        """Matrice 3x3 source -> écran."""
        c, s = math.cos(self.rot), math.sin(self.rot)
        to_origin = np.array([[1, 0, -self.cx], [0, 1, -self.cy], [0, 0, 1]], float)
        rs = np.array([[c * self.s, -s * self.s, 0], [s * self.s, c * self.s, 0], [0, 0, 1]], float)
        to_screen = np.array([[1, 0, self.out_w / 2], [0, 1, self.out_h / 2], [0, 0, 1]], float)
        return to_screen @ rs @ to_origin

    def to_screen(self, x, y):
        m = self.matrix()
        return m[0, 0] * x + m[0, 1] * y + m[0, 2], m[1, 0] * x + m[1, 1] * y + m[1, 2]

    def render(self, img, layer_matrix=None, resample=Image.BICUBIC):
        """Rend une image PIL (RGB ou RGBA) vue par la caméra. layer_matrix : déplacement
        supplémentaire du calque, en coordonnées source (3x3)."""
        m = self.matrix()
        if layer_matrix is not None:
            m = m @ layer_matrix
        inv = np.linalg.inv(m)
        data = tuple(inv[0]) + tuple(inv[1])
        return img.transform((self.out_w, self.out_h), Image.AFFINE, data[:6], resample=resample)


def layer_offset(dx, dy, rot_deg=0.0, pivot=(0.0, 0.0)):
    """Matrice source->source : rotation autour d'un pivot puis translation."""
    r = math.radians(rot_deg)
    c, s = math.cos(r), math.sin(r)
    px, py = pivot
    to_p = np.array([[1, 0, -px], [0, 1, -py], [0, 0, 1]], float)
    rot = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], float)
    back = np.array([[1, 0, px + dx], [0, 1, py + dy], [0, 0, 1]], float)
    return back @ rot @ to_p


def to_float(img):
    return np.asarray(img, dtype=np.float32) * (1 / 255.0)
