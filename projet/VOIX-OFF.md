# Voix off — BRUNCH ENTRE'AMIS (concept A, 42 s)

## Direction de la voix

- **Voix** : homme jeune, accent ivoirien naturel (voix ElevenLabs « Esaïe Koua », id `HbDa7eEZNGkUODgNzru6`).
- **Ton** : chaleureux, souriant, festif, comme un ami qui invite d'autres amis. Énergique sur l'accroche et les boissons, plus posé et rassurant sur le lieu et la fin.
- **Débit** : moyen à rapide, mais chaque information (date, lieu, prix) bien détachée.
- **Mixage** : voix devant, musique baissée d'environ 10 dB pendant la parole.
- **Modèle** : `eleven_v4` (accepte les indications entre crochets comme `[excited]`, qui ne sont pas lues à voix haute).

## Script avec timecodes

| Temps | Scène | Ton | Texte dit |
|---|---|---|---|
| 0:00 – 0:04 | 1. Accroche | Enjoué, interrogatif | « Samedi 31 octobre… on se retrouve chez Brunch Entre Amis ? » |
| 0:04 – 0:09 | 2. Événement | Chaleureux, clair | « Rendez-vous à Akékoï Village, au terrain de football ! » |
| 0:09 – 0:14 | 3. Porc au four | Gourmand | « Au menu : du porc au four… choukouya et sauté-revenir, à partir de 2 000 francs ! » |
| 0:14 – 0:24 | 4. Volailles | Rythmé, montée sur la fin | « Côté volailles : demi-poulet, poulet de chair, poulet pondeuse, poulet africain… et même la pintade ! » |
| 0:24 – 0:27 | 5. Accompagnements | Léger | « Avec attiéké, frites ou pain. » |
| 0:27 – 0:37 | 6. Boissons | Festif | « Et pour trinquer : Bock, Castel, Beaufort, kit Desperados, du vin… et tous les sodas à 500 francs ! » |
| 0:37 – 0:42 | 7. Écran final | Chaleureux, appel à l'action | « Brunch Entre Amis, samedi 31 octobre. Contactez-nous… on vous attend ! » |

Notes de prononciation (texte audio uniquement, l'écran garde l'orthographe validée) :
- « Brunch Entre Amis » : écrit sans apostrophe pour une liaison naturelle (« entre-amis »).
- « Akékoï » : graphie phonétique de « Akekoi » pour éviter une lecture « a-ke-kwa ».
- Prix dits en « francs » (usage courant) ; l'écran affiche « FCFA ».

## Texte à coller dans ElevenLabs (modèle eleven_v4)

```
[excited] Samedi 31 octobre… on se retrouve chez Brunch Entre Amis ? [pause]
[warmly] Rendez-vous à Akékoï Village, au terrain de football ! [pause]
[excited] Au menu : du porc au four… choukouya et sauté-revenir, à partir de 2 000 francs ! [short pause]
Côté volailles : demi-poulet, poulet de chair, poulet pondeuse, poulet africain… et même la pintade ! [short pause]
Avec attiéké, frites ou pain. [pause]
[happy] Et pour trinquer : Bock, Castel, Beaufort, kit Desperados, du vin… et tous les sodas à 500 francs ! [pause]
[warmly] Brunch Entre Amis, samedi 31 octobre. Contactez-nous… on vous attend !
```

Version sans crochets (modèle `eleven_multilingual_v2`) : retirer les indications entre crochets et remplacer `[pause]` par `<break time="0.6s" />`.

## Intégration au montage

Exporter en MP3 ou WAV et déposer le fichier dans `projet/medias/audio/voix-off.mp3` (ou `.wav`). Le montage découpe la prise aux silences et cale chaque phrase au début de sa scène.

## Prise générée (ElevenLabs, eleven_v4, voix Esaïe Koua)

Fichier : `medias/audio/voix-off.mp3` — MP3 mono 44,1 kHz, **32,8 s**. Génération `vV1KckIH95uWJ8kCoQbo` (la 2ᵉ prise demandée a échoué côté ElevenLabs : accès « Free Tier » désactivé sur le compte).

Découpage mesuré automatiquement (silences > 0,35 s à −40 dB) — 7 phrases, une par scène :

| Phrase | Dans le fichier | Durée | Placement dans la vidéo |
|---|---|---|---|
| 1. Accroche | 0,00 – 3,11 s | 3,1 s | 0:00,2 (scène 1) |
| 2. Lieu | 3,94 – 6,69 s | 2,8 s | 0:04,6 (scène 2, après l'apparition du « 31 ») |
| 3. Porc au four | 7,08 – 12,02 s | 4,9 s | 0:09,0 (scène 3) |
| 4. Volailles | 12,61 – 18,28 s | 5,7 s | 0:14,6 (scène 4) |
| 5. Accompagnements | 18,71 – 20,58 s | 1,9 s | 0:24,4 (scène 5) |
| 6. Boissons | 21,16 – 27,85 s | 6,7 s | 0:27,6 (scène 6) |
| 7. Final | 28,40 – 32,84 s | 4,4 s | 0:37,3 (scène 7) |

Non vérifié à l'écoute par Claude (pas de lecture audio possible) : la prononciation de « Akékoï », « choukouya » et « Brunch » doit être validée par le client.

---

# Voix off retenue : fichier fourni par le client

Fichier : `medias/audio/voix-off-client.mp3` — ElevenLabs, voix « Dave », MP3 mono 44,1 kHz, **74,8 s**. Script complet du client (version longue). La prise précédente générée par Claude est conservée pour mémoire : `medias/audio/voix-off-claude-v1-non-retenue.mp3`.

## Transcription automatique (contrôle)

Transcription hors ligne (Whisper small) découpée aux pauses. Les fautes d'orthographe viennent de la reconnaissance automatique, pas forcément de la voix.

| # | Temps (fichier) | Phrase reconnue |
|---|---|---|
| 1 | 0,00 – 4,01 | Hééé, mes gars, mes go, les amis, vous êtes prêts ? |
| 2 | 4,01 – 6,70 | Le samedi 31 octobre, on se retrouve où ? |
| 3 | 6,70 – 8,35 | Chez Brunch Entre'Amis. |
| 4 | 8,35 – 10,83 | Au menu, on a le bon porc au four. |
| 5 | 10,83 – 16,97 | Le choukouya à partir de 2000 francs CFA et le sauté-revenir à partir de 2000 francs CFA aussi. |
| 6 | 16,97 – 20,21 | Rien que d'en parler, ça donne faim. |
| 7 | 20,21 – 21,54 | Et ce n'est pas fini. |
| 8–12 | 21,54 – 34,86 | Demi-poulet **à** 3500 · chair 5000 · pondeuse 6000 · africain 7000 · pintade 8500 francs CFA. |
| 13 | 34,86 – 38,70 | Pour accompagner tout ça, on a l'attiéké, les frites et le pain. |
| 14 | 38,70 – 41,17 | Côté boissons, écoutez bien les prix. |
| 15–21 | 41,17 – 60,69 | Bock 66 600 · Castel 600 · Beaufort 700 · kit Desperados de 3 bouteilles 2000 · vin Valpierre Kiravi 2500 · vin bouché 3500 · **sodas à partir de 500** francs CFA. |
| 22 | 60,69 – 62,13 | Alors, notez bien. |
| 23 | 62,13 – 66,98 | Samedi 31 octobre 2026, à Akekoi Village, au terrain de football. |
| 24 | 66,98 – 70,19 | Pour les renseignements, contactez-nous aux numéros affichés à l'écran. |
| 25 | 70,19 – 74,84 | Brunch Entre'Amis, le 31 octobre, on s'y retrouve, ne manquez pas ça. |

Phrases du script absentes de la prise : « Chacun choisit selon son goût et son budget », « On mange bien, on se fait plaisir… », « BRUNCH ENTRE'AMIS vous donne rendez-vous ».

## Écarts entre la voix et l'écran (à arbitrer par le client)

- **Sodas** : la voix dit « à partir de 500 francs CFA » ; l'écran affiche « Tout à 500 FCFA » (décision validée).
- **Demi-poulet** : la voix dit « à 3 500 » ; l'écran affiche « À partir de 3 500 FCFA » (affiche officielle).

Correction possible : régénérer seulement ces deux phrases avec la même voix ; elles seront recollées aux mêmes endroits (21,54 s et 57,77 s du fichier).
