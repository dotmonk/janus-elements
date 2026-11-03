import Component, {
  html,
} from "janus-elements";
import {
  createLatestAsync,
} from "janus-elements/ui/latestAsync";
import {
  animatedIconSlot,
  iconHoverHandlers,
} from "janus-elements/ui/createIcon";
import SearchIcon from "janus-elements/ui/icons/search";

import {
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const latestImportSnippet = `import { createLatestAsync } from "janus-elements/ui/latestAsync";

const loads = createLatestAsync({ debounceMs: 300 });

const result = await loads.schedule(async () => {
  const response = await fetch(\`/search?q=\${query}\`);
  return response.json();
});
if (result === undefined) {
  // superseded by a newer schedule/run, or cancel()
  return;
}
// use result`;

const latestApiSnippet = `const { run, schedule, cancel } = createLatestAsync({ debounceMs: 0 });

await run(task);       // immediate; stale → undefined
await schedule(task);  // debounced; coalesces while waiting
cancel();              // bump generation + clear timer`;

const iconImportSnippet = `import createIcon, {
  animatedIconSlot,
  iconHoverHandlers,
  instantiateIcon,
} from "janus-elements/ui/createIcon";
import SearchIcon from "janus-elements/ui/icons/search";

// Register a custom line-art icon (SVGs under icons/<fileBase>.svg):
const WidgetIcon = createIcon("WidgetIcon", "widget");`;

const iconUsageSnippet = `// in render():
const animated = Boolean(this.state.iconHover && !disabled);
const icon = animatedIconSlot(SearchIcon, { size: 16, animated });
const hover = iconHoverHandlers(this, { disabled });

return html\`
  <button \${hover}>\${icon} Search</button>
\`;`;

const utilSnippet = `import util from "janus-elements/ui/util";

const style = util.expand(baseStyle, variantStyle);
const attrs = util.forwardedProps(this.props); // drops style + functions`;

const highlightSnippet = `import {
  highlight,
  detectLanguage,
  resolveLanguageId,
  resolveHighlightLanguage,
  LANGUAGE_IDS,
  escapeHtml,
  ensureHighlightStyles,
} from "janus-elements/ui/highlight";`;

class DocsHelpers extends Component {

  constructor() {
    super();
    this.state = {
      iconHover: false,
      loadLog: "Idle",
    };
    this.loads = createLatestAsync(
      {
        debounceMs: 200,
      },
    );
  }

  componentWillUnmount() {
    this.loads.cancel();
  }

  async scheduleDemo(label, delayMs) {
    this.setState(
      {
        loadLog: `Scheduled ${label}…`,
      },
    );
    const result = await this.loads.schedule(
      () => new Promise(
        (resolve) => {
          setTimeout(
            () => resolve(label),
            delayMs,
          );
        },
      ),
    );
    if (result === undefined) {
      return;
    }
    this.setState(
      {
        loadLog: `Got ${result}`,
      },
    );
  }

  render() {
    const {
      iconHover,
      loadLog,
    } = this.state;
    const icon = animatedIconSlot(
      SearchIcon,
      {
        size: 20,
        animated: iconHover,
      },
    );
    const hover = iconHoverHandlers(this);

    return html`
      <section style=${sectionStyle}>
        <h2>Helpers</h2>
        <p>
          Small utilities for race-safe async work and hover-animated icons. Select’s
          <code>loadOptions</code>
          uses
          <code>createLatestAsync</code>
          ; Button, Input, and Select use the icon helpers for
          <code>headIcon</code>
          /
          <code>tailIcon</code>
          .
        </p>
        <h3>latestAsync</h3>
        <p>
          Import
          <code>janus-elements/ui/latestAsync</code>
          . Factory is Node-safe (no DOM). Only the latest
          <code>run</code>
          /
          <code>schedule</code>
          delivers a value; stale settlements fulfill as
          <code>undefined</code>
          (stale rejections are swallowed). Pass your own
          <code>AbortSignal</code>
          into
          <code>task</code>
          when the network request itself must abort.
        </p>
        <CodeSnippet
          language="javascript"
          code=${latestImportSnippet}
        />
        <CodeSnippet
          language="javascript"
          code=${latestApiSnippet}
        />
        <div style=${rowStyle}>
          <Button
            onClick=${() => this.scheduleDemo(
              "A",
              400,
            )}
          >Schedule A (400ms)</Button>
          <Button
            onClick=${() => this.scheduleDemo(
              "B",
              100,
            )}
          >Schedule B (100ms)</Button>
          <Button
            color="warning"
            onClick=${() => {
              this.loads.cancel();
              this.setState(
                {
                  loadLog: "Cancelled",
                },
              );
            }}
          >Cancel</Button>
        </div>
        <p>
          <code>${loadLog}</code>
          — click A then quickly B; only B should stick after debounce.
        </p>
        ${propsTable(
          "createLatestAsync",
          [
            [
              "debounceMs",
              "number",
              "Delay for `schedule` (default 0 → same as `run`).",
            ],
            [
              "run(task)",
              "Promise",
              "Run now; stale → `undefined`.",
            ],
            [
              "schedule(task)",
              "Promise",
              "Debounced run; coalesces while waiting.",
            ],
            [
              "cancel()",
              "void",
              "Invalidate in-flight work and clear the timer.",
            ],
          ],
        )}
        <h3>Icon helpers</h3>
        <p>
          Import from
          <code>janus-elements/ui/createIcon</code>
          . Default export
          <code>createIcon(className, fileBase)</code>
          registers a line-art icon that loads
          <code>${"icons/<fileBase>.svg"}</code>
          (and the
          <code>-animated</code>
          variant).
          <code>animatedIconSlot</code>
          builds an icon via
          <code>instantiateIcon</code>
          , sets
          <code>janusKey</code>
          to
          <code>icon-animated</code>
          /
          <code>icon-static</code>
          so the SVG remounts when
          <code>animated</code>
          flips, and wraps it in a
          <code>${"<span>"}</code>
          .
          <code>iconHoverHandlers</code>
          toggles a boolean on
          <code>component.state</code>
          (default key
          <code>iconHover</code>
          ) without redundant
          <code>setState</code>
          .
        </p>
        <CodeSnippet
          language="javascript"
          code=${iconImportSnippet}
        />
        <CodeSnippet
          language="javascript"
          code=${iconUsageSnippet}
        />
        <div style=${rowStyle}>
          <button
            type="button"
            style=${{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              border: "1px solid var(--janus-border)",
              borderRadius: "var(--janus-radius)",
              background: "var(--janus-surface)",
              color: "var(--janus-text)",
              cursor: "pointer",
            }}
            ${hover}
          >${icon} Hover me</button>
        </div>
        ${propsTable(
          [
            {
              name: "createIcon(className, fileBase)",
              rows: [
                [
                  "className",
                  "string",
                  "Constructor name used for `janus-…` registration.",
                ],
                [
                  "fileBase",
                  "string",
                  "SVG basename under `icons/` (plus `-animated`).",
                ],
              ],
            },
            {
              name: "animatedIconSlot(Icon, options)",
              rows: [
                [
                  "Icon",
                  "class",
                  "Registered icon constructor (e.g. SearchIcon).",
                ],
                [
                  "size",
                  "number",
                  "Passed through to the icon.",
                ],
                [
                  "animated",
                  "boolean",
                  "Load the animated SVG; remounts via janusKey.",
                ],
                [
                  "style",
                  "object",
                  "Wrapper span style (inline-flex defaults).",
                ],
              ],
            },
            {
              name: "iconHoverHandlers(component, options)",
              rows: [
                [
                  "disabled",
                  "boolean",
                  "Skip enter updates when true.",
                ],
                [
                  "stateKey",
                  "string",
                  "State flag name (default `iconHover`).",
                ],
              ],
            },
            {
              name: "instantiateIcon(Icon, props)",
              rows: [
                [
                  "Icon",
                  "class",
                  "Registered icon; throws if not defined.",
                ],
                [
                  "props",
                  "object",
                  "Assigned to the element’s `props`.",
                ],
              ],
            },
          ],
        )}
        <h3>util and highlight</h3>
        <p>
          <code>janus-elements/ui/util</code>
          :
          <code>expand</code>
          merges style objects;
          <code>forwardedProps</code>
          copies props except
          <code>style</code>
          and functions. See also
          <code>janus-elements/ui/highlight</code>
          on the
          <a href="#/ui/code-editor">Code editor</a>
          page.
        </p>
        <CodeSnippet
          language="javascript"
          code=${utilSnippet}
        />
        <CodeSnippet
          language="javascript"
          code=${highlightSnippet}
        />
      </section>
    `;
  }
}

Component.register(DocsHelpers);
