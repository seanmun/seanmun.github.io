#!/bin/sh
# Bakes one space's light, start to finish:
#
#   scripts/museum/bake/bake.sh <space> [museum url] [samples]
#
# <space> is lobby, gallery or salon (see rooms.json for each one's light
# balance). Exports the space from the running museum (the dev server, by
# default), bakes it in Blender, and installs the results in
# public/media/museum/bake/: the light map as WebP (and a half-size copy for
# phones), the reflection probe, the per-vertex light and the manifest.
# Needs: Blender, cwebp, and playwright-core reachable through NODE_PATH.
set -e
SPACE=${1:?which space? lobby, gallery or salon}
URL=${2:-http://localhost:3100/museum}
SAMPLES=${3:-1024}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
WORK=${BAKE_WORK:-${TMPDIR:-/tmp}/museum-bake}
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
OUT="$ROOT/public/media/museum/bake"
mkdir -p "$WORK" "$OUT"
node "$HERE/dump.js" "$URL" "$SPACE" "$WORK/$SPACE.json"
"$BLENDER" -b -P "$HERE/bake_room.py" -- "$WORK/$SPACE.json" "$WORK/out" "$SAMPLES" 2>&1 | grep -E "^baking|median|WARNING|Error|Traceback|^baked|probe:" || true
SIZE=$(node -e "console.log(require('$WORK/out/$SPACE-bake.json').size)")
cwebp -quiet -lossless "$WORK/out/$SPACE-light.png" -o "$OUT/$SPACE-light.webp"
cwebp -quiet -lossless -resize $((SIZE / 2)) $((SIZE / 2)) "$WORK/out/$SPACE-light.png" -o "$OUT/$SPACE-light-half.webp"
cwebp -quiet -lossless "$WORK/out/$SPACE-probe.png" -o "$OUT/$SPACE-probe.webp"
cp "$WORK/out/$SPACE-verts.bin" "$WORK/out/$SPACE-bake.json" "$OUT/"
ls -l "$OUT" | grep " $SPACE-"
