const font = "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";

const darkTokens = `
  color-scheme: dark;
  --janus-bg: #0e1217;
  --janus-surface: #161c23;
  --janus-raised: #1e262f;
  --janus-border: #2b343e;
  --janus-border-strong: #6c7a89;
  --janus-text: #e7ebef;
  --janus-text-muted: #9ba7b3;
  --janus-accent: #e3b04b;
  --janus-success: #4ccf8f;
  --janus-warning: #f29b4b;
  --janus-error: #ff7070;
  --janus-info: #66b6ff;
  --janus-focus: #66b6ff;
  --janus-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
`;

const lightTokens = `
  color-scheme: light;
  --janus-bg: #f5f6f8;
  --janus-surface: #ffffff;
  --janus-raised: #ffffff;
  --janus-border: #d5dbe1;
  --janus-border-strong: #758290;
  --janus-text: #151b22;
  --janus-text-muted: #56616d;
  --janus-accent: #7c5308;
  --janus-success: #136a43;
  --janus-warning: #914400;
  --janus-error: #b3242a;
  --janus-info: #0a57a5;
  --janus-focus: #0a57a5;
  --janus-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
`;

const tokenStylesheet = `
  :where(:root) {
    ${darkTokens}
    --janus-radius: 6px;
    --janus-font: ${font};
  }

  @media (prefers-color-scheme: light) {
    :where(:root:not([data-janus-theme="dark"])) {
      ${lightTokens}
    }
  }

  :where(:root[data-janus-theme="light"]) {
    ${lightTokens}
  }

  @keyframes janusSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes janusPulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.9);
    }
  }

  @keyframes janusSpinnerBars {
    0%,
    100% {
      transform: scaleY(0.4);
    }
    50% {
      transform: scaleY(1);
    }
  }

  @keyframes janusProgress {
    from {
      left: -40%;
    }
    to {
      left: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export const ensureThemeTokens = () => {
  if (
    typeof document === "undefined" ||
    !document.head
  ) {
    return;
  }
  if (document.getElementById("janus-theme-tokens")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "janus-theme-tokens";
  style.textContent = tokenStylesheet;
  document.head.prepend(style);
};

const toneNames = [
  "accent",
  "success",
  "warning",
  "error",
  "info",
];

const tone = (color) => {
  ensureThemeTokens();
  if (
    !color ||
    color === "standard"
  ) {
    return "var(--janus-text)";
  }
  return toneNames.includes(color)
    ? `var(--janus-${color})`
    : color;
};

const mix = (color, percent, base = "var(--janus-surface)") => {
  ensureThemeTokens();
  return `color-mix(in oklab, ${color} ${percent}%, ${base})`;
};

const field = (color) => {
  ensureThemeTokens();
  return {
    font: "inherit",
    fontWeight: "400",
    fontSize: "0.875rem",
    lineHeight: "1.4",
    padding: "6px 10px",
    margin: "2px",
    borderRadius: "var(--janus-radius)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color && color !== "standard"
      ? tone(color)
      : "var(--janus-border-strong)",
    backgroundColor: "var(--janus-surface)",
    color: "var(--janus-text)",
    ":focus": {
      outline: "none",
      borderColor: "var(--janus-focus)",
      boxShadow: `0 0 0 3px ${mix("var(--janus-focus)", 35, "transparent")}`,
    },
    ":disabled": {
      opacity: "0.5",
      cursor: "not-allowed",
    },
    "::placeholder": {
      color: "var(--janus-text-muted)",
    },
  };
};

const choiceLabel = (disabled) => {
  ensureThemeTokens();
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    margin: "4px 16px 4px 0",
    fontSize: "0.9375rem",
    color: "var(--janus-text)",
    cursor: disabled
      ? "not-allowed"
      : "pointer",
    opacity: disabled
      ? "0.5"
      : "1",
  };
};

const choiceControl = (controlTone) => {
  ensureThemeTokens();
  return {
    appearance: "none",
    flexShrink: "0",
    margin: "0",
    display: "inline-grid",
    placeContent: "center",
    width: "18px",
    height: "18px",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "var(--janus-border-strong)",
    backgroundColor: "var(--janus-surface)",
    cursor: "inherit",
    transition: "background-color 120ms, border-color 120ms",
    ":checked": {
      backgroundColor: controlTone,
      borderColor: controlTone,
    },
    "::before": {
      content: "\"\"",
      transform: "scale(0)",
      transition: "transform 120ms",
    },
    ":checked::before": {
      transform: "scale(1)",
    },
  };
};

let dismissButtonCache;

const dismissButton = () => {
  if (!dismissButtonCache) {
    ensureThemeTokens();
    dismissButtonCache = {
      flexShrink: "0",
      padding: "0 6px",
      borderWidth: "0",
      borderRadius: "var(--janus-radius)",
      backgroundColor: "transparent",
      color: "var(--janus-text-muted)",
      font: "inherit",
      fontSize: "1.25rem",
      lineHeight: "1.2",
      cursor: "pointer",
      ":hover": {
        color: "var(--janus-text)",
        backgroundColor: mix(
          "var(--janus-text)",
          10,
          "transparent",
        ),
      },
    };
  }
  return dismissButtonCache;
};

export default {
  tone,
  mix,
  field,
  choiceLabel,
  choiceControl,
  get dismissButton() {
    return dismissButton();
  },
  ensureThemeTokens,
};
