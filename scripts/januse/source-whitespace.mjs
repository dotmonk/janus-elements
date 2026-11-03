/**
 * Extreme whitespace variants of JS/TS source for formatter round-trip tests.
 * Strings, templates, and comments are left intact.
 */

function scanString(source, start, quote) {
  let index = start + 1;
  while (index < source.length) {
    const ch = source[index];
    if (ch === "\\") {
      index += 2;
      continue;
    }
    if (ch === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

function scanTemplate(source, start) {
  let index = start + 1;
  while (index < source.length) {
    const ch = source[index];
    if (ch === "\\") {
      index += 2;
      continue;
    }
    if (ch === "`") {
      return index + 1;
    }
    if (
      ch === "$" &&
      source[index + 1] === "{"
    ) {
      index = scanBalanced(
        source,
        index + 2,
        "{",
        "}",
      );
      continue;
    }
    index += 1;
  }
  return source.length;
}

function scanLineComment(source, start) {
  let index = start + 2;
  while (
    index < source.length &&
    source[index] !== "\n"
  ) {
    index += 1;
  }
  return index;
}

function scanBlockComment(source, start) {
  let index = start + 2;
  while (index < source.length) {
    if (
      source[index] === "*" &&
      source[index + 1] === "/"
    ) {
      return index + 2;
    }
    index += 1;
  }
  return source.length;
}

function scanBalanced(source, start, open, close) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const ch = source[index];
    if (
      ch === "'" ||
      ch === "\""
    ) {
      index = scanString(
        source,
        index,
        ch,
      );
      continue;
    }
    if (ch === "`") {
      index = scanTemplate(
        source,
        index,
      );
      continue;
    }
    if (
      ch === "/" &&
      source[index + 1] === "/"
    ) {
      index = scanLineComment(
        source,
        index,
      );
      continue;
    }
    if (
      ch === "/" &&
      source[index + 1] === "*"
    ) {
      index = scanBlockComment(
        source,
        index,
      );
      continue;
    }
    if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return source.length;
}

function forEachCodeSpan(source, onCode, onLiteral) {
  let index = 0;
  while (index < source.length) {
    const ch = source[index];
    if (
      ch === "'" ||
      ch === "\""
    ) {
      const end = scanString(
        source,
        index,
        ch,
      );
      onLiteral(source.slice(
        index,
        end,
      ));
      index = end;
      continue;
    }
    if (ch === "`") {
      const end = scanTemplate(
        source,
        index,
      );
      onLiteral(source.slice(
        index,
        end,
      ));
      index = end;
      continue;
    }
    if (
      ch === "/" &&
      source[index + 1] === "/"
    ) {
      const end = scanLineComment(
        source,
        index,
      );
      onLiteral(source.slice(
        index,
        end,
      ));
      index = end;
      continue;
    }
    if (
      ch === "/" &&
      source[index + 1] === "*"
    ) {
      const end = scanBlockComment(
        source,
        index,
      );
      onLiteral(source.slice(
        index,
        end,
      ));
      index = end;
      continue;
    }
    const start = index;
    while (
      index < source.length &&
      source[index] !== "'" &&
      source[index] !== "\"" &&
      source[index] !== "`" &&
      !(source[index] === "/" && (source[index + 1] === "/" || source[index + 1] === "*"))
    ) {
      index += 1;
    }
    onCode(source.slice(
      start,
      index,
    ));
  }
}

/** Collapse a source file to a single line (spaces only where tokens would otherwise glue). */
export function toSingleLine(source) {
  let out = "";
  forEachCodeSpan(
    source,
    (code) => {
      const collapsed = code.replace(
        /\s+/g,
        " ",
      );
      out += collapsed;
    },
    (literal) => {
      out += literal.replace(
        /\n/g,
        " ",
      );
    },
  );
  return `${out.trim()}\n`;
}

/**
 * Spread a source onto many lines at safe boundaries (after `;`, `,`, `{`,
 * and before `}`). Starts from the single-line form so `return html` is not
 * broken by ASI, and avoids blank lines the printer would preserve.
 */
export function toMaximallySpaced(source) {
  const line = toSingleLine(source).replace(
    /\n+$/,
    "",
  );
  let out = "";
  forEachCodeSpan(
    line,
    (code) => {
      out += code.replace(
        /;/g,
        ";\n",
      ).replace(
        /,/g,
        ",\n",
      ).replace(
        /{/g,
        "{\n",
      ).replace(
        /}/g,
        "\n}",
      );
    },
    (literal) => {
      out += literal;
    },
  );
  return `${out.replace(/\n{2,}/g, "\n").trim()}\n`;
}

/** Drop preserved blank lines so compact/spaced format to one canonical shape. */
export function stripBlankLines(source) {
  return source.replace(
    /\n{2,}/g,
    "\n",
  );
}
