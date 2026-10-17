# Vidéo « Le péché » — style dessiné à la main

- `video_peche_9x16.mp4` : vidéo finale (1080x1920, 30 i/s, 45,5 s, voix ElevenLabs + léger bruit de feutre).
- `src/render.py` : moteur d'animation (extraction des traits, tracé sous le feutre, caméra, titres, bulles, sous-titres mot à mot).
- `src/asr.mjs` + `src/align.py` : repérage du moment de chaque mot dans la voix (`words.json`).
- `assets/` : illustrations (s1–s9), main au feutre, carte de fin.
