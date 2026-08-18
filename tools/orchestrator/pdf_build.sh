#!/usr/bin/env bash
# pdf_build.sh — Chrome-headless HTML→PDF, and a PNG contact-sheet builder.
# Usage:
#   pdf_build.sh <in.html> <out.pdf>
#   pdf_build.sh --contact <dir-of-pngs|comma-separated-list> <out.png>
set -euo pipefail

CFT_CHROME="/Users/username/temp/opencode/chrome-cft/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
# Pinned font: `convert -annotate`/`montage -label` fail with "unable to read font" against the
# default alias on this Mac — this concrete .ttf path is always present under /System/Library/Fonts.
CAPTION_FONT="/System/Library/Fonts/Supplemental/Arial.ttf"

usage() {
  cat >&2 <<'EOF'
usage:
  pdf_build.sh <in.html> <out.pdf>
  pdf_build.sh --contact <dir-of-pngs|comma-separated-list> <out.png>
EOF
}

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && exit 0
  exit 1
fi

if [[ "$1" == "--contact" ]]; then
  if [[ $# -ne 3 ]]; then
    usage
    exit 1
  fi
  src="$2"
  out_png="$3"

  if ! command -v montage >/dev/null 2>&1; then
    echo "pdf_build.sh: imagemagick 'montage' not found (brew install imagemagick)" >&2
    exit 1
  fi
  if [[ ! -f "$CAPTION_FONT" ]]; then
    echo "pdf_build.sh: caption font not found: $CAPTION_FONT" >&2
    exit 1
  fi

  pngs=()
  if [[ -d "$src" ]]; then
    while IFS= read -r -d '' f; do pngs+=("$f"); done < <(find "$src" -maxdepth 1 -iname '*.png' -print0 | sort -z)
  else
    IFS=',' read -r -a pngs <<< "$src"
  fi

  if [[ ${#pngs[@]} -lt 1 ]]; then
    echo "pdf_build.sh: no PNGs found in: $src" >&2
    exit 1
  fi
  for f in "${pngs[@]}"; do
    if [[ ! -f "$f" ]]; then
      echo "pdf_build.sh: file not found: $f" >&2
      exit 1
    fi
  done

  mkdir -p "$(dirname "$out_png")"
  # `-label` must precede EACH input file (montage applies settings-so-far to the next file it
  # reads, like `convert`) — a single global `-label '%f'` before the whole file list is silently
  # dropped (tested: identical output bytes regardless of pointsize/label/color when placed first).
  labeled_args=()
  for f in "${pngs[@]}"; do
    labeled_args+=(-label "$(basename "$f")" "$f")
  done
  montage -font "$CAPTION_FONT" -pointsize 24 -fill black \
    "${labeled_args[@]}" \
    -background white -tile "${#pngs[@]}x1" -geometry '300x300+10+10' \
    "$out_png"
  exit 0
fi

if [[ $# -ne 2 ]]; then
  usage
  exit 1
fi

in_html="$1"
out_pdf="$2"

if [[ ! -f "$in_html" ]]; then
  echo "pdf_build.sh: file not found: $in_html" >&2
  exit 1
fi
if [[ ! -x "$CFT_CHROME" ]]; then
  echo "pdf_build.sh: Chrome for Testing not found at: $CFT_CHROME" >&2
  exit 1
fi

mkdir -p "$(dirname "$out_pdf")"
abs_html="$(cd "$(dirname "$in_html")" && pwd)/$(basename "$in_html")"
abs_pdf="$(cd "$(dirname "$out_pdf")" && pwd)/$(basename "$out_pdf")"

"$CFT_CHROME" --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$abs_pdf" --print-to-pdf-no-header \
  "file://${abs_html}" >/dev/null 2>&1

if [[ ! -s "$abs_pdf" ]]; then
  echo "pdf_build.sh: PDF build failed (empty/missing output): $abs_pdf" >&2
  exit 1
fi
