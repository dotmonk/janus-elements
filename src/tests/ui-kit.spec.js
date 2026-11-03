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
    await page.goto("/src/tests/ui-kit.html");
  },
);

test.afterEach(
  () => {
    expect(pageErrors).toEqual([]);
  },
);

const calls = (page) => page.evaluate(
  () => window.calls,
);

test(
  "one click calls onClick once",
  async ({
    page,
  }) => {
    await page.locator(".panel-content").click();
    await page.locator("janus-badge span").click();
    await page.locator("janus-spinner.spinner-click p").click();
    await page.getByRole(
      "button",
      {
        name: "Button",
      },
    ).click();

    expect(await calls(page)).toEqual(
      {
        panel: 1,
        badge: 1,
        spinner: 1,
        button: 1,
      },
    );
  },
);

test(
  "one committed change calls onChange once with the control as target",
  async ({
    page,
  }) => {
    await page.locator("janus-input input").fill("typed");
    await page.locator("janus-input input").blur();
    await page.locator("janus-textarea textarea").fill("written");
    await page.locator("janus-textarea textarea").blur();

    expect(await calls(page)).toEqual(
      {
        input: 1,
        textarea: 1,
      },
    );
    expect(await page.evaluate(
      () => window.changedValues,
    )).toEqual(
      {
        input: "typed",
        textarea: "written",
      },
    );
  },
);

const iconSvg = (page, host) => page.locator(`${host} svg`);

test(
  "icons render an SVG and default to decorative",
  async ({
    page,
  }) => {
    const svg = iconSvg(
      page,
      "janus-edit-icon.icon-static",
    );
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
    await expect(svg).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(await svg.locator("style").count()).toBe(0);
  },
);

test(
  "animated icons include CSS motion and colored icons use the tone",
  async ({
    page,
  }) => {
    const animated = iconSvg(
      page,
      "janus-edit-icon.icon-animated",
    );
    await expect(animated).toBeVisible();
    await expect(animated.locator("style")).toContainText("@keyframes");

    const colors = await page.locator("janus-heart-icon.icon-colored").evaluate(
      (host) => {
        const probe = document.createElement("span");
        probe.style.color = "var(--janus-success)";
        document.body.append(probe);
        const token = getComputedStyle(probe).color;
        probe.remove();
        return {
          icon: getComputedStyle(host.querySelector("span")).color,
          token,
        };
      },
    );
    expect(colors.icon).toBe(colors.token);

    const labelled = iconSvg(
      page,
      "janus-search-icon.icon-labelled",
    );
    await expect(labelled).toHaveAttribute(
      "aria-label",
      "Search",
    );
    await expect(labelled).toHaveAttribute(
      "role",
      "img",
    );
    await expect(labelled).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
);

test(
  "animated icons stay static when the user prefers reduced motion",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
    await page.goto("/src/tests/ui-kit.html");
    const svg = iconSvg(
      page,
      "janus-edit-icon.icon-animated",
    );
    await expect(svg).toBeVisible();
    expect(await svg.locator("style").count()).toBe(0);
  },
);

test(
  "CharactersIcon prefers text over children and defaults to decorative",
  async ({
    page,
  }) => {
    const fromText = page.locator("janus-characters-icon.characters-text span");
    await expect(fromText).toHaveText("MW");
    await expect(fromText).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const fromChild = page.locator("janus-characters-icon.characters-child span");
    await expect(fromChild).toHaveText("★");

    const labelled = page.locator("janus-characters-icon.characters-labelled span");
    await expect(labelled).toHaveAttribute(
      "aria-label",
      "Jane Doe",
    );
    await expect(labelled).toHaveAttribute(
      "role",
      "img",
    );
    await expect(labelled).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
);

test(
  "CharactersIcon animated pulses with janusPulse",
  async ({
    page,
  }) => {
    const animation = await page.locator("janus-characters-icon.characters-animated span").evaluate(
      (span) => getComputedStyle(span).animationName,
    );
    expect(animation).toMatch(/janusPulse/);
  },
);

test(
  "CharactersIcon animated stays still when reduced motion is requested",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "reduce",
      },
    );
    const animation = await page.locator("janus-characters-icon.characters-animated span").evaluate(
      (span) => getComputedStyle(span).animationName,
    );
    expect(animation).toBe("none");
  },
);

test(
  "icon wrappers fill a disc or square shell",
  async ({
    page,
  }) => {
    const disc = await page.locator("janus-icon-disc-wrapper.icon-disc").evaluate(
      (host) => {
        const span = host.querySelector("span");
        const style = getComputedStyle(span);
        const probe = document.createElement("span");
        probe.style.backgroundColor = "color-mix(in oklab, var(--janus-accent) 12%, var(--janus-surface))";
        document.body.append(probe);
        const token = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const width = parseFloat(style.width);
        return {
          width: style.width,
          height: style.height,
          radius: style.borderRadius,
          half: `${width / 2}px`,
          background: style.backgroundColor,
          token,
          glyph: span.textContent.trim(),
        };
      },
    );
    expect(disc).toMatchObject(
      {
        width: "40px",
        height: "40px",
        glyph: "MW",
      },
    );
    expect(disc.radius === "50%" || disc.radius === disc.half).toBe(true);
    expect(disc.background).toBe(disc.token);

    const square = await page.locator("janus-icon-square-wrapper.icon-square").evaluate(
      (host) => {
        const span = host.querySelector(":scope > span");
        const style = getComputedStyle(span);
        const root = getComputedStyle(document.documentElement);
        return {
          width: style.width,
          height: style.height,
          radius: style.borderRadius,
          token: root.getPropertyValue("--janus-radius").trim(),
          hasSvg: Boolean(span.querySelector("svg")),
        };
      },
    );
    expect(square.width).toBe("40px");
    expect(square.height).toBe("40px");
    expect(square.radius).toBe(square.token);
    expect(square.hasSvg).toBe(true);
  },
);

test(
  "icon wrappers support outline and triangle shells",
  async ({
    page,
  }) => {
    const outline = await page.locator("janus-icon-disc-wrapper.icon-disc-outline").evaluate(
      (host) => {
        const style = getComputedStyle(host.querySelector("span"));
        return {
          borderWidth: style.borderTopWidth,
          background: style.backgroundColor,
        };
      },
    );
    expect(parseFloat(outline.borderWidth)).toBeGreaterThan(0);

    const triangle = await page.locator("janus-icon-triangle-wrapper.icon-triangle").evaluate(
      (host) => {
        const face = host.querySelector(":scope > span > span");
        const style = getComputedStyle(face);
        return {
          clip: style.clipPath || style.webkitClipPath,
          glyph: host.textContent.trim(),
        };
      },
    );
    expect(triangle.glyph).toContain("⚠");
    expect(triangle.clip).toMatch(/polygon/i);

    const triangleOutline = await page.locator("janus-icon-triangle-wrapper.icon-triangle-outline").evaluate(
      (host) => {
        const svg = host.querySelector("svg");
        const polygon = svg && svg.querySelector("polygon");
        return {
          hasSvg: Boolean(svg),
          fill: polygon && polygon.getAttribute("fill"),
          stroke: polygon && polygon.getAttribute("stroke"),
          glyph: host.textContent.trim(),
        };
      },
    );
    expect(triangleOutline.hasSvg).toBe(true);
    expect(triangleOutline.fill).toBe("none");
    expect(triangleOutline.stroke).toBeTruthy();
    expect(triangleOutline.glyph).toContain("⚠");
  },
);

test(
  "hash and pathname routes update from push helpers",
  async ({
    page,
  }) => {
    const fixture = page.locator("janus-router-fixture");
    await expect(fixture.locator(".route-hash-a")).toHaveCount(0);
    await expect(fixture.locator(".route-path-a")).toHaveCount(0);

    await fixture.getByRole(
      "button",
      {
        name: "Hash A",
      },
    ).click();
    await expect(fixture.locator(".route-hash-a")).toBeVisible();
    await expect(fixture.locator(".route-hash-b")).toHaveCount(0);
    expect(page.url()).toContain("#/fixture-a");

    await fixture.getByRole(
      "button",
      {
        name: "Hash B",
      },
    ).click();
    await expect(fixture.locator(".route-hash-b")).toBeVisible();
    await expect(fixture.locator(".route-hash-a")).toHaveCount(0);

    await fixture.getByRole(
      "button",
      {
        name: "Path A",
      },
    ).click();
    await expect(fixture.locator(".route-path-a")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/fixture-path-a");

    await fixture.getByRole(
      "button",
      {
        name: "Path B",
      },
    ).click();
    await expect(fixture.locator(".route-path-b")).toBeVisible();
    await expect(fixture.locator(".route-path-a")).toHaveCount(0);

    await page.evaluate(
      async () => {
        const {
          pushHash,
        } = await import("/src/janus/ui/Router.js");
        pushHash("/fixture-mix");
      },
    );
    await expect(fixture.locator(".route-mix")).toBeVisible();
    await expect(fixture.locator(".location-hash-path")).toHaveText("/fixture-mix");
  },
);

test(
  "Spinner variants animate with the expected keyframes",
  async ({
    page,
  }) => {
    await page.emulateMedia(
      {
        reducedMotion: "no-preference",
      },
    );

    const status = (name) => page.locator(`janus-spinner.${name} [role="status"]`);
    const glyphAnimation = (name, selector) => status(name).locator(selector).first().evaluate(
      (element) => getComputedStyle(element).animationName,
    );

    await expect(status("spinner-default")).toContainText("Ring");
    expect(await glyphAnimation(
      "spinner-default",
      ":scope > span",
    )).toMatch(/janusSpin/i);

    await expect(status("spinner-dots")).toContainText("Dots");
    expect(await glyphAnimation(
      "spinner-dots",
      ":scope > span[aria-hidden] > span",
    )).toMatch(/janusPulse/i);

    await expect(status("spinner-bars")).toContainText("Bars");
    expect(await glyphAnimation(
      "spinner-bars",
      ":scope > span[aria-hidden] > span",
    )).toMatch(/janusSpinnerBars/i);

    await expect(status("spinner-pulse")).toContainText("Pulse");
    expect(await glyphAnimation(
      "spinner-pulse",
      ":scope > span[aria-hidden] > span",
    )).toMatch(/janusPulse/i);

    await expect(status("spinner-unknown")).toContainText("Fallback");
    expect(await glyphAnimation(
      "spinner-unknown",
      ":scope > span",
    )).toMatch(/janusSpin/i);
  },
);

test(
  "CodeEditor highlights, detects language, and emits string onChange",
  async ({
    page,
  }) => {
    const host = (name) => page.locator(`janus-code-editor.${name}`);

    await expect(host("code-js").locator("code.language-javascript .token.keyword").first()).toBeVisible();

    const jsArea = host("code-js").locator("textarea");
    await jsArea.click();
    await expect(jsArea).toHaveValue("const greet = \"hi\";\n");
    await jsArea.fill("let x = \"ok\";");
    expect(await calls(page)).toMatchObject(
      {
        code: expect.any(Number),
      },
    );
    expect(await page.evaluate(
      () => window.changedValues.code,
    )).toBe("let x = \"ok\";");
    await expect(jsArea).toHaveValue("let x = \"ok\";");
    await expect(host("code-js").locator(
      "code .token.keyword",
      {
        hasText: "let",
      },
    )).toBeVisible();

    await expect(host("code-py-file").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "python",
    );
    await expect(host("code-py-shebang").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "python",
    );
    await expect(host("code-override").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "json",
    );

    await expect(host("code-auto").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "python",
    );
    await expect(page.locator(".code-detected")).toHaveText("python");
    await host("code-auto").locator("textarea").fill("const name = \"Janus\";\nexport default name;\n");
    await expect(host("code-auto").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "javascript",
    );
    await expect(page.locator(".code-detected")).toHaveText("javascript");
    expect(await page.evaluate(
      () => window.detectedLanguage,
    )).toBe("javascript");

    await expect(host("code-readonly").locator("textarea")).toHaveAttribute(
      "readonly",
      "readonly",
    );
    await expect(host("code-disabled").locator("textarea")).toBeDisabled();

    await expect(host("code-plain").locator("[data-language]")).toHaveAttribute(
      "data-language",
      "plain",
    );
    await expect(host("code-plain").locator("code")).toContainText("<raw & tagged>");
    await expect(host("code-plain").locator("code .token")).toHaveCount(0);

    const metrics = await host("code-js").evaluate(
      (editor) => {
        const box = (element) => {
          const style = getComputedStyle(element);
          return {
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            borderTopWidth: style.borderTopWidth,
            borderRightWidth: style.borderRightWidth,
            borderBottomWidth: style.borderBottomWidth,
            borderLeftWidth: style.borderLeftWidth,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            fontFamily: style.fontFamily,
          };
        };
        return {
          area: box(editor.querySelector("textarea")),
          code: box(editor.querySelector(".janus-code-highlight code")),
          pre: box(editor.querySelector(".janus-code-highlight")),
        };
      },
    );
    for (const side of [
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "fontSize",
      "lineHeight",
    ]) {
      expect(metrics.code[side]).toBe(metrics.area[side]);
    }
    for (const side of [
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
    ]) {
      expect(metrics.pre[side]).toBe("0px");
    }
  },
);

test(
  "RichTextarea emits Markdown onChange and honors toolbar formats",
  async ({
    page,
  }) => {
    const host = (name) => page.locator(`janus-rich-textarea.${name}`);
    const editor = host("rich-main").locator("[role=\"textbox\"]");

    await expect(editor).toBeVisible();
    await expect(editor).toContainText("Hello");
    await expect(editor).toContainText("world");

    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await host("rich-main").getByRole(
      "button",
      {
        name: "Bold",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/\*\*.+\*\*/);

    const chooseHeading = async (name) => {
      await host("rich-main").getByRole(
        "button",
        {
          name: "Heading",
          exact: true,
        },
      ).click();
      await host("rich-main").getByRole(
        "menuitemradio",
        {
          name,
          exact: true,
        },
      ).click();
    };
    await chooseHeading("Heading 1");
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^# /m);

    await chooseHeading("Heading 2");
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^## /m);

    await chooseHeading("Heading 3");
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^### /m);

    await host("rich-main").getByRole(
      "button",
      {
        name: "Strikethrough",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/~~/);

    await host("rich-main").getByRole(
      "button",
      {
        name: "Horizontal rule",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/(^|\n)---(\n|$)/);

    await host("rich-main").getByRole(
      "button",
      {
        name: "Bullet list",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^- /m);

    await host("rich-main").getByRole(
      "button",
      {
        name: "Task list",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/- \[[ x]\]/i);

    await host("rich-main").getByRole(
      "button",
      {
        name: "Table",
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/\|/);

    // Caret after the table (not inside a cell) so link/image stay block-adjacent.
    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        const last = root.lastElementChild || root;
        const range = document.createRange();
        range.selectNodeContents(last);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );
    await host("rich-main").getByRole(
      "button",
      {
        name: "Link",
        exact: true,
      },
    ).click();
    await host("rich-main").locator("input[aria-label=\"Link URL\"]").fill("https://example.com");
    await host("rich-main").getByRole(
      "button",
      {
        name: "Apply link",
        exact: true,
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/\]\(https:\/\/example\.com\)/);

    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        const last = root.lastElementChild || root;
        const range = document.createRange();
        range.selectNodeContents(last);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );
    await host("rich-main").getByRole(
      "button",
      {
        name: "Image",
        exact: true,
      },
    ).click();
    await host("rich-main").locator("input[aria-label=\"Image URL\"]").fill("https://example.com/pic.png");
    await host("rich-main").getByRole(
      "button",
      {
        name: "Apply image",
        exact: true,
      },
    ).click();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/!\[.*\]\(https:\/\/example\.com\/pic\.png\)/);

    expect(await page.evaluate(
      () => window.calls.rich,
    )).toBeGreaterThan(0);
  },
);

test(
  "RichTextarea link wraps selected text",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const editor = host.locator("[role=\"textbox\"]");

    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        root.innerHTML = "<p>Hello world</p>";
        const text = root.querySelector("p").firstChild;
        const range = document.createRange();
        range.setStart(
          text,
          0,
        );
        range.setEnd(
          text,
          5,
        );
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );

    await host.getByRole(
      "button",
      {
        name: "Link",
        exact: true,
      },
    ).click();
    await host.locator("input[aria-label=\"Link URL\"]").fill("https://example.com");
    await host.getByRole(
      "button",
      {
        name: "Apply link",
        exact: true,
      },
    ).click();
    const md = await page.evaluate(
      () => window.changedValues.rich,
    );
    expect(md).toMatch(/\[Hello\]\(https:\/\/example\.com\) world/);
    expect(md).not.toMatch(/\[Hello\]\(https:\/\/example\.com\)\n/);
    await expect(editor.locator("p")).toHaveCount(1);
    await expect(editor).toContainText("Hello");
  },
);

test(
  "RichTextarea controlled value, disabled, and Field textbox",
  async ({
    page,
  }) => {
    const host = (name) => page.locator(`janus-rich-textarea.${name}`);

    await expect(host("rich-controlled").locator("[role=\"textbox\"]")).toContainText("Start");
    await page.locator(".rich-set-value").click();
    await expect(host("rich-controlled").locator("[role=\"textbox\"]")).toContainText("From outside");

    const disabled = host("rich-disabled").locator("[role=\"textbox\"]");
    await expect(disabled).toHaveAttribute(
      "contenteditable",
      "false",
    );
    await expect(host("rich-disabled").getByRole(
      "button",
      {
        name: "Bold",
      },
    )).toBeDisabled();

    const fielded = host("rich-in-field").locator("[role=\"textbox\"]");
    const describedBy = await fielded.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText("Markdown");
  },
);

test(
  "RichTextarea list Enter/Backspace and toolbar pressed state",
  async ({
    page,
  }) => {
    const host = (name) => page.locator(`janus-rich-textarea.${name}`);
    const list = host("rich-list");
    const editor = list.locator("[role=\"textbox\"]");

    await editor.locator("li").last().click();
    await expect(list.getByRole(
      "button",
      {
        name: "Bullet list",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    const afterSplit = await page.evaluate(
      () => window.changedValues.richList,
    );
    expect(afterSplit).toMatch(/^- alpha\n- beta\n-/m);

    await page.keyboard.press("Enter");
    const afterExit = await page.evaluate(
      () => window.changedValues.richList,
    );
    expect(afterExit).toMatch(/^- alpha\n- beta/m);
    expect(afterExit.split("\n").filter(
      (line) => /^-\s/.test(line),
    )).toHaveLength(2);

    await list.getByRole(
      "button",
      {
        name: "Heading",
        exact: true,
      },
    ).click();
    await list.getByRole(
      "menuitemradio",
      {
        name: "Heading 2",
        exact: true,
      },
    ).click();
    await expect(list.getByRole(
      "button",
      {
        name: "Heading",
        exact: true,
      },
    )).toHaveText(/H2/);

    const main = host("rich-main");
    const mainEditor = main.locator("[role=\"textbox\"]");
    await mainEditor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await main.getByRole(
      "button",
      {
        name: "Bold",
        exact: true,
      },
    ).click();
    await expect(main.getByRole(
      "button",
      {
        name: "Bold",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await editor.locator("li").first().click();
    await page.keyboard.press("Home");
    await page.keyboard.press("Backspace");
    const afterBackspace = await page.evaluate(
      () => window.changedValues.richList,
    );
    expect(afterBackspace.startsWith("- ")).toBe(false);
    expect(afterBackspace).toMatch(/alpha/i);
  },
);

test(
  "RichTextarea bold is not pressed inside plain inline code",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-code");
    const code = host.locator("[role=\"textbox\"] code");
    await code.click();
    await expect(host.getByRole(
      "button",
      {
        name: "Inline code",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(host.getByRole(
      "button",
      {
        name: "Bold",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
);

test(
  "RichTextarea Markdown source toggle edits and returns to WYSIWYG",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const markdownBtn = host.getByRole(
      "button",
      {
        name: "Markdown",
        exact: true,
      },
    );

    await markdownBtn.click();
    await expect(markdownBtn).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const source = host.locator("textarea");
    await expect(source).toBeVisible();
    await expect(host.locator(".janus-rich-editor")).toHaveCount(0);
    await expect(host.getByRole(
      "button",
      {
        name: "Bold",
        exact: true,
      },
    )).toBeDisabled();

    await source.fill("# From source\n");
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^# From source/);
    await expect(host.locator(".janus-code-highlight code")).toContainText("From source");

    await markdownBtn.click();
    await expect(markdownBtn).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(host.locator(".janus-rich-editor")).toContainText("From source");
    await expect(host.getByRole(
      "button",
      {
        name: "Bold",
        exact: true,
      },
    )).toBeEnabled();
  },
);

test(
  "RichTextarea task checkbox click toggles Markdown checked state",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-tasks");
    const first = host.getByRole(
      "checkbox",
      {
        name: "Task",
      },
    ).first();

    await expect(first).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await first.click();
    await expect(first).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(await page.evaluate(
      () => window.changedValues.richTasks,
    )).toMatch(/- \[x\] todo/i);
    await first.click();
    await expect(first).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(await page.evaluate(
      () => window.changedValues.richTasks,
    )).toMatch(/- \[ \] todo/);
  },
);

test(
  "RichTextarea H1 toggle turns heading back into a paragraph",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const editor = host.locator("[role=\"textbox\"]");
    const trigger = host.getByRole(
      "button",
      {
        name: "Heading",
        exact: true,
      },
    );
    const chooseH1 = async () => {
      await trigger.click();
      await host.getByRole(
        "menuitemradio",
        {
          name: "Heading 1",
          exact: true,
        },
      ).click();
    };

    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await chooseH1();
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/^# /m);
    await expect(trigger).toHaveText(/H1/);

    await chooseH1();
    const after = await page.evaluate(
      () => window.changedValues.rich,
    );
    expect(after).not.toMatch(/^# /m);
    await expect(trigger).not.toHaveText(/H1/);
  },
);

test(
  "RichTextarea link wrap of Write stays inline",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const editor = host.locator("[role=\"textbox\"]");

    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        root.innerHTML = "<p>Please Write more</p>";
        const text = root.querySelector("p").firstChild;
        const range = document.createRange();
        range.setStart(
          text,
          7,
        );
        range.setEnd(
          text,
          12,
        );
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );

    await host.getByRole(
      "button",
      {
        name: "Link",
        exact: true,
      },
    ).click();
    await host.locator("input[aria-label=\"Link URL\"]").fill("https://example.com");
    await host.getByRole(
      "button",
      {
        name: "Apply link",
        exact: true,
      },
    ).click();

    const md = await page.evaluate(
      () => window.changedValues.rich,
    );
    expect(md).toMatch(/Please \[Write\]\(https:\/\/example\.com\) more/);
    expect(md).not.toMatch(/\[Write\]\(https:\/\/example\.com\)\n/);
    await expect(editor.locator("p")).toHaveCount(1);
    await expect(editor.locator("a")).toHaveText("Write");
  },
);

test(
  "RichTextarea link on bold Write keeps the sentence in one paragraph",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const editor = host.locator("[role=\"textbox\"]");

    await page.evaluate(
      async () => {
        const {
          parseMarkdown,
          astToFragment,
        } = await import("../janus/ui/markdown/index.js");
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        root.replaceChildren(astToFragment(parseMarkdown("**Write** **bold**, *italic*, and `code`.")));
        const text = root.querySelector("strong").firstChild;
        const range = document.createRange();
        range.setStart(
          text,
          0,
        );
        range.setEnd(
          text,
          5,
        );
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );

    await host.getByRole(
      "button",
      {
        name: "Link",
        exact: true,
      },
    ).click();
    await host.locator("input[aria-label=\"Link URL\"]").fill("http://google.com");
    await host.getByRole(
      "button",
      {
        name: "Apply link",
        exact: true,
      },
    ).click();

    const md = await page.evaluate(
      () => window.changedValues.rich,
    );
    expect(md).toMatch(/\[(?:\*\*)?Write(?:\*\*)?\]\(http:\/\/google\.com\).*?\*\*bold\*\*/);
    expect(md).not.toMatch(/\*{4}/);
    expect(md).not.toMatch(/\]\([^)]+\)\n/);
    await expect(editor.locator("p")).toHaveCount(1);
    await expect(editor.locator("a")).toHaveText("Write");
    // Link wraps the mark (not mark wraps the link).
    await expect(editor.locator("a > strong, a > b")).toHaveCount(1);
    // Never nest block elements inside the anchor.
    await expect(editor.locator("a h1, a h2, a h3, a p, a div")).toHaveCount(0);
  },
);

test(
  "RichTextarea link never keeps block children inside the anchor",
  async ({
    page,
  }) => {
    const editor = page.locator("janus-rich-textarea.rich-main [role='textbox']");

    const html = await page.evaluate(
      async () => {
        const {
          applyLinkAtOffsets,
        } = await import("../janus/ui/markdown/commands.js");
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        root.innerHTML = "<h1>Write</h1><p><strong>bold</strong></p>";
        applyLinkAtOffsets(
          root,
          "http://google.com",
          "Write",
          0,
          5,
        );
        // Also repair the exact broken shape contenteditable produced for the user.
        root.innerHTML = "<a href=\"http://google.com\"><h1></h1><p>Write</p></a><p>rest</p>";
        const broken = root.querySelector("a");
        const {
          applyLink,
        } = await import("../janus/ui/markdown/commands.js");
        // sanitize via editing an existing anchor
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(broken);
        sel.removeAllRanges();
        sel.addRange(range);
        applyLink(
          root,
          "http://google.com",
          "Write",
        );
        return root.innerHTML;
      },
    );

    expect(html).toContain("<a href=\"http://google.com\">Write</a>");
    expect(html).not.toMatch(/<a[^>]*>\s*<(?:h[1-6]|p|div)\b/i);
    await expect(editor.locator("a").first()).toHaveText("Write");
    await expect(editor.locator("a h1, a p, a div")).toHaveCount(0);
  },
);

test(
  "RichTextarea empty task keeps typed text beside the checkbox",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-main");
    const editor = host.locator("[role=\"textbox\"]");

    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor");
        root.innerHTML = "<p><br></p>";
        const p = root.querySelector("p");
        const range = document.createRange();
        range.setStart(
          p,
          0,
        );
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );

    await host.getByRole(
      "button",
      {
        name: "Task list",
        exact: true,
      },
    ).click();
    await expect(editor.locator("li[data-task] > p")).toHaveCount(1);
    await page.keyboard.type("hello");
    expect(await page.evaluate(
      () => window.changedValues.rich,
    )).toMatch(/- \[ \] hello/);
    const textAfterBox = await page.evaluate(
      () => {
        const li = document.querySelector("janus-rich-textarea.rich-main .janus-rich-editor li[data-task]");
        const box = li.querySelector("[data-rich-task-box]");
        const content = li.querySelector(":scope > p");
        return Boolean(box && content && content.textContent.includes("hello"));
      },
    );
    expect(textAfterBox).toBe(true);
  },
);

test(
  "RichTextarea task toolbar toggle only affects the current item",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-tasks");
    const editor = host.locator("[role=\"textbox\"]");

    await page.evaluate(
      () => {
        const root = document.querySelector("janus-rich-textarea.rich-tasks .janus-rich-editor");
        const first = root.querySelector("li[data-task]");
        const p = first.querySelector("p") || first;
        const text = [
          ...p.childNodes,
        ].find(
          (n) => n.nodeType === Node.TEXT_NODE,
        );
        const target = text || p;
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      },
    );

    await host.getByRole(
      "button",
      {
        name: "Task list",
        exact: true,
      },
    ).click();
    const md = await page.evaluate(
      () => window.changedValues.richTasks,
    );
    expect(md).toBe("todo\n\n- [x] done");
    await expect(editor.locator("li[data-task]")).toHaveCount(1);
  },
);

test(
  "RichTextarea bullet and numbered toggles only the current task item",
  async ({
    page,
  }) => {
    const host = page.locator("janus-rich-textarea.rich-tasks");
    const editor = host.locator("[role=\"textbox\"]");
    const setTasks = async (markdown) => {
      await page.evaluate(
        (value) => {
          document.querySelector("janus-rich-textarea-fixture").setState(
            {
              taskValue: value,
            },
          );
        },
        markdown,
      );
      await expect(editor.locator("li[data-task]")).toHaveCount(2);
    };
    const focusFirst = async () => {
      await page.evaluate(
        () => {
          const root = document.querySelector("janus-rich-textarea.rich-tasks .janus-rich-editor");
          const first = root.querySelector("li");
          const p = first.querySelector("p") || first;
          const text = [
            ...p.childNodes,
          ].find(
            (n) => n.nodeType === Node.TEXT_NODE,
          );
          const target = text || p;
          const range = document.createRange();
          range.selectNodeContents(target);
          range.collapse(true);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        },
      );
    };

    await setTasks("- [ ] Task one\n- [ ] Task two");
    await focusFirst();
    await host.getByRole(
      "button",
      {
        name: "Bullet list",
        exact: true,
      },
    ).click();
    let md = await page.evaluate(
      () => window.changedValues.richTasks,
    );
    expect(md).toMatch(/^- (?!\[)Task one/m);
    expect(md).toMatch(/- \[ \] Task two/);
    await expect(editor.locator("li[data-task]")).toHaveCount(1);
    await expect(host.getByRole(
      "button",
      {
        name: "Bullet list",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(host.getByRole(
      "button",
      {
        name: "Task list",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Unwrap the plain list item: it must stay above Task two.
    await host.getByRole(
      "button",
      {
        name: "Bullet list",
        exact: true,
      },
    ).click();
    md = await page.evaluate(
      () => window.changedValues.richTasks,
    );
    expect(md).toMatch(/^Task one\n\n- \[ \] Task two/);
    await expect(editor.locator("li[data-task]")).toHaveCount(1);

    await setTasks("- [ ] Task one\n- [ ] Task two");
    await focusFirst();
    await host.getByRole(
      "button",
      {
        name: "Numbered list",
        exact: true,
      },
    ).click();
    md = await page.evaluate(
      () => window.changedValues.richTasks,
    );
    expect(md).toMatch(/^1\.\s+Task one/m);
    expect(md).toMatch(/- \[ \] Task two/);
    await expect(editor.locator("ol")).toHaveCount(1);
    await expect(editor.locator("li[data-task]")).toHaveCount(1);
    await expect(host.getByRole(
      "button",
      {
        name: "Numbered list",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(host.getByRole(
      "button",
      {
        name: "Task list",
        exact: true,
      },
    )).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await host.getByRole(
      "button",
      {
        name: "Numbered list",
        exact: true,
      },
    ).click();
    md = await page.evaluate(
      () => window.changedValues.richTasks,
    );
    expect(md).toMatch(/^Task one\n\n- \[ \] Task two/);
    await expect(editor.locator("li[data-task]")).toHaveCount(1);
  },
);

test.describe(
  "Toolbar",
  () => {
    test(
      "hosts Button and Select with toolbar role and arrow keys",
      async ({
        page,
      }) => {
        const toolbar = page.getByRole(
          "toolbar",
          {
            name: "Actions",
          },
        );
        await expect(toolbar).toBeVisible();
        const chrome = await toolbar.evaluate(
          (el) => {
            const style = getComputedStyle(el);
            const save = el.querySelector("button.toolbar-save") || el.querySelector(".toolbar-save button");
            const cancel = el.querySelector("button.toolbar-cancel") || el.querySelector(".toolbar-cancel button");
            const saveStyle = save && getComputedStyle(save);
            const cancelStyle = cancel && getComputedStyle(cancel);
            return {
              gap: style.gap || style.columnGap,
              saveMarginLeft: saveStyle
                ? saveStyle.marginLeft
                : null,
              saveRadiusRight: saveStyle
                ? saveStyle.borderTopRightRadius
                : null,
              cancelRadiusLeft: cancelStyle
                ? cancelStyle.borderTopLeftRadius
                : null,
              cancelMarginLeft: cancelStyle
                ? cancelStyle.marginLeft
                : null,
            };
          },
        );
        expect(chrome.gap === "0px" || chrome.gap === "normal").toBeTruthy();
        expect(chrome.saveMarginLeft).toBe("0px");
        expect(chrome.saveRadiusRight).toBe("0px");
        expect(chrome.cancelRadiusLeft).toBe("0px");
        expect(chrome.cancelMarginLeft).toBe("-1px");

        const save = toolbar.getByRole(
          "button",
          {
            name: "Save",
          },
        );
        const cancel = toolbar.getByRole(
          "button",
          {
            name: "Cancel",
          },
        );
        const select = toolbar.getByRole("combobox");

        await save.focus();
        await expect(save).toBeFocused();
        await page.keyboard.press("ArrowRight");
        await expect(cancel).toBeFocused();
        await page.keyboard.press("ArrowRight");
        await expect(select).toBeFocused();
        await page.keyboard.press("Home");
        await expect(save).toBeFocused();
        await page.keyboard.press("End");
        await expect(select).toBeFocused();
        await page.keyboard.press("ArrowLeft");
        await expect(cancel).toBeFocused();
      },
    );

    test(
      "ArrowLeft and ArrowRight stay in a searchable Select filter",
      async ({
        page,
      }) => {
        const toolbar = page.getByRole(
          "toolbar",
          {
            name: "Filter bar",
          },
        );
        const select = toolbar.locator("janus-select.toolbar-search-select");
        const input = select.getByRole("combobox");
        await input.focus();
        await page.keyboard.type("Al");
        await expect(input).toHaveValue("Al");
        await page.keyboard.press("ArrowLeft");
        await expect(input).toBeFocused();
        await expect(toolbar.getByRole(
          "button",
          {
            name: "Go",
          },
        )).not.toBeFocused();
        await expect(toolbar.getByRole(
          "button",
          {
            name: "Reset",
          },
        )).not.toBeFocused();
        const caret = await input.evaluate(
          (el) => el.selectionStart,
        );
        expect(caret).toBe(1);
      },
    );
  },
);
