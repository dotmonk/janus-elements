/** Format JSON, SVG, and HTML without third-party deps. */

export function formatJson(source) {
  const value = JSON.parse(source);
  return `${JSON.stringify(value, null, 2)}\n`;
}

const VOID_HTML = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const PRESERVE_TAGS = new Set(["script", "style", "pre", "textarea", "code"]);

/**
 * Indent-based pretty-print for HTML/SVG. Preserves text inside
 * script/style/pre/textarea/code. Does not rewrite attribute quotes beyond
 * normalizing whitespace between tags.
 */
export function formatMarkup(source, { svg = false } = {}) {
  const tokens = tokenizeMarkup(source);
  const lines = [];
  let depth = 0;
  let preserveDepth = 0;
  let preserveBuf = "";

  const indent = () => INDENT.repeat(Math.max(0, depth));

  for (const token of tokens) {
    if (preserveDepth > 0) {
      if (token.type === "close" && PRESERVE_TAGS.has(token.name)) {
        preserveDepth -= 1;
        if (preserveDepth === 0) {
          const body = preserveBuf.replace(/^\n/, "").replace(/\n$/, "");
          if (body.length > 0) {
            // Trim per-line indent then re-apply a stable depth so reformat is
            // idempotent (raw preserve buffers otherwise accumulate padding).
            for (const line of body.split("\n")) {
              const trimmed = line.trimStart();
              lines.push(trimmed.length ? `${indent()}${INDENT}${trimmed}` : "");
            }
          }
          depth = Math.max(0, depth - 1);
          lines.push(`${indent()}</${token.name}>`);
          preserveBuf = "";
          continue;
        }
      }
      if (token.type === "open" && PRESERVE_TAGS.has(token.name) && !token.selfClosing) {
        preserveDepth += 1;
      }
      preserveBuf += token.raw;
      continue;
    }

    if (token.type === "text") {
      const text = token.raw.replace(/\s+/g, " ").trim();
      if (text) {
        lines.push(`${indent()}${text}`);
      }
      continue;
    }

    if (token.type === "comment" || token.type === "doctype" || token.type === "declaration") {
      lines.push(`${indent()}${token.raw.trim()}`);
      continue;
    }

    if (token.type === "open") {
      const attrs = formatAttributes(token.attrs, depth);
      if (token.selfClosing || VOID_HTML.has(token.name)) {
        if (attrs.multiline) {
          lines.push(`${indent()}<${token.name}`);
          lines.push(...attrs.lines);
          lines.push(`${indent()}/>`);
        } else {
          lines.push(
            `${indent()}<${token.name}${attrs.inline}${svg || token.raw.endsWith("/>") ? " />" : ">"}`,
          );
        }
        continue;
      }
      if (attrs.multiline) {
        lines.push(`${indent()}<${token.name}`);
        lines.push(...attrs.lines);
        lines.push(`${indent()}>`);
      } else {
        lines.push(`${indent()}<${token.name}${attrs.inline}>`);
      }
      if (PRESERVE_TAGS.has(token.name)) {
        preserveDepth = 1;
        preserveBuf = "";
      }
      depth += 1;
      continue;
    }

    if (token.type === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(`${indent()}</${token.name}>`);
    }
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

const INDENT = "  ";

function formatAttributes(attrs, depth) {
  if (attrs.length === 0) {
    return { inline: "", multiline: false, lines: [] };
  }
  if (attrs.length === 1 && attrs[0].raw.length < 60) {
    return { inline: ` ${attrs[0].raw}`, multiline: false, lines: [] };
  }
  const pad = INDENT.repeat(depth + 1);
  return {
    inline: "",
    multiline: true,
    lines: attrs.map((attr) => `${pad}${attr.raw}`),
  };
}

function tokenizeMarkup(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    if (source[index] !== "<") {
      const start = index;
      while (index < source.length && source[index] !== "<") {
        index += 1;
      }
      tokens.push({ type: "text", raw: source.slice(start, index) });
      continue;
    }
    if (source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      const stop = end === -1 ? source.length : end + 3;
      tokens.push({ type: "comment", raw: source.slice(index, stop) });
      index = stop;
      continue;
    }
    if (source.startsWith("<!", index)) {
      const end = source.indexOf(">", index + 2);
      const stop = end === -1 ? source.length : end + 1;
      const raw = source.slice(index, stop);
      tokens.push({
        type: raw.toLowerCase().startsWith("<!doctype") ? "doctype" : "declaration",
        raw,
      });
      index = stop;
      continue;
    }
    if (source.startsWith("</", index)) {
      const end = source.indexOf(">", index + 2);
      const stop = end === -1 ? source.length : end + 1;
      const raw = source.slice(index, stop);
      const name = raw.slice(2, -1).trim().split(/\s/)[0].toLowerCase();
      tokens.push({ type: "close", name, raw });
      index = stop;
      continue;
    }
    const end = findTagEnd(source, index + 1);
    const stop = end === -1 ? source.length : end + 1;
    const raw = source.slice(index, stop);
    const selfClosing = /\/\s*>$/.test(raw);
    const inner = raw.slice(1, selfClosing ? raw.lastIndexOf("/") : -1).trim();
    const nameMatch = /^[^\s/>]+/.exec(inner);
    const name = (nameMatch ? nameMatch[0] : "").toLowerCase();
    const attrSource = nameMatch ? inner.slice(nameMatch[0].length) : "";
    tokens.push({
      type: "open",
      name,
      raw,
      selfClosing,
      attrs: parseAttributes(attrSource),
    });
    index = stop;
  }
  return tokens;
}

function findTagEnd(source, from) {
  let quote = null;
  for (let index = from; index < source.length; index++) {
    const ch = source[index];
    if (quote) {
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ">") {
      return index;
    }
  }
  return -1;
}

function parseAttributes(source) {
  const attrs = [];
  let index = 0;
  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }
    if (index >= source.length) {
      break;
    }
    const start = index;
    while (index < source.length && /[^\s=]/.test(source[index])) {
      index += 1;
    }
    const name = source.slice(start, index);
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }
    if (source[index] === "=") {
      index += 1;
      while (index < source.length && /\s/.test(source[index])) {
        index += 1;
      }
      if (source[index] === '"' || source[index] === "'") {
        const quote = source[index];
        index += 1;
        while (index < source.length && source[index] !== quote) {
          index += 1;
        }
        if (source[index] === quote) {
          index += 1;
        }
      } else {
        while (index < source.length && !/\s/.test(source[index])) {
          index += 1;
        }
      }
    }
    const raw = source.slice(start, index).trim();
    if (raw) {
      attrs.push({ raw });
    }
  }
  return attrs;
}
