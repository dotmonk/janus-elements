import {
  test,
  expect,
} from "@playwright/test";

test(
  "browser test page reports no failures",
  async ({
    page,
  }) => {
    const pageErrors = [];
    page.on(
      "pageerror",
      (error) => pageErrors.push(error.message),
    );
    page.on(
      "console",
      (message) => {
        if (message.type() === "error") {
          pageErrors.push(message.text());
        }
      },
    );

    await page.goto("/src/tests/test.html");

    await expect(page.locator(
      "p",
      {
        hasText: "Total:",
      },
    )).toContainText("Error: 0");
    expect(pageErrors).toEqual([]);
  },
);
