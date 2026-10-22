"""Chemins, configuration et repères temporels partagés par tout le projet.

Toutes les heures de la configuration sont exprimées en « temps narration » :
0.0 = début du fichier de voix off. Une valeur peut être un nombre ou une
ancre sur un mot réellement prononcé, par exemple "@baptisé", "@croix#2"
(2e occurrence) ou "@salut+0.3" (avec décalage en secondes).
"""
import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


TIMELINE = load_json("config/timeline.json")
RENDER = load_json("config/render.json")

W = RENDER["width"]
H = RENDER["height"]
FPS = RENDER["fps"]


def _norm(word):
    word = unicodedata.normalize("NFKD", word.lower())
    word = "".join(c for c in word if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9'œ-]", "", word.replace("’", "'"))


@lru_cache(maxsize=1)
def words():
    data = load_json(TIMELINE["narration"]["timestamps"])
    return [(w, s, e) for w, s, e in data["words"]]


_ANCHOR = re.compile(r"^@(.+?)(?:#(\d+))?([+-]\d+(?:\.\d+)?)?$")


def T(value):
    """Convertit une valeur de config (nombre ou ancre "@mot") en secondes narration."""
    if isinstance(value, (int, float)):
        return float(value)
    m = _ANCHOR.match(value.strip())
    if not m:
        raise ValueError(f"Repère temporel invalide : {value!r}")
    target, occ, off = _norm(m.group(1)), int(m.group(2) or 1), float(m.group(3) or 0)
    count = 0
    for w, s, _ in words():
        if _norm(w) == target:
            count += 1
            if count == occ:
                return s + off
    raise KeyError(f"Mot introuvable dans les timestamps : {value!r}")


def path(rel):
    return ROOT / rel


def font(name, size, weight=None):
    from PIL import ImageFont
    f = ImageFont.truetype(str(ROOT / RENDER["fonts"][name]), size)
    if weight:
        f.set_variation_by_name(weight)
    return f


# Temps narration <-> temps du film « scénario » (après l'intro)
LEAD = TIMELINE["narration"]["lead_in"]
N_START = -LEAD
N_END = T(TIMELINE["narration"]["end"])


def scenario_duration():
    return N_END - N_START


def intro_offset():
    """Instant (temps global) où commence le scénario dans la vidéo finale."""
    probe = TIMELINE["intro"]
    return probe["duration"] - probe["crossfade"]
