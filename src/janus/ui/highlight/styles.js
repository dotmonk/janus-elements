const highlightStylesheet = `
pre[class*="language-"],
code[class*="language-"] {
  color: var(--janus-text);
  background: none;
  font-family: var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 0.875rem;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  line-height: 1.5;
  tab-size: 2;
  hyphens: none;
}

/* Snippet chrome only — not the CodeEditor overlay. */
pre[class*="language-"]:not(.janus-code-highlight) {
  display: block;
  padding: 12px 14px;
  margin: 12px 0;
  overflow: auto;
  border-radius: var(--janus-radius);
  border: 1px solid var(--janus-border-strong);
  background: color-mix(in srgb, var(--janus-text) 6%, var(--janus-bg));
}

code[class*="language-"] {
  padding: 0;
  background: transparent;
}

/* Overlay must match the textarea metrics exactly. */
pre.janus-code-highlight {
  display: block;
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: inherit;
  overflow: auto;
  background: transparent;
  pointer-events: none;
  box-sizing: border-box;
}

pre.janus-code-highlight > code[class*="language-"] {
  display: block;
  margin: 0;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  box-sizing: border-box;
  font-family: var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  tab-size: 2;
  white-space: pre;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: var(--janus-text-muted);
}

.token.punctuation {
  color: var(--janus-text-muted);
}

.token.property,
.token.key,
.token.tag,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted,
.token.unit {
  color: var(--janus-info);
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: var(--janus-success);
}

.token.operator,
.token.entity,
.token.url {
  color: var(--janus-warning);
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: var(--janus-accent);
}

.token.function,
.token.class-name {
  color: var(--janus-error);
}

.token.regex,
.token.important,
.token.variable {
  color: var(--janus-warning);
}

.token.interpolation {
  color: var(--janus-text);
}

.token.interpolation > .token.punctuation {
  color: var(--janus-accent);
}

.language-bash .token.function,
.language-shell .token.function {
  color: var(--janus-success);
  font-weight: 600;
}

.token.important,
.token.bold {
  font-weight: 600;
}

.token.italic {
  font-style: italic;
}
`;

export const ensureHighlightStyles = () => {
  if (
    typeof document === "undefined" ||
    !document.head
  ) {
    return;
  }
  if (document.getElementById("janus-highlight-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "janus-highlight-styles";
  style.textContent = highlightStylesheet;
  document.head.appendChild(style);
};
