import {
  html,
  render,
} from "../index.js";

import theme from "./theme.js";

let toasts = [];
let lastId = 0;

const region = () => {
  let element = document.getElementById("janus-ui-toasts");
  if (!element) {
    element = document.createElement("div");
    element.id = "janus-ui-toasts";
    element.setAttribute(
      "role",
      "status",
    );
    element.setAttribute(
      "aria-live",
      "polite",
    );
    Object.assign(
      element.style,
      {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: "1000",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px",
        maxWidth: "calc(100vw - 32px)",
      },
    );
    document.body.appendChild(element);
  }
  return element;
};

const toastStyle = (color) => {
  const tone = theme.tone(color);
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "240px",
    padding: "10px 12px",
    borderRadius: "var(--janus-radius)",
    borderWidth: "1px 1px 1px 4px",
    borderStyle: "solid",
    borderColor: "var(--janus-border)",
    borderLeftColor: color && color !== "standard"
      ? tone
      : "var(--janus-border)",
    backgroundColor: "var(--janus-raised)",
    boxShadow: "var(--janus-shadow)",
    color: "var(--janus-text)",
    fontSize: "0.9375rem",
  };
};

const update = () => {
  render(
    region(),
    toasts.map(
      (toast) => html`
        <div
          key=${toast.id}
          style=${toastStyle(toast.color)}
        >
          <span
            style=${{
              flexGrow: "1",
            }}
          >${toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            style=${theme.dismissButton}
            onClick=${() => close(toast.id)}
          >×</button>
        </div>
      `,
    ),
  );
};

const close = (id) => {
  toasts = toasts.filter(
    (toast) => toast.id !== id,
  );
  update();
};

const show = (message, {
  color = "standard",
  duration = 4000,
} = {}) => {
  lastId += 1;
  const id = lastId;
  toasts = [
    ...toasts,
    {
      id,
      message,
      color,
    },
  ];
  update();
  if (duration > 0) {
    setTimeout(
      () => close(id),
      duration,
    );
  }
  return () => close(id);
};

export default {
  show,
};
