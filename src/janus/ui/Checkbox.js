import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class Checkbox extends Component {

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
          style=${util.expand(
            theme.choiceControl(tone),
            {
              borderRadius: "4px",
              "::before": {
                width: "5px",
                height: "10px",
                marginTop: "-2px",
                borderStyle: "solid",
                borderColor: "var(--janus-bg)",
                borderWidth: "0 2px 2px 0",
                transform: "rotate(45deg) scale(0)",
              },
              ":checked::before": {
                transform: "rotate(45deg) scale(1)",
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

Component.register(Checkbox);
