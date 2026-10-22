"""Classe de base des scènes : chargement de l'illustration originale (jamais modifiée
sur disque) et caméra animée par keyframes."""
import numpy as np
from PIL import Image

from src.animation.camera import Camera, to_float
from src.animation.easing import Keyframes
from src.common import T, path


class Scene:
    def __init__(self, cfg, ctx):
        self.cfg = cfg
        self.ctx = ctx
        self.p = cfg.get("params", {})
        self.img = Image.open(path(cfg["image"])).convert("RGB") if "image" in cfg else None
        self.keys = Keyframes(cfg["camera"]) if "camera" in cfg else None

    # -- temps -----------------------------------------------------------------
    def t(self, key, default=None):
        v = self.p.get(key, default)
        return None if v is None else T(v)

    # -- caméra ----------------------------------------------------------------
    def camera(self, t, zoom_mul=1.0, shake=(0.0, 0.0), rot=0.0):
        cx, cy, z = self.keys(t)
        k = self.ctx.k
        return Camera(self.img.width, self.img.height, cx, cy, z * zoom_mul, rot,
                      (shake[0] * k, shake[1] * k), self.ctx.w, self.ctx.h)

    def project(self, t, x, y):
        """Position écran d'un point de l'illustration à l'instant t (pour les transitions)."""
        return self.camera(t).to_screen(x, y)

    @staticmethod
    def pts(cam, xy):
        m = cam.matrix()
        xy = np.asarray(xy, np.float32)
        return np.stack([m[0, 0] * xy[:, 0] + m[0, 1] * xy[:, 1] + m[0, 2],
                         m[1, 0] * xy[:, 0] + m[1, 1] * xy[:, 1] + m[1, 2]], 1)

    def base(self, cam):
        return to_float(cam.render(self.img))

    def render(self, t):
        raise NotImplementedError

    def sfx_events(self):
        """Repères sonores propres à la scène : liste de (temps narration, type, gain dB)."""
        return []
