"""Effets sonores synthétisés (originaux, sans droits tiers). Chaque fonction renvoie
un tableau stéréo float32 normalisé autour de -6 dBFS de crête."""
import numpy as np

from src.audio.dsp import SR, band_noise, env_adsr, fade, seconds, stereo


def _norm(x, peak=0.5):
    return x * (peak / (np.abs(x).max() + 1e-9))


def whoosh(dur=0.9, rising=True, seed=1, soft=False):
    n = int(dur * SR)
    t = np.arange(n) / SR
    bands = [(150, 600), (500, 1800), (1500, 5000)]
    out = np.zeros(n)
    for i, (lo, hi) in enumerate(bands):
        centre = (i + 1) / (len(bands) + 1)
        if not rising:
            centre = 1 - centre
        e = np.exp(-((t / dur - centre * 0.9) / 0.28) ** 2)
        out += band_noise(dur, lo, hi * (0.6 if soft else 1), seed + i) * e * (0.6 if i == 2 else 1)
    out *= fade(n, 0.05, 0.15)
    pan = np.linspace(-0.5, 0.5, n)
    return _norm(np.stack([out * (1 - pan) * 0.8, out * (1 + pan) * 0.8], 1))


def drip(seed=0):
    rng = np.random.default_rng(seed)
    dur = 0.18
    t = seconds(dur)
    f0 = rng.uniform(700, 1100)
    f = f0 * (1 + 0.9 * (1 - np.exp(-t * 40)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_adsr(len(t), 0.002, 0.07)
    x += 0.15 * band_noise(dur, 2000, 6000, seed) * env_adsr(len(t), 0.001, 0.015)
    return stereo(_norm(x, 0.4), rng.uniform(-0.3, 0.3))


def ink(dur=1.6, seed=3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    low = np.sin(2 * np.pi * (55 + 25 * t / dur) * t) * env_adsr(n, 0.5, dur, curve=2)
    body = band_noise(dur, 80, 500, seed) * env_adsr(n, 0.4, dur * 0.8, curve=2.5)
    return stereo(_norm(low * 0.8 + body * 0.6))


def shimmer(dur=2.4, base=880.0, seed=4, big=False):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    ratios = [1, 1.5, 2, 2.5, 3, 4] if big else [1, 1.5, 2, 3]
    x = np.zeros(n)
    for i, r in enumerate(ratios):
        start = i * 0.06
        e = np.clip((t - start) / 0.25, 0, 1) * np.exp(-np.clip(t - start, 0, None) * 2.2 / dur * 2)
        x += np.sin(2 * np.pi * base * r * t + rng.uniform(0, 6)) * e / (1 + i * 0.4) * (1 + 0.3 * np.sin(2 * np.pi * 6 * t + i))
    air = band_noise(dur, 4000, 12000, seed) * env_adsr(n, 0.3, dur, curve=3) * 0.15
    return np.stack([_norm(x + air), _norm(np.roll(x, 240) + air)], 1)


def low_tone(dur=2.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 98 * t) + 0.5 * np.sin(2 * np.pi * 146.8 * t)) * env_adsr(n, 0.4, dur, curve=2.2)
    return stereo(_norm(x, 0.4))


def wind(dur=2.4, seed=5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = band_noise(dur, 300, 1400, seed) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * t))
    x *= fade(n, dur * 0.4, dur * 0.5)
    pan = np.sin(2 * np.pi * t / dur) * 0.6
    return _norm(np.stack([x * (1 - pan), x * (1 + pan)], 1), 0.45)


def water_ambience(dur=8.0, seed=6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    bed = band_noise(dur, 200, 1500, seed) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.35 * t) ** 2)
    out = stereo(bed * 0.5)
    for _ in range(int(dur * 3)):
        bub = drip(int(rng.integers(1e6)))
        i = int(rng.uniform(0, dur - 0.2) * SR)
        out[i:i + len(bub)] += bub * rng.uniform(0.08, 0.2)
    out *= fade(n, 1.0, 1.2)[:, None]
    return _norm(out, 0.45)


def splash(seed=7):
    dur = 1.3
    n = int(dur * SR)
    x = band_noise(dur, 600, 9000, seed) * env_adsr(n, 0.01, 0.6, curve=4)
    x += 0.5 * band_noise(dur, 150, 800, seed + 1) * env_adsr(n, 0.02, 0.35, curve=4)
    out = stereo(x)
    rng = np.random.default_rng(seed)
    for _ in range(9):
        d = drip(int(rng.integers(1e6)))
        i = int(rng.uniform(0.15, 1.0) * SR)
        out[i:i + len(d)] += d * 0.35
    return _norm(out)


def water_rise(dur=1.0, seed=8):
    n = int(dur * SR)
    out = whoosh(dur, True, seed, soft=True)
    bub = band_noise(dur, 300, 2500, seed) * env_adsr(n, dur * 0.7, 0.3, curve=3)
    return _norm(out + stereo(bub * 0.5))


def rumble(dur=1.6, seed=9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = band_noise(dur, 30, 160, seed) * (t / dur) ** 1.6
    x += 0.5 * np.sin(2 * np.pi * 46 * t) * (t / dur) ** 2
    jitter = band_noise(dur, 1500, 4000, seed + 1) * (t / dur) ** 3 * 0.15
    return stereo(_norm(x + jitter))


def impact(seed=10):
    dur = 2.8
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 9)) / SR) * env_adsr(n, 0.004, 1.6, curve=3)
    crack = band_noise(dur, 800, 9000, seed) * env_adsr(n, 0.001, 0.12, curve=5)
    out = stereo(boom * 1.0 + crack * 0.35)
    # Cliquetis métalliques (partiels inharmoniques) des maillons qui se brisent
    for k in range(7):
        f = rng.uniform(1600, 3400)
        start = rng.uniform(0.0, 0.5)
        tt = seconds(0.6)
        clink = sum(np.sin(2 * np.pi * f * r * tt) / (1 + j) for j, r in enumerate((1, 2.76, 5.4)))
        clink *= env_adsr(len(tt), 0.001, 0.35, curve=5)
        i = int(start * SR)
        out[i:i + len(tt)] += stereo(clink * 0.25, rng.uniform(-0.7, 0.7))
    # Débris
    for k in range(14):
        d = band_noise(0.08, 2000, 8000, seed + 20 + k) * env_adsr(int(0.08 * SR), 0.001, 0.05)
        i = int(rng.uniform(0.3, 1.4) * SR)
        out[i:i + len(d)] += stereo(d * 0.15, rng.uniform(-0.8, 0.8))
    return _norm(out, 0.7)


def swell(dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) / (1 + i) for i, f in enumerate((174.6, 261.6, 349.2, 440.0)))
    x *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return stereo(_norm(x, 0.4))


def chime(base=1318.5):
    dur = 2.0
    t = seconds(dur)
    x = sum(np.sin(2 * np.pi * base * r * t) * np.exp(-t * (2 + i * 1.5)) / (1 + i)
            for i, r in enumerate((1, 2.01, 3.0, 4.2)))
    x *= np.clip(t / 0.004, 0, 1)
    return stereo(_norm(x, 0.4))


def pop():
    dur = 0.25
    t = seconds(dur)
    f = 520 + 380 * (1 - np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_adsr(len(t), 0.003, 0.09, curve=4)
    return stereo(_norm(x, 0.4))


def make(kind, dur=None, seed=0):
    table = {
        "whoosh": lambda: whoosh(dur or 0.9), "whoosh_up": lambda: whoosh(dur or 1.0, True, 2),
        "whoosh_soft": lambda: whoosh(dur or 1.0, True, 3, soft=True), "drip": lambda: drip(seed),
        "ink": lambda: ink(dur or 1.6), "shimmer": lambda: shimmer(dur or 2.4),
        "shimmer_big": lambda: shimmer(dur or 3.0, 660, big=True), "low_tone": lambda: low_tone(dur or 2.0),
        "wind": lambda: wind(dur or 2.4), "water_amb": lambda: water_ambience(dur or 8.0),
        "splash": splash, "water_rise": lambda: water_rise(dur or 1.0), "rumble": lambda: rumble(dur or 1.6),
        "impact": impact, "swell": lambda: swell(dur or 2.2), "chime": chime, "pop": pop,
    }
    return table[kind]()
