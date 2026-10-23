# Publicité BRUNCH ENTRE'AMIS — projet Remotion

Vidéo verticale 1080×1920, 30 i/s, **78 s**, MP4 H.264 + AAC. Concept A « LE GRILL SIGNATURE », calé sur la voix off fournie par le client.

## Installation

```bash
cd video
npm install
```

Node 18 ou plus récent. Les médias sont lus directement dans `../projet/medias` (voir `remotion.config.ts`).

## Prévisualiser

```bash
npm run studio
```

## Rendre la vidéo

```bash
npm run render
# → out/brunch-entreamis-1080x1920.mp4
```

Puis la finalisation (son à -14 LUFS, format de couleur standard) :

```bash
scripts/mastering.sh out/brunch-entreamis-1080x1920.mp4 out/BRUNCH-ENTREAMIS-pub-31-octobre-2026.mp4
```

Dans un environnement sans téléchargement de navigateur, indiquer un Chromium local :

```bash
npx remotion render src/index.ts BrunchEntreAmis out/brunch-entreamis-1080x1920.mp4 \
  --browser-executable=/chemin/vers/chrome-headless-shell
```

Aperçus d'images clés (bundle unique, plusieurs instants) :

```bash
REMOTION_BROWSER=/chemin/vers/chrome-headless-shell node scripts/apercus.mjs ./apercus 3.9,12.8,77
```

## Organisation

| Fichier | Rôle |
|---|---|
| `src/config/content.ts` | **Tous les textes, prix, contacts, médias et la chronologie** (secondes). C'est le seul fichier à modifier pour changer un prix, un nom ou un horaire. |
| `src/config/theme.ts` | Couleurs, polices, format. |
| `src/Video.tsx` | Enchaînement des scènes. |
| `src/Soundtrack.tsx` | Voix off, musique, effets sonores. |
| `src/scenes/` | Accroche, date et marque, ouvertures de catégorie, « ça donne faim », accompagnements, rendez-vous, contacts, écran final. |
| `src/components/` | Fond (braises, fumée), étiquette de catégorie, pastille de prix, photo encadrée, carte plat, carte boisson, logo, titre animé. |
| `scripts/generer_audio.py` | Synthèse de la musique provisoire et des effets (libres de droits). |

## Audio

- **Voix off** : `projet/medias/audio/voix-off-client.mp3` (fournie par le client), placée à 0,4 s.
- **Musique** : `projet/medias/audio/genere/musique-provisoire.mp3`, synthétisée pour ce projet (aucun droit tiers). Pour la remplacer par une musique sous licence, déposer le fichier et changer `AUDIO.musique` dans `content.ts`. Le volume est réglé dans `Soundtrack.tsx` (0,16 sous la voix, 0,42 sur la fin).
- **Effets** : `projet/medias/audio/genere/sfx-*.wav`. Pour les régénérer :

```bash
python3 scripts/generer_audio.py ../projet/medias/audio/genere
ffmpeg -y -i ../projet/medias/audio/genere/musique-provisoire.wav -b:a 192k ../projet/medias/audio/genere/musique-provisoire.mp3
```

## Changer la voix off

Remplacer le fichier, puis mettre à jour les temps dans `content.ts` (fonction `vo()` = temps dans le fichier de voix + 0,4 s). Les pauses se mesurent avec :

```bash
ffmpeg -i voix.mp3 -af silencedetect=n=-40dB:d=0.3 -f null - 2>&1 | grep silence_
```
