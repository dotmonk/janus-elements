import Component, {
  html,
} from "janus-elements";

import {
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const usageSnippet = `import "janus-elements/ui";
import "./janus-theme-ocean.css"; // after the library import

// Optional: force light or dark with BaseTheme
// <BaseTheme mode="light" />`;

const overrideSnippet = `:root {
  --janus-accent: #7c3aed;
  --janus-radius: 10px;
}`;

const tokens = [
  "bg",
  "surface",
  "raised",
  "border",
  "border-strong",
  "text",
  "text-muted",
  "accent",
  "success",
  "warning",
  "error",
  "info",
  "focus",
];

class DocsUiGeneral extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>UI general</h2>
        <p>
          Import
          <code>janus-elements/ui</code>
          once to register every component and install the theme. Components take a
          <code>color</code>
          prop:
          <code>standard</code>
          ,
          <code>accent</code>
          ,
          <code>success</code>
          ,
          <code>warning</code>
          ,
          <code>error</code>
          ,
          <code>info</code>
          , or any CSS color.
        </p>
        <p>
          <code>${"<BaseTheme mode />"}</code>
          adds page styles and takes
          <code>mode</code>
          :
          <code>"system"</code>
          (default),
          <code>"light"</code>
          or
          <code>"dark"</code>
          . Override tokens such as
          <code>--janus-accent</code>
          in your own stylesheet.
        </p>
        <p>
          Every component takes its colors from the theme tokens below. Switch mode (system, day, night) and palette theme in the header. Text and
          <a href="#">links</a>
          follow the base theme. Each example includes a highlighted snippet of the markup.
        </p>
        <h3>Using themes</h3>
        <p>
          The header
          <strong>Mode</strong>
          control chooses system, day, or night via
          <code>BaseTheme</code>
          . The
          <strong>Theme</strong>
          control picks a docs palette (or Custom). In your app, keep Mode through
          <code>BaseTheme</code>
          and ship palette overrides as CSS: import
          <code>janus-elements/ui</code>
          first, then a theme stylesheet that sets the
          <code>--janus-*</code>
          tokens for dark and light. See the
          <a href="#/ui/custom-theme">full exported CSS</a>
          for the active theme on the Custom theme page.
        </p>
        <p>
          Use the Export CSS icon button next to the Theme control to download the active header theme (including Custom). Drop that file into your project after the library import. Edit Custom on the
          <a href="#/ui/custom-theme">Custom theme</a>
          page. Keep text and tone colors at 4.5:1 against
          <code>--janus-bg</code>
          and
          <code>--janus-surface</code>
          .
        </p>
        <CodeSnippet
          language="javascript"
          code=${usageSnippet}
        />
        <p>
          For a one-off override that applies in both modes, a plain
          <code>:root</code>
          rule is enough (the library theme uses zero specificity):
        </p>
        <CodeSnippet
          language="css"
          code=${overrideSnippet}
        />
        <h3>Theme tokens</h3>
        <div style=${rowStyle}>${tokens.map(
            (token) => html`
              <div
                style=${{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  width: "14ch",
                }}
              >
                <span
                  style=${{
                    width: "56px",
                    height: "36px",
                    borderRadius: "var(--janus-radius)",
                    border: "1px solid var(--janus-border)",
                    backgroundColor: `var(--janus-${token})`,
                  }}
                />
                <code
                  style=${{
                    fontSize: "0.75rem",
                    color: "var(--janus-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >${token}</code>
              </div>
            `,
          )}</div>
        <p>
          Non-colour tokens:
          <code>--janus-shadow</code>
          ,
          <code>--janus-radius</code>
          ,
          <code>--janus-font</code>
          . Import
          <code>theme</code>
          from
          <code>janus-elements/ui/theme</code>
          (or
          <code>janus-elements/ui</code>
          ) for
          <code>tone</code>
          ,
          <code>mix</code>
          ,
          <code>field</code>
          ,
          <code>choiceControl</code>
          , and
          <code>ensureThemeTokens</code>
          .
        </p>
        ${propsTable(
          "BaseTheme",
          [
            ...kitPropRows,
            [
              "mode",
              `"system" | "light" | "dark"`,
              "Theme mode; `system` follows `prefers-color-scheme`.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiGeneral);
