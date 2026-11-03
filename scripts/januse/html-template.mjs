/** Pretty-print html`…` template contents (tags + ${} holes). */

const INDENT = "  ";

const VOID_TAGS = new Set([
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

const PRESERVE_TEXT_TAGS = new Set([
  "style",
  "script",
  "pre",
  "textarea",
]);

/**
 * @param {string[]} quasis
 * @param {object[]} expressions
 */
export function parseHtmlTemplate(quasis, expressions) {
  const root = {
    type: "fragment",
    children: [],
  };
  const stack = [root];
  let pendingAttr = null;

  const onAttrEquals = (attrName) => {
    pendingAttr = attrName;
  };

  for (let index = 0; index < quasis.length; index++) {
    parseChunkWithOpen(quasis[index], stack, onAttrEquals);
    if (index >= expressions.length) {
      continue;
    }
    if (pendingAttr) {
      const element = stack[stack.length - 1];
      if (element.type === "element") {
        element.attrs.push({
          name: pendingAttr,
          expr: index,
        });
        element.incomplete = true;
      } else {
        element.children.push({
          type: "expr",
          index,
        });
      }
      pendingAttr = null;
    } else {
      const top = stack[stack.length - 1];
      // `${bound}` / `${cond ? { disabled } : {}}` inside an open tag are
      // attribute spreads, not children.
      if (top?.type === "element" && top.incomplete) {
        top.attrs.push({
          spread: true,
          expr: index,
        });
      } else {
        top.children.push({
          type: "expr",
          index,
        });
      }
    }
  }

  return root;
}

function consumeIncompleteTagClose(chunk, stack) {
  const top = stack[stack.length - 1];
  if (!top || top.type !== "element" || !top.incomplete) {
    return chunk;
  }
  const match = /^(\s*)(\/>|>)/.exec(chunk);
  if (!match) {
    return chunk;
  }
  if (match[2] === "/>") {
    top.selfClosing = true;
    top.incomplete = false;
    stack.pop();
  } else {
    top.incomplete = false;
  }
  return chunk.slice(match[0].length);
}

/**
 * After `attr=${expr}`, the next quasi often continues with more attributes
 * (`\n  value=` / `\n  class="x"`) or closes the tag (`>` / `/>`). Parse those
 * onto the incomplete open element instead of treating them as text.
 */
function continueIncompleteOpenTag(chunk, stack, onAttrEquals) {
  const top = stack[stack.length - 1];
  if (!top || top.type !== "element" || !top.incomplete) {
    return chunk;
  }
  let index = 0;
  while (index < chunk.length) {
    while (index < chunk.length && /\s/.test(chunk[index])) {
      index += 1;
    }
    if (index >= chunk.length) {
      return "";
    }
    if (chunk.startsWith("/>", index)) {
      top.selfClosing = true;
      top.incomplete = false;
      stack.pop();
      return chunk.slice(index + 2);
    }
    if (chunk[index] === ">") {
      top.incomplete = false;
      return chunk.slice(index + 1);
    }
    if (chunk[index] === "<") {
      // Child content started without an explicit `>`; close the open tag.
      top.incomplete = false;
      return chunk.slice(index);
    }
    const nameStart = index;
    while (index < chunk.length && /[^\s=<>]/.test(chunk[index])) {
      index += 1;
    }
    const name = chunk.slice(nameStart, index);
    if (!name) {
      return chunk.slice(index);
    }
    while (index < chunk.length && /\s/.test(chunk[index])) {
      index += 1;
    }
    if (chunk[index] !== "=") {
      top.attrs.push({
        name,
        value: null,
        quote: null,
      });
      continue;
    }
    index += 1;
    while (index < chunk.length && /\s/.test(chunk[index])) {
      index += 1;
    }
    if (index >= chunk.length) {
      onAttrEquals(name);
      return "";
    }
    if (chunk[index] === '"' || chunk[index] === "'") {
      const quote = chunk[index];
      index += 1;
      const valueStart = index;
      while (index < chunk.length && chunk[index] !== quote) {
        index += 1;
      }
      top.attrs.push({
        name,
        value: chunk.slice(valueStart, index),
        quote,
      });
      if (chunk[index] === quote) {
        index += 1;
      }
      continue;
    }
    // Unquoted value or expression boundary (`attr=${` → quasi ends at `=`).
    const valueStart = index;
    while (index < chunk.length && !/[\s<>]/.test(chunk[index])) {
      index += 1;
    }
    if (valueStart === index) {
      onAttrEquals(name);
      return "";
    }
    top.attrs.push({
      name,
      value: chunk.slice(valueStart, index),
      quote: null,
    });
  }
  return "";
}

function parseChunkWithOpen(chunk, stack, onAttrEquals) {
  chunk = continueIncompleteOpenTag(chunk, stack, onAttrEquals);
  chunk = consumeIncompleteTagClose(chunk, stack);
  if (!chunk) {
    return;
  }
  if (unfinishedOpenTag(chunk)) {
    const lastLt = chunk.lastIndexOf("<");
    if (lastLt > 0) {
      parseChunk(chunk.slice(0, lastLt), stack, onAttrEquals);
      absorbLeadingOpenTag(chunk.slice(lastLt), stack, onAttrEquals);
      return;
    }
    if (lastLt === 0) {
      absorbLeadingOpenTag(chunk, stack, onAttrEquals);
      return;
    }
  }
  parseChunk(chunk, stack, onAttrEquals);
}

function unfinishedOpenTag(chunk) {
  return (
    /<[A-Za-z][\w.-]*\s[^<>]*[\w.:-]+=\s*$/.test(chunk) ||
    /<[A-Za-z][\w.-]*\s+[\w.:-]+=\s*$/.test(chunk)
  );
}

function absorbLeadingOpenTag(chunk, stack, onAttrEquals) {
  const withAttrs = /^(.*)<([A-Za-z][\w.-]*)(\s[\s\S]*)\s([\w.:-]+)=\s*$/.exec(chunk);
  const simple = withAttrs ? null : /^(.*)<([A-Za-z][\w.-]*)\s+([\w.:-]+)=\s*$/.exec(chunk);
  const match = withAttrs || simple;
  if (!match) {
    parseChunk(chunk, stack, onAttrEquals);
    return;
  }
  const before = match[1];
  const name = match[2];
  const attrName = withAttrs ? match[4] : match[3];
  const attrSource = withAttrs ? match[3] : "";
  if (before) {
    parseChunk(before, stack, onAttrEquals);
  }
  const {
    attrs,
  } = parseAttributes(attrSource);
  const element = {
    type: "element",
    name,
    attrs,
    children: [],
    selfClosing: false,
    incomplete: true,
  };
  stack[stack.length - 1].children.push(element);
  stack.push(element);
  onAttrEquals(attrName);
}

function parseChunk(chunk, stack, onAttrEquals) {
  let index = 0;
  while (index < chunk.length) {
    if (chunk[index] !== "<") {
      const start = index;
      while (index < chunk.length && chunk[index] !== "<") {
        index += 1;
      }
      const value = chunk.slice(start, index);
      if (value) {
        stack[stack.length - 1].children.push({
          type: "text",
          value,
        });
      }
      continue;
    }
    if (chunk.startsWith("<!--", index)) {
      const end = chunk.indexOf("-->", index + 4);
      const stop = end === -1 ? chunk.length : end + 3;
      stack[stack.length - 1].children.push({
        type: "comment",
        value: chunk.slice(index, stop),
      });
      index = stop;
      continue;
    }
    if (chunk.startsWith("</", index)) {
      const end = chunk.indexOf(">", index + 2);
      const stop = end === -1 ? chunk.length : end + 1;
      if (stack.length > 1) {
        stack.pop();
      }
      index = stop;
      continue;
    }
    const end = findTagEnd(chunk, index + 1);
    // No `>` in this quasi: the open tag continues across a following `${}`.
    if (end === -1) {
      const raw = chunk.slice(index);
      const inner = raw.slice(1).trim();
      const nameMatch = /^[^\s/>]+/.exec(inner);
      const name = nameMatch ? nameMatch[0] : "";
      const attrSource = nameMatch ? inner.slice(nameMatch[0].length) : "";
      const {
        attrs,
        danglingEquals,
      } = parseAttributes(attrSource);
      const element = {
        type: "element",
        name,
        attrs,
        children: [],
        selfClosing: false,
        incomplete: true,
      };
      stack[stack.length - 1].children.push(element);
      stack.push(element);
      if (danglingEquals) {
        onAttrEquals(danglingEquals);
      }
      index = chunk.length;
      continue;
    }
    const stop = end + 1;
    const raw = chunk.slice(index, stop);
    const selfClosing = /\/\s*>$/.test(raw);
    const inner = raw.slice(1, selfClosing ? raw.lastIndexOf("/") : -1).trim();
    const nameMatch = /^[^\s/>]+/.exec(inner);
    const name = nameMatch ? nameMatch[0] : "";
    const attrSource = nameMatch ? inner.slice(nameMatch[0].length) : "";
    const {
      attrs,
      danglingEquals,
    } = parseAttributes(attrSource);
    const element = {
      type: "element",
      name,
      attrs,
      children: [],
      selfClosing: selfClosing || VOID_TAGS.has(name.toLowerCase()),
    };
    stack[stack.length - 1].children.push(element);
    if (danglingEquals) {
      onAttrEquals(danglingEquals);
    }
    if (!element.selfClosing) {
      stack.push(element);
    }
    index = stop;
  }
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
  let danglingEquals = null;
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
      if (index >= source.length) {
        danglingEquals = name;
        break;
      }
      if (source[index] === '"' || source[index] === "'") {
        const quote = source[index];
        index += 1;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) {
          index += 1;
        }
        attrs.push({
          name,
          value: source.slice(valueStart, index),
          quote,
        });
        if (source[index] === quote) {
          index += 1;
        }
      } else {
        const valueStart = index;
        while (index < source.length && !/\s/.test(source[index])) {
          index += 1;
        }
        attrs.push({
          name,
          value: source.slice(valueStart, index),
          quote: null,
        });
      }
    } else if (name) {
      attrs.push({
        name,
        value: null,
        quote: null,
      });
    }
  }
  return {
    attrs,
    danglingEquals,
  };
}

/**
 * @param {object} tree
 * @param {object[]} expressions
 * @param {string} statementIndent
 * @param {{ printExpression: Function, needsMultiline: Function }} ctx
 */
export function printHtmlTemplate(tree, expressions, statementIndent, ctx) {
  const meaningful = significantChildren(tree.children);
  if (meaningful.length === 0) {
    return "";
  }
  if (
    meaningful.length === 1 &&
    meaningful[0].type === "expr" &&
    !ctx.needsMultiline(expressions[meaningful[0].index])
  ) {
    return `\${${ctx.printExpression(expressions[meaningful[0].index], statementIndent)}}`;
  }

  const base = statementIndent + INDENT;
  const body = printNodes(tree.children, base, expressions, ctx);
  return `\n${body}\n${statementIndent}`;
}

function significantChildren(children) {
  return children.filter((child) => child.type !== "text" || child.value.trim());
}

function printNodes(children, indent, expressions, ctx) {
  const lines = [];
  for (const child of significantChildren(children)) {
    if (child.type === "text") {
      const text = child.value.replace(/\s+/g, " ").trim();
      if (text) {
        lines.push(`${indent}${text}`);
      }
      continue;
    }
    if (child.type === "comment") {
      lines.push(`${indent}${child.value.trim()}`);
      continue;
    }
    if (child.type === "expr") {
      const printed = ctx.printExpression(expressions[child.index], indent);
      const exprLines = printed.split("\n");
      lines.push(`${indent}\${${exprLines[0]}`);
      for (let index = 1; index < exprLines.length; index++) {
        lines.push(exprLines[index]);
      }
      lines[lines.length - 1] = `${lines[lines.length - 1]}}`;
      continue;
    }
    if (child.type === "element") {
      lines.push(printElement(child, indent, expressions, ctx));
    }
  }
  return lines.join("\n");
}

function printAttrs(attrs, indent, expressions, ctx) {
  if (attrs.length === 0) {
    return {
      inline: "",
      lines: [],
    };
  }
  const rendered = attrs.map((attr) => {
    if (attr.spread) {
      const value = ctx.printExpression(expressions[attr.expr], indent + INDENT);
      return {
        text: `\${${value}}`,
        multiline: value.includes("\n"),
      };
    }
    if (attr.expr != null) {
      const value = ctx.printExpression(expressions[attr.expr], indent + INDENT);
      return {
        text: `${attr.name}=\${${value}}`,
        multiline: value.includes("\n"),
      };
    }
    if (attr.value == null) {
      return {
        text: attr.name,
        multiline: false,
      };
    }
    const quote = attr.quote || '"';
    return {
      text: `${attr.name}=${quote}${attr.value}${quote}`,
      multiline: false,
    };
  });

  // Several attributes (or any multiline value) → one attribute per line.
  if (rendered.some((item) => item.multiline) || rendered.length > 1) {
    const lines = [];
    for (const item of rendered) {
      if (item.multiline) {
        const parts = item.text.split("\n");
        lines.push(`${indent}${INDENT}${parts[0]}`);
        for (let index = 1; index < parts.length; index++) {
          lines.push(parts[index]);
        }
      } else {
        lines.push(`${indent}${INDENT}${item.text}`);
      }
    }
    return {
      inline: "",
      lines,
    };
  }

  return {
    inline: ` ${rendered.map((item) => item.text).join(" ")}`,
    lines: [],
  };
}

function printPreserveTextChildren(children, expressions, ctx, indent) {
  // Whitespace inside style/script/pre/textarea is significant — never invent
  // newlines or indent around children when reprinting these tags. If the only
  // real content is `${…}` / nested elements (formatter-injected indent around
  // them), drop whitespace-only text nodes so markup stays flush:
  // `<pre><code…></code></pre>`, `<textarea>${value}</textarea>`.
  const hasLiteralText = children.some(
    (child) => child.type === "text" && child.value.trim(),
  );
  return children
    .map((child) => {
      if (child.type === "text") {
        return hasLiteralText ? child.value : "";
      }
      if (child.type === "expr") {
        return `\${${ctx.printExpression(expressions[child.index], indent)}}`;
      }
      if (child.type === "comment") {
        return child.value;
      }
      if (child.type === "element") {
        // Nested tags (e.g. `<code>` in `<pre>`) must not inherit indent —
        // that indent would become visible text inside the preserve host.
        return printElement(child, "", expressions, ctx);
      }
      return "";
    })
    .join("");
}

function printElement(element, indent, expressions, ctx) {
  const children = significantChildren(element.children);
  const empty = children.length === 0;
  const breakContent = children.some(
    (child) => child.type === "element" || child.type === "expr",
  );
  const attrPart = printAttrs(element.attrs, indent, expressions, ctx);
  const preserveName = PRESERVE_TEXT_TAGS.has(element.name.toLowerCase());
  // Prefer `/>` for empty placeholders, but textarea/pre/style/script must
  // use a real close tag — HTML does not treat them as void.
  const emptyAsVoid = empty && !preserveName;

  if (attrPart.lines.length > 0) {
    const head = [
      `${indent}<${element.name}`,
      ...attrPart.lines,
    ];
    if (emptyAsVoid || (empty && element.selfClosing && !preserveName)) {
      head.push(`${indent}/>`);
      return head.join("\n");
    }
    if (empty) {
      return `${head.join("\n")}\n${indent}></${element.name}>`;
    }
    if (preserveName) {
      const raw = printPreserveTextChildren(
        element.children,
        expressions,
        ctx,
        indent + INDENT,
      );
      return `${head.join("\n")}\n${indent}>${raw}</${element.name}>`;
    }
    // Phrasing-only: keep `${name}: ${count}` flush after `>`.
    if (!children.some((child) => child.type === "element")) {
      const flow = printInlineFlowChildren(
        element.children,
        expressions,
        ctx,
        indent + INDENT,
      );
      return `${head.join("\n")}\n${indent}>${flow}</${element.name}>`;
    }
    head.push(`${indent}>`);
    const inner = printNodes(element.children, indent + INDENT, expressions, ctx);
    return `${head.join("\n")}\n${inner}\n${indent}</${element.name}>`;
  }

  if (emptyAsVoid) {
    return `${indent}<${element.name}${attrPart.inline} />`;
  }
  if (empty) {
    return `${indent}<${element.name}${attrPart.inline}></${element.name}>`;
  }

  if (preserveName) {
    const raw = printPreserveTextChildren(
      element.children,
      expressions,
      ctx,
      indent + INDENT,
    );
    return `${indent}<${element.name}${attrPart.inline}>${raw}</${element.name}>`;
  }

  if (!breakContent) {
    const text = children
      .map((child) => (child.type === "text" ? child.value.replace(/\s+/g, " ").trim() : ""))
      .join("");
    return `${indent}<${element.name}${attrPart.inline}>${text}</${element.name}>`;
  }

  // Phrasing-only bodies (`${name}: ${count}`) must stay on one line — inserting
  // newlines between text and `${}` changes the element's textContent.
  if (!children.some((child) => child.type === "element")) {
    const flow = printInlineFlowChildren(
      element.children,
      expressions,
      ctx,
      indent + INDENT,
    );
    return `${indent}<${element.name}${attrPart.inline}>${flow}</${element.name}>`;
  }

  const inner = printNodes(element.children, indent + INDENT, expressions, ctx);
  return `${indent}<${element.name}${attrPart.inline}>\n${inner}\n${indent}</${element.name}>`;
}

function printInlineFlowChildren(children, expressions, ctx, indent) {
  return significantChildren(children)
    .map((child) => {
      if (child.type === "text") {
        return child.value.replace(/\s+/g, " ");
      }
      if (child.type === "expr") {
        return `\${${ctx.printExpression(expressions[child.index], indent)}}`;
      }
      if (child.type === "comment") {
        return child.value.trim();
      }
      return "";
    })
    .join("")
    .replace(/^\s+|\s+$/g, "");
}
