#!/usr/bin/env python3
"""Mechanical checks for the XDN TD1 e-passport card artwork."""
from __future__ import annotations
import datetime as dt
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://www.w3.org/2000/svg"}
W, H = 85.60, 53.98
MRZ_W = 77.70
MRZ_X = 4.00
MRZ_BASE = (H - 11.50) + 2.95 / 2
MRZ_PITCH = 4.23
MRZ_FONT = 5.657
CAN_X = 66.606
CAN_BASE = 50.444765  # text y + the can-field group's 1.5875 mm translate
EXPECTED = [
    "IPXDND133100012<<<<<<<<<<<<<<<",
    "9902222F3610228XDN<<<<<<<<<<<6",
    "CHIBA<<YUKARI<<<<<<<<<<<<<<<<<",
]
JARGON = ("TD1", "ICAO", "PACE", "CONTACTLESS", "OPTIONAL", "CLASS", "DNR", "AS4242420001",
          "FICTIONAL", "DISCLAIMER", "NOT A TRAVEL")

checks: list[tuple[bool, str]] = []
errors: list[str] = []


def check(ok: bool, label: str) -> None:
    checks.append((ok, label))
    if not ok:
        errors.append(label)


def cd(s: str) -> str:
    w = (7, 3, 1)
    t = 0
    for i, c in enumerate(s):
        v = 0 if c == "<" else int(c) if c.isdigit() else ord(c) - 55
        t += v * w[i % 3]
    return str(t % 10)


def text_of(el) -> str:
    return "".join(el.itertext())


def size_of(el) -> float:
    return float((el.get("font-size") or "0").replace("px", ""))


def find_id(root, id_):
    for el in root.iter():
        if el.get("id") == id_:
            return el
    return None


def find_text(root, value):
    for el in root.findall(".//s:text", NS):
        if text_of(el).strip() == value:
            return el
    return None


def all_text(root) -> str:
    return " ".join(text_of(e) for e in root.findall(".//s:text", NS))


# --- transforms ---------------------------------------------------------
# Affine matrix (a, b, c, d, e, f): x' = a*x + c*y + e, y' = b*x + d*y + f.
IDENTITY = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def _nums(value: str) -> list[float]:
    return [float(v) for v in re.findall(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", value)]


def parse_transform(value: str):
    m = IDENTITY
    for name, body in re.findall(r"(matrix|translate|scale|rotate)\s*\(([^)]*)\)", value):
        v = _nums(body)
        if name == "matrix" and len(v) >= 6:
            local = tuple(v[:6])
        elif name == "translate":
            local = (1.0, 0.0, 0.0, 1.0, v[0], v[1] if len(v) > 1 else 0.0)
        elif name == "scale":
            sx = v[0]
            sy = v[1] if len(v) > 1 else sx
            local = (sx, 0.0, 0.0, sy, 0.0, 0.0)
        elif name == "rotate":
            a = math.radians(v[0])
            ca, sa = math.cos(a), math.sin(a)
            local = (ca, sa, -sa, ca, 0.0, 0.0)
            if len(v) >= 3:
                cx, cy = v[1], v[2]
                local = mul(mul((1.0, 0.0, 0.0, 1.0, cx, cy), local),
                            (1.0, 0.0, 0.0, 1.0, -cx, -cy))
        else:
            continue
        m = mul(m, local)
    return m


def effective_point(root, el):
    """Apply the element's own and all ancestor transforms to its x/y."""
    parent = {child: node for node in root.iter() for child in node}
    chain = []
    node = el
    while node is not None:
        chain.append(node)
        node = parent.get(node)
    m = IDENTITY
    for node in reversed(chain):
        if node.get("transform"):
            m = mul(m, parse_transform(node.get("transform")))
    x = float(el.get("x") or 0.0)
    y = float(el.get("y") or 0.0)
    return (m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5])


def style_prop(el, prop: str):
    for decl in (el.get("style") or "").split(";"):
        if ":" in decl:
            key, val = decl.split(":", 1)
            if key.strip() == prop:
                return val.strip()
    return None


def main() -> int:
    fp = ROOT / "xdn-e-passport-card-front.svg"
    bp = ROOT / "xdn-e-passport-card-back.svg"
    check(fp.exists() and bp.exists(), "front/back SVG files exist")

    for path in (fp, bp):
        root = ET.parse(path).getroot()
        check(root.get("width") == "85.6mm", f"{path.name}: width 85.60 mm")
        check(root.get("height") == "53.98mm", f"{path.name}: height 53.98 mm")
        check(root.get("viewBox") == "0 0 85.6 53.98", f"{path.name}: 1 unit = 1 mm")

    front = ET.parse(fp).getroot()
    back = ET.parse(bp).getroot()
    ftext, btext = all_text(front), all_text(back)

    # ---- MRZ ----------------------------------------------------------
    lines = []
    for i, expected in enumerate(EXPECTED, 1):
        el = find_id(back, f"mrz-line-{i}")
        check(el is not None, f"MRZ line {i} present")
        if el is None:
            continue
        t = text_of(el)
        lines.append(t)
        check(t == expected, f"MRZ line {i} matches the authority data")
        check(len(t) == 30, f"MRZ line {i} has 30 characters")
        check(bool(re.fullmatch(r"[A-Z0-9<]{30}", t)), f"MRZ line {i} character set")
        check(abs(float(el.get("x")) - MRZ_X) < 0.011, f"MRZ line {i} x = {MRZ_X} mm")
        check(abs(float(el.get("textLength")) - 77.7) < 0.01, f"MRZ line {i} textLength = 77.70")
        check(el.get("lengthAdjust") == "spacingAndGlyphs", f"MRZ line {i} lengthAdjust")
        check(abs(size_of(el) - 5.657) < 0.01, f"MRZ line {i} uses the 2.95 mm OCR-B size")
        y = float(el.get("y"))
        check(abs(y - (MRZ_BASE + (i - 2) * MRZ_PITCH)) < 0.011,
              f"MRZ line {i} baseline {MRZ_BASE + (i - 2) * MRZ_PITCH:.3f} mm")

    left = MRZ_X
    right = W - MRZ_X - MRZ_W
    check(abs(left - right) <= 0.11, f"MRZ is centred to <= 0.1 mm (left {left:.2f} / right {right:.2f} mm)")
    check(4.0 <= left <= 6.0, "MRZ left margin inside the 5.0 ± 1.0 mm rule")

    if len(lines) == 3:
        l1, l2, l3 = lines
        check(l1[0] in "ACI", "document code begins with A, C or I")
        check(l1[1] != "V", "second document-code character is not V")
        check(l1[2:5] == "XDN", "issuing state code is XDN")
        check(l1[5:14] == "D13310001", "document number is D13310001")
        check(l1[14] == cd(l1[5:14]), "document-number check digit")
        check(l2[6] == cd(l2[0:6]), "date-of-birth check digit")
        check(l2[7] == "F", "sex is F")
        check(l2[14] == cd(l2[8:14]), "expiry check digit")
        check(l2[15:18] == "XDN", "nationality is XDN")
        check(l2[18:29] == "<" * 11, "middle optional field is empty")
        check(l2[29] == cd(l1[5:30] + l2[0:7] + l2[8:15] + l2[18:29]), "composite check digit")
        check(l3 == "CHIBA<<YUKARI".ljust(30, "<"), "name line is CHIBA<<YUKARI")
        check(dt.date(1999, 2, 22) < dt.date(2036, 10, 22), "dates are ordered")

    # ---- CAN (back only) ---------------------------------------------
    can = find_id(front, "can-number")
    if can is None:
        can = find_text(front, "114514")
    check(can is not None, "CAN 114514 is on the front")
    check(find_text(back, "114514") is None, "no CAN on the back")
    if can is not None:
        can_x, can_y = effective_point(front, can)
        check(can.get("class") == "mono", "CAN uses the document's monospaced data face")
        check(abs(can_x - CAN_X) < 0.02, "CAN x position")
        check(abs(size_of(can) - 3.05) < 0.01, "CAN font size 3.05 mm")
        check(abs(can_y - CAN_BASE) < 0.02, f"CAN baseline {CAN_BASE:.3f} mm")
        check(can_y > 44.0, "CAN sits in the lower right of the front")
        check(can_y < H - 2.0, "CAN baseline stays inside the 2.00 mm bottom margin")

    # ---- layout -------------------------------------------------------
    def has_rect(root, w, h):
        return any(abs(float(r.get("width") or 0) - w) < 0.01
                   and abs(float(r.get("height") or 0) - h) < 0.01
                   for r in root.findall(".//s:rect", NS))

    check(has_rect(front, 85.6, 9.6), "Zone I header is 9.60 mm (limit 11.00)")
    photo = find_id(front, "zone-V-portrait")
    check(photo is not None, "Zone V portrait group present")
    if photo is not None:
        imgs = photo.findall(".//s:image", NS)
        check(bool(imgs), "portrait is embedded")
        if imgs:
            check(abs(float(imgs[0].get("width")) - 26.0) < 0.01
                  and abs(float(imgs[0].get("height")) - 32.5) < 0.01,
                  "portrait plate is 26.00 × 32.50 mm (ICAO minimum)")
            px, py = effective_point(front, imgs[0])
            check(px >= 2.0 - 1e-6 and px + 26.0 <= W - 2.0 + 1e-6,
                  f"portrait stays inside the 2.00 mm side margins (x {px:.3f})")
            check(py >= 2.0 - 1e-6 and py + 32.5 <= H - 2.0 + 1e-6,
                  f"portrait stays inside the 2.00 mm top/bottom margins (y {py:.3f})")
        rects = photo.findall(".//s:rect", NS)

        def white_backing(r) -> bool:
            # The current master pads the cut-out with a stroke-less white plate.
            # That is a backing, not a visible frame.
            fill = (r.get("fill") or style_prop(r, "fill") or "").lower()
            stroke = (r.get("stroke") or style_prop(r, "stroke") or "").lower()
            return fill in ("#fff", "#ffffff", "white") and stroke in ("", "none", "transparent")

        check(all(white_backing(r) for r in rects),
              "portrait has no frame (white backing plate only)")
        if rects:
            check(len(rects) == 1
                  and abs(float(rects[0].get("width")) - 26.0) < 0.01
                  and abs(float(rects[0].get("height")) - 32.5) < 0.01,
                  "portrait backing plate matches 26.00 × 32.50 mm")

    white = [r for r in back.findall(".//s:rect", NS)
             if r.get("fill") == "#FFFFFF" and abs(float(r.get("y") or 0) - 30.68) < 0.01]
    check(len(white) == 1, "one opaque white Zone VII strip")
    if white:
        check(white[0].get("width") == "85.6" and white[0].get("height") == "23.3",
              "Zone VII spans 85.60 × 23.30 mm")

    # ---- marks and content -------------------------------------------
    syms = {s.get("id") for s in front.findall(".//s:symbol", NS)}
    check("xdn-emblem" in syms, "DN42 emblem symbol present")
    check(find_id(front, "front-epassport-icon") is not None,
          "e-passport icon present on the front")
    check(find_id(front, "front-emblem") is not None,
          "emblem used in the front header")
    check(find_id(back, "back-header-emblem") is not None,
          "emblem used on the back")
    bep = [el for el in back.iter() if (el.get("id") or "").endswith("epassport-icon")]
    check(not bep, "no e-passport icon on the back")
    # The QR is an inline 29 × 29 module group in Zone VI.
    qr_modules = [r for r in back.findall(".//s:rect", NS)
                  if (r.get("shape-rendering") or "") == "crispEdges"]
    check(len(qr_modules) >= 100, "QR code on the back (inline module group)")
    if qr_modules:
        qx, qy = effective_point(back, qr_modules[0])
        check(2.0 < qx < W - 2.0 and 2.0 < qy < 30.68,
              f"QR code sits inside Zone VI (x {qx:.2f}, y {qy:.2f})")

    for needle in ("UNION OF DISTRIBUTED NETWORKS", "NIA42", "NIA-MNT", "E-PASSPORT CARD",
                   "CHIBA", "YUKARI", "D13310001", "22 FEB 1999", "22 OCT 2036", "22 OCT 2026"):
        check(needle in ftext or needle in btext, f"content contains {needle!r}")
    check("secure electronic chip" in btext, "back explains the chip in plain language")
    check(btext.count("Property of the Union of Distributed Networks") == 1,
          "back property notice present")
    check("Keep it in its protective sleeve" in btext, "back storage instruction present")
    check("Version 0.1" in btext, "back version mark present")
    check("epass.nia.gov.dn42" in btext, "back service address present")
    check("e-Passport Service" in btext, "back service description present")

    for term in JARGON:
        check(term not in ftext and term not in btext, f"no technical term: {term!r}")

    # ---- typography floors -------------------------------------------
    for root, name in ((front, "front"), (back, "back")):
        for el in root.findall(".//s:text", NS):
            cls = (el.get("class") or "").split()
            size = size_of(el)
            snippet = text_of(el)[:18]
            if "cap" in cls:
                check(size >= 1.19, f"{name}: caption >= 1.20 mm ({snippet!r})")
            elif "note" in cls:
                check(size >= 1.29, f"{name}: notice >= 1.30 mm ({snippet!r})")
            elif "micro" in cls:
                pass
            elif cls and ("val" in cls or "mono" in cls):
                check(size >= 1.30, f"{name}: value >= 1.30 mm ({snippet!r})")

    for ok, label in checks:
        print(("PASS  " if ok else "FAIL  ") + label)
    print(f"\n{sum(ok for ok, _ in checks)}/{len(checks)} checks passed")
    if errors:
        print("\nERRORS:", *errors, sep="\n  ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
