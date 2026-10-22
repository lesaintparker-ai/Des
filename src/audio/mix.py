"""Mixage final : son de l'intro + voix off + musique (ducking sous la voix) + effets.

  python3 -m src.audio.mix   ->  output/build/mix.wav (48 kHz stéréo, avant normalisation)
"""
import numpy as np

from src.audio import sfx
from src.audio.dsp import SR, db, decode, envelope_follow, fade, place, write_wav
from src.common import LEAD, N_END, N_START, RENDER, ROOT, T, TIMELINE, intro_offset, path, scenario_duration


def narration_offset():
    """Instant global où démarre la voix off."""
    return intro_offset() + LEAD


def total_duration():
    return intro_offset() + scenario_duration()


def sfx_cues():
    from src.animation.fx import Ctx
    from src.render.timeline import Timeline
    cues = [(T(c[0]), c[1], c[2], c[3] if len(c) > 3 else None) for c in TIMELINE["sfx"]]
    for ev in Timeline(Ctx(480, 270)).sfx_events():
        cues.append((ev[0], ev[1], ev[2], ev[3] if len(ev) > 3 else None))
    return sorted(cues)


def build_mix(out=ROOT / "output/build/mix.wav"):
    a = RENDER["audio"]
    total = int(total_duration() * SR)
    off = narration_offset()

    # Intro (son d'origine de la vidéo), fondu de sortie sur le fondu enchaîné
    intro = decode(path(TIMELINE["intro"]["file"])) * db(a["intro_gain_db"])
    cf = TIMELINE["intro"]["crossfade"]
    n_in = min(len(intro), total)
    intro = intro[:n_in] * fade(n_in, 0, cf + 0.1)[:, None]

    voice = decode(path(TIMELINE["narration"]["file"])) * db(a["voice_gain_db"])
    v = np.zeros((total, 2))
    place(v, voice, off)

    # Musique : fichier sous licence si fourni, sinon piste synthétique originale
    if a.get("music_file"):
        music = decode(path(a["music_file"]))
        m = np.zeros((total, 2))
        place(m, music, intro_offset() - 0.3)
        m *= fade(total, 0, TIMELINE["final_fade"] + 1.5)[:, None]
    else:
        from src.audio.music import synth
        music, n0 = synth(N_START - 0.4, N_END)
        m = np.zeros((total, 2))
        place(m, music, n0 + off)
    m *= db(a["music_gain_db"])
    env = envelope_follow(v.mean(1), attack=0.04, release=0.9)
    duck = 1 - (1 - db(a["music_duck_db"])) * np.clip(env / 0.02, 0, 1)
    m *= duck[:, None]

    fxbus = np.zeros((total, 2))
    for i, (t, kind, gain, dur) in enumerate(sfx_cues()):
        place(fxbus, sfx.make(kind, dur, seed=i), t + off, gain=db(gain + a["sfx_gain_db"]))

    mix = np.zeros((total, 2))
    mix[:n_in] += intro
    mix += v + m + fxbus
    write_wav(out, mix)
    print(f"OK {out} ({total / SR:.2f} s) — crête {20 * np.log10(np.abs(mix).max() + 1e-9):.1f} dBFS")
    # Stems pour contrôle / remplacement
    for name, sig in (("voix", v), ("musique", m), ("effets", fxbus)):
        write_wav(ROOT / f"output/build/stem_{name}.wav", sig)
    return out


if __name__ == "__main__":
    build_mix()
