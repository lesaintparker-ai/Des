"""Contrôle objectif du mixage : la voix doit dominer musique + effets pendant la narration."""
import numpy as np

from src.audio.dsp import SR, decode
from src.common import ROOT


def speech_band(x, lo=300, hi=4000):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(x))


def report(win=0.4):
    """Rapport voix / (musique + effets) dans la bande de la parole (300 Hz – 4 kHz)."""
    v = speech_band(decode(ROOT / "output/build/stem_voix.wav").mean(1))
    bg = speech_band(decode(ROOT / "output/build/stem_musique.wav").mean(1)
                     + decode(ROOT / "output/build/stem_effets.wav").mean(1))
    n = int(win * SR)
    rows = []
    for i in range(0, min(len(v), len(bg)) - n, n):
        rv = np.sqrt(np.mean(v[i:i + n] ** 2))
        rb = np.sqrt(np.mean(bg[i:i + n] ** 2)) + 1e-9
        if rv > 0.01:
            rows.append((i / SR, 20 * np.log10(rv / rb)))
    snr = np.array([r[1] for r in rows])
    print(f"Fenêtres avec voix : {len(rows)} — rapport voix/fond médian {np.median(snr):.1f} dB, "
          f"minimum {snr.min():.1f} dB à t={rows[int(snr.argmin())][0]:.1f}s")
    for t, s in rows:
        if s < 12:
            print(f"  attention t={t:.1f}s : voix/fond {s:.1f} dB")
    return snr


if __name__ == "__main__":
    report()
