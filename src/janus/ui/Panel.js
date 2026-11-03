import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

const baseStyle = {
  padding: "12px 16px",
  margin: "4px 2px",
  borderRadius: "calc(var(--janus-radius) * 1.5)",
  borderWidth: "1px",
  borderStyle: "solid",
  color: "var(--janus-text)",
};

class Panel extends Component {

  render() {
    const {
      color,
    } = this.props;
    const tone = theme.tone(color);
    const tinted = color && color !== "standard";

    const variantStyle = {
      borderColor: tinted
        ? theme.mix(
            tone,
            45,
          )
        : "var(--janus-border)",
      backgroundColor: tinted
        ? theme.mix(
            tone,
            8,
          )
        : "var(--janus-surface)",
    };

    return html`
      <div
        style=${util.expand(
          baseStyle,
          variantStyle,
        )}
        ${util.forwardedProps(this.props)}
      >${this.childElements}</div>
    `;
  }
}

Component.register(Panel);
