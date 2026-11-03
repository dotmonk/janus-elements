const themeDefinitions = [
  {
    id: "ocean",
    name: "Ocean",
    dark: {
      bg: "#0a1419",
      surface: "#122028",
      raised: "#1a2c36",
      border: "#2a4050",
      borderStrong: "#6a8fa3",
      text: "#e4eef3",
      textMuted: "#8aa3b0",
      accent: "#3ecfbf",
      success: "#4ccf8f",
      warning: "#f0a85a",
      error: "#ff7a7a",
      info: "#5eb8e8",
      focus: "#5eb8e8",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      radius: "8px",
    },
    light: {
      bg: "#eef5f7",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#c5d5dc",
      borderStrong: "#4a6b7a",
      text: "#0f1c24",
      textMuted: "#4a6570",
      accent: "#0b6e64",
      success: "#0f6b45",
      warning: "#8a4a00",
      error: "#a82028",
      info: "#0a5a8a",
      focus: "#0a5a8a",
      shadow: "0 8px 24px rgba(16, 40, 48, 0.12)",
      radius: "8px",
    },
  },
  {
    id: "forest",
    name: "Forest",
    dark: {
      bg: "#0c120e",
      surface: "#151c17",
      raised: "#1d2820",
      border: "#2e3d32",
      borderStrong: "#6f8575",
      text: "#e6efe8",
      textMuted: "#93a696",
      accent: "#6dcf7a",
      success: "#5ed98a",
      warning: "#e8b04a",
      error: "#f07870",
      info: "#7ab8a0",
      focus: "#6dcf7a",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.48)",
      radius: "6px",
    },
    light: {
      bg: "#f0f4f0",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#c8d4c9",
      borderStrong: "#4f6554",
      text: "#121a14",
      textMuted: "#4a5c4e",
      accent: "#1a6b2e",
      success: "#136a43",
      warning: "#8a5200",
      error: "#a82028",
      info: "#1a5c48",
      focus: "#1a6b2e",
      shadow: "0 8px 24px rgba(20, 40, 24, 0.12)",
      radius: "6px",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    dark: {
      bg: "#14100e",
      surface: "#1e1814",
      raised: "#2a201a",
      border: "#403428",
      borderStrong: "#8a7460",
      text: "#f3ebe4",
      textMuted: "#b09a88",
      accent: "#ff8a5c",
      success: "#7dcf7a",
      warning: "#f0b040",
      error: "#ff6b6b",
      info: "#7ab0e0",
      focus: "#ff8a5c",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      radius: "10px",
    },
    light: {
      bg: "#faf4ef",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#e0d0c4",
      borderStrong: "#7a5e4a",
      text: "#1c1410",
      textMuted: "#6a5244",
      accent: "#b83218",
      success: "#1a6b38",
      warning: "#8a4800",
      error: "#a81820",
      info: "#0a5280",
      focus: "#b83218",
      shadow: "0 8px 24px rgba(40, 24, 16, 0.12)",
      radius: "10px",
    },
  },
  {
    id: "violet",
    name: "Violet",
    dark: {
      bg: "#110e18",
      surface: "#1a1624",
      raised: "#241e32",
      border: "#3a3250",
      borderStrong: "#8a7aa8",
      text: "#eee8f6",
      textMuted: "#a898b8",
      accent: "#b794f6",
      success: "#5ed9a0",
      warning: "#f0a85a",
      error: "#f08090",
      info: "#8ab0f0",
      focus: "#b794f6",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      radius: "10px",
    },
    light: {
      bg: "#f5f2f8",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#d8d0e4",
      borderStrong: "#655878",
      text: "#16121e",
      textMuted: "#564a68",
      accent: "#6b2fb5",
      success: "#136a43",
      warning: "#914400",
      error: "#b3242a",
      info: "#3a4aaa",
      focus: "#6b2fb5",
      shadow: "0 8px 24px rgba(32, 24, 48, 0.12)",
      radius: "10px",
    },
  },
  {
    id: "rose",
    name: "Rose",
    dark: {
      bg: "#160e12",
      surface: "#20161a",
      raised: "#2c1e24",
      border: "#443038",
      borderStrong: "#a07888",
      text: "#f6e8ee",
      textMuted: "#b898a4",
      accent: "#f472b6",
      success: "#5ed98a",
      warning: "#f0b040",
      error: "#ff7080",
      info: "#90a8e8",
      focus: "#f472b6",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      radius: "12px",
    },
    light: {
      bg: "#faf2f5",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#e4cfd8",
      borderStrong: "#785060",
      text: "#1c1014",
      textMuted: "#6a4854",
      accent: "#a81a5c",
      success: "#136a43",
      warning: "#914400",
      error: "#b3242a",
      info: "#3a4aaa",
      focus: "#a81a5c",
      shadow: "0 8px 24px rgba(40, 16, 28, 0.12)",
      radius: "12px",
    },
  },
  {
    id: "slate",
    name: "Slate",
    dark: {
      bg: "#0d1117",
      surface: "#151b23",
      raised: "#1c2430",
      border: "#2d3744",
      borderStrong: "#748294",
      text: "#e6edf3",
      textMuted: "#8b9aab",
      accent: "#7eb8e8",
      success: "#4ccf8f",
      warning: "#e8a84a",
      error: "#f07070",
      info: "#7eb8e8",
      focus: "#7eb8e8",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
      radius: "4px",
    },
    light: {
      bg: "#f0f2f5",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#cfd5dc",
      borderStrong: "#5a6674",
      text: "#12171e",
      textMuted: "#4e5a68",
      accent: "#1a5a8a",
      success: "#136a43",
      warning: "#914400",
      error: "#b3242a",
      info: "#0a57a5",
      focus: "#0a57a5",
      shadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
      radius: "4px",
    },
  },
  {
    id: "sand",
    name: "Sand",
    dark: {
      bg: "#16140f",
      surface: "#201c16",
      raised: "#2a251c",
      border: "#403828",
      borderStrong: "#8a7c60",
      text: "#f2ebe0",
      textMuted: "#a89880",
      accent: "#d4a84a",
      success: "#7dcf7a",
      warning: "#e8a040",
      error: "#e87868",
      info: "#88b0c8",
      focus: "#d4a84a",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.48)",
      radius: "8px",
    },
    light: {
      bg: "#f7f3eb",
      surface: "#fffcf7",
      raised: "#ffffff",
      border: "#ddd2c0",
      borderStrong: "#6e6048",
      text: "#1a1610",
      textMuted: "#5c5040",
      accent: "#7a5208",
      success: "#1a6b38",
      warning: "#8a4800",
      error: "#a82020",
      info: "#1a5a78",
      focus: "#7a5208",
      shadow: "0 8px 24px rgba(40, 32, 16, 0.12)",
      radius: "8px",
    },
  },
  {
    id: "contrast",
    name: "Contrast",
    dark: {
      bg: "#000000",
      surface: "#0a0a0a",
      raised: "#141414",
      border: "#404040",
      borderStrong: "#b0b0b0",
      text: "#ffffff",
      textMuted: "#c0c0c0",
      accent: "#ffff00",
      success: "#00ff80",
      warning: "#ffaa00",
      error: "#ff4040",
      info: "#40c0ff",
      focus: "#ffff00",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
      radius: "2px",
    },
    light: {
      bg: "#ffffff",
      surface: "#ffffff",
      raised: "#f5f5f5",
      border: "#000000",
      borderStrong: "#000000",
      text: "#000000",
      textMuted: "#333333",
      accent: "#0000cc",
      success: "#006628",
      warning: "#8a4a00",
      error: "#cc0000",
      info: "#0033aa",
      focus: "#0000cc",
      shadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      radius: "2px",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    dark: {
      bg: "#080814",
      surface: "#10102a",
      raised: "#181838",
      border: "#2a2a50",
      borderStrong: "#7070a8",
      text: "#e8e8f8",
      textMuted: "#9898c0",
      accent: "#6080ff",
      success: "#50d090",
      warning: "#f0a040",
      error: "#f06080",
      info: "#70b0ff",
      focus: "#6080ff",
      shadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
      radius: "6px",
    },
    light: {
      bg: "#ececf6",
      surface: "#ffffff",
      raised: "#ffffff",
      border: "#c8c8dc",
      borderStrong: "#505078",
      text: "#101028",
      textMuted: "#484868",
      accent: "#2a3acc",
      success: "#136a43",
      warning: "#914400",
      error: "#b3242a",
      info: "#1a4aaa",
      focus: "#2a3acc",
      shadow: "0 8px 24px rgba(24, 24, 48, 0.14)",
      radius: "6px",
    },
  },
];

export const JANUS_FONT = "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";

export const COLOR_TOKEN_KEYS = [
  "bg",
  "surface",
  "raised",
  "border",
  "borderStrong",
  "text",
  "textMuted",
  "accent",
  "success",
  "warning",
  "error",
  "info",
  "focus",
];

export const TEXT_TOKEN_KEYS = [
  "shadow",
  "radius",
  "font",
];

export const tokenCssName = (key) => key === "borderStrong"
  ? "border-strong"
  : key === "textMuted"
  ? "text-muted"
  : key;

const defaultDark = {
  bg: "#0e1217",
  surface: "#161c23",
  raised: "#1e262f",
  border: "#2b343e",
  borderStrong: "#6c7a89",
  text: "#e7ebef",
  textMuted: "#9ba7b3",
  accent: "#e3b04b",
  success: "#4ccf8f",
  warning: "#f29b4b",
  error: "#ff7070",
  info: "#66b6ff",
  focus: "#66b6ff",
  shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
  radius: "6px",
  font: JANUS_FONT,
};

const defaultLight = {
  bg: "#f5f6f8",
  surface: "#ffffff",
  raised: "#ffffff",
  border: "#d5dbe1",
  borderStrong: "#758290",
  text: "#151b22",
  textMuted: "#56616d",
  accent: "#7c5308",
  success: "#136a43",
  warning: "#914400",
  error: "#b3242a",
  info: "#0a57a5",
  focus: "#0a57a5",
  shadow: "0 8px 24px rgba(16, 24, 40, 0.12)",
  radius: "6px",
  font: JANUS_FONT,
};

const withFont = (tokens) => ({
  ...tokens,
  font: tokens.font || JANUS_FONT,
});

export const clonePalettePair = (pair) => ({
  light: {
    ...withFont(pair.light),
  },
  dark: {
    ...withFont(pair.dark),
  },
});

const defaultPalettePair = () => clonePalettePair(
  {
    light: defaultLight,
    dark: defaultDark,
  },
);

const paletteById = new Map(
  [
    [
      "default",
      {
        light: defaultLight,
        dark: defaultDark,
      },
    ],
    ...themeDefinitions.map(
      (theme) => [
        theme.id,
        {
          light: withFont(theme.light),
          dark: withFont(theme.dark),
        },
      ],
    ),
  ],
);

const tokensToCss = (tokens, colorScheme) => `
  color-scheme: ${colorScheme};
  --janus-bg: ${tokens.bg};
  --janus-surface: ${tokens.surface};
  --janus-raised: ${tokens.raised};
  --janus-border: ${tokens.border};
  --janus-border-strong: ${tokens.borderStrong};
  --janus-text: ${tokens.text};
  --janus-text-muted: ${tokens.textMuted};
  --janus-accent: ${tokens.accent};
  --janus-success: ${tokens.success};
  --janus-warning: ${tokens.warning};
  --janus-error: ${tokens.error};
  --janus-info: ${tokens.info};
  --janus-focus: ${tokens.focus};
  --janus-shadow: ${tokens.shadow};
  --janus-radius: ${tokens.radius};
  --janus-font: ${tokens.font || JANUS_FONT};
`;

const darkCss = (tokens) => tokensToCss(
  tokens,
  "dark",
);
const lightCss = (tokens) => tokensToCss(
  tokens,
  "light",
);

const conditionalPaletteCss = (selectorSuffix, light, dark) => `
:root${selectorSuffix} {
  ${darkCss(dark)}
}

@media (prefers-color-scheme: light) {
  :root${selectorSuffix}:not([data-janus-theme="dark"]) {
    ${lightCss(light)}
  }
}

:root${selectorSuffix}[data-janus-theme="light"] {
  ${lightCss(light)}
}
`;

const themeStylesheet = themeDefinitions.map(
  (theme) => conditionalPaletteCss(
    `[data-janus-docs-theme="${theme.id}"]`,
    withFont(theme.light),
    withFont(theme.dark),
  ),
).join("\n");

let activeThemeId = "default";
let customTheme = defaultPalettePair();
const listeners = new Set();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const ensureCustomStyleElement = () => {
  if (typeof document === "undefined") {
    return null;
  }
  let style = document.querySelector("style[data-janus-docs-custom]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute(
      "data-janus-docs-custom",
      "",
    );
    document.head.appendChild(style);
  }
  return style;
};

const syncCustomStylesheet = () => {
  const style = ensureCustomStyleElement();
  if (!style) {
    return;
  }
  style.textContent = conditionalPaletteCss(
    "[data-janus-docs-theme=\"custom\"]",
    customTheme.light,
    customTheme.dark,
  );
};

export const getActiveDocsTheme = () => activeThemeId;

export const getCustomTheme = () => clonePalettePair(customTheme);

export const getThemePalettes = (themeId = activeThemeId) => {
  if (themeId === "custom") {
    return clonePalettePair(customTheme);
  }
  const pair = paletteById.get(themeId) || paletteById.get("default");
  return clonePalettePair(pair);
};

export const getThemeOptions = () => [
  {
    name: "Janus",
    value: "default",
    lightAccent: defaultLight.accent,
    darkAccent: defaultDark.accent,
  },
  ...themeDefinitions.map(
    (theme) => ({
      name: theme.name,
      value: theme.id,
      lightAccent: theme.light.accent,
      darkAccent: theme.dark.accent,
    }),
  ),
  {
    name: "Custom theme",
    value: "custom",
    lightAccent: customTheme.light.accent,
    darkAccent: customTheme.dark.accent,
  },
];

export const subscribeThemes = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const applyDocsTheme = (themeId) => {
  const id = themeId || "default";
  activeThemeId = id;
  if (typeof document !== "undefined") {
    if (id === "default") {
      delete document.documentElement.dataset.janusDocsTheme;
    } else {
      document.documentElement.dataset.janusDocsTheme = id;
    }
  }
  notify();
};

export const setCustomTheme = (pair, {
  activate = true,
} = {}) => {
  customTheme = clonePalettePair(pair);
  syncCustomStylesheet();
  if (activate) {
    applyDocsTheme("custom");
  } else {
    notify();
  }
};

export const updateCustomToken = (mode, key, value) => {
  customTheme = {
    light: {
      ...customTheme.light,
    },
    dark: {
      ...customTheme.dark,
    },
    [mode]: {
      ...customTheme[mode],
      [key]: value,
    },
  };
  syncCustomStylesheet();
  applyDocsTheme("custom");
};

export const resetCustomTheme = ({
  activate = true,
} = {}) => {
  setCustomTheme(
    defaultPalettePair(),
    {
      activate,
    },
  );
};

export const startCustomFromActive = () => {
  setCustomTheme(
    getThemePalettes(activeThemeId),
    {
      activate: true,
    },
  );
};

export const buildExportCss = (themeId = activeThemeId) => {
  const {
    light,
    dark,
  } = getThemePalettes(themeId);
  return `/* Janus Elements theme: ${themeId} */
${conditionalPaletteCss("", light, dark).trim()}
`;
};

export const downloadThemeCss = (themeId = activeThemeId) => {
  if (typeof document === "undefined") {
    return;
  }
  const id = themeId || activeThemeId;
  const css = buildExportCss(id);
  const blob = new Blob(
    [
      css,
    ],
    {
      type: "text/css",
    },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `janus-theme-${id === "default" ? "janus" : id}.css`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

let installed = false;

export const ensureDocsThemes = () => {
  if (
    installed ||
    typeof document === "undefined"
  ) {
    return;
  }
  const style = document.createElement("style");
  style.setAttribute(
    "data-janus-docs-themes",
    "",
  );
  style.textContent = themeStylesheet;
  document.head.appendChild(style);
  syncCustomStylesheet();
  installed = true;
};
