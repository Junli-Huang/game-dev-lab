# Game Dev Lab

[English](README.md) | [简体中文](README.zh-CN.md)

Interactive prototypes exploring game-development techniques, algorithms and visual effects.

The website supports English and Simplified Chinese. New user-visible UI copy should be added to both typed translation resources under `src/i18n/`; simulation and algorithm code must remain language-independent.

Game Dev Lab connects a visible game phenomenon to its core idea, readable implementation and a runnable H5 demo. It is a technology atlas and experiment collection rather than a full game or traditional tutorial site.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` to type-check and create the production site in `dist/`.

## Add a prototype

Create a folder under `src/prototypes/`, implement its metadata and lifecycle, then register it in `src/app/prototype-registry.ts`. See [the prototype guide](docs/prototype-guide.md).

## Daily topics

[Daily Game Dev Topics](docs/daily-game-dev-topics.md) is the source of truth for introduced topics, Prototype progress, selection rules, and the future candidate pool.

## Structure

- `src/app/`: router, shared types and registry
- `src/components/`: reusable site UI
- `src/prototypes/`: self-contained experiments
- `docs/`: architecture and contribution guidance
- `.github/workflows/pages.yml`: automatic GitHub Pages deployment

## GitHub Pages

Pushes to `main` build and deploy automatically to <https://junli-huang.github.io/game-dev-lab/>.
