"""Assemblage : intro NEW TV + fondu enchaîné + scénario animé + mixage normalisé.

  python3 -m src.render.assemble --preview   ->  output/preview/retournez_evangile_preview_540p.mp4
  python3 -m src.render.assemble --final     ->  output/final/retournez_evangile_eau_esprit_1080p.mp4
"""
import argparse
import json
import re
import subprocess

from src.audio.mix import build_mix, total_duration
from src.common import FPS, H, RENDER, ROOT, TIMELINE, W, intro_offset, path
from src.render.render_video import BUILD, encoder_args, render_video


def loudnorm(src, dst):
    """Normalisation EBU R128 en deux passes (mode linéaire : pas de pompage)."""
    a = RENDER["audio"]
    target = f"I={a['target_lufs']}:TP={a['true_peak']}:LRA=11"
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm={target}:print_format=json",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", log, re.S).group(0))
    af = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", str(a["sample_rate"]),
                    "-c:a", "pcm_s24le", str(dst)], check=True)
    return dst


def assemble(final, rerender=True):
    k = 1.0 if final else RENDER["preview"]["scale"]
    w, h = int(W * k) // 2 * 2, int(H * k) // 2 * 2
    tag = "final" if final else "preview"
    scenario = render_video(final) if rerender else BUILD / f"scenario_{tag}.mp4"
    mix = loudnorm(build_mix(), BUILD / "mix_norm.wav")
    out = ROOT / ("output/final/retournez_evangile_eau_esprit_1080p.mp4" if final
                  else "output/preview/retournez_evangile_preview_540p.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)
    cf = TIMELINE["intro"]["crossfade"]
    norm = f"fps={FPS},scale={w}:{h}:flags=lanczos,setsar=1,format=yuv420p,settb=AVTB"
    graph = (f"[0:v]{norm}[i];[1:v]{norm}[s];"
             f"[i][s]xfade=transition=fade:duration={cf}:offset={intro_offset():.3f},format=yuv420p[v]")
    a = RENDER["audio"]
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(path(TIMELINE["intro"]["file"])), "-i", str(scenario),
           "-i", str(mix), "-filter_complex", graph, "-map", "[v]", "-map", "2:a", *encoder_args(final),
           "-r", str(FPS), "-c:a", "aac", "-b:a", a["bitrate"], "-ar", str(a["sample_rate"]),
           "-t", f"{total_duration():.3f}", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    print(f"OK {out}")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--final", action="store_true")
    ap.add_argument("--no-render", action="store_true", help="réutilise le scénario déjà rendu")
    args = ap.parse_args()
    if not (args.preview or args.final):
        ap.error("--preview ou --final")
    assemble(args.final, rerender=not args.no_render)
