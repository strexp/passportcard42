#!/usr/bin/env bash
# Compose the sheet/guides/blueprint from the two read-only masters, outline text for production, and refresh previews.
# The masters are read-only inputs. Requires Inkscape 1.x + OCR-B/Caveat fonts for outlining.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -d buildfonts ]; then export HOME="$PWD/buildfonts"
elif [ -d localhome ]; then export HOME="$PWD/localhome"; fi

# Refuse to overwrite the delivered outlined files with fallback-font output.
if ! fc-match -f '%{family}\n' OCRB 2>/dev/null | grep -qi 'OCRB'; then
  echo "ERROR: OCR-B is not installed. Install OCR-B and Caveat before running export.sh." >&2
  exit 1
fi
if ! fc-match -f '%{family}\n' Caveat 2>/dev/null | grep -qi 'Caveat'; then
  echo "ERROR: Caveat is not installed. Install assets/fonts/Caveat.ttf first." >&2
  exit 1
fi

# The two masters are authoritative and are never written by this script.
test -s xdn-e-passport-card-front.svg
test -s xdn-e-passport-card-back.svg

python3 tools/compose_from_masters.py
python3 tools/verify_card.py
mkdir -p print preview

for side in front back; do
  inkscape "xdn-e-passport-card-${side}.svg" \
    --export-text-to-path --export-plain-svg \
    --export-filename="print/${side}-outlined.svg" >/dev/null 2>&1
done

python3 - <<'PY'
import xml.etree.ElementTree as ET
from pathlib import Path
NS = "{http://www.w3.org/2000/svg}"
for side in ("front", "back"):
    src = Path(f"print/{side}-outlined.svg")
    tree = ET.parse(src)
    root = tree.getroot()
    for parent in root.iter():
        for child in list(parent):
            if child.tag == NS + "g" and child.get("display") == "none":
                parent.remove(child)
            elif child.tag == NS + "text" and not "".join(child.itertext()).strip():
                # Drop empty text nodes from the production SVG.
                parent.remove(child)
    tree.write(f"print/xdn-e-passport-card-{side}-print.svg",
               encoding="utf-8", xml_declaration=True)
PY

# Keep the presentation sheets layered, but replace the font-sensitive
# elements (MRZ + signature + CAN) with the outlined print versions.
python3 tools/patch_outlines.py xdn-e-passport-card.svg xdn-e-passport-card-guides.svg

for side in front back; do
  inkscape "print/xdn-e-passport-card-${side}-print.svg" \
    --export-type=pdf --export-filename="print/xdn-e-passport-card-${side}.pdf" >/dev/null 2>&1
  inkscape "xdn-e-passport-card-${side}.svg" \
    --export-type=png --export-filename="preview/xdn-${side}-600.png" --export-dpi=600 >/dev/null 2>&1
done

inkscape xdn-e-passport-card.svg --export-type=png --export-filename=preview/xdn-sheet-300.png --export-dpi=300 >/dev/null 2>&1
inkscape xdn-e-passport-card-guides.svg --export-type=png --export-filename=preview/xdn-guides-300.png --export-dpi=300 >/dev/null 2>&1
inkscape xdn-e-passport-card-blueprint.svg --export-type=png --export-filename=preview/xdn-blueprint-300.png --export-dpi=300 >/dev/null 2>&1

rm -f print/front-outlined.svg print/back-outlined.svg

echo "Built:"
ls -lh xdn-e-passport-card*.svg print/*.svg print/*.pdf preview/*.png
