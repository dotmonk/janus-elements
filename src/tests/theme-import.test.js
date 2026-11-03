import {
  test,
} from "node:test";
import assert from "node:assert/strict";

test(
  "theme.js evaluates in Node without installing document CSS",
  async () => {
    assert.equal(
      typeof document,
      "undefined",
    );
    const themeModule = await import("../janus/ui/theme.js");
    const theme = themeModule.default;
    assert.equal(
      typeof themeModule.ensureThemeTokens,
      "function",
    );
    assert.equal(
      typeof theme.tone,
      "function",
    );
    assert.equal(
      theme.tone("accent"),
      "var(--janus-accent)",
    );
    assert.match(
      theme.mix(
        "var(--janus-accent)",
        20,
      ),
      /color-mix/,
    );
    assert.equal(
      typeof theme.dismissButton,
      "object",
    );
    themeModule.ensureThemeTokens();
  },
);

test(
  "core and Button evaluate in Node without document",
  async () => {
    assert.equal(
      typeof document,
      "undefined",
    );
    const core = await import("../janus/index.js");
    assert.equal(
      typeof core.default,
      "function",
    );
    assert.equal(
      typeof core.html,
      "function",
    );
    await import("../janus/ui/Button.js");
  },
);
