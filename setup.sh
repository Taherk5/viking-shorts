#!/usr/bin/env bash
# Prepares a fresh cloud session to render the Viking Shorts: TTS runtime + voice model (hash-checked).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
TTS="${TTS_DIR:-$HOME/tts}"
mkdir -p "$TTS/model"
[ -x "$TTS/venv/bin/python" ] || python3 -m venv "$TTS/venv"
"$TTS/venv/bin/pip" install -q kokoro-onnx soundfile
fetch() { # name url sha256
  [ -f "$TTS/model/$1" ] && echo "$3  $TTS/model/$1" | sha256sum -c --status && return 0
  curl -fsSL -o "$TTS/model/$1" "$2"
  echo "$3  $TTS/model/$1" | sha256sum -c - || { echo "HASH MISMATCH for $1 - deleting"; rm -f "$TTS/model/$1"; exit 1; }
}
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
fetch kokoro-v1.0.onnx "$BASE/kokoro-v1.0.onnx" 7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5
fetch voices-v1.0.bin  "$BASE/voices-v1.0.bin"  bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d
echo "TTS ready: $TTS  (use: $TTS/venv/bin/python -I voiceover.py $TTS/model <outdir> am_michael)"
