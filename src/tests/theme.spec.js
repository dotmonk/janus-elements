import {
  test,
  expect,
} from "@playwright/test";

import {
  installColorTools,
} from "./color-tools.js";

test.beforeEach(
  async ({
    page,
  }) => {
    await page.addInitScript(installColorTools);
  },
);

const bodyLuminance = (page) => page.evaluate(
  () => window.colorTools.luminance(window.colorTools.backgroundBehind(document.body)),
);

for (const colorScheme of [
  "dark",
  "light",
]) {
  test(
    `text and input borders meet WCAG AA in the ${colorScheme} theme`,
    async ({
      page,
    }) => {
      await page.emulateMedia(
        {
          colorScheme,
          reducedMotion: "reduce",
        },
      );
      await page.goto("/docs/");
      await expect(page.locator("janus-docs-about")).toBeVisible();

      expect(await page.evaluate(
        () => window.colorTools.audit(),
      )).toEqual([]);

      await page.goto("/docs/#/ui/buttons");
      await expect(page.locator("janus-docs-ui-buttons")).toBeVisible();
      await page.mouse.move(
        1,
        1,
      );

      expect(await page.evaluate(
        () => window.colorTools.audit(),
      )).toEqual([]);
    },
  );
}

test(
  "the theme follows the system color scheme",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        colorScheme: "light",
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/");
    expect(await bodyLuminance(page)).toBeGreaterThan(0.8);

    await page.emulateMedia(
      {
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    );
    expect(await bodyLuminance(page)).toBeLessThan(0.05);
  },
);

test(
  "the demo's theme and mode Selects share the same trigger height",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/");
    const modeTrigger = page.locator("janus-app header janus-select").nth(0).locator("[data-janus-select-trigger]");
    const themeTrigger = page.locator("janus-app header janus-select").nth(1).locator("[data-janus-select-trigger]");
    await expect(modeTrigger).toBeVisible();
    await expect(themeTrigger).toBeVisible();
    const modeBox = await modeTrigger.boundingBox();
    const themeBox = await themeTrigger.boundingBox();
    expect(modeBox).toBeTruthy();
    expect(themeBox).toBeTruthy();
    expect(Math.abs(modeBox.height - themeBox.height)).toBeLessThanOrEqual(1);
  },
);

test(
  "the demo's mode selector overrides the system setting",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/");
    const modeSelect = page.locator("janus-app header janus-select").nth(0);
    await expect(modeSelect.locator("janus-day-night-icon svg").first()).toBeVisible();

    await modeSelect.getByRole("combobox").click();
    await expect(page.getByRole(
      "option",
      {
        name: "Day mode",
      },
    ).locator("janus-sun-icon svg")).toBeVisible();
    await page.getByRole(
      "option",
      {
        name: "Day mode",
      },
    ).click();
    expect(await bodyLuminance(page)).toBeGreaterThan(0.8);
    await expect(modeSelect.locator("janus-sun-icon svg").first()).toBeVisible();

    await modeSelect.getByRole("combobox").click();
    await expect(page.getByRole(
      "option",
      {
        name: "Night mode",
      },
    ).locator("janus-moon-icon svg")).toBeVisible();
    await page.getByRole(
      "option",
      {
        name: "System mode",
      },
    ).click();
    expect(await bodyLuminance(page)).toBeLessThan(0.05);
    await expect(modeSelect.locator("janus-day-night-icon svg").first()).toBeVisible();
  },
);

test(
  "the demo's theme selector changes tokens while mode still flips",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/");

    const accent = () => page.evaluate(
      () => getComputedStyle(document.documentElement).getPropertyValue("--janus-accent").trim(),
    );

    const defaultAccent = await accent();
    const themeSelect = page.locator("janus-app header janus-select").nth(1);
    await expect(themeSelect).toContainText("Janus");
    await themeSelect.getByRole("combobox").click();
    const oceanOption = page.getByRole(
      "option",
      {
        name: "Ocean",
      },
    );
    await expect(oceanOption.locator("[aria-hidden=\"true\"] > span").nth(0)).toHaveCSS(
      "background-color",
      "rgb(11, 110, 100)",
    );
    await expect(oceanOption.locator("[aria-hidden=\"true\"] > span").nth(1)).toHaveCSS(
      "background-color",
      "rgb(62, 207, 191)",
    );
    await oceanOption.click();
    expect(await accent()).not.toBe(defaultAccent);
    expect(await page.evaluate(
      () => document.documentElement.dataset.janusDocsTheme,
    )).toBe("ocean");

    const modeSelect = page.locator("janus-app header janus-select").nth(0);
    await modeSelect.getByRole("combobox").click();
    await page.getByRole(
      "option",
      {
        name: "Day mode",
      },
    ).click();
    expect(await bodyLuminance(page)).toBeGreaterThan(0.8);

    await modeSelect.getByRole("combobox").click();
    await page.getByRole(
      "option",
      {
        name: "Night mode",
      },
    ).click();
    expect(await bodyLuminance(page)).toBeLessThan(0.05);
    expect(await accent()).not.toBe(defaultAccent);
  },
);

test(
  "custom theme editor previews and export downloads active CSS",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/#/ui/custom-theme");
    await expect(page.locator("janus-docs-ui-custom-theme")).toBeVisible();

    const themeSelect = page.locator("janus-app header janus-select").nth(1);
    await themeSelect.getByRole("combobox").click();
    await page.getByRole(
      "option",
      {
        name: "Ocean",
      },
    ).click();

    await page.getByRole(
      "button",
      {
        name: "Start from active theme",
      },
    ).click();
    await expect(themeSelect).toContainText("Custom");
    expect(await page.evaluate(
      () => document.documentElement.dataset.janusDocsTheme,
    )).toBe("custom");

    await page.locator("janus-docs-ui-custom-theme").getByRole(
      "radio",
      {
        name: "Night",
      },
    ).click();
    const accentField = page.locator("janus-docs-ui-custom-theme .docs-custom-theme-editor").locator("code:text-is(\"accent\")").locator("..").locator("input[type=\"text\"]");
    await accentField.fill("#ff00aa");
    expect(await page.evaluate(
      () => getComputedStyle(document.documentElement).getPropertyValue("--janus-accent").trim(),
    )).toBe("#ff00aa");

    const downloadPromise = page.waitForEvent("download");
    await page.locator("janus-app header").getByRole(
      "button",
      {
        name: "Export CSS",
      },
    ).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("janus-theme-custom.css");
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const css = Buffer.concat(chunks).toString("utf8");
    expect(css).toContain("--janus-accent: #ff00aa");
    expect(css).toContain("@media (prefers-color-scheme: light)");
    expect(css).toContain(":root[data-janus-theme=\"light\"]");
  },
);

test(
  "keyboard focus shows a high-contrast outline",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
    await page.goto("/docs/");
    await page.keyboard.press("Tab");

    const focus = await page.evaluate(
      () => {
        const element = document.activeElement;
        const style = getComputedStyle(element);
        const tools = window.colorTools;
        return {
          style: style.outlineStyle,
          ratio: tools.contrast(
            tools.parseColor(style.outlineColor),
            tools.backgroundBehind(element.parentElement),
          ),
        };
      },
    );

    expect(focus.style).not.toBe("none");
    expect(focus.ratio).toBeGreaterThanOrEqual(3);
  },
);

for (const colorScheme of [
  "dark",
  "light",
]) {
  test(
    `an app stylesheet can override a token in the ${colorScheme} theme`,
    async ({
      page,
    }) => {
      await page.emulateMedia(
        {
          colorScheme,
          reducedMotion: "reduce",
        },
      );
      await page.goto("/src/tests/ui-kit.html");
      await page.addStyleTag(
        {
          content: ":root { --janus-text: rgb(1, 2, 3); }",
        },
      );

      const color = await page.getByRole(
        "button",
        {
          name: "Button",
          exact: true,
        },
      ).evaluate(
        (button) => getComputedStyle(button).color,
      );

      expect(color).toBe("rgb(1, 2, 3)");
    },
  );
}

test(
  "a custom CSS color still tints a component",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/ui-kit.html");

    const [
      standard,
      custom,
    ] = await Promise.all([
      "Button",
      "Custom tone",
    ].map(
      (name) => page.getByRole(
        "button",
        {
          name,
          exact: true,
        },
      ).evaluate(
        (button) => window.colorTools.parseColor(getComputedStyle(button).backgroundColor),
      ),
    ));

    expect(custom).not.toEqual(standard);
    expect(custom[0]).toBeGreaterThan(custom[2]);
  },
);
