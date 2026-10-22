"""Piste musicale de travail, synthétisée procéduralement (composition originale,
donc sans problème de droits). Nappes cinématiques en ré mineur qui s'ouvrent vers
fa majeur : intro atmosphérique, montée au baptême, accent à la rupture des chaînes,
résolution lumineuse, fin apaisée.

Pour utiliser une vraie musique sous licence, renseigner "music_file" dans
config/render.json : cette piste synthétique est alors ignorée."""
import numpy as np

from src.audio.dsp import SR, fade, reverb
from src.common import N_END, T

# Accords (temps narration, notes MIDI)
CHORDS = [
    (-1.2, [38, 45, 50, 53, 57, 64]),          # Ré m(add9) — sombre, intime
    (10.4, [34, 41, 46, 50, 53, 57]),          # Si♭ maj7
    (14.2, [31, 38, 43, 46, 50, 57]),          # Sol m9
    (18.4, [41, 48, 53, 57, 67]),              # Fa (add9)
    (21.0, [40, 48, 55, 60, 64]),              # Do/Mi
    (23.8, [34, 46, 50, 53, 57, 65]),          # Si♭ — baptême, la montée commence
    (27.0, [36, 48, 52, 55, 60, 64]),          # Do
    (29.6, [38, 50, 53, 57, 62, 65]),          # Ré m
    (32.2, [34, 46, 50, 53, 58, 62]),          # Si♭ — la Croix
    (35.0, [36, 48, 53, 55, 60, 65]),          # Do sus4 — tension
    ("@l'œuvre", [29, 41, 48, 53, 57, 60, 65, 69], "hit"),  # FA MAJEUR — délivrance
    (41.0, [34, 46, 53, 57, 62, 65]),          # Si♭ maj7
    (44.0, [41, 48, 53, 57, 60, 67]),          # Fa
    (48.0, [36, 48, 52, 55, 64, 67]),          # Do
    (51.0, [34, 46, 50, 53, 57, 65]),          # Si♭
    (54.0, [41, 48, 53, 57, 60, 65, 69]),      # Fa — fin accueillante
]

# Intensité générale (temps narration, niveau)
DYNAMICS = [(-1.2, 0.0), (0.0, 0.5), (10.4, 0.45), (18.4, 0.5), (23.8, 0.52), (31.5, 0.6),
            (35.0, 0.58), ("@l'œuvre-0.05", 0.8), ("@l'œuvre+1.5", 0.6), (44.0, 0.55), (54.0, 0.6)]
SHIMMER = [(-1.2, 0.0), (23.8, 0.0), (30.0, 0.22), ("@l'œuvre", 0.38), (44.0, 0.25), (56.0, 0.15)]


def carve_speech_band(x, lo=800, hi=4000, cut_db=-6.0):
    """Creux d'égalisation dans la zone d'intelligibilité de la voix."""
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    band = (f > lo * 0.7) & (f < hi * 1.4)
    shape = np.sin(np.pi * np.clip((np.log(f[band]) - np.log(lo * 0.7)) / (np.log(hi * 1.4) - np.log(lo * 0.7)), 0, 1))
    g[band] = 10 ** (cut_db * shape / 20)
    return np.fft.irfft(spec * g[:, None], len(x), axis=0)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def curve(points, t):
    xs = [T(p[0]) for p in points]
    return np.interp(t, xs, [p[1] for p in points])


def pad_note(freq, n, rng):
    t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.0018, 0.0, 0.0021):
        f = freq * (1 + det)
        ph = rng.uniform(0, 2 * np.pi)
        x += np.sin(2 * np.pi * f * t + ph) + 0.28 * np.sin(4 * np.pi * f * t + ph) + 0.08 * np.sin(6 * np.pi * f * t)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * rng.uniform(0.08, 0.2) * t + rng.uniform(0, 6))
    return x * lfo / 3


def piano_note(freq, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (1.2 + 1.3 * k)) / k ** 1.6 for k in (1, 2, 3, 4))
    return x * np.clip(t / 0.006, 0, 1) * vel


def synth(n_from, n_to):
    """Rend la musique entre deux instants narration. Retourne (stéréo, n_from)."""
    rng = np.random.default_rng(2026)
    dur = n_to - n_from
    total = int(dur * SR)
    t = n_from + np.arange(total) / SR
    out = np.zeros((total, 2))
    xfade = 1.8
    starts = [T(c[0]) for c in CHORDS]
    for i, (_, notes, *flags) in enumerate(CHORDS):
        hit = "hit" in flags
        s = starts[i]
        e = starts[i + 1] if i + 1 < len(CHORDS) else n_to
        a, b = max(s - (0 if hit else xfade / 2), n_from), min(e + xfade / 2, n_to)
        if b <= a:
            continue
        i0, i1 = int((a - n_from) * SR), int((b - n_from) * SR)
        n = i1 - i0
        env = fade(n, xfade if s > n_from else 0, xfade)
        if hit:  # accord de délivrance : attaque franche, pile sur « l'œuvre »
            env = np.clip(np.arange(n) / (0.02 * SR), 0, 1) * fade(n, 0, xfade)
        chord = np.zeros((n, 2))
        for j, note in enumerate(notes):
            g = 0.55 if note < 40 else 1.0
            sig = pad_note(midi(note), n, rng) * g
            pan = (j / max(len(notes) - 1, 1) - 0.5) * 0.7
            chord[:, 0] += sig * (1 - pan)
            chord[:, 1] += sig * (1 + pan)
        out[i0:i1] += chord * env[:, None] / np.sqrt(len(notes))

        # Scintillement aigu (à partir du baptême)
        sh = curve(SHIMMER, t[i0:i1])
        if sh.max() > 0.01:
            tt = np.arange(n) / SR
            hi = sum(np.sin(2 * np.pi * midi(nt + 24) * tt + k) * (0.8 + 0.2 * np.sin(2 * np.pi * 5.5 * tt + k))
                     for k, nt in enumerate(notes[-3:]))
            out[i0:i1, 0] += hi * sh * env * 0.07
            out[i0:i1, 1] += np.roll(hi, 180) * sh * env * 0.07

        # Notes de piano égrenées : rares pendant le baptême et la Croix, plus présentes ensuite
        step = 1.25 if s < T("@l'œuvre") else 0.62
        if s >= 23.8:
            tones = [x + 12 for x in notes[-4:]] + [notes[-2] + 24]
            k = 0
            tn = s + 0.1
            while tn < e - 0.2 and tn < n_to - 1:
                note = tones[(k * 3) % len(tones)]
                pn = piano_note(midi(note), 2.4, 0.08 if step > 1 else 0.065)
                p0 = int((tn - n_from) * SR)
                m = min(len(pn), total - p0)
                pan = 0.3 * np.sin(k)
                out[p0:p0 + m, 0] += pn[:m] * (1 - pan)
                out[p0:p0 + m, 1] += pn[:m] * (1 + pan)
                k += 1
                tn += step

    # Bourdon grave dans la partie sombre
    drone = np.sin(2 * np.pi * midi(26) * (t - n_from)) * np.clip((18.4 - t) / 2, 0, 1) * 0.25
    out += drone[:, None]
    out *= curve(DYNAMICS, t)[:, None]
    out = reverb(out, 3.2, wet=0.38)
    out = carve_speech_band(out)
    out *= fade(total, 1.2, 2.5)[:, None]
    return out / (np.abs(out).max() + 1e-9) * 0.5, n_from


if __name__ == "__main__":
    from src.audio.dsp import write_wav
    from src.common import ROOT
    music, _ = synth(-1.2, N_END)
    write_wav(ROOT / "output/build/music_synth.wav", music)
