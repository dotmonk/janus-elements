import {
  test,
  expect,
} from "@playwright/test";

test(
  "library entry point exports Component, html and render only",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    const exportNames = await page.evaluate(
      async () => Object.keys(await import("/src/janus/index.js")),
    );

    expect(exportNames).toEqual(expect.arrayContaining(
      [
        "default",
        "html",
        "render",
      ],
    ));
    expect(exportNames).not.toContain("t");
    expect(exportNames).not.toContain("PropTypes");
    expect(exportNames).not.toContain("script");
  },
);
