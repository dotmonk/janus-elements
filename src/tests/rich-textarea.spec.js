import {
  test,
  expect,
} from "@playwright/test";

const HOST = "janus-rich-textarea.rich-tasks";

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

const load = async (page, value) => {
  await page.evaluate(
    (next) => {
      window.changedValues.richTasks = next;
      document.querySelector("janus-rich-textarea-fixture").setState(
        {
          taskValue: next,
        },
      );
    },
    value,
  );
  await expect.poll(
    () => page.evaluate(
      async (host) => {
        const markdown = await import("/src/janus/ui/markdown/index.js");
        const root = document.querySelector(`${host} .janus-rich-editor`);
        return markdown.serializeMarkdown(markdown.elementToAst(root));
      },
      HOST,
    ),
  ).toBe(value);
};

const placeSelection = (page, text, start, end = start) => page.evaluate(
  ({
    host,
    text,
    start,
    end,
  }) => {
    const root = document.querySelector(`${host} .janus-rich-editor`);
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    );
    let node = walker.nextNode();
    while (
      node &&
      !node.nodeValue.includes(text)
    ) {
      node = walker.nextNode();
    }
    root.focus();
    const range = document.createRange();
    range.setStart(
      node,
      start,
    );
    range.setEnd(
      node,
      end,
    );
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  {
    host: HOST,
    text,
    start,
    end,
  },
);

const press = (page, name) => page.locator(HOST).getByRole(
  "button",
  {
    name,
    exact: true,
  },
).click();

const value = (page) => page.evaluate(
  () => window.changedValues.richTasks,
);

const chooseFromMenu = async (page, menu, item) => {
  await page.locator(HOST).getByRole(
    "button",
    {
      name: menu,
      exact: true,
    },
  ).click();
  await page.locator(HOST).getByRole(
    "menuitemradio",
    {
      name: item,
      exact: true,
    },
  ).click();
};

const pressedFormats = (page) => page.evaluate(
  (host) => [
    ...document.querySelectorAll(`${host} [data-format]`),
  ].filter(
    (button) => button.getAttribute("aria-pressed") === "true",
  ).map(
    (button) => button.getAttribute("data-format"),
  ),
  HOST,
);

const itemMarkers = (page) => page.evaluate(
  (host) => [
    ...document.querySelectorAll(`${host} .janus-rich-editor li`),
  ].map(
    (li) => `${li.textContent.trim()}:${getComputedStyle(li).listStyleType}`,
  ),
  HOST,
);

/**
 * Block skeleton of the live editor must match a fresh render of the emitted
 * Markdown, ignoring empty caret paragraphs. Mixed text beside blocks shows up
 * as `#text`, so nested `<p>` and bare root text fail too.
 */
const expectConsistent = async (page) => {
  const shapes = await page.evaluate(
    async (host) => {
      const markdown = await import("/src/janus/ui/markdown/index.js");
      const LEAF = /^(P|H[1-6]|PRE|TABLE|HR)$/;
      const BLOCK = /^(P|H[1-6]|PRE|TABLE|HR|UL|OL|LI|BLOCKQUOTE)$/;
      const isEmptyParagraph = (el) => el.tagName === "P" && !el.textContent.replace(
        /​/g,
        "",
      ).trim() && !el.querySelector("img");
      const shape = (el) => {
        const parts = [];
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            if (child.nodeValue.trim()) {
              parts.push("#text");
            }
            continue;
          }
          if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }
          if (child.hasAttribute("data-rich-task-box")) {
            continue;
          }
          if (!BLOCK.test(child.tagName)) {
            parts.push("#inline");
            continue;
          }
          if (isEmptyParagraph(child)) {
            continue;
          }
          const task = child.getAttribute("data-task");
          const label = task
            ? `${child.tagName}[${task}]`
            : child.tagName;
          const inner = LEAF.test(child.tagName) && !child.querySelector("p, ul, ol, blockquote")
            ? JSON.stringify(child.textContent.trim())
            : shape(child).join(",");
          parts.push(`${label}(${inner})`);
        }
        return parts;
      };
      const root = document.querySelector(`${host} .janus-rich-editor`);
      const fresh = document.createElement("div");
      fresh.appendChild(markdown.astToFragment(markdown.parseMarkdown(window.changedValues.richTasks)));
      return {
        live: shape(root).join(","),
        parsed: shape(fresh).join(","),
      };
    },
    HOST,
  );
  expect(shapes.live).toBe(shapes.parsed);
};

const step = async (page, button, expected) => {
  if (/^(Paragraph|Heading \d)$/.test(button)) {
    await chooseFromMenu(
      page,
      "Heading",
      button,
    );
  } else {
    await press(
      page,
      button,
    );
  }
  expect(await value(page)).toBe(expected);
  await expectConsistent(page);
};

test.describe(
  "RichTextarea list kinds",
  () => {
    test(
      "task off on a middle task gives a paragraph between two task lists",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [ ] one\n- [ ] two\n- [ ] three",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Task list",
          "- [ ] one\n\ntwo\n\n- [ ] three",
        );
        expect(await pressedFormats(page)).toEqual([]);
      },
    );

    test(
      "a plain item inside a task list shows its bullet",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [ ] one\n- [ ] two\n- [ ] three",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Bullet list",
          "- [ ] one\n- two\n- [ ] three",
        );
        expect(await itemMarkers(page)).toEqual(
          [
            "one:none",
            "two:disc",
            "three:none",
          ],
        );
        expect(await pressedFormats(page)).toEqual(
          [
            "bulletList",
          ],
        );
      },
    );

    test(
      "task, bullet and task again keep one list and turn off to a paragraph",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [ ] one\n- [ ] two\n- [ ] three",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Task list",
          "- [ ] one\n\ntwo\n\n- [ ] three",
        );
        await step(
          page,
          "Bullet list",
          "- [ ] one\n- two\n- [ ] three",
        );
        expect(await pressedFormats(page)).toEqual(
          [
            "bulletList",
          ],
        );
        await step(
          page,
          "Task list",
          "- [ ] one\n- [ ] two\n- [ ] three",
        );
        expect(await pressedFormats(page)).toEqual(
          [
            "taskList",
          ],
        );
        await step(
          page,
          "Task list",
          "- [ ] one\n\ntwo\n\n- [ ] three",
        );
        expect(await pressedFormats(page)).toEqual([]);
      },
    );

    test(
      "task on and off a paragraph returns the paragraph",
      async ({
        page,
      }) => {
        await load(
          page,
          "hello",
        );
        await placeSelection(
          page,
          "hello",
          2,
        );
        await step(
          page,
          "Task list",
          "- [ ] hello",
        );
        await step(
          page,
          "Task list",
          "hello",
        );
      },
    );

    test(
      "task on a numbered item leaves the other items numbered",
      async ({
        page,
      }) => {
        await load(
          page,
          "1. one\n2. two\n3. three",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Task list",
          "1. one\n\n- [ ] two\n\n1. three",
        );
        expect(await itemMarkers(page)).toEqual(
          [
            "one:decimal",
            "two:none",
            "three:decimal",
          ],
        );
        await step(
          page,
          "Task list",
          "1. one\n\ntwo\n\n1. three",
        );
        await step(
          page,
          "Numbered list",
          "1. one\n2. two\n3. three",
        );
        await expect(page.locator(`${HOST} .janus-rich-editor ol`)).toHaveCount(1);
      },
    );

    test(
      "switching a middle item to numbered and back rejoins the bullet list",
      async ({
        page,
      }) => {
        await load(
          page,
          "- one\n- two\n- three",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Numbered list",
          "- one\n\n1. two\n\n- three",
        );
        await step(
          page,
          "Bullet list",
          "- one\n- two\n- three",
        );
        await expect(page.locator(`${HOST} .janus-rich-editor ul`)).toHaveCount(1);
        await step(
          page,
          "Bullet list",
          "- one\n\ntwo\n\n- three",
        );
      },
    );

    test(
      "list buttons keep a heading inside the item",
      async ({
        page,
      }) => {
        await load(
          page,
          "# Title",
        );
        await placeSelection(
          page,
          "Title",
          2,
        );
        await step(
          page,
          "Bullet list",
          "- # Title",
        );
        expect(await pressedFormats(page)).toEqual(
          [
            "bulletList",
          ],
        );
        await expect(page.locator(HOST).getByRole(
          "button",
          {
            name: "Heading",
            exact: true,
          },
        )).toHaveText(/H1/);
        await step(
          page,
          "Bullet list",
          "# Title",
        );

        await load(
          page,
          "- one\n- # two",
        );
        await placeSelection(
          page,
          "two",
          1,
        );
        await step(
          page,
          "Numbered list",
          "- one\n\n1. # two",
        );
        await step(
          page,
          "Numbered list",
          "- one\n\n# two",
        );
      },
    );
  },
);

test.describe(
  "RichTextarea list keys",
  () => {
    test(
      "Backspace at the start of the first item lifts it to a paragraph",
      async ({
        page,
      }) => {
        await load(
          page,
          "1. one\n2. two",
        );
        await placeSelection(
          page,
          "one",
          0,
        );
        await page.keyboard.press("Backspace");
        expect(await value(page)).toBe("one\n\n1. two");
        await expectConsistent(page);
      },
    );

    test(
      "Backspace at the start of a task joins its text to the previous item",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [ ] one\n- [ ] two",
        );
        await placeSelection(
          page,
          "two",
          0,
        );
        await page.keyboard.press("Backspace");
        expect(await value(page)).toBe("- [ ] onetwo");
        await expectConsistent(page);
      },
    );

    test(
      "Enter on an empty item exits the list without emitting blank lines",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [x] one",
        );
        await placeSelection(
          page,
          "one",
          3,
        );
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        expect(await value(page)).toBe("- [x] one");
        await expectConsistent(page);
        await page.keyboard.type("after");
        expect(await value(page)).toBe("- [x] one\n\nafter");
      },
    );
  },
);

test.describe(
  "RichTextarea quote",
  () => {
    test(
      "Quote toggles the same paragraph on and off repeatedly",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha",
        );
        await placeSelection(
          page,
          "alpha",
          2,
        );
        await step(
          page,
          "Quote",
          "> alpha",
        );
        await step(
          page,
          "Quote",
          "alpha",
        );
        await step(
          page,
          "Quote",
          "> alpha",
        );
        await step(
          page,
          "Heading 2",
          "> ## alpha",
        );
      },
    );
  },
);

test.describe(
  "RichTextarea inline marks",
  () => {
    test(
      "Inline code and Strikethrough without a selection change nothing",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha beta",
        );
        await placeSelection(
          page,
          "alpha",
          3,
        );
        await step(
          page,
          "Inline code",
          "alpha beta",
        );
        await step(
          page,
          "Strikethrough",
          "alpha beta",
        );
        await expect(page.locator(`${HOST} .janus-rich-editor :is(code, del)`)).toHaveCount(0);
      },
    );

    test(
      "Strikethrough off on part of a struck span keeps the rest struck",
      async ({
        page,
      }) => {
        await load(
          page,
          "~~alpha beta gamma~~",
        );
        await placeSelection(
          page,
          "alpha",
          6,
          10,
        );
        await step(
          page,
          "Strikethrough",
          "~~alpha~~ beta ~~gamma~~",
        );
      },
    );
  },
);

test.describe(
  "RichTextarea Markdown fidelity",
  () => {
    test(
      "typed text that looks like Markdown stays text after a reload",
      async ({
        page,
      }) => {
        const editor = page.locator(`${HOST} .janus-rich-editor`);
        for (const typed of [
          "# literal",
          "- item",
          "1. item",
          "> quote",
        ]) {
          await load(
            page,
            "start",
          );
          await placeSelection(
            page,
            "start",
            0,
            5,
          );
          await page.keyboard.type(typed);
          const saved = await value(page);
          await load(
            page,
            "reset",
          );
          await load(
            page,
            saved,
          );
          await expect(editor.locator(":scope > p")).toHaveText(typed);
          await expect(editor.locator("h1, ul, ol, blockquote")).toHaveCount(0);
        }
      },
    );

    test(
      "Enter inside a code block keeps the new line",
      async ({
        page,
      }) => {
        await load(
          page,
          "```\nline1\n```",
        );
        await placeSelection(
          page,
          "line1",
          5,
        );
        await page.keyboard.press("Enter");
        await page.keyboard.type("line2");
        expect(await value(page)).toBe("```\nline1\nline2\n```");
      },
    );
  },
);

test.describe(
  "RichTextarea undo and redo",
  () => {
    const undo = (page) => page.keyboard.press("ControlOrMeta+z");
    const redo = (page) => page.keyboard.press("ControlOrMeta+Shift+z");
    const editorText = (page) => page.locator(`${HOST} .janus-rich-editor`).textContent();

    test(
      "undo and redo step through typing and a toolbar command",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha",
        );
        await placeSelection(
          page,
          "alpha",
          5,
        );
        await page.keyboard.type(" beta");
        await press(
          page,
          "Bullet list",
        );
        expect(await value(page)).toBe("- alpha beta");
        await undo(page);
        expect(await value(page)).toBe("alpha beta");
        await expectConsistent(page);
        await undo(page);
        expect(await value(page)).toBe("alpha");
        await redo(page);
        expect(await value(page)).toBe("alpha beta");
        await page.keyboard.press("Control+y");
        expect(await value(page)).toBe("- alpha beta");
        await expectConsistent(page);
      },
    );

    test(
      "typing after an undo lands at the restored caret",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha beta",
        );
        await placeSelection(
          page,
          "alpha",
          2,
        );
        await press(
          page,
          "Bullet list",
        );
        await undo(page);
        await page.keyboard.type("X");
        expect(await value(page)).toBe("alXpha beta");
      },
    );

    test(
      "undo covers task clicks and list keys",
      async ({
        page,
      }) => {
        await load(
          page,
          "- [ ] one",
        );
        await page.locator(`${HOST} [data-rich-task-box]`).click();
        await placeSelection(
          page,
          "one",
          3,
        );
        await page.keyboard.press("Enter");
        expect(await value(page)).toBe("- [x] one\n- [ ] ");
        await undo(page);
        expect(await value(page)).toBe("- [x] one");
        await undo(page);
        expect(await value(page)).toBe("- [ ] one");
      },
    );

    test(
      "an outside value change clears the history",
      async ({
        page,
      }) => {
        await load(
          page,
          "one",
        );
        await placeSelection(
          page,
          "one",
          3,
        );
        await page.keyboard.type("!");
        await load(
          page,
          "two",
        );
        await placeSelection(
          page,
          "two",
          3,
        );
        await undo(page);
        expect(await editorText(page)).toBe("two");
      },
    );
  },
);

test(
  "RichTextarea Ctrl+B is its own undo step, not part of the typing",
  async ({
    page,
  }) => {
    await load(
      page,
      "alpha",
    );
    await placeSelection(
      page,
      "alpha",
      5,
    );
    await page.keyboard.type(" beta");
    await placeSelection(
      page,
      "alpha beta",
      6,
      10,
    );
    await page.keyboard.press("ControlOrMeta+b");
    expect(await value(page)).toBe("alpha **beta**");
    await page.keyboard.press("ControlOrMeta+z");
    expect(await value(page)).toBe("alpha beta");
  },
);

const editorFocused = (page) => page.evaluate(
  (host) => document.activeElement === document.querySelector(`${host} .janus-rich-editor`),
  HOST,
);

test.describe(
  "RichTextarea list indent and outdent",
  () => {
    test(
      "Tab nests an item under the previous one, Shift+Tab returns it",
      async ({
        page,
      }) => {
        await load(
          page,
          "- a\n- b\n- c",
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Tab");
        expect(await value(page)).toBe("- a\n  - b\n- c");
        await expectConsistent(page);
        await page.keyboard.press("Tab");
        expect(await value(page)).toBe("- a\n  - b\n- c");
        expect(await editorFocused(page)).toBe(true);
        await page.keyboard.press("Shift+Tab");
        expect(await value(page)).toBe("- a\n- b\n- c");
        await expectConsistent(page);
        await page.keyboard.press("ControlOrMeta+z");
        expect(await value(page)).toBe("- a\n  - b\n- c");
      },
    );

    test(
      "Tab on the first item changes nothing and keeps focus",
      async ({
        page,
      }) => {
        await load(
          page,
          "- a\n- b",
        );
        await placeSelection(
          page,
          "a",
          1,
        );
        await page.keyboard.press("Tab");
        expect(await value(page)).toBe("- a\n- b");
        expect(await editorFocused(page)).toBe(true);
      },
    );

    test(
      "outdent keeps the following siblings nested under the moved item",
      async ({
        page,
      }) => {
        await load(
          page,
          "- a\n  - b\n  - c",
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Shift+Tab");
        expect(await value(page)).toBe("- a\n- b\n  - c");
        await expectConsistent(page);
      },
    );

    test(
      "Shift+Tab on a top-level item lifts it out of the list",
      async ({
        page,
      }) => {
        await load(
          page,
          "- a\n- b",
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Shift+Tab");
        expect(await value(page)).toBe("- a\n\nb");
        await expectConsistent(page);
      },
    );

    test(
      "numbered and task items nest in their own kind of list",
      async ({
        page,
      }) => {
        await load(
          page,
          "1. a\n2. b",
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Tab");
        expect(await value(page)).toBe("1. a\n   1. b");
        await load(
          page,
          "- [ ] a\n- [x] b",
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Tab");
        expect(await value(page)).toBe("- [ ] a\n  - [x] b");
        await expectConsistent(page);
      },
    );

    test(
      "Tab outside a list moves focus out of the editor",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha",
        );
        await placeSelection(
          page,
          "alpha",
          2,
        );
        await page.keyboard.press("Tab");
        expect(await editorFocused(page)).toBe(false);
      },
    );
  },
);

test.describe(
  "RichTextarea toolbar additions",
  () => {
    test(
      "caret in a link presses Link; clicking it unlinks and undo restores",
      async ({
        page,
      }) => {
        const link = page.locator(HOST).getByRole(
          "button",
          {
            name: "Link",
            exact: true,
          },
        );
        await load(
          page,
          "see [Janus](https://example.com) here",
        );
        await placeSelection(
          page,
          "Janus",
          2,
        );
        await expect(link).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await step(
          page,
          "Link",
          "see Janus here",
        );
        await expect(link).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await page.keyboard.press("ControlOrMeta+z");
        expect(await value(page)).toBe("see [Janus](https://example.com) here");
      },
    );

    test(
      "the Heading menu sets H1–H6, shows the level, and returns to a paragraph",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const trigger = host.getByRole(
          "button",
          {
            name: "Heading",
            exact: true,
          },
        );
        await load(
          page,
          "alpha",
        );
        await placeSelection(
          page,
          "alpha",
          2,
        );
        await step(
          page,
          "Heading 4",
          "#### alpha",
        );
        await expect(trigger).toHaveText(/H4/);
        await trigger.click();
        await expect(host.getByRole(
          "menuitemradio",
          {
            name: "Heading 4",
            exact: true,
          },
        )).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await host.getByRole(
          "menuitemradio",
          {
            name: "Heading 6",
            exact: true,
          },
        ).click();
        expect(await value(page)).toBe("###### alpha");
        await step(
          page,
          "Heading 6",
          "alpha",
        );
        await step(
          page,
          "Heading 2",
          "## alpha",
        );
        await step(
          page,
          "Paragraph",
          "alpha",
        );
        await expect(host.getByRole("menu")).toHaveCount(0);
        await page.keyboard.type("!");
        expect(await value(page)).toBe("al!pha");
      },
    );

    test(
      "the code language menu shows in code blocks and sets the language",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const language = host.getByRole(
          "button",
          {
            name: "Code language",
            exact: true,
          },
        );
        await load(
          page,
          "intro\n\n```\nconst a = 1;\n```",
        );
        await placeSelection(
          page,
          "intro",
          2,
        );
        await expect(language).toBeHidden();
        await placeSelection(
          page,
          "const",
          2,
        );
        await expect(language).toBeVisible();
        await chooseFromMenu(
          page,
          "Code language",
          "javascript",
        );
        expect(await value(page)).toBe("intro\n\n```javascript\nconst a = 1;\n```");
        await expect(host.locator(".janus-rich-editor pre .token").first()).toBeVisible();
        await expect(language).toHaveText(/javascript/);
      },
    );

    test(
      "typing in a highlighted code block keeps the caret and the value",
      async ({
        page,
      }) => {
        const tokens = page.locator(`${HOST} .janus-rich-editor pre .token`);
        await load(
          page,
          "```js\nconst a = 1;\n```",
        );
        await expect(tokens.first()).toBeVisible();
        await placeSelection(
          page,
          "1",
          1,
        );
        await page.keyboard.type("23");
        expect(await value(page)).toBe("```js\nconst a = 123;\n```");
        await expect(tokens.first()).toBeVisible();
      },
    );

    test(
      "the Heading menu works from the keyboard",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const trigger = host.getByRole(
          "button",
          {
            name: "Heading",
            exact: true,
          },
        );
        await load(
          page,
          "alpha",
        );
        await placeSelection(
          page,
          "alpha",
          2,
        );
        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(host.getByRole(
          "menuitemradio",
          {
            name: "Paragraph",
            exact: true,
          },
        )).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        expect(await value(page)).toBe("## alpha");
        await expect(host.getByRole("menu")).toHaveCount(0);
        await trigger.focus();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Escape");
        await expect(host.getByRole("menu")).toHaveCount(0);
        await expect(trigger).toBeFocused();
      },
    );

    test(
      "Ctrl+I italicizes the selection in every browser",
      async ({
        page,
      }) => {
        await load(
          page,
          "alpha beta",
        );
        await placeSelection(
          page,
          "alpha beta",
          6,
          10,
        );
        await page.keyboard.press("ControlOrMeta+i");
        expect(await value(page)).toBe("alpha *beta*");
      },
    );
  },
);

const TABLE = "intro\n\n| a | b |\n| --- | --- |\n| 1 | 2 |";

const tableAction = async (page, item) => {
  await page.locator(HOST).getByRole(
    "button",
    {
      name: "Edit table",
      exact: true,
    },
  ).click();
  await page.locator(HOST).getByRole(
    "menu",
    {
      name: "Edit table",
    },
  ).getByRole(
    /^Align|^No alignment/.test(item)
      ? "menuitemradio"
      : "menuitem",
    {
      name: item,
      exact: true,
    },
  ).click();
};

test.describe(
  "RichTextarea table editing",
  () => {
    test(
      "the table button inserts outside a table and is the table menu inside one",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const insert = host.getByRole(
          "button",
          {
            name: "Table",
            exact: true,
          },
        );
        const trigger = host.getByRole(
          "button",
          {
            name: "Edit table",
            exact: true,
          },
        );
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "intro",
          2,
        );
        await expect(insert).toBeVisible();
        await expect(trigger).toBeHidden();
        await placeSelection(
          page,
          "1",
          1,
        );
        await expect(insert).toBeHidden();
        await expect(trigger).toBeVisible();
        await expect(trigger.locator("janus-characters-icon")).toHaveText("▦");
        await expect(trigger).not.toContainText("Table");
      },
    );

    test(
      "the Edit table menu is not clipped by the textarea shell",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "1",
          1,
        );
        await page.evaluate(
          (host) => {
            const shell = document.querySelector(`${host} .janus-rich-shell`);
            shell.style.height = "7em";
            shell.style.minHeight = "7em";
          },
          HOST,
        );
        await host.getByRole(
          "button",
          {
            name: "Edit table",
            exact: true,
          },
        ).click();
        const menu = host.getByRole(
          "menu",
          {
            name: "Edit table",
          },
        );
        await expect(menu).toBeVisible();
        const escaped = await page.evaluate(
          (host) => {
            const shell = document.querySelector(`${host} .janus-rich-shell`);
            const panel = document.querySelector(`${host} .janus-rich-menu[data-menu="table"] [role="menu"]`);
            if (
              !shell ||
              !panel ||
              panel.hidden
            ) {
              return false;
            }
            const shellBox = shell.getBoundingClientRect();
            const menuBox = panel.getBoundingClientRect();
            const style = getComputedStyle(panel);
            const midX = menuBox.left + menuBox.width / 2;
            const nearBottom = document.elementFromPoint(
              midX,
              menuBox.bottom - 4,
            );
            return style.position === "fixed" && menuBox.bottom > shellBox.bottom + 1 && Boolean(nearBottom?.closest("[role=\"menu\"]"));
          },
          HOST,
        );
        expect(escaped).toBe(true);
        await menu.getByRole(
          "menuitem",
          {
            name: "Delete table",
            exact: true,
          },
        ).click();
        expect(await value(page)).toBe("intro");
      },
    );

    test(
      "the formatting toolbar stays fixed while the body scrolls",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const tall = Array.from(
          {
            length: 40,
          },
          (_, i) => `line ${i + 1}`,
        ).join("\n\n");
        await load(
          page,
          tall,
        );
        await page.evaluate(
          (host) => {
            const shell = document.querySelector(`${host} .janus-rich-shell`);
            shell.style.height = "12em";
            shell.style.minHeight = "12em";
          },
          HOST,
        );
        const before = await page.evaluate(
          (host) => {
            const toolbar = document.querySelector(`${host} .janus-rich-toolbar`);
            const body = document.querySelector(`${host} .janus-rich-body`);
            return {
              top: toolbar.getBoundingClientRect().top,
              scrollHeight: body.scrollHeight,
              clientHeight: body.clientHeight,
            };
          },
          HOST,
        );
        expect(before.scrollHeight).toBeGreaterThan(before.clientHeight + 20);
        await page.evaluate(
          (host) => {
            document.querySelector(`${host} .janus-rich-body`).scrollTop = 200;
          },
          HOST,
        );
        const after = await page.evaluate(
          (host) => {
            const toolbar = document.querySelector(`${host} .janus-rich-toolbar`);
            const body = document.querySelector(`${host} .janus-rich-body`);
            return {
              top: toolbar.getBoundingClientRect().top,
              scrollTop: body.scrollTop,
            };
          },
          HOST,
        );
        expect(after.scrollTop).toBeGreaterThan(100);
        expect(after.top).toBe(before.top);
        await expect(host.getByRole(
          "toolbar",
          {
            name: "Formatting",
          },
        )).toBeVisible();
      },
    );

    test(
      "insert row above and below put the caret in the new row",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "1",
          1,
        );
        await tableAction(
          page,
          "Insert row below",
        );
        await page.keyboard.type("x");
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n| x |  |");
        await placeSelection(
          page,
          "1",
          1,
        );
        await tableAction(
          page,
          "Insert row above",
        );
        await page.keyboard.type("y");
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |\n| y |  |\n| 1 | 2 |\n| x |  |");
        await expectConsistent(page);
      },
    );

    test(
      "insert column left and right put the caret in the new column",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "2",
          1,
        );
        await tableAction(
          page,
          "Insert column right",
        );
        await page.keyboard.type("x");
        expect(await value(page)).toBe("intro\n\n| a | b |  |\n| --- | --- | --- |\n| 1 | 2 | x |");
        await placeSelection(
          page,
          "a",
          1,
        );
        await tableAction(
          page,
          "Insert column left",
        );
        await page.keyboard.type("h");
        expect(await value(page)).toBe("intro\n\n| h | a | b |  |\n| --- | --- | --- | --- |\n|  | 1 | 2 | x |");
        await expectConsistent(page);
      },
    );

    test(
      "delete row is disabled in the header; delete row and column work in the body",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        await load(
          page,
          "| a | b |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |",
        );
        await placeSelection(
          page,
          "a",
          1,
        );
        await host.getByRole(
          "button",
          {
            name: "Edit table",
            exact: true,
          },
        ).click();
        await expect(host.getByRole(
          "menuitem",
          {
            name: "Delete row",
            exact: true,
          },
        )).toBeDisabled();
        await expect(host.getByRole(
          "menuitem",
          {
            name: "Insert row above",
            exact: true,
          },
        )).toBeDisabled();
        await page.keyboard.press("Escape");
        await placeSelection(
          page,
          "1",
          1,
        );
        await tableAction(
          page,
          "Delete row",
        );
        expect(await value(page)).toBe("| a | b |\n| --- | --- |\n| 3 | 4 |");
        await placeSelection(
          page,
          "4",
          1,
        );
        await tableAction(
          page,
          "Delete column",
        );
        expect(await value(page)).toBe("| a |\n| --- |\n| 3 |");
        await expectConsistent(page);
      },
    );

    test(
      "deleting the last column or the table leaves the surrounding text",
      async ({
        page,
      }) => {
        await load(
          page,
          "intro\n\n| a |\n| --- |\n| 1 |\n\noutro",
        );
        await placeSelection(
          page,
          "1",
          1,
        );
        await tableAction(
          page,
          "Delete column",
        );
        expect(await value(page)).toBe("intro\n\noutro");
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await tableAction(
          page,
          "Delete table",
        );
        expect(await value(page)).toBe("intro");
        await expectConsistent(page);
      },
    );

    test(
      "column alignment is shown, checked in the menu, and saved",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "2",
          1,
        );
        await tableAction(
          page,
          "Align center",
        );
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | :---: |\n| 1 | 2 |");
        const textAlign = await page.evaluate(
          (host) => getComputedStyle(document.querySelector(`${host} .janus-rich-editor td:last-child`)).textAlign,
          HOST,
        );
        expect(textAlign).toBe("center");
        await host.getByRole(
          "button",
          {
            name: "Edit table",
            exact: true,
          },
        ).click();
        await expect(host.getByRole(
          "menuitemradio",
          {
            name: "Align center",
            exact: true,
          },
        )).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await host.getByRole(
          "menuitemradio",
          {
            name: "Align right",
            exact: true,
          },
        ).click();
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | ---: |\n| 1 | 2 |");
        await tableAction(
          page,
          "No alignment",
        );
        expect(await value(page)).toBe(TABLE);
      },
    );

    test(
      "Tab and Shift+Tab move between cells; Tab in the last cell adds a row",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "a",
          1,
        );
        await page.keyboard.press("Tab");
        await page.keyboard.type("x");
        expect(await value(page)).toBe("intro\n\n| a | bx |\n| --- | --- |\n| 1 | 2 |");
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.type("y");
        expect(await value(page)).toBe("intro\n\n| ay | bx |\n| --- | --- |\n| 1 | 2 |");
        await placeSelection(
          page,
          "2",
          1,
        );
        await page.keyboard.press("Tab");
        await page.keyboard.type("z");
        expect(await value(page)).toBe("intro\n\n| ay | bx |\n| --- | --- |\n| 1 | 2 |\n| z |  |");
        expect(await editorFocused(page)).toBe(true);
        await expectConsistent(page);
      },
    );

    test(
      "Enter moves to the cell below and adds a row from the last row",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "b",
          1,
        );
        await page.keyboard.press("Enter");
        await page.keyboard.type("x");
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |\n| 1 | 2x |");
        await page.keyboard.press("Enter");
        await page.keyboard.type("y");
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |\n| 1 | 2x |\n|  | y |");
        await page.keyboard.press("Shift+Enter");
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |\n| 1 | 2x |\n|  | y |\n|  |  |");
        await expectConsistent(page);
      },
    );

    test(
      "a line break inside a cell, even inside bold, saves as a space",
      async ({
        page,
      }) => {
        const markdown = await page.evaluate(
          async () => {
            const {
              elementToAst,
              serializeMarkdown,
            } = await import("/src/janus/ui/markdown/index.js");
            const root = document.createElement("div");
            root.innerHTML = "<table><thead><tr><th>a<br>b<br></th></tr></thead>" + "<tbody><tr><td><strong>c<br>d</strong></td></tr></tbody></table>";
            return serializeMarkdown(elementToAst(root));
          },
        );
        expect(markdown).toBe("| a b |\n| --- |\n| **c d** |");
      },
    );

    test(
      "undo reverts a table action",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "1",
          1,
        );
        await tableAction(
          page,
          "Delete row",
        );
        expect(await value(page)).toBe("intro\n\n| a | b |\n| --- | --- |");
        await page.keyboard.press("ControlOrMeta+z");
        expect(await value(page)).toBe(TABLE);
      },
    );
  },
);

test.describe(
  "RichTextarea toolbar keyboard",
  () => {
    test(
      "ArrowRight moves between Bold and Italic on the Formatting toolbar",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        const toolbar = host.getByRole(
          "toolbar",
          {
            name: "Formatting",
          },
        );
        const bold = toolbar.getByRole(
          "button",
          {
            name: "Bold",
            exact: true,
          },
        );
        const italic = toolbar.getByRole(
          "button",
          {
            name: "Italic",
            exact: true,
          },
        );
        await bold.focus();
        await expect(bold).toBeFocused();
        await page.keyboard.press("ArrowRight");
        await expect(italic).toBeFocused();
        await page.keyboard.press("ArrowLeft");
        await expect(bold).toBeFocused();
      },
    );

    test(
      "a pressed format button keeps its accent border above the next control",
      async ({
        page,
      }) => {
        await load(
          page,
          "**bold** plain",
        );
        await placeSelection(
          page,
          "bold",
          1,
        );
        const host = page.locator(HOST);
        const bold = host.getByRole(
          "button",
          {
            name: "Bold",
            exact: true,
          },
        );
        const _italic = host.getByRole(
          "button",
          {
            name: "Italic",
            exact: true,
          },
        );
        await expect(bold).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        const stack = await page.evaluate(
          ({
            boldSel,
            italicSel,
          }) => {
            const pressed = document.querySelector(boldSel);
            const next = document.querySelector(italicSel);
            const pressedStyle = getComputedStyle(pressed);
            return {
              pressedZ: pressedStyle.zIndex,
              nextZ: getComputedStyle(next).zIndex,
              borderColor: pressedStyle.borderRightColor,
              accent: getComputedStyle(document.documentElement).getPropertyValue("--janus-accent").trim(),
            };
          },
          {
            boldSel: `${HOST} .janus-rich-toolbar button[aria-label="Bold"]`,
            italicSel: `${HOST} .janus-rich-toolbar button[aria-label="Italic"]`,
          },
        );
        expect(Number(stack.pressedZ)).toBeGreaterThan(Number(stack.nextZ));
        expect(stack.borderColor).not.toBe("rgba(0, 0, 0, 0)");
      },
    );
  },
);

test.describe(
  "RichTextarea toolbar icons",
  () => {
    /** Per icon in the button: CharactersIcon pulses, SVG icons load their `-animated` file. */
    const iconsAnimated = (page, button) => page.evaluate(
      ({
        host,
        button,
      }) => [
        ...document.querySelectorAll(`${host} .janus-rich-toolbar button[aria-label="${button}"] *`),
      ].filter(
        (el) => el.localName.endsWith("-icon"),
      ).map(
        (icon) => icon.localName === "janus-characters-icon"
          ? getComputedStyle(icon.firstElementChild).animationName === "janusPulse"
          : Boolean(icon.state.file?.endsWith("-animated.svg")),
      ),
      {
        host: HOST,
        button,
      },
    );

    test(
      "text buttons are character icons that animate while hovered",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        await expect(host.getByRole(
          "button",
          {
            name: "Bold",
            exact: true,
          },
        ).locator("janus-characters-icon")).toHaveCount(1);
        expect(await iconsAnimated(
          page,
          "Bold",
        )).toEqual(
          [
            false,
          ],
        );
        await host.getByRole(
          "button",
          {
            name: "Bold",
            exact: true,
          },
        ).hover();
        await expect.poll(
          () => iconsAnimated(
            page,
            "Bold",
          ),
        ).toEqual(
          [
            true,
          ],
        );
        await host.locator(".janus-rich-editor").hover();
        await expect.poll(
          () => iconsAnimated(
            page,
            "Bold",
          ),
        ).toEqual(
          [
            false,
          ],
        );
      },
    );

    test(
      "SVG icon buttons and menu chevrons animate while hovered",
      async ({
        page,
      }) => {
        const host = page.locator(HOST);
        for (const button of [
          "Link",
          "Heading",
        ]) {
          await expect.poll(
            () => iconsAnimated(
              page,
              button,
            ),
          ).toEqual(
            [
              false,
            ],
          );
          await host.getByRole(
            "button",
            {
              name: button,
              exact: true,
            },
          ).hover();
          await expect.poll(
            () => iconsAnimated(
              page,
              button,
            ),
          ).toEqual(
            [
              true,
            ],
          );
          await host.locator(".janus-rich-editor").hover();
          await expect.poll(
            () => iconsAnimated(
              page,
              button,
            ),
          ).toEqual(
            [
              false,
            ],
          );
        }
      },
    );

    test(
      "the table menu's icon and chevron animate while hovered",
      async ({
        page,
      }) => {
        await load(
          page,
          TABLE,
        );
        await placeSelection(
          page,
          "1",
          1,
        );
        await page.locator(HOST).getByRole(
          "button",
          {
            name: "Edit table",
            exact: true,
          },
        ).hover();
        await expect.poll(
          () => iconsAnimated(
            page,
            "Edit table",
          ),
        ).toEqual(
          [
            true,
            true,
          ],
        );
      },
    );
  },
);
