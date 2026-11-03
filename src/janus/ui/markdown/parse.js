import {
  safeUrl,
} from "./safeUrl.js";

const pushText = (children, value) => {
  if (!value) {
    return;
  }
  const last = children[children.length - 1];
  if (
    last &&
    last.type === "text"
  ) {
    last.value += value;
  } else {
    children.push(
      {
        type: "text",
        value,
      },
    );
  }
};

const isPunctuation = (char) => /^[!-/:-@[-`{-~]$/.test(char || "");
const isWordChar = (char) => /^[\p{L}\p{N}]$/u.test(char || "");
const unescape = (value) => value.replace(
  /\\([!-/:-@[-`{-~])/g,
  "$1",
);

/** Index of the next `]` that is not backslash-escaped, or -1. */
const closingBracket = (source, from) => {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
    } else if (source[index] === "]") {
      return index;
    }
  }
  return -1;
};

const closingBacktickRun = (source, from, length) => {
  const runs = /`+/g;
  runs.lastIndex = from;
  for (let run = runs.exec(source); run; run = runs.exec(source)) {
    if (run[0].length === length) {
      return run.index;
    }
  }
  return -1;
};

/** `_` delimiters may not close inside a word. */
const closingDelimiter = (source, marker, from) => {
  let end = source.indexOf(
    marker,
    from,
  );
  while (
    end !== -1 &&
    marker[0] === "_" &&
    isWordChar(source[end + marker.length])
  ) {
    end = source.indexOf(
      marker,
      end + 1,
    );
  }
  return end;
};

const EMPHASIS = [
  [
    "***",
    (children) => ({
      type: "strong",
      children: [
        {
          type: "emphasis",
          children,
        },
      ],
    }),
  ],
  [
    "___",
    (children) => ({
      type: "strong",
      children: [
        {
          type: "emphasis",
          children,
        },
      ],
    }),
  ],
  [
    "**",
    (children) => ({
      type: "strong",
      children,
    }),
  ],
  [
    "__",
    (children) => ({
      type: "strong",
      children,
    }),
  ],
  [
    "*",
    (children) => ({
      type: "emphasis",
      children,
    }),
  ],
  [
    "_",
    (children) => ({
      type: "emphasis",
      children,
    }),
  ],
];

/** Parse `(destination "title")` from the `(` at `open`; null when it is not one. */
const linkTarget = (source, open) => {
  let index = open + 1;
  const skipSpaces = () => {
    while (
      source[index] === " " ||
      source[index] === "\t"
    ) {
      index += 1;
    }
  };
  skipSpaces();
  let url = "";
  if (source[index] === "<") {
    const close = source.indexOf(
      ">",
      index,
    );
    if (close === -1) {
      return null;
    }
    url = source.slice(
      index + 1,
      close,
    );
    index = close + 1;
  } else {
    let depth = 0;
    while (index < source.length) {
      const char = source[index];
      if (
        char === "\\" &&
        isPunctuation(source[index + 1])
      ) {
        url += source[index + 1];
        index += 2;
        continue;
      }
      if (
        char === " " ||
        char === "\t" ||
        (
          char === ")" &&
          depth === 0
        )
      ) {
        break;
      }
      depth += char === "("
        ? 1
        : char === ")"
        ? -1
        : 0;
      url += char;
      index += 1;
    }
  }
  skipSpaces();
  let title = null;
  const closer = {
    "\"": "\"",
    "'": "'",
    "(": ")",
  }[source[index]];
  if (closer) {
    let close = index + 1;
    let value = "";
    while (
      close < source.length &&
      source[close] !== closer
    ) {
      if (
        source[close] === "\\" &&
        close + 1 < source.length
      ) {
        close += 1;
      }
      value += source[close];
      close += 1;
    }
    if (close >= source.length) {
      return null;
    }
    title = value;
    index = close + 1;
    skipSpaces();
  }
  if (source[index] !== ")") {
    return null;
  }
  return {
    url,
    title,
    end: index + 1,
  };
};

const withTitle = (node, title) => title == null
  ? node
  : {
      ...node,
      title,
    };

const parseInline = (source) => {
  const children = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (
      char === "\\" &&
      isPunctuation(source[index + 1])
    ) {
      pushText(
        children,
        source[index + 1],
      );
      index += 2;
      continue;
    }

    if (char === "`") {
      const run = source.slice(index).match(/^`+/)[0];
      const end = closingBacktickRun(
        source,
        index + run.length,
        run.length,
      );
      if (end === -1) {
        pushText(
          children,
          run,
        );
        index += run.length;
        continue;
      }
      let value = source.slice(
        index + run.length,
        end,
      );
      if (
        value.startsWith(" ") &&
        value.endsWith(" ") &&
        value.trim()
      ) {
        value = value.slice(
          1,
          -1,
        );
      }
      children.push(
        {
          type: "inlineCode",
          value,
        },
      );
      index = end + run.length;
      continue;
    }

    if (
      char === "!" &&
      source[index + 1] === "["
    ) {
      const altEnd = closingBracket(
        source,
        index + 2,
      );
      const target = altEnd !== -1 && source[altEnd + 1] === "("
        ? linkTarget(
            source,
            altEnd + 1,
          )
        : null;
      if (target) {
        const image = {
          type: "image",
          alt: unescape(source.slice(
            index + 2,
            altEnd,
          )),
          url: safeUrl(target.url),
        };
        children.push(withTitle(
          image,
          target.title,
        ));
        index = target.end;
        continue;
      }
    }

    if (char === "[") {
      const labelEnd = closingBracket(
        source,
        index + 1,
      );
      const target = labelEnd !== -1 && source[labelEnd + 1] === "("
        ? linkTarget(
            source,
            labelEnd + 1,
          )
        : null;
      if (target) {
        const link = {
          type: "link",
          url: safeUrl(target.url),
          children: parseInline(source.slice(
            index + 1,
            labelEnd,
          )),
        };
        children.push(withTitle(
          link,
          target.title,
        ));
        index = target.end;
        continue;
      }
    }

    if (source.startsWith(
      "~~",
      index,
    )) {
      const end = source.indexOf(
        "~~",
        index + 2,
      );
      if (end !== -1) {
        children.push(
          {
            type: "delete",
            children: parseInline(source.slice(
              index + 2,
              end,
            )),
          },
        );
        index = end + 2;
        continue;
      }
    }

    let emphasized = false;
    for (const [
      marker,
      build,
    ] of EMPHASIS) {
      if (!source.startsWith(
        marker,
        index,
      )) {
        continue;
      }
      if (
        marker[0] === "_" &&
        isWordChar(source[index - 1])
      ) {
        break;
      }
      const end = closingDelimiter(
        source,
        marker,
        index + marker.length,
      );
      if (end === -1) {
        continue;
      }
      children.push(build(parseInline(source.slice(
        index + marker.length,
        end,
      ))));
      index = end + marker.length;
      emphasized = true;
      break;
    }
    if (emphasized) {
      continue;
    }

    pushText(
      children,
      char,
    );
    index += 1;
  }

  return children;
};

const joinParagraphLines = (lines) => {
  const children = [];
  lines.forEach(
    (line, index) => {
      const hard = /  $/.test(line);
      const content = hard
        ? line.replace(
            / +$/,
            "",
          )
        : line;
      children.push(...parseInline(content));
      if (index < lines.length - 1) {
        if (hard) {
          children.push(
            {
              type: "break",
            },
          );
        } else {
          pushText(
            children,
            " ",
          );
        }
      }
    },
  );
  return children;
};

const isBlank = (line) => !line.trim();

const fenceMatch = (line) => {
  const match = line.match(/^(`{3,}|~{3,})(.*)$/);
  if (!match) {
    return null;
  }
  return {
    marker: match[1][0],
    length: match[1].length,
    info: match[2].trim(),
  };
};

/** GFM thematic break: three or more -, *, or _ (optionally spaced). */
const thematicBreakMatch = (line) => {
  if (!/^ {0,3}/.test(line)) {
    return false;
  }
  const body = line.replace(
    /^ {0,3}/,
    "",
  ).trimEnd();
  return /^(-[ \t]*){3,}$/.test(body) || /^(\*[ \t]*){3,}$/.test(body) || /^(_[ \t]*){3,}$/.test(body);
};

const headingMatch = (line) => {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) {
    return null;
  }
  return {
    level: match[1].length,
    text: match[2],
  };
};

/** Underline level of a setext heading (`===` → 1, `---` → 2), or 0. */
const setextLevel = (line) => {
  const match = line.match(/^ {0,3}(=+|-+)[ \t]*$/);
  if (!match) {
    return 0;
  }
  return match[1][0] === "="
    ? 1
    : 2;
};

const blockquotePrefix = (line) => {
  const match = line.match(/^>\s?(.*)$/);
  return match
    ? match[1]
    : null;
};

/** `contentIndent` is the column where item content starts after the marker. */
const listMatch = (line) => {
  const unordered = line.match(/^(\s*)([-*+])(\s+)(?:\[([ xX])\]\s+)?(.*)$/);
  if (unordered) {
    const checked = unordered[4] === undefined
      ? null
      : unordered[4].toLowerCase() === "x";
    return {
      indent: unordered[1].length,
      contentIndent: unordered[1].length + 1 + Math.min(
        unordered[3].length,
        4,
      ),
      ordered: false,
      checked,
      text: unordered[5],
    };
  }
  const ordered = line.match(/^(\s*)(\d+)[.)](\s+)(.*)$/);
  if (ordered) {
    return {
      indent: ordered[1].length,
      contentIndent: ordered[1].length + ordered[2].length + 1 + Math.min(
        ordered[3].length,
        4,
      ),
      ordered: true,
      start: Number(ordered[2]),
      checked: null,
      text: ordered[4],
    };
  }
  return null;
};

const splitTableRow = (line) => {
  let body = line.trim();
  if (body.startsWith("|")) {
    body = body.slice(1);
  }
  if (body.endsWith("|")) {
    body = body.slice(
      0,
      -1,
    );
  }
  const cells = [];
  let current = "";
  for (let index = 0; index < body.length; index += 1) {
    if (
      body[index] === "\\" &&
      body[index + 1] === "|"
    ) {
      current += "|";
      index += 1;
      continue;
    }
    if (body[index] === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += body[index];
  }
  cells.push(current.trim());
  return cells;
};

const isAlignmentRow = (line) => {
  const cells = splitTableRow(line);
  if (!cells.length) {
    return false;
  }
  return cells.every(
    (cell) => /^:?-{3,}:?$/.test(cell),
  );
};

const alignmentFromCell = (cell) => {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (
    left &&
    right
  ) {
    return "center";
  }
  if (right) {
    return "right";
  }
  if (left) {
    return "left";
  }
  return null;
};

const parseBlocks = (lines, start = 0, stopIndent = -1) => {
  const blocks = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];

    if (isBlank(line)) {
      index += 1;
      continue;
    }

    const indent = line.match(/^ */)[0].length;
    if (
      stopIndent >= 0 &&
      indent <= stopIndent &&
      listMatch(line)
    ) {
      break;
    }

    const fence = fenceMatch(line);
    if (fence) {
      const body = [];
      index += 1;
      while (index < lines.length) {
        const close = fenceMatch(lines[index]);
        if (
          close &&
          close.marker === fence.marker &&
          close.length >= fence.length
        ) {
          index += 1;
          break;
        }
        body.push(lines[index]);
        index += 1;
      }
      blocks.push(
        {
          type: "code",
          lang: fence.info || null,
          value: body.join("\n"),
        },
      );
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      isAlignmentRow(lines[index + 1])
    ) {
      const header = splitTableRow(line).map(
        (cell) => parseInline(cell),
      );
      const align = splitTableRow(lines[index + 1]).map(alignmentFromCell);
      const rows = [];
      index += 2;
      while (
        index < lines.length &&
        lines[index].includes("|") &&
        !isBlank(lines[index])
      ) {
        rows.push(splitTableRow(lines[index]).map(
          (cell) => parseInline(cell),
        ));
        index += 1;
      }
      blocks.push(
        {
          type: "table",
          header,
          align,
          rows,
        },
      );
      continue;
    }

    const heading = headingMatch(line);
    if (heading) {
      blocks.push(
        {
          type: "heading",
          level: heading.level,
          children: parseInline(heading.text),
        },
      );
      index += 1;
      continue;
    }

    if (thematicBreakMatch(line)) {
      blocks.push(
        {
          type: "thematicBreak",
        },
      );
      index += 1;
      continue;
    }

    if (blockquotePrefix(line) !== null) {
      const quoteLines = [];
      while (index < lines.length) {
        const inner = blockquotePrefix(lines[index]);
        if (inner === null) {
          break;
        }
        quoteLines.push(inner);
        index += 1;
      }
      blocks.push(
        {
          type: "blockquote",
          children: parseBlocks(quoteLines),
        },
      );
      continue;
    }

    const listItem = listMatch(line);
    if (listItem) {
      const ordered = listItem.ordered;
      const list = {
        type: "list",
        ordered,
        start: ordered
          ? listItem.start
          : undefined,
        items: [],
      };
      while (index < lines.length) {
        const item = listMatch(lines[index]);
        if (
          !item ||
          item.ordered !== ordered ||
          item.indent !== listItem.indent
        ) {
          break;
        }
        const itemLines = [
          item.text,
        ];
        index += 1;
        while (index < lines.length) {
          const next = lines[index];
          if (isBlank(next)) {
            if (
              index + 1 < lines.length &&
              listMatch(lines[index + 1]) &&
              listMatch(lines[index + 1]).indent === listItem.indent
            ) {
              break;
            }
            itemLines.push("");
            index += 1;
            continue;
          }
          const nextIndent = next.match(/^ */)[0].length;
          if (nextIndent > listItem.indent) {
            itemLines.push(next.slice(Math.min(
              nextIndent,
              item.contentIndent,
            )));
            index += 1;
            continue;
          }
          break;
        }
        list.items.push(
          {
            type: "listItem",
            checked: item.checked,
            children: parseBlocks(itemLines),
          },
        );
      }
      blocks.push(list);
      continue;
    }

    const paragraphLines = [];
    let underline = 0;
    while (index < lines.length) {
      const current = lines[index];
      if (isBlank(current)) {
        break;
      }
      underline = paragraphLines.length
        ? setextLevel(current)
        : 0;
      if (underline) {
        index += 1;
        break;
      }
      if (
        fenceMatch(current) ||
        headingMatch(current) ||
        thematicBreakMatch(current) ||
        blockquotePrefix(current) !== null ||
        listMatch(current) ||
        (
          current.includes("|") &&
          index + 1 < lines.length &&
          isAlignmentRow(lines[index + 1])
        )
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    const children = joinParagraphLines(paragraphLines);
    blocks.push(underline
      ? {
          type: "heading",
          level: underline,
          children,
        }
      : {
          type: "paragraph",
          children,
        });
  }

  return blocks;
};

/** Parse a Markdown string into a block AST. */
export const parseMarkdown = (source) => {
  const text = source == null
    ? ""
    : String(source).replace(
        /\r\n?/g,
        "\n",
      );
  if (!text.trim()) {
    return [];
  }
  return parseBlocks(text.split("\n"));
};
