import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  highlight,
  resolveHighlightLanguage,
  ensureHighlightStyles,
} from "./highlight/index.js";

const monoFont = "var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)";

const sharedType = {
  fontFamily: monoFont,
  fontSize: "0.875rem",
  fontWeight: "400",
  lineHeight: "1.5",
  tabSize: "2",
  whiteSpace: "pre",
  wordWrap: "normal",
  overflowWrap: "normal",
  boxSizing: "border-box",
  margin: "0",
  border: "0",
  padding: "6px 10px",
};

class CodeEditor extends Component {

  emitChange(event) {
    event.stopPropagation();
    const value = event.target.value;
    const {
      onChange,
      language,
      filename,
    } = this.props || {};
    const resolved = resolveHighlightLanguage(
      {
        language,
        filename,
        content: value,
      },
    );
    const code = this.querySelector(".janus-code-highlight code");
    if (code) {
      code.innerHTML = `${highlight(value, resolved)}\n`;
    }
    this.emitLanguage(resolved);
    onChange && onChange(value);
  }

  syncScroll(event) {
    const layer = this.querySelector(".janus-code-highlight");
    if (!layer) {
      return;
    }
    layer.scrollTop = event.target.scrollTop;
    layer.scrollLeft = event.target.scrollLeft;
  }

  syncDom(resolved, source) {
    const code = this.querySelector(".janus-code-highlight code");
    const area = this.querySelector("textarea");
    if (code) {
      code.innerHTML = `${highlight(source, resolved)}\n`;
    }
    if (
      area &&
      area.value !== source
    ) {
      const focused = document.activeElement === area;
      const start = area.selectionStart;
      const end = area.selectionEnd;
      area.value = source;
      if (focused) {
        const max = area.value.length;
        area.setSelectionRange(
          Math.min(
            start,
            max,
          ),
          Math.min(
            end,
            max,
          ),
        );
      }
    }
  }

  emitLanguage(resolved) {
    if (this._resolvedLanguage === resolved) {
      return;
    }
    this._resolvedLanguage = resolved;
    const {
      onLanguageChange,
    } = this.props || {};
    onLanguageChange && onLanguageChange(resolved);
  }

  render() {
    ensureHighlightStyles();
    const {
      disabled,
      readOnly,
      color,
      value = "",
      name,
      placeholder,
      rows,
      language,
      filename,
    } = this.props || {};

    const source = value == null
      ? ""
      : String(value);
    const resolved = resolveHighlightLanguage(
      {
        language,
        filename,
        content: source,
      },
    );
    const minHeight = rows !== undefined && rows !== null
      ? `${Math.max(1, Number(rows)) * 1.5 + 0.75}em`
      : "9em";

    const baseField = theme.field(color);
    const {
      ":focus": _focus,
      ...fieldRest
    } = baseField;
    const fieldStyle = util.expand(
      fieldRest,
      {
        position: "relative",
        display: "block",
        padding: "0",
        margin: "2px",
        minHeight,
        overflow: "hidden",
        fontFamily: monoFont,
        ":focus-within": {
          outline: "none",
          borderColor: "var(--janus-focus)",
          boxShadow: `0 0 0 3px ${theme.mix("var(--janus-focus)", 35, "transparent")}`,
        },
      },
    );

    const areaStyle = util.expand(
      sharedType,
      {
        position: "relative",
        zIndex: "1",
        display: "block",
        width: "100%",
        height: "100%",
        minHeight,
        resize: "both",
        verticalAlign: "top",
        color: "transparent",
        caretColor: "var(--janus-text)",
        backgroundColor: "transparent",
        outline: "none",
        overflow: "auto",
        WebkitTextFillColor: "transparent",
      },
    );

    const bound = {};
    if (name) {
      bound.name = name;
    }
    if (placeholder) {
      bound.placeholder = placeholder;
    }
    if (readOnly) {
      bound.readOnly = "readonly";
    }

    this._syncGen = (this._syncGen || 0) + 1;
    const syncGen = this._syncGen;
    queueMicrotask(
      () => {
        if (syncGen !== this._syncGen) {
          return;
        }
        this.syncDom(
          resolved,
          source,
        );
        this.emitLanguage(resolved);
      },
    );

    return html`
      <div
        style=${fieldStyle}
        data-language=${resolved}
      >
        <pre
          class=${`janus-code-highlight language-${resolved}`}
          aria-hidden="true"
        ><code class=${`language-${resolved}`} /></pre>
        <textarea
          style=${areaStyle}
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          ${disabled
            ? {
                disabled: "disabled",
              }
            : {}}
          ${bound}
          onInput=${(event) => this.emitChange(event)}
          onScroll=${(event) => this.syncScroll(event)}
          onChange=${(event) => event.stopPropagation()}
        ></textarea>
      </div>
    `;
  }
}

Component.register(CodeEditor);
