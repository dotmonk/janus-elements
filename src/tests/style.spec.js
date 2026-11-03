import {
  test,
  expect,
} from "@playwright/test";

test.beforeEach(
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
    await page.goto("/src/tests/ui-kit.html");
  },
);

test(
  "component elements are layout-transparent and unstyled",
  async ({
    page,
  }) => {
    const wrappers = await page.locator(".block-context > janus-panel, .block-context > janus-button").evaluateAll(
      (elements) => elements.map(
        (element) => ({
          tag: element.tagName.toLowerCase(),
          display: getComputedStyle(element).display,
          boxes: element.getClientRects().length,
          class: element.getAttribute("class"),
        }),
      ),
    );

    expect(wrappers).toEqual(
      [
        {
          tag: "janus-panel",
          display: "contents",
          boxes: 0,
          class: null,
        },
        {
          tag: "janus-button",
          display: "contents",
          boxes: 0,
          class: null,
        },
      ],
    );
  },
);

test(
  "style reaches the component's root element",
  async ({
    page,
  }) => {
    const panel = await page.locator(".block-context > janus-panel > div").evaluate(
      (root) => {
        const style = getComputedStyle(root);
        return {
          padding: style.paddingTop,
          margin: style.marginTop,
        };
      },
    );
    expect(panel).toEqual(
      {
        padding: "20px",
        margin: "12px",
      },
    );

    await expect(page.getByRole(
      "button",
      {
        name: "Spaced",
      },
    )).toHaveCSS(
      "margin-top",
      "24px",
    );
  },
);

test(
  "layout styles work through the component element",
  async ({
    page,
  }) => {
    const width = await page.locator(".flex-context > janus-panel > div").evaluate(
      (root) => root.getBoundingClientRect().width,
    );
    const fixed = await page.locator(".flex-context > span").evaluate(
      (span) => span.getBoundingClientRect().width,
    );

    expect(width).toBeCloseTo(
      400 - fixed,
      0,
    );
  },
);
