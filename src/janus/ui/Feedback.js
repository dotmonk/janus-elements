import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

const urgentTones = [
  "error",
  "warning",
];

class Feedback extends Component {

  render() {
    const {
      color = "info",
      title,
      onClose,
    } = this.props;
    const tone = theme.tone(color);

    return html`
      <div
        role=${urgentTones.includes(color)
          ? "alert"
          : "status"}
        style=${{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "12px 14px",
          margin: "8px 0",
          borderRadius: "var(--janus-radius)",
          borderWidth: "1px 1px 1px 4px",
          borderStyle: "solid",
          borderColor: theme.mix(
            tone,
            40,
          ),
          borderLeftColor: tone,
          backgroundColor: theme.mix(
            tone,
            10,
          ),
          color: "var(--janus-text)",
          fontSize: "0.9375rem",
        }}
      >
        <div
          style=${{
            flexGrow: "1",
          }}
        >
          ${title
            ? html`
                <strong
                  style=${{
                    display: "block",
                    color: tone,
                  }}
                >${title}</strong>
              `
            : ""}
          <div>${this.childElements}</div>
        </div>
        ${onClose
          ? html`
              <button
                type="button"
                aria-label="Dismiss"
                style=${theme.dismissButton}
                onClick=${() => onClose()}
              >×</button>
            `
          : ""}
      </div>
    `;
  }
}

Component.register(Feedback);
