import Component, {
  html,
} from "../index.js";

import util from "./util.js";

const baseStyle = {
  display: "inline-flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "0",
  padding: "0",
  boxSizing: "border-box",
};

const TOOLBAR_STACK_CSS = `
:where(.janus-toolbar) button,
:where(.janus-toolbar) a[href],
:where(.janus-toolbar) [data-janus-select-trigger],
:where(.janus-toolbar) [role="combobox"] {
  position: relative;
  z-index: 0;
}
:where(.janus-toolbar) button:focus,
:where(.janus-toolbar) button:focus-visible,
:where(.janus-toolbar) button[aria-pressed="true"],
:where(.janus-toolbar) a[href]:focus-visible,
:where(.janus-toolbar) [data-janus-select-trigger]:hover,
:where(.janus-toolbar) [data-janus-select-trigger]:focus-within,
:where(.janus-toolbar) [role="combobox"]:focus,
:where(.janus-toolbar) [role="combobox"]:focus-visible,
:where(.janus-toolbar) [role="combobox"][aria-expanded="true"] {
  z-index: 1;
}
`;

let toolbarStackInstalled = false;

const ensureToolbarStackCss = () => {
  if (
    toolbarStackInstalled ||
    typeof document === "undefined" ||
    !document.head
  ) {
    return;
  }
  toolbarStackInstalled = true;
  const style = document.createElement("style");
  style.id = "janus-toolbar-stack";
  style.textContent = TOOLBAR_STACK_CSS;
  document.head.append(style);
};

const setInline = (el, props) => {
  if (
    !el ||
    !el.style
  ) {
    return;
  }
  Object.entries(props).forEach(
    ([
      name,
      value,
    ]) => {
      if (value !== undefined) {
        el.style[name] = value;
      }
    },
  );
};

const surfacesForChild = (child, root) => {
  if (child.localName === "janus-select") {
    const trigger = child.querySelector("[data-janus-select-trigger]") || child.querySelector("[role=\"combobox\"]");
    const row = child.firstElementChild;
    return {
      flexItem: row || trigger,
      chrome: trigger || row,
    };
  }
  const focusable = itemForSubtree(
    child,
    root,
  );
  return {
    flexItem: focusable,
    chrome: focusable,
  };
};

const syncJoinedChrome = (root, vertical) => {
  const children = [
    ...root.children,
  ].filter(
    (child) => child.nodeType === 1,
  );
  children.forEach(
    (child, index) => {
      const {
        flexItem,
        chrome,
      } = surfacesForChild(
        child,
        root,
      );
      if (
        !flexItem &&
        !chrome
      ) {
        return;
      }
      const first = index === 0;
      const last = index === children.length - 1;
      const radius = {
        borderTopLeftRadius: "",
        borderTopRightRadius: "",
        borderBottomLeftRadius: "",
        borderBottomRightRadius: "",
      };
      if (vertical) {
        if (!first) {
          radius.borderTopLeftRadius = "0";
          radius.borderTopRightRadius = "0";
        }
        if (!last) {
          radius.borderBottomLeftRadius = "0";
          radius.borderBottomRightRadius = "0";
        }
      } else {
        if (!first) {
          radius.borderTopLeftRadius = "0";
          radius.borderBottomLeftRadius = "0";
        }
        if (!last) {
          radius.borderTopRightRadius = "0";
          radius.borderBottomRightRadius = "0";
        }
      }

      if (flexItem) {
        setInline(
          flexItem,
          {
            marginTop: vertical && !first
              ? "-1px"
              : "0",
            marginRight: "0",
            marginBottom: "0",
            marginLeft: !vertical && !first
              ? "-1px"
              : "0",
            position: "relative",
            alignSelf: "stretch",
            ...radius,
          },
        );
      }
      if (
        chrome &&
        chrome !== flexItem
      ) {
        setInline(
          chrome,
          {
            marginTop: "0",
            marginRight: "0",
            marginBottom: "0",
            marginLeft: "0",
            position: "relative",
            height: "100%",
            boxSizing: "border-box",
            ...radius,
          },
        );
      }
    },
  );
};

const isExcludedAncestor = (el, root) => {
  let node = el;
  while (
    node &&
    node !== root
  ) {
    if (
      node.hidden ||
      (
        node.hasAttribute &&
        node.hasAttribute("hidden")
      )
    ) {
      return true;
    }
    const role = node.getAttribute && node.getAttribute("role");
    if (
      role === "menu" ||
      role === "listbox"
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
};

const isTypingTarget = (target) => {
  if (
    !target ||
    target.nodeType !== 1
  ) {
    return false;
  }
  const tag = target.localName;
  if (
    tag === "input" ||
    tag === "textarea"
  ) {
    return true;
  }
  return target.isContentEditable;
};

const itemForSubtree = (subtree, root) => {
  if (
    !subtree ||
    subtree.nodeType !== 1
  ) {
    return null;
  }
  const combos = [];
  if (subtree.getAttribute("role") === "combobox") {
    combos.push(subtree);
  }
  combos.push(...subtree.querySelectorAll("[role=\"combobox\"]"));
  const combo = combos.find(
    (el) => !isExcludedAncestor(
      el,
      root,
    ),
  );
  if (combo) {
    return combo;
  }

  const selector = "button:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])";
  if (
    subtree.matches(selector) &&
    !isExcludedAncestor(
      subtree,
      root,
    ) &&
    !subtree.disabled
  ) {
    return subtree;
  }
  for (const el of subtree.querySelectorAll(selector)) {
    if (!isExcludedAncestor(
      el,
      root,
    )) {
      return el;
    }
  }
  return null;
};

const getToolbarItems = (root) => [
  ...root.children,
].map(
  (child) => itemForSubtree(
    child,
    root,
  ),
).filter(Boolean);

class Toolbar extends Component {

  constructor() {
    super();
    this._activeIndex = 0;
    this._onKeyDown = (event) => this.onKeyDown(event);
    this._onFocusIn = (event) => this.onFocusIn(event);
    this._syncSoon = () => {
      if (this._syncQueued) {
        return;
      }
      this._syncQueued = true;
      queueMicrotask(
        () => {
          this._syncQueued = false;
          this.syncRovingTabindex();
        },
      );
    };
  }

  toolbarRoot() {
    return this.querySelector("[role=\"toolbar\"]");
  }

  syncRovingTabindex() {
    const root = this.toolbarRoot();
    if (!root) {
      return;
    }
    const vertical = this.props.orientation === "vertical";
    syncJoinedChrome(
      root,
      vertical,
    );
    const items = getToolbarItems(root);
    if (!items.length) {
      this._activeIndex = 0;
      return;
    }
    const focusedIndex = items.findIndex(
      (el) => el === document.activeElement,
    );
    if (focusedIndex >= 0) {
      this._activeIndex = focusedIndex;
    } else if (this._activeIndex >= items.length) {
      this._activeIndex = 0;
    }
    items.forEach(
      (el, index) => {
        el.tabIndex = index === this._activeIndex
          ? 0
          : -1;
      },
    );
  }

  focusItem(items, index) {
    if (!items.length) {
      return;
    }
    const next = (index % items.length + items.length) % items.length;
    this._activeIndex = next;
    items.forEach(
      (el, i) => {
        el.tabIndex = i === next
          ? 0
          : -1;
      },
    );
    items[next].focus();
  }

  onFocusIn(event) {
    const root = this.toolbarRoot();
    if (
      !root ||
      !root.contains(event.target)
    ) {
      return;
    }
    this.syncRovingTabindex();
  }

  onKeyDown(event) {
    if (event.defaultPrevented) {
      return;
    }
    const root = this.toolbarRoot();
    if (
      !root ||
      !root.contains(event.target)
    ) {
      return;
    }
    if (isTypingTarget(event.target)) {
      return;
    }
    if (isExcludedAncestor(
      event.target,
      root,
    )) {
      return;
    }

    const orientation = this.props.orientation === "vertical"
      ? "vertical"
      : "horizontal";
    const prevKey = orientation === "vertical"
      ? "ArrowUp"
      : "ArrowLeft";
    const nextKey = orientation === "vertical"
      ? "ArrowDown"
      : "ArrowRight";
    const {
      key,
    } = event;
    if (
      key !== prevKey &&
      key !== nextKey &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }

    // Select owns Home/End (and vertical arrows) while its listbox is open.
    const expanded = event.target.getAttribute && event.target.getAttribute("aria-expanded") === "true";
    if (
      expanded &&
      (
        key === "Home" ||
        key === "End" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      )
    ) {
      return;
    }

    const items = getToolbarItems(root);
    if (!items.length) {
      return;
    }
    const current = items.findIndex(
      (el) => el === event.target || el.contains(event.target),
    );
    const index = current >= 0
      ? current
      : this._activeIndex;

    event.preventDefault();
    event.stopPropagation();
    if (key === "Home") {
      this.focusItem(
        items,
        0,
      );
      return;
    }
    if (key === "End") {
      this.focusItem(
        items,
        items.length - 1,
      );
      return;
    }
    if (key === nextKey) {
      this.focusItem(
        items,
        index + 1,
      );
      return;
    }
    this.focusItem(
      items,
      index - 1,
    );
  }

  componentDidMount() {
    ensureToolbarStackCss();
    const root = this.toolbarRoot();
    if (!root) {
      return;
    }
    root.addEventListener(
      "keydown",
      this._onKeyDown,
      true,
    );
    root.addEventListener(
      "focusin",
      this._onFocusIn,
    );
    this._observer = new MutationObserver(this._syncSoon);
    this._observer.observe(
      root,
      {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "disabled",
          "hidden",
        ],
      },
    );
    this.syncRovingTabindex();
  }

  componentWillReceiveProps() {
    this._syncSoon();
  }

  componentWillUnmount() {
    const root = this.toolbarRoot();
    if (root) {
      root.removeEventListener(
        "keydown",
        this._onKeyDown,
        true,
      );
      root.removeEventListener(
        "focusin",
        this._onFocusIn,
      );
    }
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  render() {
    const {
      label,
      orientation,
      class: className,
      className: classNameAlt,
    } = this.props;
    const vertical = orientation === "vertical";
    const style = util.expand(
      baseStyle,
      {
        flexDirection: vertical
          ? "column"
          : "row",
      },
    );
    const forwarded = Object.fromEntries(Object.entries(util.forwardedProps(this.props)).filter(
      ([
        name,
      ]) => name !== "label" && name !== "orientation" && name !== "class" && name !== "className",
    ));
    const classes = [
      "janus-toolbar",
      className,
      classNameAlt,
    ].filter(Boolean).join(" ");

    return html`
      <div
        role="toolbar"
        class=${classes}
        aria-label=${label}
        aria-orientation=${vertical
          ? "vertical"
          : undefined}
        style=${style}
        ${forwarded}
      >${this.childElements}</div>
    `;
  }
}

Component.register(Toolbar);
