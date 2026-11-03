import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

const parseNumber = (raw) => {
  if (
    raw === "" ||
    raw === null ||
    raw === undefined
  ) {
    return undefined;
  }
  const next = Number(raw);
  return Number.isFinite(next)
    ? next
    : undefined;
};

class NumberInput extends Component {

  emitChange(event) {
    event.stopPropagation();
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(parseNumber(event.target.value));
  }

  render() {
    const {
      disabled,
      color,
      value,
      name,
      min,
      max,
      step,
      placeholder,
    } = this.props || {};
    const valueProps = value === undefined || value === null
      ? {}
      : {
          value: String(value),
        };
    const bound = {};
    if (
      min !== undefined &&
      min !== null
    ) {
      bound.min = String(min);
    }
    if (
      max !== undefined &&
      max !== null
    ) {
      bound.max = String(max);
    }
    if (
      step !== undefined &&
      step !== null
    ) {
      bound.step = String(step);
    }
    if (name) {
      bound.name = name;
    }
    if (placeholder) {
      bound.placeholder = placeholder;
    }

    return html`
      <input
        type="number"
        style=${theme.field(color)}
        ${disabled
          ? {
              disabled: "disabled",
            }
          : {}}
        ${valueProps}
        ${bound}
        onInput=${(event) => this.emitChange(event)}
        onChange=${(event) => event.stopPropagation()}
      />
    `;
  }
}

Component.register(NumberInput);
