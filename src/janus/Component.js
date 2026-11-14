import {
  render,
} from "./template/index.js";
import {
  styleFirstElement,
} from "./template/createTemplateFunction.js";

import {
  camelToKebab,
} from "./index.js";

const ElementBase = typeof HTMLElement === "undefined"
  ? class {}
  : HTMLElement;

class Component extends ElementBase {

  constructor() {
    super();
    this.state = {};
  }

  setState(newState) {
    this.componentWillReceiveProps && this.componentWillReceiveProps(
      this.props,
      newState,
    );
    this.state = Object.assign(
      {},
      this.state,
      newState,
    );
    render(
      this.shadowRoot || this,
      this.renderWithStyle(),
    );
  }

  connectedCallback() {
    this.componentWillMount && this.componentWillMount();
    render(
      this.shadowRoot || this,
      this.renderWithStyle(),
    );
    this.componentDidMount && this.componentDidMount();
  }

  receiveProps(props, childElements) {
    this.componentWillReceiveProps && this.componentWillReceiveProps(
      props,
      this.state,
    );
    this.props = props;
    this.childElements = childElements;
    render(
      this.shadowRoot || this,
      this.renderWithStyle(),
    );
  }

  disconnectedCallback() {
    this.componentWillUnmount && this.componentWillUnmount();
  }

  renderWithStyle() {
    return styleFirstElement(
      this.render(),
      this.props && this.props.style,
    );
  }

  adoptedCallback() {
    console.log("Component adopted, not seen this yet?");
  }
}

let layoutStylesheet;

const ensureLayoutStylesheet = () => {
  if (layoutStylesheet) {
    return layoutStylesheet;
  }
  if (
    typeof document === "undefined" ||
    !document.head
  ) {
    return null;
  }
  layoutStylesheet = document.getElementById("janus-components");
  if (!layoutStylesheet) {
    layoutStylesheet = document.createElement("style");
    layoutStylesheet.id = "janus-components";
    document.head.prepend(layoutStylesheet);
  }
  return layoutStylesheet;
};

const hotSwapRegistered = (elementName, Previous, Next) => {
  const nextProto = Next.prototype;
  const prevProto = Previous.prototype;
  for (const key of Object.getOwnPropertyNames(nextProto)) {
    if (key === "constructor") {
      continue;
    }
    Object.defineProperty(
      prevProto,
      key,
      Object.getOwnPropertyDescriptor(
        nextProto,
        key,
      ),
    );
  }
  for (const key of Object.getOwnPropertyNames(Next)) {
    if (
      key === "length" ||
      key === "prototype" ||
      key === "name"
    ) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(
      Next,
      key,
    );
    if (descriptor) {
      Object.defineProperty(
        Previous,
        key,
        descriptor,
      );
    }
  }
  if (typeof document === "undefined") {
    return;
  }
  document.querySelectorAll(elementName).forEach(
    (element) => {
      try {
        if (typeof element.renderWithStyle === "function") {
          render(
            element.shadowRoot || element,
            element.renderWithStyle(),
          );
        }
      } catch (error) {
        console.error(
          `[januse hmr] ${elementName}`,
          error,
        );
      }
    },
  );
};

Component.register = (classInstance, name = classInstance.name) => {
  if (typeof customElements === "undefined") {
    return;
  }
  const elementName = `janus${camelToKebab(name)}`;
  const existing = customElements.get(elementName);
  if (existing === classInstance) {
    return;
  }
  if (existing) {
    if (globalThis.__JANUSE_HMR_UPDATING__ > 0) {
      hotSwapRegistered(
        elementName,
        existing,
        classInstance,
      );
      return;
    }
    throw new Error(`Component.register: <${elementName}> is already registered by another class; pass a unique name as the second argument`);
  }
  customElements.define(
    elementName,
    classInstance,
  );
  const sheet = ensureLayoutStylesheet();
  if (sheet?.sheet) {
    sheet.sheet.insertRule(
      `:where(${elementName}) { display: contents; }`,
      sheet.sheet.cssRules.length,
    );
  }
};

export default Component;
