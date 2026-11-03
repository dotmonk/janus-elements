import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

class Progress extends Component {

  render() {
    const {
      value,
      max = 100,
      label,
      color,
    } = this.props;
    const tone = color
      ? theme.tone(color)
      : "var(--janus-accent)";
    const determinate = typeof value === "number";
    const percent = determinate
      ? Math.min(
          Math.max(
            value / max,
            0,
          ),
          1,
        ) * 100
      : 0;

    return html`
      <div
        style=${{
          margin: "8px 0",
          maxWidth: "420px",
        }}
      >
        ${label
          ? html`
              <div
                style=${{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontSize: "0.875rem",
                }}
              >
                <span>${label}</span>
                ${determinate
                  ? html`
                      <span
                        style=${{
                          color: "var(--janus-text-muted)",
                        }}
                      >${`${Math.round(percent)}%`}</span>
                    `
                  : ""}
              </div>
            `
          : ""}
        <div
          role="progressbar"
          ${label
            ? {
                "aria-label": label,
              }
            : {}}
          ${determinate
            ? {
                "aria-valuemin": 0,
                "aria-valuemax": max,
                "aria-valuenow": value,
              }
            : {}}
          style=${{
            position: "relative",
            height: "8px",
            borderRadius: "999px",
            overflow: "hidden",
            backgroundColor: theme.mix(
              tone,
              18,
            ),
          }}
        >
          <div
            style=${determinate
              ? {
                  width: `${percent}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  backgroundColor: tone,
                  transition: "width 200ms",
                }
              : {
                  position: "absolute",
                  top: "0",
                  bottom: "0",
                  width: "40%",
                  borderRadius: "inherit",
                  backgroundColor: tone,
                  animation: "janusProgress 1.2s ease-in-out infinite",
                }}
          />
        </div>
      </div>
    `;
  }
}

Component.register(Progress);
