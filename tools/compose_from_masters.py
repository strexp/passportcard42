#!/usr/bin/env python3
"""
Compose the presentation sheet, zone-guide sheet and technical blueprint from
the two manually maintained masters:

    xdn-e-passport-card-front.svg
    xdn-e-passport-card-back.svg

The masters are read-only inputs.  This script never writes them.
"""
from __future__ import annotations
import copy
import math
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = "http://www.w3.org/2000/svg"
INK = "http://www.inkscape.org/namespaces/inkscape"
SODI = "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
XLINK = "http://www.w3.org/1999/xlink"
W, H = 85.60, 53.98
R = 3.18

ET.register_namespace("", SVG)
ET.register_namespace("inkscape", INK)
ET.register_namespace("sodipodi", SODI)
ET.register_namespace("xlink", XLINK)


def q(tag: str) -> str:
    return f"{{{SVG}}}{tag}"


def load(path: Path):
    root = ET.parse(path).getroot()
    defs = root.find(q("defs"))
    card = None
    for el in list(root):
        if el.tag == q("g") and (el.get("data-side") in ("front", "back")):
            card = el
            break
    if defs is None or card is None:
        raise SystemExit(f"could not locate defs/card group in {path}")
    return root, defs, card


def prefix_defs(defs, card, prefix: str):
    """Prefix IDs in a defs tree and rewrite refs in defs + card."""
    mapping = {}
    for el in defs.iter():
        old = el.get("id")
        if old:
            mapping[old] = prefix + old
            el.set("id", mapping[old])
    for el in list(defs.iter()) + list(card.iter()):
        for key, val in list(el.attrib.items()):
            if not isinstance(val, str) or "#" not in val:
                continue
            new = val
            for old, repl in mapping.items():
                new = new.replace("#" + old, "#" + repl)
            if new != val:
                el.set(key, new)
    return mapping


def clone_visible(card, guide_id: str | None = None):
    """Deep-copy a card and, optionally, reveal one guide layer."""
    c = copy.deepcopy(card)
    for el in c.iter():
        if guide_id and el.get("id") == guide_id:
            el.attrib.pop("display", None)
    return c


def sheet(front_defs, back_defs, front_card, back_card, guide: bool):
    sw, sh = 199.2, 88.0
    bg = "#EFEDE9" if guide else "#1B1B1A"
    title_fill = "#232322" if guide else "#F4F3F0"
    sub_fill = "#6E6D6B" if guide else "#9D9D9C"
    card_y = 20.5 if guide else 19.0

    root = ET.Element(q("svg"), {
        "width": f"{sw}mm", "height": f"{sh}mm", "viewBox": f"0 0 {sw} {sh}",
        "version": "1.1",
    })
    ET.SubElement(root, q("title")).text = "XDN e-passport card — presentation sheet"
    ET.SubElement(root, q("desc")).text = "Front and back of the XDN TD1 e-passport card at 1:1, composed from the two masters."

    defs = ET.SubElement(root, q("defs"))
    for child in list(front_defs):
        defs.append(copy.deepcopy(child))
    for child in list(back_defs):
        defs.append(copy.deepcopy(child))
    shadow = ET.SubElement(defs, q("filter"), {
        "id": "sheetShadow", "x": "-20%", "y": "-20%", "width": "140%", "height": "140%"
    })
    ET.SubElement(shadow, q("feDropShadow"), {
        "dx": "0", "dy": "0.7", "stdDeviation": "0.95", "flood-color": "#000000", "flood-opacity": "0.35"
    })

    def text(x, y, s, size, fill, weight="500", anchor="start", spacing="0.02"):
        t = ET.SubElement(root, q("text"), {
            "x": f"{x:.3f}", "y": f"{y:.3f}",
            "font-family": "'Noto Sans','Helvetica Neue',Arial,sans-serif",
            "font-size": f"{size:.3f}", "font-weight": weight, "fill": fill,
            "text-anchor": anchor, "letter-spacing": f"{float(spacing):.3f}",
        })
        t.text = s
        return t

    ET.SubElement(root, q("rect"), {"x": "0", "y": "0", "width": f"{sw}", "height": f"{sh}", "fill": bg})
    text(8.0, 6.15, "UNION OF DISTRIBUTED NETWORKS · NIA42", 1.02, sub_fill, "600", spacing="0.32")
    text(8.0, 13.05, "E-PASSPORT CARD", 5.00, title_fill, "700")
    text(8.0, 16.55, "ICAO DOC 9303-5 · TD1 / ID-1 · 85.60 × 53.98 MM · FRONT + BACK", 0.96, sub_fill, "500", spacing="0.10")

    if not guide:
        badge = ET.SubElement(root, q("g"), {"id": "sheet-badge"})
        ET.SubElement(badge, q("rect"), {
            "x": "150.0", "y": "10.10", "width": "41.2", "height": "4.10", "rx": "2.05",
            "fill": "none", "stroke": "#9D9D9C", "stroke-opacity": "0.45", "stroke-width": "0.11",
        })
        t = ET.SubElement(badge, q("text"), {
            "x": "170.6", "y": "12.78", "text-anchor": "middle",
            "font-family": "'Noto Sans',sans-serif", "font-size": "0.90",
            "font-weight": "600", "fill": "#9D9D9C", "letter-spacing": "0.12",
        })
        t.text = "XDN · NIA42 · REV 0.1"

    for i, xpos in enumerate((8.0, 105.6)):
        ET.SubElement(root, q("rect"), {
            "x": f"{xpos + 0.15:.2f}", "y": f"{card_y + 0.15:.2f}",
            "width": f"{W}", "height": f"{H}", "rx": f"{R}",
            "fill": "#000000", "opacity": "0.16" if guide else "0.50",
            "filter": "url(#sheetShadow)",
        })

    for xpos, src, gid in (
        (8.0, front_card, "front-zone-guides"),
        (105.6, back_card, "back-zone-guides"),
    ):
        g = ET.SubElement(root, q("g"), {"transform": f"translate({xpos} {card_y})"})
        cloned = clone_visible(src, gid if guide else None)
        if guide:
            for layer in cloned.iter():
                if layer.get("id") == gid:
                    for grp in layer.iter():
                        if grp.tag == q("g") and (grp.get("stroke") or "").lower() == "#d93a1e":
                            # Outline the CAN field exactly as it sits in the front master
                            # (white feathered field, baseline 50.44 mm).
                            ET.SubElement(grp, q("rect"), {
                                "x": "65.55", "y": "43.766", "width": "18.05", "height": "8.214",
                            })
                    break
        g.append(cloned)

    text(8.0, card_y + H + 5.6, "FRONT / RECTO", 1.18, title_fill, "700", spacing="0.22")
    text(8.0, card_y + H + 8.0, "ZONES I–V · VISUAL INSPECTION ZONE", 0.82, sub_fill, "500", spacing="0.10")
    text(105.6, card_y + H + 5.6, "BACK / VERSO", 1.18, title_fill, "700", spacing="0.22")
    text(105.6, card_y + H + 8.0, "ZONES VI–VII · NOTICE / QR / MRZ", 0.82, sub_fill, "500", spacing="0.10")

    if guide:
        legend = ET.SubElement(root, q("g"), {"id": "sheet-legend"})
        def line(x1, x2, y, color, dash):
            ET.SubElement(legend, q("path"), {
                "d": f"M{x1} {y} H{x2}", "stroke": color, "stroke-width": "0.18", "stroke-dasharray": dash,
            })
        def lab(x, y, s):
            t = ET.SubElement(legend, q("text"), {
                "x": f"{x}", "y": f"{y}", "font-family": "'Noto Sans',sans-serif",
                "font-size": "0.92", "fill": sub_fill,
            })
            t.text = s
        line(8, 18, 83.3, "#D93A1E", "0.9 0.55"); lab(19.4, 83.55, "Zone boundary (not printed)")
        line(62, 72, 83.3, "#1E64C8", "0.5 0.5"); lab(73.4, 83.55, "2.00 mm clear margin")
        line(116, 126, 83.3, "#C2185B", "0.55 0.45"); lab(127.4, 83.55, "MRZ reference centre line")
        lab(8.0, 86.1, "ZONES  I HEADER · II NAME/DATA · III ISSUE/EXPIRY/AUTHORITY · IV SIGNATURE/CAN · V PORTRAIT 26 × 32.5 · VI NOTICE/QR · VII MRZ")

    return root


def blueprint(front_card, back_card, front_guides, back_guides):
    sw, sh = 199.2, 116.0
    root = ET.Element(q("svg"), {
        "width": f"{sw}mm", "height": f"{sh}mm", "viewBox": f"0 0 {sw} {sh}", "version": "1.1",
    })
    ET.SubElement(root, q("title")).text = "XDN e-passport card — TD1 zone blueprint"
    ET.SubElement(root, q("desc")).text = "1:1 technical blueprint derived from the zone guides in the two masters."

    defs = ET.SubElement(root, q("defs"))
    pat = ET.SubElement(defs, q("pattern"), {
        "id": "bp-grid", "width": "5", "height": "5", "patternUnits": "userSpaceOnUse",
    })
    ET.SubElement(pat, q("path"), {
        "d": "M5 0 V5 M0 5 H5", "fill": "none", "stroke": "#232322",
        "stroke-opacity": "0.035", "stroke-width": "0.05",
    })

    def txt(x, y, s, size=0.90, fill="#2B2B2A", weight="500", anchor="start", family="'Noto Sans',sans-serif", spacing="0.0"):
        t = ET.SubElement(root, q("text"), {
            "x": f"{x:.3f}", "y": f"{y:.3f}", "font-family": family,
            "font-size": f"{size:.3f}", "font-weight": weight, "fill": fill,
            "text-anchor": anchor, "letter-spacing": f"{float(spacing):.3f}",
        })
        t.text = s
        return t

    def dim_h(x1, x2, y, label, color="#2B2B2A"):
        mid = (x1 + x2) / 2
        g = ET.SubElement(root, q("g"), {"stroke": color, "stroke-width": "0.09"})
        ET.SubElement(g, q("path"), {"d": f"M{x1} {y-0.7} V{y+0.7} M{x2} {y-0.7} V{y+0.7} M{x1} {y} H{x2}"})
        txt(mid, y - 0.5, label, 0.68, color, "600", "middle", "'Noto Sans Mono',monospace")

    def dim_v(y1, y2, x, label, color="#2B2B2A"):
        mid = (y1 + y2) / 2
        g = ET.SubElement(root, q("g"), {"stroke": color, "stroke-width": "0.09"})
        ET.SubElement(g, q("path"), {"d": f"M{x-0.7} {y1} H{x+0.7} M{x-0.7} {y2} H{x+0.7} M{x} {y1} V{y2}"})
        t = ET.SubElement(root, q("text"), {
            "x": f"{x-0.26:.3f}", "y": f"{mid:.3f}", "font-family": "'Noto Sans Mono',monospace",
            "font-size": "0.68", "font-weight": "600", "fill": color, "text-anchor": "middle",
            "transform": f"rotate(-90 {x-0.26:.3f} {mid:.3f})",
        })
        t.text = label

    ET.SubElement(root, q("rect"), {"x": "0", "y": "0", "width": f"{sw}", "height": f"{sh}", "fill": "#FBFAF8"})
    ET.SubElement(root, q("rect"), {"x": "0", "y": "0", "width": f"{sw}", "height": f"{sh}", "fill": "url(#bp-grid)"})
    txt(8, 6.9, "UNION OF DISTRIBUTED NETWORKS · DOC 9303-5 / TD1", 0.98, "#6E6D6B", "600", spacing="0.30")
    txt(8, 13.4, "TD1 ZONE BLUEPRINT", 4.2, "#232322", "700")
    txt(8, 17.1, "ALL DIMENSIONS IN MILLIMETRES · SCALE 1:1 · TRIM 85.60 × 53.98 · CORNER RADIUS 3.18", 0.88, "#6E6D6B")

    for x, card, guides in ((8.0, front_card, front_guides), (105.6, back_card, back_guides)):
        g = ET.SubElement(root, q("g"), {"transform": f"translate({x} 25)"})
        ET.SubElement(g, q("rect"), {
            "x": "0", "y": "0", "width": f"{W}", "height": f"{H}", "rx": f"{R}",
            "fill": "#FFFFFF", "stroke": "#232322", "stroke-width": "0.18",
        })
        ET.SubElement(g, q("rect"), {
            "x": "2.00", "y": "2.00", "width": f"{W-4:.2f}", "height": f"{H-4:.2f}",
            "fill": "none", "stroke": "#1E64C8", "stroke-width": "0.07", "stroke-dasharray": "0.42 0.42",
        })
        gg = copy.deepcopy(guides)
        gg.attrib.pop("display", None)
        g.append(gg)

    dim_h(8.0, 93.6, 20.8, "85.60")
    dim_v(25.0, 78.98, 4.8, "53.98")
    dim_h(105.6, 191.2, 20.8, "85.60")
    dim_v(25.0, 78.98, 102.4, "53.98")
    dim_v(25.0, 34.6, 96.6, "9.60", "#D93A1E")
    txt(10.8, 39.2, "13 PORTRAIT 26.00 × 32.50 · WHITE PLATE, NO FRAME", 0.64, "#D93A1E")
    dim_h(109.6, 187.3, 80.6, "77.70 (PRINTING WIDTH)", "#D93A1E")
    dim_v(55.68, 78.98, 194.0, "23.30", "#D93A1E")
    dim_v(25.0, 55.68, 194.0, "30.68", "#D93A1E")
    for label, lx, ly in (
        ("I", 94.8, 30.0), ("II", 94.8, 38.0), ("III", 94.8, 60.0), ("IV", 94.8, 74.0),
        ("V", 10.5, 50.0), ("VI", 192.0, 30.0), ("VII", 192.0, 60.0),
    ):
        txt(lx, ly, label, 0.95, "#D93A1E", "700")
    txt(8, 84.0, "NOTES", 0.90, "#232322", "700")
    notes = [
        "1 · Zone boundaries are construction guides and are not printed on the card (Doc 9303-5, 3.3).",
        "2 · Master files are authoritative: xdn-e-passport-card-front.svg / -back.svg. Do not overwrite them.",
        "3 · Zone I header 9.60 mm (limit 11.00 mm); all data stays 2.00 mm inside the trim.",
        "4 · Zone V portrait is 26.00 × 32.50 mm on a feathered white plate, with no frame or outline.",
        "5 · Zone VII: 3 × 30 OCR-B, 77.70 mm at x = 4.00 mm, pitch 4.23 mm, zone height 23.30 mm.",
        "6 · CAN 114514 is on the front lower right (baseline 50.44 mm); it is not repeated on the back.",
        "7 · Red dashed = zone boundary; blue dashed = 2.00 mm margin. Dimensions are in millimetres.",
    ]
    for i, n in enumerate(notes):
        txt(8, 87.3 + i * 2.4, n, 0.90, "#2B2B2A")
    txt(8, 107.8, "Union of Distributed Networks · NIA42 · NIA-MNT · ISO/IEC 7810 ID-1 · ICAO Doc 9303-5 TD1", 0.76, "#6E6D6B")
    txt(191.2, 107.8, "2026 · REV 0.1 · COMPOSED FROM MASTERS", 0.76, "#6E6D6B", "500", "end")
    return root


KEEP_WS = {q("text"), q("tspan"), q("textPath"), q("style")}


def indent_preserving_text(el, level=0, space="  "):
    """Indent the tree without touching whitespace inside text/tspan elements.

    ElementTree.indent() inserts newlines and spaces around child elements.
    Inside <text xml:space="preserve"> those characters become rendered text,
    which reflows multi-line notices.  Skip text containers entirely.
    """
    if el.tag in KEEP_WS:
        return
    if len(el):
        if not el.text or not el.text.strip():
            el.text = "\n" + (level + 1) * space
        for child in el:
            indent_preserving_text(child, level + 1, space)
            if not child.tail or not child.tail.strip():
                child.tail = "\n" + level * space
    if level and (not el.tail or not el.tail.strip()):
        el.tail = "\n" + level * space


def write(root, path):
    indent_preserving_text(root)
    ET.ElementTree(root).write(path, encoding="utf-8", xml_declaration=True)
    print("wrote", path.relative_to(ROOT))


def main():
    front_root, front_defs, front_card = load(ROOT / "xdn-e-passport-card-front.svg")
    back_root, back_defs, back_card = load(ROOT / "xdn-e-passport-card-back.svg")

    # Prefix all back defs IDs and refs, so both cards can live in one SVG.
    prefix_defs(back_defs, back_card, "b-")

    front_guides = next(e for e in front_card.iter() if e.get("id") == "front-zone-guides")
    back_guides = next(e for e in back_card.iter() if e.get("id") == "back-zone-guides")

    for guide, name in ((False, "xdn-e-passport-card.svg"), (True, "xdn-e-passport-card-guides.svg")):
        root = sheet(front_defs, back_defs, front_card, back_card, guide)
        write(root, ROOT / name)

    root = blueprint(front_card, back_card, front_guides, back_guides)
    write(root, ROOT / "xdn-e-passport-card-blueprint.svg")


if __name__ == "__main__":
    main()
