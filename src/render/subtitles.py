"""Sous-titres synchronisés sur les mots prononcés : fichier .ass (incrustation par
libass) et .srt (à téléverser séparément sur les plateformes).

  python3 -m src.render.subtitles   ->  output/build/sous_titres.ass + output/final/*.srt
"""
from src.common import RENDER, ROOT, T, load_json

HOLD = 0.35      # maintien après le dernier mot
LEAD = 0.08      # apparition juste avant le premier mot
MIN_GAP = 0.05


def cues():
    """Liste (début, fin, texte) en temps global de la vidéo."""
    from src.audio.mix import narration_offset
    off = narration_offset()
    raw = [(T(c["from"]) - LEAD, T(c["to"], edge="end") + HOLD, c["text"]) for c in load_json("config/sous_titres.json")["cues"]]
    out = []
    for i, (a, b, text) in enumerate(raw):
        if i + 1 < len(raw):
            b = min(b, raw[i + 1][0] - MIN_GAP)
        out.append((a + off, b + off, text))
    return out


def _ts_ass(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _ts_srt(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_ass(path, width, height):
    s = RENDER["subtitles"]
    k = height / 1080
    alpha = f"{int(255 * (1 - s['box_opacity'])):02X}"
    style = (f"Style: Default,{s['font_name']},{int(s['size'] * k)},&H00FFFFFF,&H00FFFFFF,&H{alpha}101014,"
             f"&H{alpha}101014,0,0,0,0,100,100,{s['spacing']},0,3,{max(int(12 * k), 1)},0,2,"
             f"{int(s['margin_x'] * k)},{int(s['margin_x'] * k)},{int(s['margin_bottom'] * k)},1")
    lines = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {width}", f"PlayResY: {height}", "WrapStyle: 0",
             "ScaledBorderAndShadow: yes", "", "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
             "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
             "MarginL, MarginR, MarginV, Encoding", style, "", "[Events]",
             "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    fade = int(s["fade"] * 1000)
    for a, b, text in cues():
        lines.append(f"Dialogue: 0,{_ts_ass(a)},{_ts_ass(b)},Default,,0,0,0,,{{\\fad({fade},{fade})}}{text}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def write_srt(path):
    blocks = [f"{i}\n{_ts_srt(a)} --> {_ts_srt(b)}\n{text}\n" for i, (a, b, text) in enumerate(cues(), 1)]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(blocks), encoding="utf-8")
    return path


if __name__ == "__main__":
    print(write_ass(ROOT / "output/build/sous_titres.ass", 1920, 1080))
    print(write_srt(ROOT / "output/final/retournez_evangile_eau_esprit.srt"))
