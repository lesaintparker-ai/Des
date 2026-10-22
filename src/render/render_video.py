"""Rendu image par image du scénario animé (sans l'intro), en parallèle.

  python3 -m src.render.render_video --stills 0,4.4,12,...   images clés PNG
  python3 -m src.render.render_video --preview                 960x540, rapide
  python3 -m src.render.render_video --final                   1920x1080
"""
import argparse
import multiprocessing as mp
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image

from src.animation.fx import Ctx
from src.common import FPS, H, N_START, RENDER, ROOT, W, scenario_duration

BUILD = ROOT / "output" / "build"


def frame_count():
    return int(round(scenario_duration() * FPS))


def encoder_args(final):
    v = RENDER["video"]
    if final:
        return ["-c:v", v["codec"], "-preset", v["preset"], "-crf", str(v["crf"]), "-tune", v["tune"],
                "-profile:v", v["profile"], "-pix_fmt", v["pix_fmt"]]
    pv = RENDER["preview"]
    return ["-c:v", "libx264", "-preset", pv["preset"], "-crf", str(pv["crf"]), "-pix_fmt", "yuv420p"]


def render_chunk(args):
    first, last, w, h, final, out = args
    from src.render.timeline import Timeline
    tl = Timeline(Ctx(w, h))
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
           "-r", str(FPS), "-i", "-", *encoder_args(final), "-r", str(FPS), str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for i in range(first, last):
        t = N_START + i / FPS
        f = tl.frame(t)
        proc.stdin.write((np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
        if (i - first) % 60 == 0:
            print(f"  [{first}-{last}] image {i} ({time.time() - t0:.0f}s)", flush=True)
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError(f"ffmpeg a échoué pour {out}")
    return str(out)


def render_video(final):
    k = 1.0 if final else RENDER["preview"]["scale"]
    w, h = int(W * k) // 2 * 2, int(H * k) // 2 * 2
    n = frame_count()
    workers = RENDER["workers"]
    BUILD.mkdir(parents=True, exist_ok=True)
    tag = "final" if final else "preview"
    bounds = np.linspace(0, n, workers + 1).astype(int)
    jobs = [(int(a), int(b), w, h, final, BUILD / f"{tag}_part{i}.mp4") for i, (a, b) in enumerate(zip(bounds, bounds[1:]))]
    print(f"Rendu {tag} : {n} images {w}x{h} @ {FPS} i/s sur {workers} processus")
    t0 = time.time()
    with mp.get_context("fork").Pool(workers) as pool:
        parts = pool.map(render_chunk, jobs)
    listing = BUILD / f"{tag}_parts.txt"
    listing.write_text("".join(f"file '{p}'\n" for p in parts))
    out = BUILD / f"scenario_{tag}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy",
                    str(out)], check=True)
    print(f"OK {out} en {time.time() - t0:.0f}s")
    return out


def stills(times, k=1.0, folder="output/preview/stills"):
    from src.render.timeline import Timeline
    w, h = int(W * k), int(H * k)
    tl = Timeline(Ctx(w, h))
    out = ROOT / folder
    out.mkdir(parents=True, exist_ok=True)
    for t in times:
        f = tl.frame(t)
        p = out / f"n{t:06.2f}.png"
        Image.fromarray((np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)).save(p)
        print(p)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills")
    ap.add_argument("--scale", type=float, default=0.5)
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--final", action="store_true")
    a = ap.parse_args()
    if a.stills:
        stills([float(x) for x in a.stills.split(",")], a.scale)
    if a.preview:
        render_video(False)
    if a.final:
        render_video(True)
    if not (a.stills or a.preview or a.final):
        ap.print_help()
        sys.exit(1)
