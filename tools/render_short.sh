#!/usr/bin/env bash
# Render a question Short end to end (one at a time: renders queue on a lock).
#   tools/render_short.sh <slug>   ->  out/<slug>/final.mp4, copied to videos/<slug>.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
slug=$1
SK=${MOTION_REEL_SKILL:-"/root/.claude/plugins/synced/0f8d2436-145d-45d5-b31d-093366b33445_3c8719ef-90bc-4de4-9ff4-ef5ddd467e5a/d92346f7-5140-4ddb-b284-a3b42995e5b0~g2/skills/motion-reel"}
exec 9>/tmp/render.lock
flock 9
node "$SK/scripts/sfx.mjs" "$slug" | tail -1
node "$SK/scripts/mix.mjs" "$slug" --music-db -4 --no-mux | tail -1
node "$SK/scripts/render.mjs" --film "$slug" --format 9x16 --video-only --workers 4 > "/tmp/render_$slug.log" 2>&1
node "$SK/scripts/mix.mjs" "$slug" --music-db -4 | tail -1
cp "out/$slug/final.mp4" "videos/$slug.mp4"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of csv=p=0 "videos/$slug.mp4"
echo "DONE $slug"
