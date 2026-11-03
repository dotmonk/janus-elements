import {
  test,
  expect,
} from "@playwright/test";

const collectErrors = (page) => {
  const errors = [];
  page.on(
    "pageerror",
    (error) => errors.push(error.message),
  );
  page.on(
    "console",
    (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    },
  );
  return errors;
};

const sideNav = (page) => page.locator("nav[aria-label=\"Documentation\"]");

const goToLeaf = async (page, label) => {
  await sideNav(page).getByRole(
    "button",
    {
      name: label,
      exact: true,
    },
  ).click();
};

test(
  "docs loads About and shows the sidebar tree",
  {
    tag: "@smoke",
  },
  async ({
    page,
  }) => {
    const errors = collectErrors(page);

    await page.goto("/docs/");

    await expect(page.locator("janus-docs-about")).toBeVisible();
    await expect(page.locator("janus-docs-about")).toContainText("Custom Elements");
    await expect(sideNav(page).getByRole(
      "button",
      {
        name: "About",
      },
    )).toBeVisible();
    await expect(sideNav(page).getByRole(
      "button",
      {
        name: "Form controls",
      },
    )).toBeVisible();
    expect(errors).toEqual([]);
  },
);

test(
  "sidebar navigates between core and UI sections",
  async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/docs/");

    await goToLeaf(
      page,
      "Buttons",
    );
    await expect(page.locator("janus-docs-ui-buttons")).toBeVisible();
    await expect(page.locator("janus-docs-ui-buttons janus-select")).toHaveCount(0);
    await expect(page.locator("janus-docs-ui-buttons").getByRole("button").first()).toBeVisible();
    expect(page.url()).toContain("#/ui/buttons");

    await goToLeaf(
      page,
      "Basics",
    );
    await expect(page.locator("janus-docs-basics")).toBeVisible();
    await expect(page.locator("janus-docs-basics")).toContainText("Component.register");
    await expect(page.locator("janus-docs-ui-buttons")).toHaveCount(0);
    expect(page.url()).toContain("#/basics");

    await goToLeaf(
      page,
      "Helpers",
    );
    await expect(page.locator("janus-docs-helpers")).toBeVisible();
    await expect(page.locator("janus-docs-helpers")).toContainText("createLatestAsync");
    await expect(page.locator("janus-docs-helpers")).toContainText("animatedIconSlot");
    expect(page.url()).toContain("#/helpers");

    await goToLeaf(
      page,
      "Tooling",
    );
    await expect(page.locator("janus-docs-tooling")).toBeVisible();
    await expect(page.locator("janus-docs-tooling")).toContainText("januse");
    await expect(page.locator("janus-docs-tooling")).toContainText("./check.sh");
    expect(page.url()).toContain("#/tooling");

    await goToLeaf(
      page,
      "About",
    );
    await expect(page.locator("janus-docs-about")).toContainText("Custom Elements");
    expect(page.url()).toContain("#/about");

    expect(errors).toEqual([]);
  },
);

test(
  "docs hash deep link and back restore the previous section",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/basics");
    await expect(page.locator("janus-docs-basics")).toBeVisible();
    await expect(page.locator("janus-docs-about")).toHaveCount(0);

    await goToLeaf(
      page,
      "Icons",
    );
    await expect(page.locator("janus-docs-ui-icons")).toBeVisible();

    await page.goBack();
    await expect(page.locator("janus-docs-basics")).toBeVisible();
    await expect(page.locator("janus-docs-ui-icons")).toHaveCount(0);
    expect(page.url()).toContain("#/basics");
  },
);

test(
  "docs main scroll resets to top when the page changes",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/icons");
    await expect(page.locator("janus-docs-ui-icons")).toBeVisible();

    const scroller = page.locator(".docs-main-scroll");
    await expect(scroller).toBeVisible();
    await scroller.evaluate(
      (node) => {
        node.scrollTop = Math.min(
          400,
          node.scrollHeight - node.clientHeight,
        );
      },
    );
    await expect.poll(
      () => scroller.evaluate(
        (node) => node.scrollTop,
      ),
    ).toBeGreaterThan(100);

    await goToLeaf(
      page,
      "About",
    );
    await expect(page.locator("janus-docs-about")).toBeVisible();
    await expect.poll(
      () => scroller.evaluate(
        (node) => node.scrollTop,
      ),
    ).toBe(0);
  },
);

test(
  "mobile menu opens fullscreen and closes on select",
  async ({
    page,
  }) => {
    await page.setViewportSize(
      {
        width: 390,
        height: 844,
      },
    );
    await page.goto("/docs/");

    await expect(sideNav(page)).toBeHidden();
    await page.getByRole(
      "button",
      {
        name: "Open navigation",
      },
    ).click();
    await expect(sideNav(page)).toBeVisible();

    await goToLeaf(
      page,
      "Basics",
    );
    await expect(page.locator("janus-docs-basics")).toBeVisible();
    await expect(sideNav(page)).toBeHidden();
    expect(page.url()).toContain("#/basics");
  },
);

test(
  "the counter example updates on click",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/examples");

    const counter = page.locator("janus-docs-examples").getByRole(
      "button",
      {
        name: /Clicked \d+ times/,
      },
    );
    await expect(counter).toHaveText("Clicked 0 times");
    await counter.click();
    await expect(counter).toHaveText("Clicked 1 times");
  },
);

test(
  "the nested selectors demo uses nested selectors",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/basics");

    const section = page.locator("janus-docs-basics");
    await expect(section).toContainText("Nested selectors");
    await expect(section.locator(".style-demo b")).toHaveCSS(
      "color",
      "rgb(180, 83, 9)",
    );
    await expect(section.locator(".style-demo > code")).toHaveCSS(
      "font-size",
      "14px",
    );
  },
);

test(
  "a child callback updates parent state",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/examples");

    const stepper = page.locator("janus-docs-stepper");
    await expect(stepper.getByText("Value: 0")).toBeVisible();
    await stepper.getByRole(
      "button",
      {
        name: "+",
      },
    ).click();
    await expect(stepper.getByText("Value: 1")).toBeVisible();
    await stepper.getByRole(
      "button",
      {
        name: "−",
      },
    ).click();
    await expect(stepper.getByText("Value: 0")).toBeVisible();
  },
);

test(
  "markup props are documented with a rich tooltip",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/examples");

    const section = page.locator("janus-docs-examples");
    await expect(section).toContainText("Markup as a prop");
    await expect(section).toContainText("html`...`");
    const bubble = section.locator("[role='tooltip']");
    await expect(bubble.locator("b")).toHaveText("Bold");
    await expect(bubble.locator("i")).toHaveText("italic");
    await section.getByRole(
      "button",
      {
        name: "Hover me",
      },
    ).hover();
    await expect(bubble).toBeVisible();

    const snippet = section.locator("code.language-markup");
    await expect(snippet).toContainText("<Tooltip");
    await expect(snippet.locator(".token.tag").first()).toBeVisible();
    await expect(snippet.locator(".token.interpolation").first()).toBeVisible();
  },
);

test(
  "About and Basics snippets use shell and JavaScript highlighting",
  async ({
    page,
  }) => {
    await page.goto("/docs/");

    await expect(page.locator("janus-docs-about code.language-bash .token").first()).toBeVisible();
    await expect(page.locator("janus-docs-about code.language-javascript .token").first()).toBeVisible();

    await page.goto("/docs/#/basics");
    await expect(page.locator("janus-docs-basics code.language-javascript .token").first()).toBeVisible();
  },
);

test(
  "docs does not redefine custom elements when opening several sections",
  async ({
    page,
  }) => {
    const pageErrors = [];
    page.on(
      "pageerror",
      (error) => pageErrors.push(error.message),
    );
    await page.goto("/docs/");
    await page.goto("/docs/#/routing");
    await page.goto("/docs/#/examples");
    await page.goto("/docs/#/ui/buttons");
    expect(pageErrors.filter(
      (message) => /already been defined|has already been defined/i.test(message),
    )).toEqual([]);
  },
);

test(
  "routing snippets highlight JavaScript and markup without a runaway string",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/routing");
    const js = page.locator("janus-docs-routing code.language-javascript");
    const markup = page.locator("janus-docs-routing code.language-markup");

    await expect(js.locator(".token.keyword").first()).toBeVisible();
    await expect(js).toContainText("pushHash");
    await expect(js.locator(
      ".token.function",
      {
        hasText: "pushHash",
      },
    )).toHaveCount(1);
    await expect(js.locator(
      ".token.string",
      {
        hasText: "pushHash",
      },
    )).toHaveCount(0);

    await expect(markup.locator(".token.tag").first()).toBeVisible();
    await expect(markup).toContainText("<Route");
    await expect(markup).toContainText("<Location");
    await expect(markup.locator(".token.interpolation").first()).toBeVisible();
  },
);

test(
  "UI sections include markup highlighted snippets",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/buttons");

    const block = page.locator("janus-docs-ui-buttons code.language-markup");
    await expect(block).toHaveCount(2);
    await expect(block.first()).toBeVisible();
    await expect(block.first()).toContainText("<Button");
    await expect(block.first().locator(".token").first()).toBeVisible();
    await expect(block.first()).toContainText("alert(\"Clicked\")");
    await expect(block.nth(1)).toContainText("headIcon");
    await expect(block.nth(1)).toContainText("tailIcon");
  },
);

test(
  "Code editor docs use library highlighting without Prism",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/code-editor");

    expect(await page.evaluate(
      () => Boolean(window.Prism),
    )).toBe(false);
    const section = page.locator("janus-docs-ui-code-editor");
    await expect(section).toBeVisible();
    await expect(section.locator("janus-code-editor")).toHaveCount(21);
    const auto = section.locator("janus-code-editor.code-auto");
    await expect(auto.locator("[data-language]")).toHaveAttribute(
      "data-language",
      "python",
    );
    await expect(section.getByText(/detected: python/)).toBeVisible();
    await expect(section.locator("code.language-markup")).toContainText("onLanguageChange");
    await expect(section.locator("code.language-javascript .token.keyword").first()).toBeVisible();
    await expect(section.locator("code.language-javascript .token.interpolation").first()).toBeVisible();
    await expect(section.locator("code.language-rust .token.keyword").first()).toBeVisible();

    const editorWidth = await auto.evaluate(
      (host) => host.firstElementChild?.getBoundingClientRect().width,
    );
    const sectionWidth = await section.evaluate(
      (el) => el.getBoundingClientRect().width,
    );
    expect(editorWidth).toBeGreaterThan(sectionWidth * 0.9);
  },
);

test(
  "form-controls snippet matches the live example",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/form-controls");

    const section = page.locator("janus-docs-ui-form-controls");
    const snippet = section.locator("code.language-markup");
    await expect(snippet).toContainText("Email notifications");
    await expect(snippet).toContainText("Compact layout");
    await expect(snippet).toContainText("label=\"Plan\"");
    await expect(snippet).toContainText("label=\"Email\"");
    await expect(snippet).toContainText("label=\"Username\"");
    await expect(snippet).not.toContainText("Notify me");
    await expect(snippet).not.toContainText("Dense");
  },
);

test(
  "UI docs pages include a props table",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/date-time");
    const section = page.locator("janus-docs-ui-date-time");
    await expect(section.getByRole(
      "heading",
      {
        name: "Props",
      },
    )).toBeVisible();
    await expect(section.getByRole(
      "heading",
      {
        name: "DatePicker",
      },
    )).toBeVisible();
    await expect(section.getByRole("table").first()).toContainText("clearable");
    await expect(section.getByRole("table").first()).toContainText("locale");
  },
);

test(
  "routing docs include a props table",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/routing");
    const section = page.locator("janus-docs-routing");
    const props = section.locator(".docs-props");
    await expect(props.getByRole(
      "heading",
      {
        name: "Props",
        exact: true,
      },
    )).toBeVisible();
    await expect(props.getByRole(
      "heading",
      {
        name: "Route",
        exact: true,
      },
    )).toBeVisible();
    await expect(props.getByRole("table").first()).toContainText("hashRegex");
    await expect(props.getByRole(
      "heading",
      {
        name: "Location",
        exact: true,
      },
    )).toBeVisible();
  },
);

test(
  "icons section shows static and animated icons and snippet",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/icons");

    const section = page.locator("janus-docs-ui-icons");
    await expect(section.locator("janus-edit-icon svg").first()).toBeVisible();
    expect(await section.locator("janus-search-icon").count()).toBe(2);
    const snippet = section.locator("code.language-markup");
    await expect(snippet).toContainText("<EditIcon />");
    await expect(snippet).toContainText("<EditIcon animated />");
    await expect(snippet).toContainText("<HeartIcon color=\"error\" />");
    await expect(snippet).toContainText("<ClockIcon />");
    await expect(snippet).toContainText("<UnlockIcon />");
    await expect(snippet).toContainText("<ExportIcon />");
    await expect(snippet).toContainText("<SunIcon />");
    await expect(snippet).toContainText("<MoonIcon />");
    await expect(snippet).toContainText("<DayNightIcon animated />");
    await expect(snippet).toContainText("<CharactersIcon text=\"MW\" color=\"accent\" />");
    await expect(snippet).toContainText("<IconDiscWrapper");
    await expect(snippet).toContainText("<IconSquareWrapper");
    await expect(snippet).toContainText("IconTriangleWrapper");
    await expect(snippet).toContainText("outline");
    await expect(section.getByRole(
      "heading",
      {
        name: "Characters icon",
      },
    )).toBeVisible();
    await expect(section.locator("janus-characters-icon").first()).toBeVisible();
    await expect(section.locator("janus-icon-disc-wrapper").first()).toBeVisible();
    await expect(section.locator("janus-icon-triangle-wrapper").first()).toBeVisible();
    await expect(section.locator("janus-clock-icon").first()).toBeVisible();
    await expect(section.locator("janus-unlock-icon").first()).toBeVisible();
    await expect(section.locator("janus-sun-icon svg").first()).toBeVisible();
    await expect(section.locator("janus-moon-icon svg").first()).toBeVisible();
    await expect(section.locator("janus-day-night-icon svg").first()).toBeVisible();
    await expect(section.locator("janus-icon-triangle-wrapper").filter(
      {
        hasText: "⚠",
      },
    )).toHaveCount(3);
  },
);

test(
  "animated ClockIcon hour hand turns twelve times slower than the minute hand",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/icons");
    const svg = page.locator("janus-docs-ui-icons janus-clock-icon").nth(1).locator("svg");
    await expect(svg.locator(".minute")).toHaveCount(1);

    const degreesAfterQuarterMinuteTurn = await svg.evaluate(
      (element) => {
        const animations = element.getAnimations(
          {
            subtree: true,
          },
        );
        const minuteTurn = Math.min(...animations.map(
          (animation) => Number(animation.effect.getTiming().duration),
        ));
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = minuteTurn / 4;
        }
        const degrees = (hand) => {
          const matrix = new DOMMatrix(getComputedStyle(element.querySelector(hand)).transform);
          return Math.round(Math.atan2(
            matrix.b,
            matrix.a,
          ) * 180 / Math.PI * 10) / 10;
        };
        return {
          minute: degrees(".minute"),
          hour: degrees(".hour"),
        };
      },
    );

    expect(degreesAfterQuarterMinuteTurn).toEqual(
      {
        minute: 90,
        hour: 7.5,
      },
    );
  },
);

test(
  "animated DayNightIcon cycles through moon phases lit from the left",
  async ({
    page,
  }) => {
    await page.goto("/docs/#/ui/icons");
    const svg = page.locator("janus-docs-ui-icons janus-day-night-icon").nth(1).locator("svg");
    await expect(svg.locator("animate")).toHaveCount(1);

    const litColumnsAt = (fraction) => svg.evaluate(
      (svgElement, fraction) => {
        const element = svgElement;
        /** @type {SVGSVGElement} */
        const lit = element.querySelector("path");
        const phase = element.querySelector("animate");
        element.pauseAnimations();
        element.setCurrentTime(phase.getSimpleDuration() * fraction);
        return [
          5,
          8,
          11,
          13,
          16,
          19,
        ].filter(
          (x) => lit.isPointInFill(new DOMPoint(
            x,
            12,
          )),
        );
      },
      fraction,
    );

    expect(await litColumnsAt(0)).toEqual([]);
    expect(await litColumnsAt(0.25)).toEqual(
      [
        5,
        8,
        11,
      ],
    );
    expect(await litColumnsAt(0.5)).toEqual(
      [
        5,
        8,
        11,
        13,
        16,
        19,
      ],
    );
    expect(await litColumnsAt(0.75)).toEqual(
      [
        13,
        16,
        19,
      ],
    );
  },
);

test.describe(
  "UI kit sections",
  () => {
    let errors;

    test.beforeEach(
      async ({
        page,
      }) => {
        errors = collectErrors(page);
      },
    );

    test.afterEach(
      () => {
        expect(errors).toEqual([]);
      },
    );

    const sectionButton = (page, host, name) => page.locator(host).getByRole(
      "button",
      {
        name,
        exact: true,
      },
    );

    const controlledSelect = (page) => page.locator("janus-docs-ui-select janus-select").first();

    test(
      "a button click calls its handler once",
      async ({
        page,
      }) => {
        const dialogs = [];
        page.on(
          "dialog",
          (dialog) => {
            dialogs.push(dialog.message());
            dialog.accept();
          },
        );

        await page.goto("/docs/#/ui/buttons");
        await sectionButton(
          page,
          "janus-docs-ui-buttons",
          "Click me",
        ).click();
        await expect(page.locator("janus-docs-ui-buttons")).toBeVisible();

        expect(dialogs).toEqual(
          [
            "Clicked",
          ],
        );
      },
    );

    test(
      "select shows the option chosen through its parent's state",
      async ({
        page,
      }) => {
        await page.goto("/docs/#/ui/select");
        const select = controlledSelect(page);

        await select.getByRole("combobox").first().click();
        await page.getByRole(
          "option",
          {
            name: "Option #2",
          },
        ).click();

        await expect(select.getByRole("combobox").first()).toHaveValue("Option #2");
      },
    );

    test(
      "confirm modal opens and closes",
      async ({
        page,
      }) => {
        await page.goto("/docs/#/ui/modals");
        const modal = page.locator("#janus-ui-modal");

        await sectionButton(
          page,
          "janus-docs-ui-modals",
          "Confirm",
        ).click();
        await expect(modal.getByRole("dialog")).toBeVisible();
        await expect(modal).toContainText("This is the alert message?");

        await modal.getByRole(
          "button",
          {
            name: "Cancel",
          },
        ).click();
        await expect(modal).toHaveCount(0);
      },
    );

    for (const [
      name,
      expected,
    ] of [
      [
        "Confirm",
        "false",
      ],
      [
        "Input",
        "false",
      ],
      [
        "Alert",
        "undefined",
      ],
    ]) {
      test(
        `${name} modal calls back when closed by its backdrop`,
        async ({
          page,
        }) => {
          const logs = [];
          page.on(
            "console",
            (message) => {
              if (message.type() === "log") {
                logs.push(message.text());
              }
            },
          );
          await page.goto("/docs/#/ui/modals");
          const modal = page.locator("#janus-ui-modal");

          await sectionButton(
            page,
            "janus-docs-ui-modals",
            name,
          ).click();
          await expect(modal).toHaveCount(1);
          await page.mouse.click(
            5,
            5,
          );

          await expect(modal).toHaveCount(0);
          await expect.poll(
            () => logs,
          ).toEqual(
            [
              expected,
            ],
          );
        },
      );
    }
  },
);
