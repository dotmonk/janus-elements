# Plan

## Current

_(none)_

## Planned

### Select react-select parity (follow-ups)

Fine-grained react-select API aliases only if apps need them.

## Done

### januse dev uses cwd as document root — Done (2026-11-08)

**Goal:** `januse dev` serves `process.cwd()` (and resolves `--watch` /
`--sync` against it) so the CLI works for this repo’s docs and for apps that
depend on janus-elements.

**Decisions:** Keep `packageRoot` as the install path; add `projectRoot()` =
cwd. Lint/format already collected files from cwd; only `dev` was package-rooted.

**Validation:** `node --test src/tests/januse-dev-root.test.js` — 2 pass
(cwd temp dir marker + package `docs/`). Full `./check.sh` not re-run here
(user taking over).

### Playwright webServer in CI — Done (2026-11-03)

**Goal:** GitHub Actions can start the docs server. Playwright must not
call a bare `januse` bin; `npm ci` does not put the package's own bin on
`PATH`, so the shell exits 127.

**Validation:** `node --test src/tests/package.test.js` passed (5). With a
`PATH` that has no `januse`, bare `januse` exits 127 and
`node bin/januse.mjs dev …` serves `http://127.0.0.1:8000/docs/`.
`./check.sh` was not re-run here.

### Publish januse as npm bin — Done (2026-11-03)

**Goal:** Ship `januse` on the package `bin` field with `bin/` and
`scripts/januse/` in `files`; relative CLI paths use cwd.

**Validation:** `npm pack --dry-run` lists `bin/januse.mjs`; package tests.
