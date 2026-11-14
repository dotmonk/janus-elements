import {
  test,
  expect,
} from "@playwright/test";

const renderedFieldWidths = (page, width) => page.evaluate(
  async (fieldWidth) => {
    const {
      html,
      render,
    } = await import("/src/janus/index.js");
    await import("/src/janus/ui/Input.js");
    await import("/src/janus/ui/Textarea.js");
    const container = document.createElement("div");
    container.style.width = "300px";
    document.body.append(container);
    render(
      container,
      html`
        <Input
          style=${{
            width: fieldWidth,
          }}
        />
        <Textarea
          style=${{
            width: fieldWidth,
          }}
        >text</Textarea>
      `,
    );
    const widthOf = (selector) => container.querySelector(selector).getBoundingClientRect().width;
    return {
      input: widthOf("input"),
      textarea: widthOf("textarea"),
    };
  },
  width,
);

test(
  "a field's width includes its padding and border",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    expect(await renderedFieldWidths(
      page,
      "240px",
    )).toEqual(
      {
        input: 240,
        textarea: 240,
      },
    );
  },
);

test(
  "a field at width 100% is as wide as its container",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    expect(await renderedFieldWidths(
      page,
      "100%",
    )).toEqual(
      {
        input: 300,
        textarea: 300,
      },
    );
  },
);
