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

const list = (page) => page.locator("janus-keyed-list");
const input = (page, name) => list(page).locator(`input[name="${name}"]`);
const counter = (page, name) => list(page).locator(
  "janus-item-counter button",
  {
    hasText: `${name}:`,
  },
);

// Clicking through the DOM keeps keyboard focus where the test put it.
const press = (page, action) => list(page).locator(`.${action}`).evaluate(
  (button) => button.click(),
);

const inputsInOrder = (page) => list(page).locator("li input").evaluateAll(
  (inputs) => inputs.map(
    ({
      name,
      value,
    }) => [
      name,
      value,
    ],
  ),
);

test(
  "removing the first item keeps the others' text, focus and state",
  async ({
    page,
  }) => {
    await counter(
      page,
      "b",
    ).click();
    await counter(
      page,
      "b",
    ).click();
    await input(
      page,
      "b",
    ).fill("B text");
    await input(
      page,
      "c",
    ).fill("C text");

    await press(
      page,
      "remove-first",
    );

    expect(await inputsInOrder(page)).toEqual(
      [
        [
          "b",
          "B text",
        ],
        [
          "c",
          "C text",
        ],
      ],
    );
    await expect(input(
      page,
      "c",
    )).toBeFocused();
    await expect(counter(
      page,
      "b",
    )).toHaveText("b: 2");
  },
);

test(
  "inserting at the front keeps existing items' text and state",
  async ({
    page,
  }) => {
    await counter(
      page,
      "a",
    ).click();
    await input(
      page,
      "a",
    ).fill("A text");
    await input(
      page,
      "b",
    ).fill("B text");

    await press(
      page,
      "add-first",
    );

    expect(await inputsInOrder(page)).toEqual(
      [
        [
          "z",
          "",
        ],
        [
          "a",
          "A text",
        ],
        [
          "b",
          "B text",
        ],
        [
          "c",
          "",
        ],
      ],
    );
    await expect(input(
      page,
      "b",
    )).toBeFocused();
    await expect(counter(
      page,
      "a",
    )).toHaveText("a: 1");
    await expect(counter(
      page,
      "z",
    )).toHaveText("z: 0");
  },
);

test(
  "reversing moves text and state with their items",
  async ({
    page,
  }) => {
    await counter(
      page,
      "a",
    ).click();
    await input(
      page,
      "a",
    ).fill("A text");
    await input(
      page,
      "c",
    ).fill("C text");

    await press(
      page,
      "reverse",
    );

    expect(await inputsInOrder(page)).toEqual(
      [
        [
          "c",
          "C text",
        ],
        [
          "b",
          "",
        ],
        [
          "a",
          "A text",
        ],
      ],
    );
    await expect(counter(
      page,
      "a",
    )).toHaveText("a: 1");
    await expect(counter(
      page,
      "c",
    )).toHaveText("c: 0");
  },
);

test(
  "key is not rendered as an attribute",
  async ({
    page,
  }) => {
    await expect(list(page).locator("li").first()).toBeVisible();
    expect(await list(page).locator("li").evaluateAll(
      (items) => items.some(
        (item) => item.hasAttribute("key"),
      ),
    )).toBe(false);
  },
);
