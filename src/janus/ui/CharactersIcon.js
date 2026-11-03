import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

class CharactersIcon extends Component {

  render() {
    const props = this.props || {};
    const {
      size = 24,
      color,
      text,
      animated,
    } = props;
    const ariaLabel = props["aria-label"];
    const labelled = Boolean(ariaLabel || props.title);
    const tone = color
      ? theme.tone(color)
      : "currentColor";
    const glyph = text !== undefined && text !== null
      ? String(text)
      : this.childElements;

    theme.ensureThemeTokens();

    const style = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: "0",
      fontFamily: "var(--janus-font)",
      fontSize: `${Math.round(size * 0.4)}px`,
      fontWeight: "600",
      lineHeight: "1",
      letterSpacing: "0.02em",
      color: tone,
      userSelect: "none",
      transformOrigin: "center",
      animation: animated
        ? "janusPulse 1.2s ease-in-out infinite"
        : undefined,
    };

    const forwarded = util.forwardedProps(props);
    delete forwarded.text;
    delete forwarded.color;
    delete forwarded.size;
    delete forwarded.animated;
    delete forwarded["aria-label"];
    delete forwarded.title;

    return html`
      <span
        style=${style}
        aria-hidden=${labelled
          ? undefined
          : "true"}
        aria-label=${ariaLabel}
        role=${labelled
          ? "img"
          : undefined}
        title=${props.title}
        ${forwarded}
      >${glyph}</span>
    `;
  }
}

Component.register(CharactersIcon);
