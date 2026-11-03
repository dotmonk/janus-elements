import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class RangeInput extends Component {

  emitChange(event) {
    event.stopPropagation();
    const {
      onChange,
    } = this.props || {};
    const next = Number(event.target.value);
    onChange && onChange(Number.isFinite(next)
      ? next
      : 0);
  }

  render() {
    const {
      disabled,
      color,
      value,
      name,
      min = 0,
      max = 100,
      step = 1,
    } = this.props || {};
    const tone = color && color !== "standard"
      ? theme.tone(color)
      : "var(--janus-accent)";

    return html`
      <input
        type="range"
        style=${util.expand(
          theme.field(color),
          {
            padding: "0",
            accentColor: tone,
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
        value=${String(value === undefined || value === null
          ? min
          : value)}
        min=${String(min)}
        max=${String(max)}
        step=${String(step)}
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

Component.register(RangeInput);
