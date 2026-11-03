import assert from "node:assert/strict";
import {
  test,
} from "node:test";

import {
  buildExportCss,
  getThemePalettes,
  resetCustomTheme,
  setCustomTheme,
} from "../../docs/themes.js";

test(
  "buildExportCss emits light and dark token rules for a preset",
  () => {
    const css = buildExportCss("ocean");
    assert.match(
      css,
      /Janus Elements theme: ocean/,
    );
    assert.match(
      css,
      /:root \{/,
    );
    assert.match(
      css,
      /--janus-accent: #3ecfbf/,
    );
    assert.match(
      css,
      /@media \(prefers-color-scheme: light\)/,
    );
    assert.match(
      css,
      /:root:not\(\[data-janus-theme="dark"\]\)/,
    );
    assert.match(
      css,
      /:root\[data-janus-theme="light"\]/,
    );
    assert.match(
      css,
      /--janus-accent: #0b6e64/,
    );
    assert.match(
      css,
      /--janus-font:/,
    );
  },
);

test(
  "buildExportCss for custom uses the custom palette",
  () => {
    resetCustomTheme(
      {
        activate: false,
      },
    );
    const ocean = getThemePalettes("ocean");
    setCustomTheme(
      {
        light: {
          ...ocean.light,
          accent: "#112233",
        },
        dark: {
          ...ocean.dark,
          accent: "#aabbcc",
        },
      },
      {
        activate: false,
      },
    );
    const css = buildExportCss("custom");
    assert.match(
      css,
      /--janus-accent: #aabbcc/,
    );
    assert.match(
      css,
      /--janus-accent: #112233/,
    );
    resetCustomTheme(
      {
        activate: false,
      },
    );
  },
);
