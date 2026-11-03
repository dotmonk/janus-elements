import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

let tooltipId = 0;

const revealed = {
  visibility: "visible",
  opacity: "1",
};

const controlSelector = "input, textarea, select, button, a[href], [role=\"combobox\"], [tabindex]:not([tabindex=\"-1\"])";

const flatten = (value) => {
  if (
    value == null ||
    value === false
  ) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(flatten);
  }
  return [
    value,
  ];
};

const tooltipNodes = (tooltip) => flatten(tooltip).map(
  (node) => node && node.nodeType
    ? node.cloneNode(true)
    : node,
);

class Tooltip extends Component {

  constructor() {
    super();
    tooltipId += 1;
    this._tooltipId = tooltipId;
  }

  bubbleId(index) {
    return `janus-tooltip-${this._tooltipId}-${index}`;
  }

  syncDescribedBy() {
    const wrappers = this.querySelectorAll(":scope > span");
    wrappers.forEach(
      (wrapper, index) => {
        const bubble = wrapper.querySelector(".janus-tooltip-bubble");
        const control = wrapper.querySelector(controlSelector);
        if (
          !bubble ||
          !control
        ) {
          return;
        }
        const id = this.bubbleId(index);
        if (bubble.id !== id) {
          bubble.id = id;
        }
        control.setAttribute(
          "aria-describedby",
          id,
        );
      },
    );
  }

  componentDidMount() {
    this.syncDescribedBy();
  }

  componentWillReceiveProps() {
    queueMicrotask(
      () => this.syncDescribedBy(),
    );
  }

  render() {
    const {
      tooltip,
      color,
      width,
    } = this.props;
    const background = color
      ? theme.tone(color)
      : "var(--janus-text)";

    return this.childElements.filter(
      (child) => child.nodeType === 1,
    ).map(
      (child, index) => html`
        <span
          style=${{
            position: "relative",
            display: "inline-block",
            ":hover .janus-tooltip-bubble": revealed,
            ":focus-within .janus-tooltip-bubble": revealed,
          }}
        >
          ${child}
          <span
            id=${this.bubbleId(index)}
            role="tooltip"
            class="janus-tooltip-bubble"
            style=${{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: "20",
              width: width
                ? `${width}px`
                : "max-content",
              maxWidth: "240px",
              padding: "4px 8px",
              borderRadius: "var(--janus-radius)",
              backgroundColor: background,
              color: "var(--janus-bg)",
              fontSize: "0.8125rem",
              lineHeight: "1.4",
              textAlign: "center",
              boxShadow: "var(--janus-shadow)",
              pointerEvents: "none",
              visibility: "hidden",
              opacity: "0",
              transition: "opacity 120ms",
              "::after": {
                content: "\"\"",
                position: "absolute",
                top: "100%",
                left: "50%",
                marginLeft: "-5px",
                borderWidth: "5px",
                borderStyle: "solid",
                borderColor: `${background} transparent transparent transparent`,
              },
            }}
          >${tooltipNodes(tooltip)}</span>
        </span>
      `,
    );
  }
}

Component.register(Tooltip);
