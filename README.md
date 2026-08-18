# portfolio-hub

Static source for the portfolio hosted at `https://sw0l1ylab.com/`.

## Local build

```bash
npm run build
```

That generates `dist/` with:

- the portfolio root site
- placeholder routes under `games/<slug>/`
- future hosted game directories copied from `public-games/<slug>/` when a project is marked `live`

## Auto deploy

Pushes to `main` deploy through GitHub Actions. The workflow expects these repo secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- optional `VPS_PORT`

The workflow syncs `dist/` to:

- `/root/godot-physics-sandbox/deploy/webrtc/portfolio-build/`

## Future hosted games

To host a real game under `/games/<slug>/`:

1. either add a bundled static build under `public-games/<slug>/`
2. or have GitHub Actions check out the game's source repo into `external-games/<slug>/`
3. set that project's `publicStatus` to `live` in `catalog.js`
4. push to `main`

`clicker-game`, `dungeon-v2` and `wobble-wars` use the second path and are pulled from their own GitHub repos during deploy (see the "Check out … source" / "Prepare … for deploy" steps in `.github/workflows/deploy.yml` and `EXTERNAL_GAME_SOURCES` in `scripts/build-site.mjs`).
