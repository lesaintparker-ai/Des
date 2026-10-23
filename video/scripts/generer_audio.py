"""Génère la musique provisoire et les effets sonores (synthèse pure, libres de droits).

Usage : python3 scripts/generer_audio.py <dossier_sortie>
"""
import sys, wave
from pathlib import Path
import numpy as np

SR = 44100
rng = np.random.default_rng(31)


def t(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.002, r=0.2):
    x = np.arange(n) / SR
    return np.minimum(1, x / a) * np.exp(-x / r)


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")


def save(path, x):
    x = np.clip(x, -1, 1)
    y = (x * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1 if y.ndim == 1 else 2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes() if y.ndim == 1 else y.T.copy().tobytes())


def place(buf, s, start):
    i = int(start * SR)
    if i >= len(buf):
        return
    s = s[: len(buf) - i]
    buf[i : i + len(s)] += s


# ---------- Instruments ----------
def kick():
    x = t(0.4)
    f = 45 + 80 * np.exp(-x / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.001, 0.12)


def clap():
    n = rng.standard_normal(int(0.18 * SR))
    n = n - lowpass(n, 6)
    return n * env(len(n), 0.001, 0.05) * 0.5


def shaker(accent):
    n = rng.standard_normal(int(0.06 * SR))
    n = n - lowpass(n, 3)
    return n * env(len(n), 0.004, 0.02) * (0.22 if accent else 0.11)


def note(freq, d, decay, harm=(1, 0.5, 0.25)):
    x = t(d)
    s = sum(a * np.sin(2 * np.pi * freq * (k + 1) * x) for k, a in enumerate(harm))
    return s * env(len(x), 0.003, decay)


def logdrum(freq):
    x = t(0.5)
    f = freq * (1 + 0.6 * np.exp(-x / 0.02))
    s = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR))
    return s * env(len(x), 0.002, 0.16) * 0.55


def pad(freqs, d):
    x = t(d)
    s = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x + 0.5) for f in freqs)
    a = np.minimum(1, x / 0.8) * np.minimum(1, (d - x) / 0.8)
    return lowpass(s, 8) * a * 0.06


def hz(n):
    return 440 * 2 ** ((n - 69) / 12)


# ---------- Musique (104 BPM, la mineur) ----------
def musique(duree, breaks):
    bpm = 104
    beat = 60 / bpm
    buf = np.zeros(int(duree * SR))
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    bass = [45, 45, 41, 41, 48, 48, 43, 43]
    riff = [69, 72, 74, 76, 74, 72, 69, None, 67, 69, 72, None, 74, 72, 69, None]
    intro_end, final_hit = breaks["intro_end"], breaks["final_hit"]
    calme = breaks["calme"]
    b = 0
    while b * beat < duree:
        start = b * beat
        bar, pos = divmod(b, 4)
        in_calme = any(s <= start < e for s, e in calme)
        if pos == 0:
            place(buf, pad([hz(n) for n in chords[bar % 4]], 4 * beat), start)
        if start >= intro_end and start < final_hit and not in_calme:
            place(buf, kick() * 0.7, start)
            if pos in (1, 3):
                place(buf, clap(), start)
            for half in (0, 1):
                place(buf, logdrum(hz(bass[(bar % 2) * 4 + pos])) * (1 if half == 0 else 0.5), start + half * beat / 2 + (beat * 0.25 if half else 0))
            for k in range(2):
                n = riff[(b * 2 + k) % len(riff)]
                if n:
                    place(buf, note(hz(n), 0.4, 0.12) * 0.12, start + k * beat / 2)
        for s16 in range(4):
            if start < final_hit:
                place(buf, shaker(s16 == 2), start + s16 * beat / 4)
        b += 1
    # Accord final
    place(buf, kick() * 0.9, final_hit)
    place(buf, pad([hz(n) for n in (45, 57, 60, 64, 69)], duree - final_hit) * 2.2, final_hit)
    fade = int(1.2 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    return buf / np.max(np.abs(buf)) * 0.8


# ---------- Effets ----------
def sfx():
    out = {}
    x = t(0.12)
    out["pop"] = np.sin(2 * np.pi * (500 + 2500 * x) * x) * env(len(x), 0.001, 0.035) * 0.8
    n = rng.standard_normal(int(0.7 * SR))
    sweep = np.convolve(n, np.hanning(40) / 20, mode="same")
    out["whoosh"] = (sweep - lowpass(sweep, 25)) * np.hanning(len(n)) * 1.2
    x = t(1.2)
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-x / 0.08)) * x) * env(len(x), 0.002, 0.35)
    nz = rng.standard_normal(len(x)) * env(len(x), 0.001, 0.05) * 0.3
    out["impact"] = (boom + nz) * 0.9
    n = rng.standard_normal(int(2.5 * SR))
    crack = (rng.random(len(n)) > 0.9985) * rng.standard_normal(len(n)) * 3
    sizzle = (n - lowpass(n, 2)) * 0.12 + np.convolve(crack, np.exp(-np.arange(200) / 30), mode="same") * 0.2
    out["grille"] = sizzle * np.minimum(1, np.minimum(t(2.5) / 0.3, (2.5 - t(2.5)) / 0.6))
    click = np.zeros(int(0.5 * SR))
    click[:200] = rng.standard_normal(200) * np.exp(-np.arange(200) / 40)
    hiss = rng.standard_normal(len(click))
    hiss = (hiss - lowpass(hiss, 4)) * env(len(click), 0.02, 0.12) * 0.35
    out["decapsule"] = click + np.roll(hiss, 1500)
    x = t(1.4)
    shim = sum(np.sin(2 * np.pi * f * x) * env(len(x), 0.005, 0.5) * (x >= d) for f, d in ((1760, 0), (2217, 0.07), (2637, 0.14), (3520, 0.21)))
    out["eclat"] = shim * 0.25
    x = t(0.05)
    out["tic"] = np.sin(2 * np.pi * 1800 * x) * env(len(x), 0.0005, 0.01) * 0.6
    return out


if __name__ == "__main__":
    dest = Path(sys.argv[1])
    dest.mkdir(parents=True, exist_ok=True)
    save(dest / "musique-provisoire.wav", musique(78.0, {"intro_end": 4.4, "final_hit": 76.0, "calme": [(61.1, 62.5)]}))
    for name, s in sfx().items():
        save(dest / f"sfx-{name}.wav", s)
    print("ok", sorted(p.name for p in dest.iterdir()))
