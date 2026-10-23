#!/usr/bin/env python3
"""Package the built frontend and every tracked SVG for CI and releases.

Layout produced under ``--output``::

    staging/
      frontend/              Vite production build + BUILD-INFO.txt
      svg/                   all tracked *.svg, repository-relative paths
    release/
      passcard42-web.zip
      passcard42-svg.zip
      SHA256SUMS

The frontend and SVG staging directories are uploaded as separate CI artifacts.
The release directory is attached to the draft GitHub release and to release
workflow artifacts.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import NoReturn

REPO_ROOT = Path(__file__).resolve().parents[2]
WEBGEN_ROOT = REPO_ROOT / "webgen"
WEB_DIST = WEBGEN_ROOT / "dist"

WEB_ARCHIVE = "passcard42-web.zip"
SVG_ARCHIVE = "passcard42-svg.zip"


def fail(message: str) -> NoReturn:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def tracked_svgs() -> list[Path]:
    """Return repository-relative paths of every tracked SVG."""
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "ls-files", "-z", "--", "*.svg"],
        check=True,
        capture_output=True,
    )
    paths = [Path(item) for item in result.stdout.decode("utf-8").split("\0") if item]
    return sorted(paths, key=lambda path: path.as_posix())


def zip_tree(source: Path, destination: Path) -> None:
    """Zip a directory tree, storing paths relative to ``source``."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(source.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(source).as_posix())


def write_checksums(release_dir: Path, archives: list[Path]) -> Path:
    checksums = release_dir / "SHA256SUMS"
    lines = []
    for archive in archives:
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        lines.append(f"{digest}  {archive.name}\n")
    checksums.write_text("".join(lines), encoding="utf-8")
    return checksums


def build_info() -> str:
    lines = [
        f"commit={os.environ.get('GITHUB_SHA', 'local')}",
        f"ref={os.environ.get('GITHUB_REF_NAME', 'local')}",
        f"run_id={os.environ.get('GITHUB_RUN_ID', 'local')}",
        f"built_at={datetime.now(timezone.utc).isoformat(timespec='seconds')}",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="artifacts",
        help="output directory for staging/ and release/ (default: artifacts)",
    )
    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    staging_dir = output_dir / "staging"
    release_dir = output_dir / "release"
    frontend_stage = staging_dir / "frontend"
    svg_stage = staging_dir / "svg"

    if not (WEB_DIST / "index.html").is_file():
        fail(
            f"{WEB_DIST.relative_to(REPO_ROOT)}/index.html is missing; "
            "run 'npm run build' in webgen first"
        )

    svg_files = tracked_svgs()
    if not svg_files:
        fail("no tracked SVG files found")

    reset_dir(output_dir)
    frontend_stage.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(WEB_DIST, frontend_stage)
    svg_stage.mkdir(parents=True)

    for relative_path in svg_files:
        source = REPO_ROOT / relative_path
        if not source.is_file():
            fail(f"tracked SVG is missing from the checkout: {relative_path}")
        destination = svg_stage / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    (frontend_stage / "BUILD-INFO.txt").write_text(build_info(), encoding="utf-8")

    web_archive = release_dir / WEB_ARCHIVE
    svg_archive = release_dir / SVG_ARCHIVE
    zip_tree(frontend_stage, web_archive)
    zip_tree(svg_stage, svg_archive)
    checksums = write_checksums(release_dir, [web_archive, svg_archive])

    print(f"frontend: {frontend_stage}")
    print(f"svg:      {svg_stage} ({len(svg_files)} files)")
    for path in (web_archive, svg_archive, checksums):
        print(f"release:  {path} ({path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
