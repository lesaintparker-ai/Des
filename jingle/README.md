# Jingle « À LA DÉCOUVERTE »

Jingle d'ouverture de 10 s (25 images/s), en 16:9 (1920×1080) et 9:16 (1080×1920).
L'animation et le son sont générés par code. Le rendu est **réellement exporté en MP4** par Chromium + FFmpeg.

## Fichiers livrés

| Fichier | Contenu |
|---|---|
| `out/a-la-decouverte_16x9.mp4` | Jingle horizontal, H.264 + AAC, 10 s, 250 images |
| `out/a-la-decouverte_9x16.mp4` | Jingle vertical pour les formats courts |
| `out/planche_16x9.jpg`, `out/planche_9x16.jpg` | Planches contact (une image toutes les 0,4 s) |
| `audio/jingle.wav` | Bande son seule (48 kHz, −14 LUFS) |

## Storyboard réalisé

| Temps | Séquence |
|---|---|
| 0,0 – 1,5 s | Bande blanche en biais, « DÉCOUVRIR » arrive en très grand avec un impact grave |
| 1,5 – 3,5 s | La caméra pivote de 90° : « CHANTRES », puis « TALENTS » dans des cadres blancs |
| 3,5 – 5,0 s | « HISTOIRES », bandes pourpre et cramoisi, recul de la caméra sur le bloc complet |
| 5,0 – 6,9 s | Respiration : tracé du cercle émeraude, révélation du médaillon, halo et reflets sur l'eau |
| 6,6 – 7,4 s | Fermeture circulaire du médaillon, éclair blanc, les tranches de « DÉCOUVRIR » convergent, silence de 0,2 s |
| 7,4 – 10 s | « DÉCOUVRIR » devient « DÉCOUVERTE », « À LA » se pose ; **image fixe à partir de 8,6 s** |

L'illustration n'est ni redessinée ni déformée : elle est seulement découpée en cercle sur le bord de son anneau.
Le halo et les reflets sont des calques de lumière ajoutés par-dessus (reflets placés uniquement sur l'eau, loin des personnages).

Le titre « À LA DÉCOUVERTE » est une **composition typographique provisoire** (aucun logo officiel fourni).

## Droits

- Police **Anton** : licence SIL Open Font License (`assets/fonts/OFL-LICENSE.txt`), usage commercial autorisé.
- Son : entièrement synthétisé par `audio/synth.py`, aucun échantillon ni musique tiers.
- Illustration du médaillon : fournie par le client.

## Refaire le rendu (ordinateur avec Node.js 18+, Python 3 + NumPy + Pillow, FFmpeg)

```sh
cd jingle
npm install                    # installe Playwright (puis « npx playwright install chromium » si besoin)
python3 -I tools/prep_medaillon.py assets/medaillon-original.png assets   # seulement si l'illustration change
npm run audio                  # → audio/jingle.wav
npm run render:h               # → out/a-la-decouverte_16x9.mp4  (≈ 6 min)
npm run render:v               # → out/a-la-decouverte_9x16.mp4
node stills.js h 7.4,9.5       # images clés de contrôle dans out/stills
```

Aperçu rapide dans un navigateur : ouvrir `src/index.html?format=h&play=1` (ou `&t=8.4` pour figer une image).
Cet aperçu n'est **pas** le fichier final : seul le MP4 produit par `render.js` fait foi.

## Où modifier

- Timings : `src/cues.js` (partagés par l'image et le son, tempo 125 BPM = 12 images par temps).
- Mots, couleurs, mouvements : `src/jingle.js` ; styles : `src/style.css`.
- Sons : `audio/synth.py`.
- Flou de mouvement : 4 sous-images par image, moyennées par FFmpeg (`render.js`).
