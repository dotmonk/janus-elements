# Changelog

All notable changes to `janus-elements`. Versions follow semantic versioning;
until 1.0, a breaking change bumps the minor version and anything else the
patch version.

## [0.1.0] - Unreleased

First release (prepared for npm; not published yet).

### Added

- **Core:** `Component`, `Component.register`, React-style lifecycle, and the
  `html` tagged template (props, spreads, events, style objects, SVG). Layout-
  transparent custom elements (`display: contents`); a component’s `style` styles
  its root. In-place DOM updates keep focus, typed text, scroll, and child state;
  `key` preserves list items. Modules evaluate in Node without `document`.
- **Theming:** CSS tokens with light/dark (system or `BaseTheme` `mode`),
  `theme.tone` / `theme.mix`, lazy `ensureThemeTokens`, and style-rule GC that
  soft-reclaims unused generated classes. Defaults meet WCAG AA contrast.
- **UI kit:** Button, Input, Textarea, NumberInput, RangeInput, ColorInput,
  FileInput, Select, Checkbox, Switch, RadioGroup, Field, Badge, Feedback,
  Progress, Spinner, Tooltip, Navbar, Toolbar, Tabs, Accordion, Panel, Card,
  Table, Pagination, DatePicker, TimePicker, DateTimePicker, WeekPicker,
  MonthPicker, DateRangePicker, CodeEditor, RichTextarea, plus `modal` and
  `toast`. Deep imports (`janus-elements/ui/button`, …) or the `ui` barrel;
  `*Props` types on deep entry points.
- **Select:** Searchable/clearable/multi/creatable/grouped options, async
  `loadOptions` (debounce, cache, loading row), `renderOption` / `renderValue`,
  `headIcon` / `tailIcon`, portaled menu, typeahead when not searchable.
- **Date and time:** Portaled ISO pickers with optional `locale` (default
  `en-US`), `clearable`, calendar/clock chrome, segmented `TimePicker`.
- **Icons:** Forty-five line-art icons (static + animated; reduced-motion safe),
  `CharactersIcon`, disc/square/triangle wrappers; `createIcon` and hover helpers
  (`animatedIconSlot`, `iconHoverHandlers`). Button/Input/Select animate
  `headIcon` / `tailIcon` on hover.
- **CodeEditor + highlight:** Hand-written grammars (JS/TS, HTML/XML, CSS,
  JSON, CSV, Markdown, shell, and others); language from prop, filename, or
  content. Helpers on `janus-elements/ui/highlight`.
- **RichTextarea:** Markdown WYSIWYG (`value` / `onChange` are Markdown) with
  fixed Formatting `Toolbar`, lists/tasks/tables/links/images, source mode via
  CodeEditor, undo/redo, and Ctrl/Cmd+B/I.
- **Table:** Virtualized body rows (`height`, `rowHeight`, `overscan`).
- **Routing:** `Route`, `Location`, `pushHash` / `pushPathname`, and related
  helpers.
- **Helpers:** `janus-elements/ui/latestAsync` (`createLatestAsync`);
  `janus-elements/ui/util` (`expand`, `forwardedProps`).
- **Accessibility:** Select combobox/listbox + keyboard; modal dialog, focus
  trap, Escape/`escapable`, scroll lock, stacked layers; Field/Tooltip
  `aria-describedby`; Toolbar roving tabindex.
- **Package:** `exports` / `sideEffects` from `exports.manifest.json` (via
  `scripts/sync-ui-exports.mjs`); TypeScript check-only (`tsc --noEmit`).
- **Tooling and docs:** `januse` CLI as package `bin` (lint, format, dev;
  ships `bin/` + `scripts/januse/`); `./check.sh` in Docker (also CI and Pages);
  live docs with helpers/tooling pages and theme export.

### Notes

- Pre-1.0 APIs may still change. See [README.md](README.md) for install status
  and trust boundaries (no HTML sanitizer).
