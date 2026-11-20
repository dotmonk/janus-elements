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
    await page.goto("/src/tests/test.html");
    await page.evaluate(
      async () => {
        const {
          html,
          render,
        } = await import("/src/janus/index.js");
        await import("/src/janus/ui/index.js");
        window.submitted = [];
        const host = document.createElement("div");
        host.id = "form-host";
        document.body.append(host);
        const formAttributes = (name) => ({
          name,
          form: "the-form",
          required: true,
          autocomplete: "off",
        });
        render(
          host,
          html`
            <form
              id="the-form"
              onSubmit=${(event) => {
                event.preventDefault();
                window.submitted.push(Object.fromEntries(new FormData(event.target)));
              }}
            >
              <Input
                ${formAttributes("user")}
                value="ada"
              />
              <Textarea ${formAttributes("bio")}>hello</Textarea>
              <NumberInput
                ${formAttributes("age")}
                value=${36}
              />
              <RangeInput
                ${formAttributes("level")}
                value=${7}
              />
              <ColorInput
                ${formAttributes("tint")}
                value="#336699"
              />
              <FileInput ${formAttributes("files")} />
              <Checkbox
                ${formAttributes("agree")}
                checked
              >Agree</Checkbox>
              <Switch
                ${formAttributes("notify")}
                checked
              >Notify</Switch>
              <Button type="submit">Send</Button>
              <Button type="reset">Reset</Button>
            </form>
          `,
        );
      },
    );
  },
);

test.afterEach(
  () => {
    expect(pageErrors).toEqual([]);
  },
);

const fields = [
  [
    "janus-input",
    "input",
    "user",
  ],
  [
    "janus-textarea",
    "textarea",
    "bio",
  ],
  [
    "janus-number-input",
    "input",
    "age",
  ],
  [
    "janus-range-input",
    "input",
    "level",
  ],
  [
    "janus-color-input",
    "input",
    "tint",
  ],
  [
    "janus-file-input",
    "input",
    "files",
  ],
  [
    "janus-checkbox",
    "input",
    "agree",
  ],
  [
    "janus-switch",
    "input",
    "notify",
  ],
];

for (const [
  host,
  control,
  name,
] of fields) {
  test(
    `${host} passes name, form, required and autocomplete to its native control`,
    async ({
      page,
    }) => {
      const native = page.locator(`#form-host ${host} ${control}`);

      await expect(native).toHaveAttribute(
        "name",
        name,
      );
      await expect(native).toHaveAttribute(
        "form",
        "the-form",
      );
      await expect(native).toHaveAttribute(
        "required",
        "",
      );
      await expect(native).toHaveAttribute(
        "autocomplete",
        "off",
      );
    },
  );
}

test(
  "a submit Button submits the form, and FormData holds every field's value",
  async ({
    page,
  }) => {
    await page.locator("#form-host input[type=file]").setInputFiles(
      {
        name: "note.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hi"),
      },
    );
    await page.locator("#form-host janus-button button[type=submit]").click();

    const submitted = await page.evaluate(
      () => window.submitted.map(
        (entry) => ({
          ...entry,
          files: entry.files?.name,
        }),
      ),
    );
    expect(submitted).toEqual(
      [
        {
          user: "ada",
          bio: "hello",
          age: "36",
          level: "7",
          tint: "#336699",
          files: "note.txt",
          agree: "on",
          notify: "on",
        },
      ],
    );
  },
);

test(
  "a reset Button resets the form",
  async ({
    page,
  }) => {
    const input = page.locator("#form-host janus-input input");
    await input.fill("grace");

    await page.locator("#form-host janus-button button[type=reset]").click();

    await expect(input).toHaveValue("ada");
  },
);
