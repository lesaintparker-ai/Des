#!/usr/bin/env bash
# Finalisation du rendu Remotion pour les réseaux sociaux :
# vidéo en yuv420p « limited range », son normalisé à -14 LUFS, crête limitée à -1 dBFS.
# Usage : scripts/mastering.sh out/brunch-entreamis-1080x1920.mp4 out/BRUNCH-ENTREAMIS-pub-31-octobre-2026.mp4
set -euo pipefail
in="$1"
out="$2"
mesure=$(ffmpeg -hide_banner -i "$in" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$mesure" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
af="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true,alimiter=limit=0.82:level=false"
ffmpeg -y -i "$in" \
	-vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 -color_range tv \
	-af "$af" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$out"
