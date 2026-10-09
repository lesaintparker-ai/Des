# Motion design Suura

Une vidéo verticale de 41 s (1080×1920, 30 i/s) pour TikTok, Reels et les statuts WhatsApp.
Elle est calée sur la voix off ElevenLabs (`assets/voix-off.mp3`) et utilise les vrais logos (`assets/`).
Elle est animée en HTML/JS et rendue image par image en MP4.

Le style vient de la vidéo de référence : fond vert profond avec un motif, accents jaunes,
cartes 3D inclinées et fonctionnalités numérotées 01/04. Le contenu est celui de Suura :
le site suura.app et le vrai parcours WhatsApp.

## Storyboard

Le découpage complet, phrase par phrase, avec les temps de la voix, est dans [VOIX-OFF.md](VOIX-OFF.md).
Voici le résumé : accroche « Plus de crédit ? » → promesse « 30 secondes » → conversation WhatsApp animée →
paiement (Wave, Orange Money, MTN MoMo, Moov Money, Djamo) → « Pass activé » →
01 Instantané · 02 Tous les réseaux · 03 Sans carte bancaire · 04 Recharge pour un proche →
« Simple comme un message » 3 · 24/7 · 2 → logo, logos partenaires, « Écris « Bonjour Suura » ».

La vidéo finale est `out/suura-motion.mp4`. Elle contient la voix off, avec en dessous les bruitages synthétisés (pop, whoosh, ding du paiement).

## Modifier

Tout le contenu est dans **`config.js`** : textes, couleurs, prix, numéro, moyens de paiement, fonctionnalités et chiffres.
Les logos (Suura, réseaux, mobile money) sont dans `assets/`. Ce sont des tuiles carrées de 400 px référencées dans `config.js`.
On peut aussi mettre une vraie photo d'Awa avec `persona.avatar`.

## Aperçu et rendu

```sh
# Aperçu avec la voix : servir le dossier (ex. npx http-server) puis ouvrir index.html et cliquer sur Lecture
# Rendu MP4 (Node 18+, ffmpeg et Playwright requis)
npm i -g playwright && npx playwright install chromium   # une seule fois
node render.mjs                     # → out/suura-motion.mp4
node render.mjs --no-voice          # bruitages seuls
node render.mjs --no-audio          # vidéo muette
node render.mjs --frames 2,9,30     # captures PNG pour vérifier une scène
```
