import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

const resolveVariant = (variant) => variant === "dots" || variant === "bars" || variant === "pulse"
  ? variant
  : "ring";

const glyphSlot = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1em",
  height: "1em",
  boxSizing: "border-box",
  flexShrink: "0",
  lineHeight: "0",
};

const ringGlyph = (tone) => html`
  <span
    aria-hidden="true"
    style=${{
      ...glyphSlot,
      borderRadius: "50%",
      border: `2px solid ${theme.mix(tone, 25, "transparent")}`,
      borderTopColor: tone,
      animation: "janusSpin 0.8s linear infinite",
    }}
  />
`;

const pulseGlyph = (tone) => html`
  <span
    aria-hidden="true"
    style=${glyphSlot}
  >
    <span
      style=${{
        display: "block",
        width: "0.75em",
        height: "0.75em",
        borderRadius: "50%",
        background: tone,
        animation: "janusPulse 1.2s ease-in-out infinite",
      }}
    />
  </span>
`;

const dotsGlyph = (tone) => html`
  <span
    aria-hidden="true"
    style=${{
      ...glyphSlot,
      gap: "0.15em",
    }}
  >${[
      0,
      0.2,
      0.4,
    ].map(
      (delay) => html`
        <span
          style=${{
            display: "block",
            width: "0.28em",
            height: "0.28em",
            borderRadius: "50%",
            background: tone,
            animation: `janusPulse 1.2s ease-in-out ${delay}s infinite`,
          }}
        />
      `,
    )}</span>
`;

const barsGlyph = (tone) => html`
  <span
    aria-hidden="true"
    style=${{
      ...glyphSlot,
      gap: "0.12em",
      alignItems: "center",
    }}
  >${[
      0,
      0.15,
      0.3,
    ].map(
      (delay) => html`
        <span
          style=${{
            display: "block",
            width: "0.18em",
            height: "0.85em",
            borderRadius: "0.06em",
            background: tone,
            transformOrigin: "center",
            animation: `janusSpinnerBars 0.9s ease-in-out ${delay}s infinite`,
          }}
        />
      `,
    )}</span>
`;

const glyphFor = (variant, tone) => {
  if (variant === "dots") {
    return dotsGlyph(tone);
  }
  if (variant === "bars") {
    return barsGlyph(tone);
  }
  if (variant === "pulse") {
    return pulseGlyph(tone);
  }
  return ringGlyph(tone);
};

class Spinner extends Component {

  render() {
    const {
      color,
      variant,
    } = this.props;
    const tone = color
      ? theme.tone(color)
      : "var(--janus-accent)";
    const resolved = resolveVariant(variant);

    const style = {
      display: "inline-flex",
      alignItems: "center",
      verticalAlign: "middle",
      gap: "8px",
      margin: "4px 12px 4px 0",
      fontSize: "0.875rem",
      lineHeight: "1.25",
      color: color
        ? tone
        : "var(--janus-text-muted)",
    };

    const forwarded = util.forwardedProps(this.props);
    delete forwarded.color;
    delete forwarded.variant;

    return html`
      <p
        role="status"
        style=${style}
        ${forwarded}
      >${glyphFor(
          resolved,
          tone,
        )}${this.childElements}</p>
    `;
  }
}

Component.register(Spinner);
