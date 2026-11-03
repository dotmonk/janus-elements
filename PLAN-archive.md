# Plan archive

Oldest `## Done` entries moved from `PLAN.md`, newest first.

### Docs freshness pass — Done (2026-11-03)

**Goal:** Align README, About, Helpers, and kit docs with unpublished npm
status and the public APIs (Select loading, readOnly, highlight/util/theme).

**Validation:** audit must/should fixes applied; `npm run check-format` 339
clean; `./check.sh` 642 passed.

### Docs scroll to top on page change — Done (2026-11-03)

**Goal:** Reset the docs main scroller when the hash page changes.

**Validation:** `./check.sh` — 642 passed (new docs scroll spec).

### Document tooling + helpers — Done (2026-11-03)

**Goal:** Complete README and docs-site coverage for `januse` / `./check.sh`,
`latestAsync`, and createIcon helpers (including a public `./ui/createIcon`
export so imports match the docs).

**Decisions**

- `./ui/createIcon` package export (manifest count 94) so docs can import helpers
- Docs pages `#/helpers` (live demos) and `#/tooling`; README sections for both

**Validation**

- Completeness checklist vs code/importmap/exports: 30/30
- `npm run check-format`: 339 files clean
- `./check.sh`: format + unit 141 + Playwright 639 (sidebar covers Helpers/Tooling)

### latestAsync + hover-animated icon helpers — Done (2026-11-03)

**Goal:** Shared `createLatestAsync` for race-safe debounced loads, and
`animatedIconSlot` / `iconHoverHandlers` for hover-animated icons—no
CancellablePromise.

**Decisions**

- `janus-elements/ui/latestAsync`; stale results fulfill as `undefined`
- Icon helpers live on `createIcon.js`; adopted by Button, Input, Select
- Select `loadOptions` uses `createLatestAsync({ debounceMs: 300 })`

**Validation**

- `node --test src/tests/latest-async.test.js`: 4 passed
- `node --test src/tests/package.test.js`: exports count 93 incl. `./ui/latestAsync`
- `npm run check-format`: 337 files clean
- `./check.sh`: format check + unit 141 pass + Playwright 639 passed

### Format demo compact/spaced round-trip — Done (2026-11-03)

**Goal:** One demo website as a single-line source and as a maximally spaced
source; both match structurally before format, format to the same bytes, and
behave the same in the browser before formatting.

**Decisions**

- Canonical `format-demo-website.base.js`; derive `.compact.js` / `.spaced.js`
  via `source-whitespace.mjs` (ASI-safe; no preserved blank lines)
- Skip `*.compact.js` / `*.spaced.js` in `januse format` so extremes survive
- Unit tests for structure + byte identity; Playwright for pre-format behaviour

**Validation**

- `node --test src/tests/januse-format*.test.js`
- `npx playwright test src/tests/format-demo.spec.js` (chromium)
- `npm run check-format`

### Format safety: corpus + check-format gate — Done (2026-11-03)

**Goal:** Ensure `januse format` does not delete or reshuffle html` structure, and
stays idempotent on the real `src/janus` + `docs` corpus; run `format --check`
inside `./check.sh`.

**Decisions**

- Corpus test walks `src` + `docs` (same as `format --check`); compares html`
  fingerprints (tags, attrs, spreads, exprs, preserve-text) before/after
  in-memory format — must include `src/tests` fixtures, not only `src/janus`
- Full-file / markup / JSON idempotence on the same corpus
- Docker CMD runs `format --check docs src` after `tsc`, before unit tests

**Validation**

- Restored `render-fixtures` / `ui-kit-fixtures` / `index` attr parity vs
  `a8ec32b` after discovering corpus omitted `src/tests`
- Phrasing flow: `${name}: ${count}` stays flush (ItemCounter / ClickCounter)
- Browser test harness skips root whitespace text nodes and normalizes
  inter-tag whitespace in `matchTemplate` (pretty-print side effect)
- `node --test src/tests/januse-format*.test.js`
- `npm run check-format`: 327 clean
- `./check.sh`: format check + 636 passed

### Restore lossy html format (spreads / incomplete open tags) — Done (2026-11-03)

**Goal:** Recover `src/janus` and `docs` content dropped by the format pass in
`0446aeb`, and stop the formatter from dropping attrs after mid-tag `${}`.

**Steps**

- [x] Treat open tags with no `>` in a quasi as `incomplete` so following
  spreads/attrs stay attributes
- [x] Restore trees from `a8ec32b`, reformat with the fixed printer
- [x] Regression test for progressbar/FileInput-style spread+attr tags

**Validation**

- Attr `${` name counts: `src/janus` + `docs` match `a8ec32b` (0 losses)
- Select: 89 `attr=${` (was 30 in broken HEAD); FileInput keeps spreads + onChange
- `npm run check-format`: 326 clean; `npm test`: 114 pass
- `./check.sh`: 417 browser+unit passed (pre-regression-test add; unit test
  re-run on host after)

### januse CLI (lint, format, dev) — Done (2026-11-02)

**Goal:** Handrolled zero-dependency `januse` CLI for lint, format, and a
dev server with optional sync and true HMR (Custom Element class swap),
replacing `scripts/docs-server.mjs`.

**Decisions**

- Node builtins only; commands `lint`, `format`, `dev` (no `test`)
- Default path args: `src`; format `.ts`/`.json`/`.js`/`.mjs`/`.svg`/`.html`
- JS style: expanded multiline imports/destructuring/objects/calls; double
  quotes; semicolons; 2-space indent; trailing commas on multiline lists
- `format --check` exits `-1` (shell 255) when rewrite would change a file
- `dev --sync from:to` optional; HTTP root = repo root; watch roots = args
- HMR: WS + cache-bust re-import + `Component.register` live class swap
- No `package.json` `bin` (would pack into npm); invoke via
  `node ./bin/januse.mjs`; `docs` script uses that path
- `eqeqeq` allows `== null` / `!= null`

**Done when**

- [x] `lint` / `format` / `format --check` / `dev --sync …` work
- [x] `npm run dev` and Playwright use januse; docs-server gone
- [x] HMR client injected; `Component.register` hot-swaps when `__JANUSE_HMR__`
- [x] `./check.sh` passes

**Validation**

- Baseline `./check.sh`: tsc + unit + browser passed (636)
- `januse lint src`: clean; `format --check src`: clean
- Dev: sync + HMR script injected on `/docs/`
- Final `./check.sh`: tsc + unit + browser passed (636)

**Limitations**

- CLI is repo-local (`bin/januse.mjs`), not an npm `bin` export
- Handrolled parser: no decorators/JSX; TS coverage is practical not full
- HMR happy path is leaf-module re-import + class swap; full graph invalidation
  is not implemented

### Toolbar pressed border stacking — Done (2026-11-02)

**Goal:** Flush-group overlapped edges must not hide a pressed control’s accent
border (RichTextarea Bold, etc.).

**Decisions**

- CSS on `.janus-toolbar`: `z-index: 1` for `:hover`, `:focus`, and
  `[aria-pressed="true"]` (and Select focus/expanded)
- Stop setting inline `z-index` from sync so CSS can win

**Validation**

- Browser: pressed Bold `z-index` above Italic
- `./check.sh`: tsc + unit + browser passed (636)

### Toolbar flush button group — Done (2026-11-02)

**Goal:** Toolbar is a single solid flush button group (alternative 2).

**Decisions**

- `gap: 0`, no shell padding/border; controls abut
- Collapse shared edges with `-1px` margin; square inner corners; keep outer
  radius; raise focused control with `z-index`
- RichTextarea Formatting toolbar still `width: 100%`

**Validation**

- Browser: Save/Cancel radius and `-1px` margin; keyboard specs
- `./check.sh`: tsc + unit + browser passed (633)

### Toolbar component — Done (2026-11-02)

**Goal:** Children-based `Toolbar` (`role="toolbar"`, APG keyboard) for Button
and Select; RichTextarea Formatting bar uses it.

**Decisions**

- Name `Toolbar`; deep import `janus-elements/ui/toolbar`
- Children via `childElements`; no separators / groups / disabled cascade
- Roving tabindex; horizontal Left/Right (vertical Up/Down); Home/End; skip
  when typing in `input`/`textarea` or inside `menu`/`listbox`
- RichTextarea keeps `toolbarBtn` / `toolbarMenu`; wraps them in `Toolbar`

**Done when**

- [x] Toolbar hosts Button + Select; arrow/Home/End specs pass
- [x] Searchable Select Left/Right stay in the filter
- [x] RichTextarea Formatting toolbar keyboard + existing specs pass
- [x] Docs, README, CHANGELOG, types; `./check.sh` passes

**Validation**

- `./check.sh`: tsc + unit + browser passed (633)

### Docs server sync ENOTEMPTY — Done (2026-11-02)

**Goal:** `npm run dev` no longer fails mid-watch with
`ENOTEMPTY, Directory not empty: …/docs/lib`.

**Decisions**

- Serialize syncs (in-flight + pending flag); debounce unchanged at 100 ms
- Copy to `docs/lib/.staging-<pid>`, rename over `janus`, then remove outgoing

**Validation**

- Rapid `touch` under `src/janus` while the server ran: syncs succeeded, no
  `Sync failed`; `docs/lib/janus/index.js` present

### RichTextarea fixed toolbar — Done (2026-11-02)

**Goal:** The formatting toolbar stays visible while the editor (and Markdown
source) scrolls inside the field.

**Decisions**

- Shell keeps `resize: both` with `overflow: hidden`; a `.janus-rich-body`
  below the toolbar/popover is the only scrollport (`overflow: auto`)
- Toolbar + link/image popover stay outside that scrollport

**Done when**

- [x] Scrolling tall content does not move the toolbar
- [x] Existing menu overflow and RichTextarea specs still pass
- [x] `./check.sh` passes

**Validation**

- Browser: tall document, scroll body, toolbar top unchanged
- `./check.sh`: tsc + unit + browser passed (624)

### RichTextarea toolbar menus escape shell overflow — Done (2026-11-02)

**Goal:** Heading, code-language and Edit table menus are not clipped by the
RichTextarea shell (`overflow: auto` + `resize: both`).

**Decisions**

- Open menu panels use `position: fixed` under the trigger (flip up when needed);
  closed panels stay in the toolbar tree so host-scoped queries keep working
- No body portal (unlike Select); fixed positioning already escapes this shell

**Done when**

- [x] Edit table menu items beyond the shell’s bottom edge are visible and clickable
- [x] Existing Heading / language / table menu specs still pass
- [x] `./check.sh` passes

**Validation**

- Browser: short shell + open Edit table; `position: fixed`, box past shell bottom,
  bottom item hit-tests and Delete table works
- `./check.sh`: tsc + unit + browser passed (621)

### Button headIcon / tailIcon — Done (2026-11-02)

**Goal:** `Button` accepts `headIcon` / `tailIcon` Icon classes that animate on
hover (static when disabled), matching Input.

**Decisions**

- Size 16; `currentColor`; remount via `janusKey` like Input
- Docs nav Menu control uses `headIcon={MenuIcon}`

**Done when**

- [x] Icons render; hover animates; disabled stays static
- [x] Docs, types, README, CHANGELOG updated
- [x] `./check.sh` passes

**Validation**

- Browser: render, hover animated SVG, disabled static
- `./check.sh`: tsc + unit + browser passed (618)

### Theme Select height matches mode — Done (2026-11-02)

**Goal:** Docs header theme Select trigger height matches the mode Select.

**Decisions**

- Docs-only: `themeAccentSwatch` uses `boxSizing: border-box` + `lineHeight: 0`;
  `themeOptionLabel` is a 16px-tall flex row (`lineHeight: 16px`, caption in a
  span) so swatch and name share the same midline as the mode icon
- Leave Select API and `searchable={false}` unchanged

**Done when**

- [x] Theme and mode header triggers within 1px height
- [x] `./check.sh` passes

**Validation**

- Browser: height assertion in `theme.spec.js`
- `./check.sh`: tsc + unit + browser passed (609)

### ExportIcon — Done (2026-11-01)

**Goal:** Add `ExportIcon` as a square with an arrow escaping the top-right
corner (design #7), matching existing createIcon wiring.

**Decisions**

- Glyph: open NE corner on a rounded square + up-right arrow (distinct from
  Upload / Share)
- Animated: arrow group translates northeast; square stays put
- Wire like other icons: SVGs, `icon/export.js`, barrel, manifest + sync, docs

**Done when**

- [x] `<ExportIcon />` / `animated` render in docs Icons section
- [x] Package export `janus-elements/ui/icons/export`; export count 91
- [x] `./check.sh` passes

**Validation**

- `./check.sh`: tsc + unit + browser passed (606)

**Harden**

- Distinct from Upload/Share; reduced motion uses static SVG via createIcon
- No new dependency; trust model unchanged (SVG from package)

### Docs server: watch sync + no-cache — Done (2026-11-01)

**Goal:** `npm run dev` re-copies `src/janus` → `docs/lib/` on change and
serves with `Cache-Control: no-store`, so library edits need only a normal
refresh (no restart, no hard reload).

**Decisions**

- Tiny Node script (`scripts/docs-server.mjs`): built-in `fs.watch` +
  `http.createServer`; no new dependency
- Replace `python3 -m http.server` for docs and Playwright `webServer`
- Playwright health URL is `/docs/` (repo root has no `index.html`)
- Keep `docs/sync-lib.sh` for GitHub Pages one-shot sync

**Validation**

- Curl showed `Cache-Control: no-store`; touch under `src/janus` re-synced
- `./check.sh`: tsc + unit + browser passed

### Object/map key highlighting — Done (2026-11-01)

**Goal:** Keys in `{ python: value }` (and quoted / language-native forms)
use `.token.property` / `.token.key`, distinct from values.

**Decisions**

- Unquoted keys via lookbehind after `{` / `,` (avoids ternary true-branch)
- Quoted keys before `:` for JSON, Python, JS/TS, Go, Rust
- Perl barewords before `=>`; YAML keys alias `property`
- Color: existing `--janus-info` on `.token.property`

**Validation**

- Unit: object/map key cases across JS, JSON, Python, Rust, Go, Perl, YAML
- `./check.sh`

### Improve interpolation highlighting — Done (2026-11-01)

**Goal:** Identifiers inside JS/TS templates and Janus/HTML `${…}` keep
default text color, distinct from string literals and `${}` punctuation; same
improvements for Python f-strings, shell, and Perl double-quoted variables.

**Decisions**

- Balanced-delimiter matching in the highlight engine; JS template matcher
  handles nested templates
- HTML/Janus: extract balanced `${…}`, highlight as HTML, reinject JS
  interpolations (lifted from docs CodeSnippet into shared `highlight()`)
- `.token.interpolation` uses `--janus-text`; accent only on delimiter
  punctuation
- Go keeps raw backticks without interpolation

**Validation**

- Unit: 17 highlight tests including templates, nested braces, Janus attrs,
  f-strings, shell/perl, Go
- Browser: CodeSnippet markup + Code editor JS `.token.interpolation`
- `./check.sh`: tsc + unit + browser; 4 intermittent WebKit `page.goto`
  timeouts on first run, all passed on retry (known flake)

**Limitations**

- Nested template / brace edge cases with quotes inside interpolations are
  best-effort, not IDE parity
- YAML hyphen splitting and similar non-interpolation polish left alone

### Custom theme editor and CSS export (docs only) — Done (2026-11-01)

**Goal:** Docs can edit a Custom theme with live preview, export the active
theme as app-ready CSS, and document how to use presets or Custom.

**Decisions**

- Docs only; library theme API unchanged
- Editor on its own Custom theme page; Export CSS sits beside the Theme Select
- Export CSS uses `:root` + prefers-color-scheme / `data-janus-theme` light rules
- Custom is session-only; keep work via Export
- Shared module store in `docs/themes.js`

**Validation**

- Unit: `buildExportCss` for ocean and custom
- Browser: Custom preview after Start from Ocean + accent edit; header Export
- `./check.sh`: tsc + unit + browser passed

**Limitations**

- Custom theme is not persisted across reload
- Exported / custom palettes are not contrast-audited

### Docs theme selector (mode + theme axes) — Done (2026-11-01)

**Goal:** Docs header has independent Mode (System / Day / Night) and Theme
(Janus + 9 palettes) Selects; themes override `--janus-*` in the docs app only.

**Decisions**

- Docs only; library `BaseTheme` / `theme.js` unchanged
- Theme × mode independent: each non-default theme defines light + dark tokens
  under the same `data-janus-theme` / prefers-color-scheme conditions
- Mode labels use “mode”; Theme Select sits to the right of Mode
- `data-janus-docs-theme` on `:root`; omitted for Janus Default

**Validation**

- Mode / logo specs updated; new smoke for theme token change + mode luminance
- `./check.sh`: tsc + 90 unit + 603 browser passed (two earlier runs hit known
  intermittent WebKit `page.goto` timeouts unrelated to this change)

**Limitations**

- Docs themes are not contrast-audited like the default library palette
- Theme/mode choices are not persisted

### Clock hands move separately — Done (2026-11-01)

**Goal:** Animated `ClockIcon` hour and minute hands turn independently, like a
real clock, instead of rotating together as one shape.

**Decisions**

- Minute hand keeps the 1.4s turn; hour hand turns 12× slower (16.8s), both
  linear, starting from the static icon's ~4:00
- Animated minute hand lengthened 3.8 → 4.8 units so the hands are told apart;
  static `clock.svg` unchanged

**Validation**

- New spec seeks to a quarter minute-hand turn: minute hand 90°, hour hand
  7.5° (failed on the old single-shape sweep; passes in all three engines)
- Firefox screenshots: two distinct hands
- `./check.sh`: tsc + 90 unit + 600 browser passed

### Theme icon motion strength — Done (2026-11-01)

**Goal:** Sun, Moon and DayNight animations as noticeable as the other icons
(user: too discreet; DayNight faster, Sun/Moon stronger and slightly faster).

**Decisions**

- DayNight phase cycle 4s → 2s → 1.5s (user: slightly faster still)
- Sun rays: scale pulse 1.12 → 1.22 plus a 45° turn per loop (seamless with
  8 rays), linear, 1.2s → 1s
- Moon: rock ±6° → ±14°, 3s → 2.4s; still unclear (user), so a bell-style
  swing that settles: −20° with 2px lift, +12°, −4°, rest; 1.2s

**Validation**

- Firefox screenshots at ¼ steps: rays turn and grow without clipping; moon
  rock clearly visible
- `./check.sh`: tsc + 90 unit + 597 browser passed. One run before that had a
  known WebKit `page.goto` timeout (logo spec, reduced motion so static icons);
  the unchanged rerun was green

**Limitations**

- No test pins durations or amplitudes; motion strength was checked by eye

### DayNight moon-phase animation — Done (2026-11-01)

**Goal:** Animated `DayNightIcon` cycles moon phases like the user's reference
GIF instead of rotating; static icon unchanged.

**Decisions**

- Lit area grows in from the left to full, then shadow follows from the left
  (new → full → new), 4s, ease-in-out per half, matching the GIF's ~4s loop
  (later 1.5s, see Theme icon motion strength)
- Lit shape is one path of four cubics whose bulges move linearly, so it
  interpolates; the loop seam jumps between two empty shapes, so it is invisible
- SMIL `<animate attributeName="d">`, not CSS `d: path()`: WebKit does not
  support the CSS `d` property (computed `d` undefined). No mask/clipPath,
  since inlined icons would duplicate ids

**Steps**

- [x] Acceptance test first (failed on the rotation in all three engines)
- [x] Rewrite `day-night-animated.svg`; README, docs gallery text, CHANGELOG
- [x] `./check.sh`

**Validation**

- New spec samples `isPointInFill` along the midline at 0, ¼, ½, ¾ of the
  cycle: dark, left lit, full, right lit (chromium, firefox, webkit)
- Screenshots at ⅛ steps in Firefox and WebKit match the GIF's phases
- `./check.sh`: tsc + unit + 597 browser passed (1m48s)

### DayNight half-circle redesign — Done (2026-11-01)

**Goal:** Replace the unclear sun/crescent `DayNightIcon` with the classic
right-fill half-circle contrast mark and a readable swap animation.

**Decisions**

- Shape: circle outline + right semicircle `fill="currentColor"`
- Animation: 180° rotate over 2s ease-in-out (halves swap); Sun/Moon unchanged

**Steps**

- [x] Rewrite static + animated `day-night` SVGs
- [x] CHANGELOG; `./check.sh`

**Validation**

- `./check.sh`: 90 unit + 594 browser passed

### Theme mode icons (Family 1) — Done (2026-11-01)

**Goal:** Add classic sun / moon / day-night line-art icons (static + animated)
and wire them into the docs demo theme Select.

**Decisions** (user, 2026-11-01)

- Family 1: sun with 8 rays; crescent moon; vertical sun/crescent split
- Names: `SunIcon`, `MoonIcon`, `DayNightIcon` (`sun`, `moon`, `day-night`)
- Kit icons plus demo header Select (`light`→Sun, `dark`→Moon, `system`→DayNight)
- Select: `headIcon` follows mode (hover-animated); `renderOption` shows icon + label
  (no `renderValue` icon — avoids doubling with `headIcon`)

**Steps**

- [x] Static + animated SVGs
- [x] createIcon modules, barrel, exports.manifest + sync
- [x] Docs gallery, README, CHANGELOG; docs importmap for deep icon imports
- [x] Demo theme Select wiring
- [x] Specs + `./check.sh`; close out

**Done when**

- Three icons importable; gallery shows static/animated
- Theme Select shows matching icons in trigger and option rows
- `./check.sh` passes

**Validation**

- Unit: package exports count 90; manifest sync
- Browser: icons gallery (Sun/Moon/DayNight); theme Select head + option icons
- `./check.sh`: 90 unit + browser suite passed

**Limitations**

- Demo `renderValue` stays text-only so the trigger is not double-iconed

### Date UI polish + docs props tables — Done (2026-10-31)

**Goal:** Clear controls and field icons match TimePicker/Select; WeekPicker
reads as week rows; DateRange/Week label props; UI docs pages end with props
tables (examples stay English defaults).

**Decisions** (user, 2026-10-31)

- `instructionLabel` / `instructionLabelWithStart` (`{date}`)
- `weekColumnLabel` / `weekRowLabel` / `weekValueLabel` (`{week}`, `{year}`)
- Docs: props tables at page bottom; live examples keep English defaults (no
  Swedish label demos)
- Clear inside field shell; icons animate on hover (respect reduced motion);
  week row one continuous bar

**Steps**

- [x] Specs + implement labels, clear-inside, icon hover, week row
- [x] Docs `propsTable` on all `/ui/*` pages; README/CHANGELOG
- [x] `./check.sh`; Done

**Validation**

- Unit: `formatTemplate` placeholders
- Browser: clear inside field; week row hover; icon animated file under
  `emulateMedia({ reducedMotion: "no-preference" })`; docs props table
- Hardening: reduced motion keeps static SVGs; week row uses CSS `:hover`
  (no popup re-render on hover); icon remount keyed when animation toggles
- `./check.sh`: 90 unit + 591 browser passed

**Limitations**

- Label props are documented in props tables, not shown in live English demos

### Date month select + locale defaults — Done (2026-10-31)

**Goal:** Calendar month dropdowns show the viewed month on open. Omitting
`locale` stays on `en-US` (never `navigator.language`). DateTimePicker can
override Hour/Minute labels.

**Decisions** (user, 2026-10-31)

- Keep `locale?: string`; no separate `localization` prop
- `resolveLocale` falsy → `"en-US"` only
- DateTimePicker `hourLabel` / `minuteLabel` (default `"Hour"` / `"Minute"`);
  same string for visible text and `aria-label`
- Month-select January bug fixed in the template layer for all native
  `<select value=…>`

**Steps**

- [x] Failing specs: month select on open; `resolveLocale` default; hour/minute
  labels; select value after options
- [x] Sync value/checked after children (create + morph)
- [x] `resolveLocale` + DateTimePicker labels + docs/README/CHANGELOG
- [x] `./check.sh`; harden; Done

**Done when**

- Non-January view shows that month in the Month select on open
- No `locale` → `en-US` display strings; explicit `locale` still wins
- `hourLabel` / `minuteLabel` override DateTimePicker chrome

**Validation**

- Unit: `resolveLocale` with a mocked `navigator.language` of `sv-SE` failed
  first (`sv-SE` !== `en-US`), then passed after the fallback change
- Browser: month-select-on-open and select-value fixture specs written to
  catch January; hourLabel/minuteLabel spec on the docs labeled picker
- Hardening: empty/`undefined` locale → `en-US`; explicit locale still wins;
  select value re-synced after option morph so re-renders keep selection;
  `checked` synced the same way; label text + `aria-label` share one string
- `./check.sh`: 89 unit + 579 browser passed (1m27s)

**Limitations**

- Other DateTimePicker chrome strings (Done, Period, dialog aria-label) stay
  English unless a later phase adds more label props
- Week/DateRange month selects are covered by the shared chrome + render
  fixture, not separate open-on-view specs

### RichTextarea table menu + animated toolbar icons — Done (2026-10-31)

**Goal:** Tables can be edited from a Table toolbar menu and the keyboard, and
every toolbar button shows an icon that animates while hovered.

**Decisions** (user, 2026-10-31)

- Pattern 1 of five discussed: a toolbar menu. The ▦ button keeps inserting a
  table; a separate "Edit table" menu shows only while the caret is in a
  table (like Code language). Items: insert row above/below, insert column
  left/right, delete row, delete column, align column left/center/right/none,
  delete table
- Delete row is disabled on the header row (GFM needs one); so is Insert row
  above, for the same reason (agent's call, consistent with that rule).
  Deleting the last column removes the table
- Tab / Shift+Tab move between cells; Tab in the last cell adds a row. Enter
  (and Shift+Enter) moves to the cell below, adding a row from the last row
- Icon buttons animate their icon on hover (`animated` prop); text buttons
  (B, I, S, `</>`, •, 1., “, { }, —, ▦) become `CharactersIcon`s, animated
  on hover too

**Steps**

- [x] Specs (failing first): menu hidden outside a table; each item's effect
  on the Markdown; header row Delete disabled; last column removes the table;
  alignment shown and serialized; Tab / Shift+Tab / Enter in cells; undo of a
  table action; hover animates an SVG and a `CharactersIcon`
- [x] Table commands (`markdown/table.js`), `queryFormats().table`, Edit
  table menu (action items as `menuitem`, alignment as `menuitemradio`), cell
  keys; alignment CSS
- [x] Toolbar glyphs as `CharactersIcon`, hover animation
- [x] README/CHANGELOG/docs page; `./check.sh`
- [x] Follow-up (user, 2026-10-31): one table control. Outside a table ▦
  inserts one; inside a table ▦ is the Edit table menu trigger (glyph +
  chevron, no text). Reduced motion for `CharactersIcon`

**Done when**

- The specs above pass in Chromium, Firefox and WebKit

**Validation**

- New specs before the change (Chromium): all 11 failed
- After: the 11 passed in Chromium; the full gate then failed two existing
  Firefox specs (Link unlink, Markdown source toggle). Cause: the hover swaps
  the icon's SVG once the animated file loads, and Firefox drops a click
  whose mousedown target was replaced. Fixed with `pointer-events: none` on
  toolbar button contents
- Hardening: a break nested in bold or a link inside a cell still split the
  table; breaks are now spaces at any depth (spec added after the fix). A
  button disabled while hovered kept animating; leaving now always stops it
- Layout: `CharactersIcon` sets its text at 40 % of its box, so glyphs use a
  30 px box (12 px text, as before) and toolbar button side padding went from
  6 px to 2 px; text buttons are 34 px wide instead of 28 px (screenshot
  checked)
- `./check.sh`: 88 unit + 564 browser passed (1m40s)
- Follow-up: the toggle and trigger-icon specs failed first (Chromium), then
  passed. The reduced-motion spec for `CharactersIcon` passed with no code
  change: the theme stylesheet it installs sets `animation: none !important`
  under `prefers-reduced-motion: reduce`. The limitation recorded above was
  wrong and is removed; the spec stays as a regression guard. `./check.sh`:
  88 unit + 570 browser passed (1m24s)

**Limitations**

- No row or column reordering; the header row cannot be removed or replaced
- Pasting into a cell has no table-specific handling (line breaks become
  spaces on save; pasted blocks are flattened to their text)
- Keyboard menu navigation skips disabled items; no spec covers it

### RichTextarea toolbar additions — Done (2026-10-31)

**Goal:** Links can be removed from the toolbar, code blocks show and set
their language with the same highlighting as `CodeEditor`, headings H1–H6
come from one dropdown, and Ctrl/Cmd+B / I work in every browser.

**Decisions** (user, 2026-10-31)

- Caret in a link presses the Link button; clicking it unlinks and keeps the
  text. Editing a URL is unlink, then link again (the popover no longer
  prefills from an existing link)
- Code blocks stay editable in the WYSIWYG and are re-highlighted in place
  with the shared `highlight()` after each edit, caret restored
- Dropdowns are toolbar menu buttons (button + `role="menu"`), never taking
  focus from the editor on mouse use; the code-language menu shows only while
  the caret is in a code block. Labels are the highlighter's language ids
- One "Heading" menu: Paragraph, Heading 1–6; choosing the checked level
  returns to a paragraph (keeps the earlier H1 re-click rule)
- The editor handles Ctrl/Cmd+B and Ctrl/Cmd+I itself

**Steps**

- [x] Specs (failing first): link pressed + unlink + undo; heading menu
  (H4, checked item, Paragraph, re-choose toggles); language menu (hidden
  outside code, sets `lang`, tokens rendered); typing in a highlighted block
  keeps caret and value; Ctrl+B/I in all browsers. Existing heading-button
  specs move to the menu
- [x] `queryFormats` gains `link`, `headingLevel`, `codeLanguage`; `unlink`
  command; heading and language menus; in-place highlighting
- [x] README/CHANGELOG/docs page; `./check.sh`

**Done when**

- The specs above pass in Chromium, Firefox and WebKit; Markdown output is
  unchanged apart from the chosen heading level and code language

**Validation**

- New specs before the change (Chromium): link, heading menu, language menu
  and highlighting failed; the ported heading specs failed on the missing
  menu; Ctrl+B/I passed in Chromium (native) and are the Firefox fix
- Found during the work: a bare `!` was escaped everywhere (`al\\!pha`), a
  leftover of the "escape only where ambiguous" decision — no longer escaped
  since `[` always is; the language menu's inline `display` overrode
  `hidden` — moved to the stylesheet. Paste inside a code block now inserts
  plain text instead of parsed blocks
- Added after: keyboard spec for the Heading menu (Enter, arrows, Escape)
- `./check.sh`: 88 unit + 525 browser passed (1m18s); one earlier run had the
  known WebKit `page.goto` timeouts in docs/style specs, unchanged rerun green

**Limitations**

- Code blocks re-highlight on every input inside them; no highlighting while
  an IME composition is open (updates on the next input)
- Menus close on outside mouse down, Escape, Tab or editor typing; a
  re-render of the component while a menu is open closes it
- Language labels are the highlighter ids (`javascript`, `cpp`, …)

### RichTextarea list indent / outdent — Done (2026-10-30)

**Goal:** Tab nests the current list item under the previous one and
Shift+Tab lifts it a level, so nested lists can be built from the keyboard.

**Decisions** (user, 2026-10-30)

- Inside list items only; the first item of a list does not change, but Tab
  still stays in the editor. Elsewhere Tab moves focus as usual
- Shift+Tab on a top-level item lifts it out of the list (to a paragraph)

**Steps**

- [x] Browser specs: indent, indent the first item (no change, focus stays),
  outdent keeps following siblings nested under the moved item, outdent at
  top level, numbered and task items, undo, Tab outside lists leaves the
  editor; failing first
- [x] `indentItem` / `outdentItem` in `blocks.js`; Tab / Shift+Tab in
  `RichTextarea.js`
- [x] README/CHANGELOG/docs page; `./check.sh`

**Done when**

- `- a\n- b\n- c` with Tab on b emits `- a\n  - b\n- c`, Shift+Tab returns
  it; the specs above pass in three browsers

**Validation**

- New specs: 5 of 6 failed first in Chromium; "Tab outside a list moves
  focus" passed already (current behaviour, kept as a guard)
- `./check.sh`: 88 unit + 509 browser passed, 1 skipped (1m24s)

**Limitations**

- Outdenting into a list of the other tag takes that list's kind (a bullet
  moved into a numbered parent list becomes numbered); a task moving into a
  numbered list gets its own bullet list
- A list item holding several paragraphs moves as a whole

### RichTextarea undo / redo — Done (2026-10-30)

**Goal:** Undo and redo step through every change the user made — typing,
toolbar commands, list keys, link/image, task clicks, paste — and restore
exactly the earlier content and caret, in every browser.

**Decisions** (user, 2026-10-30)

- Next phases in order: undo/redo, list indent/outdent, toolbar additions;
  table editing waits for a design discussion
- Own history, not the browser's: Markdown + caret offsets per step; typing
  groups until a 1 s pause or a command; external `value` changes clear it;
  leaving source mode records one step
- Keys: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z and Ctrl+Y redo; Edit-menu
  `historyUndo` / `historyRedo` input events are routed the same way

**Steps**

- [x] Unit tests for the history stack (grouping, limit, redo cleared by a
  new change) and browser specs (undo/redo after a command, typing burst,
  caret restored, external value clears), failing first
- [x] `markdown/history.js` (pure `EditHistory`); `RichTextarea.js` records
  every emit, `input` events of insert/delete types group as typing, others
  (keyboard formatting) are their own step; shared `selectionOffsets` /
  `selectOffsets` now also back the link popover
- [x] README/CHANGELOG; `./check.sh`

**Done when**

- Ctrl+Z after typing then Bullet returns the typed text without the list,
  again returns the text before typing; redo replays both; a quick typed word
  undoes in one step; typing after an undo lands at the restored caret

**Validation**

- History unit tests (5) were written with the module, so they never failed
  first; browser undo specs: 3 of 4 failed before wiring (the "outside value
  clears history" spec passed already, as native undo cannot cross a rebuild;
  kept as a guard)
- `./check.sh`: 88 unit + 491 browser passed, 1 skipped (1m12s)
- Ctrl+B spec skipped in Firefox: Firefox applies no bold on Ctrl+B in the
  editor (Chromium and WebKit do natively)

**Limitations**

- Edit-menu / context-menu undo (`historyUndo` input events) is routed but
  not covered by a test; Playwright cannot open the native menu
- Keyboard formatting shortcuts are the browser's own: Ctrl+B / Ctrl+I work
  in Chromium and WebKit, not in Firefox. Open question for the toolbar phase
- Restoring a step rebuilds from Markdown, so an empty caret paragraph (e.g.
  after Horizontal rule) is not restored; the caret goes to the end

### RichTextarea Markdown fidelity — Done (2026-10-30)

**Goal:** Text typed in the WYSIWYG, or loaded as Markdown, comes back with
the same meaning after any number of saves, in this editor and in GFM
renderers.

**Findings** (round-trip and browser probes, 2026-10-30)

- M1 Text that looks like syntax is emitted unescaped: a paragraph typed as
  `# literal`, `- item`, `1. item` or `> quote` reloads as a heading, list or
  quote; `~~x~~` typed as text reloads struck. Loaded escapes (`\#`, `\-`,
  `1\.`, `\>`, `\~~`) are dropped on save
- M2 Enter in a code block inserts `<br>`, which the DOM reader drops:
  `line1⏎line2` saves as `line1line2`
- M3 `_` emphasis is parsed inside words: `snake_case_name` saves as
  `snake*case*name`
- M4 Nested lists serialize with compounding indent and blank lines:
  `- a\n  - b\n    - c` → `- a\n\n    - b\n\n          - c` (third level
  is an indented code block in GFM)
- M5 Table cells double every backslash on each save (`a\\b` → `a\\\\b`)
- M6 Inline parsing of loaded Markdown: `***both***` → `**\*both**\*`;
  multi-backtick code spans break (``` `` a`b `` ```), and backticks in code
  are emitted as `` \` `` (escapes do not work in code spans); a link title
  is stored as part of the URL; a URL containing `)` is cut short
- M7 Marks with edge whitespace emit `~~alpha ~~`, which GFM does not close
- M8 Setext headings and `1)` lists are not parsed; saving joins their lines
  (`Title\n=====` → `Title =====`)

**Steps**

- [x] Unit round-trip table in `markdown.test.js` for M1, M3–M8 (8 tests),
  plus browser specs for M1 (type, reload) and M2, failing first
- [x] Serializer: escape line-start block markers and `~~`/`|` where they
  would be read as syntax (M1); tight nested lists indented by marker width
  (M4); table cells escape only `|` (M5); code spans fenced longer than the
  longest backtick run (M6); move edge whitespace outside marks (M7)
- [x] Parser: no intraword `_` emphasis (M3); `***` as strong+emphasis,
  N-backtick code spans, link destinations with balanced parentheses and an
  optional title kept on the link (M6); setext headings and `1)` lists (M8)
- [x] DOM reader: `<br>` and line `<div>`s inside `<pre>` read as `\n` (M2);
  link/image `title` attributes
- [x] `handleCodeEnter`: Enter in a code block inserts `\n` itself (WebKit
  split the `<pre>` in two; found by the M2 spec)
- [x] CHANGELOG; `./check.sh`

**Done when**

- Every case in the round-trip table is stable: `parse(serialize(parse(s)))`
  equals `parse(s)`, and the serialized text matches the expected GFM
- Typing `# literal` in a paragraph and reloading the emitted value keeps a
  paragraph; Enter in a code block keeps the newline

**Validation**

- New tests before the fix: 8/8 unit failed; browser M2 failed in all three
  browsers. The M1 spec first passed vacuously (reload with an unchanged value
  did not re-parse); fixed to load a different value first, then it failed
- Unit after serializer + parser: 20/20 markdown tests
- `./check.sh`: 83 unit + 476/477 browser (WebKit split `<pre>` on Enter);
  after `handleCodeEnter`, 83 unit + 477 browser passed (1m06s)
- Last phase's partial-strike spec now expects `~~alpha~~ beta ~~gamma~~`
  (M7)
- Hardening: 31-case corpus (the original probe plus escapes, titles, nested
  ordered/task lists, tildes, `<`/`&`) is stable on a second save

**Decisions** (user, 2026-10-30)

- Inline parser: targeted fixes for M3/M6, not a CommonMark delimiter
  rewrite; other nested-emphasis edge cases stay approximate
- Link titles are kept: `<a title>` in the DOM, written back on save; not
  editable in the link popover
- Escape only where text would be read as syntax (e.g. `\#` at line start,
  `1\.` before a space at line start), keeping output readable
- Include M8: parse setext headings (`Title` / `=====` or `-----`) and `1)`
  lists, saved back as `# Title` and `1.`; today saving merges their lines
- Phase approved for implementation (user, 2026-10-30)

**Limitations**

- A backslash at line end is a literal backslash, not a hard break
- Closing `#`s of ATX headings are kept as text (`# H #`)
- Autolinks and raw HTML are escaped, so they stay text in GFM renderers too,
  matching what the editor shows
- Other nested-emphasis edge cases stay approximate (targeted fixes)

**Out of scope** (separate phases if wanted): undo for toolbar commands,
Tab indent/outdent, table row/column editing, unlink / code language / H4–H6
buttons, typing shortcuts, rich paste, autolinks, reference links, indented
code blocks, raw HTML

### RichTextarea consistency pass — Done (2026-10-30)

**Goal:** Every toolbar command and list key leaves the editor in the same DOM
shape the Markdown parser produces, so what the WYSIWYG shows, what the toolbar
reports and what `onChange` emits always agree; remove the duplicated and dead
helpers that let them drift.

**Findings** (probed in Chromium against `ui-kit.html`, 2026-10-30)

Lists and tasks
- F1 Task off inside a task list leaves a plain item in `ul[data-task-list]`;
  the list-level `list-style: none` hides its bullet while Bullet shows
  pressed (reported)
- F2 Task off returns a bullet item; Bullet/Numbered off return a paragraph
  (reported)
- F3 Task on a numbered item converts the whole `<ol>` to `<ul>`; the other
  items lose their numbers. Bullet/Numbered act on the current item only
- F4 Per-item toggles never re-merge lists: Numbered then Bullet on a middle
  item leaves three `<ul>`s, emitting `- one\n\n- two\n\n- three`, which other
  Markdown renderers read as one loose list
- F5 Unwrapping an item (Bullet/Numbered off, Backspace at list start) nests
  `<p><p>…</p></p>`; a heading or quote in the item is lost
- F6 Backspace at the start of a task adds a second paragraph to the previous
  item (`- [ ] one\n\n  two`) instead of joining the text
- F7 Bullet on a heading drops the heading, yet H1 inside an item is allowed
  (`- # two`)
- F8 Enter on an empty item leaves `<p><br></p>`, emitted as `"  \n"` junk

Quotes
- F9 Quote creates `<blockquote>text</blockquote>` (parser:
  `blockquote > p`); toggling off leaves bare text at the editor root, after
  which Quote/Heading create an empty block instead of wrapping the text
  (`alpha\n\n>   \n> `)

Inline
- F10 Inline code / Strikethrough with no selection emit empty marks:
  ``alp``ha``, `alp~~​~~ha` (zero-width space leaks into `value`)
- F11 Strikethrough off on part of a struck span removes the whole span; Bold
  and Italic only affect the selection

Code
- C1 Duplication: task-box selector ×14, item-content lookup ×6, "strip task"
  ×5, list split before/after ×2, task-box builder in `dom.js` and
  `blocks.js`, link-apply tail ×4, popover snapshot rehydrate ×2
- C2 Unused: `clearTasks`, `markTasks`, `unwrapList`, `setTaskBoxChecked`,
  `isTaskBoxChecked`, `toggleTaskChecked`, `restoreRange`, `setParagraph`,
  `editorRoot`; `input[type=checkbox]` branches (nothing creates them). The
  `markdown/` helpers are not package exports

**Proposed model**

- Each list button sets the current item's kind (bullet, numbered, task);
  pressing the active kind returns the item to a paragraph
- Adjacent lists of the same tag merge; a `<ul>` may mix tasks and plain items
  as GFM allows, so markers are per item (`li[data-task]`), not per list
- Tasks stay bullet-only (parser has no `1. [ ]`)
- One `normalize(root)` pass after every command enforces the parser's shapes:
  no nested `<p>`, no bare text or inlines at the root, `li`/`blockquote`
  content in blocks, merged lists, no empty marks

**Steps**

- [x] Acceptance specs from the findings, failing first
  (`src/tests/rich-textarea.spec.js`); shared invariant that the live block
  skeleton equals a fresh render of the emitted Markdown
- [x] C2 + C1 in `blocks.js` / `commands.js` / `dom.js`, no behaviour change
- [x] List model F1–F8: `setListKind` (isolate / lift / convert one item),
  per-item task CSS, `data-task-list` removed; `normalize.js` after every
  command and list key
- [x] Quote shape F9: Quote wraps / unwraps blocks
- [x] Inline F10–F11: `toggleMark` needs a selection, unmarks only the
  selected part
- [x] DOM reader groups inline runs into one paragraph, drops blank
  paragraphs and trailing breaks
- [x] `RichTextarea.js` value fallbacks and dead popover rehydrate; README,
  CHANGELOG, docs page

**Done when**

- F1–F11 specs pass in all three browsers; invariant holds after every
  toolbar command and list key in the specs; C1/C2 helpers gone

**Validation**

- Baseline `./check.sh`: 432 passed (1m12s)
- New specs before implementation: 13/13 failed in Chromium, each on its
  finding
- Batch 2 (cleanup): 75 unit + 432 browser passed
- Batch 3–5: `./check.sh` 471 passed (1m05s); one old spec updated to the
  Task-off decision (`todo\n\n- [x] done`)
- Minimize: 471 passed. Final gate: one run had two WebKit `page.goto`
  timeouts in unrelated docs/style specs; two unchanged reruns passed 471
- Hardening probe (Chromium): empty editor, table cell (list/heading/quote
  leave the table alone), caret kept across Bullet/H2/Quote, strike across
  paragraphs is a no-op, Enter on an empty middle item splits the list

**Hardening**

- No new trust boundary or dependency; `safeUrl` paths unchanged; no
  `innerHTML` writes
- `normalize` has no unit test (Node tests have no DOM); covered by the
  acceptance invariant in three browsers

**Decisions** (user, 2026-10-30)

- Task off → paragraph, like Bullet/Numbered off
- List buttons keep an inner heading (`- # Title`); unwrapping restores it
- Inline code / Strikethrough without a selection do nothing
- Consistency via a `normalize(root)` pass after commands, not a re-render
  from Markdown

**Limitations**

- Parser splits lists at blank lines (`- a\n\n- b` → two lists), unlike
  CommonMark; unchanged. The next command merges such adjacent lists
- Tasks are bullet-only; the parser has no `1. [ ]`
- A list button on the second paragraph of an item acts on the whole item
  (lifting a nested item then pressing Bullet again unwraps the parent); no
  indent/outdent exists
- Marks with edge whitespace serialize as `~~alpha ~~`, which this parser
  round-trips but CommonMark renderers would not

### RichTextarea per-item list toggles + inline link — Done (2026-10-30)

**Goal:** Bullet/numbered on one task leave siblings alone; unwrap keeps order;
mid-sentence link stays in the same paragraph.

**Steps**

- [x] Per-item `toggleList` (demote task / split UL↔OL / unwrap one item in order)
- [x] `queryFormats` task/bullet from the current item only
- [x] Link Apply via snapshot + character offsets (`applyLinkAtOffsets`)
- [x] Playwright specs; `./check.sh`

**Validation**

- RichTextarea Playwright specs; `./check.sh`

### RichTextarea heading / link / task polish — Done (2026-10-30)

**Goal:** H1 re-click unsets heading; link wrap stays inline; empty task typing
lands in the content cell; task toolbar toggle is per-item.

**Steps**

- [x] `setHeading` toggles same level back to `p`
- [x] Popover restore: focus then rehydrate from snapshot (focus morph-wipes)
- [x] `ensureTaskItemContent` + caret; per-item `toggleTaskList`
- [x] Tables insert as block siblings (not inside task `<p>`)
- [x] Playwright specs; `./check.sh`

**Done when**

- Re-clicking H1 clears the heading; linking “Write” stays one paragraph;
  typing after an empty-line task sits in the task content; toggling task off
  “Task one” leaves “Task two” a task

**Validation**

- New RichTextarea Playwright specs; `./check.sh` — 423 passed

### RichTextarea MD icon, link break, source highlight — Done (2026-10-30)

**Goal:** Stronger Markdown icon motion; no extra blank block after link wrap;
source-mode highlight updates while typing.

**Steps**

- [x] Bolder `markdown-animated.svg` motion
- [x] Link wrap cleans adjacent empty blocks; caret stays in link text
- [x] `CodeEditor.emitChange` refreshes highlight layer
- [x] Spec + `./check.sh`

**Validation**

- Source-toggle Playwright checks highlight text; `./check.sh`

### RichTextarea strike, H2/H3, HR — Done (2026-10-30)

**Goal:** Toolbar strikethrough, separate H1/H2/H3, and horizontal rule;
Markdown parse/serialize round-trip for `~~` and `---`.

**Steps**

- [x] Parse/serialize/DOM for delete + thematicBreak
- [x] Commands + queryFormats + toolbar buttons
- [x] Specs/docs/CHANGELOG; `./check.sh`

**Done when**

- Strikethrough toggles `~~…~~`; H1/H2/H3 set heading levels with pressed
  state; HR inserts `---`; unit + Playwright cover them

**Validation**

- `markdown.test.js` roundtrips; RichTextarea Playwright toolbar specs;
  `./check.sh`

### RichTextarea link/image caret restore — Done (2026-10-30)

**Goal:** Link and image Apply use the selection/caret from before the
popover stole focus.

**Steps**

- [x] Capture range on popover open; restore before apply
- [x] DOM-based applyLink (wrap / insert / edit existing `<a>`); insert
  image at caret
- [x] Spec + `./check.sh`

**Done when**

- Apply link wraps selected text or inserts at caret; Apply image inserts at
  caret; caret-in-link prefills the popover for edit

**Validation**

- Playwright RichTextarea link/image specs; `./check.sh`

### Field resize + date/time icons — Done (2026-10-30)

**Goal:** Multi-axis resize on text surfaces; calendar/clock decoration on
date and time triggers. No new dependencies.

**Steps**

- [x] `resize: both` on Textarea, CodeEditor, RichTextarea
- [x] Leading CalendarIcon on date-family pickers; ClockIcon on TimePicker
- [x] CHANGELOG; `./check.sh`

**Done when**

- The three text surfaces expose a both-directions resize handle
- Date/Week/Month/DateTime/DateRange triggers show a muted calendar glyph;
  TimePicker shows a muted clock glyph; existing picker specs still pass

**Decisions**

- Shared helpers live in `calendarChrome.js` (`calendarFieldIcon` /
  `clockFieldIcon`); decorative only (`aria-hidden`)

**Validation**

- `./check.sh`

### RichTextarea Markdown source toggle — Done (2026-10-30)

**Goal:** Toolbar control switches between WYSIWYG and a Markdown `CodeEditor`
sharing the same `value` / `onChange`; no new dependencies.

**Steps**

- [x] Acceptance: toggle shows source; edits emit; toggle back; format disabled
- [x] Implement toggle + CodeEditor surface
- [x] Docs/CHANGELOG; `./check.sh`; close

**Done when**

- “Markdown” toolbar button toggles source vs WYSIWYG (`aria-pressed`)
- Source edits call `onChange` with the Markdown string
- Leaving source mode shows the updated content in the contenteditable
- Format actions are unavailable in source mode; `./check.sh` passes

**Decisions**

- Mode is internal UI state (not a prop)
- Reuse `CodeEditor` with `language="markdown"`

**Validation**

- Playwright source-toggle spec + prior RichTextarea specs
- `./check.sh` — pass

**Hardening findings**

- `syncEditor` must prefer `props.value` over `_syncedValue` so external
  controlled updates still apply; leave-source path paints from `_syncedValue`

### RichTextarea editing fidelity — Done (2026-10-30)

**Goal:** Block-model format commands (less `execCommand`), Enter/Backspace in
lists, and toolbar `aria-pressed` from the caret — no new dependencies.

**Steps**

- [x] Acceptance specs (list keys, pressed toolbar, heading/list still emit MD)
- [x] `markdown/blocks.js` + rewrite block commands
- [x] List Enter/Backspace + caret; sync toolbar state
- [x] `./check.sh`; harden; close phase

**Done when**

- Enter in a non-empty list item adds another item; Enter on an empty item exits
  the list to a paragraph
- Backspace at the start of a list item unwraps or merges as specified
- Bold / Heading / Bullet list buttons expose `aria-pressed` for the caret
- Existing RichTextarea Playwright specs still pass; `./check.sh` passes

**Decisions**

- Block mutations via DOM helpers; bold/italic may still use `execCommand`
- Toolbar pressed state updated imperatively (no `setState`) via
  `selectionchange`

**Validation**

- Playwright: list Enter/Backspace + `aria-pressed` on rich-list / rich-main
- Prior RichTextarea specs still green
- `./check.sh` — pass

**Hardening findings**

- Empty list-item serialize is `-` / `- `; exit-list assertion counts `^-\s`
  lines rather than requiring a trailing empty item line

**Limitations**

- Bold/italic *toggling* may still use `execCommand`; pressed state uses DOM
  marks (`strong`/`b`/`em`/`i` or inline style), not `queryCommandState`
- Tab indent and multi-level lists remain out of scope

**Follow-up fix (2026-10-30):** bold `aria-pressed` no longer follows
`queryCommandState` (false positive inside plain `code`).

**Follow-up fix (2026-10-30):** task checkboxes are interactive (no longer
`disabled`); document-level click toggles `data-task` / Markdown.

### RichTextarea Markdown WYSIWYG — Done (2026-10-30)

**Goal:** Hand-rolled `RichTextarea` (no new deps) with toolbar + contenteditable;
`value` / `onChange` are Markdown covering a wide CommonMark-ish subset
including images, tables, and task lists.

**Steps**

- [x] Acceptance specs first (unit roundtrip + Playwright toolbar/Field)
- [x] `markdown/parse`, `serialize`, `dom`, `commands`
- [x] `RichTextarea` shell, paste sanitize, Field `role="textbox"`
- [x] Export, docs, README, CHANGELOG, TODO
- [x] `./check.sh`; harden; close phase

**Done when**

- Toolbar formats emit Markdown via `onChange`
- Controlled `value` updates the editor; `disabled` blocks edit
- Field associates hint via `aria-describedby` on the textbox
- Unit roundtrips cover the wide subset; `./check.sh` passes

**Decisions**

- Zero runtime deps; Markdown string API like CodeEditor
- Always WYSIWYG + toolbar (no source split view)
- Link/image URLs via inline toolbar popover
- `receiveProps` skips re-render when echoed `value` matches last emit
  (keeps caret); popover is imperative (no `setState`)
- Field prefers `role="textbox"` / combobox over nested toolbar/`input`s

**Validation**

- Unit: `markdown.test.js` roundtrips + URL stripping
- Playwright: RichTextarea toolbar + controlled/disabled/Field on `/src/tests/ui-kit.html`
- `./check.sh` — pass

**Hardening findings**

- `insertUnorderedList` fails inside headings; list commands wrap the block in
  DOM instead
- Field `querySelector` hit toolbar buttons / popover inputs before the
  textbox; control lookup is now priority-ordered
- Playwright `getByRole("button", { name: "Link" })` also matched “Apply link”;
  specs use `exact: true`

**Limitations**

- Roundtrip normalizes Markdown (list markers, heading `#` style, spacing)
- Nested lists deeper than one indent level are best-effort
- Caret restore after an external controlled `value` change is best-effort
- Images are URL-only (no upload); paste takes `text/plain` through the parser

### Table row virtualization — Done (2026-10-30)

**Goal:** Window body rows in a fixed-height scroll viewport so huge `rows`
arrays stay usable, with a div `role="table"` layout (ag-grid-inspired), no
new dependencies. Sort, selection, filters, and column resize stay out.

**Steps**

- [x] Acceptance specs first (role parity, bounded DOM for 5k rows, scroll,
  `column.render`)
- [x] Rewrite `Table.js`: viewport, spacer, fixed `rowHeight` windowing,
  header outside body scroll, `column.render` / `width`
- [x] Types, docs gallery (5k-row demo), README, CHANGELOG, `visibleRange` unit
- [x] `./check.sh`; harden; close phase

**Done when**

- Inventory table still exposes `role="table"` named by caption; headers and
  paginated cells work as before
- 5_000-row fixture: DOM cell count stays bounded (viewport + overscan), not
  ~5_000
- Scrolling the viewport changes which row text is visible
- `column.render` shows custom cell content
- `./check.sh` passes

**Decisions**

- Div + ARIA table roles, not native `<table>`; caption via visible label +
  `aria-label`
- Header row sits above the body viewport (horizontal `scrollLeft` synced);
  body uses absolute rows in a tall spacer
- Fixed `rowHeight` only (default 40); `height` default 320; `overscan` default 5
- Parent still owns data; virtualization windows whatever `rows` it receives
- No new npm / Docker deps

**Validation**

- Unit: `visibleRange` in `table.test.js`
- Playwright: Inventory + Virtualized rows on `/ui/data`
- `./check.sh` — pass (63 unit; Playwright green across Chromium/Firefox/WebKit)

**Hardening findings**

- Playwright `name: "Inventory"` substring-matched “Large inventory”; gallery
  caption is now “Virtualized rows” and Inventory locators use `exact: true`
- `getByText("Row 1")` also matched Row 10/11; specs use
  `getByRole("cell", { name, exact: true })`

**Limitations**

- Fixed row height only; no sort/selection/filter/resize/edit
- Wide columns: header/body horizontal sync is scrollLeft-only (no shared
  overflow wrapper)

### Field headIcon / tailIcon — Done (2026-10-30)

**Goal:** Optional `headIcon` / `tailIcon` (Icon classes) on Input and Select;
remove Select `showSearchIcon` / `hideChevronIcon` with the same defaults.

**Steps**

- [x] `instantiateIcon` helper; icon modules `export default`
- [x] Select / Input wiring + types
- [x] Docs, README, CHANGELOG, specs
- [x] `./check.sh`

**Done when**

- Default Select: chevron only; `headIcon=${SearchIcon}` + `tailIcon=${null}`:
  search only; `tailIcon=${null}` hides chevron
- Input shows optional icons; without icons unchanged
- Old boolean props gone; `./check.sh` passes

**Decisions**

- Props take Icon component classes; `null` hides; `undefined` is default
- Select default tail Chevron; no default head; size 16; Select hover animated
- Templates cannot use dynamic tags → `instantiateIcon` via customElements

**Validation**

- `./check.sh` — 384 passed (one prior creatable goto timeout was flaky; clean re-run)

**Limitations**

- Callers must import/register the Icon module before passing the class

### CodeEditor with hand-written highlighting — Done (2026-10-29)

**Goal:** Ship `<CodeEditor>` with a Janus-owned highlighter (no Prism, no npm
deps), all listed languages in one import, filename/content auto-detect unless
`language` overrides; migrate docs off `docs/vendor/prism` and delete it.

**Steps**

- [x] Highlight engine + plain + token styles + unit tests
- [x] Grammars for the full language set (clike/markup bases)
- [x] `detectLanguage` + overrides
- [x] `CodeEditor` UI, exports, docs gallery, Playwright acceptance
- [x] Migrate `CodeSnippet`; delete Prism vendor; README/CHANGELOG; `./check.sh`

**Done when**

- Typing updates via `onChange`; highlight spans for known languages
- `language` wins over filename; `.py` / python shebang detect without `language`
- Unknown → plain (escaped); `disabled` / `readOnly` block edits
- Docs snippets still show `.token` nodes; no Prism; vendor tree gone
- `./check.sh` passes

**Decisions**

- Hand-written grammars only (no Prism source)
- All languages bundled with one `CodeEditor` / `highlight` import
- Textarea-over-pre editor; no line numbers / find / autocomplete this phase
- Token markup keeps `.token` classes for docs look continuity

**Validation**

- Unit: `highlight` / `detectLanguage` / package exports
- Playwright: CodeEditor acceptance + docs Code editor section (no `window.Prism`)
- `./check.sh` — pass

**Limitations**

- Not IDE/Prism parity (nested templates, complex TS, exotic shell quoting)
- Soft-wrap / scroll quirks mitigated with matching mono metrics and `pre`

### New icon animation intensity — Done (2026-10-29)

**Goal:** Bring the 20 newer animated SVGs up to the motion of the original set.

**Steps**

- [x] Clock: hand sweeps (face static); link: chain halves pull apart
- [x] Boost remaining soft new animations to ~old amplitudes
- [x] `./check.sh`

**Done when**

- Clock/link read clearly when `animated`; others match older kit energy
- `./check.sh` passes

**Validation**

- `./check.sh` — pass

### Spinner variants — Done (2026-10-29)

**Goal:** Extend `<Spinner>` with CSS-only `variant` looks without new tags.

**Steps**

- [x] Acceptance specs for ring default, dots/bars/pulse, unknown fallback
- [x] `Spinner.js` glyphs + `janusSpinnerBars`; `Spinner.d.ts`
- [x] Docs, README, CHANGELOG
- [x] `./check.sh`

**Done when**

- `variant` is `ring` | `dots` | `bars` | `pulse`; default and unknown → ring
- Docs show all four; Select unchanged
- `./check.sh` passes

**Decisions**

- Single component + `variant`, not four tags
- Reuse `janusSpin` / `janusPulse`; new `janusSpinnerBars` only
- Three units for dots/bars; no size prop this phase

**Validation**

- `./check.sh` — pass (375)

### Line-art icons expansion — Done (2026-10-29)

**Goal:** Double the line-art set to 40 icons, skipping UTF-8-covered glyphs.

**Steps**

- [x] 20 static + 20 animated SVGs and `icon/*.js` modules
- [x] Barrel, manifest exports, docs gallery, README/CHANGELOG
- [x] `./check.sh`

**Done when**

- Clock…Unlock deep-importable; gallery shows static + animated rows
- `./check.sh` passes

**Decisions**

- Skip Minus, More, Warning, ArrowLeft/Right (CharactersIcon / wrappers)
- Exact 20 additions: Clock, Calendar, Key, File, Folder, Download, Upload,
  Copy, Link, Info, Filter, Refresh, Image, MapPin, Phone, Bookmark, Message,
  Cloud, EyeOff, Unlock

**Validation**

- `./check.sh` — pass (Firefox `NetworkError` flake on accordion reorder
  afterEach; retry passed)

### CharactersIcon pulse, triangle, outline — Done (2026-10-29)

**Goal:** Pulse on CharactersIcon; triangle wrapper; outline shells; docs
section for popular UTF-8 uses.

**Steps**

- [x] `animated` → `janusPulse`; reduced-motion already clears animations
- [x] `IconTriangleWrapper`; `outline` on disc/square/triangle
- [x] Docs Characters block on Icons page; specs; exports; README/CHANGELOG
- [x] Triangle `outline` via stroked SVG polygon (clip inset shadow failed)
- [x] `./check.sh`

**Done when**

- Pulse, triangle outline, and Characters examples on Icons page
- `./check.sh` passes

**Decisions**

- Prop name `animated` (kit convention), not `animate`
- Warning via `⚠` + triangle; no Warning SVG in the pending expansion
- Characters examples live at the bottom of Icons (no separate nav leaf)

**Validation**

- `./check.sh`

### Rename Label → Badge — Done (2026-10-28)

**Goal:** End docs/component drift (nav “Badges” vs `<Label>`); audit for peers.

**Steps**

- [x] `Badge.js` / `.d.ts`; drop `Label`; manifest `./ui/badge`; sync exports
- [x] Docs, fixtures, specs, README, CHANGELOG, TODO
- [x] Audit other kit names; `./check.sh`

**Done when**

- `<Badge>` / `janus-badge` / `janus-elements/ui/badge` everywhere current
- No remaining Label/Badge drift; audit notes any other naming gaps
- `./check.sh` passes

**Decisions**

- Clean rename (no `Label` alias); pre-1.0
- Historical PLAN wording left as written
- Audit: Feedback vs old “Alert” plan name already consistent as Feedback;
  modal “Alert” button is `modal.alert`, not the Feedback component

**Validation**

- `./check.sh`

### TimePicker segmented digital field — Done (2026-10-28)

**Goal:** Replace column popup TimePicker with pattern A (segmented field);
include 12-hour in the docs snippet.

**Steps**

- [x] Rewrite TimePicker as HH:mm[:ss][+AM/PM] segments
- [x] Docs snippet + specs; README/CHANGELOG
- [x] `./check.sh`

**Done when**

- Typing/arrows/Tab work; `hour12` period select works; snippet shows 12-hour
- `./check.sh` passes

**Decisions**

- No popup/columns; spinbuttons + optional period `<select>`
- Auto-advance after two digits; `:` moves to next segment
- DateTimePicker time UI left as selects (follow-up if wanted)

**Validation**

- `./check.sh`

### Date picker month select + year spin — Done (2026-10-28)

**Goal:** Jump month/year quickly in calendar headers (pattern 2).

**Steps**

- [x] Shared `monthYearHeader` (month `<select>`, year number input)
- [x] Wire DatePicker, DateTimePicker, WeekPicker, DateRangePicker
- [x] MonthPicker `yearHeader` with the same year spin
- [x] Spec + `./check.sh`

**Done when**

- Header exposes Month and Year controls; grid follows; Escape/typing still work
- MonthPicker year spin works; `./check.sh` passes

**Decisions**

- Year is `type="number"` (not a long `<select>`); bounds from `min`/`max` or ±100
- Partial year typing does not sync until a complete in-range year or `change`
- Same chrome on all month-grid pickers; MonthPicker uses year-only header

**Validation**

- `./check.sh`

### Phase 42: Date/time pickers and related inputs — Done (2026-10-28)

**Goal:** Ship custom Date, Time, DateTime, Week, Month, and DateRange
pickers, plus themed native Number, Range, Color, and File inputs.

**Steps**

- [x] Batch 1: NumberInput, RangeInput, ColorInput, FileInput
- [x] Batch 2: DatePicker, TimePicker (+ shared helpers, docs leaf)
- [x] Batch 3: DateTimePicker, WeekPicker, MonthPicker
- [x] Batch 4: DateRangePicker; README/CHANGELOG/PLAN; final gate

**Done when**

- All ten components deep-importable, typed, documented
- Acceptance specs cover value round-trip, disabled, min/max, date-family
  popup/keyboard, and File/Color/Number/Range basics
- `./check.sh` passes

**Decisions**

- Color/Number/Range/File: themed native wrappers
- Date family: custom portaled UI; ISO string values; `onChange(value)`;
  optional `locale`; Time 24h default (`hour12` opt-in)
- Shared `dateTime.js` + `pickerPortal.js` internals (not package exports)
- One phase, four batches (Phase 14 rhythm)

**Validation**

- `./check.sh` after each batch; final gate on close-out

**Hardening**

- Native `onChange` stopped from bubbling so host listeners do not see events
- Date-family pickers share one body portal (one open at a time)
- DateRange: first click start, second end (order-normalized); clear emits
  empty `{ start, end }`

**Limitations**

- No timezone / `Date` object values
- Time seconds only when `step` requires them
- No multi-month compare layout beyond one range popup

### Select async search-icon demo — Done (2026-10-28)

**Goal:** Docs show a second async Select with `showSearchIcon` and
`hideChevronIcon` so the search-only trigger is visible in the demo.

**Steps**

- [x] Add “Async with search icon” example + snippet
- [x] Point icon control spec at the new demo
- [x] `./check.sh`

**Done when**

- Select docs section has two async examples; second has search icon, no chevron
- `./check.sh` passes

**Validation**

- `./check.sh`: 321 of 321 Playwright runs pass

### Phase 41: Select trigger icons — Done (2026-10-28)

**Goal:** Replace Select `▾` / `×` with SearchIcon, ChevronIcon, and
CloseIcon; animate on hover (no open-state rotate).

**Steps**

- [x] Wire icons + hover state into Select.js
- [x] Specs, README, CHANGELOG, docs sync
- [x] `./check.sh`; close out

**Done when**

- No `▾` / `×` in Select chrome; icons show with hover animation
- Clear/chips still work; docs + `./check.sh` pass

**Decisions**

- Trailing Chevron by default; `hideChevronIcon` hides it
- Leading Search only when `showSearchIcon` is set
- CloseIcon for clear-all and chip remove only
- 2A: hover `animated` only

**Validation**

- `./check.sh`: 321 of 321 Playwright runs pass

**Hardening**

- Search icon opt-in avoids crowding default searchable fields
- Clear/chip remove keep `aria-label` with CloseIcon children

### Select reopen-on-click + async open loading — Done (2026-10-28)

**Goal:** Searchable Select opens again on click when the trigger is already
focused (after Escape); async Select shows loading immediately on open
instead of flashing "No options".

**Steps**

- [x] Expand on trigger click when collapsed (single + multi)
- [x] Acceptance: reopen while focused; overflow menu on `document.body`
- [x] Async: load on open immediately; show loading during typed debounce
- [x] `./check.sh`; close out

**Done when**

- Clicking a focused, collapsed Select opens the menu
- Async open shows Spinner, not "No options", then results
- Overflow demo menu portals to `body`; `./check.sh` passes

**Validation**

- `./check.sh` (after async loading fix)

**Hardening**

- Searchable open was focus-only; Escape left focus so a later click did
  nothing until ArrowDown
- Async debounced open left an empty menu for 300 ms; now `runLoad("")` on
  expand and `scheduleLoad` sets `loading` during debounce
- Button-style Select (`searchable={false}`) menu used `janus-button`'s empty
  `display:contents` box; `triggerBox()` prefers the painted inner control

### Phase 40: Select async + custom render hooks — Done (2026-10-28)

**Goal:** Load options via promise-based `loadOptions` with loading UI, and
support `renderOption` / `renderValue` hooks.

**Steps**

- [x] Acceptance specs + docs hooks
- [x] Implement loadOptions debounce/cache/loading + render hooks
- [x] Docs, README, CHANGELOG, types-smoke
- [x] `./check.sh`; close out

**Done when**

- Async load, loading row, cache/defaultOptions, and render hooks work
- Docs + `./check.sh` pass

**Decisions**

- `loadOptions(input) => Promise`; 300 ms debounce; stale id ignored
- `renderOption` / `renderValue` swap label content only
- No `components` map this phase

**Validation**

- `./check.sh`: 312 of 312 Playwright runs pass (async/loading, stale race,
  render hooks covered)

**Hardening**

- Failed loads clear loading and keep previous options
- Loading row preferred over empty `noOptionsMessage`
- Static `options` still used for selected-value lookup when async omits them

**Limitations**

- No `components` slot API / react-select aliases (Planned)
- No dedicated error UI for rejected loads

### Phase 39: Select creatable, disabled options, groups — Done (2026-10-28)

**Goal:** Support creating options from the filter string, skipping disabled
options in the menu/keyboard, and rendering grouped option lists.

**Steps**

- [x] Acceptance specs + docs hooks for groups, disabled, creatable
- [x] Implement in Select.js + `.d.ts`
- [x] Docs, README, CHANGELOG, types-smoke
- [x] `./check.sh`; close out

**Done when**

- Creatable, disabled options, and groups work with single and multi
- Existing Select behaviour unchanged; docs + `./check.sh` pass

**Decisions**

- `creatable`; create value = trimmed filter; `onCreateOption` for parent append
- Option `disabled`; groups are `{ name, options }` mixed into `options`
- Orphan values display as raw string until options update
- Exact-name create guard uses all flat options (not only visible) to avoid dupes

**Validation**

- `./check.sh`: 45 of 45 unit tests and 303 of 303 Playwright runs pass

**Hardening**

- Disabled options stay visible but are skipped by keyboard nav and ignore clicks
- `onCreateOption` runs before `onChange` so parents can append options first

**Limitations**

- Create always uses trimmed filter as both name and value

### Phase 38: Select multi-select + clear — Done (2026-10-28)

**Goal:** Extend Select with multi-select: array values, removable chips,
clear-all via `clearable`, and react-select-like multi defaults.

**Steps**

- [x] Acceptance specs and docs demo hooks
- [x] Implement `multi` value/chips/commit/Backspace/clear in Select + `.d.ts`
- [x] Docs Multi section, README, CHANGELOG, types-smoke
- [x] `./check.sh`; close out

**Done when**

- `multi` accepts/emits `string[]`, chips remove, clear-all and Backspace work
- Menu stays open on select; selected values hidden from the list
- Single-select unchanged; docs + `./check.sh` pass

**Decisions**

- Prop `multi` (not `isMulti`); value/`onChange` are `string[]` when multi
- Clear emits `[]`; hide selected options from menu; keep menu open on select
- Backspace with empty filter removes last chip

**Validation**

- `./check.sh`: 45 of 45 unit tests and 297 of 297 Playwright runs pass, 40.3 s

**Hardening**

- Chip remove stops propagation so outside-click does not fight the control
- Multi commit keeps focus on the combobox and repositions the portal after chips grow

**Limitations**

- No `hideSelectedOptions` opt-out (always hide when multi)
- Creatable / groups / async still Planned

### Phase 37: Select portal + searchable baseline — Done (2026-10-28)

**Goal:** Portal the Select menu so it is not clipped by overflow ancestors, and
add everyday react-select behaviour: searchable filter, clearable, max-height
scroll. Full parity deferred to follow-up phases.

**Steps**

- [x] Acceptance specs: portal-in-overflow, filter, clearable; adjust typeahead
- [x] Body-portaled fixed menu with flip, maxHeight scroll, lifecycle cleanup
- [x] Searchable filter + clearable; fix Select.d.ts (`name`, new props)
- [x] Docs Select section, README, CHANGELOG
- [x] `./check.sh`; close out

**Done when**

- Open menu is not clipped by an `overflow: auto|hidden` ancestor; options clickable
- Searchable filter and clearable work; keyboard + a11y roles hold
- Docs show the new behaviour; `./check.sh` passes
- Follow-up parity items listed under Planned

**Decisions**

- Always portal open menu to `document.body` (`z-index` 10000); no opt-out
- `searchable` default true; `clearable` default false
- Filter: case-insensitive substring on `option.name`
- Clear calls `onChange(undefined)`; options stay `{ name, value }`
- Searchable mode keeps a stable `<input role="combobox">` (no Button swap)
- No `react-select` dependency

**Validation**

- `./check.sh`: 45 of 45 unit tests and 291 of 291 Playwright runs pass, 32.9 s

**Hardening**

- Commit defers collapse via `queueMicrotask` so Enter/click finish before menu
  teardown; searchable input stays mounted across open/close
- One open menu at a time; document pointerdown ignores control + portal
- Empty filter match shows `noOptionsMessage` (default `"No options"`)

**Limitations**

- No multi/creatable/async/groups/custom render (Planned follow-ups)
- `menuPortalTarget` not configurable (always `document.body`)

### Phase 36: CharactersIcon + icon wrappers — Done (2026-10-28)

**Goal:** Ship text/symbol icon glyphs and filled disc/square shells so apps can
show initials (e.g. `MW`) or UTF-8 symbols inside avatar-style wrappers.

**Steps**

- [x] Acceptance fixtures/specs for glyph, disc, and square wrappers
- [x] Implement `CharactersIcon`, `IconDiscWrapper`, `IconSquareWrapper` + `.d.ts`
- [x] Barrel + deep exports; sync `package.json`
- [x] Docs Icons section; CHANGELOG
- [x] `./check.sh`; close out

**Done when**

- CharactersIcon shows `text` or children; wrappers fill and shape correctly
- Deep imports + barrel register the custom elements
- Docs Icons section demos them
- `./check.sh` passes

**Decisions**

- Content: prefer `text` when set, else children
- Wrappers: filled avatar-style (`theme.mix(tone, 12)`), center children, `size` +
  `color`; disc `border-radius: 50%`, square `var(--janus-radius)`
- Default `size` 24; glyph font ~40% of size; no name→initials derivation
- Decorative unless `aria-label` / `title`; files beside other kit components

**Validation**

- `./check.sh`: 45 of 45 unit tests and 282 of 282 Playwright runs pass, 32.4 s

**Limitations**

- None new

### Phase 35: Logo center bar — Done (2026-10-26)

**Goal:** Remove the filled vertical bar through the Janus logo caused by a
broken evenodd cutout, while keeping the intentional gap between halves.

**Steps**

- [x] Drop the full-height center-bar subpaths; clip each half with a 2-unit gap
- [x] Uniquify `clipPath` ids when `Logo` inlines the SVG
- [x] Regenerate `favicon.ico` from the fixed SVG (gold + mid slate)
- [x] Visual check; `./check.sh`; close out

**Done when**

- Logo halves show a clean transparent gap, not a filled/inverted center strip
- Smile and eyes remain transparent cutouts on both themes
- Favicons load; `./check.sh` passes

**Decisions**

- Gap stays (Phase 13 intent); implemented with per-half `clipPath` instead of
  an evenodd rectangle that painted outside each face
- `Logo` suffixes clip ids per instance so header and About do not clash

**Validation**

- Visual: `/docs/logo.svg` and demo header/About logos — no filled bar; gap and
  cutouts read correctly
- `./check.sh`: 45 of 45 unit tests and 276 of 276 Playwright runs pass, 30.3 s

**Limitations**

- None new

### Phase 34: Nested modal stack + Select typeahead — Done (2026-10-26)

**Goal:** Modals stack instead of replacing; Select typeahead; drop the
misleading trust bullet about children becoming text nodes (nested `html`
variables already work).

**Steps**

- [x] Modal stack: push/pop layers; Escape/focus/scroll on top; `input()` scoped
- [x] Select typeahead + acceptance specs
- [x] Remove misleading trust children bullet; README modal/select notes
- [x] CHANGELOG; `./check.sh`; close out

**Done when**

- Nested `modal.dialog` stacks; Escape/`closeModal` pop top only
- Select typeahead moves active option and commits
- Trust section no longer claims children cannot be nested templates
- `./check.sh` passes

**Decisions**

- Out of scope: `display: contents`, style-GC leftovers, Shadow DOM
- Runtime child insertion unchanged: strings/numbers → text; nested `html`/nodes
  → elements (already); only the misleading README bullet was removed

**Validation**

- `./check.sh`: 45 of 45 unit tests and 270 of 270 Playwright runs pass, 32.3 s

**Limitations**

- None new for this phase

### Phase 33: Node-safe import, soft-reclaim, trust, gates, bounded a11y — Done (2026-10-25)

**Goal:** Core import works without `document`; style GC soft-reclaims so remounted
DOM stays styled; trust model documented; `tsc` in the gate; Navbar/Accordion/
modal scroll-lock; Pages runs `./check.sh`; BuildKit retries.

**Steps**

- [x] Lazy document install; Node import smoke
- [x] Soft-reclaim style GC + remount acceptance test
- [x] README trust section
- [x] TypeScript `tsc --noEmit` in Docker CMD + types-smoke
- [x] Navbar radiogroup, Accordion stable keys, modal scroll-lock + specs
- [x] Pages workflow runs `./check.sh`; docs barrel note in README
- [x] `check.sh` docker build retries
- [x] CHANGELOG; `./check.sh`; close out

**Done when**

- Node imports core + Button without `document`
- Remount after soft reclaim restores styles; existing GC specs pass
- README has trust + Node + docs-barrel notes; `tsc --noEmit` in gate
- Navbar/Accordion/modal specs pass; Pages runs check; build retries
- `./check.sh` passes

**Decisions**

- Soft-reclaim keeps registry/`cssText`, only drops CSSOM rules until retain
- Trust model is documentation only (no sanitizer)
- TypeScript is check-only; no emit of the library
- A11y scope: Navbar, Accordion keys, modal scroll-lock only
- Docs gallery keeps the `./ui` barrel on purpose

**Validation**

- `./check.sh`: 45 of 45 unit tests and 264 of 264 Playwright runs pass, 47.1 s
  (plus `tsc --noEmit`)

**Limitations**

- No SSR/hydration
- `html\`...\`` kit tags remain untyped beyond `*Props` imports

### Phase 32: Import hardening + style-GC animation fix — Done (2026-10-25)

**Goal:** Docs navigation no longer breaks animated kit components; deep UI
imports stay lean; theme CSS is lazy; exports are manifest-driven with
per-icon paths and useful `*Props` types.

**Steps**

- [x] P0: CSSOM insert/delete for style GC (no textContent rewrite)
- [x] Lazy theme tokens; Node import smoke
- [x] exports.manifest.json + sync script + sideEffects
- [x] Per-icon modules + tighter Props types
- [x] README/CHANGELOG; `./check.sh`; close out

**Done when**

- Spinners still animate after docs hash navigation away and back
- Theme tokens not installed by evaluating `theme.js` in Node
- package.json exports/sideEffects match the manifest; per-icon imports work
- Deep component entries export `*Props` types; `./check.sh` passes

**Decisions**

- Style GC uses insertRule/deleteRule; rejected rules go to a non-GC legacy sheet
- Manifest is source of truth; sync script updates package.json; tests check drift
- Theme helpers call `ensureThemeTokens`; `dismissButton` is a lazy getter
- Per-icon modules under `src/janus/ui/icon/`; shared `IconProps` in `icon.d.ts`
- Docs sections are factories (`() => html\`...\``) so hash navigation does not
  reuse DOM whose style classes were already reclaimed

**Validation**

- `./check.sh`: 44 of 44 unit tests and 252 of 252 Playwright runs pass, 36.9 s

**Limitations**

- Apps that cache live kit DOM across unmounts can still lose style rules if they
  keep class names after GC; create fresh trees (or keep refs live) when remounting

### Phase 31: Per-component UI entry points — Done (2026-10-25)

**Goal:** Deep imports like `janus-elements/ui/button` register only that
component and its real deps; `janus-elements/ui` remains the full kit barrel.

**Steps**

- [x] Retarget theme/util imports; Select/modal import Button/Input
- [x] package.json deep exports + register/theme/util/modal/toast/router d.ts
- [x] Specs, README, CHANGELOG; `./check.sh`; close out

**Done when**

- Importing Button alone does not register unrelated kit tags
- `./ui` still registers the full kit; `./check.sh` passes

**Decisions**

- Kebab-case subpaths; `./ui` kept as convenience barrel
- Components import `./theme.js` / `./util.js`, never the barrel
- modal/Select side-effect-import Button (and Input for modal)

**Validation**

- `./check.sh`: 43 of 43 unit tests and 246 of 246 Playwright runs pass, 29.8 s

**Limitations**

- Icons remain one entry (`./ui/icons`); no per-icon package paths
- Docs site import map still uses the full `./ui` barrel

### Phase 30: Kit accessibility (Select, modal, Field, Tooltip) — Done (2026-10-25)

**Goal:** Select, modal, Field, and Tooltip meet baseline a11y: combobox/listbox
+ keys; dialog focus trap / Escape / restore-focus; `aria-describedby` links.

**Steps**

- [x] Select combobox/listbox roles, activedescendant, keyboard
- [x] Modal dialog role, escapable Escape, focus trap, restore focus
- [x] Field and Tooltip `aria-describedby` wiring
- [x] Specs, README, CHANGELOG; `./check.sh`; close out

**Done when**

- The four components expose the roles/relationships above
- Select keyboard-operable; modal traps focus and honours `escapable`
- Field and Tooltip wire `aria-describedby`; `./check.sh` passes

**Decisions**

- Keep custom Select and imperative modal; options use `role="option"` (not Button)
- `escapable` defaults true; false disables Escape and backdrop click
- Field/Tooltip set `aria-describedby` on the first nested control after render
- Component hosts do not get `role` / `aria-*` attributes from props (forwarded
  onto the real control; hosts are `display: contents`)

**Validation**

- `./check.sh`: 43 of 43 unit tests and 243 of 243 Playwright runs pass, 21.8 s

**Limitations**

- No combobox typeahead; no modal scroll-lock or nested stack

### Phase 29: Reclaim unused style rules — Done (2026-10-25)

**Goal:** Distinct `style=${{…}}` rules are removed from the shared sheets when
no live element still uses their class.

**Steps**

- [x] Playwright specs: reclaim unused rules; shared rule survives
- [x] Refcount registry + microtask sheet rebuild in createTemplateFunction.js
- [x] retain/release on morph insert, remove, and class sync in render.js
- [x] README + CHANGELOG; `./check.sh`; close out

**Done when**

- Unused generated rules are removed after their last live user is gone
- Shared rules stay while any live user remains
- Stable-style behaviour unchanged; `./check.sh` passes

**Decisions**

- Live-DOM refcounting during morph; ephemeral template trees do not retain
- Rebuild sheet `textContent` when refs hit 0 (no `insertRule`/`deleteRule`)
- Coalesce rebuilds with `queueMicrotask`; zero-ref entries are kept until that
  sweep so a later sibling in the same morph can retain a class another sibling
  just released

**Validation**

- `./check.sh`: 43 of 43 unit tests and 234 of 234 Playwright runs pass, 26.2 s

**Limitations**

- Theme / `#janus-components` layout rules are not reclaimed (out of scope)

### Phase 28: CI gate + public `.d.ts` — Done (2026-10-25)

**Goal:** Pushes run the same Docker gate as local `./check.sh`, and consumers
of `janus-elements` / `janus-elements/ui` get IDE types from published `.d.ts`
files.

**Steps**

- [x] Record phase; add `.github/workflows/check.yml` running `./check.sh`
- [x] Hand-written `src/janus/index.d.ts` and `src/janus/ui/index.d.ts`
- [x] Wire `package.json` `types` / `exports`; extend package tests
- [x] README + CHANGELOG; `./check.sh`; close out

**Done when**

- Workflow runs `./check.sh` on push/PR to patriarch, main, master
- Both entry points ship `.d.ts`; pack list and export `types` conditions pass
- `./check.sh` passes

**Decisions**

- Hand-written `.d.ts` only; no TypeScript dependency or compile step
- Types cover exported API only (not side-effect-registered kit tags)
- Check workflow separate from Pages deploy

**Validation**

- `./check.sh`: 43 of 43 unit tests and 228 of 228 Playwright runs pass, 22.1 s
- `npm pack --dry-run` lists `src/janus/index.d.ts` and `src/janus/ui/index.d.ts`

**Limitations**

- No `tsc --noEmit` in the gate (no TypeScript dependency)
- Kit custom-element tags used only via `html\`...\`` remain untyped

### Phase 27: Docs sidebar tree navigation — Done (2026-10-25)

**Goal:** Replace the three-tab docs Navbar with a collapsible left tree
(fullscreen on mobile), one hash route per leaf, and section modules.

**Steps**

- [x] `nav.js` tree + `SideNav` (desktop collapse, mobile fullscreen)
- [x] Split Home / Library / Gallery / UiKit into `docs/sections/*`
- [x] Rewrite `App.js`; remove AppNav and old pages
- [x] Rewrite docs/component/theme/stable-styles specs; README; `./check.sh`

**Done when**

- All former content reachable via the tree; hash deep links and history work
- Desktop sidebar + mobile fullscreen nav work; `./check.sh` passes

**Validation**

- `./check.sh`: 42 of 42 unit tests and 231 of 231 Playwright runs pass, 24.0 s

**Limitations**

- Docs-only SideNav (not a kit export)
- Select “opens upwards” gallery assertion dropped; downwards still covered

### Location render + AppNav cleanup — Done (2026-10-25)

**Goal:** Remove the docs App `generation` subscription hack by adding
`<Location render>` and an `AppNav` that uses it.

**Steps**

- [x] Add `<Location render=${(loc) => …} />`; export it
- [x] Docs `AppNav` + slim `App`; docs/README mentions
- [x] Fixture asserts Location updates; `./check.sh`

**Done when**

- Docs Navbar tracks the URL without App subscribing
- `./check.sh` passes

**Validation**

- `./check.sh`: 42 of 42 unit tests and 234 of 234 Playwright runs pass, 28.6 s

### Phase 26: Hash + path Router, wire docs App — Done (2026-10-25)

**Goal:** Developers can route with `hashRegex`, `pathnameRegex`, or both
(OR). Docs Navbar drives location via `pushHash`; Routes render Home /
Library / UI kit.

**Steps**

- [x] `routeLocation.js` helpers + `Router.js` (`Router`, `Route`, push helpers)
- [x] Export from `ui/index.js`; delete `Router.tsx`
- [x] Wire docs `App.js` (hash routes, active tab from location)
- [x] Gallery example + Library / UiKit / README mention
- [x] Unit + browser tests; `./check.sh`

**Done when**

- Routes match hash and/or pathname; `pushHash` / `pushPathname` update
  location and notify listeners
- Docs Navbar uses routing; deep links and back/forward work
- Inspiration `.tsx` gone; `./check.sh` passes

**Validation**

- `./check.sh`: 42 of 42 unit tests and 234 of 234 Playwright runs pass, 29.6 s

**Decisions**

- Match is OR when either regex is set (same page can answer hash or path)
- Docs Navbar uses hash only so pathname-at-home does not double-show pages
- No React Context; `Route` self-subscribes to `popstate` + `pushstate`
- Optional `basename` strips a path prefix before pathname regex

**Hardening**

- Zero in-scope findings beyond the fixture locator strict-mode fix (class on
  host and inner button)

### Tooltip rich content empty with `html` markup — Done (2026-10-25)

**Goal:** `<Tooltip tooltip=${html\`...\`}>` shows the markup in the bubble.

**Steps**

- [x] Skip whitespace text nodes when wrapping triggers
- [x] Clone DOM tooltip content per bubble so triggers do not share one node
- [x] Spec for gallery rich tooltip; `./check.sh`

**Done when**

- Gallery rich tooltip bubble contains Bold / italic markup on the button trigger
- `./check.sh` passes

**Validation**

- `./check.sh`: 31 of 31 unit tests and 225 of 225 Playwright runs pass, 29.8 s
  Playwright after image warm.

### Phase 25: SVG line-art icons (static + SMIL) — Done (2026-10-25)

**Goal:** Ship twenty named icon components (`SearchIcon` … `PlayIcon`) in
`janus-elements/ui`, each with optional `animated`, backed by forty line-art
SVG files (static plus SMIL-animated) that match the kit’s stroke and color
conventions.

**Steps**

- [x] Forty SVGs under `src/janus/ui/icons/` (`{name}.svg` / `{name}-animated.svg`)
- [x] `createIcon` factory + `icons.js`; import from `ui/index.js`
- [x] Gallery Icons section (static + animated), README/UiKit mention
- [x] Specs: render, color, SMIL when animated, static under reduced motion
- [x] `./check.sh` and close out

**Done when**

- All twenty `<XIcon>` / `<XIcon animated>` work after `import "janus-elements/ui"`
- Forty SVG files ship under `src/janus/`
- Gallery shows static and animated sets; snippets match live markup
- Specs cover render, color, SMIL presence, and reduced-motion fallback
- `./check.sh` passes

**Decisions**

- Top 20: Search, Menu, Close, Home, User, Settings, Cart, Heart, Bell,
  Chevron, Check, Plus, Trash, Edit, Share, Star, Lock, Eye, Envelope, Play
- One custom element per icon; `animated` boolean prop; no generic `<Icon name>`
- Motion lives only in `*-animated.svg` as scoped CSS `@keyframes` (SMIL looked
  wrong in Firefox: `additive` / nested `animateTransform`); load via
  `fetch(import.meta.url)` like Logo
- Factory registers named classes (not twenty near-duplicate files)
- `prefers-reduced-motion: reduce` always loads the static SVG
- Visual: 24×24, stroke `currentColor`, width 1.75, round caps/joins
- Gallery lists icons explicitly; Janus templates cannot use dynamic tag names

**Validation**

- `./check.sh`: 31 of 31 unit tests and 222 of 222 Playwright runs pass, 29.9 s
  Playwright after image warm.

**Hardening findings**

- `pendingFile` guards against re-fetch loops when `setState` re-enters
  `componentWillReceiveProps` before state is assigned
- Animated SVGs use CSS (`transform-box: fill-box`) for Chromium and Firefox
- Default decorative (`aria-hidden`); `aria-label` / `title` expose `role="img"`

### Phase 24: Gallery snippets match live examples — Done (2026-10-24)

**Goal:** Each UI kit gallery snippet shows the same components, labels and
props as the live example above it.

**Steps**

- [x] Align every `snippets.*` entry with its section’s live markup
- [x] Update the Select-props highlight assertion if the snippet text changes
- [x] Spec that Form controls snippet names match the live controls
- [x] `./check.sh` and close out

**Done when**

- Form controls snippet uses Email notifications, Compact layout, Plan, and the
  Email/Username fields shown live
- Other section snippets use the same labels, tones and handlers as the live
  examples (tone rows may list each tone rather than a `.map`)
- `./check.sh` passes

**Decisions**

- Snippets list concrete tags (not `.map`) so markup highlighting stays simple
- Alert-dismiss spec scopes to `role="alert"` only, so matching snippet text
  does not count as a still-visible alert

**Validation**

- `./check.sh`: 31 of 31 unit tests and 210 of 210 Playwright runs pass, 24.6 s
  Playwright after image warm.

### Phase 23: Library docs — styles and props — Done (2026-10-24)

**Goal:** The Library page documents nested style selectors and how a child
receives props (including a callback that updates parent state), each with a
live example and a highlighted snippet.

**Steps**

- [x] Acceptance specs for nested-style demo and parent/child callback example
- [x] Styles section: prose + live demo + snippet (`:hover`, `>…`, descendants)
- [x] Parent/child example beside Counter; keep Counter as the minimal case
- [x] `./check.sh` and close out

**Done when**

- Library explains nested style keys and shows a live element using `:hover`, a
  child combinator, and a descendant selector
- Library shows a parent holding state and a child calling a prop to change it
- Specs cover the style demo’s nested text colour and the child-driven state
  update
- `./check.sh` passes

**Decisions**

- Call nested style keys “nested selectors” (README: nested keys are selectors)
- Parent/child demo is a stepper: child gets `onStep`, parent owns `value`

**Validation**

- Red: both new Library specs failed in all three browsers (no “Nested
  selectors” copy, no `janus-stepper`).
- `./check.sh`: 31 of 31 unit tests and 207 of 207 Playwright runs pass, 57.2 s
  Playwright after image warm.

**Hardening findings**

- None beyond the agreed coverage; hover styling is demonstrated live but not
  asserted (Playwright checks the nested `b` colour and `>code` font size).

### Phase 22: Docs syntax highlighting — Done (2026-10-24)

**Goal:** Highlight Home/Library snippets as JavaScript and each UI kit example
snippet with Prism, vendored under `docs/vendor/prism/`.

**Steps**

- [x] Vendor Prism 1.29.0 (core, markup, css, clike, javascript, js-templates)
  and a Janus-token theme
- [x] `CodeSnippet` component; wire scripts in `docs/index.html`
- [x] Home/Library use `language-javascript`; Gallery examples use `markup`
- [x] Specs and `./check.sh`

**Done when**

- Home and Library show `.token` nodes under `code.language-javascript`
- UI kit gallery has markup snippets with `.token.tag` on each major example
- `./check.sh` passes

**Decisions**

- Prism vendored in-repo (no CDN) so Playwright stays offline-safe
- UI snippets are plain markup (no `html\`...\`` wrapper). Highlighting through
  lit-html/JS Templates left tags as one escaped blob, so markup language is used
  instead.
- Gallery snippet copy avoids duplicating live example strings that specs assert

**Validation**

- `./check.sh`: 31 of 31 unit tests and 201 of 201 Playwright runs pass, 30.4 s
  Playwright after image warm.
- Follow-up: gallery uses `language-markup` (plain tags, no `html\` wrapper`);
  `./check.sh` 201/201 Playwright pass after the switch.
- Follow-up: `${...}` in markup broke Prism tags (nested braces → full escape).
  `CodeSnippet` extracts interpolations, highlights markup, reinjects JS-highlighted
  spans; theme tints code boxes off `--janus-bg` so they read on light surfaces.

### Phase 21: Docs site for GitHub Pages — Done (2026-10-24)

**Goal:** Ship a `docs/` site with website, documentation and live examples for
the core library and UI kit; deploy via GitHub Actions that syncs `src/janus`
into `docs/lib`; absorb and delete `demo/`.

**Steps**

- [x] Acceptance specs for `/docs/` (nav Home / Library / UI kit, gallery, counter)
- [x] `docs/sync-lib.sh`, `.gitignore` for `docs/lib/`, wire into Playwright and
  `npm run dev`
- [x] Docs SPA: import map, App, Logo, Home, Library, UiKit + Gallery
- [x] Delete `demo/`; retarget specs; README and TODO
- [x] `.github/workflows/pages.yml`
- [x] `./check.sh` and close out

**Done when**

- `/docs/` loads with Home, Library, UI kit; Library counter updates on click;
  UI kit gallery retains prior coverage
- `npm run docs` serves <http://127.0.0.1:8000/docs/> after sync
- `docs/lib/` gitignored; pack still excludes docs
- Workflow present; README documents local preview and enabling Pages

**Decisions**

- Pages from `/docs` only; Action copies `src/janus` → `docs/lib/janus`
- Absorb `demo/` into docs; import map uses `janus-elements` → `./lib/janus/...`
- No new site dependencies; plain `<pre><code>` snippets
- Toast duration spec imports `janus-elements/ui` (import map) so it reuses the
  module already loaded by the docs page, avoiding double `customElements.define`

**Validation**

- `./check.sh`: 31 of 31 unit tests and 195 of 195 Playwright runs (65 specs ×
  3 browsers) pass, 17.4 s Playwright after image warm.

**Limitations**

- Pages deploy needs the repo Settings → Pages → Source: GitHub Actions (user).
  Until then the public URL is unverified.

### Phase 20: Package `janus-elements` 0.1.0 — Done (2026-10-24)

**Goal:** Janus is ready to publish to npm as `janus-elements` 0.1.0; the user
runs `npm publish` (approved on 2026-10-24).

**Steps**

- [x] Tests: package name and version, published file list, export paths,
  changelog version; confirm they fail today
- [x] `package.json`: name, version, `exports`, `files`, keywords; remove
  `private`
- [x] `LICENSE` (MIT, as `package.json` already declares) and `CHANGELOG.md`
- [x] `README.md`: installation, using it without a build step, and the release
  process

**Done when**

- `npm pack --dry-run` lists only `package.json`, `README.md`, `LICENSE`,
  `CHANGELOG.md` and files under `src/janus/`.
- The `exports` entries `janus-elements` and `janus-elements/ui` load in a
  browser and expose the documented exports.
- The newest `CHANGELOG.md` entry matches the package version.
- All specs pass in all three browsers.

**Decisions** (approved on 2026-10-24)

- Name `janus-elements`; version 0.1.0; semver, where breaking changes bump the
  minor version until 1.0.
- Prepared, not published: publishing is outward-facing and cannot be undone,
  so the user runs `npm publish`.
- `exports`: `.` is `src/janus/index.js` and `./ui` is `src/janus/ui/index.js`.
  The source is published as is, since there is no build step.
- The package keeps its import side effects (registering elements, installing
  stylesheets), so it does not declare `sideEffects: false`.

**Validation**

- Red: all three package unit tests failed (name `Janus`, version 1.0.0,
  `private`, no `CHANGELOG.md`) and the exports spec found no `exports`.
- `npm pack --dry-run` in the test image: `janus-elements-0.1.0.tgz`, 38 files,
  22.8 kB packed, 80.4 kB unpacked: `package.json`, `README.md`, `LICENSE`,
  `CHANGELOG.md` and the 34 library files. No tests, demo, Docker or planning
  files.
- `./check.sh`: 31 of 31 unit tests and 192 of 192 Playwright runs (64 specs ×
  3 browsers) pass, 119.4 s.
- `package-lock.json` was refreshed with `--package-lock-only`; nothing was
  installed on the host.

**Limitations**

- Not published; the user runs `npm publish`. The CDN import map in the README
  works only once the package is on npm, so it is unverified.
- The library touches `document` when imported, so it cannot be imported in
  Node or during server-side rendering.

**Follow-up** (2026-10-24): GitHub repo renamed to `janus-elements`. Added
`repository`, `homepage` and `bugs` to `package.json`; README title and link
point at [dotmonk/janus-elements](https://github.com/dotmonk/janus-elements).
`origin` already tracks that remote. Library folder renamed `src/Janus/` →
`src/janus/` (exports, imports, docs and package `files` updated). Custom-element
prefix `janus-*` and demo brand "Janus" are unchanged.

### Phase 19: Stable style class names — Done (2026-10-24)

**Goal:** Identical style objects share one class and one rule set, so
re-renders stop rewriting `class` attributes and `<style>` elements (user
approved on 2026-10-24).

**Steps**

- [x] Specs: identical styles share a class, a re-render keeps classes,
  components render no `<style>` elements; confirm they fail today
- [x] Class names from a hash of the generated CSS; rules go into shared
  stylesheets in `<head>`, each inserted once
- [x] A component's `style` goes into a second stylesheet after the first, so
  it still wins over the component's own styles

**Done when**

- Two elements with the same style object have the same class.
- Re-rendering a component leaves the classes of unchanged elements as they
  were.
- Template output contains no `<style>` elements for style objects.
- `style` on a component still overrides the component's own styles.
- All specs pass in all three browsers.

**Decisions**

- The class is `janus-` plus a hash of the CSS generated for the style object;
  a collision with different CSS gets a numbered suffix.
- Rules are appended as text to two `<style>` elements in `<head>`: one for
  style objects, one after it for components' `style` props. Text is used
  instead of `insertRule`, because a rule one browser rejects (such as
  `::-webkit-details-marker` in Firefox) would make `insertRule` throw.
- Rules are never removed; an app that generates unbounded distinct styles
  grows the stylesheet. Recorded as a limitation.

**Validation**

- Red (Chromium): two identical Buttons had different classes, a re-render
  changed a Button's class, and the gallery contained 300 `<style>` elements.
- `./check.sh`: 28 of 28 unit tests and 189 of 189 Playwright runs (63 specs ×
  3 browsers) pass, 123.8 s. The style-precedence specs from Phase 16 and the
  contrast audit pass unchanged.
- Probe on the gallery: no `<style>` elements from style objects (the 2 left in
  `<body>` are BaseTheme's and the inline logo SVG's), 179 shared rules for 301
  styled elements plus 4 override rules, and no new rules after 5 re-renders.
  Screenshots in both themes match.

**Limitations**

- ~~Rules are never removed~~ — addressed in Phase 29 (refcount + reclaim).
- The stylesheets are appended to `<head>` when the library loads, so app
  stylesheets added later win at equal specificity.

### Phase 18: SVG in templates — Done (2026-10-24)

**Goal:** Templates can draw SVG: elements inside `<svg>` are created in the
SVG namespace (user approved on 2026-10-24).

**Steps**

- [x] Specs: SVG elements get the SVG namespace, `viewBox` keeps its case, a
  re-render updates SVG attributes, events work, `<foreignObject>` content is
  HTML; confirm they fail today
- [x] The template passes a namespace down while creating elements

**Done when**

- `<svg>` and its descendants are real SVG elements, and content inside
  `<foreignObject>` is HTML again.
- Re-rendering updates attributes of SVG elements, and SVG elements take event
  handlers.
- All specs pass in all three browsers.

**Decisions**

- `<svg>` switches to the SVG namespace for itself and its descendants;
  `<foreignObject>` switches its children back to HTML.
- Added during the work: tags that exist only in SVG are created in the SVG
  namespace even outside an `<svg>`, because a nested template inside an
  `<svg>` (`${points.map(...)}`) is evaluated on its own. Tags that also exist
  in HTML (`a`, `title`, `style`, `script`) follow the surrounding context.
- The demo's Logo keeps fetching `logo.svg`: that file is the single source for
  the favicon and the README, so inlining the markup in a template would
  duplicate it. Templates no longer need that workaround.

**Validation**

- Red (Chromium): `<svg>`, `<circle>` and `<foreignObject>` were HTML
  elements; after the first fix, `<rect>` from a nested template was still
  HTML. The attribute-and-event spec passed before the fix (it also works on
  unknown HTML elements) and now runs against real SVG elements.
- `./check.sh`: 28 of 28 unit tests and 180 of 180 Playwright runs (60 specs ×
  3 browsers) pass, 108.3 s. One build attempt hit the BuildKit snapshot error
  again; the retry passed.

**Limitations**

- An ambiguous tag (`a`, `title`, `style`, `script`) at the root of a nested
  template inside an `<svg>` is created as HTML.
- `xlink:` attributes are set without their namespace; SVG 2 `href` works.

### Phase 17: Keep attributes the browser toggles — Done (2026-10-24)

**Goal:** Re-rendering removes only attributes the template set, so attributes
the browser or other scripts add, such as `open` on `<details>`, survive (user
approved on 2026-10-24).

**Steps**

- [x] Specs: a browser-toggled attribute survives a re-render; an attribute the
  template stops setting is removed; confirm the first fails today
- [x] Elements record the attributes the template set; the renderer removes
  only those

**Done when**

- A plain `<details>` opened by the user stays open when its component
  re-renders.
- A conditional attribute is still removed when the template stops setting it,
  and generated style classes still update.
- All specs pass in all three browsers.

**Decisions**

- Each element created by the template stores the names of the attributes the
  template set (`janusAttributes`), including the class added for a component's
  `style`. Elements not created by the template, such as the SVG the demo's
  Logo parses, keep the previous behavior.

**Validation**

- Red (Chromium): the opened `<details>` closed on re-render; the spec for
  removing a conditional attribute already passed and stays as a guard.
- `./check.sh`: 28 of 28 unit tests and 171 of 171 Playwright runs (57 specs ×
  3 browsers) pass, 104.7 s.

**Limitations**

- An attribute the template set once and the browser later changed is still
  overwritten by the template's value on the next render, as before.
- Accordion keeps its own open state; that still matters when its items are
  rebuilt by the parent, so it was left as is.

### Phase 16: `style` goes to the component's root — Done (2026-10-24)

**Goal:** A component's `style` prop styles its root element once; the
component's own element takes no part in layout (user chose this option on
2026-10-24).

**Steps**

- [x] Specs: wrappers are layout-transparent and unstyled, `style` reaches the
  root, layout styles work through the wrapper; confirm they fail today
- [x] Registered components get `display: contents` from a stylesheet that
  `Component.register` maintains
- [x] The template no longer turns a component's `style` into a class on the
  wrapper; `Component` applies `style` to the first element it renders
- [x] Select measures its root instead of its wrapper
- [x] Update `README.md`

**Done when**

- Component elements compute `display: contents`, have no boxes and get no
  generated class.
- `style` on Button and Panel reaches their root element (margins, padding).
- A layout style such as `flex-grow` on a component works inside a flex
  container.
- All specs pass in all three browsers.

**Decisions** (approved on 2026-10-24)

- `display: contents` comes from a stylesheet rule per registered element,
  wrapped in `:where()` so an app can still give a component a box.
  It is not an inline style, because custom element constructors may not add
  attributes and the renderer would remove one added later.
- Changed during the work: instead of every component applying `style`
  itself, `Component` adds it as a class on the first element of the render
  output, after the component's own styles. This covers custom components too,
  so it is not breaking for them, and Button, Panel, Label and Spinner dropped
  their own merging. A live node (re-slotted content) is never given the class.

**Validation**

- Red (Chromium): the wrapper spec failed. The Panel's inline wrapper had 3
  boxes (the dialog glitch from Phase 12) and both wrappers had a generated
  class. The root-style and flex specs already passed and stay as guards.
- `./check.sh`: 28 of 28 unit tests and 165 of 165 Playwright runs (55 specs ×
  3 browsers) pass, 104.1 s.
- A screenshot of the whole gallery matches the earlier layout.

**Hardening findings**

- Component elements no longer have a box, so `scrollIntoView`,
  `getBoundingClientRect` or an IntersectionObserver on them stop working. The
  Select direction specs scrolled the wrapper and silently stopped scrolling;
  they now scroll the Select's root, and Select measures its root. Documented
  in `README.md`.

**Limitations**

- A component that renders several top-level elements (Tooltip with several
  children) gets `style` on the first one only.

### Rename `t` to `html` — Done (2026-10-24)

**Goal:** The template tag is `html` everywhere; `t` is no longer exported
(the user's change, reviewed and repaired on request).

**Decisions**

- `src/janus/index.js` exports `Component`, `html` and `render`. The browser
  suite's local stand-in is also called `html`.
- `PLAN.md`, `PLAN-archive.md` and `FRICTION.md` keep their original wording
  about `t`, because they record what was true at the time.

**Validation**

- The rename's find-and-replace also turned every other `t` followed by a
  backtick into `html`, damaging 49 places: 7 code lines (including invalid CSS
  in Tooltip's arrow color and broken parser test strings) and 42 lines of
  documentation. All were restored; a search for a word character followed by
  "html" and a backtick finds nothing.
- `./check.sh`: 28 of 28 unit tests and 156 of 156 Playwright runs (52 specs ×
  3 browsers) pass, 105.6 s. The API spec now checks that `t` is not exported.

### Phase 15: Numbers in spread props — Done (2026-10-24)

**Goal:** Values in a spread props object (`${{ ... }}`) are used as given,
including numbers (user approved on 2026-10-24).

**Steps**

- [x] Tests in the `test.html` suite; confirm they fail today
- [x] Resolve the template's own variables before merging spread objects
- [x] Remove Progress's string workaround

**Done when**

- `<p ${{ "data-count": 5 }}>` renders `data-count="5"`, also next to other
  variables.
- A spread still overrides a static attribute of the same name.
- All specs pass in all three browsers.

**Decisions**

- Cause: the parser stores a template variable as its index number, and spread
  objects were merged into those parsed props before the indexes were
  resolved, so a number from a spread looked like an index. Static props are
  now resolved first; spread values are always literal.

**Validation**

- Red (Chromium): the `test.html` suite reported 2 failures, `<p></p>` instead
  of `data-count="5"`, and `data-count="x"` instead of `"1"`. The override and
  plain-variable cases passed and stay as guards.
- `./check.sh`: 28 of 28 unit tests and 159 of 159 Playwright runs pass,
  122.3 s. The Progress spec now covers numbers passed through a spread.

**Limitations**

- None known. Spread values that were numbers previously produced wrong or
  missing attributes, so no working code depended on the old behavior.

### Phase 14: New UI kit components — Done (2026-10-24)

**Goal:** Add the common components the UI kit lacked, each themed, accessible,
shown in the gallery and covered by tests (user picked all four groups on
2026-10-23).

**Steps**

- [x] Batch 1, form controls: Checkbox, RadioGroup, Switch, Field
- [x] Batch 2, feedback: Alert, toast, Progress
- [x] Batch 3, navigation and layout: Tabs, Accordion, Card
- [x] Batch 4, data display: Table, Pagination
- [x] Each batch: specs first and confirmed failing, then the components, a
  gallery section and the full gate
- [x] Update `README.md`; archive the oldest `## Done` entry

**Done when**

- Checkbox and Switch toggle by click and Space and report `checked` through
  `onChange`; RadioGroup moves with the arrow keys; Field's label targets its
  control and shows hint and error text.
- Alerts use `role="alert"` for errors and warnings and can be dismissed;
  toasts appear in a live region and disappear after their duration or when
  closed; Progress exposes `role="progressbar"` with its value.
- Tabs follow the WAI-ARIA tabs pattern, including arrow keys; an opened
  Accordion item stays open when its parent re-renders; Card shows title, body
  and footer.
- Table renders its columns and rows; Pagination moves pages, marks the current
  one with `aria-current`, disables Previous and Next at the ends and collapses
  long ranges with an ellipsis.
- The contrast audit passes in both themes with every new component in the
  gallery, including 3:1 borders on checkboxes, radios and switches.
- All specs pass in all three browsers.

**Decisions**

- Native elements first: checkbox and radio inputs (drawn with
  `appearance: none`, so they follow the theme and keep native keyboard and
  form behavior), a checkbox with `role="switch"` for Switch, `<details>` for
  Accordion, `<table>` for Table. Tabs and Pagination use buttons with ARIA.
- APIs:
  - `<Checkbox checked onChange>Label</Checkbox>` and
    `<Switch checked onChange>Label</Switch>`;
  - `<RadioGroup name value options onChange />`, where `options` are
    `{ name, value }` like Select's;
  - `<Field label hint error>control</Field>`;
  - `<Alert color title onClose>`;
  - `toast.show(message, { color, duration })`, imperative like `modal`;
  - `<Progress value max label />`, indeterminate when `value` is missing;
  - `<Tabs tabs=${[{ title, content }]} />`;
  - `<Accordion items=${[{ title, content }]} />`;
  - `<Card title subtitle footer>`;
  - `<Table columns rows caption />`, where `columns` are
    `{ key, title, align }` and `rows` use `row.id` as list key;
  - `<Pagination page pages onChange />`.
- The renderer syncs the `checked` property when the `checked` attribute
  changes, as it already does for `value`, so a controlled checkbox updates
  after the user has clicked it.

**Validation**

- Each batch failed first in Chromium: 5 form-control specs, 4 feedback
  specs, 3 navigation-and-layout specs, 3 data-display specs.
- `./check.sh` after the last batch: 28 of 28 unit tests and 159 of 159
  Playwright runs (53 specs × 3 browsers) pass, 111.8 s. The contrast audit
  covers every new gallery section in both themes, including 3:1 borders on
  checkboxes, radios and switches.
- Screenshots of the form controls in Chromium, Firefox and WebKit match;
  screenshots of feedback, layout, data and toasts in both themes look right.

**Hardening findings**

- The contrast audit treated a checkbox's default `value="on"` as visible
  text; it now reads values of text inputs only.
- Cards in a grid row had different heights; the card now fills its cell, so
  footers line up (probe: 190 px each).
- Numbers inside a spread props object are read as template variable indexes
  (probe: `{ "data-count": 5 }` is dropped, and `{ "data-count": 1 }` takes
  another variable's value). Progress passes strings to avoid it. Recorded
  under Known bugs; fixing it touches the template core and was outside this
  phase.
- The BuildKit snapshot error hit again (see `FRICTION.md`); a retry passed.

**Limitations**

- ~~Field does not link its hint and error with `aria-describedby`~~ —
  addressed in Phase 30.
- Toasts do not pause on hover or focus.
- Accordion keys its open state by item position.
- Table has no sorting or selection.

### Phase 13: Logo — Done (2026-10-23)

**Goal:** Replace the old split-face logo with a clean version in the theme's
colors, and use it in the demo header, the favicon and the README (user
approved on 2026-10-23).

**Steps**

- [x] Draw the logo as one SVG; compare variants at 16 to 256 px in both
  schemes
- [x] Specs: header logo, logo colors follow the selected theme with 3:1
  contrast, favicons load; confirm they fail today
- [x] Demo `Logo` component that inlines the SVG; header and home page
- [x] SVG favicon plus a regenerated `favicon.ico` fallback; README logo
- [x] Remove the old `janus.png`

**Done when**

- The demo header shows the logo.
- With the theme forced to light or dark, the logo halves use the accent and
  text colors and reach 3:1 against the background.
- `logo.svg` and `favicon.ico` are linked as icons and load.
- The README shows the logo.

**Decisions**

- Kept the original idea: a face split down the middle, warm half and cool half,
  eyes and a smile. Changes: symmetric outline, a clean gap between the halves,
  one continuous smile, and almond eyes. The features are transparent cut-outs
  (an SVG mask), so the logo works on any background. A variant with outward
  pupils ("looking both ways") was tried and dropped because it read as googly
  eyes and cluttered small sizes.
- One source file, `demo/logo.svg`. Its fills use `var(--janus-accent)` and
  `var(--janus-text)` with fallback colors per system color scheme, so it
  follows the theme selector when inlined and the system setting as an image or
  favicon.
- The demo inlines the SVG with a small `Logo` component that fetches it,
  because templates cannot create SVG elements (they use `createElement`, not
  `createElementNS`). Each instance renames the SVG's ids so two logos on one
  page do not share masks.
- `favicon.ico` is rendered from the same SVG at 16 and 32 px in gold and a
  mid slate, so the fallback reads on light and dark tab bars, and packaged as
  PNG-in-ICO with a short script.

**Validation**

- Red (Chromium): no logo in the header, and no SVG favicon link.
- `./check.sh`: 28 of 28 unit tests and 114 of 114 Playwright runs (38 specs ×
  3 browsers) pass, 76.3 s. One earlier attempt failed in `docker build` with
  the same BuildKit snapshot error seen in Phase 3; an unchanged retry passed.
- Screenshots at 16 to 256 px in both color schemes, and of the demo home page
  in both themes, look right.

**Limitations**

- The README logo follows the reader's system color scheme, not GitHub's theme
  setting, when the two differ.
- The 28 px header logo is fetched once per page load; until it arrives, an
  empty placeholder of the same size is shown.

### Phase 12: Theme foundation — Done (2026-10-23)

**Goal:** One coherent dark and light theme built on CSS variables, applied to
every existing component, with a theme switch in the demo and automated
contrast checks (user approved the approach on 2026-10-23).

**Steps**

- [x] Specs: WCAG AA contrast in both themes, system-following theme, demo
  toggle, custom colors, visible focus; confirm they fail today
- [x] `BaseTheme`: `--janus-*` tokens for dark and light, `mode` prop, base
  styles, reduced-motion support
- [x] `theme` helpers replace `colors.js`; restyle Button, Input, Textarea,
  Select, Panel, Label, Spinner, Tooltip, Navbar and the modal
- [x] Demo: header with theme selector; gallery in sections with a token
  swatch row and all tones
- [x] Update `README.md`; archive the oldest `## Done` entry

**Done when**

- Every visible text in the demo's home page and gallery meets WCAG AA (4.5:1,
  or 3:1 for large text), and input borders reach 3:1 against their
  surroundings, in both the dark and the light theme. Disabled controls are
  exempt, as WCAG allows.
- With no override, the theme follows the system color scheme.
- The demo's theme selector forces light or dark and can return to system.
- A custom CSS color passed as `color` still tints a component.
- Keyboard focus shows an outline with at least 3:1 contrast.
- All specs pass in all three browsers.

**Decisions** (approved on 2026-10-23)

- Tokens are CSS custom properties on `:root`. Dark is the default; light
  applies when the system prefers it, unless `data-janus-theme` on `<html>`
  overrides it. `BaseTheme`'s `mode` prop (`"system"`, `"light"`, `"dark"`)
  sets that attribute.
- Changed during the work: the UI kit installs the tokens, the spinner
  keyframes and the reduced-motion rule itself, as the first stylesheet in
  `<head>`, instead of `BaseTheme` doing it. Without that, components rendered
  transparent and ignored reduced motion when `BaseTheme` was missing.
  `BaseTheme` keeps the page styles and `mode`.
- The token rules use `:where()`, so an app's plain `:root` rule overrides a
  token in both themes.
- The light theme's `raised` surface is white; menus and dialogs stand out by
  border and shadow, as is usual for light themes.
- Palette: warm bronze-gold accent on cool slate neutrals, echoing the two
  faces in the logo. Each theme has its own tone values so tone text keeps AA
  contrast on both backgrounds. Pre-checked with a contrast script before
  coding.
- Tones: `standard` (the text color), `accent`, `success`, `warning`, `error`,
  `info`; any other value is used as a CSS color. Shades come from
  `color-mix(in oklab, ...)`, which replaces the canvas-based
  `colors.brightness`. The `colors` export is removed.
- Contrast checks are hand-rolled in the spec (no new dependency). They parse
  computed colors, including `oklab()`, and composite translucent
  backgrounds. Specs emulate reduced motion so transitions do not skew
  measurements.

**Validation**

- Red (Chromium): the contrast audit failed on the home page (active tab
  3.84:1), the theme did not follow a light system setting, the theme selector
  did not exist and the focus outline measured 1.1:1. The custom-color check
  already passed and stayed as a guard.
- `./check.sh`: 28 of 28 unit tests and 102 of 102 Playwright runs (34 specs ×
  3 browsers) pass, 80.5 s.
- The palette was checked with a contrast script before coding: every text and
  tone pair reached AA in both themes.
- Screenshots of the whole gallery and of the modals in both themes look
  coherent.

**Hardening findings**

- `transition-duration: 0.01ms` in the reduced-motion rule did not turn
  transitions off; because the default transition property is `all`, it
  animated every change, so colors read right after a theme switch were stale.
  Replaced with `transition: none` and `animation: none`.
- `modal.dialog` appended its content without flattening, so any styled
  component at the top of a dialog threw. It now flattens first.
- Dialogs passed `style` to `Panel`, and the inline `janus-panel` host painted
  that padding and background as stray fragments. The modal now styles its own
  wrapper. The underlying issue is recorded under Known bugs.

**Limitations**

- Contrast checks cover the demo's home page and gallery at rest; hover,
  pressed and open-menu states are not measured.
- A custom `color` value is not contrast-checked.

### Phase 11: Template tooling (option A) — Done (2026-10-23)

**Goal:** Keep the tagged-template format, but fail loudly on misspelled
components and make editor highlighting possible (user chose option A over
JSX or TSX on 2026-10-23).

**Steps**

- [x] Tests for both criteria; confirm they fail today
- [x] Throw on a capitalized tag whose `janus-*` element is not registered
- [x] Export `html` also as `html`
- [x] Update `README.md`; archive the oldest `## Done` entry

**Done when**

- Rendering `<Buton />` throws an error naming the tag; registered components
  and lowercase custom elements such as `<my-widget>` still render.
- `html` is exported from `src/Janus/index.js` and is the same function as `html`.
- All specs pass in all three browsers.

**Decisions**

- The check runs when a template is evaluated, so a component must be
  registered before a template that uses it renders. Every current template
  already renders after registration.
- `html` stays the documented name; `html` exists so highlighting extensions such
  as `bierner.lit-html` recognise templates. The README warns against
  `runem.lit-plugin`, which checks lit's binding rules and would flag
  `onClick=${fn}`.

**Validation**

- Red (Chromium): the alias spec failed (`html` missing) and the `test.html`
  suite reported `Error: 1` for `<Tset />`.
- `./check.sh`: 28 of 28 unit tests and 78 of 78 Playwright runs (26 specs ×
  3 browsers) pass, 57.2 s. The demo, gallery and fixtures all render, so every
  existing template uses registered components.

**Limitations**

- Highlighting depends on writing `html` instead of `html`; the demo and docs
  still use `t`.
- The editor extensions were not tried here; their behaviour is described from
  their documented purpose.

### Phase 10: List keys — Done (2026-10-23)

**Goal:** Items in a list keep their DOM, typed text, focus and component state
when items are inserted, removed or reordered (user approved on 2026-10-23).

**Steps**

- [x] Acceptance specs and a keyed-list fixture; confirm they fail today
- [x] Template: `key` sets the element's key and is neither an attribute nor a
  prop
- [x] Renderer: match by key, then unkeyed nodes in order; remove unmatched;
  move only out-of-place nodes
- [x] Update `README.md`; archive the oldest `## Done` entry

**Done when**

- Removing the first item keeps the other items' typed text, focus and
  component state.
- Inserting an item at the front keeps the existing items' typed text and
  state.
- Reversing the list moves typed text and state with their items.
- `key` does not appear as an attribute.
- All existing specs pass in all three browsers.

**Decisions**

- The prop is called `key`, as in React; any string or number works, compared
  as strings. `undefined` and `null` mean no key.
- Matching: a keyed new node takes the old sibling with the same key and node
  name. An unkeyed new node takes the next unused unkeyed old node after the
  last match; an old node of a different kind at that position is replaced. A
  new node that is already in the container keeps its place. Unmatched old
  nodes are removed, then nodes are inserted or moved only where they are out
  of place.
- Duplicate keys among siblings: the second is treated as a new node. No
  warning.

**Validation**

- Red (Chromium): all four new specs failed. Typed text stayed at its position
  instead of following its item, and `key` appeared as an attribute.
- `./check.sh`: 28 of 28 unit tests and 75 of 75 Playwright runs (25 specs ×
  3 browsers) pass, 59.3 s.
- Throwaway probe: duplicate keys render both items; a key whose tag changes
  gets a new element; removing a keyed item between unkeyed siblings reuses
  the remaining keyed item; removing the first of 2,000 keyed items takes
  59 ms in Chromium, including building the new template output.

**Hardening findings**

- Unkeyed conditional content improved as a side effect: an old node of a
  different kind is now replaced in place, so later siblings are reused instead
  of rebuilt.
- Reordering still moves DOM nodes, which drops focus inside a moved item;
  documented in `README.md`.

**Limitations**

- Duplicate keys are not reported.
- Each render still builds the full new tree before matching, so large lists
  pay for building nodes that are then discarded.

### Phase 9: Browser test suite cleanup — Done (2026-10-23)

**Goal:** The `test.html` suite reports template errors instead of aborting,
and its "props as children" test can fail (user approved on 2026-10-23).

**Steps**

- [x] Show both defects on the current code with throwaway injections
- [x] `getElementsFromTemplate` reports the caught error
- [x] The "props as children" test renders into a connected container and
  asserts the exact HTML; stale comments and the debug `console.error` go
- [x] The `Test` component renders with the real template, not the suite's
  fake `t`

**Done when**

- An injected template error appears as one reported failure, and the summary
  still renders.
- An injected wrong render in the "props as children" component fails that
  test.
- Without injections, the suite passes in all three browsers.

**Decisions**

- With the debug `console.error` gone, the `test.html` spec now also fails on
  console errors, like the demo specs.

**Validation** (injections ran in throwaway containers only)

- Before: an injected template error aborted the suite with "result is not
  defined" and no summary; an injected wrong render still reported `Error: 0`.
- After: clean run `Success: 40 Error: 0`; injected template error
  `Error: 1 Total: 41` with the summary rendered; injected wrong render
  `Error: 1`.
- `./check.sh`: 28 of 28 unit tests and 63 of 63 Playwright runs pass, 50.3 s.
  An earlier run took 33 minutes of wall time because the host slept and paused
  the Colima VM; inside the container it progressed normally.

**Limitations**

- The `test.html` suite still runs its checks at module load with hand-rolled
  helpers; it is not a Playwright or `node:test` suite in its own right.

### Phase 8: Single handler calls across the UI kit — Done (2026-10-23)

**Goal:** Every UI kit component calls its handlers once per event (user
approved on 2026-10-23).

**Steps**

- [x] Acceptance spec with a UI kit fixture page; confirm the double calls fail
- [x] Shared helper for forwarded props; use it in Button, Panel, Label and
  Spinner
- [x] Input and Textarea stop attaching `onChange` to the inner control

**Done when**

- One click on Panel, Label, Spinner or Button calls `onClick` once.
- One committed change in Input or Textarea calls `onChange` once, and the
  handler sees the control as `event.target` with the typed value.
- All specs pass in all three browsers.

**Decisions**

- `util.forwardedProps(props)` returns the props without `style` and without
  functions. Handlers stay on the component's host element, which every
  template already gives them.
- Input and Textarea rely on `change` bubbling from the inner control to the
  host. Non-bubbling events such as `focus` would still need explicit handling;
  no UI kit component uses them today.

**Validation**

- Red: Panel, Label and Spinner called `onClick` twice; Input and Textarea
  called `onChange` twice. Button was already at 1 after Phase 7.
- `./check.sh`: 28 of 28 unit tests and 63 of 63 Playwright runs (21 specs ×
  3 browsers) pass, 43.6 s. The `onChange` spec also checks that the handler
  sees the typed value through `event.target`.

**Hardening findings**

- A callback prop named like an event, such as Select's and Navbar's
  `onChange`, also becomes a DOM listener on the component's host. Neither
  component contains anything that fires `change`, so nothing double-fires
  today, but a future component could. Not changed: it is how every component
  receives handlers.

**Limitations**

- Handlers for non-bubbling events (`focus`, `blur`) on a component reach only
  the host element, not its inner controls.

### Phase 7: Known bugs batch — Done (2026-10-23)

**Goal:** Fix the reviewed bugs in event props, Button, modal callbacks and
`Route` (user approved on 2026-10-23).

**Steps**

- [x] Acceptance tests for the criteria below; confirm they fail today
- [x] Event-handler attributes accept only functions
- [x] Button: native `<button>` (or `<a>` with `href`); no forwarded handlers
- [x] Modal backdrop callbacks
- [x] Delete `Route`
- [x] Update `README.md`

**Done when**

- A string or other non-function value for an event-handler attribute (for
  example `onClick=${"code"}` or `onclick="code"`) throws; `undefined`, `null`
  and `false` attach nothing.
- UI kit buttons are reached with Tab and pressed with Enter.
- One click on a Button calls its `onClick` once.
- Closing `confirm` or `input` by clicking the backdrop calls back with
  `false`; `alert` calls back with no argument.
- `src/Janus/ui/Route.js` is gone.
- All specs pass in all three browsers.

**Decisions**

- Throw rather than ignore: a string handler is a developer error, and the
  parser already fails loudly.
- The check applies to props whose lowercase name is an event-handler property
  of the element (`"onclick" in element`), so props such as `one` are
  unaffected.
- Button renders `<button type="button">`, or `<a>` when given `href`, so focus,
  Enter, Space and `disabled` come from the browser. It forwards no function
  props, because the host element already carries the handlers; forwarding
  them caused the double call (probe: 2 calls per click).
- Specs locate buttons by role, which also checks that they are exposed as
  buttons.
- Button gets `border: none` and `line-height: inherit`, so the native element
  looks like the old link.

**Validation**

- Red: 36 of 57 Playwright runs failed. Role locators found no buttons (which
  also failed every gallery test at its navigation step), Tab focused nothing,
  and the `test.html` suite failed on the new error expectations.
- `./check.sh`: 28 of 28 unit tests and 57 of 57 Playwright runs (19 specs ×
  3 browsers) pass, 48.9 s. The `test.html` suite now also checks that
  `undefined`, `null` and `false` handlers attach nothing and that a prop named
  `one` is still an attribute.
- Gallery screenshot matches the Phase 3 one. Computed colours are identical
  (the first Select toggle and "Test standard" are both `rgb(80, 80, 80)`).
- Probe after the change: one Button click calls `onClick` once (before: twice).

**Hardening findings**

- The same double call exists in `Panel`, `Label`, `Input` and `Textarea`
  (probe: 2 calls each). Recorded under Known bugs; not fixed here because it
  was outside the approved batch.
- The first backdrop spec checked visibility of `#janus-ui-modal`, a zero-size
  wrapper around a fixed backdrop; it now checks presence.
- A disabled Button is a native disabled `<button>`, so it no longer fires
  `onClick`. Before, a disabled-looking Button still ran its handler.

**Limitations**

- A lowercase function prop (`onclick=${fn}`) is still silently ignored; only
  `onX` with a capital letter attaches a listener.
- The modal's documented `escapable` option is not implemented.

### Phase 6: Firefox and WebKit — Done (2026-10-23)

**Goal:** Every Playwright spec runs in Chromium, Firefox and WebKit through
`./check.sh` (user approved on 2026-10-23).

**Steps**

- [x] Add Firefox and WebKit projects to `playwright.config.js`
- [x] Run the gate; investigate and fix anything that fails only outside
  Chromium, asking first if a fix goes beyond this phase
- [x] Measure the gate's timing; update `README.md`

**Done when**

- `./check.sh` runs all specs in all three browsers and passes.
- The gate stays under 5 minutes, with the smoke spec under 2 minutes.

**Decisions**

- The browsers are the ones bundled in the pinned Playwright image, using
  Playwright's `Desktop Firefox` and `Desktop Safari` device settings.
- The Select direction specs open the Select with a dispatched click. In
  Firefox the toggle at the panel's bottom edge is 2 px taller and partly
  hidden, so Playwright's click first scrolled it to the middle of the panel,
  where opening downwards is correct. A user clicks the toggle in place, so
  this was a test artifact, not a library bug.

**Validation**

- First run: 41 of 42 passed; the Firefox upward-Select spec failed. A probe
  showed the toggle at 686 px after the scroll and 361 px after Playwright's
  click, which led to the change above.
- `./check.sh`: 28 of 28 unit tests and 42 of 42 Playwright runs (14 specs ×
  3 browsers) pass, 35.4 s. Two more full runs passed (28.1 s and 28.5 s of
  Playwright time), so no flakiness showed up.
- Smoke subset in all three browsers: 7.9 s.

**Limitations**

- WebKit in the Linux image is close to Safari but not identical; macOS and
  iOS Safari are not tested.
- No mobile viewports or touch input.

### Phase 5: Re-slotted focus and Select flip — Done (2026-10-23)

**Goal:** A component that re-renders its own `childElements` keeps focus and
mount state inside them, and a Select near the bottom of its container opens
upwards (user approved on 2026-10-23).

**Steps**

- [x] Acceptance specs for both criteria; confirm they fail today
- [x] Placeholders for already-connected nodes in `t` output; `render` resolves
  them
- [x] Select measures its clipping container on open and flips if needed
- [x] Update `README.md`

**Done when**

- Typing into an input passed to a component, then triggering that component's
  `setState`, keeps the input focused with its text. Components inside that
  content are not re-mounted.
- A Select scrolled to the bottom edge of its container opens its options above
  the button, inside the container.
- A Select with room below still opens downwards.
- All existing specs pass.

**Decisions**

- While a template is built, a child that is already connected to the document
  is not moved into the new tree. A comment placeholder referencing it takes its
  place, and `render` swaps the real node back in, without moving it if it is
  already in position. `t` output that embeds a connected node therefore holds
  a placeholder until it is passed to `render`.
- `render` never morphs a connected node into another node; connected nodes are
  only moved. This keeps a live node from losing its children to a neighbour.
- Select opens upwards only when the options overflow the nearest clipping
  ancestor (or the viewport) and there is more room above than below. It
  measures right after the synchronous open render, so nothing is painted in
  the wrong place.

**Validation**

- Red: the re-slotting spec failed (input not focused) and the upward Select
  spec failed (options bottom at 774 px, expected at most 683 px). The
  downward guard passed.
- `./check.sh`: 28 of 28 unit tests and 14 of 14 Playwright specs pass. The
  upward spec also selects "Option #3" from the flipped list.
- A screenshot at 1280×720, with the Select at the bottom edge of the panel,
  shows the options directly above the button.

**Hardening findings**

- A connected node being moved can't contain placeholders, so `render` walks
  only fresh nodes for them.
- Embedding a connected node in a template that ends up in a different
  container still moves it, losing focus there. That is unavoidable for a move.
- Select decides on open only; scrolling or resizing while it is open does not
  re-flip. When neither side fits, it picks the larger side and the list can
  still be clipped.

**Limitations**

- `t` output that embeds a connected node holds a comment placeholder until it
  is passed to `render` (documented in `README.md`).

### Fix: Select options in a scrolled container — Done (2026-10-23)

**Goal:** Select's option list opens under its button and stays reachable when
the surrounding panel is scrolled (user asked for the fix on 2026-10-23).

**Done when:** the gallery specs pass at Playwright's default 1280×720
viewport, with the tall-viewport workaround removed.

**Decisions:** the `<p>` that Select renders gets `position: "relative"`, so
the absolutely positioned option list is placed against the Select instead of
the app's fixed container.

**Validation**

- Red: with the workaround removed and no fix, the Select spec failed with
  "element is outside of the viewport".
- After the fix: `./check.sh` passes 28 of 28 unit tests and 11 of 11
  Playwright specs.
- A screenshot at 1280×720 with the panel scrolled shows the options directly
  under "Select and change".

**Limitations:** near the bottom of a scroll container the option list is
clipped by the container and has to be scrolled into view; it does not flip
upwards.

### Phase 4: Rendering model — Done (2026-10-23; option A approved)

**Goal:** Re-rendering keeps existing DOM and component state instead of
rebuilding the subtree on every `setState`.

**Problem today:** `render()` empties the container and appends freshly built
nodes. Child components are new instances on every parent render, so their
state, focus, cursor and scroll are lost. Each component also renders once per
child before it is connected, and again on connect, and leaks a
`MutationObserver` per connect.

**Options**

- **A. Morph the DOM (recommended).** Keep `t` returning DOM nodes. Replace the
  empty-and-append step with a morph that walks old and new nodes, keeps nodes
  with the same tag, patches attributes, text and listeners, and hands new
  props to existing component instances so they re-render in place. No API
  change; modal, Tooltip and the tests keep working. About 150–250 lines. The
  cost is that each render still builds a full new tree before diffing.
- **B. Template parts, as lit-html does.** `t` returns a template result; the
  first render clones a static template and later renders update only the
  `${}` positions. The fastest and most precise option, but it breaks every
  caller that treats `t` output as nodes and means rewriting
  `createTemplateFunction`. Large.
- **C. Virtual DOM.** `t` returns a vnode tree from the parse tree we already
  have; diff the trees and patch the DOM. A well-known model, with the same
  breaking change as B, and every render allocates a vnode tree. Large.
- **D. Stopgap fixes only.** Stop the per-child renders, disconnect observers
  and restore focus after a render. Small, but state in child components is
  still lost.

All options except D need list keys to keep state when items are reordered;
that is a follow-up either way.

**Steps**

- [x] Acceptance specs and a fixture page for the criteria below; confirm the
  new behaviour fails today
- [x] Gallery regression specs (Select with props update, Confirm modal) that
  pass today
- [x] Morph in `template/render.js`; listeners through a per-event dispatcher
- [x] `Component`: `receiveProps`, no eager render, no attribute observer
- [x] Update `README.md`

**Done when**

- Typing into an input whose component re-renders on every keystroke keeps
  focus and all typed text.
- A child component keeps its state when its parent re-renders, and shows the
  new props.
- After re-renders, event handlers see the latest values and fire once per
  event.
- A component with children renders once on mount, and once per parent
  re-render.
- The `test.html` suite, the demo specs and the gallery regression specs pass.
- `t` still returns DOM nodes and `render(container, elements)` keeps its
  signature.

**Decisions**

- Nodes are matched by position and node name; no keys yet. A new node that is
  already a child of the container is moved, never morphed, so passed-through
  `childElements` are not duplicated.
- The attribute `MutationObserver` is removed. Props now arrive through
  `receiveProps(props, childElements)`, which replaces `propsMayChange`. The
  observer re-rendered with unchanged props, doubled every update and leaked;
  an external `setAttribute` on a component no longer triggers a render.
- Each event name gets one listener that calls the element's current handler,
  so a morph swaps handlers instead of stacking listeners.
- When the `value` attribute changes, the `value` property is set too; the
  attribute alone stops updating an input once the user has typed in it.
- Generated style class names still change on every render, so morphs rewrite
  `class` and `<style>` text. Stable names are a follow-up.
- The gallery regression specs run in a 1600 px tall viewport, because of the
  pre-existing Select positioning bug. The bug was outside this phase; the
  Select fix above removed the workaround.

**Validation**

- Red run: the three new-behaviour specs failed (focus lost after the first
  keystroke, child count reset to 0, `Wrapper` rendered more than once); the
  handler guard and both gallery specs passed.
- `./check.sh`: 28 of 28 unit tests and 11 of 11 Playwright specs pass, 11.0 s
  warm. This includes a later spec for typing inside content passed to a child
  component.
- Throwaway probe in the container, not kept: removing a component calls
  `componentWillUnmount`; a component that re-renders its own `childElements`
  loses focus inside them (recorded as a limitation).

**Hardening findings**

- Without the parent-node guard, a live node reused at a different position
  would be morphed into its neighbour and lose its children; such nodes are now
  moved instead.
- Partial failure: if a `render()` throws during a morph, the DOM is left
  partly updated. Before, the container had already been emptied. Neither is
  transactional.
- No new trust boundary; string `on*` props still become inline handlers
  (Known bugs).
- Not covered: the `shadowRoot` path (no component attaches one), keyed lists,
  Firefox and WebKit.

**Limitations**

- No keys: inserting or removing list items before the end shifts state.
- Re-rendering its own `childElements` from `setState` loses focus inside them.
- `componentWillMount` and `componentDidMount` run on every connect, including
  when a node is moved, as before.

### Phase 3: Library and demo split — Done (2026-10-23)

**Goal:** Separate the library from its demo, keep only demo content that shows
real usage, and trim the public API (user approved on 2026-10-23).

**Steps**

- [x] Write acceptance specs for the criteria below; confirm they fail
- [x] Move the demo to `demo/`: `index.html`, `App.js`, `pages/Home.js`, and a
  UI kit page (`pages/Gallery.js`) built from the `ui.html` gallery
- [x] Delete the Base64, Url, XML, Properties, JSON, `Others` and `Map` pages
  and `ui.html`
- [x] Move `test.html` into `src/tests/`
- [x] Remove `PropTypes` and `script()` from the library
- [x] Update `README.md`

**Done when**

- `/demo/` loads with no page or console errors and its navigation shows exactly
  "Home" and "UI kit".
- Choosing "UI kit" shows the gallery; choosing "Home" shows the introduction.
- `/src/tests/test.html` passes.
- `src/Janus/index.js` exports `Component` (default), `t` and `render`, and no
  file imports `PropTypes` or `script`.
- `src/` contains only the library and its tests.

**Decisions**

- `npm run example` serves the repository root, bound to `127.0.0.1`; the demo
  is at `/demo/`.
- Home's text introduces Janus instead of the old personal-site playground text.
- The gallery keeps all its sections. The filler text, the `javascript:` link
  button and its duplicate `BaseTheme` were replaced; the button now uses
  `onClick`.
- `favicon.ico` and the unused `janus.png` move to `demo/`, byte-identical;
  `index.html` links the icon explicitly because it is no longer at the server
  root.

**Validation**

- Red run: all four new or moved specs failed before the restructure.
- `./check.sh`: 28 of 28 unit tests and 4 of 4 Playwright specs pass, 12.1 s
  warm. One earlier run failed in `docker build` with a BuildKit snapshot error
  unrelated to the project; an unchanged retry passed.
- Moved files diffed against `HEAD`: only import paths, class names and the
  gallery edits listed above changed.
- No file outside `PLAN.md`, `FRICTION.md` and the API spec mentions
  `PropTypes`, `script(`, `PublicApp`, `ui.html` or the removed pages.
- Screenshots of Home and UI kit from the test container look right.
- `npm run example` listens on `127.0.0.1:8000` only, and `/demo/` returns 200.

**Hardening findings**

- Serving the repository root with the default `http.server` binding would have
  exposed `.git` and `NOTES.md` to the local network. Fixed with
  `--bind 127.0.0.1`.
- Removed the external CDN script and the `javascript:` URL from the demo.
- `Component`'s constructor no longer takes `propTypes`; subclasses that still
  pass it are unaffected, since the extra argument is ignored.

**Limitations**

- The demo's `pages` object builds each page once at load, so switching tabs
  re-attaches the same nodes. Gallery state survives tab switches, and each
  switch adds a `MutationObserver` (the Phase 4 leak).
- The specs check that the gallery renders, not that each widget works; Select,
  modals and Tooltip are still checked by eye.
- `camelToKebab` is still exported from `src/Janus/index.js`; it exists for the
  library's own imports.

### Phase 2: Automated browser tests in Docker — Done (2026-10-23)

**Goal:** `./check.sh` runs the browser suite and a demo smoke test
automatically, inside Docker, so the browser install never touches the host.

**Steps**

- [x] Add `@playwright/test` and a lockfile; drop the unused `node-static`
- [x] Dockerfile on the matching Playwright image; `check.sh` builds and runs it
- [x] Acceptance spec: `test.html` reports no failures and no page errors
- [x] Smoke spec: the demo loads without errors and shows its navigation
- [x] Measure the gate's timing; update `README.md` and `FRICTION.md`

**Done when**

- `./check.sh` runs the Node unit tests and the Playwright specs in Docker and
  exits non-zero if either fails.
- A failure reported on `test.html`, or an uncaught page error, fails the run.
- The host needs only Docker; nothing is installed outside the image.
- Measured gate time is recorded below and is under 5 minutes.

**Decisions** (user approved Playwright and Docker on 2026-10-23)

- `@playwright/test` 1.64.0, pinned exactly: the newest release at least two
  weeks old. The Docker image is `mcr.microsoft.com/playwright:v1.64.0-noble`,
  pinned by digest, matching the npm version.
- Chromium only for now; Firefox and WebKit are a later decision.
- Everything runs in the container, including the Node unit tests, so the host
  prerequisite is Docker alone. Serving the demo locally still uses Python.
- The test server serves the repository root with `python3 -m http.server`; its
  access log is discarded.
- Specs live in `src/tests/` as `*.spec.js`; Node unit tests stay `*.test.js`.
  Smoke specs are tagged `@smoke`.
- `node-static` is removed so it does not enter the new lockfile.

**Validation**

- `./check.sh`: 28 of 28 unit tests and 2 of 2 Playwright specs pass. 19.5 s on
  the first run with the image already pulled (includes `npm ci`), 8.1 s warm,
  of which Playwright takes 2.9 s.
- Negative checks, each in a throwaway container: a failing case on `test.html`,
  an uncaught error on the demo, a `console.error` on the demo, and a failing
  unit test each made the run exit 1. The demo errors were caught by the error
  assertion itself, not by a missing element.
- Host: no `node_modules`; the lockfile was generated with
  `--package-lock-only --ignore-scripts`.

**Hardening findings**

- `NOTES.md` and `.git` would have been copied into the image; both are now in
  `.dockerignore`.
- Supply chain: image pinned by digest, npm version pinned exactly, `npm ci`
  against a lockfile with integrity hashes. Three packages in total.
- Discarding the server log means a server that fails to start shows up as a
  Playwright URL timeout, without the server's own message.

**Limitations**

- Chromium only.
- The gate needs Docker even for documentation-only changes; the first run
  pulls about 3.6 GB.
- The `test.html` spec trusts the page's own summary; that suite's weaknesses
  (Known bugs, under Planned) still apply.

### Phase 1: Foundation and template parser fixes — Done (2026-10-23)

**Goal:** Make the repository's documentation and gate match reality, run the
template parser tests automatically in Node, and fix four parser bugs found in
review.

**Steps**

- [x] Baseline: browser suite and demo pages before any change
- [x] Write parser unit tests from the criteria below; confirm the bug cases fail
- [x] Add `check.sh` running the Node unit tests
- [x] Fix: unterminated attribute hangs the parser
- [x] Fix: `\"` inside a quoted attribute value is mis-parsed
- [x] Fix: missing end tag and unclosed opening tag are not reported
- [x] Fix: a literal `<` in text throws
- [x] Document stack, entry points and tests in `README.md`
- [x] Create `FRICTION.md`

**Done when**

- `./check.sh` runs the parser unit tests with Node and exits non-zero on failure.
- `` t`<p a` `` and `` t`<p a="b` `` throw a parse error instead of hanging.
- `a="x\"y"` (the cooked template string) parses to the value `x"y`.
- `` t`<p>text` `` and `` t`<p a="b"` `` throw a parse error.
- `` t`1 < 2` `` and `` t`<p>a < b</p>` `` parse as text.
- The existing browser suite (`test.html`) still passes 34 of 34, and the demo
  and UI pages render the same components without console errors.
- `README.md` states the stack, prerequisites, entry points and tests, marking
  what works today and what is planned.

**Decisions** (user approved this phase on 2026-10-23)

- Stack, recorded as found: vanilla ES modules and Custom Elements, no build
  step, no runtime dependencies; the demo is served by `python3 -m http.server`.
- Test runner: Node's built-in `node:test`, no added dependencies.
- Node tests live in `src/tests/` next to the browser tests, the existing
  convention, named `*.test.js`.
- `package.json` gets `"type": "module"` so Node loads `src` as ES modules
  without warnings. Browsers ignore it.
- Inside a double-quoted attribute value, `\"` is a literal quote and the
  backslash is dropped.
- `<` starts a tag only when followed by a letter, `/` or `!`; otherwise it is
  text, as in HTML. `!` stays a tag start so `<!-- -->` is still a parse error
  rather than silently becoming visible text.
- A variable anywhere inside a quoted attribute value is a parse error. Before,
  one at the start (`a="${x}b"`) silently produced `"0b"`.

**Validation**

- Baseline: `test.html` passed 34 of 34 in headless Chrome. The demo and UI
  pages rendered with no console errors; the only message is a Canvas
  `willReadFrequently` hint from `colors.js`.
- Red run before the fixes: 19 tests passed and 6 failed, with the two hang
  cases excluded. A full run hung until killed after 10 s.
- `./check.sh`: 28 of 28 pass in about 0.13 s, exit 0. `node --test` exits 1 on
  a failing test, checked with a throwaway test outside the repo.
- After: `test.html` 34 of 34. The demo and UI DOM are identical to the
  baseline apart from generated class numbers and Home's timestamp, with no new
  console messages.
- Extra probes (`<p a=`, `<p a=b`, `<p a="x\"`, `<p>x</p`, `<p><b></p></b>`)
  all throw parse errors.
- The README usage example works in headless Chrome: two clicks give "Clicked 2
  times".

**Limitations**

- Browser pages are run by hand; `./check.sh` covers only the parser. No
  integration or smoke tier exists (see `FRICTION.md`).
- The Node test copies the template tokenizer from `template/index.js`, which
  cannot load outside a browser. A change there will not be caught by it.
