import Component, {
  html,
  camelToKebab,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";

/** Build a registered icon custom element for `${…}` interpolation. */
export const instantiateIcon = (Icon, props = {}) => {
  if (
    typeof Icon !== "function" ||
    !Icon.name
  ) {
    return "";
  }
  const elementName = `janus${camelToKebab(Icon.name)}`;
  if (
    typeof customElements === "undefined" ||
    !customElements.get(elementName)
  ) {
    throw Error(`Unknown component <${Icon.name}>: "${elementName}" is not registered`);
  }
  const element = document.createElement(elementName);
  element.props = props;
  element.childElements = [];
  return element;
};

const defaultIconSlotStyle = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: "0",
  lineHeight: "0",
};

/**
 * Icon in a slot, remounted when `animated` flips so the SVG reloads.
 */
export const animatedIconSlot = (Icon, {
  size,
  animated = false,
  style = defaultIconSlotStyle,
} = {}) => {
  if (typeof Icon !== "function") {
    return "";
  }
  const icon = instantiateIcon(
    Icon,
    {
      size,
      animated: Boolean(animated),
    },
  );
  if (!icon) {
    return "";
  }
  icon.janusKey = animated
    ? "icon-animated"
    : "icon-static";
  return html`
    <span style=${style}>${icon}</span>
  `;
};

/**
 * Mouse enter/leave handlers that toggle a boolean hover flag on `component.state`.
 */
export const iconHoverHandlers = (component, {
  disabled = false,
  stateKey = "iconHover",
} = {}) => ({
  onMouseEnter: () => {
    if (
      disabled ||
      component.state[stateKey]
    ) {
      return;
    }
    component.setState(
      {
        [stateKey]: true,
      },
    );
  },
  onMouseLeave: () => {
    if (!component.state[stateKey]) {
      return;
    }
    component.setState(
      {
        [stateKey]: false,
      },
    );
  },
});

const markupCache = new Map();

const loadMarkup = (url) => {
  if (!markupCache.has(url.href)) {
    markupCache.set(
      url.href,
      fetch(url).then(
        (response) => {
          if (!response.ok) {
            throw new Error(`Failed to load icon ${url.pathname}`);
          }
          return response.text();
        },
      ),
    );
  }
  return markupCache.get(url.href);
};

const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const iconFile = (fileBase, animated) => animated && !prefersReducedMotion()
  ? `${fileBase}-animated.svg`
  : `${fileBase}.svg`;

const createIcon = (className, fileBase) => {
  const IconClass = {
    [className]: class extends Component {

      resolveMarkup(props = this.props) {
        const file = iconFile(
          fileBase,
          props && props.animated,
        );
        if (file === this.pendingFile) {
          return;
        }
        this.pendingFile = file;
        const url = new URL(
          `./icons/${file}`,
          import.meta.url,
        );
        const requestId = this.requestId = (this.requestId || 0) + 1;
        loadMarkup(url).then(
          (markup) => {
            if (requestId !== this.requestId) {
              return;
            }
            this.setState(
              {
                markup,
                file,
              },
            );
          },
          () => {
            if (requestId !== this.requestId) {
              return;
            }
            this.pendingFile = undefined;
          },
        );
      }

      componentWillMount() {
        this.resolveMarkup();
      }

      componentWillReceiveProps(nextProps) {
        this.resolveMarkup(nextProps);
      }

      render() {
        const {
          markup,
        } = this.state;
        const props = this.props || {};
        const {
          size = 24,
          color,
        } = props;
        const ariaLabel = props["aria-label"];
        const labelled = Boolean(ariaLabel || props.title);
        const tone = color
          ? theme.tone(color)
          : "currentColor";
        const style = {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${size}px`,
          height: `${size}px`,
          color: tone,
          flexShrink: "0",
          lineHeight: "0",
        };

        const forwarded = util.forwardedProps(props);
        delete forwarded.animated;
        delete forwarded.color;
        delete forwarded.size;
        delete forwarded["aria-label"];
        delete forwarded.title;

        if (!markup) {
          return html`
            <span
              style=${style}
              aria-hidden=${labelled
                ? undefined
                : "true"}
              aria-label=${ariaLabel}
              title=${props.title}
              ${forwarded}
            />
          `;
        }

        const template = document.createElement("template");
        template.innerHTML = markup.trim();
        const svg = template.content.firstElementChild;
        svg.setAttribute(
          "width",
          String(size),
        );
        svg.setAttribute(
          "height",
          String(size),
        );
        svg.style.display = "block";
        if (labelled) {
          svg.removeAttribute("aria-hidden");
          svg.setAttribute(
            "role",
            "img",
          );
          if (ariaLabel) {
            svg.setAttribute(
              "aria-label",
              ariaLabel,
            );
          }
          if (props.title) {
            svg.setAttribute(
              "title",
              props.title,
            );
          }
        } else {
          svg.setAttribute(
            "aria-hidden",
            "true",
          );
          svg.removeAttribute("role");
        }

        return html`
          <span
            style=${style}
            ${forwarded}
          >${svg}</span>
        `;
      }
    },
  }[className];

  Component.register(IconClass);
  return IconClass;
};

export default createIcon;
