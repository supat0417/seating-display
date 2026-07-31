# seating display

Guest-facing "find your seat" page: type your name, tap the result, and see your table highlighted on the floor plan. No import screen — the seating data is bundled into the app at build time from an export produced by the companion [seating-plan](https://github.com/supat0417/seating-plan) app.

React + TypeScript + Vite, organized as:

- `src/domain/` — pure business logic (floorplan/guest models, theme color math, bundled-data validation, i18n dictionaries). No React/DOM dependency; covered by Vitest.
- `src/data/` — the bundled seating data (`seating-data.json`) and its typed loader.
- `src/ui/` — React components, organized by feature (`hero/`, `search/`, `chips/`, `plan/`).

## Updating the displayed data

Replace `src/data/seating-data.json` with a fresh export from the seating-plan app (its "Export" button produces exactly this shape) and redeploy.

## Development

```bash
npm install
npm run dev      # dev server
npm test         # domain-layer unit tests
npm run build    # production build to dist/
```

Deploys automatically to GitHub Pages on push to `main` (see `.github/workflows/deploy.yml`).
