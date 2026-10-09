#!/usr/bin/env bash
# Reproducible build of anwerj/youtube-uploader-mcp from a PINNED, reviewed commit (no prebuilt binaries, no curl|sh).
set -euo pipefail
COMMIT=f120cadd911e31651db1d44bc1d11ec19db86a8c      # reviewed 2026-10-08, version 0.1.3
WORK="$(mktemp -d)"
git clone --quiet https://github.com/anwerj/youtube-uploader-mcp "$WORK/src"
git -C "$WORK/src" checkout --quiet "$COMMIT"
( cd "$WORK/src" && go mod verify && CGO_ENABLED=0 go build -trimpath -buildvcs=false -o "$OLDPWD/youtube-uploader-mcp-linux-amd64" . )
sha256sum youtube-uploader-mcp-linux-amd64
