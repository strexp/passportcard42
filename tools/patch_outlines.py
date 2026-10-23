#!/usr/bin/env python3
"""
Replace the MRZ, signature and CAN text in a presentation sheet with the
outlined versions produced for print.  This keeps the sheet's editable layer
structure while making the two most font-sensitive elements render correctly
on machines without the OCR-B / Caveat fonts installed.

Usage:
    python3 tools/patch_outlines.py xdn-e-passport-card.svg [more.svg ...]
"""
from __future__ import annotations
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG = "http://www.w3.org/2000/svg"
INK = "http://www.inkscape.org/namespaces/inkscape"
XLINK = "http://www.w3.org/1999/xlink"
NS = {"s": SVG}
ET.register_namespace("", SVG)
ET.register_namespace("inkscape", INK)
ET.register_namespace("xlink", XLINK)

ROOT = Path(__file__).resolve().parents[1]
FRONT_PRINT = ROOT / "print/xdn-e-passport-card-front-print.svg"
BACK_PRINT = ROOT / "print/xdn-e-passport-card-back-print.svg"


def find_by_id(root, id_: str):
    for el in root.iter():
        if el.get("id") == id_:
            return el
    return None


def find_by_aria(root, value: str):
    for el in root.iter():
        if (el.get("aria-label") or "").strip() == value:
            return el
    return None


def find_text(root, value: str):
    for el in root.iter():
        if el.tag.endswith("}text") and "".join(el.itertext()).strip() == value:
            return el
    return None


def main(paths: list[str]) -> int:
    front = ET.parse(FRONT_PRINT).getroot()
    back = ET.parse(BACK_PRINT).getroot()

    mrz_src = find_by_id(back, "mrz-lines")
    sig_src = find_by_id(front, "signature")
    if sig_src is None:
        sig_src = find_by_aria(front, "Yukari Chiba")
    can_src = find_by_id(front, "can-number")
    if can_src is None:
        can_src = find_by_aria(front, "114514")
    if mrz_src is None or sig_src is None:
        print("ERROR: outlined MRZ group or signature not found in print files")
        return 1

    for p in paths:
        path = Path(p)
        tree = ET.parse(path)
        root = tree.getroot()

        mrz_dst = find_by_id(root, "mrz-lines")
        if mrz_dst is not None:
            for child in list(mrz_dst):
                mrz_dst.remove(child)
            for child in list(mrz_src):
                mrz_dst.append(child)
        else:
            print(f"WARN: no mrz-lines in {path}")

        for src, id_, content in ((sig_src, "signature", "Yukari Chiba"), (can_src, "can-number", "114514")):
            if src is None:
                continue
            dst = find_by_id(root, id_)
            if dst is None:
                dst = find_text(root, content)
            if dst is not None:
                for parent in root.iter():
                    for idx, child in enumerate(list(parent)):
                        if child is dst:
                            parent.remove(child)
                            parent.insert(idx, ET.fromstring(ET.tostring(src)))
                            break
                    else:
                        continue
                    break
            else:
                print(f"WARN: no {id_} in {path}")

        tree.write(path, encoding="utf-8", xml_declaration=True)
        print(f"patched {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
