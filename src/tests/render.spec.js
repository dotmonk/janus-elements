import {
  test,
  expect,
} from "@playwright/test";

let pageErrors;

test.beforeEach(
  async ({
    page,
  }) => {
    pageErrors = [];
    page.on(
      "pageerror",
      (error) => pageErrors.push(error.message),
    );
    await page.goto("/src/tests/render.html");
  },
);

test.afterEach(
  () => {
    expect(pageErrors).toEqual([]);
  },
);

const renderCount = (page, name) => page.evaluate(
  (componentName) => window.renderCounts[componentName],
  name,
);

test(
  "typing keeps focus and text while the component re-renders",
  async ({
    page,
  }) => {
    const input = page.locator("janus-typing-field input");

    await input.click();
    await page.keyboard.type("hello");

    await expect(input).toBeFocused();
    await expect(input).toHaveValue("hello");
    await expect(page.locator("janus-typing-field .echo")).toHaveText("hello");
  },
);

test(
  "typing keeps focus in content passed to a child component",
  async ({
    page,
  }) => {
    const input = page.locator("janus-slotted-field input");

    await input.click();
    await page.keyboard.type("hello");

    await expect(input).toBeFocused();
    await expect(input).toHaveValue("hello");
    await expect(page.locator("janus-slotted-field .echo")).toHaveText("hello");
  },
);

test(
  "content stays focused and mounted when its holder re-renders itself",
  async ({
    page,
  }) => {
    const input = page.locator("janus-reslotted-field input");

    await input.click();
    await page.keyboard.type("ab");
    await page.locator("janus-ticking-frame .tick").evaluate(
      (tick) => tick.click(),
    );

    await expect(page.locator("janus-ticking-frame .tick")).toHaveText("1");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("ab");
    expect(await page.evaluate(
      () => window.mountCount,
    )).toBe(1);
  },
);

test(
  "child keeps its state through a parent re-render and gets new props",
  async ({
    page,
  }) => {
    const counter = page.locator("janus-click-counter button");

    await counter.click();
    await counter.click();
    await expect(counter).toHaveText("Parent render 0: 2");

    await page.locator(".rerender").click();

    await expect(page.locator(".parent-renders")).toHaveText("1");
    await expect(counter).toHaveText("Parent render 1: 2");
  },
);

test(
  "handlers see the latest values and fire once per event",
  async ({
    page,
  }) => {
    const rerender = page.locator(".rerender");

    await rerender.click();
    await rerender.click();
    await rerender.click();

    await expect(page.locator(".parent-renders")).toHaveText("3");
  },
);

test(
  "components render once on mount and once per parent re-render",
  async ({
    page,
  }) => {
    await expect(page.locator("janus-wrapper b")).toHaveCount(3);
    expect(await renderCount(
      page,
      "Wrapper",
    )).toBe(1);
    expect(await renderCount(
      page,
      "ClickCounter",
    )).toBe(1);

    await page.locator(".rerender").click();
    await expect(page.locator(".parent-renders")).toHaveText("1");

    expect(await renderCount(
      page,
      "ClickCounter",
    )).toBe(2);
  },
);

test(
  "attributes the browser toggles survive a re-render",
  async ({
    page,
  }) => {
    const details = page.locator(".plain-details");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute(
      "open",
      "",
    );

    await page.locator(".disclosure-rerender").evaluate(
      (button) => button.click(),
    );
    await expect(page.locator(".flagged")).toHaveText("1");

    await expect(details).toHaveAttribute(
      "open",
      "",
    );
  },
);

test(
  "attributes the template stops setting are removed",
  async ({
    page,
  }) => {
    const rerender = page.locator(".disclosure-rerender");
    const flagged = page.locator(".flagged");

    await rerender.click();
    await expect(flagged).toHaveAttribute(
      "data-odd",
      "",
    );
    await rerender.click();
    await expect(flagged).toHaveText("2");
    await expect(flagged).not.toHaveAttribute(
      "data-odd",
      /.*/,
    );
  },
);

test(
  "templates create SVG elements, and HTML inside foreignObject",
  async ({
    page,
  }) => {
    const namespaces = await page.locator("janus-icon-host").evaluate(
      (host) => [
        "svg",
        "circle",
        "foreignObject",
        ".inside-foreign",
      ].map(
        (selector) => host.querySelector(selector).namespaceURI,
      ),
    );
    expect(namespaces).toEqual(
      [
        "http://www.w3.org/2000/svg",
        "http://www.w3.org/2000/svg",
        "http://www.w3.org/2000/svg",
        "http://www.w3.org/1999/xhtml",
      ],
    );

    const icon = page.locator("svg.icon");
    await expect(icon).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
    expect((await icon.boundingBox()).width).toBe(24);
  },
);

test(
  "re-rendering updates SVG attributes and SVG elements take events",
  async ({
    page,
  }) => {
    const circle = page.locator("svg.icon circle");
    await expect(circle).toHaveAttribute(
      "r",
      "6",
    );

    await page.locator(".grow-icon").click();
    await expect(circle).toHaveAttribute(
      "r",
      "10",
    );

    await circle.dispatchEvent("click");
    expect(await page.evaluate(
      () => window.iconClicks,
    )).toBe(1);
  },
);

test(
  "SVG-only tags from nested templates are SVG elements",
  async ({
    page,
  }) => {
    const namespaces = await page.locator("svg.icon .nested-rect").evaluateAll(
      (rects) => rects.map(
        (rect) => rect.namespaceURI,
      ),
    );

    expect(namespaces).toEqual(
      [
        "http://www.w3.org/2000/svg",
        "http://www.w3.org/2000/svg",
      ],
    );
  },
);

test(
  "select value is applied after options exist and on re-render",
  async ({
    page,
  }) => {
    const select = page.locator(".month-select");
    await expect(select).toHaveValue("10");
    await page.locator(".set-march").click();
    await expect(select).toHaveValue("3");
  },
);
