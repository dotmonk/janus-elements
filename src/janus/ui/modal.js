import {
  html,
  render,
} from "../index.js";

import "./Button.js";
import "./Input.js";

/*
  options:
  - callback
  - title
  - escapable, on escape key or clicking backdrop (default true)
  - backdropStyle
  - color
  - message
 */
const dialogStyle = {
  minWidth: "320px",
  maxWidth: "480px",
  padding: "20px",
  borderRadius: "calc(var(--janus-radius) * 1.5)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--janus-border)",
  backgroundColor: "var(--janus-raised)",
  color: "var(--janus-text)",
  boxShadow: "var(--janus-shadow)",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(", ");

const BASE_Z_INDEX = 1000;

let layerSerial = 0;
const stack = [];
let keydownHandler = null;
let previousBodyOverflow = null;

const focusableIn = (root) => [
  ...root.querySelectorAll(focusableSelector),
].filter(
  (element) => element.offsetParent !== null || element === document.activeElement,
);

const topLayer = () => stack[stack.length - 1] || null;

const ensureStackRoot = () => {
  let root = document.querySelector("#janus-ui-modal");
  if (!root) {
    root = document.createElement("div");
    root.id = "janus-ui-modal";
    document.body.appendChild(root);
  }
  return root;
};

const removeStackRootIfEmpty = () => {
  const root = document.querySelector("#janus-ui-modal");
  if (
    root &&
    stack.length === 0
  ) {
    root.remove();
  }
};

const lockBodyScroll = () => {
  if (previousBodyOverflow !== null) {
    return;
  }
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
};

const unlockBodyScroll = () => {
  if (previousBodyOverflow === null) {
    return;
  }
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = null;
};

const bindKeydown = () => {
  if (keydownHandler) {
    return;
  }
  keydownHandler = (event) => {
    const layer = topLayer();
    if (
      !layer ||
      !document.body.contains(layer.container)
    ) {
      return;
    }
    if (event.key === "Escape") {
      if (layer.escapable) {
        event.preventDefault();
        modals.closeModal(layer.dismissCallback);
      }
      return;
    }
    if (
      event.key !== "Tab" ||
      !layer.panel
    ) {
      return;
    }
    const focusable = focusableIn(layer.panel);
    if (!focusable.length) {
      event.preventDefault();
      layer.panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener(
    "keydown",
    keydownHandler,
    true,
  );
};

const unbindKeydownIfIdle = () => {
  if (
    stack.length > 0 ||
    !keydownHandler
  ) {
    return;
  }
  document.removeEventListener(
    "keydown",
    keydownHandler,
    true,
  );
  keydownHandler = null;
};

const modals = {
  closeModal: (callback) => {
    const layer = stack.pop();
    if (!layer) {
      return;
    }
    layer.container.remove();
    removeStackRootIfEmpty();
    unbindKeydownIfIdle();
    if (stack.length === 0) {
      unlockBodyScroll();
    }
    if (callback) {
      callback();
    }
    const restore = layer.previousFocus;
    if (
      restore &&
      document.contains(restore) &&
      typeof restore.focus === "function"
    ) {
      restore.focus();
    }
  },
  confirm: (message, options = {}) => {
    const {
      callback,
    } = options;
    modals.dialog(
      html`
        <div>
          <div>${message}</div>
          <div style=${actionsStyle}>
            <Button
              onClick=${(event) => {
                callback(false);
                modals.closeModal();
                event.stopPropagation();
              }}
            >Cancel</Button>
            <Button
              color="accent"
              active=${true}
              onClick=${(event) => {
                callback(true);
                modals.closeModal();
                event.stopPropagation();
              }}
            >Confirm</Button>
          </div>
        </div>
      `,
      {
        ...options,
        callback: () => callback(false),
      },
    );
  },
  alert: (message, options = {}) => {
    const {
      callback: _callback,
    } = options;
    modals.dialog(
      html`
        <div>
          <div>${message}</div>
        </div>
      `,
      options,
    );
  },
  input: (message, options = {}) => {
    const {
      callback,
    } = options;
    modals.dialog(
      html`
        <div>
          <div
            style=${{
              marginBottom: "8px",
            }}
          >${message}</div>
          <Input />
          <div style=${actionsStyle}>
            <Button
              onClick=${(event) => {
                callback(false);
                modals.closeModal();
                event.stopPropagation();
              }}
            >Cancel</Button>
            <Button
              color="accent"
              active=${true}
              onClick=${(event) => {
                const layer = topLayer();
                const value = layer?.container.querySelector("input")?.value;
                callback(value);
                modals.closeModal();
                event.stopPropagation();
              }}
            >Confirm</Button>
          </div>
        </div>
      `,
      {
        ...options,
        callback: () => callback(false),
      },
    );
  },
  dialog: (components, options = {}) => {
    const {
      callback,
      title,
      escapable = true,
    } = options;
    layerSerial += 1;
    const titleId = title
      ? `janus-ui-modal-title-${layerSerial}`
      : undefined;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.zIndex = String(BASE_Z_INDEX + stack.length);

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const dismissCallback = callback;
    const dismiss = () => {
      if (!escapable) {
        return;
      }
      modals.closeModal(dismissCallback);
    };

    const layer = {
      container,
      panel: null,
      previousFocus,
      escapable,
      dismissCallback,
    };

    const elements = html`
      <div
        style=${{
          backgroundColor: "rgba(8, 11, 15, 0.6)",
          position: "fixed",
          inset: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick=${(event) => {
          dismiss();
          event.stopPropagation();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby=${titleId}
          tabindex="-1"
          style=${dialogStyle}
          onClick=${(event) => event.stopPropagation()}
        >${title
            ? html`
                <h2
                  id=${titleId}
                  style=${{
                    margin: "0 0 12px",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                  }}
                >${title}</h2>
              `
            : ""}${components}</div>
      </div>
    `;
    render(
      container,
      elements,
    );
    layer.panel = container.querySelector("[role=\"dialog\"]");

    const root = ensureStackRoot();
    root.appendChild(container);
    stack.push(layer);
    lockBodyScroll();
    bindKeydown();

    queueMicrotask(
      () => {
        if (
          !layer.panel ||
          !document.body.contains(layer.container)
        ) {
          return;
        }
        if (topLayer() !== layer) {
          return;
        }
        const focusable = focusableIn(layer.panel);
        (focusable[0] || layer.panel).focus();
      },
    );
  },
};

export default modals;
