import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

const TRIANGLE = "polygon(50% 6%, 6% 94%, 94% 94%)";
// viewBox points match the clip-path proportions (tip near top, base near bottom).
const OUTLINE_POINTS = "20,2.4 2.4,37.6 37.6,37.6";

class IconTriangleWrapper extends Component {

  render() {
    const props = this.props || {};
    const {
      size = 24,
      color,
      outline,
    } = props;
    const tone = theme.tone(color);
    const shell = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: "0",
      position: "relative",
      color: tone,
      lineHeight: "0",
    };

    const face = {
      position: "absolute",
      inset: "0",
      clipPath: TRIANGLE,
      backgroundColor: theme.mix(
        tone,
        12,
      ),
    };

    const outlineSvg = {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      overflow: "visible",
      pointerEvents: "none",
    };

    const content = {
      position: "relative",
      zIndex: "1",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: `${Math.round(size * 0.18)}px`,
      color: tone,
      lineHeight: "0",
    };

    const forwarded = util.forwardedProps(props);
    delete forwarded.color;
    delete forwarded.size;
    delete forwarded.outline;

    return html`
      <span
        style=${shell}
        ${forwarded}
      >
        ${outline
          ? html`
              <svg
                style=${outlineSvg}
                viewBox="0 0 40 40"
                aria-hidden="true"
                focusable="false"
              >
                <polygon
                  points=${OUTLINE_POINTS}
                  fill="none"
                  stroke=${tone}
                  stroke-width="2.25"
                  stroke-linejoin="round"
                />
              </svg>
            `
          : html`
              <span
                style=${face}
                aria-hidden="true"
              />
            `}
        <span style=${content}>${this.childElements}</span>
      </span>
    `;
  }
}

Component.register(IconTriangleWrapper);
