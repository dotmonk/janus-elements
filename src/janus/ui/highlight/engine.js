export const escapeHtml = (value) => String(value).replaceAll(
  "&",
  "&amp;",
).replaceAll(
  "<",
  "&lt;",
).replaceAll(
  ">",
  "&gt;",
).replaceAll(
  "\"",
  "&quot;",
);

const patternFlags = (pattern) => {
  let flags = pattern.flags.replaceAll(
    "g",
    "",
  );
  if (
    !flags.includes("y") &&
    !flags.includes("g")
  ) {
    flags += "g";
  }
  return flags;
};

/**
 * Find a balanced region starting at the next `prefix` at or after `from`.
 * Depth counts `open` / `close` characters (prefix may include the first open).
 * @param {string} text
 * @param {number} from
 * @param {string} prefix
 * @param {string} open
 * @param {string} close
 * @returns {{ index: number, length: number, value: string } | null}
 */
export const matchBalanced = (text, from, prefix, open, close) => {
  const start = text.indexOf(
    prefix,
    from,
  );
  if (start < 0) {
    return null;
  }
  let depth = 0;
  let index = start;
  for (let offset = 0; offset < prefix.length; offset += 1) {
    const char = prefix[offset];
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
    }
    index += 1;
  }
  while (
    index < text.length &&
    depth > 0
  ) {
    const char = text[index];
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
    }
    index += 1;
  }
  if (depth !== 0) {
    return null;
  }
  return {
    index: start,
    length: index - start,
    value: text.slice(
      start,
      index,
    ),
  };
};

/**
 * Match a JS/TS template literal starting at `from`, including nested
 * templates inside `${…}` interpolations.
 * @param {string} text
 * @param {number} from
 * @returns {{ index: number, length: number, value: string } | null}
 */
export const matchTemplateLiteral = (text, from) => {
  if (text[from] !== "`") {
    return null;
  }
  let index = from + 1;
  while (index < text.length) {
    const char = text[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "`") {
      return {
        index: from,
        length: index - from + 1,
        value: text.slice(
          from,
          index + 1,
        ),
      };
    }
    if (
      char === "$" &&
      text[index + 1] === "{"
    ) {
      index = skipInterpolation(
        text,
        index,
      );
      if (index < 0) {
        return null;
      }
      continue;
    }
    index += 1;
  }
  return null;
};

/** Skip `${…}` from `$`, returning the index after the closing `}`, or -1. */
const skipInterpolation = (text, from) => {
  let cursor = from + 2;
  let depth = 1;
  while (
    cursor < text.length &&
    depth > 0
  ) {
    const char = text[cursor];
    if (char === "\\") {
      cursor += 2;
      continue;
    }
    if (char === "`") {
      const nested = matchTemplateLiteral(
        text,
        cursor,
      );
      if (nested) {
        cursor = nested.index + nested.length;
        continue;
      }
    }
    if (
      char === "\"" ||
      char === "'"
    ) {
      cursor = skipQuoted(
        text,
        cursor,
        char,
      );
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }
    cursor += 1;
  }
  return depth === 0
    ? cursor
    : -1;
};

const skipQuoted = (text, from, quote) => {
  let index = from + 1;
  while (index < text.length) {
    if (text[index] === "\\") {
      index += 2;
      continue;
    }
    if (text[index] === quote) {
      return index + 1;
    }
    index += 1;
  }
  return text.length;
};

const resolveInside = (inside) => {
  if (typeof inside === "function") {
    return inside();
  }
  return inside;
};

const tryMatchRule = (rule, text, position) => {
  if (typeof rule.match === "function") {
    const matched = rule.match(
      text,
      position,
    );
    if (
      !matched ||
      matched.index < position ||
      matched.length === 0
    ) {
      return null;
    }
    return matched;
  }
  if (rule.balanced) {
    const {
      prefix,
      open,
      close,
    } = rule.balanced;
    const matched = matchBalanced(
      text,
      position,
      prefix,
      open,
      close,
    );
    if (
      !matched ||
      matched.index < position
    ) {
      return null;
    }
    return matched;
  }
  if (!rule.pattern) {
    return null;
  }
  const matcher = new RegExp(
    rule.pattern.source,
    patternFlags(rule.pattern),
  );
  matcher.lastIndex = position;
  const match = matcher.exec(text);
  if (
    !match ||
    match.index < position
  ) {
    return null;
  }
  return {
    index: match.index,
    length: match[0].length,
    value: match[0],
  };
};

/**
 * @typedef {{
 *   type: string,
 *   pattern?: RegExp,
 *   match?: (text: string, from: number) => { index: number, length: number, value: string } | null,
 *   balanced?: { prefix: string, open: string, close: string },
 *   delimiters?: { open: string, close: string },
 *   inside?: object[] | (() => object[]),
 *   alias?: string|string[]
 * }} HighlightRule
 * @param {string} text
 * @param {HighlightRule[]} grammar
 */
export const tokenize = (text, grammar) => {
  if (!text) {
    return [];
  }
  if (
    !grammar ||
    grammar.length === 0
  ) {
    return [
      text,
    ];
  }

  const tokens = [];
  let position = 0;

  while (position < text.length) {
    let best = null;

    for (const rule of grammar) {
      const matched = tryMatchRule(
        rule,
        text,
        position,
      );
      if (!matched) {
        continue;
      }
      if (
        best &&
        matched.index >= best.index
      ) {
        continue;
      }
      best = {
        index: matched.index,
        length: matched.length,
        value: matched.value,
        type: rule.type,
        inside: rule.inside,
        alias: rule.alias,
        delimiters: rule.delimiters,
      };
    }

    if (
      !best ||
      best.length === 0
    ) {
      tokens.push(text.slice(position));
      break;
    }

    if (best.index > position) {
      tokens.push(text.slice(
        position,
        best.index,
      ));
    }

    const insideGrammar = resolveInside(best.inside);
    let content;
    if (
      best.delimiters &&
      insideGrammar
    ) {
      const {
        open,
        close,
      } = best.delimiters;
      const inner = best.value.slice(
        open.length,
        best.value.length - close.length,
      );
      content = [
        {
          type: "punctuation",
          content: open,
        },
        ...tokenize(
          inner,
          insideGrammar,
        ),
        {
          type: "punctuation",
          content: close,
        },
      ];
    } else if (insideGrammar) {
      content = tokenize(
        best.value,
        insideGrammar,
      );
    } else {
      content = best.value;
    }

    tokens.push(
      {
        type: best.type,
        content,
        alias: best.alias,
      },
    );
    position = best.index + best.length;
  }

  return tokens;
};

const aliasList = (alias) => {
  if (!alias) {
    return [];
  }
  return Array.isArray(alias)
    ? alias
    : [
        alias,
      ];
};

export const tokensToHtml = (tokens) => tokens.map(
  (token) => {
    if (typeof token === "string") {
      return escapeHtml(token);
    }
    const classes = [
      "token",
      token.type,
      ...aliasList(token.alias),
    ].filter(Boolean).join(" ");
    const inner = Array.isArray(token.content)
      ? tokensToHtml(token.content)
      : escapeHtml(token.content);
    return `<span class="${classes}">${inner}</span>`;
  },
).join("");

export const highlightWithGrammar = (code, grammar) => tokensToHtml(tokenize(
  String(code ?? ""),
  grammar || [],
));
