import {
  test,
  expect,
} from "@playwright/test";

test(
  "registering a different class under a taken name throws, even on dev pages",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    const outcome = await page.evaluate(
      async () => {
        globalThis.__JANUSE_HMR__ = true;
        const {
          default: Component,
          html,
        } = await import("/src/janus/index.js");
        const first = class ClashProbe extends Component {

          render() {
            return html`
              <p>first</p>
            `;
          }
        };
        Component.register(first);
        Component.register(first);
        try {
          Component.register(class ClashProbe extends Component {

            render() {
              return html`
                <p>second</p>
              `;
            }
          });
          return {
            threw: false,
          };
        } catch (error) {
          return {
            threw: true,
            message: error.message,
            stillFirst: customElements.get("janus-clash-probe") === first,
          };
        }
      },
    );

    expect(outcome.threw).toBe(true);
    expect(outcome.message).toContain("janus-clash-probe");
    expect(outcome.stillFirst).toBe(true);
  },
);

test(
  "an explicit name survives minified class names",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    const rendered = await page.evaluate(
      async () => {
        const {
          default: Component,
          html,
          render,
        } = await import("/src/janus/index.js");
        const Minified = class extends Component {

          render() {
            return html`
              <p>explicit</p>
            `;
          }
        };
        Component.register(
          Minified,
          "ExplicitWidget",
        );
        const container = document.createElement("div");
        document.body.append(container);
        render(
          container,
          html`
            <ExplicitWidget />
          `,
        );
        return {
          defined: customElements.get("janus-explicit-widget") === Minified,
          text: container.querySelector("janus-explicit-widget")?.textContent.trim(),
        };
      },
    );

    expect(rendered).toEqual(
      {
        defined: true,
        text: "explicit",
      },
    );
  },
);

test(
  "during an HMR update a re-registered class hot-swaps instead of throwing",
  async ({
    page,
  }) => {
    await page.goto("/src/tests/test.html");

    const text = await page.evaluate(
      async () => {
        const {
          default: Component,
          html,
          render,
        } = await import("/src/janus/index.js");
        Component.register(class SwapProbe extends Component {

          render() {
            return html`
              <p>before</p>
            `;
          }
        });
        const container = document.createElement("div");
        document.body.append(container);
        render(
          container,
          html`
            <SwapProbe />
          `,
        );
        globalThis.__JANUSE_HMR_UPDATING__ = 1;
        try {
          Component.register(class SwapProbe extends Component {

            render() {
              return html`
                <p>after</p>
              `;
            }
          });
        } finally {
          globalThis.__JANUSE_HMR_UPDATING__ = 0;
        }
        return container.querySelector("janus-swap-probe").textContent.trim();
      },
    );

    expect(text).toBe("after");
  },
);
