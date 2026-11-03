import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

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
      name,
      accept,
      multiple = true,
    } = this.props || {};
    const bound = {};
    if (name) {
      bound.name = name;
    }
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
        onChange=${(event) => this.emitChange(event)}
      />
    `;
  }
}

Component.register(FileInput);
