const escapeInlineText = (value) => String(value).replace(
  /([\\`*_[\]~])/g,
  "\\$1",
).replace(
  /<(?=[A-Za-z/!?])/g,
  "\\<",
).replace(
  /&(?=#?\w+;)/g,
  "\\&",
);

/** Escape a line's first character when the line would otherwise start a block. */
const escapeLineStart = (line) => {
  const ordered = line.match(/^\s*\d{1,9}(?=[.)](\s|$))/);
  if (ordered) {
    return `${ordered[0]}\\${line.slice(ordered[0].length)}`;
  }
  if (/^\s*(#{1,6}(\s|$)|[-+](\s|$)|>|=+\s*$|-+\s*$)/.test(line)) {
    const indent = line.match(/^\s*/)[0];
    return `${indent}\\${line.slice(indent.length)}`;
  }
  return line;
};

const escapeTableCell = (value) => String(value).replace(
  /\|/g,
  "\\|",
);

/** Delimiters must touch text, so edge whitespace moves outside the mark. */
const wrapMark = (inner, marker) => {
  const [
    ,
    lead,
    core,
    trail,
  ] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return core
    ? `${lead}${marker}${core}${marker}${trail}`
    : `${lead}${trail}`;
};

const serializeCode = (value) => {
  if (!value) {
    return "";
  }
  const runs = value.match(/`+/g) || [];
  const fence = "`".repeat(Math.max(
    0,
    ...runs.map(
      (run) => run.length,
    ),
  ) + 1);
  const spacedBothEnds = value.startsWith(" ") && value.endsWith(" ") && value.trim();
  const pad = value.startsWith("`") || value.endsWith("`") || spacedBothEnds
    ? " "
    : "";
  return `${fence}${pad}${value}${pad}${fence}`;
};

const hasBalancedParens = (url) => {
  let depth = 0;
  for (const char of url) {
    depth += char === "("
      ? 1
      : char === ")"
      ? -1
      : 0;
    if (depth < 0) {
      return false;
    }
  }
  return depth === 0;
};

const serializeTarget = (url, title) => {
  const spaced = String(url || "").replace(
    / /g,
    "%20",
  );
  const destination = hasBalancedParens(spaced)
    ? spaced
    : spaced.replace(
        /[()]/g,
        "\\$&",
      );
  const quoted = title
    ? ` "${String(title).replace(/["\\]/g, "\\$&")}"`
    : "";
  return `(${destination}${quoted})`;
};

const serializeInlines = (nodes = []) => {
  let result = "";
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        result += escapeInlineText(node.value);
        break;
      case "break":
        result += "  \n";
        break;
      case "strong":
        result += wrapMark(
          serializeInlines(node.children),
          "**",
        );
        break;
      case "emphasis":
        result += wrapMark(
          serializeInlines(node.children),
          "*",
        );
        break;
      case "delete":
        result += wrapMark(
          serializeInlines(node.children),
          "~~",
        );
        break;
      case "inlineCode":
        result += serializeCode(String(node.value));
        break;
      case "link":
        result += `[${serializeInlines(node.children)}]${serializeTarget(node.url, node.title)}`;
        break;
      case "image":
        result += `![${escapeInlineText(node.alt || "")}]${serializeTarget(node.url, node.title)}`;
        break;
      default:
        break;
    }
  }
  return result;
};

const serializeListItem = (item, marker, width) => {
  const pad = " ".repeat(width);
  const [
    first,
    ...rest
  ] = serializeBlocks(
    item.children,
    true,
  ).split("\n");
  const lines = rest.map(
    (line) => line
      ? `${pad}${line}`
      : "",
  );
  return [
    `${marker} ${first}`,
    ...lines,
  ].join("\n");
};

const serializeBlock = (block) => {
  switch (block.type) {
    case "paragraph":
      return serializeInlines(block.children).split("\n").map(escapeLineStart).join("\n");
    case "heading": {
      const level = Math.min(
        6,
        Math.max(
          1,
          block.level || 1,
        ),
      );
      return `${"#".repeat(level)} ${serializeInlines(block.children)}`;
    }
    case "thematicBreak":
      return "---";
    case "blockquote":
      return serializeBlocks(block.children).split("\n").map(
        (line) => `> ${line}`,
      ).join("\n");
    case "code": {
      const lang = block.lang || "";
      return `\`\`\`${lang}\n${block.value || ""}\n\`\`\``;
    }
    case "list": {
      let number = block.start || 1;
      return block.items.map(
        (item) => {
          if (
            item.checked === true ||
            item.checked === false
          ) {
            return serializeListItem(
              item,
              item.checked
                ? "- [x]"
                : "- [ ]",
              2,
            );
          }
          if (block.ordered) {
            const marker = `${number}.`;
            number += 1;
            return serializeListItem(
              item,
              marker,
              marker.length + 1,
            );
          }
          return serializeListItem(
            item,
            "-",
            2,
          );
        },
      ).join("\n");
    }
    case "table": {
      const cellText = (inlines) => escapeTableCell(serializeInlines(inlines));
      const header = block.header.map(cellText);
      const align = block.align || [];
      const divider = header.map(
        (_, index) => {
          const alignment = align[index];
          if (alignment === "center") {
            return ":---:";
          }
          if (alignment === "right") {
            return "---:";
          }
          if (alignment === "left") {
            return ":---";
          }
          return "---";
        },
      );
      const rows = (block.rows || []).map(
        (row) => `| ${row.map(cellText).join(" | ")} |`,
      );
      return [
        `| ${header.join(" | ")} |`,
        `| ${divider.join(" | ")} |`,
        ...rows,
      ].join("\n");
    }
    default:
      return null;
  }
};

/** Blocks are separated by blank lines, except a list nested tightly in an item. */
const serializeBlocks = (blocks = [], inListItem = false) => {
  let result = "";
  let first = true;
  for (const block of blocks) {
    const text = serializeBlock(block);
    if (text == null) {
      continue;
    }
    if (!first) {
      result += inListItem && block.type === "list"
        ? "\n"
        : "\n\n";
    }
    result += text;
    first = false;
  }
  return result;
};

/** Serialize a block AST to a Markdown string. */
export const serializeMarkdown = (blocks) => {
  if (
    !blocks ||
    !blocks.length
  ) {
    return "";
  }
  return serializeBlocks(blocks);
};

export {
  serializeInlines,
};
