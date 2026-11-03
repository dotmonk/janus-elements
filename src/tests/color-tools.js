// Injected with page.addInitScript; WCAG contrast helpers that read computed colors.
export const installColorTools = () => {
  const linearToSrgb = (value) => value <= 0.0031308
    ? 12.92 * value
    : 1.055 * value ** (1 / 2.4) - 0.055;
  const clamp = (value) => Math.min(
    Math.max(
      value,
      0,
    ),
    1,
  );

  const oklabToSrgb = (lightness, a, b) => {
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map(
      (channel) => clamp(linearToSrgb(channel)),
    );
  };

  const parseColor = (value) => {
    if (value === "transparent") {
      return [
        0,
        0,
        0,
        0,
      ];
    }
    const [
      ,
      space,
      body,
    ] = value.match(/^([a-z]+)\((.*)\)$/);
    const [
      channelText,
      alphaText,
    ] = body.split("/");
    const channels = channelText.replace(
      "srgb",
      "",
    ).split(/[\s,]+/).filter(Boolean);
    const number = (text, percentScale = 1) => text.endsWith("%")
      ? parseFloat(text) / 100 * percentScale
      : parseFloat(text);
    let alpha = alphaText
      ? number(alphaText.trim())
      : 1;
    if (
      space === "rgb" ||
      space === "rgba"
    ) {
      if (channels.length === 4) {
        alpha = number(channels.pop());
      }
      return [
        ...channels.map(
          (text) => number(
            text,
            255,
          ) / 255,
        ),
        alpha,
      ];
    }
    if (space === "color") {
      return [
        ...channels.map(
          (text) => number(text),
        ),
        alpha,
      ];
    }
    if (space === "oklab") {
      const [
        lightness,
        a,
        b,
      ] = channels;
      return [
        ...oklabToSrgb(
          number(lightness),
          number(
            a,
            0.4,
          ),
          number(
            b,
            0.4,
          ),
        ),
        alpha,
      ];
    }
    if (space === "oklch") {
      const [
        lightness,
        chroma,
        hue,
      ] = channels.map(
        (text) => number(text),
      );
      const radians = hue * Math.PI / 180;
      return [
        ...oklabToSrgb(
          lightness,
          chroma * Math.cos(radians),
          chroma * Math.sin(radians),
        ),
        alpha,
      ];
    }
    throw new Error(`Unsupported color: ${value}`);
  };

  const composite = (top, bottom) => [
    ...[
      0,
      1,
      2,
    ].map(
      (i) => top[i] * top[3] + bottom[i] * (1 - top[3]),
    ),
    1,
  ];

  const luminance = ([
    r,
    g,
    b,
  ]) => {
    const linear = (value) => value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };

  const contrast = (first, second) => {
    const [
      lighter,
      darker,
    ] = [
      luminance(first),
      luminance(second),
    ].sort(
      (a, b) => b - a,
    );
    return (lighter + 0.05) / (darker + 0.05);
  };

  const backgroundBehind = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const color = parseColor(getComputedStyle(node).backgroundColor);
      if (color[3] > 0) {
        layers.push(color);
      }
      if (color[3] >= 1) {
        break;
      }
    }
    const opaque = layers.length && layers[layers.length - 1][3] >= 1
      ? layers.pop()
      : [
          1,
          1,
          1,
          1,
        ];
    return layers.reverse().reduce(
      (result, layer) => composite(
        layer,
        result,
      ),
      opaque,
    );
  };

  const isExempt = (element) => {
    if (element.getClientRects().length === 0) {
      return true;
    }
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (
        style.visibility === "hidden" ||
        parseFloat(style.opacity) < 1 ||
        node.matches("[disabled], [aria-hidden='true']")
      ) {
        return true;
      }
    }
    return false;
  };

  const describe = (element) => `<${element.tagName.toLowerCase()}> "${(element.value || element.textContent).trim().slice(0, 40)}"`;

  const audit = () => {
    const violations = [];
    const textElements = [
      ...document.querySelectorAll("body *"),
    ].filter(
      (element) => ![
        "STYLE",
        "SCRIPT",
      ].includes(element.tagName) && ([
        ...element.childNodes,
      ].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
      ) || ([
        "INPUT",
        "TEXTAREA",
      ].includes(element.tagName) && ![
        "checkbox",
        "radio",
      ].includes(element.type) && element.value)),
    );
    textElements.forEach(
      (element) => {
        if (isExempt(element)) {
          return;
        }
        const style = getComputedStyle(element);
        const background = backgroundBehind(element);
        const foreground = composite(
          parseColor(style.color),
          background,
        );
        const size = parseFloat(style.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight) >= 700);
        const required = large
          ? 3
          : 4.5;
        const ratio = contrast(
          foreground,
          background,
        );
        if (ratio < required) {
          violations.push(`${describe(element)} text ${ratio.toFixed(2)}:1 < ${required}`);
        }
      },
    );
    document.querySelectorAll("input, textarea").forEach(
      (element) => {
        if (isExempt(element)) {
          return;
        }
        const border = composite(
          parseColor(getComputedStyle(element).borderTopColor),
          backgroundBehind(element.parentElement),
        );
        const ratio = contrast(
          border,
          backgroundBehind(element.parentElement),
        );
        if (ratio < 3) {
          violations.push(`${describe(element)} border ${ratio.toFixed(2)}:1 < 3`);
        }
      },
    );
    return violations;
  };

  window.colorTools = {
    parseColor,
    luminance,
    contrast,
    backgroundBehind,
    audit,
  };
};
