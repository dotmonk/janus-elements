import {
  camelToKebab,
} from "../index.js";
import {
  flattenChildren,
} from "./index.js";

const attributeTypes = [
  "string",
  "number",
];

const eventPropRegex = /^on([A-Z]{1}.*)/;

const svgNamespace = "http://www.w3.org/2000/svg";

const svgOnlyTags = new Set(
  [
    "svg",
    "g",
    "defs",
    "symbol",
    "use",
    "path",
    "circle",
    "ellipse",
    "line",
    "polygon",
    "polyline",
    "rect",
    "text",
    "tspan",
    "textPath",
    "clipPath",
    "mask",
    "pattern",
    "marker",
    "linearGradient",
    "radialGradient",
    "stop",
    "filter",
    "foreignObject",
    "image",
    "switch",
    "view",
    "desc",
    "metadata",
    "animate",
    "animateMotion",
    "animateTransform",
    "mpath",
    "set",
  ],
);

const isSvgTag = (tagName) => svgOnlyTags.has(tagName) || /^fe[A-Z]/.test(tagName);

/** Apply the value/checked IDL property from attributes (after options exist). */
export const syncControlProperty = (element, name) => {
  if (
    name === "value" &&
    "value" in element
  ) {
    element.value = element.getAttribute("value") ?? "";
  } else if (
    name === "checked" &&
    "checked" in element
  ) {
    element.checked = element.hasAttribute("checked");
  }
};

export const syncFormControlProperties = (element) => {
  if (!(element instanceof Element)) {
    return;
  }
  if (element.hasAttribute("value")) {
    syncControlProperty(
      element,
      "value",
    );
  }
  if (element.hasAttribute("checked")) {
    syncControlProperty(
      element,
      "checked",
    );
  }
};

const createStylesheet = (id) => {
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }
  const element = document.createElement("style");
  element.id = id;
  document.head.append(element);
  return element;
};

// Component `style` props go in the later sheet so they win at equal specificity.
const stylesheets = {
  base: null,
  override: null,
};

// Rules browsers reject via insertRule (e.g. some webkit pseudos) land here and
// are never soft-reclaimed — avoids textContent rewrites that kill CSS animations.
const legacyStylesheets = {
  base: null,
  override: null,
};

const ensureStyleSheets = () => {
  if (
    typeof document === "undefined" ||
    !document.head
  ) {
    return false;
  }
  if (!stylesheets.base) {
    stylesheets.base = createStylesheet("janus-styles");
    stylesheets.override = createStylesheet("janus-style-overrides");
    legacyStylesheets.base = createStylesheet("janus-styles-legacy");
    legacyStylesheets.override = createStylesheet("janus-style-overrides-legacy");
  }
  return true;
};

const placeholderSelector = ".janus-style-placeholder";
const classesByCss = new Map();
const entriesByClass = new Map();
const takenClasses = new Set();
let reclaimScheduled = false;

const hash = (text) => {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(
      value ^ text.charCodeAt(index),
      0x01000193,
    );
  }
  return (value >>> 0).toString(36);
};

const splitCssRules = (cssText) => {
  const rules = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < cssText.length; index += 1) {
    const character = cssText[index];
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        const rule = cssText.slice(
          start,
          index + 1,
        ).trim();
        if (rule) {
          rules.push(rule);
        }
        start = index + 1;
      }
    }
  }
  return rules;
};

const insertCssText = (sheetName, cssText) => {
  if (!ensureStyleSheets()) {
    return {
      legacy: true,
      cssRules: [],
    };
  }
  const sheet = stylesheets[sheetName].sheet;
  const rules = splitCssRules(cssText);
  const inserted = [];
  try {
    for (const rule of rules) {
      const index = sheet.insertRule(
        rule,
        sheet.cssRules.length,
      );
      inserted.push(sheet.cssRules[index]);
    }
    return {
      legacy: false,
      cssRules: inserted,
    };
  } catch {
    for (const rule of [
      ...inserted,
    ].reverse()) {
      const index = [
        ...sheet.cssRules,
      ].indexOf(rule);
      if (index >= 0) {
        sheet.deleteRule(index);
      }
    }
    legacyStylesheets[sheetName].append(`${cssText}\n`);
    return {
      legacy: true,
      cssRules: [],
    };
  }
};

const removeCssRules = (cssRules) => {
  for (const rule of [
    ...cssRules,
  ].reverse()) {
    const sheet = rule.parentStyleSheet;
    if (!sheet) {
      continue;
    }
    const index = [
      ...sheet.cssRules,
    ].indexOf(rule);
    if (index >= 0) {
      sheet.deleteRule(index);
    }
  }
};

const installEntry = (entry) => {
  if (
    entry.installed ||
    entry.legacy
  ) {
    return;
  }
  const {
    legacy,
    cssRules,
  } = insertCssText(
    entry.sheet,
    entry.cssText,
  );
  entry.legacy = legacy;
  entry.cssRules = cssRules;
  entry.installed = true;
};

const reclaimUnusedStyles = () => {
  reclaimScheduled = false;
  entriesByClass.forEach(
    (entry) => {
      if (
        entry.refs > 0 ||
        !entry.installed ||
        entry.legacy
      ) {
        return;
      }
      removeCssRules(entry.cssRules);
      entry.cssRules = [];
      entry.installed = false;
    },
  );
};

const scheduleReclaim = () => {
  if (!reclaimScheduled) {
    reclaimScheduled = true;
    queueMicrotask(reclaimUnusedStyles);
  }
};

const classForStyle = (style, sheet = "base") => {
  const css = createStyle(
    placeholderSelector,
    style,
  );
  const key = `${sheet}\n${css}`;
  if (classesByCss.has(key)) {
    const className = classesByCss.get(key);
    const existing = entriesByClass.get(className);
    if (existing) {
      installEntry(existing);
      return className;
    }
  }
  let className = `janus-${hash(key)}`;
  for (let suffix = 2; takenClasses.has(className); suffix += 1) {
    className = `janus-${hash(key)}-${suffix}`;
  }
  const cssText = css.replaceAll(
    placeholderSelector,
    `.${className}`,
  );
  const {
    legacy,
    cssRules,
  } = insertCssText(
    sheet,
    cssText,
  );
  takenClasses.add(className);
  classesByCss.set(
    key,
    className,
  );
  entriesByClass.set(
    className,
    {
      key,
      sheet,
      cssText,
      refs: 0,
      legacy,
      cssRules,
      installed: true,
    },
  );
  return className;
};

const styleClassTokens = (classAttribute) => classAttribute
  ? classAttribute.split(/\s+/).filter(Boolean)
  : [];

export const retainStyleClasses = (classAttribute) => {
  new Set(styleClassTokens(classAttribute)).forEach(
    (className) => {
      const entry = entriesByClass.get(className);
      if (entry) {
        installEntry(entry);
        entry.refs += 1;
      }
    },
  );
};

export const releaseStyleClasses = (classAttribute) => {
  new Set(styleClassTokens(classAttribute)).forEach(
    (className) => {
      const entry = entriesByClass.get(className);
      if (!entry) {
        return;
      }
      entry.refs -= 1;
      if (entry.refs <= 0) {
        entry.refs = 0;
        scheduleReclaim();
      }
    },
  );
};

export const syncStyleClassRefs = (oldClassAttribute, newClassAttribute) => {
  if (oldClassAttribute === newClassAttribute) {
    return;
  }
  const oldTokens = new Set(styleClassTokens(oldClassAttribute));
  const newTokens = new Set(styleClassTokens(newClassAttribute));
  oldTokens.forEach(
    (className) => {
      if (!newTokens.has(className)) {
        releaseStyleClasses(className);
      }
    },
  );
  newTokens.forEach(
    (className) => {
      if (!oldTokens.has(className)) {
        retainStyleClasses(className);
      }
    },
  );
};

export const retainStyleClassesInTree = (root) => {
  if (
    !root ||
    root.nodeType !== Node.ELEMENT_NODE
  ) {
    return;
  }
  retainStyleClasses(root.getAttribute("class"));
  Array.from(root.children).forEach(retainStyleClassesInTree);
};

export const releaseStyleClassesInTree = (root) => {
  if (
    !root ||
    root.nodeType !== Node.ELEMENT_NODE
  ) {
    return;
  }
  releaseStyleClasses(root.getAttribute("class"));
  Array.from(root.children).forEach(releaseStyleClassesInTree);
};

const placeholderFor = (node) => {
  const placeholder = document.createComment("janus-placeholder");
  placeholder.janusNode = node;
  return placeholder;
};

export const setListener = (element, eventName, handler) => {
  if (!element.janusListeners) {
    element.janusListeners = {};
  }
  if (!(eventName in element.janusListeners)) {
    element.addEventListener(
      eventName,
      (event) => element.janusListeners[eventName] && element.janusListeners[eventName](event),
    );
  }
  element.janusListeners[eventName] = handler;
};

export const styleFirstElement = (nodes, style) => {
  if (
    typeof style !== "object" ||
    style === null
  ) {
    return nodes;
  }
  const root = flattenChildren(nodes).find(
    (node) => node.nodeType === Node.ELEMENT_NODE && node.tagName !== "STYLE" && !node.isConnected,
  );
  if (root) {
    root.classList.add(classForStyle(
      style,
      "override",
    ));
    root.janusAttributes?.add("class");
  }
  return nodes;
};

export const createStyle = (baseSelector, styleObject) => {
  let css = "";
  let moreCss = "";
  Object.keys(styleObject).forEach(
    (key) => {
      if (typeof styleObject[key] === "object") {
        moreCss = `${moreCss}\n${createStyle(`${baseSelector}${key.startsWith(":") || key.startsWith(">") ? "" : " "}${key}`, styleObject[key])}`;
      } else {
        css = `${css}${camelToKebab(key)}: ${styleObject[key]};`;
      }
    },
  );

  return `${baseSelector} {${css}}${moreCss}`;
};

export default (contents) => {
  return (values) => {
    const mapper = (part, namespace = null) => {
      const type = typeof part;
      if (type === "string") {
        //string constant
        return document.createTextNode(String(part));
      } else if (type === "object") {
        const element = part;
        let htmlElement;
        if (element.tagName.match(/^[A-Z]{1}/)) {
          //Janus Element
          const elementName = `janus${camelToKebab(element.tagName)}`;
          if (!customElements.get(elementName)) {
            throw Error(`Unknown component <${element.tagName}>: "${elementName}" is not registered`);
          }
          htmlElement = document.createElement(elementName);
        } else if (
          namespace ||
          isSvgTag(element.tagName)
        ) {
          htmlElement = document.createElementNS(
            svgNamespace,
            element.tagName,
          );
        } else {
          //HTML Element
          htmlElement = document.createElement(element.tagName);
        }
        const childNamespace = htmlElement.namespaceURI === svgNamespace && element.tagName !== "foreignObject"
          ? svgNamespace
          : null;
        const mapChild = (content) => mapper(
          content,
          childNamespace,
        );
        const staticProps = Object.fromEntries(Object.entries(element.props).map(
          ([
            propName,
            prop,
          ]) => [
            propName,
            typeof prop === "number"
              ? values[prop]
              : prop,
          ],
        ));
        const modifiedProps = element.propModifiers.reduce(
          (props, propModifier) => Object.assign(
            {},
            props,
            values[propModifier],
          ),
          staticProps,
        );
        htmlElement.props = Object.keys(modifiedProps).reduce(
          (props, propName) => {
            const value = modifiedProps[propName];
            const type = typeof value;

            if (propName === "key") {
              if (
                value !== undefined &&
                value !== null
              ) {
                htmlElement.janusKey = String(value);
              }
              return props;
            }

            const eventPropMatch = propName.match(eventPropRegex);
            const isEventHandlerProp = /^on/i.test(propName) && propName.toLowerCase() in htmlElement;

            if (
              eventPropMatch &&
              type === "function"
            ) {
              setListener(
                htmlElement,
                eventPropMatch[1].toLowerCase(),
                value,
              );
            } else if (
              isEventHandlerProp &&
              type !== "function" &&
              ![
                undefined,
                null,
                false,
              ].includes(value)
            ) {
              throw Error(`Event handler prop "${propName}" must be a function, got ${type}`);
            } else if (attributeTypes.includes(type)) {
              // Keep role/aria on component hosts out of the tree; components
              // forward them onto their real control (hosts are display:contents).
              const isComponent = typeof htmlElement.render === "function";
              const isAriaProp = propName === "role" || propName.startsWith("aria-");
              if (!(isComponent && isAriaProp)) {
                htmlElement.setAttribute(
                  propName,
                  value,
                );
              }
            } else if (
              type === "boolean" &&
              value
            ) {
              htmlElement.setAttribute(
                propName,
                "",
              );
            }

            props[propName] = value;
            return props;
          },
          {},
        );
        htmlElement.childElements = [];
        if (typeof htmlElement.render === "function") {
          element.contents.map(mapChild).forEach(
            (content) => {
              flattenChildren(content).forEach(
                (child) => {
                  htmlElement.childElements.push(child);
                },
              );
            },
          );
        } else {
          element.contents.map(mapChild).forEach(
            (content) => {
              flattenChildren(content).forEach(
                (child) => {
                  htmlElement.childElements.push(child);
                  const childType = typeof child;
                  if (childType === "object") {
                    htmlElement.appendChild(child.isConnected
                      ? placeholderFor(child)
                      : child);
                  } else {
                    htmlElement.appendChild(document.createTextNode(String(child)));
                  }
                },
              );
            },
          );
          syncFormControlProperties(htmlElement);
        }
        if (
          typeof htmlElement.props.style === "object" &&
          typeof htmlElement.render !== "function"
        ) {
          const styleClass = classForStyle(htmlElement.props.style);
          htmlElement.setAttribute(
            "class",
            htmlElement.props.class
              ? `${styleClass} ${htmlElement.props.class}`
              : styleClass,
          );
        }
        htmlElement.janusAttributes = new Set(htmlElement.getAttributeNames());
        return htmlElement;
      } else if (type === "number") {
        //variable input
        const value = values[part];
        const valueType = typeof value;
        if (attributeTypes.includes(valueType)) {
          return document.createTextNode(String(value));
        } else if (valueType === "object") {
          return value;
          //ignore undefined
        } else if (valueType !== "undefined") {
          throw Error(`Invalid type found in variable. Invalid type: "${valueType}"`);
        }
        return document.createTextNode("");
      }
      throw Error(`Invalid type found in template creation function. Invalid type: "${type}"`);
    };

    return contents.map(
      (part) => mapper(part),
    );
  };
};
