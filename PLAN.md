# Plan

## Current

_(none)_

## Planned

### Select react-select parity (follow-ups)

Fine-grained react-select API aliases only if apps need them.

## Done

### `januse dev --sync` works in Docker — Done (2026-11-14)

**Goal:** `--sync` replaces its target inside the `janus-check` image, so the docs-based
Playwright tests run against the current `src/janus` instead of the `docs/lib` copied from
the host when the image was built.

**Cause:** the sync moves the old target aside with `rename`. Docker's overlayfs cannot
rename a directory that comes from an image layer and fails with `EXDEV`, so every sync in
the image printed `Sync failed: EXDEV …` and left `docs/lib/.staging-<pid>` behind. (An
earlier note here said the sync never finished; the error line had been cut from the
output.)

**Steps:**
- [x] Test first: `januse-sync-exdev.test.js` makes `renameSync` of the target throw
      `EXDEV`; red with the same message as in the image
- [x] On `EXDEV`, remove the old target instead of moving it aside, then rename the staged
      copy into place

**Done when:** in the image, `januse dev --sync "src/janus:docs/lib/janus"` prints
`Synced` and `docs/lib/janus` matches `src/janus`.

**Validation:** the new test passes on the host. In `janus-check` with the fixed scripts
mounted: the first run takes the `EXDEV` path and syncs, a second run (target now in the
container layer) syncs by rename; both leave `docs/lib` matching `src`. `./check.sh` exit 0:
`tsc` clean, `format --check` 344 files clean, `node --test` 148/148, Playwright 657
passed. `januse lint src` clean. Outside the gate, `scripts/` already had 7 files the
formatter would change (including `createDev.mjs` at HEAD) and 2 lint findings; unchanged.

**Limitations:** on the `EXDEV` path the target is briefly missing between the removal and
the rename, so a request in that moment can 404. Only the first sync in a fresh container
takes that path.

### Fields are border-box — Done (2026-11-14)

**Goal:** A width given to a field includes its padding and border, so `width: 100%` no
longer overflows its container (reported from gold-janus-example: the chat Textarea
overflowed its Panel), without changing how built-in components look.

**Steps:**
- [x] Test first: `field-sizing.spec.js` (Input and Textarea at 240px and 100%); red in all
      three browsers, 22px too wide
- [x] `theme.field` sets `box-sizing: border-box`
- [x] Components that size their own field add its padding and border back (approved
      2026-11-14): Select, DatePicker, DateTimePicker, WeekPicker, MonthPicker,
      DateRangePicker, the calendar year input, CodeEditor, RichTextarea, Textarea
- [x] README and CHANGELOG

**Done when:**
1. An Input or Textarea given a width is exactly that wide.
2. Every element on every docs page keeps its size.

**Decisions:** Keep current sizes by adding padding and border to each component's own
min size (`calc(11rem + 22px)`), rather than accepting smaller components or opting them
out of border-box. Native `<select>` and `<input type="color">` are already border-box in
browsers, so the calendar month select, the TimePicker period select and ColorInput need
nothing.

**Validation:**
- Size of every element on all 24 docs pages, before (HEAD) and after, in Chromium,
  Firefox and WebKit, with `docs/lib` synced by `docs/sync-lib.sh`: Chromium 0 changes;
  Firefox and WebKit only sub-pixel differences on animated icons and spinners. Two
  baseline runs matched exactly. Before the compensation the same comparison showed Select
  16px narrower, date pickers 17–22px narrower and Textarea 14px shorter.
- Calendar year input (popup open) 86px before and after in all three browsers; empty
  Textarea, CodeEditor, RichTextarea, Select and pickers identical before and after.
- `./check.sh` exit 0: `tsc` clean, `format --check` 343 files clean, `node --test`
  147/147, Playwright 657 passed. `januse lint src`: 214 files clean.

**Limitations:** Fields keep their 2px margin, so `width: 100%` sits 2px past the
container's content edge on the right; `calc(100% - 4px)` fits exactly.

### HMR reload waits for the server; register rejects name clashes — Done (2026-11-14)

**Goal:** Fix two problems from the 2026-11-14 gold-janus review: after the dev server
restarts, the page reloads only once it answers again (9.1); `Component.register` throws on
a name already taken by another class and accepts an explicit name, so minified class
names still work (9.3).

**Steps:**
- [x] Tests first: HMR client in `node:test` (vm with fake socket, fetch and timers);
      register behaviour in a Playwright spec
- [x] HMR client polls the page with backoff after the socket closes, then reloads
- [x] `Component.register(Class, name?)`: throws on a clash outside an HMR update; `name` overrides `Class.name`
- [x] README and `index.d.ts` updated
- [x] `./januse` added to `exports.manifest.json` (approved 2026-11-14), so
      `sync-ui-exports.mjs` keeps it and the package test passes; entries without
      `types` are allowed

**Done when:**
1. After the HMR socket closes, the page does not reload while fetching it fails, and
   reloads once a fetch succeeds.
2. Registering a different class under a taken name throws, naming the element, unless an
   HMR update is being applied (then it hot-swaps as before), including on pages the dev
   server serves.
3. Registering the same class twice is still a no-op.
4. `Component.register(Minified, "ExplicitWidget")` defines `janus-explicit-widget` and
   `<ExplicitWidget />` renders it.

**Decisions:**
- Poll with `fetch(location.href)`, backoff 250 ms doubling to 5 s; no attempt limit.
- Name clash is an `Error`, not a console warning, so it cannot go unnoticed.
- The HMR client counts in-flight updates in `globalThis.__JANUSE_HMR_UPDATING__`; only
  registrations during an update hot-swap. `__JANUSE_HMR__` alone is set on every dev page,
  so keying on it would hide clashes during development.

**Validation:** `./check.sh` (unit + browser in Docker).
- `./check.sh`: exit 1. `tsc` clean, `format --check` 342 files clean, `node --test` 147
  tests, 146 pass; the one failure is the pre-existing manifest test below. The gate
  stops there, so its Playwright step did not run.
- Browser tier run separately in the same image (`docker run … janus-check npx playwright
  test`): 645 existing tests pass, so no page in this repo registers two classes under one
  name. The new `register.spec.js` failed in all three browsers on whitespace only (the
  formatter had spread the test templates over several lines); after trimming
  `textContent` it passes 9/9 (3 tests × 3 browsers).
- `januse-hmr-reconnect.test.js`: 3 pass; red before the implementation.
- `januse lint`: 213 files clean.

**Hardening findings:**
- An app that imports the same component from two different URLs (say an import map and a
  direct path) used to get the first class silently; it now throws at startup. Intended,
  but it can surface in apps that worked before.
- The reload poll has no attempt limit: a tab left open on a stopped dev server fetches
  every 5 s until closed. Dev-only; accepted.

**Gate fix (same phase, approved 2026-11-14):** `./januse` was hand-added to
`package.json` `exports` but missing from `exports.manifest.json`, from which
`sync-ui-exports.mjs` generates `exports`; a sync would have dropped it. It is now in the
manifest; the sync script and `package.test.js` accept entries without `types`, and the
expected export count is 95. Running the sync leaves `package.json` byte-for-byte
unchanged.

**Final validation:** `./check.sh` exit 0: `tsc` clean, `format --check` 342 files clean,
`node --test` 147/147, Playwright 651 passed (1.2 min).

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
