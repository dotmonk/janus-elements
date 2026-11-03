# Plan

## Current

_(none)_

## Planned

### Select react-select parity (follow-ups)

Fine-grained react-select API aliases only if apps need them.

## Done

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
