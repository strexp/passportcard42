# passcard42 / dn42 e-Passport Card

A TD1 electronic passport card for dn42 (the Union of Distributed Networks / XDN), issued by NIA.gov.dn42. The artwork follows ICAO Doc 9303 Part 5 (TD1 / ID-1) and carries a six-digit CAN, a three-line MRZ, a contactless chip symbol and a service QR code on the back.

> `xdn-e-passport-card-front.svg` and `xdn-e-passport-card-back.svg` are the only source files. Edit them rather than any generated file.

## Files

| Path | Contents |
|---|---|
| `xdn-e-passport-card-front.svg`, `xdn-e-passport-card-back.svg` | Front and back masters, 85.60 × 53.98 mm, with editable text |
| `xdn-e-passport-card.svg` | Combined front + back sheet at 1:1 |
| `xdn-e-passport-card-guides.svg` | Layout guides: zones, margins and MRZ baselines |
| `xdn-e-passport-card-blueprint.svg` | 1:1 technical blueprint |
| `print/` | Production SVGs with all text outlined, plus 1:1 PDF proofs |
| `preview/` | PNG previews of the individual sides and the combined sheet |
| `tools/` | Compose, verify, outline and export scripts |
| `assets/` | DN42 logo, e-Passport symbol, portrait and signature font |
| `webgen/` | Browser-based card generator (see below) |

`print/`, `preview/` and build artifacts are generated and not tracked.

## Printing

| Item | Requirement |
|---|---|
| Finished size | 85.60 × 53.98 mm, 3.18 mm corner radius, 2.00 mm safe margin |
| Thickness | 0.25–1.25 mm, with at most 0.1 mm variation across the MRZ |
| Material | PVC / PC / PET composite or an ISO/IEC 7810 ID-1 equivalent |
| Surface | Matte, or scratch-resistant matte UV varnish |
| MRZ | Black OCR-B on plain white; no texture, foil or spot UV |
| Colour | Masters are RGB; convert to CMYK before printing, preferably single black for body text and MRZ |
| Proofing | Output `print/*.pdf` at 1:1, without fit-to-page scaling |

The portrait resolves to roughly 460 dpi at 26 mm wide. The feathered white backings behind the portrait and CAN are soft RGB effects; check a proof after CMYK conversion, and switch to solid white blocks if the printer cannot reproduce them reliably.

## Building and verification

```bash
python3 tools/verify_card.py   # validate masters and generated artwork
./tools/export.sh              # compose → verify → outline → PDF / PNG
```

`export.sh` requires **Inkscape 1.x**, **OCR-B** and **Caveat**; it refuses to overwrite the delivered files when a font is missing. The outlined production files under `print/` are ready to output and do not need rebuilding.

## Web card generator

[`webgen/`](webgen/README.md) is a pure front-end TD1 generator. It reuses the two masters as artwork and patches only their text and portrait nodes at runtime.

## LICENSE

AGPL-3.0
