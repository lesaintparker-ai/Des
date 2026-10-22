"""Enchaînement des scènes et transitions animées."""
import importlib
import math

import numpy as np

from src.animation import fx
from src.animation.easing import in_out_cubic, out_cubic, progress, smoothstep
from src.common import N_END, N_START, T, TIMELINE

CLASSES = {
    "s1_eglise": "SceneEglise", "s2_vase": "SceneVase", "s3_demi_evangile": "SceneDemiEvangile",
    "s4_sacrifice": "SceneSacrifice", "s5_bapteme": "SceneBapteme", "s6_croix": "SceneCroix",
    "s7_coeur": "SceneCoeur", "s8_livre": "SceneLivre",
}
WARM_WHITE = (1.0, 0.985, 0.94)


# ----------------------------------------------------------------- transitions

def tr_bloom(ctx, a, b, p, cfg, prev, nxt, t):
    """Lumière qui envahit le cadre puis révèle la scène suivante."""
    cx, cy = cfg.get("center", [0.5, 0.5])
    if p < 0.5:
        q = smoothstep(p / 0.5) ** 1.3
        g = fx.radial_glow(ctx, cx * ctx.w, cy * ctx.h, (0.15 + 1.6 * q) * ctx.w, power=2.0)
        return fx.blend(fx.add(a, g, (1.0, 0.9, 0.7), q), np.ones_like(a) * WARM_WHITE, g * q)
    q = smoothstep((p - 0.5) / 0.5)
    return fx.blend(np.ones_like(b) * WARM_WHITE, b, q)


def tr_ink(ctx, a, b, p, cfg, prev, nxt, t):
    """La tache d'encre s'étend depuis la flaque et engloutit l'image."""
    ox, oy = prev.project(t, *cfg["origin"])
    xs, ys = fx.low_grid(ctx)
    d = np.sqrt((xs - ox) ** 2 + ((ys - oy) * 1.3) ** 2) / (ctx.w * 1.25)
    n = fx.sample_noise(91, 0, 0, ctx.lw, ctx.lh, 0.8)
    r = in_out_cubic(p) * 1.25
    m = fx.upscale(np.clip((r - d - 0.25 * n + 0.12) / 0.05, 0, 1), ctx.w, ctx.h)
    out = fx.blend(a, np.zeros_like(a) + 0.03, m)
    late = smoothstep(progress(p, 0.3, 0.85))
    return fx.blend(out, b, m * late)


def tr_smoke_wipe(ctx, a, b, p, cfg, prev, nxt, t):
    """Volute de fumée qui balaie l'écran de gauche à droite."""
    xs, ys = fx.low_grid(ctx)
    xn = xs / ctx.w
    n = fx.smoke(ctx, t, seed=93, speed=(60, -10), lo=0.2, hi=0.9)
    v = smoothstep(p) * 1.7 - 0.35 - xn - 0.32 * (n - 0.5)
    m = fx.upscale(np.clip(v / 0.12 + 0.5, 0, 1), ctx.w, ctx.h)
    edge = fx.upscale(np.exp(-(v / 0.12) ** 2), ctx.w, ctx.h)
    return fx.over(fx.blend(a, b, m), edge * 0.75, (0.1, 0.1, 0.11))


def tr_smoke_dissolve(ctx, a, b, p, cfg, prev, nxt, t):
    """La fumée noire se dissipe pour laisser apparaître l'image suivante."""
    n = fx.smoke(ctx, t, seed=95, speed=(25, -40), lo=0.1, hi=0.9)
    v = n - (1.25 * smoothstep(p) - 0.15)
    m = fx.upscale(np.clip(-v / 0.1 + 0.5, 0, 1), ctx.w, ctx.h)
    edge = fx.upscale(np.exp(-(v / 0.14) ** 2), ctx.w, ctx.h) * math.sin(math.pi * p)
    return fx.over(fx.blend(a, b, m), edge * 0.45, (0.12, 0.12, 0.14))


def tr_water_rise(ctx, a, b, p, cfg, prev, nxt, t):
    """L'eau monte et remplit le cadre, puis s'ouvre sur la lumière de la Croix."""
    xs = np.arange(ctx.w, dtype=np.float32)
    ys = np.arange(ctx.h, dtype=np.float32)[:, None]
    deep = np.array([0.02, 0.33, 0.62], np.float32)
    shallow = np.array([0.12, 0.66, 0.95], np.float32)
    grad = (ys / ctx.h)[..., None]
    water = shallow * (1 - grad) + deep * grad
    water = np.broadcast_to(water, (ctx.h, ctx.w, 3)).copy()
    if p < 0.5:
        q = in_out_cubic(p / 0.5)
        edge = ctx.h * (1.05 - 1.2 * q) + 18 * ctx.k * np.sin(xs / (90 * ctx.k) + t * 6) \
            + 9 * ctx.k * np.sin(xs / (37 * ctx.k) - t * 9)
        m = np.clip((ys - edge[None, :]) / (6 * ctx.k), 0, 1)
        crest = np.exp(-((ys - edge[None, :]) / (7 * ctx.k)) ** 2)
        out = fx.blend(a, water, m)
        return fx.add(out, crest, (0.9, 0.98, 1.0), 0.8)
    q = smoothstep((p - 0.5) / 0.5)
    g = fx.radial_glow(ctx, ctx.w * 0.5, ctx.h * 0.3, (0.05 + 1.5 * q) * ctx.w, power=2)
    out = fx.add(water, g, (1.0, 0.9, 0.6), 0.8 + 0.2 * q)
    return fx.blend(out, b, q * np.clip(0.3 + g * 1.5, 0, 1))


def tr_light_fade(ctx, a, b, p, cfg, prev, nxt, t):
    out = fx.blend(a, b, smoothstep(p))
    return fx.add(out, np.ones(a.shape[:2], np.float32), WARM_WHITE, 0.65 * math.sin(math.pi * p))


TRANSITIONS = {"bloom": tr_bloom, "ink": tr_ink, "smoke_wipe": tr_smoke_wipe,
               "smoke_dissolve": tr_smoke_dissolve, "water_rise": tr_water_rise, "light_fade": tr_light_fade}


# ----------------------------------------------------------------- timeline

class Timeline:
    def __init__(self, ctx):
        self.ctx = ctx
        self.scenes = []
        start = N_START
        for cfg in TIMELINE["scenes"]:
            mod = importlib.import_module(f"src.scenes.{cfg['module']}")
            scene = getattr(mod, CLASSES[cfg["module"]])(cfg, ctx)
            end = N_END if cfg["end"] == "end" else T(cfg["end"])
            self.scenes.append((start, end, cfg.get("transition"), scene))
            start = end
        self.final_fade = TIMELINE["final_fade"]

    def frame(self, t):
        for i, (start, end, tr, scene) in enumerate(self.scenes):
            if tr:
                d = tr["duration"]
                if end - d / 2 <= t < end + d / 2:
                    nxt = self.scenes[i + 1][3]
                    p = (t - (end - d / 2)) / d
                    out = TRANSITIONS[tr["type"]](self.ctx, scene.render(t), nxt.render(t), p, tr, scene, nxt, t)
                    return np.clip(out, 0, 1)
            if t < end or i == len(self.scenes) - 1:
                prev_tr = self.scenes[i - 1][2] if i else None
                if prev_tr and t < start + prev_tr["duration"] / 2:
                    continue
                f = scene.render(t)
                fade = progress(t, N_END - self.final_fade, N_END)
                if fade > 0:
                    f = f * (1 - smoothstep(fade))
                return f
        raise ValueError(t)

    def transition_times(self):
        return [(end, tr) for _, end, tr, _ in self.scenes if tr]

    def sfx_events(self):
        events = []
        for _, _, _, scene in self.scenes:
            events += scene.sfx_events()
        return events
