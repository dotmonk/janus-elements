import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

const normalizeHex = (raw) => {
  if (
    !raw ||
    typeof raw !== "string"
  ) {
    return "#000000";
  }
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [
      ,
      a,
      b,
      c,
    ] = trimmed;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return "#000000";
};

class ColorInput extends Component {

  emitChange(event) {
    event.stopPropagation();
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(normalizeHex(event.target.value));
  }

  render() {
    const {
      disabled,
      color,
      value,
      name,
    } = this.props || {};
    const hex = normalizeHex(value);

    return html`
      <input
        type="color"
        style=${util.expand(
          theme.field(color),
          {
            padding: "2px",
            width: "2.75rem",
            height: "2.25rem",
            cursor: disabled
              ? "not-allowed"
              : "pointer",
          },
        )}
        ${disabled
          ? {
              disabled: "disabled",
            }
          : {}}
        value=${hex}
        ${name
          ? {
              name,
            }
          : {}}
        onInput=${(event) => this.emitChange(event)}
        onChange=${(event) => event.stopPropagation()}
      />
    `;
  }
}

Component.register(ColorInput);
