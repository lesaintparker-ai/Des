# Rapport de contrôle qualité

Fichier contrôlé : `output/final/retournez_evangile_eau_esprit_1080p.mp4` (rendu effectué le 22/10/2026 dans l'environnement du projet).

## Vérifié (mesuré)

| Contrôle | Résultat |
|---|---|
| Format | MP4, H.264 High, yuv420p, 1920×1080, 16:9 |
| Cadence | 30 i/s constants (r_frame_rate = avg_frame_rate = 30/1), 1 945 images |
| Audio | AAC-LC, 48 kHz, stéréo, 256 kb/s |
| Durée | 64,84 s (intro 6,1 s + narration 54,1 s + respiration et maintien de l'écran final) |
| Lecture | Décodage complet par FFmpeg sans erreur |
| Loudness | −15,1 LUFS intégrés, crête −1,9 dBFS, LRA 6,8 LU |
| Écrans noirs | Aucun involontaire ; seul le fondu de fin (64,67 → 64,84 s) est noir |
| Fluidité | Écart médian entre images 1,0/255 ; pics uniquement aux transitions et à l'éclair voulu de la rupture des chaînes (43,5 s) |
| Ressources originales | Inchangées (`sha256sum -c assets/CHECKSUMS.sha256` : OK) |
| Illustrations | Chaque scène utilise l'illustration prévue (planche contact `docs/planche_contact.jpg`) ; aucune image régénérée ni redessinée |
| Intégrité des images | Uniquement des transformations globales (zoom, panoramique, secousse) et des calques ajoutés ; visages, mains, Croix et couverture non déformés. L'ondulation de l'eau du baptême est limitée aux lignes situées sous les personnages |
| Synchronisation | Repères posés sur les timestamps mot à mot obtenus par transcription ElevenLabs (Scribe) de la voix fournie ; le texte transcrit correspond mot pour mot au script de référence |
| Textes finaux | Lisibles en 1080p (vérifié sur image extraite à 60,5 s), affichés de 50,5 s à 63,6 s |
| Coordonnées | Aucune adresse, lien, numéro ou compte inventé : appel générique « message privé » uniquement |
| Voix / fond | Rapport voix ÷ (musique + effets) dans la bande 300 Hz – 4 kHz : médiane 17,7 dB sur les fenêtres de 0,4 s contenant de la voix |

## Points d'attention

1. **Écoute humaine non réalisée.** L'environnement n'a pas de sortie audio : l'équilibre a été réglé par mesures
   (loudness, rapport voix/fond par fenêtre). Points les plus serrés : la rupture des chaînes sur « l'œuvre du salut »
   (vers 43,5 s, l'impact est volontairement synchronisé sur la phrase) et le sommet musical juste après. À écouter en priorité.
2. **Illustration manquante.** La « Bible ouverte entourée de fumée » prévue au storyboard n'était pas fournie. Elle est
   remplacée par une scène typographique (fumée, fragments rouges) puis un écran partagé Croix / baptême estompé, construit
   avec les illustrations originales. Si vous fournissez l'image, elle pourra être intégrée dans `s3_demi_evangile.py`.
3. **Illustration « livre + icône de messagerie »** non fournie : la vraie couverture a été utilisée et l'icône de
   messagerie est une bulle générique dessinée par le code (aucun logo de marque).
4. **Filigrane CapCut dans l'intro.** La vidéo d'intro fournie porte un petit logo « CapCut » en haut à gauche pendant
   ses 6 premières secondes. Il provient du fichier source ; il n'a pas été ajouté ni retiré par le projet. Pour l'éliminer,
   exporter l'intro depuis CapCut sans filigrane, la placer dans `assets/intro/` et relancer `make final`.
5. **Musique de travail synthétique.** Originale et libre de droits, mais plus simple qu'une vraie composition
   orchestrale. Remplaçable par un fichier sous licence (`music_file` dans `config/render.json`).
6. **Séparation des chaînes** (scène de la Croix) obtenue par détourage couleur : fragments attribués en entier à la chaîne
   gauche ou droite, fond reconstruit derrière. Vérifié sur images fixes ; à regarder en lecture à pleine vitesse.
7. **Mise à l'échelle.** Les illustrations font environ 1 672 × 941 px et sont agrandies (×1,15 minimum, jusqu'à ×1,5 dans les
   zooms) : très légère douceur dans les plans les plus serrés.
8. **Script ElevenLabs** (`src/audio/elevenlabs.py`) : non exécuté faute de clé API dans l'environnement. Les timestamps
   actuels proviennent de la transcription faite par le connecteur ElevenLabs.

## Reproductibilité

Toutes les animations sont déterministes (particules et bruits à graine fixe, état calculé analytiquement à chaque instant),
ce qui permet le rendu parallèle et donne un résultat identique à chaque relance.
