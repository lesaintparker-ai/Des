"""Sound design du jingle « À LA DÉCOUVERTE », entièrement synthétisé (aucun échantillon tiers).

Les repères temporels viennent de src/cues.js (les mêmes que l'animation).
Usage : python3 -I audio/synth.py src/cues.js audio/jingle.wav
Sortie : WAV 48 kHz stéréo, 10 s, normalisé à -14 LUFS (pic vrai ≤ -1,5 dBTP) via FFmpeg.
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(2026)

cues_js, out_path = sys.argv[1], sys.argv[2]
CUE = json.loads(re.search(r"\{.*\}", open(cues_js, encoding="utf-8").read(), re.S).group(0))
DUR = float(CUE["duration"])
N = int(DUR * SR)
BEAT = 60.0 / CUE["bpm"]
B0 = CUE["firstBeat"]

dry = np.zeros((2, N))
send = np.zeros((2, N))  # bus réverbération


def note(name):
    """'Eb4' -> fréquence."""
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
             "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
    m = re.match(r"([A-G][b#]?)(-?\d)", name)
    midi = names[m.group(1)] + 12 * (int(m.group(2)) + 1)
    return 440.0 * 2 ** ((midi - 69) / 12)


def tvec(n):
    return np.arange(n) / SR


def add(sig, t0, gain=1.0, pan=0.0, rev=0.0):
    """Ajoute un signal mono (ou stéréo 2×n) à t0 secondes."""
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
    if i0 < 0:
        sig = sig[:, -i0:]
        i0 = 0
    n = min(sig.shape[1], N - i0)
    if n <= 0:
        return
    dry[:, i0:i0 + n] += sig[:, :n] * gain
    if rev:
        send[:, i0:i0 + n] += sig[:, :n] * gain * rev


def fft_filter(x, lo=None, hi=None, peaks=None):
    """Filtre fréquentiel doux : passe-haut lo, passe-bas hi, ou somme de pics (formants)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    if peaks:
        pk = np.zeros_like(f)
        for fc, bw, amp in peaks:
            pk += amp / (1 + ((f - fc) / (bw / 2)) ** 2)
        g *= pk
    return np.fft.irfft(X * g, n)


def sweep_noise(dur, f_start, f_end, q=1.5):
    """Bruit filtré en bande dont la fréquence centrale glisse (traitement par blocs)."""
    n = int(dur * SR)
    noise = rng.standard_normal(n + 4096)
    hop, win = 512, 2048
    out = np.zeros(n + 4096)
    w = np.hanning(win)
    f = np.fft.rfftfreq(win, 1 / SR)
    for start in range(0, n, hop):
        p = start / max(n - 1, 1)
        fc = f_start * (f_end / f_start) ** p
        bw = fc / q
        seg = noise[start:start + win] * w
        g = 1 / (1 + ((f - fc) / (bw / 2)) ** 2)
        out[start:start + win] += np.fft.irfft(np.fft.rfft(seg) * g, win) * w
    out = out[:n]
    return out / (np.max(np.abs(out)) + 1e-9)


# ---------- instruments ----------
def kick(gain=1.0, t0=0.0, length=0.45):
    t = tvec(int(length * SR))
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s[: int(0.004 * SR)] += rng.standard_normal(int(0.004 * SR)) * 0.4
    add(np.tanh(s * 1.6), t0, gain * 0.9)


def impact(t0, gain=1.0, length=2.2):
    t = tvec(int(length * SR))
    f = 28 + 90 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = fft_filter(rng.standard_normal(len(t)), lo=150, hi=6000) * np.exp(-t * 14)
    body = np.tanh(sub * 2.0) * 0.9 + crack * 0.35
    add(body, t0, gain, rev=0.35)
    kick(gain * 0.8, t0)


def clap(t0, gain=0.5, pan=0.0):
    n = int(0.25 * SR)
    t = tvec(n)
    env = np.zeros(n)
    for k, d in enumerate([0.0, 0.009, 0.019]):
        i = int(d * SR)
        env[i:] += np.exp(-(t[: n - i]) * (90 if k < 2 else 22))
    s = fft_filter(rng.standard_normal(n), lo=900, hi=3800) * env
    add(s / (np.max(np.abs(s)) + 1e-9), t0, gain, pan, rev=0.25)


def hat(t0, gain=0.12, pan=0.25):
    n = int(0.06 * SR)
    s = fft_filter(rng.standard_normal(n), lo=7500) * np.exp(-tvec(n) * 70)
    add(s / (np.max(np.abs(s)) + 1e-9), t0, gain, pan)


def snap(t0, gain=0.25, pan=-0.3):
    n = int(0.08 * SR)
    s = fft_filter(rng.standard_normal(n), lo=1800, hi=4500) * np.exp(-tvec(n) * 80)
    add(s / (np.max(np.abs(s)) + 1e-9), t0, gain, pan, rev=0.2)


def snare(t0, gain=0.3):
    n = int(0.18 * SR)
    t = tvec(n)
    s = fft_filter(rng.standard_normal(n), lo=600, hi=7000) * np.exp(-t * 26)
    s += np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.6
    add(s / (np.max(np.abs(s)) + 1e-9), t0, gain, rev=0.15)


def piano(t0, notes, gain=0.18, length=1.2, pan=0.0):
    """Accord type piano électrique (additif, partiels décroissants)."""
    t = tvec(int(length * SR))
    s = np.zeros_like(t)
    for nm in notes:
        f = note(nm)
        for h, a in [(1, 1.0), (2, 0.45), (3, 0.18), (4, 0.08)]:
            s += a * np.sin(2 * np.pi * f * h * t * (1 + 0.0007 * h)) * np.exp(-t * (2.6 + 1.6 * h))
    s *= np.minimum(1, t / 0.004)
    add(s / len(notes), t0, gain, pan, rev=0.3)


def bass(t0, nm, length, gain=0.35):
    t = tvec(int(length * SR))
    f = note(nm)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 1.8) * np.minimum(1, (length - t) / 0.03)
    add(np.tanh(s * 1.4) * env, t0, gain)


def saw(f, t, detune=0.0):
    ph = (f * (1 + detune) * t) % 1.0
    return 2 * ph - 1


def pad(t0, t1, notes, gain=0.12, attack=0.4, release=0.5, hi=1800):
    length = t1 - t0 + release
    t = tvec(int(length * SR))
    st = np.zeros((2, len(t)))
    for nm in notes:
        f = note(nm)
        for ch, dt in [(0, -0.004), (1, 0.004)]:
            st[ch] += saw(f, t, dt) + 0.6 * saw(f, t, -dt * 1.7)
    env = np.minimum(1, t / attack) * np.clip((t1 - t0 + release - t) / release, 0, 1)
    st = np.vstack([fft_filter(st[0], hi=hi), fft_filter(st[1], hi=hi)]) * env / len(notes)
    add(st, t0, gain, rev=0.5)


def choir(t0, notes, length, gain=0.2):
    """Chœur synthétique sur la voyelle « Ah » (formants 800 / 1150 / 2900 Hz)."""
    t = tvec(int(length * SR))
    st = np.zeros((2, len(t)))
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.6)
    for k, nm in enumerate(notes):
        f = note(nm)
        for ch in (0, 1):
            for v in range(3):
                dt = (v - 1) * 0.005 + (ch - 0.5) * 0.003
                ph = np.cumsum(f * (1 + dt) * vib) / SR
                st[ch] += (2 * ((ph + 0.13 * v + 0.07 * k) % 1.0) - 1)
    peaks = [(800, 160, 1.0), (1150, 200, 0.6), (2900, 320, 0.25), (3300, 400, 0.12)]
    breath = rng.standard_normal(len(t)) * 0.08
    for ch in (0, 1):
        st[ch] = fft_filter(st[ch] + breath, peaks=peaks)
    env = np.minimum(1, t / 0.07) * (0.55 + 0.45 * np.exp(-t * 1.4))
    env *= np.clip((length - t) / 0.9, 0, 1)
    st *= env / (np.max(np.abs(st)) + 1e-9)
    add(st, t0, gain, rev=0.6)


def bell(t0, nm, gain=0.12, length=2.5, pan=0.2):
    t = tvec(int(length * SR))
    fc = note(nm)
    mod = 1.1 * np.exp(-t * 3) * np.sin(2 * np.pi * fc * 3.5 * t)
    s = np.sin(2 * np.pi * fc * t + mod) * np.exp(-t * 1.9)
    s += 0.3 * np.sin(2 * np.pi * fc * 2.76 * t) * np.exp(-t * 3.5)
    s = fft_filter(s, hi=7000)
    add(s * np.minimum(1, t / 0.002), t0, gain, pan, rev=0.7)


def whoosh(t0, dur, f0, f1, gain=0.3, pan0=-0.6, pan1=0.6):
    n = int(dur * SR)
    s = sweep_noise(dur, f0, f1)
    x = np.linspace(0, 1, n)
    env = np.sin(np.pi * x) ** 1.6
    pan = pan0 + (pan1 - pan0) * x
    st = np.vstack([s * env * np.cos((pan + 1) * np.pi / 4), s * env * np.sin((pan + 1) * np.pi / 4)]) * 1.414
    add(st, t0, gain, rev=0.25)


def water(t0, t1, gain=0.08):
    n = int((t1 - t0) * SR)
    t = tvec(n)
    base = fft_filter(rng.standard_normal(n), lo=250, hi=1400)
    base *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) ** 2
    s = base / (np.max(np.abs(base)) + 1e-9) * 0.5
    for _ in range(26):  # petites bulles / clapotis
        b0 = rng.uniform(0, max(n - 4000, 1)) / SR
        bl = int(0.04 * SR)
        bt = tvec(bl)
        f = rng.uniform(500, 1300) * (1 + bt * 18)
        i = int(b0 * SR)
        s[i:i + bl] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-bt * 70) * 0.35
    env = np.minimum(1, t / 0.4) * np.clip((t1 - t0 - t) / 0.3, 0, 1)
    add(s * env, t0, gain, pan=-0.1, rev=0.4)


def riser(t0, t1, gain=0.3):
    dur = t1 - t0
    n = int(dur * SR)
    t = tvec(n)
    x = t / dur
    s = sweep_noise(dur, 400, 7000, q=2.5) * (x ** 2)
    f = note("Eb3") * 2 ** (x * 2)
    tone = (saw(1, np.cumsum(f) / SR) * 0.5) * x ** 2
    st = np.vstack([s + tone * 0.6, s * 0.9 + tone * 0.6])
    add(st, t0, gain, rev=0.3)
    # roulement de caisse claire qui accélère
    tt, step = t0, 0.12
    while tt < t1 - 0.02:
        snare(tt, 0.08 + 0.22 * ((tt - t0) / dur) ** 2)
        tt += step
        step = max(0.03, step * 0.86)


# ---------- partition ----------
def beat(k):
    return B0 + k * BEAT


EBMAJ9 = ["Eb3", "G3", "Bb3", "D4", "F4"]
CM9 = ["C3", "Eb3", "G3", "Bb3", "D4"]
ABMAJ9 = ["Ab2", "C3", "Eb3", "G3", "Bb3"]
BB13SUS = ["Bb2", "Eb3", "F3", "Ab3", "C4", "G4"]

# Ouverture : souffle inversé vers l'impact
whoosh(0.0, CUE["impact1"] + 0.02, 300, 5000, gain=0.32, pan0=-0.8, pan1=0.2)
impact(CUE["impact1"], 1.0)
piano(CUE["impact1"], ["Eb4", "G4", "Bb4", "D5", "F5"], gain=0.22)
choir(CUE["impact1"], ["Eb4", "G4", "Bb4"], 0.7, gain=0.08)

# Groove gospel (temps 0 → 9), 125 BPM
progression = [(0, EBMAJ9, "Eb2", "Eb3"), (2, CM9, "C2", "C3"), (4, ABMAJ9, "Ab1", "Ab2"), (6, BB13SUS, "Bb1", "Bb2"), (8, EBMAJ9, "Eb2", "Eb3")]
for b, chord, root, octave in progression:
    piano(beat(b), chord, gain=0.2, pan=-0.15)
    piano(beat(b + 1.5), [n.replace("3", "4") for n in chord[1:4]], gain=0.13, pan=0.2)  # « push » gospel
    bass(beat(b), root, BEAT * 1.4)
    bass(beat(b + 1.5), octave, BEAT * 0.45, gain=0.25)
for b in range(0, 10):
    if b % 2 == 0 and b > 0:
        kick(0.85, beat(b))
    if b % 2 == 1:
        clap(beat(b), 0.5, pan=-0.1)
        clap(beat(b) + 0.012, 0.3, pan=0.35)
    hat(beat(b) + BEAT / 2, 0.11)
    hat(beat(b), 0.06, pan=-0.25)
    if b in (3, 7):
        kick(0.6, beat(b) + BEAT * 0.5)
for b in (2.75, 6.75):
    snap(beat(b), 0.25)

# Mouvements de caméra
whoosh(CUE["whoosh1"] - 0.06, CUE["land2"] - CUE["whoosh1"] + 0.1, 500, 4500, gain=0.36, pan0=-0.7, pan1=0.7)
whoosh(CUE["whoosh2"] - 0.04, CUE["land3"] - CUE["whoosh2"] + 0.08, 800, 3500, gain=0.28, pan0=0.6, pan1=-0.3)
whoosh(CUE["whoosh3"] - 0.04, CUE["land4"] - CUE["whoosh3"] + 0.08, 800, 3800, gain=0.28, pan0=-0.5, pan1=0.5)
whoosh(CUE["bands"], 0.6, 2500, 600, gain=0.2, pan0=0.8, pan1=-0.8)
whoosh(CUE["dezoom"], CUE["dezoomEnd"] - CUE["dezoom"] + 0.1, 3000, 400, gain=0.26, pan0=0.3, pan1=-0.3)
for k in ("land2", "land3", "land4"):
    snap(CUE[k] + 0.005, 0.22, pan=0.4)
whoosh(CUE["exit"] - 0.05, 0.36, 300, 6000, gain=0.32, pan0=-0.2, pan1=0.2)

# Respiration : nappe, eau, tintement
pad(CUE["drop"], CUE["riser"] + 0.2, ABMAJ9 + ["Eb4"], gain=0.16, attack=0.35, release=0.4)
pad(CUE["drop"], CUE["silence"], ["Ab1", "Eb2"], gain=0.1, attack=0.5, release=0.1, hi=400)
water(CUE["drop"] + 0.2, CUE["iris"] + 0.1, gain=0.07)
bell(CUE["bell"], "Eb6", gain=0.11)
bell(CUE["bell"] + 0.48, "Bb5", gain=0.05, pan=-0.3)

# Montée puis silence
riser(CUE["riser"], CUE["silence"], gain=0.3)
pad(CUE["riser"], CUE["silence"], BB13SUS, gain=0.1, attack=0.6, release=0.02, hi=3000)
whoosh(CUE["flash"] - 0.08, 0.3, 2000, 9000, gain=0.25, pan0=0, pan1=0)

# Signature
impact(CUE["impact2"], 1.15, length=2.6)
clap(CUE["impact2"], 0.45)
piano(CUE["impact2"], ["Eb4", "G4", "Bb4", "D5", "F5"], gain=0.2)
choir(CUE["impact2"], ["Eb3", "Bb3", "D4", "G4", "Bb4", "F5"], DUR - CUE["impact2"], gain=0.24)
bass(CUE["impact2"], "Eb1", 2.4, gain=0.35)
whoosh(CUE["rirFall"], 0.32, 3000, 300, gain=0.18, pan0=0.1, pan1=0.3)
whoosh(CUE["erte"] - 0.02, 0.3, 1500, 6000, gain=0.2, pan0=0.8, pan1=0.1)
kick(0.9, CUE["stamp"])
clap(CUE["stamp"], 0.5, pan=0.1)
snap(CUE["stamp"], 0.3, pan=-0.2)
piano(CUE["stamp"], ["Bb3", "Eb4", "G4", "Bb4", "D5"], gain=0.16, length=1.6)
bell(CUE["stamp"], "Bb6", gain=0.05, pan=0.4, length=1.6)

# ---------- réverbération + mixage ----------
ir_len = int(1.9 * SR)
it = tvec(ir_len)
ir = rng.standard_normal((2, ir_len)) * np.exp(-it * 3.4)
ir[:, : int(0.012 * SR)] = 0
ir = np.vstack([fft_filter(ir[0], hi=6000), fft_filter(ir[1], hi=6000)])
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
L = N + ir_len
wet = np.vstack([
    np.fft.irfft(np.fft.rfft(send[c], L) * np.fft.rfft(ir[c], L), L)[:N] for c in (0, 1)
])
mix = dry + wet * 0.55

# Silence de suspension avant la révélation (fondus de 8 ms)
tt = tvec(N)
gate = np.ones(N)
a, b = CUE["silence"], CUE["impact2"]
fd = 0.008
gate = np.where((tt > a) & (tt < b - 0.003), 0, gate)
gate = np.where((tt > a - fd) & (tt <= a), (a - tt) / fd, gate)
mix *= gate
# Fondu de fin
mix *= np.clip((DUR - tt) / 0.6, 0, 1) ** 1.5

mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.3) * 0.89


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").T.copy()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


raw = out_path.replace(".wav", "_raw.wav")
write_wav(raw, mix)

# Normalisation de sonie en deux passes (FFmpeg loudnorm, mode linéaire)
target = "I=-14:TP=-1.5:LRA=11"
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
meas = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
af = (f"loudnorm={target}:linear=true:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}"
      f":measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}")
subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", str(SR), "-t", str(DUR), out_path],
               check=True)
os.remove(raw)
print(f"{out_path} écrit — sonie mesurée avant normalisation : {meas['input_i']} LUFS")
