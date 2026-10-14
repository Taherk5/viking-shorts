#!/usr/bin/env bash
# Set up a new question Short and build its audio.
#   tools/new_short.sh <slug> "<title>"      creates <slug>/ (index.html, fonts, film.json, audio/make_audio.py)
#   then write <slug>/audio/vo_lines.json and run:  tools/new_short.sh <slug> --audio
set -euo pipefail
cd "$(dirname "$0")/.."
slug=$1
S=/tmp/claude-0/-home-user/e1fdf8af-dbd9-50f3-a0ce-573d66ca5f2c/scratchpad
if [ "${2:-}" = "--audio" ]; then
  "${PY:-$S/ttsenv/bin/python}" -I tools/tts_lines.py "${KOKORO:-$S/kokoro-model}" "$slug/audio/vo_lines.json" "$slug/audio/vo_raw" am_adam
  uv run "$slug/audio/make_audio.py" 2>&1 | grep -v -E "UV_NATIVE|Installed"
  exit 0
fi
title=$2
mkdir -p "$slug/audio/vo_raw" "$slug/assets" "$slug/fonts" "$slug/docs"
sed "s#<title>.*</title>#<title>$title</title>#" why-we-dream/index.html > "$slug/index.html"
cp why-we-dream/fonts/display.woff2 why-we-dream/fonts/ui.woff2 "$slug/fonts/"
sed "s#sun-disappears#$slug#g" sun-disappears/audio/make_audio.py > "$slug/audio/make_audio.py"
printf '{\n "title": "%s",\n "duration": 40,\n "formats": ["9x16"],\n "poster": 1.0\n}\n' "$title" > "$slug/film.json"
echo "$slug/ ready"
