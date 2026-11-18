#!/bin/sh
# usage: scripts/compare.sh renders/render_vXX.png  -> renders/compare_vXX.png (reference | render)
in="$1"; out="$(dirname "$in")/compare_$(basename "$in" | sed 's/^render_//')"
ffmpeg -loglevel error -y -i reference/reference.png -i "$in" -filter_complex "[0]scale=540:960[a];[1]scale=540:960[b];[a][b]hstack" "$out" && echo "$out"
