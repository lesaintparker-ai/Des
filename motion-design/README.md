# Motion design Suura

Une vidéo verticale de 41 s (1080×1920, 30 i/s) pour TikTok, Reels et les statuts WhatsApp.
Elle est animée en HTML/JS et rendue image par image en MP4.

Le style vient de la vidéo de référence : fond vert profond avec un motif, accents jaunes,
cartes 3D inclinées et fonctionnalités numérotées 01/04. Le contenu est celui de Suura :
le site suura.app et le vrai parcours WhatsApp.

## Storyboard

| Temps | Scène |
|---|---|
| 0:00 | **Accroche** : Awa, l'alerte « Crédit épuisé », « Plus de crédit en pleine discussion ? » |
| 0:03 | **Promesse** : logo Suura, « Recharge ton crédit en **30 secondes**, et continue ta discussion. », Orange / MTN / Moov |
| 0:07 | **Conversation WhatsApp animée** : Bonjour Suura → Souscrire → numéro → Pass Internet 500F → récapitulatif 535 FCFA, avec les étapes 1-2-3 et un chrono |
| 0:16 | **Paiement** : écran « Payer avec » (Wave, Orange Money, Djamo, Moov Money, MTN MoMo) → Paiement réussi |
| 0:19 | **Livraison** : « Pass activé ! » + notification opérateur, le chrono s'arrête à 28 s |
| 0:21 | **Confirmation** : grande coche, confettis, « 28 secondes chrono » |
| 0:24 | **Pourquoi Suura** : 01 Instantané · 02 Tous les réseaux · 03 Mobile money · 04 Recharge pour un proche |
| 0:34 | **Chiffres** : 3 réseaux · 24/7 · 2 messageries |
| 0:37 | **Fin** : logo, « La solution qui vous connecte. », « Écris « Bonjour Suura » », suura.app |

La vidéo finale est `out/suura-motion.mp4`. Elle contient déjà les bruitages synthétisés (pop, whoosh, ding du paiement).
La voix off est décrite dans [VOIX-OFF.md](VOIX-OFF.md).

## Modifier

Tout le contenu est dans **`config.js`** : textes, couleurs, prix, numéro, moyens de paiement, fonctionnalités et chiffres.
Pour utiliser ton vrai logo, place le fichier dans ce dossier et mets `brand.logo: "logo.svg"`.
Fais de même pour la photo d'Awa avec `persona.avatar`.

## Aperçu et rendu

```sh
# Aperçu : ouvrir index.html dans Chrome (lecture, pause, barre de temps)
# Rendu MP4 (Node 18+, ffmpeg et Playwright requis)
npm i -g playwright && npx playwright install chromium   # une seule fois
node render.mjs                     # → out/suura-motion.mp4
node render.mjs --no-audio          # sans bruitages
node render.mjs --frames 2,9,30     # captures PNG pour vérifier une scène
```
