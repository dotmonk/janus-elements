import {
  flattenChildren,
} from "./index.js";
import {
  setListener,
  retainStyleClassesInTree,
  releaseStyleClassesInTree,
  syncStyleClassRefs,
  syncControlProperty,
  syncFormControlProperties,
} from "./createTemplateFunction.js";

const isSameKind = (oldNode, newNode) => oldNode.nodeType === newNode.nodeType && oldNode.nodeName === newNode.nodeName;

const templateAttributes = (element) => element.janusAttributes || new Set(element.getAttributeNames());

const morphAttributes = (oldElement, newElement) => {
  const previousClass = oldElement.getAttribute("class");
  templateAttributes(oldElement).forEach(
    (name) => {
      if (!newElement.hasAttribute(name)) {
        oldElement.removeAttribute(name);
        syncControlProperty(
          oldElement,
          name,
        );
      }
    },
  );
  Array.from(newElement.attributes).forEach(
    ({
      name,
      value,
    }) => {
      if (oldElement.getAttribute(name) !== value) {
        oldElement.setAttribute(
          name,
          value,
        );
        syncControlProperty(
          oldElement,
          name,
        );
      }
    },
  );
  oldElement.janusAttributes = templateAttributes(newElement);
  syncStyleClassRefs(
    previousClass,
    oldElement.getAttribute("class"),
  );
};

const morphListeners = (oldElement, newElement) => {
  const oldListeners = oldElement.janusListeners || {};
  const newListeners = newElement.janusListeners || {};
  Object.keys(oldListeners).forEach(
    (eventName) => {
      if (!(eventName in newListeners)) {
        oldListeners[eventName] = undefined;
      }
    },
  );
  Object.keys(newListeners).forEach(
    (eventName) => setListener(
      oldElement,
      eventName,
      newListeners[eventName],
    ),
  );
};

const morphNode = (oldNode, newNode) => {
  if (oldNode.nodeType !== Node.ELEMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue;
    }
    return;
  }
  morphAttributes(
    oldNode,
    newNode,
  );
  morphListeners(
    oldNode,
    newNode,
  );
  if (typeof oldNode.receiveProps === "function") {
    oldNode.receiveProps(
      newNode.props,
      newNode.childElements,
    );
  } else {
    morphChildren(
      oldNode,
      Array.from(newNode.childNodes),
    );
    // Options (and similar) must exist before value/checked stick on a select.
    syncFormControlProperties(oldNode);
  }
};

const resolvePlaceholder = (node) => node.janusNode || node;

const resolvePlaceholdersWithin = (root) => {
  Array.from(root.childNodes).forEach(
    (child) => {
      if (child.janusNode) {
        root.replaceChild(
          child.janusNode,
          child,
        );
      } else {
        resolvePlaceholdersWithin(child);
      }
    },
  );
};

const isLive = (node, parent) => node.isConnected || node.parentNode === parent;

const matchOldNodes = (parent, newNodes) => {
  const oldNodes = Array.from(parent.childNodes);
  const oldIndexes = new Map(oldNodes.map(
    (node, index) => [
      node,
      index,
    ],
  ));
  const keyedOldNodes = new Map(oldNodes.filter(
    (node) => node.janusKey !== undefined,
  ).map(
    (node) => [
      node.janusKey,
      node,
    ],
  ));
  const used = new Set();
  let cursor = 0;

  const take = (oldNode) => {
    used.add(oldNode);
    cursor = oldIndexes.get(oldNode) + 1;
    return oldNode;
  };

  return newNodes.map(
    (newNode) => {
      if (isLive(
        newNode,
        parent,
      )) {
        if (newNode.parentNode === parent) {
          take(newNode);
        }
        return null;
      }
      if (newNode.janusKey !== undefined) {
        const oldNode = keyedOldNodes.get(newNode.janusKey);
        return oldNode && !used.has(oldNode) && isSameKind(
          oldNode,
          newNode,
        )
          ? take(oldNode)
          : null;
      }
      while (
        cursor < oldNodes.length &&
        used.has(oldNodes[cursor])
      ) {
        cursor += 1;
      }
      const oldNode = oldNodes[cursor];
      if (
        !oldNode ||
        oldNode.janusKey !== undefined
      ) {
        return null;
      }
      cursor += 1;
      if (!isSameKind(
        oldNode,
        newNode,
      )) {
        return null;
      }
      used.add(oldNode);
      return oldNode;
    },
  );
};

const morphChildren = (parent, newNodes) => {
  const resolvedNodes = newNodes.map(resolvePlaceholder);
  const matches = matchOldNodes(
    parent,
    resolvedNodes,
  );
  const kept = new Set(
    [
      ...matches,
      ...resolvedNodes.filter(
        (node) => node.parentNode === parent,
      ),
    ],
  );
  Array.from(parent.childNodes).forEach(
    (oldNode) => {
      if (!kept.has(oldNode)) {
        releaseStyleClassesInTree(oldNode);
        parent.removeChild(oldNode);
      }
    },
  );

  const finalNodes = resolvedNodes.map(
    (newNode, index) => {
      const oldNode = matches[index];
      if (oldNode) {
        morphNode(
          oldNode,
          newNode,
        );
        return oldNode;
      }
      if (!isLive(
        newNode,
        parent,
      )) {
        resolvePlaceholdersWithin(newNode);
        retainStyleClassesInTree(newNode);
      }
      return newNode;
    },
  );
  finalNodes.forEach(
    (node, index) => {
      if (parent.childNodes[index] !== node) {
        parent.insertBefore(
          node,
          parent.childNodes[index] || null,
        );
      }
    },
  );
};

export default (
  container, // HTMLElement,
  elements, // array of objects or single object
) => {
  morphChildren(
    container,
    flattenChildren(elements),
  );
};
