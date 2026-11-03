import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  animatedIconSlot,
  iconHoverHandlers,
} from "./createIcon.js";

const FIELD_ICON_SIZE = 16;

const fieldShellStyle = (color) => util.expand(
  theme.field(color),
  {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "8px",
    paddingRight: "8px",
  },
);

const fieldInputStyle = {
  flexGrow: "1",
  minWidth: "6ch",
  margin: "0",
  padding: "2px 0",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: "inherit",
  font: "inherit",
  fontSize: "0.875rem",
  outline: "none",
};

const iconSlotStyle = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: "0",
  lineHeight: "0",
  color: "var(--janus-text-muted)",
};

class Input extends Component {

  constructor() {
    super();
    this.state = {
      iconHover: false,
    };
  }

  render() {
    const {
      disabled,
      color,
      value,
      placeholder,
      headIcon,
      tailIcon,
    } = this.props;
    const disabledAttr = disabled
      ? {
          disabled: "disabled",
        }
      : {};
    const animated = Boolean(this.state.iconHover && !disabled);
    const iconOptions = {
      size: FIELD_ICON_SIZE,
      animated,
      style: iconSlotStyle,
    };
    const head = animatedIconSlot(
      headIcon,
      iconOptions,
    );
    const tail = animatedIconSlot(
      tailIcon,
      iconOptions,
    );
    const hasIcons = Boolean(head || tail);

    if (!hasIcons) {
      return html`
        <input
          type="text"
          style=${theme.field(color)}
          ${disabledAttr}
          value=${value}
          placeholder=${placeholder}
        />
      `;
    }

    return html`
      <span
        style=${fieldShellStyle(color)}
        ${iconHoverHandlers(
          this,
          {
            disabled,
          },
        )}
      >
        ${head}
        <input
          type="text"
          style=${fieldInputStyle}
          ${disabledAttr}
          value=${value}
          placeholder=${placeholder}
        />
        ${tail}
      </span>
    `;
  }
}

Component.register(Input);
