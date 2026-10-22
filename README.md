# Retournez à l'Évangile de l'eau et de l'Esprit — motion design

Vidéo de motion design chrétien (16:9, 1920×1080, 30 i/s, 64,8 s) : générique **NEW TV Jerusalem**,
puis huit scènes animées à partir des illustrations originales, calées sur la voix off ElevenLabs.

| Livrable | Fichier |
|---|---|
| Vidéo finale | `output/final/retournez_evangile_eau_esprit_1080p.mp4` |
| Prévisualisation | `output/preview/retournez_evangile_preview_540p.mp4` |
| Planche contact (1 image / 2 s) | `docs/planche_contact.jpg` |
| Rapport de contrôle qualité | `docs/RAPPORT_QC.md` |

## Déroulé

Temps global de la vidéo. La voix démarre à 6,4 s ; le scénario commence par un fondu enchaîné de 0,5 s avec l'intro.

| Temps | Scène | Illustration | Animation principale | Repère voix |
|---|---|---|---|---|
| 0 – 6,1 | Intro NEW TV | `assets/intro/intro_new_tv.mp4` | vidéo fournie, son d'origine | — |
| 5,6 – 10,9 | Le prédicateur | `01_predicateur_richesses.png` | zoom vers la chaire, faisceaux qui respirent, étincelles ; l'or s'éteint et la caméra descend vers les cœurs brisés | « sans jamais trouver la paix » |
| 10,9 – 16,9 | La repentance quotidienne | `02_vase_repentance.png` | zoom vers les mains et le vase, gouttes qui se forment et tombent, flaque qui s'étend ; l'encre engloutit l'image | « culpabilité… sans cesse » |
| 16,9 – 24,8 | Le demi-évangile | Croix + baptême | question typographiée sur fond de fumée, puis écran partagé : la Croix lumineuse et le baptême estompé (« oublié ») | « sang… Croix » / « baptême » |
| 24,8 – 30,2 | L'Ancien Testament | `04_sacrificateur_agneau.png` | panoramique vers les mains, lumière sur le Tabernacle, fumée animée, particules du transfert | « transféré », « l'imposition des mains » |
| 30,2 – 38,6 | Le baptême de Jésus | `05_bapteme_jourdain.png` | ondulation de l'eau sous la ligne d'eau, ondes, gouttes, éclaboussure, fumée qui s'éloigne ; l'eau monte et remplit le cadre | « baptisé », « transférés » |
| 38,6 – 44,5 | La Croix | `06_croix_chaines.png` | approche lente, rayons qui s'intensifient, chaînes qui se tendent puis s'écartent, éclats, légère secousse | impact sur « l'œuvre du salut » |
| 44,5 – 50,5 | Le cœur purifié | `07_coeur_purifie.png` | respiration de l'image, pulsation du cœur, rayons, particules | pulsation sur « cœur » |
| 50,5 – 64,8 | Le livre gratuit | `assets/book/livre_retournez_evangile.png` | entrée du livre, halo doré, badge, titre, icône de messagerie, appel à l'action | « gratuitement », « Retournez… », « Envoie-moi » |

## Relancer le projet

Prérequis : Python ≥ 3.10, FFmpeg ≥ 6 (libx264, AAC), `pip install -r requirements.txt` (NumPy, Pillow).

```sh
make stills    # images clés de contrôle (≈20 s)
make preview   # vidéo 960x540 complète (≈2 min sur 4 cœurs)
make final     # vidéo 1920x1080 (≈10 min sur 4 cœurs)
make audio     # mixage seul + stems + contrôle voix/fond
```

## Modifier le montage

- **`config/timeline.json`** : bornes des scènes, keyframes de caméra `[temps, x, y, zoom]`, transitions,
  paramètres d'effets et liste des effets sonores. Les temps acceptent des **ancres sur les mots réellement prononcés** :
  `"@baptisé"`, `"@croix#2"` (2ᵉ occurrence), `"@salut+0.3"`. Elles sont résolues avec
  `assets/audio/voix_off_timestamps.json`, donc le montage suit automatiquement une nouvelle voix.
- **`config/render.json`** : résolution, cadence, qualité d'encodage, niveaux audio (voix, musique, ducking, effets,
  intro), cible loudness (−15 LUFS, crête −2 dBTP) et `music_file`.
- Textes de l'écran final : `params` de la scène `livre` dans `config/timeline.json`.

## Remplacer la voix off

1. Déposer le nouveau fichier dans `assets/audio/` et mettre son chemin dans `narration.file` (`config/timeline.json`).
2. Recalculer les timestamps mot à mot :
   `ELEVENLABS_API_KEY=... python3 -m src.audio.elevenlabs align assets/audio/<fichier>.mp3`
   — ou générer directement voix + timestamps depuis le script de `config/voix_off.json` (renseigner `voice_id`) :
   `ELEVENLABS_API_KEY=... python3 -m src.audio.elevenlabs tts`
3. `make preview`, vérifier, puis `make final`.

La clé ElevenLabs n'est lue que dans la variable d'environnement `ELEVENLABS_API_KEY` ; ne l'écrivez jamais dans le dépôt
(`.env` est ignoré par Git).

## Musique

La piste actuelle est une **musique de travail synthétisée par le code** (`src/audio/music.py`, composition originale,
sans droits tiers) : nappe en ré mineur, montée au baptême, accord de fa majeur sur la rupture des chaînes, fin apaisée.
Pour utiliser une musique sous licence, la placer dans `assets/music/` et renseigner `"music_file"` dans `config/render.json`.
Le ducking sous la voix s'applique dans les deux cas.

## Architecture

```
assets/      ressources originales (lecture seule, sommes de contrôle dans assets/CHECKSUMS.sha256)
config/      timeline.json, render.json, voix_off.json
src/animation  caméra virtuelle, easing, effets procéduraux (fumée, rayons, particules), typographie
src/scenes     une scène par fichier (s1_eglise … s8_livre)
src/render     timeline + transitions, rendu parallèle, assemblage final (intro, fondu, audio)
src/audio      musique, effets sonores, mixage, contrôle voix/fond, intégration ElevenLabs
output/        preview/ et final/ (output/build/ = fichiers intermédiaires, ignorés par Git)
```

Polices : Cinzel et Montserrat (SIL Open Font License, licences dans `assets/fonts/`).
