import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class Textarea extends Component {

  render() {
    const {
      disabled,
      color,
    } = this.props;

    return html`
      <textarea
        style=${util.expand(
          theme.field(color),
          {
            minHeight: "4.5em",
            resize: "both",
            verticalAlign: "top",
          },
        )}
        ${disabled
          ? {
              disabled: "disabled",
            }
          : {}}
      >${this.childElements}</textarea>
    `;
  }
}

Component.register(Textarea);
