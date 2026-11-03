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
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
  },
);

test.afterEach(
  () => {
    expect(pageErrors).toEqual([]);
  },
);

const sectionHosts = {
  Buttons: "janus-docs-ui-buttons",
  Inputs: "janus-docs-ui-inputs",
  "Date and time": "janus-docs-ui-date-time",
  "Form controls": "janus-docs-ui-form-controls",
  Feedback: "janus-docs-ui-feedback",
  Tooltip: "janus-docs-ui-tooltip",
  "Navigation and layout": "janus-docs-ui-navigation-layout",
  "Data display": "janus-docs-ui-data",
};

const section = (page, title) => page.locator(sectionHosts[title]);

const openSection = async (page, hash) => {
  await page.goto(`/docs/#${hash}`);
};

test.describe(
  "select",
  () => {
    test(
      "exposes combobox roles and supports keyboard",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select").first();
        const trigger = select.getByRole("combobox").first();
        await expect(select.locator("janus-search-icon")).toHaveCount(0);
        await expect(select.locator("janus-chevron-icon")).toHaveCount(1);

        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "false",
        );
        await trigger.focus();
        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole("option").first()).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "false",
        );
        await expect(page.getByRole("listbox")).toHaveCount(0);

        // Input may still be focused after Escape; ArrowDown re-opens, next moves.
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "false",
        );
        await expect(trigger).toHaveValue("Option #2");
      },
    );

    test(
      "filters options while searchable",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select").first();
        const trigger = select.getByRole("combobox").first();

        await trigger.click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.keyboard.type("#3");
        await expect(page.getByRole("option")).toHaveCount(1);
        await expect(page.getByRole("option")).toHaveText("Option #3");
        await page.keyboard.press("Enter");
        await expect(trigger).toHaveValue("Option #3");
      },
    );

    test(
      "headIcon and tailIcon control trigger icons",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const asyncSelect = page.locator("janus-docs-ui-select janus-select.async-select");
        await expect(asyncSelect.locator("janus-search-icon")).toHaveCount(0);
        await expect(asyncSelect.locator("janus-chevron-icon")).toHaveCount(1);
        const asyncSearch = page.locator("janus-docs-ui-select janus-select.async-search-select");
        await expect(asyncSearch.locator("janus-search-icon")).toHaveCount(1);
        await expect(asyncSearch.locator("janus-chevron-icon")).toHaveCount(0);
        const filterTail = page.locator("janus-docs-ui-select janus-select.filter-tail-select");
        await expect(filterTail.locator("janus-filter-icon")).toHaveCount(1);
        await expect(filterTail.locator("janus-chevron-icon")).toHaveCount(0);
        const plain = page.locator("janus-docs-ui-select janus-select").first();
        await expect(plain.locator("janus-search-icon")).toHaveCount(0);
        const typeahead = page.locator("janus-docs-ui-select janus-select.typeahead-select");
        await expect(typeahead.locator("janus-chevron-icon")).toHaveCount(0);
      },
    );

    test(
      "typeahead jumps when searchable is false",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.typeahead-select");
        const trigger = select.getByRole("combobox").first();
        await expect(select.locator("janus-search-icon")).toHaveCount(0);
        await expect(select.locator("janus-chevron-icon")).toHaveCount(0);

        await trigger.focus();
        await page.keyboard.type("ooo");
        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        const activeId = await trigger.getAttribute("aria-activedescendant");
        expect(activeId).toBeTruthy();
        await expect(page.locator(`#${activeId}`)).toContainText("Option #3");
        await page.keyboard.press("Enter");
        await expect(trigger).toContainText("Option #3");
      },
    );

    test(
      "non-searchable select menu anchors under the trigger",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.render-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        const aligned = await page.evaluate(
          () => {
            const menu = document.getElementById("janus-ui-select-menu");
            const control = document.querySelector("janus-docs-ui-select janus-select.render-select [data-janus-select-trigger]");
            if (
              !menu ||
              !control
            ) {
              return false;
            }
            const menuBox = menu.getBoundingClientRect();
            const triggerBox = control.getBoundingClientRect();
            return Math.abs(menuBox.left - triggerBox.left) < 2 && menuBox.top >= triggerBox.bottom - 1 && menuBox.top < triggerBox.bottom + 24;
          },
        );
        expect(aligned).toBe(true);
      },
    );

    test(
      "menu stays usable inside an overflow scroller",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const scroller = page.locator(".select-overflow-scroller");
        const select = page.locator("janus-docs-ui-select janus-select.overflow-select");
        await select.getByRole("combobox").first().click();
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        const option = page.getByRole(
          "option",
          {
            name: "Charlie",
          },
        );
        await expect(option).toBeVisible();
        const escapedOverflow = await page.evaluate(
          () => {
            const menu = document.getElementById("janus-ui-select-menu");
            const scroller = document.querySelector(".select-overflow-scroller");
            if (
              !menu ||
              !scroller
            ) {
              return false;
            }
            const menuBox = menu.getBoundingClientRect();
            const scrollerBox = scroller.getBoundingClientRect();
            return menu.parentElement === document.body && menuBox.bottom > scrollerBox.bottom + 1;
          },
        );
        expect(escapedOverflow).toBe(true);
        await option.click();
        await expect(select.getByRole("combobox").first()).toHaveValue("Charlie");
        await expect(scroller).toBeVisible();
      },
    );

    test(
      "select reopens on click while the trigger stays focused",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select").first();
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole(
          "option",
          {
            name: "Option #2",
          },
        )).toBeVisible();
      },
    );

    test(
      "clearable clears the value",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.clearable-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await page.getByRole(
          "option",
          {
            name: "Option #1",
          },
        ).click();
        await expect(trigger).toHaveValue("Option #1");
        await expect(select.locator("janus-close-icon")).toHaveCount(1);
        await select.getByRole(
          "button",
          {
            name: "Clear",
          },
        ).click();
        await expect(trigger).toHaveValue("");
        await expect(trigger).toHaveAttribute(
          "placeholder",
          "Clearable",
        );
        await expect(select.locator("janus-close-icon")).toHaveCount(0);
      },
    );

    test(
      "multi selects values as chips and keeps the menu open",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.multi-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await expect(page.getByRole("listbox")).toHaveAttribute(
          "aria-multiselectable",
          "true",
        );
        await page.getByRole(
          "option",
          {
            name: "Option #1",
          },
        ).click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole(
          "option",
          {
            name: "Option #1",
          },
        )).toHaveCount(0);
        await expect(select.getByRole(
          "button",
          {
            name: "Remove Option #1",
          },
        )).toBeVisible();
        await page.getByRole(
          "option",
          {
            name: "Alpha",
          },
        ).click();
        await expect(select.getByRole(
          "button",
          {
            name: "Remove Alpha",
          },
        )).toBeVisible();
        await expect(page.getByRole("listbox")).toBeVisible();
      },
    );

    test(
      "multi chip remove, clearable, and Backspace work",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.multi-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await page.getByRole(
          "option",
          {
            name: "Option #1",
          },
        ).click();
        await page.getByRole(
          "option",
          {
            name: "Option #2",
          },
        ).click();
        await select.getByRole(
          "button",
          {
            name: "Remove Option #1",
          },
        ).click();
        await expect(select.getByRole(
          "button",
          {
            name: "Remove Option #1",
          },
        )).toHaveCount(0);
        await expect(select.getByRole(
          "button",
          {
            name: "Remove Option #2",
          },
        )).toBeVisible();
        await trigger.focus();
        await page.keyboard.press("Backspace");
        await expect(select.getByRole(
          "button",
          {
            name: "Remove Option #2",
          },
        )).toHaveCount(0);
        await trigger.click();
        await page.getByRole(
          "option",
          {
            name: "Bravo",
          },
        ).click();
        await select.getByRole(
          "button",
          {
            name: "Clear",
          },
        ).click();
        await expect(select.getByRole(
          "button",
          {
            name: /^Remove /,
          },
        )).toHaveCount(0);
        await expect(page.getByRole("listbox")).toHaveCount(0);
      },
    );

    test(
      "groups show headings and disabled options are not selectable",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.grouped-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await expect(page.getByRole("listbox")).toContainText("Fruit");
        await expect(page.getByRole("listbox")).toContainText("Veg");
        const disabled = page.getByRole(
          "option",
          {
            name: "Cherry",
          },
        );
        await expect(disabled).toHaveAttribute(
          "aria-disabled",
          "true",
        );
        await disabled.click(
          {
            force: true,
          },
        );
        await expect(trigger).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        await expect(trigger).toHaveValue("");
        await page.getByRole(
          "option",
          {
            name: "Apple",
          },
        ).click();
        await expect(trigger).toHaveValue("Apple");
      },
    );

    test(
      "creatable adds a new option from the filter",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.creatable-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await page.keyboard.type("Durian");
        const createOption = page.getByRole(
          "option",
          {
            name: "Create \"Durian\"",
          },
        );
        await expect(createOption).toBeVisible();
        await createOption.click();
        await expect(trigger).toHaveValue("Durian");
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await trigger.click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole(
          "option",
          {
            name: "Durian",
            exact: true,
          },
        )).toBeVisible();
      },
    );

    test(
      "async loadOptions shows loading then results",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.async-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await expect(page.locator(".janus-select-loading")).toBeVisible(
          {
            timeout: 5000,
          },
        );
        await expect(page.getByRole(
          "option",
          {
            name: "Alpha",
          },
        )).toBeVisible(
          {
            timeout: 5000,
          },
        );
        await page.keyboard.type("alp");
        await expect(page.getByRole(
          "option",
          {
            name: "Alpine",
          },
        )).toBeVisible(
          {
            timeout: 5000,
          },
        );
        await expect(page.getByRole(
          "option",
          {
            name: "Beta",
          },
        )).toHaveCount(0);
        await page.getByRole(
          "option",
          {
            name: "Alpine",
          },
        ).click();
        await expect(trigger).toHaveValue("Alpine");
      },
    );

    test(
      "async loadOptions ignores stale resolutions",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        await page.evaluate(
          async () => {
            const {
              html,
              render,
            } = await import("janus-elements");
            await import("janus-elements/ui");
            const host = document.createElement("div");
            host.id = "async-stale-host";
            document.body.appendChild(host);
            const loadOptions = (input) => new Promise(
              (resolve) => {
                const delay = input === "slow"
                  ? 400
                  : 40;
                setTimeout(
                  () => {
                    resolve(
                      [
                        {
                          name: input === "slow"
                            ? "Slow result"
                            : "Fast result",
                          value: input || "empty",
                        },
                      ],
                    );
                  },
                  delay,
                );
              },
            );
            render(
              host,
              html`
                <Select
                  class="async-stale-select"
                  placeholder="Stale race"
                  loadOptions=${loadOptions}
                />
              `,
            );
          },
        );
        const select = page.locator("#async-stale-host janus-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await page.keyboard.type("slow");
        await page.waitForTimeout(350);
        await trigger.fill("fast");
        await expect(page.getByRole(
          "option",
          {
            name: "Fast result",
          },
        )).toBeVisible(
          {
            timeout: 5000,
          },
        );
        await page.waitForTimeout(500);
        await expect(page.getByRole(
          "option",
          {
            name: "Slow result",
          },
        )).toHaveCount(0);
        await expect(page.getByRole(
          "option",
          {
            name: "Fast result",
          },
        )).toBeVisible();
      },
    );

    test(
      "renderOption and renderValue customize labels",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/select",
        );
        const select = page.locator("janus-docs-ui-select janus-select.render-select");
        const trigger = select.getByRole("combobox").first();
        await trigger.click();
        await expect(page.getByRole(
          "option",
          {
            name: "• Option #1",
          },
        )).toBeVisible();
        await page.getByRole(
          "option",
          {
            name: "• Option #2",
          },
        ).click();
        await expect(select).toContainText("★ Option #2");
      },
    );
  },
);

test.describe(
  "modal",
  () => {
    test(
      "dialog traps focus, Escape closes, and focus is restored",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/modals",
        );
        const opener = page.getByRole(
          "button",
          {
            name: "Confirm",
            exact: true,
          },
        );
        await opener.focus();
        await opener.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute(
          "aria-modal",
          "true",
        );
        await expect(page.locator("#janus-ui-modal button").first()).toBeFocused();

        await page.keyboard.press("Escape");
        await expect(page.locator("#janus-ui-modal")).toHaveCount(0);
        await expect(opener).toBeFocused();
      },
    );

    test(
      "dialog locks body scroll while open",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/modals",
        );
        await page.evaluate(
          () => {
            document.body.style.overflow = "auto";
          },
        );
        await page.getByRole(
          "button",
          {
            name: "Confirm",
            exact: true,
          },
        ).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("hidden");
        await page.keyboard.press("Escape");
        await expect(page.locator("#janus-ui-modal")).toHaveCount(0);
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("auto");
      },
    );

    test(
      "escapable false ignores Escape and backdrop click",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/modals",
        );
        await page.evaluate(
          async () => {
            const {
              modal,
            } = await import("janus-elements/ui");
            window.__modalClosed = false;
            modal.dialog(
              document.createTextNode("Locked"),
              {
                escapable: false,
                callback: () => {
                  window.__modalClosed = true;
                },
              },
            );
          },
        );

        const dialog = page.getByRole("dialog");
        await expect(dialog).toContainText("Locked");
        await page.keyboard.press("Escape");
        await expect(page.locator("#janus-ui-modal")).toHaveCount(1);
        await page.locator("#janus-ui-modal > div").click(
          {
            position: {
              x: 5,
              y: 5,
            },
          },
        );
        await expect(page.locator("#janus-ui-modal")).toHaveCount(1);
        expect(await page.evaluate(
          () => window.__modalClosed,
        )).toBe(false);

        await page.evaluate(
          async () => {
            const {
              modal,
            } = await import("janus-elements/ui");
            modal.closeModal();
          },
        );
        await expect(page.locator("#janus-ui-modal")).toHaveCount(0);
      },
    );

    test(
      "nested dialogs stack; Escape and closeModal pop the top only",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/modals",
        );
        await page.evaluate(
          () => {
            document.body.style.overflow = "auto";
          },
        );

        await page.evaluate(
          async () => {
            const {
              html,
            } = await import("janus-elements");
            const {
              modal,
            } = await import("janus-elements/ui");
            window.__outerClosed = false;
            modal.dialog(
              html`
                <div>
                  Outer
                  <Button
                    onClick=${() => {
                      modal.dialog(
                        html`
                          <div>Inner</div>
                        `,
                        {
                          title: "Inner",
                        },
                      );
                    }}
                  >Open inner</Button>
                </div>
              `,
              {
                title: "Outer",
                callback: () => {
                  window.__outerClosed = true;
                },
              },
            );
          },
        );

        await expect(page.getByRole("dialog")).toHaveCount(1);
        await expect(page.getByRole("dialog")).toContainText("Outer");
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("hidden");

        await page.getByRole(
          "button",
          {
            name: "Open inner",
          },
        ).click();
        await expect(page.getByRole("dialog")).toHaveCount(2);
        await expect(page.getByRole("dialog").nth(1)).toContainText("Inner");
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("hidden");

        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(1);
        await expect(page.getByRole("dialog")).toContainText("Outer");
        expect(await page.evaluate(
          () => window.__outerClosed,
        )).toBe(false);
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("hidden");

        await page.keyboard.press("Escape");
        await expect(page.locator("#janus-ui-modal")).toHaveCount(0);
        expect(await page.evaluate(
          () => window.__outerClosed,
        )).toBe(true);
        expect(await page.evaluate(
          () => document.body.style.overflow,
        )).toBe("auto");
      },
    );
  },
);

test.describe(
  "buttons",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/buttons",
        );
      },
    );

    test(
      "headIcon and tailIcon render beside the label",
      async ({
        page,
      }) => {
        const both = section(
          page,
          "Buttons",
        ).locator("janus-button.icon-button-both");
        await expect(both.locator("janus-search-icon")).toHaveCount(1);
        await expect(both.locator("janus-export-icon")).toHaveCount(1);
        await expect(both.getByRole(
          "button",
          {
            name: "Both",
          },
        )).toBeVisible();
        const headOnly = section(
          page,
          "Buttons",
        ).locator("janus-button.icon-button");
        await expect(headOnly.locator("janus-search-icon")).toHaveCount(1);
        await expect(headOnly.locator("janus-export-icon")).toHaveCount(0);
      },
    );

    test(
      "headIcon animates on hover",
      async ({
        page,
      }) => {
        await page.emulateMedia(
          {
            reducedMotion: "no-preference",
          },
        );
        const withHead = section(
          page,
          "Buttons",
        ).locator("janus-button.icon-button");
        await withHead.evaluate(
          (host) => host.setState(
            {
              iconHover: true,
            },
          ),
        );
        await expect.poll(
          async () => withHead.locator("janus-search-icon").evaluate(
            (icon) => icon.state.file,
          ),
        ).toMatch(/-animated\.svg$/);
      },
    );

    test(
      "disabled headIcon stays static on hover",
      async ({
        page,
      }) => {
        await page.emulateMedia(
          {
            reducedMotion: "no-preference",
          },
        );
        const disabled = section(
          page,
          "Buttons",
        ).locator("janus-button.icon-button-disabled");
        await disabled.evaluate(
          (host) => host.setState(
            {
              iconHover: true,
            },
          ),
        );
        await expect.poll(
          async () => disabled.locator("janus-search-icon").evaluate(
            (icon) => icon.state.file,
          ),
        ).toMatch(/(^|\/)search\.svg$/);
      },
    );
  },
);

test.describe(
  "inputs",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/inputs",
        );
      },
    );

    const summary = (page) => section(
      page,
      "Inputs",
    ).locator(".inputs-summary");

    test(
      "headIcon animates on hover",
      async ({
        page,
      }) => {
        await page.emulateMedia(
          {
            reducedMotion: "no-preference",
          },
        );
        const withHead = section(
          page,
          "Inputs",
        ).locator("janus-input.icon-input");
        await withHead.evaluate(
          (host) => host.setState(
            {
              iconHover: true,
            },
          ),
        );
        await expect.poll(
          async () => withHead.locator("janus-search-icon").evaluate(
            (icon) => icon.state.file,
          ),
        ).toMatch(/-animated\.svg$/);
      },
    );

    test(
      "headIcon and tailIcon render inside the field",
      async ({
        page,
      }) => {
        const withHead = section(
          page,
          "Inputs",
        ).locator("janus-input.icon-input");
        await expect(withHead.locator("janus-search-icon")).toHaveCount(1);
        await expect(withHead.locator("input")).toHaveAttribute(
          "placeholder",
          "Search",
        );
        const withTail = section(
          page,
          "Inputs",
        ).locator("janus-input.tail-icon-input");
        await expect(withTail.locator("janus-calendar-icon")).toHaveCount(1);
        await expect(withTail.locator("input")).toHaveAttribute(
          "placeholder",
          "Date",
        );
        const plain = section(
          page,
          "Inputs",
        ).locator("janus-input").first();
        await expect(plain.locator("janus-search-icon")).toHaveCount(0);
        await expect(plain.locator("janus-calendar-icon")).toHaveCount(0);
      },
    );

    test(
      "number input reports numeric onChange values",
      async ({
        page,
      }) => {
        const input = page.getByLabel("Count");
        await expect(summary(page)).toContainText("Count: 3");
        await input.fill("12");
        await expect(summary(page)).toContainText("Count: 12");
        await expect(input).toHaveAttribute(
          "min",
          "0",
        );
        await expect(input).toHaveAttribute(
          "max",
          "100",
        );
        await expect(input).toHaveAttribute(
          "step",
          "1",
        );
      },
    );

    test(
      "a disabled number input cannot be edited",
      async ({
        page,
      }) => {
        const locked = page.getByLabel("Locked");
        await expect(locked).toBeDisabled();
        await locked.fill(
          "9",
          {
            force: true,
          },
        ).catch(
          () => {},
        );
        await expect(locked).toHaveValue("7");
      },
    );

    test(
      "range input reports numeric onChange values",
      async ({
        page,
      }) => {
        const slider = page.getByLabel("Volume");
        await expect(summary(page)).toContainText("Volume: 40");
        await slider.fill("75");
        await expect(summary(page)).toContainText("Volume: 75");
      },
    );

    test(
      "color input round-trips hex values",
      async ({
        page,
      }) => {
        const color = page.getByLabel("Swatch");
        await expect(summary(page)).toContainText("Swatch: #e3b04b");
        await color.fill("#136a43");
        await expect(summary(page)).toContainText("Swatch: #136a43");
      },
    );

    test(
      "file input reports selected files",
      async ({
        page,
      }) => {
        const file = page.getByLabel("Files");
        await expect(summary(page)).toContainText("Files: none");
        await file.setInputFiles(
          {
            name: "avatar.png",
            mimeType: "image/png",
            buffer: Buffer.from(
              [
                137,
                80,
                78,
                71,
              ],
            ),
          },
        );
        await expect(summary(page)).toContainText("Files: avatar.png");
        await expect(file).toHaveAttribute(
          "multiple",
          "",
        );
      },
    );
  },
);

test.describe(
  "date and time",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/date-time",
        );
      },
    );

    const summary = (page) => section(
      page,
      "Date and time",
    ).locator(".date-time-summary");

    test(
      "date picker opens a dialog grid and commits a day",
      async ({
        page,
      }) => {
        const trigger = page.getByRole("combobox").filter(
          {
            hasText: /2026|Oct|28/,
          },
        ).first();
        await expect(summary(page)).toContainText("Date: 2026-10-28");
        await trigger.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("grid")).toBeVisible();
        await dialog.getByRole(
          "gridcell",
          {
            name: "15",
            exact: true,
          },
        ).click();
        await expect(summary(page)).toContainText("Date: 2026-10-15");
        await expect(page.getByRole("dialog")).toHaveCount(0);
      },
    );

    test(
      "date picker closes with Escape and supports clear",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-picker");
        const trigger = host.getByRole("combobox");
        await trigger.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await host.getByRole(
          "button",
          {
            name: "Clear date",
          },
        ).click();
        await expect(summary(page)).toContainText("Date: —");
      },
    );

    test(
      "date picker month select opens on the viewed month",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-picker");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByLabel(
          "Month",
          {
            exact: true,
          },
        )).toHaveValue("10");
        await expect(dialog.getByLabel(
          "Year",
          {
            exact: true,
          },
        )).toHaveValue("2026");
        await page.keyboard.press("Escape");
      },
    );

    test(
      "date picker jumps month and year from the header controls",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-picker");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel(
          "Month",
          {
            exact: true,
          },
        ).selectOption("3");
        const year = dialog.getByLabel(
          "Year",
          {
            exact: true,
          },
        );
        await year.fill("2024");
        await year.dispatchEvent("change");
        await expect(dialog.getByLabel(
          "Month",
          {
            exact: true,
          },
        )).toHaveValue("3");
        await expect(year).toHaveValue("2024");
        await dialog.getByRole(
          "gridcell",
          {
            name: "12",
            exact: true,
          },
        ).click();
        await expect(summary(page)).toContainText("Date: 2024-03-12");
      },
    );

    test(
      "time picker edits hour and minute segments",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-time-picker").first();
        await expect(summary(page)).toContainText("Time: 14:30");
        const hours = host.getByRole(
          "spinbutton",
          {
            name: "Hours",
          },
        );
        const minutes = host.getByRole(
          "spinbutton",
          {
            name: "Minutes",
          },
        );
        await hours.click();
        await page.keyboard.type("09");
        await expect(summary(page)).toContainText("Time: 09:30");
        await expect(minutes).toBeFocused();
        await page.keyboard.type("05");
        await expect(summary(page)).toContainText("Time: 09:05");
      },
    );

    test(
      "time picker 12-hour mode steps and toggles period",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-time-picker").nth(1);
        await expect(summary(page)).toContainText("12-hour: 09:15");
        const hours = host.getByRole(
          "spinbutton",
          {
            name: "Hours",
          },
        );
        await hours.click();
        await page.keyboard.press("ArrowUp");
        await expect(summary(page)).toContainText("12-hour: 10:15");
        await host.getByLabel(
          "Period",
          {
            exact: true,
          },
        ).selectOption("PM");
        await expect(summary(page)).toContainText("12-hour: 22:15");
      },
    );

    test(
      "datetime picker commits date and time together",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-time-picker");
        await expect(summary(page)).toContainText("DateTime: 2026-10-28T14:30");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByLabel(
          "Month",
          {
            exact: true,
          },
        )).toHaveValue("10");
        await dialog.getByRole(
          "gridcell",
          {
            name: "20",
            exact: true,
          },
        ).click();
        await dialog.getByLabel("Hour").selectOption("10");
        await dialog.getByLabel("Minute").selectOption("15");
        await dialog.getByRole(
          "button",
          {
            name: "Done",
          },
        ).click();
        await expect(summary(page)).toContainText("DateTime: 2026-10-20T10:15");
      },
    );

    test(
      "week picker commits an ISO week",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-week-picker");
        await expect(summary(page)).toContainText("Week: 2026-W44");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole(
          "row",
          {
            name: "Week 42",
          },
        ).click();
        await expect(summary(page)).toContainText("Week: 2026-W42");
      },
    );

    test(
      "clear control sits inside the date picker field",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-picker");
        const field = host.locator("[data-janus-picker-field]");
        await expect(field.getByRole("combobox")).toBeVisible();
        await expect(field.getByRole(
          "button",
          {
            name: "Clear date",
          },
        )).toBeVisible();
      },
    );

    test(
      "date picker calendar icon animates on hover",
      async ({
        page,
      }) => {
        await page.emulateMedia(
          {
            reducedMotion: "no-preference",
          },
        );
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-picker");
        await host.evaluate(
          (el) => el.setState(
            {
              triggerHover: true,
            },
          ),
        );
        await expect.poll(
          async () => host.locator("janus-calendar-icon").evaluate(
            (icon) => icon.state.file,
          ),
        ).toMatch(/-animated\.svg$/);
      },
    );

    test(
      "week picker highlights a full week row on hover",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-week-picker");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        const row = dialog.getByRole(
          "row",
          {
            name: "Week 44",
          },
        );
        await row.hover();
        const background = await row.evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        );
        expect(background).not.toBe("rgba(0, 0, 0, 0)");
        expect(background).not.toBe("transparent");
        await page.keyboard.press("Escape");
      },
    );

    test(
      "month picker commits a month",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-month-picker");
        await expect(summary(page)).toContainText("Month: 2026-10");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole(
          "gridcell",
          {
            name: /Jan/i,
          },
        ).click();
        await expect(summary(page)).toContainText("Month: 2026-01");
      },
    );

    test(
      "month picker jumps year from the header spin",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-month-picker");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        const year = dialog.getByLabel(
          "Year",
          {
            exact: true,
          },
        );
        await year.fill("2024");
        await year.dispatchEvent("change");
        await expect(year).toHaveValue("2024");
        await dialog.getByRole(
          "gridcell",
          {
            name: /Jun/i,
          },
        ).click();
        await expect(summary(page)).toContainText("Month: 2024-06");
      },
    );

    test(
      "date range picker selects start then end",
      async ({
        page,
      }) => {
        const host = section(
          page,
          "Date and time",
        ).locator("janus-date-range-picker");
        await expect(summary(page)).toContainText("Range: 2026-10-10 → 2026-10-20");
        await host.getByRole("combobox").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog.getByRole(
          "gridcell",
          {
            name: "5",
            exact: true,
          },
        ).click();
        await expect(dialog).toContainText(/pick end/i);
        await dialog.getByRole(
          "gridcell",
          {
            name: "12",
            exact: true,
          },
        ).click();
        await expect(summary(page)).toContainText("Range: 2026-10-05 → 2026-10-12");
        await host.getByRole(
          "button",
          {
            name: "Clear date range",
          },
        ).click();
        await expect(summary(page)).toContainText("Range: —");
      },
    );
  },
);

test.describe(
  "form controls",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/form-controls",
        );
      },
    );

    const summary = (page) => section(
      page,
      "Form controls",
    ).locator(".form-summary");

    test(
      "checkbox toggles by click and Space and reports checked",
      async ({
        page,
      }) => {
        const checkbox = page.getByRole(
          "checkbox",
          {
            name: "Email notifications",
          },
        );
        await expect(checkbox).toBeChecked();

        await checkbox.click();
        await expect(checkbox).not.toBeChecked();
        await expect(summary(page)).toContainText("Notifications: off");

        await checkbox.focus();
        await page.keyboard.press("Space");
        await expect(checkbox).toBeChecked();
        await expect(summary(page)).toContainText("Notifications: on");
      },
    );

    test(
      "a disabled checkbox cannot be toggled",
      async ({
        page,
      }) => {
        const checkbox = page.getByRole(
          "checkbox",
          {
            name: "Unavailable option",
          },
        );
        await expect(checkbox).toBeDisabled();
        await checkbox.click(
          {
            force: true,
          },
        );
        await expect(checkbox).not.toBeChecked();
      },
    );

    test(
      "switch is exposed as a switch and toggles",
      async ({
        page,
      }) => {
        const toggle = page.getByRole(
          "switch",
          {
            name: "Compact layout",
          },
        );
        await expect(toggle).not.toBeChecked();

        await toggle.click();
        await expect(toggle).toBeChecked();
        await expect(summary(page)).toContainText("Compact layout: on");

        await page.keyboard.press("Space");
        await expect(toggle).not.toBeChecked();
        await expect(summary(page)).toContainText("Compact layout: off");
      },
    );

    test(
      "radio group moves with the arrow keys",
      async ({
        page,
      }) => {
        const group = page.getByRole(
          "radiogroup",
          {
            name: "Plan",
          },
        );
        await expect(group.getByRole(
          "radio",
          {
            name: "Free",
          },
        )).toBeChecked();

        await group.getByRole(
          "radio",
          {
            name: "Free",
          },
        ).focus();
        await page.keyboard.press("ArrowDown");

        await expect(group.getByRole(
          "radio",
          {
            name: "Pro",
          },
        )).toBeChecked();
        await expect(group.getByRole(
          "radio",
          {
            name: "Pro",
          },
        )).toBeFocused();
        await expect(summary(page)).toContainText("Plan: pro");
      },
    );

    test(
      "field labels target their control and show hint and error",
      async ({
        page,
      }) => {
        await expect(page.getByLabel(
          "Email",
          {
            exact: true,
          },
        )).toHaveValue("janus@example.com");
        await page.getByText(
          "Email",
          {
            exact: true,
          },
        ).click();
        await expect(page.getByLabel(
          "Email",
          {
            exact: true,
          },
        )).toBeFocused();

        const fields = section(
          page,
          "Form controls",
        );
        await expect(fields.locator(
          "small",
          {
            hasText: "We never share your address.",
          },
        )).toBeVisible();
        await expect(fields.locator(
          "small",
          {
            hasText: "That name is taken.",
          },
        )).toBeVisible();

        const email = page.getByLabel(
          "Email",
          {
            exact: true,
          },
        );
        const describedBy = await email.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();
        const described = await page.evaluate(
          (ids) => {
            return ids.split(/\s+/).map(
              (id) => document.getElementById(id)?.textContent?.trim(),
            ).filter(Boolean);
          },
          describedBy,
        );
        expect(described.join(" ")).toMatch(/never share/i);
      },
    );
  },
);

test.describe(
  "feedback",
  () => {
    test(
      "alerts use alert or status roles and can be dismissed",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/feedback",
        );
        const feedback = section(
          page,
          "Feedback",
        );
        await expect(feedback.getByRole("alert")).toHaveCount(2);
        await expect(feedback.getByRole("status")).toHaveCount(2);

        await feedback.getByRole("alert").filter(
          {
            hasText: "Something went wrong",
          },
        ).getByRole(
          "button",
          {
            name: "Dismiss",
          },
        ).click();

        await expect(feedback.getByRole("alert")).toHaveCount(1);
        await expect(feedback.getByRole("alert").filter(
          {
            hasText: "Something went wrong",
          },
        )).toHaveCount(0);
      },
    );

    test(
      "toasts appear in a live region and close",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/feedback",
        );
        const region = page.locator("#janus-ui-toasts");

        await page.getByRole(
          "button",
          {
            name: "Show toast",
            exact: true,
          },
        ).click();
        await expect(region).toHaveAttribute(
          "aria-live",
          "polite",
        );
        await expect(region).toContainText("Settings saved");

        await region.getByRole(
          "button",
          {
            name: "Dismiss notification",
          },
        ).click();
        await expect(region).not.toContainText("Settings saved");
      },
    );

    test(
      "toasts disappear after their duration",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/feedback",
        );
        await page.evaluate(
          async () => {
            const {
              toast,
            } = await import("janus-elements/ui");
            toast.show(
              "Short-lived",
              {
                duration: 800,
              },
            );
          },
        );
        const region = page.locator("#janus-ui-toasts");

        await expect(region).toContainText("Short-lived");
        await expect(region).not.toContainText(
          "Short-lived",
          {
            timeout: 5000,
          },
        );
      },
    );

    test(
      "tooltip shows string and html markup content",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/tooltip",
        );
        const tip = section(
          page,
          "Tooltip",
        );
        const bubbles = tip.locator("[role='tooltip']");

        await expect(tip.getByRole(
          "button",
          {
            name: "String tooltip",
          },
        )).toBeVisible();
        await expect(tip.getByRole(
          "button",
          {
            name: "Markup tooltip",
          },
        )).toBeVisible();
        await expect(bubbles).toHaveCount(2);
        await expect(bubbles.nth(0)).toContainText("Plain string content");
        await expect(bubbles.nth(1)).toContainText("Bold");
        await expect(bubbles.nth(1).locator("b")).toHaveText("Bold");
        await expect(bubbles.nth(1).locator("i")).toHaveText("italic");

        const stringTrigger = tip.getByRole(
          "button",
          {
            name: "String tooltip",
          },
        );
        const describedBy = await stringTrigger.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();
        await expect(tip.locator(`#${describedBy}`)).toHaveAttribute(
          "role",
          "tooltip",
        );

        await tip.getByRole(
          "button",
          {
            name: "Markup tooltip",
          },
        ).hover();
        await expect(bubbles.nth(1)).toBeVisible();
      },
    );

    test(
      "progress exposes its role and value",
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/feedback",
        );
        const upload = page.getByRole(
          "progressbar",
          {
            name: "Upload",
          },
        );
        await expect(upload).toHaveAttribute(
          "aria-valuenow",
          "65",
        );
        await expect(upload).toHaveAttribute(
          "aria-valuemax",
          "100",
        );

        const ratio = await upload.evaluate(
          (track) => track.lastElementChild.getBoundingClientRect().width / track.getBoundingClientRect().width,
        );
        expect(ratio).toBeCloseTo(
          0.65,
          1,
        );

        const processing = page.getByRole(
          "progressbar",
          {
            name: "Processing",
          },
        );
        await expect(processing).toBeVisible();
        await expect(processing).not.toHaveAttribute(
          "aria-valuenow",
          /.*/,
        );
      },
    );
  },
);

test.describe(
  "navigation and layout",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/navigation-layout",
        );
      },
    );

    test(
      "tabs follow the WAI-ARIA tabs pattern",
      async ({
        page,
      }) => {
        const tablist = page.getByRole("tablist");
        const tab = (name) => tablist.getByRole(
          "tab",
          {
            name,
          },
        );
        await expect(tab("Overview")).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await expect(page.getByRole(
          "tabpanel",
          {
            name: "Overview",
          },
        )).toBeVisible();

        await tab("Details").click();
        await expect(tab("Details")).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await expect(page.getByRole(
          "tabpanel",
          {
            name: "Details",
          },
        )).toBeVisible();
        await expect(page.getByRole(
          "tabpanel",
          {
            name: "Overview",
          },
        )).toBeHidden();

        await page.keyboard.press("ArrowRight");
        await expect(tab("Settings")).toBeFocused();
        await expect(tab("Settings")).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await page.keyboard.press("ArrowRight");
        await expect(tab("Overview")).toBeFocused();
        await page.keyboard.press("End");
        await expect(tab("Settings")).toBeFocused();
        await page.keyboard.press("Home");
        await expect(tab("Overview")).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await expect(tab("Details")).toHaveAttribute(
          "tabindex",
          "-1",
        );
      },
    );

    test(
      "an opened accordion item stays open when its parent re-renders",
      async ({
        page,
      }) => {
        const item = page.locator("janus-accordion details").filter(
          {
            hasText: "Can I use it without a build step?",
          },
        );
        await item.locator("summary").click();
        await expect(item).toHaveAttribute(
          "open",
          "",
        );
        await expect(item.getByText("Yes. Import the ES modules directly.")).toBeVisible();

        await page.getByRole(
          "tab",
          {
            name: "Details",
          },
        ).click();
        await expect(page.getByRole(
          "tabpanel",
          {
            name: "Details",
          },
        )).toBeVisible();

        await expect(item).toHaveAttribute(
          "open",
          "",
        );
        await item.locator("summary").click();
        await expect(item).not.toHaveAttribute(
          "open",
          "",
        );
      },
    );

    test(
      "navbar exposes a radiogroup of segment radios",
      async ({
        page,
      }) => {
        const group = section(
          page,
          "Navigation and layout",
        ).getByRole(
          "radiogroup",
          {
            name: "Navigation",
          },
        ).first();
        await expect(group).toBeVisible();
        await expect(group.getByRole(
          "radio",
          {
            name: "First",
          },
        )).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await group.getByRole(
          "radio",
          {
            name: "Second",
          },
        ).click();
        await expect(group.getByRole(
          "radio",
          {
            name: "Second",
          },
        )).toHaveAttribute(
          "aria-checked",
          "true",
        );
      },
    );

    test(
      "accordion open state follows item id across reorder",
      async ({
        page,
      }) => {
        await page.goto("/src/tests/render.html");
        // Drop abort noise from the describe beforeEach leaving /docs/ mid-fetch.
        pageErrors.length = 0;
        const host = page.locator("janus-accordion-reorder-host");
        const beta = host.locator("details").filter(
          {
            hasText: "Beta",
          },
        );
        await beta.locator("summary").click();
        await expect(beta).toHaveAttribute(
          "open",
          "",
        );
        await host.locator(".reorder").click();
        const betaAfter = host.locator("details").filter(
          {
            hasText: "Beta",
          },
        );
        await expect(betaAfter).toHaveAttribute(
          "open",
          "",
        );
        await expect(betaAfter.getByText("B body")).toBeVisible();
      },
    );

    test(
      "cards show title, body and footer",
      async ({
        page,
      }) => {
        const card = page.getByRole("article").filter(
          {
            hasText: "For small teams",
          },
        );
        await expect(card.getByRole(
          "heading",
          {
            name: "Team",
          },
        )).toBeVisible();
        await expect(card.getByText("Shared workspaces and roles.")).toBeVisible();
        await expect(card.getByRole(
          "button",
          {
            name: "Choose Team",
          },
        )).toBeVisible();
      },
    );
  },
);

test.describe(
  "data display",
  () => {
    test.beforeEach(
      async ({
        page,
      }) => {
        await openSection(
          page,
          "/ui/data",
        );
      },
    );

    const inventoryPages = (page) => page.getByRole(
      "navigation",
      {
        name: "Inventory pages",
      },
    );
    const inventoryTable = (page) => page.getByRole(
      "table",
      {
        name: "Inventory",
        exact: true,
      },
    );
    const firstRow = (page) => inventoryTable(page).getByRole("row").nth(1);

    test(
      "table renders its columns and rows",
      async ({
        page,
      }) => {
        const table = inventoryTable(page);
        await expect(table.getByRole("columnheader")).toHaveText(
          [
            "Name",
            "Category",
            "Stock",
            "Price",
          ],
        );
        await expect(table.getByRole("row")).toHaveCount(6);
        await expect(firstRow(page).getByRole("cell").first()).toHaveText("Item 1");
      },
    );

    test(
      "pagination moves pages and updates the table",
      async ({
        page,
      }) => {
        const pagination = inventoryPages(page);
        await expect(pagination.getByRole(
          "button",
          {
            name: "Previous",
          },
        )).toBeDisabled();
        await expect(pagination.getByRole(
          "button",
          {
            name: "Page 1",
          },
        )).toHaveAttribute(
          "aria-current",
          "page",
        );

        await pagination.getByRole(
          "button",
          {
            name: "Page 2",
          },
        ).click();
        await expect(pagination.getByRole(
          "button",
          {
            name: "Page 2",
          },
        )).toHaveAttribute(
          "aria-current",
          "page",
        );
        await expect(firstRow(page).getByRole("cell").first()).toHaveText("Item 6");

        await pagination.getByRole(
          "button",
          {
            name: "Page 5",
          },
        ).click();
        await expect(pagination.getByRole(
          "button",
          {
            name: "Next",
          },
        )).toBeDisabled();
        await expect(inventoryTable(page).getByRole("row")).toHaveCount(4);
      },
    );

    test(
      "long page ranges collapse with an ellipsis",
      async ({
        page,
      }) => {
        const pagination = page.getByRole(
          "navigation",
          {
            name: "Large page range",
          },
        );
        const pageButtons = pagination.getByRole(
          "button",
          {
            name: /^Page \d+$/,
          },
        );

        await expect(pageButtons).toHaveText(
          [
            "1",
            "9",
            "10",
            "11",
            "20",
          ],
        );
        await expect(pagination.getByText("…")).toHaveCount(2);

        await pagination.getByRole(
          "button",
          {
            name: "Page 20",
          },
        ).click();
        await expect(pageButtons).toHaveText(
          [
            "1",
            "17",
            "18",
            "19",
            "20",
          ],
        );
        await expect(pagination.getByText("…")).toHaveCount(1);
        await expect(pagination.getByRole(
          "button",
          {
            name: "Next",
          },
        )).toBeDisabled();
      },
    );

    test(
      "virtualized table keeps a bounded DOM for thousands of rows",
      async ({
        page,
      }) => {
        const table = page.getByRole(
          "table",
          {
            name: "Virtualized rows",
          },
        );
        await expect(table.getByRole("columnheader")).toHaveText(
          [
            "Name",
            "Category",
            "Stock",
            "Price",
          ],
        );
        // Header + viewport (~8) + overscan (~10) — far below 5000.
        expect(await table.getByRole("row").count()).toBeLessThan(40);
        expect(await table.getByRole("cell").count()).toBeLessThan(160);
        await expect(table.getByRole(
          "cell",
          {
            name: "Row 1",
            exact: true,
          },
        )).toBeVisible();
        await expect(table.locator(".stock-render").first()).toHaveText("0 units");
      },
    );

    test(
      "scrolling the virtualized table changes visible rows",
      async ({
        page,
      }) => {
        const table = page.getByRole(
          "table",
          {
            name: "Virtualized rows",
          },
        );
        const viewport = table.locator("[data-janus-table-viewport]");
        await expect(table.getByRole(
          "cell",
          {
            name: "Row 1",
            exact: true,
          },
        )).toBeVisible();

        await viewport.evaluate(
          (node) => {
            node.scrollTop = 40 * 200;
          },
        );
        await expect(table.getByRole(
          "cell",
          {
            name: "Row 1",
            exact: true,
          },
        )).toHaveCount(0);
        await expect(table.getByRole(
          "cell",
          {
            name: "Row 201",
            exact: true,
          },
        )).toBeVisible();
      },
    );
  },
);
