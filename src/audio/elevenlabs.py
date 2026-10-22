"""Intégration ElevenLabs (API REST, bibliothèque standard uniquement).

La clé est lue dans la variable d'environnement ELEVENLABS_API_KEY ; elle n'est
jamais écrite dans le projet.

  # Générer une nouvelle voix off + timestamps à partir de config/voix_off.json
  ELEVENLABS_API_KEY=... python3 -m src.audio.elevenlabs tts

  # Recalculer les timestamps mot à mot d'un fichier voix existant (Speech-to-Text)
  ELEVENLABS_API_KEY=... python3 -m src.audio.elevenlabs align assets/audio/voix_off_elevenlabs.mp3

Les deux commandes écrivent assets/audio/voix_off_timestamps.json au format utilisé
par config/timeline.json (ancres "@mot"). Relancer ensuite le rendu.
"""
import base64
import json
import os
import sys
import urllib.request
import uuid

from src.common import ROOT, load_json

API = "https://api.elevenlabs.io/v1"
TIMESTAMPS = ROOT / "assets/audio/voix_off_timestamps.json"


def _key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY absente : exportez-la dans votre terminal (ne la mettez pas dans le dépôt).")
    return key


def _post(url, body, content_type):
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"xi-api-key": _key(), "Content-Type": content_type})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def _save(words, source, engine, duration):
    data = {"source": source, "engine": engine, "spoken_duration_secs": duration,
            "words": [[w, round(s, 3), round(e, 3)] for w, s, e in words]}
    TIMESTAMPS.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK {TIMESTAMPS} ({len(words)} mots)")


def chars_to_words(chars, starts, ends):
    words, cur, t0, t1 = [], "", None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if cur:
                words.append((cur, t0, t1))
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = s
        cur += c
        t1 = e
    if cur:
        words.append((cur, t0, t1))
    return words


def tts(out=ROOT / "assets/audio/voix_off_elevenlabs_nouvelle.mp3"):
    cfg = load_json("config/voix_off.json")
    if cfg["voice_id"] == "A_RENSEIGNER":
        sys.exit("Renseignez voice_id dans config/voix_off.json")
    body = json.dumps({"text": cfg["script"], "model_id": cfg["model_id"], "language_code": cfg["language_code"],
                       "voice_settings": cfg["voice_settings"]}).encode()
    url = f"{API}/text-to-speech/{cfg['voice_id']}/with-timestamps?output_format={cfg['output_format']}"
    res = _post(url, body, "application/json")
    out.write_bytes(base64.b64decode(res["audio_base64"]))
    al = res["alignment"]
    words = chars_to_words(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"])
    _save(words, str(out.relative_to(ROOT)), f"ElevenLabs TTS {cfg['model_id']}", words[-1][2])
    print(f"OK {out} — pointez config/timeline.json > narration.file vers ce fichier.")


def align(audio_path):
    boundary = uuid.uuid4().hex
    data = open(audio_path, "rb").read()
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="language_code"\r\n\r\nfra\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="timestamps_granularity"\r\n\r\nword\r\n'.encode(),
        (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="voix.mp3"\r\n'
         f'Content-Type: audio/mpeg\r\n\r\n').encode() + data + b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    res = _post(f"{API}/speech-to-text", b"".join(parts), f"multipart/form-data; boundary={boundary}")
    words = [(w["text"], w["start"], w["end"]) for w in res["words"] if w.get("type") == "word"]
    _save(words, str(audio_path), "ElevenLabs Speech-to-Text (scribe_v1)", words[-1][2])


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "tts":
        tts()
    elif len(sys.argv) >= 3 and sys.argv[1] == "align":
        align(sys.argv[2])
    else:
        print(__doc__)
