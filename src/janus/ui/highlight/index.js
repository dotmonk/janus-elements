import {
  resolveLanguageId,
  LANGUAGE_IDS,
} from "./aliases.js";
import {
  detectLanguage,
  resolveHighlightLanguage,
} from "./detect.js";
import {
  escapeHtml,
  highlightWithGrammar,
  matchBalanced,
  tokenize,
  tokensToHtml,
} from "./engine.js";
import {
  grammars,
} from "./grammars.js";
import {
  ensureHighlightStyles,
} from "./styles.js";

const HTML_INTERPOLATION_LANGUAGES = new Set(
  [
    "html",
  ],
);

/**
 * Extract balanced `${…}` regions so HTML tag matching is not broken by
 * unquoted Janus interpolations, then reinject highlighted JS.
 * @param {string} code
 */
const extractInterpolations = (code) => {
  const parts = [];
  let stripped = "";
  let index = 0;
  while (index < code.length) {
    if (
      code[index] === "$" &&
      code[index + 1] === "{"
    ) {
      const matched = matchBalanced(
        code,
        index,
        "${",
        "{",
        "}",
      );
      if (
        !matched ||
        matched.index !== index
      ) {
        stripped += code[index];
        index += 1;
        continue;
      }
      parts.push(matched.value);
      stripped += `__JANUS${parts.length - 1}__`;
      index = matched.index + matched.length;
    } else {
      stripped += code[index];
      index += 1;
    }
  }
  return {
    stripped,
    parts,
  };
};

const highlightHtmlWithInterpolations = (code) => {
  const {
    stripped,
    parts,
  } = extractInterpolations(String(code ?? ""));
  let highlighted = highlightWithGrammar(
    stripped,
    grammars.html,
  );
  parts.forEach(
    (expression, id) => {
      const inner = expression.slice(
        2,
        -1,
      );
      const highlightedInner = highlightWithGrammar(
        inner,
        grammars.javascript,
      );
      highlighted = highlighted.split(`__JANUS${id}__`).join(`<span class="token interpolation"><span class="token punctuation">${escapeHtml("${")}</span>${highlightedInner}<span class="token punctuation">}</span></span>`);
    },
  );
  return highlighted;
};

/**
 * Highlight source as HTML with `.token` spans.
 * @param {string} code
 * @param {string} [language]
 * @returns {string}
 */
export const highlight = (code, language) => {
  ensureHighlightStyles();
  const id = resolveLanguageId(language) || "plain";
  if (HTML_INTERPOLATION_LANGUAGES.has(id)) {
    return highlightHtmlWithInterpolations(code);
  }
  const grammar = grammars[id] || grammars.plain;
  if (!grammar.length) {
    return escapeHtml(code ?? "");
  }
  return highlightWithGrammar(
    code,
    grammar,
  );
};

export {
  LANGUAGE_IDS,
  detectLanguage,
  resolveHighlightLanguage,
  resolveLanguageId,
  escapeHtml,
  tokenize,
  tokensToHtml,
  ensureHighlightStyles,
  grammars,
};

export default highlight;
