import {
  test,
  expect,
} from "@playwright/test";
import {
  readFileSync,
} from "node:fs";

const {
  exports: packageExports,
} = JSON.parse(readFileSync(
  new URL(
    "../../package.json",
    import.meta.url,
  ),
  "utf8",
));

const modulePath = (entry) => typeof entry === "string"
  ? entry
  : entry.import ?? entry.default;

test(
  "the package exports load in a browser",
  async ({
    page,
  }) => {
    expect(packageExports["."]).toBeTruthy();
    expect(packageExports["./ui"]).toBeTruthy();
    expect(packageExports["./ui/button"]).toBeTruthy();

    await page.goto("/src/tests/test.html");
    const names = await page.evaluate(
      async (paths) => {
        const [
          library,
          ui,
        ] = await Promise.all(paths.map(
          (path) => import(path.replace(
            /^\.\//,
            "/",
          )),
        ));
        return {
          library: Object.keys(library).sort(),
          ui: Object.keys(ui).sort(),
        };
      },
      [
        modulePath(packageExports["."]),
        modulePath(packageExports["./ui"]),
      ],
    );

    expect(names.library).toEqual(expect.arrayContaining(
      [
        "default",
        "html",
        "render",
      ],
    ));
    expect(names.ui).toEqual(expect.arrayContaining(
      [
        "modal",
        "theme",
        "toast",
        "util",
      ],
    ));
  },
);

test(
  "importing button alone does not register unrelated kit tags",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");
    const registered = await page.evaluate(
      async () => {
        await import("/src/janus/ui/Button.js");
        return {
          button: Boolean(customElements.get("janus-button")),
          table: Boolean(customElements.get("janus-table")),
          select: Boolean(customElements.get("janus-select")),
          searchIcon: Boolean(customElements.get("janus-search-icon")),
        };
      },
    );

    expect(registered).toEqual(
      {
        button: true,
        table: false,
        select: false,
        searchIcon: false,
      },
    );
  },
);

test(
  "importing one icon alone does not register other icons",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");
    const registered = await page.evaluate(
      async () => {
        await import("/src/janus/ui/icon/search.js");
        return {
          search: Boolean(customElements.get("janus-search-icon")),
          menu: Boolean(customElements.get("janus-menu-icon")),
          button: Boolean(customElements.get("janus-button")),
        };
      },
    );

    expect(registered).toEqual(
      {
        search: true,
        menu: false,
        button: false,
      },
    );
  },
);
