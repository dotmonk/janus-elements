import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class Switch extends Component {

  render() {
    const {
      checked,
      disabled,
      color,
    } = this.props;
    const tone = color
      ? theme.tone(color)
      : "var(--janus-accent)";

    return html`
      <label style=${theme.choiceLabel(disabled)}>
        <input
          type="checkbox"
          role="switch"
          style=${util.expand(
            theme.choiceControl(tone),
            {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "36px",
              height: "20px",
              padding: "0 2px",
              borderRadius: "999px",
              "::before": {
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "var(--janus-text-muted)",
                transform: "translateX(0)",
              },
              ":checked::before": {
                backgroundColor: "var(--janus-bg)",
                transform: "translateX(17px)",
              },
            },
          )}
          ${checked
            ? {
                checked: "",
              }
            : {}}
          ${disabled
            ? {
                disabled: "",
              }
            : {}}
        />
        <span>${this.childElements}</span>
      </label>
    `;
  }
}

Component.register(Switch);
