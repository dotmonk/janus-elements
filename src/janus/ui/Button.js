import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  animatedIconSlot,
  iconHoverHandlers,
} from "./createIcon.js";

const BUTTON_ICON_SIZE = 16;

const baseStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "6px 14px",
  margin: "2px",
  borderRadius: "var(--janus-radius)",
  borderWidth: "1px",
  borderStyle: "solid",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: "500",
  lineHeight: "1.25",
  cursor: "pointer",
  userSelect: "none",
  textDecoration: "none",
  transition: "background-color 120ms, border-color 120ms, color 120ms",
};

class Button extends Component {

  constructor() {
    super();
    this.state = {
      iconHover: false,
    };
  }

  render() {
    const {
      active,
      disabled,
      color,
      headIcon,
      tailIcon,
    } = this.props;
    const tone = theme.tone(color);
    const animated = Boolean(this.state.iconHover && !disabled);
    const head = animatedIconSlot(
      headIcon,
      {
        size: BUTTON_ICON_SIZE,
        animated,
      },
    );
    const tail = animatedIconSlot(
      tailIcon,
      {
        size: BUTTON_ICON_SIZE,
        animated,
      },
    );

    const variantStyle = active
      ? {
          backgroundColor: tone,
          borderColor: tone,
          color: "var(--janus-bg)",
          ":hover": {
            backgroundColor: theme.mix(
              tone,
              85,
              "var(--janus-bg)",
            ),
          },
        }
      : {
          backgroundColor: theme.mix(
            tone,
            12,
          ),
          borderColor: theme.mix(
            tone,
            30,
          ),
          color: tone,
          ":hover": {
            backgroundColor: theme.mix(
              tone,
              20,
            ),
          },
          ":active": {
            backgroundColor: theme.mix(
              tone,
              28,
            ),
          },
        };
    if (disabled) {
      delete variantStyle[":hover"];
      delete variantStyle[":active"];
      Object.assign(
        variantStyle,
        {
          opacity: "0.5",
          cursor: "not-allowed",
        },
      );
    }

    const style = util.expand(
      baseStyle,
      variantStyle,
    );
    const forwardedProps = util.forwardedProps(this.props);
    const hoverHandlers = iconHoverHandlers(
      this,
      {
        disabled,
      },
    );

    if (this.props.href) {
      return html`
        <a
          style=${style}
          ${forwardedProps}
          ${hoverHandlers}
        >${head}${this.childElements}${tail}</a>
      `;
    }
    return html`
      <button
        type="button"
        style=${style}
        ${forwardedProps}
        ${hoverHandlers}
      >${head}${this.childElements}${tail}</button>
    `;
  }
}

Component.register(Button);
