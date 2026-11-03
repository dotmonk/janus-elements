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
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
  },
);

const headerLogo = (page) => page.locator("janus-app header svg[aria-label='Janus Elements']");

test(
  "the demo header shows the logo",
  {
    tag: "@smoke",
  },
  async ({
    page,
  }) => {
    await page.goto("/docs/");

    await expect(headerLogo(page)).toBeVisible();
    expect((await headerLogo(page).boundingBox()).width).toBeGreaterThanOrEqual(24);
  },
);

for (const [
  modeName,
  colorScheme,
] of [
  [
    "Day mode",
    "dark",
  ],
  [
    "Night mode",
    "light",
  ],
]) {
  test(
    `the logo follows the ${modeName.toLowerCase()} with 3:1 contrast`,
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
      const modeSelect = page.locator("janus-app header janus-select").nth(0);
      await modeSelect.getByRole("combobox").click();
      await page.getByRole(
        "option",
        {
          name: modeName,
        },
      ).click();
      await expect(headerLogo(page)).toBeVisible();

      const halves = await headerLogo(page).evaluate(
        (svg) => {
          const tools = window.colorTools;
          const rootStyle = getComputedStyle(document.documentElement);
          const background = tools.backgroundBehind(svg.parentElement);
          return [
            "warm",
            "cool",
          ].map(
            (half) => {
              const fill = tools.parseColor(getComputedStyle(svg.querySelector(`.janus-logo-${half}`)).fill);
              const token = tools.parseColor(rootStyle.getPropertyValue(half === "warm"
                ? "--janus-accent"
                : "--janus-text").trim().replace(
                /^#(..)(..)(..)$/,
                (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`,
              ));
              return {
                half,
                matchesToken: fill.every(
                  (channel, index) => Math.abs(channel - token[index]) < 0.01,
                ),
                ratio: tools.contrast(
                  fill,
                  background,
                ),
              };
            },
          );
        },
      );

      for (const {
        half,
        matchesToken,
        ratio,
      } of halves) {
        expect(
          matchesToken,
          `${half} half uses its token`,
        ).toBe(true);
        expect(
          ratio,
          `${half} half contrast`,
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );
}

test(
  "the SVG favicon and the .ico fallback are linked and load",
  async ({
    page,
    request,
  }) => {
    await page.goto("/docs/");

    const icons = await page.locator("link[rel='icon']").evaluateAll(
      (links) => links.map(
        (link) => link.href,
      ),
    );
    expect(icons.some(
      (href) => href.endsWith("/docs/logo.svg"),
    )).toBe(true);
    expect(icons.some(
      (href) => href.endsWith("/docs/favicon.ico"),
    )).toBe(true);

    for (const href of icons) {
      const response = await request.get(href);
      expect(
        response.status(),
        href,
      ).toBe(200);
    }
  },
);
