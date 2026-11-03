import {
  test,
  expect,
} from "@playwright/test";

const openDemo = async (page, variant) => {
  const pageErrors = [];
  page.on(
    "pageerror",
    (error) => pageErrors.push(error.message),
  );
  await page.goto(`/src/tests/format-demo.html?variant=${variant}`);
  await expect(page.locator("[data-testid=\"format-demo-root\"]")).toBeVisible();
  return pageErrors;
};

const snapshot = async (page) => page.evaluate(
  () => {
    const root = document.querySelector("[data-testid=\"format-demo-root\"]");
    const text = root.innerText.replace(
      /\s+/g,
      " ",
    ).trim();
    const nav = [
      ...root.querySelectorAll("[role=\"radio\"]"),
    ].map(
      (button) => ({
        label: button.textContent.trim(),
        checked: button.getAttribute("aria-checked"),
      }),
    );
    return {
      text,
      nav,
      hasForm: Boolean(root.querySelector("[data-testid=\"demo-form\"]")),
      hasPricing: Boolean(root.querySelector("[data-testid=\"demo-pricing\"]")),
    };
  },
);

test(
  "compact and spaced format-demo websites behave the same before formatting",
  async ({
    page,
  }) => {
    const compactErrors = await openDemo(
      page,
      "compact",
    );
    const compactSnap = await snapshot(page);
    expect(compactErrors).toEqual([]);

    await page.locator(
      "[role=\"radio\"]",
      {
        hasText: "Contact",
      },
    ).click();
    await page.locator("input[name=\"name\"]").fill("Ada");
    await page.locator("[data-testid=\"demo-form\"] button[type=\"submit\"]").click();
    await expect(page.locator("[data-testid=\"demo-success\"]")).toContainText("Thanks Ada");
    const compactAfter = await snapshot(page);

    const spacedErrors = await openDemo(
      page,
      "spaced",
    );
    const spacedSnap = await snapshot(page);
    expect(spacedErrors).toEqual([]);
    expect(spacedSnap).toEqual(compactSnap);

    await page.locator(
      "[role=\"radio\"]",
      {
        hasText: "Contact",
      },
    ).click();
    await page.locator("input[name=\"name\"]").fill("Ada");
    await page.locator("[data-testid=\"demo-form\"] button[type=\"submit\"]").click();
    await expect(page.locator("[data-testid=\"demo-success\"]")).toContainText("Thanks Ada");
    const spacedAfter = await snapshot(page);
    expect(spacedAfter).toEqual(compactAfter);
  },
);
