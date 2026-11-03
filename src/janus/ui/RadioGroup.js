import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

let instanceCount = 0;

class RadioGroup extends Component {

  constructor() {
    super();
    instanceCount += 1;
    this.fallbackName = `janus-radio-${instanceCount}`;
  }

  render() {
    const {
      name,
      value,
      options,
      label,
      disabled,
      color,
    } = this.props;
    const tone = color
      ? theme.tone(color)
      : "var(--janus-accent)";
    const radioStyle = util.expand(
      theme.choiceControl(tone),
      {
        borderRadius: "50%",
        ":checked": {
          backgroundColor: "var(--janus-surface)",
        },
        "::before": {
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: tone,
        },
      },
    );

    return html`
      <div
        role="radiogroup"
        style=${{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
        ${label
          ? {
              "aria-label": label,
            }
          : {}}
      >${options.map(
          (option) => html`
            <label
              key=${option.value}
              style=${theme.choiceLabel(disabled)}
            >
              <input
                type="radio"
                name=${name || this.fallbackName}
                value=${option.value}
                style=${radioStyle}
                ${option.value === value
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
              <span>${option.name}</span>
            </label>
          `,
        )}</div>
    `;
  }
}

Component.register(RadioGroup);
