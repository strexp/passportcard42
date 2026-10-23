#!/usr/bin/env python3
"""
Prepare the borderless portrait plate from assets/demo.png.

The supplied artwork is already background-removed but keeps a white matte in
the anti-aliased edge, which shows as a halo on the card.  This script
un-premultiplies the matte, trims the fringe, and writes a 4:5 RGBA plate.
"""
from __future__ import annotations
import numpy as np
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/demo.png"
DST = ROOT / "assets/portrait-xdn.png"

W, H = 480, 600          # 4:5 plate
CROP_W, CROP_H = 600, 750


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    x0 = (w - CROP_W) // 2
    y0 = 0
    im = im.crop((x0, y0, x0 + CROP_W, y0 + CROP_H)).resize((W, H), Image.LANCZOS)

    arr = np.asarray(im).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0

    # The source was matted against white: c = a*fg + (1-a)*255.
    safe = np.clip(a, 1e-3, 1.0)
    rgb = np.clip((rgb - (1.0 - safe) * 255.0) / safe, 0, 255)

    # Kill the residual noise floor, then re-ramp the soft edge.
    a = np.clip((a * 255.0 - 24.0) / (255.0 - 24.0), 0.0, 1.0) * 255.0
    a[a < 6] = 0

    out = np.concatenate([rgb, a], axis=-1).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(DST, optimize=True)
    print(f"wrote {DST.relative_to(ROOT)}  {W}×{H}  opaque={float((a > 250).mean()):.2%}")


if __name__ == "__main__":
    main()
