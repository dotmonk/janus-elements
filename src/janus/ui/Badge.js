import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0 8px",
  margin: "0 2px",
  borderRadius: "999px",
  borderWidth: "1px",
  borderStyle: "solid",
  fontSize: "0.75rem",
  fontWeight: "600",
  lineHeight: "1.6",
  verticalAlign: "middle",
};

class Badge extends Component {

  render() {
    const tone = theme.tone(this.props.color);

    const variantStyle = {
      backgroundColor: theme.mix(
        tone,
        12,
      ),
      borderColor: theme.mix(
        tone,
        35,
      ),
      color: tone,
    };

    return html`
      <span
        style=${util.expand(
          baseStyle,
          variantStyle,
        )}
        ${util.forwardedProps(this.props)}
      >${this.childElements}</span>
    `;
  }
}

Component.register(Badge);
