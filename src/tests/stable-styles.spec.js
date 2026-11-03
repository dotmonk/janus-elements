import {
  test,
  expect,
} from "@playwright/test";

test.describe(
  "stable styles",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await page.emulateMedia(
          {
            reducedMotion: "reduce",
          },
        );
      },
    );

    const buttonClass = (page, name) => page.getByRole(
      "button",
      {
        name,
        exact: true,
      },
    ).getAttribute("class");

    test(
      "identical styles share one class",
      async ({
        page,
      }) => {
        await page.goto("/docs/#/ui/modals");
        expect(await buttonClass(
          page,
          "Dialog",
        )).toBe(await buttonClass(
          page,
          "Alert",
        ));
      },
    );

    test(
      "a re-render keeps the classes of unchanged elements",
      async ({
        page,
      }) => {
        await page.goto("/docs/#/ui/feedback");
        const before = await buttonClass(
          page,
          "Show toast",
        );

        await page.getByRole("alert").filter(
          {
            hasText: "Something went wrong",
          },
        ).getByRole(
          "button",
          {
            name: "Dismiss",
          },
        ).click();
        await expect(page.getByRole("alert")).toHaveCount(1);

        expect(await buttonClass(
          page,
          "Show toast",
        )).toBe(before);
      },
    );

    test(
      "components render no style elements",
      async ({
        page,
      }) => {
        await page.goto("/docs/#/ui/buttons");
        const styles = await page.evaluate(
          () => document.querySelectorAll("janus-docs-ui-buttons style").length,
        );
        expect(styles).toBe(0);
      },
    );

    const styleSheetText = (page) => page.evaluate(
      () => {
        const serialize = (id) => {
          const element = document.getElementById(id);
          if (!element) {
            return "";
          }
          if (element.sheet) {
            return [
              ...element.sheet.cssRules,
            ].map(
              (rule) => rule.cssText,
            ).join("\n");
          }
          return element.textContent || "";
        };
        return `${serialize("janus-styles")}\n${serialize("janus-styles-legacy")}`;
      },
    );

    const styleGcHost = (page) => page.locator("janus-style-gc-host");

    test(
      "unused unique style rules are reclaimed",
      async ({
        page,
      }) => {
        await page.goto("/src/tests/render.html");
        const before = await styleSheetText(page);

        await styleGcHost(page).evaluate(
          (host) => {
            host.setState(
              {
                mode: "unique",
                uniqueCount: 5,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-unique-4")).toBeVisible();
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );

        const withUnique = await styleSheetText(page);
        expect(withUnique.length).toBeGreaterThan(before.length);
        expect(withUnique).toMatch(/margin-top:\s*5px/);

        await styleGcHost(page).evaluate(
          (host) => {
            host.setState(
              {
                mode: "empty",
                uniqueCount: 0,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-unique-0")).toHaveCount(0);
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );

        const after = await styleSheetText(page);
        expect(after).not.toMatch(/margin-top:\s*[1-5]px/);
        expect(after.length).toBeLessThanOrEqual(before.length + 20);
      },
    );

    test(
      "a shared style rule survives while one element still uses it",
      async ({
        page,
      }) => {
        await page.goto("/src/tests/render.html");

        await styleGcHost(page).evaluate(
          (host) => {
            host.setState(
              {
                mode: "shared",
                uniqueCount: 0,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-shared-b")).toBeVisible();
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );

        const sharedClass = await page.locator(".style-gc-shared-a").evaluate(
          (element) => Array.from(element.classList).find(
            (name) => name.startsWith("janus-"),
          ),
        );
        expect(sharedClass).toBeTruthy();
        expect(await styleSheetText(page)).toContain(`.${sharedClass}`);

        await styleGcHost(page).evaluate(
          (host) => {
            host.setState(
              {
                mode: "shared-one",
                uniqueCount: 0,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-shared-b")).toHaveCount(0);
        await expect(page.locator(".style-gc-shared-a")).toBeVisible();
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );

        expect(await styleSheetText(page)).toContain(`.${sharedClass}`);
        expect(await page.locator(".style-gc-shared-a").evaluate(
          (element, className) => Array.from(element.classList).includes(className),
          sharedClass,
        )).toBe(true);
      },
    );

    test(
      "soft-reclaimed style rules revive when remounted DOM is retained",
      async ({
        page,
      }) => {
        await page.goto("/src/tests/render.html");
        const host = styleGcHost(page);

        await host.evaluate(
          (element) => {
            element.setState(
              {
                mode: "unique",
                uniqueCount: 1,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-unique-0")).toBeVisible();
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );

        const className = await page.locator(".style-gc-unique-0").evaluate(
          (element) => Array.from(element.classList).find(
            (name) => name.startsWith("janus-"),
          ),
        );
        expect(className).toBeTruthy();
        expect(await styleSheetText(page)).toContain(`.${className}`);

        await page.evaluate(
          () => {
            window.__janusStyleRemount = document.querySelector(".style-gc-unique-0");
          },
        );
        await host.evaluate(
          (element) => {
            element.setState(
              {
                mode: "empty",
                uniqueCount: 0,
              },
            );
          },
        );
        await expect(page.locator(".style-gc-unique-0")).toHaveCount(0);
        await page.evaluate(
          () => new Promise(
            (resolve) => queueMicrotask(resolve),
          ),
        );
        expect(await styleSheetText(page)).not.toContain(`.${className}`);

        await page.evaluate(
          async () => {
            const node = window.__janusStyleRemount;
            document.body.append(node);
            const {
              retainStyleClassesInTree,
            } = await import("/src/janus/template/createTemplateFunction.js");
            retainStyleClassesInTree(node);
            await new Promise(
              (resolve) => queueMicrotask(resolve),
            );
          },
        );

        expect(await styleSheetText(page)).toContain(`.${className}`);
        expect(await page.evaluate(
          (name) => getComputedStyle(document.querySelector(`.${name}`)).marginTop === "1px",
          className,
        )).toBe(true);
      },
    );
  },
);

test(
  "spinners keep animating after docs navigation",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "no-preference",
      },
    );
    await page.goto("/docs/");
    const sideNav = page.locator("nav[aria-label=\"Documentation\"]");
    await sideNav.getByRole(
      "button",
      {
        name: "Spinners",
        exact: true,
      },
    ).click();
    await expect(page.locator("janus-docs-ui-spinners")).toBeVisible();

    const spinner = page.locator("janus-docs-ui-spinners [role='status'] span").first();
    const animationName = () => spinner.evaluate(
      (element) => getComputedStyle(element).animationName,
    );

    expect(await animationName()).toMatch(/janusSpin/i);

    await sideNav.getByRole(
      "button",
      {
        name: "Buttons",
        exact: true,
      },
    ).click();
    await expect(page.locator("janus-docs-ui-buttons")).toBeVisible();
    await expect(page.locator("janus-docs-ui-spinners")).toHaveCount(0);

    await sideNav.getByRole(
      "button",
      {
        name: "Spinners",
        exact: true,
      },
    ).click();
    await expect(page.locator("janus-docs-ui-spinners")).toBeVisible();
    expect(await animationName()).toMatch(/janusSpin/i);
  },
);
