# passcard42 webgen

Local-only dn42 passport-card generator. Renders the repository SVG masters in
the browser and exports SVG, PNG or WebP.

## Features

- Editable card fields, portrait with locked 4:5 crop, and text or image signature
- TD1 MRZ generation, import and validation
- SVG, outlined SVG, PNG and WebP export, plus editable front/back SVG templates
- Local-storage autosave; no network requests

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run sync:card-svg
```

`sync:card-svg` refreshes `src/assets/card-*.svg` from the repository masters.

## Docker

Image: `ghcr.io/strexp/passcard42:latest`.

| Variable                   | Default   | Purpose              |
| -------------------------- | --------- | -------------------- |
| `PASSCARD42_FRONTEND_HOST` | `0.0.0.0` | nginx listen address |
| `PASSCARD42_FRONTEND_PORT` | `80`      | nginx listen port    |
