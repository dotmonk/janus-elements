# janus-elements

<p align="center"><img src="docs/logo.svg" width="96" alt="Janus Elements logo"></p>

Janus Elements is a small UI library built on Custom Elements: React-style
components written with a JSX-like tagged template, plus a basic UI kit. The
package name is `janus-elements`; version 0.1.0 is prepared but not yet on npm
(see [Releasing](#releasing) and [CHANGELOG.md](CHANGELOG.md)). Before 1.0 the
API can still change. Work history and known issues are in [PLAN.md](PLAN.md).
The repository is
[dotmonk/janus-elements](https://github.com/dotmonk/janus-elements). Docs and
live examples: [dotmonk.github.io/janus-elements](https://dotmonk.github.io/janus-elements/).

## Installation

Until publish, clone the repo and import from `src/janus/` (or link the package
locally). After publish:

```sh
npm install janus-elements
```

```js
import Component, { html } from "janus-elements";
import "janus-elements/ui/button";
import type { ButtonProps } from "janus-elements/ui/button";
```

Import only the kit modules you need (`janus-elements/ui/button`,
`janus-elements/ui/icons/search`, `janus-elements/ui/theme`, and so on).
`import "janus-elements/ui"` still registers the full kit in one go. The docs
gallery uses that barrel on purpose; apps should prefer deep imports. Package
`exports` and `sideEffects` are generated from
`src/janus/ui/exports.manifest.json` via `node scripts/sync-ui-exports.mjs`.

Evaluating `janus-elements` (and deep UI modules) is safe in Node: document
stylesheets and `customElements.define` run lazily when a browser document
exists. Rendering still needs a real browser (this is not SSR).

Bare imports need a bundler or an import map. The docs site maps package names
to `docs/lib/janus/` (see `docs/index.html`). After publish, a CDN that serves
npm packages works the same way:

```html
<script type="importmap">
  {
    "imports": {
      "janus-elements": "https://cdn.jsdelivr.net/npm/janus-elements@0.1.0/src/janus/index.js",
      "janus-elements/ui/": "https://cdn.jsdelivr.net/npm/janus-elements@0.1.0/src/janus/ui/",
      "janus-elements/ui/button": "https://cdn.jsdelivr.net/npm/janus-elements@0.1.0/src/janus/ui/Button.js"
    }
  }
</script>
```

## Stack

- Vanilla ES modules and Custom Elements. No build step, no runtime
  dependencies. Hand-written `.d.ts` files ship with the package for TypeScript
  consumers (`janus-elements`, `janus-elements/ui`, and deep UI paths such as
  `janus-elements/ui/button`).
- `src/janus/` is the library: `Component`, the `html` template and `render`, plus
  the UI kit in `src/janus/ui/`. `src/tests/` holds its tests. The UI kit's
  `Button` renders a native `<button>`, or an `<a>` when given `href`. Each kit
  module is also a package export (`janus-elements/ui/button`, …). Shared
  helpers: `janus-elements/ui/latestAsync`, `janus-elements/ui/createIcon`,
  `janus-elements/ui/util`, `janus-elements/ui/highlight`, and
  `janus-elements/ui/theme` (see [Helpers](#helpers); docs `#/helpers`,
  `#/tooling`).
- Syntax highlighting is Janus-owned (`janus-elements/ui/highlight` and
  `<CodeEditor>`): hand-written grammars, no highlighter dependency.
- `docs/` is the documentation site: landing page, library guide with live
  examples, and UI kit sections. Snippets use the library highlighter.
  `npm run dev` runs `januse dev` (syncs `src/janus` into `docs/lib/`,
  watches `src`, serves the repo with HMR); `docs/sync-lib.sh` does the
  same one-shot copy for GitHub Pages (that copy is gitignored).
- Tests: Node's built-in `node:test` for the template parser, Playwright 1.64
  for browser specs, `tsc --noEmit` for the hand-written `.d.ts` files, and
  `januse format --check` so formatting cannot drift or silently rewrite.
  `./check.sh` runs all of these inside Docker. See [Tooling](#tooling).

## Prerequisites

- A current browser (Custom Elements, ES modules and CSS `color-mix()`:
  Chrome and Edge 111+, Firefox 113+, Safari 16.2+).
- Node.js to run `npm run dev` / `januse` (syncs the library, watches `src`,
  serves the repo at <http://127.0.0.1:8000/> with HMR; responses still use
  no-store cache headers).
- Docker to run `./check.sh` (tested with Docker 29.2 on Colima). The first run
  pulls the Playwright image, about 3.6 GB. Nothing else is installed on the
  host. `./check.sh` retries `docker build` a few times when BuildKit fails
  intermittently.

No configuration is needed for local use. For the public site, set the
repository's GitHub Pages source to **GitHub Actions** (Settings → Pages) so
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) can deploy
`docs/` after syncing the library.

## Entry points

| Command | What it does | Status |
|---|---|---|
| `npm run dev` | `januse dev --watch src --watch docs --sync "src/janus:docs/lib/janus" docs`: syncs the library, watches `src` and `docs`, serves the repo at <http://127.0.0.1:8000/> with HMR; open <http://127.0.0.1:8000/docs/> | Works |
| `npm run lint` | `januse lint` (unused unless `_`, no-undef, `===`, duplicate keys); default path `src` | Works |
| `npm run format` | `januse format docs src` for `.js`/`.mjs`/`.ts`/`.json`/`.svg`/`.html` (bare `januse format` defaults to `src`) | Works |
| `npm run check-format` | `januse format --check docs src`; exits `-1` if a rewrite would change a file | Works |
| `npm run check` | Host gate: `lint`, `check-format`, then `test` (no Docker) | Works |
| `npm run test` | `node --test src/tests/*.test.js` (host unit tests) | Works |
| `./check.sh` | Builds the test image (with retries), then runs `tsc --noEmit`, `januse format --check docs src`, the unit tests, and the Playwright specs in Docker. Also runs on GitHub Actions check and Pages workflows | Works |
| `docker run --rm janus-check npm pack --dry-run` | Lists what would be published, using the image `./check.sh` builds | Works |

Served pages:

| Page | What it is | Status |
|---|---|---|
| `/docs/` | Documentation site (sidebar tree of API and UI kit sections) | Works; `./check.sh` runs smoke and navigation tests. Public URL after Pages is enabled: <https://dotmonk.github.io/janus-elements/> |
| `/src/tests/test.html` | Browser tests for rendering, components and styling; results on the page | Works; `./check.sh` runs it |

Specs tagged `@smoke` cover the paths whose breakage makes the build worthless.

## Tooling

`januse` is the package CLI (`bin`: `januse` → `./bin/januse.mjs`). After
install it is available as `npx januse` / `januse`. npm scripts call it for
day-to-day work:

| Command | Behaviour |
|---|---|
| `januse lint [paths…]` | Unused bindings (unless `_`), no-undef, prefer `===`, duplicate keys on `.js`/`.mjs`/`.ts`. Default path `src`. |
| `januse format [paths…]` | Rewrite `.js`/`.mjs`/`.ts`/`.json`/`.svg`/`.html` (including `html\`…\`` templates). Skips `*.compact.js` and `*.spaced.js`. |
| `januse format --check` | Same as format but write nothing; exit `-1` (shell `255`) if a file would change. |
| `januse dev` | Serve `127.0.0.1:8000` (`PORT` overrides), `--watch` paths, optional `--sync from:to`, HMR over `/__januse_hmr`. |

`./check.sh` builds the `janus-check` Docker image (retries flaky BuildKit
failures), then runs `tsc --noEmit`, `januse format --check docs src`, unit
tests, and Playwright. Package `exports` / `sideEffects` come from
`src/janus/ui/exports.manifest.json` via `node scripts/sync-ui-exports.mjs`.
Live notes: docs `#/tooling`.

## Releasing

`janus-elements` follows semantic versioning; until 1.0, a breaking change
bumps the minor version. The package publishes `src/janus/`, the `januse` CLI
(`bin/` + `scripts/januse/`), plus `README.md`, `LICENSE` and `CHANGELOG.md`.

1. Add the new version's entry at the top of `CHANGELOG.md`.
2. Set the version: `npm version <version> --no-git-tag-version`.
3. Run `./check.sh`; it also checks the published file list and that the
   changelog matches the version.
4. Review the contents with `docker run --rm janus-check npm pack --dry-run`.
5. Commit and tag the release (`v<version>`).
6. Publish with `npm publish` while logged in to npm.

Version 0.1.0 is prepared but not yet published.

## Usage

From the npm package (or the docs site import map), import `janus-elements` and
`janus-elements/ui`. Inside this repository you can also import from
`src/janus/` with relative paths.

```js
import Component, { html } from "janus-elements";
import "janus-elements/ui/button";

class Counter extends Component {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  render() {
    const { count } = this.state;
    return html`
      <Button onClick=${() => this.setState({ count: count + 1 })}>
        Clicked ${count} times
      </Button>
    `;
  }
}

Component.register(Counter);
```

Templates are written with the `html` tag, so highlighting extensions such as
`bierner.lit-html` for VS Code treat them as HTML. Avoid `runem.lit-plugin`: it checks lit's own binding rules and flags
valid Janus Elements code such as `onClick=${fn}`.

`Component.register` defines `janus-` plus the class name in kebab case, here
`<janus-counter>`. Each capital letter starts a new word, so `UI` becomes
`<janus-u-i>`.

## UI kit

Import `janus-elements/ui` (or `src/janus/ui/index.js`) once to register every
component, or import individual modules such as `janus-elements/ui/button` and
`janus-elements/ui/select`. The docs sidebar in `/docs/` shows each of them.
`onChange` handlers receive the DOM event unless noted.

| Component | Usage |
|---|---|
| Button | `<Button color active disabled href onClick headIcon tailIcon>Text</Button>` (`headIcon` / `tailIcon` take Icon classes; animate on hover) |
| Input, Textarea | `<Input color value disabled headIcon tailIcon />` (`headIcon` / `tailIcon` take Icon classes, e.g. `SearchIcon`; `null` hides a slot); `<Textarea color>Text</Textarea>` |
| CodeEditor | `<CodeEditor value language filename readOnly onChange onLanguageChange />`; `onChange` / `onLanguageChange` get `string`s; omit `language` to detect from `filename` / content. Highlight helpers: `janus-elements/ui/highlight` (see [Helpers](#helpers)) |
| RichTextarea | `<RichTextarea value placeholder readOnly onChange />`; WYSIWYG whose `value` / `onChange` are Markdown strings (bold/italic/strike, a Heading menu for H1–H6, lists, tasks, quotes, highlighted fenced code with a language menu, horizontal rules, tables (in a table the ▦ button becomes a menu for rows, columns and alignment), links, images). The formatting toolbar stays fixed while the body scrolls; toolbar menus use `position: fixed` so they are not clipped by the field shell. Tab/Shift+Tab and Enter move between table cells. Toolbar icons animate on hover. The Link button unlinks when the caret is in a link; Ctrl/Cmd+B and I format. Own undo/redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y) covering typing and toolbar commands; List buttons set the current item's kind and return it to a paragraph when pressed again; List Enter/Backspace, Tab/Shift+Tab indent and outdent; toolbar `aria-pressed` follows the caret; Markdown icon toggles a `CodeEditor` source mode. Deep import `janus-elements/ui/rich-textarea` |
| NumberInput, RangeInput | `<NumberInput value min max step onChange />`, `<RangeInput value min max step onChange />`; `onChange` gets a `number` (or `undefined` when NumberInput is empty) |
| ColorInput, FileInput | `<ColorInput value onChange />` (`#rrggbb`); `<FileInput accept multiple onChange />` (`File[]`; `multiple` defaults true) |
| DatePicker, TimePicker | `<DatePicker value min max locale clearable onChange />` (`YYYY-MM-DD`); calendar header has month dropdown + year spin; omit `locale` for `en-US`; clear and calendar/clock icons sit inside the field (icons animate on hover); `<TimePicker value step hour12 clearable onChange />` (`HH:mm`) segmented field |
| DateTimePicker, WeekPicker, MonthPicker | `<DateTimePicker value hourLabel minuteLabel />` (`YYYY-MM-DDTHH:mm`); `<WeekPicker value weekColumnLabel weekRowLabel weekValueLabel />` (`YYYY-Www`; templates use `{week}` / `{year}`); `<MonthPicker value />` (`YYYY-MM`); week grid highlights whole rows |
| DateRangePicker | `<DateRangePicker value=\${{ start, end }} instructionLabel instructionLabelWithStart clearable onChange />`; `{date}` in `instructionLabelWithStart`; first click start, second end |
| Select | `<Select options=${[{ name, value }]} value placeholder onChange searchable clearable multi creatable loadOptions loading loadingMessage cacheOptions defaultOptions noOptionsMessage renderOption renderValue headIcon tailIcon />`; `onChange` gets the value (`string`, or `string[]` when `multi`, or `undefined`/`[]` when cleared); options may be grouped as `{ name, options }` and mark `disabled`; `creatable` + `onCreateOption` adds from the filter; `loadOptions` loads async (debounce, cache/defaultOptions, Spinner); `loading` / `loadingMessage` force the loading row; `renderOption` / `renderValue` customize labels; trigger uses Chevron/Close icons (`headIcon` / `tailIcon` take Icon classes; default tail is Chevron, `tailIcon=${null}` hides it; no default head); menu portals to `document.body`; `multi` shows removable chips |
| Checkbox, Switch | `<Checkbox checked disabled onChange>Label</Checkbox>`; Switch is the same, exposed as `role="switch"` |
| RadioGroup | `<RadioGroup label name value options=${[{ name, value }]} onChange />` |
| Field | `<Field label hint error>control</Field>`; hint and error are linked with `aria-describedby` |
| Badge | `<Badge color>Status</Badge>` |
| Feedback | `<Feedback color title onClose>Message</Feedback>`; errors and warnings use `role="alert"` |
| Progress | `<Progress label value max color />`; indeterminate without `value` |
| Spinner | `<Spinner color variant>` — `variant` is `ring` (default), `dots`, `bars`, or `pulse`; children are the status label |
| Icons | `<EditIcon />`, `<EditIcon animated />`, `<HeartIcon color="error" />`; forty-five line-art icons (`SearchIcon` … `PlayIcon`, plus `ClockIcon`, `CalendarIcon`, `KeyIcon`, `FileIcon`, `FolderIcon`, `DownloadIcon`, `UploadIcon`, `ExportIcon`, `CopyIcon`, `LinkIcon`, `InfoIcon`, `FilterIcon`, `RefreshIcon`, `ImageIcon`, `MapPinIcon`, `PhoneIcon`, `BookmarkIcon`, `MessageIcon`, `CloudIcon`, `EyeOffIcon`, `UnlockIcon`, `MarkdownIcon`, `SunIcon`, `MoonIcon`, `DayNightIcon`), `size` default 24; `animated` uses CSS keyframes in the SVG (SMIL for `DayNightIcon`'s moon-phase cycle; static under reduced motion); import one with `janus-elements/ui/icons/edit` or all via `janus-elements/ui/icons`. `<CharactersIcon text="MW" animated />` (or children) for initials/UTF-8 glyphs with optional pulse; wrap with `<IconDiscWrapper>` / `<IconSquareWrapper>` / `<IconTriangleWrapper size color outline>` (`janus-elements/ui/characters-icon`, `…/icon-disc-wrapper`, `…/icon-square-wrapper`, `…/icon-triangle-wrapper`) |
| Tooltip | `<Tooltip tooltip="Text">trigger</Tooltip>`; `tooltip` can be a string or markup via `html\`...\``; shows on hover and focus; trigger gets `aria-describedby` |
| Navbar | `<Navbar titles value onChange label />`, a segmented control (`radiogroup`); `onChange` gets the title |
| Toolbar | `<Toolbar label orientation>…</Toolbar>`; children are typically `Button` and `Select` (any focusable works). Flush button-group bar (no gap; collapsed borders; outer corners only); `role="toolbar"` with roving tabindex; Arrow keys, Home and End move between items (Left/Right ignored while typing in a searchable Select). Deep import `janus-elements/ui/toolbar`. `RichTextarea` uses it for the Formatting bar |
| Route | `<Route hashRegex pathnameRegex basename />`; match if either regex matches |
| Location | `<Location render=${(loc) => …} />`; re-renders with `{ pathname, hashPath, hashParams, searchParams }` on navigation; also `pushHash` / `pushPathname` / `parseLocation` / `subscribeLocation` |
| Tabs | `<Tabs tabs=${[{ title, content }]} />`, with arrow, Home and End keys |
| Accordion | `<Accordion items=${[{ title, content }]} />` |
| Panel, Card | `<Panel color>...</Panel>`, `<Card title subtitle footer>...</Card>` |
| Table | `<Table caption columns=${[{ key, title, align, width, render }]} rows height rowHeight overscan />`; virtualizes body rows in a fixed-height viewport (defaults: `height` 320, `rowHeight` 40, `overscan` 5); `column.render(row)` customizes cells; `row.id` is the list key |
| Pagination | `<Pagination label page pages onChange />`; `onChange` gets the page number |
| BaseTheme | `<BaseTheme mode />`, see Theming |

`modal.alert`, `modal.confirm`, `modal.input` and `modal.dialog`, and
`toast.show(message, { color, duration })`, are imported from the same module.
`toast.show` returns a function that closes the toast. Modals use
`role="dialog"`, trap focus, lock body scroll while open, restore focus on
close, and honour `escapable` (default true: Escape and backdrop dismiss;
`false` disables both). An optional `title` labels the dialog. Opening a
modal while another is open stacks a new layer; Escape and `closeModal` pop
the top layer only.

## Helpers

### `janus-elements/ui/latestAsync`

Race-safe async factory (Node-safe, no DOM). Select’s `loadOptions` path uses
it with a 300ms debounce.

```js
import { createLatestAsync } from "janus-elements/ui/latestAsync";

const loads = createLatestAsync({ debounceMs: 300 });
const result = await loads.schedule(() => fetchOptions(query));
if (result === undefined) return; // superseded or cancel()
```

| API | Behaviour |
|---|---|
| `createLatestAsync({ debounceMs? })` | `debounceMs` defaults to `0`. |
| `run(task)` | Run immediately; only the latest generation delivers. Stale fulfill as `undefined` (stale errors are swallowed). |
| `schedule(task)` | Debounced `run`; coalesces while the timer is pending. |
| `cancel()` | Bump generation, clear the debounce timer, settle a pending `schedule` as `undefined`. |

Pass an `AbortSignal` into `task` when the underlying work must abort; the
helper only drops stale *results*.

### `janus-elements/ui/createIcon`

Icon factory plus hover-animation helpers. Button, Input, and Select use them
for `headIcon` / `tailIcon` (and Select’s clear control). Default export
`createIcon(className, fileBase)` registers a line-art icon class.

```js
import {
  animatedIconSlot,
  iconHoverHandlers,
  instantiateIcon,
} from "janus-elements/ui/createIcon";
import SearchIcon from "janus-elements/ui/icons/search";

const icon = animatedIconSlot(SearchIcon, {
  size: 16,
  animated: this.state.iconHover,
});
const hover = iconHoverHandlers(this, { disabled, stateKey: "iconHover" });
```

| Helper | Behaviour |
|---|---|
| `instantiateIcon(Icon, props?)` | Create a registered icon element for `${…}` interpolation; throws if unregistered. |
| `animatedIconSlot(Icon, { size, animated, style }?)` | Instantiates, sets `janusKey` to `icon-animated` / `icon-static` so the SVG remounts when `animated` flips, wraps in `<span>`. |
| `iconHoverHandlers(component, { disabled, stateKey }?)` | `{ onMouseEnter, onMouseLeave }` toggling `component.state[stateKey]` (default `iconHover`) only when the value would change. |

### `janus-elements/ui/highlight`

Janus-owned highlighter used by `CodeEditor`, docs `CodeSnippet`, and
RichTextarea fenced code. Deep import:

`highlight(code, language?)`, `detectLanguage({ filename?, content? })`,
`resolveLanguageId(name)`, `resolveHighlightLanguage({ language?, filename?, content? })`,
`LANGUAGE_IDS`, `escapeHtml(value)`, `ensureHighlightStyles()`.

### `janus-elements/ui/util`

Style/prop helpers for kit authors: `util.expand(...styleObjects)` merges style
objects; `util.forwardedProps(props)` copies props except `style` and functions
for spreading onto a host element.

### `janus-elements/ui/theme`

`theme.tone` / `theme.mix` / `theme.field` / `theme.choiceControl` /
`ensureThemeTokens` (also re-exported from `janus-elements/ui`). Live demos for
async/icon helpers: docs `#/helpers`.

## Trust and untrusted data

- **Event handlers** must be functions; non-function values are rejected.
- **Attribute values** (`href`, `src`, …), **`style=${{…}}` values**, and kit
  **props** are trusted application data. Do not pass raw user input without
  validating or encoding it in the app.
- Kit **icons** load SVG from package files via `innerHTML` — treat those assets
  as trusted, not as user uploads.
- Docs snippets highlighted with `janus-elements/ui/highlight` are
  author-controlled; the same rule applies if they ever become user content.

## Theming

Theme CSS tokens (and spinner keyframes) are installed lazily on first use of
`theme` helpers such as `tone` / `mix`, via `ensureThemeTokens()`. Shared
component stylesheets (`#janus-styles`, …) are created the same way on first
use. Unused generated style rules are soft-reclaimed from the CSSOM but kept in
a registry so remounted DOM that still carries Janus class names can revive
them. Components work with or without `<BaseTheme />`.

- `<BaseTheme />` adds page styles (body, links, headings, focus outline) and
  takes `mode`: `"system"` (the default, follows the operating system),
  `"light"` or `"dark"`. It records the choice as `data-janus-theme` on
  `<html>`.
- Components take a `color` prop: `standard`, `accent`, `success`, `warning`,
  `error`, `info`, or any CSS color. Shades are mixed from it with
  `color-mix()`.
- `theme.tone(color)` and `theme.mix(color, percent)` from
  `janus-elements/ui/theme` (or `janus-elements/ui`) give custom components the
  same colors.

Tokens: `--janus-bg`, `--janus-surface`, `--janus-raised`, `--janus-border`,
`--janus-border-strong`, `--janus-text`, `--janus-text-muted`, `--janus-accent`,
`--janus-success`, `--janus-warning`, `--janus-error`, `--janus-info`,
`--janus-focus`, `--janus-shadow`, `--janus-radius` and `--janus-font`.

The docs site has preset themes, a Custom theme page for editing a palette, and
an Export CSS control (`ExportIcon` button) in the header for the active theme
(light and dark rules that work with `BaseTheme` mode). Import
`janus-elements/ui` first, then the exported file.

The theme's own rules have zero specificity, so a plain rule in your stylesheet
wins in both themes:

```css
:root {
  --janus-accent: #7c3aed;
  --janus-radius: 10px;
}
```

To change a token for one theme only, repeat the theme's conditions: a
`@media (prefers-color-scheme: light)` rule on
`:root:not([data-janus-theme="dark"])`, plus `:root[data-janus-theme="light"]`.
Keep text and tone colors at 4.5:1 against `--janus-bg` and `--janus-surface`;
the defaults are checked in both themes by `src/tests/theme.spec.js`.

## Rendering

- `setState` and a parent's re-render update the existing DOM in place. Focus,
  typed text and scroll position survive, and child components keep their
  state; new props arrive through `componentWillReceiveProps(props, state)`.
- Give list items a `key`, a string or number unique among its siblings:
  `${items.map((item) => t\`<li key=${item.id}>...</li>\`)}`. Keyed items keep
  their DOM, typed text, focus and component state when items are added or
  removed. Reordering moves them, which can drop focus inside a moved item.
  `key` is not rendered and not passed on as a prop.
- Unkeyed nodes are matched in order, so inserting or removing unkeyed items
  early in a list shifts state to their neighbours.
- A node that is already in the document stays where it is when a template
  embeds it again, for example a component re-rendering its own
  `childElements`. Until that template output is passed to `render`, it holds a
  comment placeholder in the node's place, so use `render` rather than
  appending such output yourself.
- Re-rendering removes only attributes the template set. Attributes the browser
  or other scripts add, such as `open` on a `<details>` the user opened, are
  kept.
- Lifecycle hooks: `componentWillMount` and `componentDidMount` run on every
  connect, `componentWillUnmount` on every disconnect.

## Template syntax

- A tag starting with a capital letter is a Janus Elements component (`<Button>` renders
  `<janus-button>`); lowercase tags are HTML elements. A component must be
  registered before a template using it renders; an unknown one, such as a
  misspelled `<Buton>`, throws.
- Every element must be closed: `<br />`, `<p></p>`.
- Attribute values: `a`, `a=b`, `a="b"`, `a=${value}` or `a="${value}"`. A
  variable can't be mixed with text inside quotes; build the string in
  JavaScript instead.
- `<p ${object}>` spreads the object's entries as props.
- `style=${{ ... }}` becomes a generated class. Nested keys are selectors:
  `":hover"`, `">a"`, `"b"`. Identical style objects share one class; the rules
  live in two stylesheets in `<head>` and are removed when no live element
  still uses that class.
- On a component, `style` is applied to the first element the component
  renders, after the component's own styles, so it wins. Component elements
  themselves (`<janus-button>` and so on) use `display: contents` and have no
  box: scroll, measure or observe the component's root element, not the
  component element.
- `onClick=${fn}` (any `on` prop with a function) attaches an event listener.
  Event-handler attributes accept only functions: a string, including a static
  `onclick="..."`, throws. `undefined`, `null` and `false` attach nothing.
- On a component, `onClick=${fn}` and the like attach to the component's own
  element, and events from inside reach it by bubbling. Components should not
  pass those handlers on to inner elements, or they run twice.
- `<` followed by a letter, `/` or `!` starts a tag; anything else is text. To
  show text like `a<b`, pass it as a variable: `${"a<b"}`.
- Inside a double-quoted attribute value, `\"` is a literal quote. In
  JavaScript source that is written `\\"`.
- SVG works: `<svg>` and everything inside it is created in the SVG namespace,
  and content inside `<foreignObject>` is HTML again. Tags that exist only in
  SVG (`circle`, `path`, `rect`, `g` and so on) are SVG even in a nested
  template; tags that also exist in HTML (`a`, `title`, `style`, `script`) are
  SVG only when written inside the `<svg>` itself.
- HTML comments are not supported.
