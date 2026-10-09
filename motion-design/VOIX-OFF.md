# Voix off — Suura

La voix utilisée est celle générée avec ElevenLabs : `assets/voix-off.mp3`, 40,5 s.
Elle est mixée directement dans `out/suura-motion.mp4`, avec les bruitages en dessous.

Toute l'animation est calée sur les phrases ci-dessous. Les temps ont été mesurés automatiquement sur l'audio :
transcription Whisper et détection des pauses.

| Temps | Voix | Ce qui se passe à l'écran |
|---|---|---|
| 0:00 | « Plus de crédit en pleine discussion ? » | Awa, l'alerte « Crédit épuisé », la question |
| 0:02 | « Avec Suura, recharge ton crédit en 30 secondes et continue ta discussion ! » | Le logo Suura apparaît. « 30 secondes » se souligne au moment où il est prononcé, puis viennent les logos Orange, MTN et Moov |
| 0:06 | « C'est simple ! Écris « Bonjour Suura » sur WhatsApp. » | Le téléphone monte, on tape et on envoie « Bonjour Suura » |
| 0:09 | « Entre ton numéro, choisis ton pass… » | Saisie du numéro, choix du Pass Internet 500F |
| 0:11 | « …et passe au paiement. » | Récapitulatif, tap sur « Payer maintenant » |
| 0:12 | « Wave, Orange Money, MTN, Moov ou Djamo… » | Chaque moyen de paiement s'allume quand il est cité |
| 0:15 | « …à toi de choisir. Et voilà ! » | Tap sur Wave, puis « Paiement réussi » |
| 0:17 | « Ton pass arrive aussitôt. » | Le message « Pass activé ! » et la notification Orange arrivent, le chrono s'arrête |
| 0:18 | « Pass activé en moins de 30 secondes. » | Grande coche, confettis, « En moins de 30 secondes » |
| 0:20 | « Instantané. Pas d'attente, pas de file. » | 01 Instantané |
| 0:23 | « Orange, MTN, Moov : tous tes réseaux au même endroit. » | 02 : les logos apparaissent un par un, au rythme de la voix |
| 0:26 | « Et tout ça, sans carte bancaire. » | 03 : les logos mobile money, puis « Aucune carte bancaire » |
| 0:28 | « Même maman au village peut recevoir son crédit grâce à toi ! » | 04 Recharge pour un proche |
| 0:31 | « Simple comme un message. Disponible 24h sur 24, sur WhatsApp et Telegram. » | Chiffres : 3 · 24/7 · 2 |
| 0:36 | « Suura, la solution qui te connecte. » | Le logo, la signature, tous les logos partenaires |
| 0:38 | « Écris « Bonjour Suura » dès maintenant ! » | Le bouton « Écris « Bonjour Suura » » et suura.app |

## Changer de voix

1. Remplace `assets/voix-off.mp3`, ou indique un autre fichier dans `config.js` → `voice.file`.
2. Si le texte ou le rythme change, ajuste les temps dans `scenes.js`. Ils sont tous regroupés en haut du fichier,
   dans `TIMELINE` / `const T = {…}`. C'est aussi là que se règlent les délais de la conversation WhatsApp, dans `buildChat`.
3. Relance `node render.mjs`.

Les volumes se règlent dans `config.js` : `voice.volume` pour la voix, `voice.sfxVolume` pour les bruitages.

## Finitions possibles dans CapCut

- **Musique :** ajoute un instrumental afrobeat ou coupé-décalé léger, à environ 10–15 %, avec la réduction automatique (ducking) activée.
- **Sous-titres :** utilise **Texte → Sous-titres automatiques**. Beaucoup de gens regardent sans le son.
