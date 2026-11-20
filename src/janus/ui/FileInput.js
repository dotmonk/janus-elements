import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class FileInput extends Component {

  emitChange(event) {
    event.stopPropagation();
    const {
      onChange,
    } = this.props || {};
    const files = Array.from(event.target.files || []);
    onChange && onChange(files);
  }

  render() {
    const {
      disabled,
      color,
      accept,
      multiple = true,
    } = this.props || {};
    const bound = {};
    if (accept) {
      bound.accept = accept;
    }

    return html`
      <input
        type="file"
        style=${theme.field(color)}
        ${disabled
          ? {
              disabled: "disabled",
            }
          : {}}
        ${multiple
          ? {
              multiple: "",
            }
          : {}}
        ${bound}
        ${util.formAttributes(this.props)}
        onChange=${(event) => this.emitChange(event)}
      />
    `;
  }
}

Component.register(FileInput);
