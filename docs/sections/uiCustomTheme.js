import Component, {
  html,
} from "janus-elements";

import {
  rowStyle,
  sectionStyle,
} from "../shared.js";
import {
  COLOR_TOKEN_KEYS,
  TEXT_TOKEN_KEYS,
  buildExportCss,
  getActiveDocsTheme,
  getCustomTheme,
  resetCustomTheme,
  startCustomFromActive,
  subscribeThemes,
  tokenCssName,
  updateCustomToken,
} from "../themes.js";

const editorRowStyle = {
  display: "grid",
  gridTemplateColumns: "14ch minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px 12px",
  marginBottom: "8px",
};

const textFieldStyle = {
  width: "100%",
  minWidth: "0",
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: "var(--janus-radius)",
  border: "1px solid var(--janus-border)",
  backgroundColor: "var(--janus-raised)",
  color: "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
};

class DocsUiCustomTheme extends Component {

  constructor() {
    super();
    this.state = {
      editorMode: "light",
      custom: getCustomTheme(),
    };
  }

  componentDidMount() {
    this._unsubscribeThemes = subscribeThemes(
      () => {
        this.setState(
          {
            custom: getCustomTheme(),
          },
        );
      },
    );
  }

  componentWillUnmount() {
    this._unsubscribeThemes && this._unsubscribeThemes();
  }

  setToken(key, value) {
    updateCustomToken(
      this.state.editorMode,
      key,
      value,
    );
  }

  renderTokenFields(modeTokens) {
    return html`
      <div>${COLOR_TOKEN_KEYS.map(
          (key) => html`
            <div style=${editorRowStyle}>
              <code
                style=${{
                  fontSize: "0.75rem",
                }}
              >${tokenCssName(key)}</code>
              <span
                style=${{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "0",
                }}
              >
                <ColorInput
                  value=${modeTokens[key]}
                  onChange=${(value) => this.setToken(
                    key,
                    value,
                  )}
                />
                <input
                  type="text"
                  style=${textFieldStyle}
                  value=${modeTokens[key]}
                  onInput=${(event) => this.setToken(
                    key,
                    event.target.value,
                  )}
                />
              </span>
            </div>
          `,
        )}${TEXT_TOKEN_KEYS.map(
          (key) => html`
            <div style=${editorRowStyle}>
              <code
                style=${{
                  fontSize: "0.75rem",
                }}
              >${tokenCssName(key)}</code>
              <input
                type="text"
                style=${textFieldStyle}
                value=${modeTokens[key]}
                onInput=${(event) => this.setToken(
                  key,
                  event.target.value,
                )}
              />
            </div>
          `,
        )}</div>
    `;
  }

  render() {
    const {
      editorMode,
      custom,
    } = this.state;
    const modeTokens = custom[editorMode];
    const activeTheme = getActiveDocsTheme();

    return html`
      <section style=${sectionStyle}>
        <h2>Custom theme</h2>
        <p>
          Edit the Custom palette (session only; use the header
          <strong>Export CSS</strong>
          button to keep it). Changes select Custom in the header so you can preview immediately. Start from the active theme to copy a preset, then tweak tokens. Active theme:
          <code>${activeTheme === "default"
              ? "janus"
              : activeTheme}</code>
          .
        </p>
        <div
          style=${{
            ...rowStyle,
            marginBottom: "12px",
          }}
        >
          <Button onClick=${() => startCustomFromActive()}>Start from active theme</Button>
          <Button
            color="warning"
            onClick=${() => resetCustomTheme(
              {
                activate: true,
              },
            )}
          >Reset custom</Button>
        </div>
        <Navbar
          value=${editorMode === "light"
            ? "Day"
            : "Night"}
          titles=${[
            "Day",
            "Night",
          ]}
          onChange=${(title) => this.setState(
            {
              editorMode: title === "Day"
                ? "light"
                : "dark",
            },
          )}
        />
        <div
          class="docs-custom-theme-editor"
          style=${{
            marginTop: "12px",
          }}
        >${this.renderTokenFields(modeTokens)}</div>
        <p
          id="docs-exported-css"
          style=${{
            marginTop: "16px",
            color: "var(--janus-text-muted)",
          }}
        >Exported CSS for the active theme:</p>
        <CodeSnippet
          language="css"
          code=${buildExportCss(activeTheme)}
        />
      </section>
    `;
  }
}

Component.register(DocsUiCustomTheme);
