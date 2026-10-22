"""Outils audio en NumPy pur (pas de SciPy dans l'environnement)."""
import subprocess

import numpy as np

SR = 48000


def decode(path, sr=SR, channels=2):
    """Décode n'importe quel fichier audio/vidéo en float32 (n, channels) via FFmpeg."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-f", "f32le", "-ac", str(channels),
                          "-ar", str(sr), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, channels).copy()


def write_wav(path, audio, sr=SR):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", str(audio.shape[1]), "-ar", str(sr),
                    "-i", "-", "-c:a", "pcm_s24le", str(path)], input=audio.astype(np.float32).tobytes(), check=True)


def db(x):
    return 10 ** (x / 20)


def seconds(n, sr=SR):
    return np.arange(int(n * sr)) / sr


def band_noise(dur, lo, hi, seed=0, sr=SR):
    """Bruit blanc filtré dans une bande [lo, hi] Hz (filtrage FFT, bords adoucis)."""
    n = max(int(dur * sr), 16)
    rng = np.random.default_rng(seed)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / sr)
    w = np.clip((f - lo * 0.7) / (lo * 0.3 + 1), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    out = np.fft.irfft(spec * w, n)
    return out / (np.abs(out).max() + 1e-9)


def env_adsr(n, a, d, sr=SR, curve=3.0):
    """Enveloppe attaque linéaire + décroissance exponentielle (secondes)."""
    t = np.arange(n) / sr
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-np.clip(t - a, 0, None) * curve / max(d, 1e-4))
    return att * dec


def fade(n, fin, fout, sr=SR):
    t = np.arange(n) / sr
    e = np.ones(n)
    if fin > 0:
        e *= np.clip(t / fin, 0, 1) ** 2
    if fout > 0:
        e *= np.clip((t[-1] - t) / fout, 0, 1) ** 2
    return e


def stereo(mono, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([mono * l * 1.414, mono * r * 1.414], 1)


def fft_convolve(x, ir):
    n = len(x) + len(ir) - 1
    size = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:n]
    return y


def reverb(audio, seconds_=2.6, wet=0.3, seed=7, sr=SR, damp=0.6):
    """Réverbération par convolution avec une réponse impulsionnelle synthétique."""
    n = int(seconds_ * sr)
    t = np.arange(n) / sr
    out = audio.copy()
    for c in range(audio.shape[1]):
        rng = np.random.default_rng(seed + c)
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds_)
        # Assombrit la queue (les aigus s'éteignent plus vite)
        spec = np.fft.rfft(ir)
        f = np.fft.rfftfreq(n, 1 / sr)
        ir = np.fft.irfft(spec / (1 + (f / (6000 * (1 - damp) + 1500)) ** 2), n)
        ir[: int(0.012 * sr)] *= np.linspace(0, 1, int(0.012 * sr))
        ir /= np.sqrt(np.sum(ir ** 2))
        wet_sig = fft_convolve(audio[:, c], ir)[: len(audio)]
        out[:, c] = audio[:, c] * (1 - wet) + wet_sig * wet
    return out


def place(dst, src, t, sr=SR, gain=1.0):
    i = int(round(t * sr))
    if i >= len(dst):
        return
    j0 = max(0, -i)
    i = max(i, 0)
    n = min(len(src) - j0, len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[j0:j0 + n] * gain


def envelope_follow(mono, sr=SR, attack=0.06, release=0.45, win=0.03):
    """Enveloppe RMS lissée (attaque/relâchement), pour le ducking de la musique."""
    hop = int(sr * 0.01)
    frames = len(mono) // hop + 1
    pad = np.pad(mono, (0, frames * hop - len(mono)))
    rms = np.sqrt(np.mean(pad.reshape(frames, hop) ** 2, 1) + 1e-12)
    w = max(int(win / 0.01), 1)
    rms = np.convolve(rms, np.ones(w) / w, "same")
    out = np.zeros_like(rms)
    a, r = np.exp(-0.01 / attack), np.exp(-0.01 / release)
    v = 0.0
    for i, x in enumerate(rms):
        v = a * v + (1 - a) * x if x > v else r * v + (1 - r) * x
        out[i] = v
    return np.repeat(out, hop)[: len(mono)]
