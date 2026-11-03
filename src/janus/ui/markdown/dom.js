import {
  safeUrl,
} from "./safeUrl.js";
import {
  highlight,
} from "../highlight/index.js";

/** Show code as highlighted tokens; the trailing <br> keeps an empty last line visible. */
export const renderCode = (code, value) => {
  code.innerHTML = `${highlight(value, code.getAttribute("data-lang") || "plain")}<br>`;
};

/**
 * Task toggle control. A real `<input type="checkbox">` inside contenteditable
 * is unreliable across browsers; use a button with checkbox semantics instead.
 */
export const createTaskCheckbox = (doc, checked) => {
  const box = doc.createElement("button");
  box.type = "button";
  box.className = "janus-rich-task-box";
  box.setAttribute(
    "data-rich-task-box",
    "",
  );
  box.setAttribute(
    "role",
    "checkbox",
  );
  box.setAttribute(
    "aria-checked",
    checked
      ? "true"
      : "false",
  );
  box.setAttribute(
    "aria-label",
    "Task",
  );
  box.setAttribute(
    "contenteditable",
    "false",
  );
  box.tabIndex = -1;
  return box;
};

const appendInlines = (parent, nodes, doc) => {
  for (const node of nodes || []) {
    switch (node.type) {
      case "text":
        parent.appendChild(doc.createTextNode(node.value || ""));
        break;
      case "break":
        parent.appendChild(doc.createElement("br"));
        break;
      case "strong": {
        const el = doc.createElement("strong");
        appendInlines(
          el,
          node.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "emphasis": {
        const el = doc.createElement("em");
        appendInlines(
          el,
          node.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "delete": {
        const el = doc.createElement("del");
        appendInlines(
          el,
          node.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "inlineCode": {
        const el = doc.createElement("code");
        el.textContent = node.value || "";
        parent.appendChild(el);
        break;
      }
      case "link": {
        const el = doc.createElement("a");
        el.setAttribute(
          "href",
          safeUrl(node.url) || "#",
        );
        if (node.title != null) {
          el.setAttribute(
            "title",
            node.title,
          );
        }
        appendInlines(
          el,
          node.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "image": {
        const el = doc.createElement("img");
        el.setAttribute(
          "src",
          safeUrl(node.url) || "",
        );
        el.setAttribute(
          "alt",
          node.alt || "",
        );
        if (node.title != null) {
          el.setAttribute(
            "title",
            node.title,
          );
        }
        parent.appendChild(el);
        break;
      }
      default:
        break;
    }
  }
};

const appendBlocks = (parent, blocks, doc) => {
  for (const block of blocks || []) {
    switch (block.type) {
      case "paragraph": {
        const el = doc.createElement("p");
        appendInlines(
          el,
          block.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "heading": {
        const level = Math.min(
          6,
          Math.max(
            1,
            block.level || 1,
          ),
        );
        const el = doc.createElement(`h${level}`);
        appendInlines(
          el,
          block.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "thematicBreak": {
        parent.appendChild(doc.createElement("hr"));
        break;
      }
      case "blockquote": {
        const el = doc.createElement("blockquote");
        appendBlocks(
          el,
          block.children,
          doc,
        );
        parent.appendChild(el);
        break;
      }
      case "code": {
        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        if (block.lang) {
          code.setAttribute(
            "data-lang",
            block.lang,
          );
        }
        renderCode(
          code,
          block.value || "",
        );
        pre.appendChild(code);
        parent.appendChild(pre);
        break;
      }
      case "list": {
        const el = doc.createElement(block.ordered
          ? "ol"
          : "ul");
        if (
          block.ordered &&
          block.start &&
          block.start !== 1
        ) {
          el.setAttribute(
            "start",
            String(block.start),
          );
        }
        for (const item of block.items || []) {
          const li = doc.createElement("li");
          if (
            item.checked === true ||
            item.checked === false
          ) {
            li.setAttribute(
              "data-task",
              item.checked
                ? "checked"
                : "unchecked",
            );
            li.appendChild(createTaskCheckbox(
              doc,
              item.checked,
            ));
          }
          appendBlocks(
            li,
            item.children,
            doc,
          );
          el.appendChild(li);
        }
        parent.appendChild(el);
        break;
      }
      case "table": {
        const table = doc.createElement("table");
        const thead = doc.createElement("thead");
        const headRow = doc.createElement("tr");
        (block.header || []).forEach(
          (cell, index) => {
            const th = doc.createElement("th");
            if (
              block.align &&
              block.align[index]
            ) {
              th.setAttribute(
                "data-align",
                block.align[index],
              );
            }
            appendInlines(
              th,
              cell,
              doc,
            );
            headRow.appendChild(th);
          },
        );
        thead.appendChild(headRow);
        table.appendChild(thead);
        const tbody = doc.createElement("tbody");
        for (const row of block.rows || []) {
          const tr = doc.createElement("tr");
          row.forEach(
            (cell, index) => {
              const td = doc.createElement("td");
              if (
                block.align &&
                block.align[index]
              ) {
                td.setAttribute(
                  "data-align",
                  block.align[index],
                );
              }
              appendInlines(
                td,
                cell,
                doc,
              );
              tr.appendChild(td);
            },
          );
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        parent.appendChild(table);
        break;
      }
      default:
        break;
    }
  }
};

/** Render a block AST into a DocumentFragment. */
export const astToFragment = (blocks, doc = document) => {
  const fragment = doc.createDocumentFragment();
  appendBlocks(
    fragment,
    blocks,
    doc,
  );
  if (!fragment.childNodes.length) {
    fragment.appendChild(doc.createElement("p"));
  }
  return fragment;
};

const withTitle = (el, node) => el.hasAttribute("title")
  ? {
      ...node,
      title: el.getAttribute("title"),
    }
  : node;

/** Code block text; contenteditable inserts `<br>` or line `<div>`s for Enter. */
export const preText = (pre) => {
  let text = "";
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.nodeValue;
      } else if (child.nodeName === "BR") {
        text += "\n";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (
          /^(DIV|P)$/.test(child.nodeName) &&
          text &&
          !text.endsWith("\n")
        ) {
          text += "\n";
        }
        walk(child);
      }
    }
  };
  walk(pre);
  let last = pre;
  while (last.lastChild) {
    last = last.lastChild;
  }
  // A trailing <br> only holds the empty last line open.
  return last.nodeName === "BR"
    ? text.replace(
        /\n$/,
        "",
      )
    : text;
};

const readInlines = (node) => {
  const children = [];
  const walk = (current) => {
    for (const child of current.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue) {
          children.push(
            {
              type: "text",
              value: child.nodeValue,
            },
          );
        }
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const tag = child.tagName;
      if (tag === "BR") {
        children.push(
          {
            type: "break",
          },
        );
      } else if (
        tag === "STRONG" ||
        tag === "B"
      ) {
        children.push(
          {
            type: "strong",
            children: readInlines(child),
          },
        );
      } else if (
        tag === "EM" ||
        tag === "I"
      ) {
        children.push(
          {
            type: "emphasis",
            children: readInlines(child),
          },
        );
      } else if (
        tag === "DEL" ||
        tag === "S" ||
        tag === "STRIKE"
      ) {
        children.push(
          {
            type: "delete",
            children: readInlines(child),
          },
        );
      } else if (
        tag === "CODE" &&
        child.parentElement?.tagName !== "PRE"
      ) {
        children.push(
          {
            type: "inlineCode",
            value: child.textContent || "",
          },
        );
      } else if (tag === "A") {
        children.push(withTitle(
          child,
          {
            type: "link",
            url: safeUrl(child.getAttribute("href")),
            children: readInlines(child),
          },
        ));
      } else if (tag === "IMG") {
        children.push(withTitle(
          child,
          {
            type: "image",
            url: safeUrl(child.getAttribute("src")),
            alt: child.getAttribute("alt") || "",
          },
        ));
      } else if (child.hasAttribute("data-rich-task-box")) {
        continue;
      } else {
        walk(child);
      }
    }
  };
  walk(node);
  return children;
};

const BLOCK_TAG = /^(P|DIV|H[1-6]|HR|BLOCKQUOTE|PRE|UL|OL|TABLE)$/;

const trimTrailingBreaks = (inlines) => {
  const trimmed = [
    ...inlines,
  ];
  while (
    trimmed.length &&
    trimmed[trimmed.length - 1].type === "break"
  ) {
    trimmed.pop();
  }
  return trimmed;
};

const breaksAsSpaces = (inlines) => inlines.map(
  (node) => {
    if (node.type === "break") {
      return {
        type: "text",
        value: " ",
      };
    }
    return node.children
      ? {
          ...node,
          children: breaksAsSpaces(node.children),
        }
      : node;
  },
);

/** A table row is one line, so a break inside a cell reads as a space. */
const readCell = (cell) => breaksAsSpaces(trimTrailingBreaks(readInlines(cell)));

const isBlankInlines = (inlines) => inlines.every(
  (node) => node.type === "break" || (node.type === "text" && !node.value.trim()),
);

const readBlocks = (container) => {
  const blocks = [];
  let inlineRun = [];

  const pushParagraph = (nodes) => {
    const children = trimTrailingBreaks(readInlines(
      {
        childNodes: nodes,
      },
    ));
    if (!isBlankInlines(children)) {
      blocks.push(
        {
          type: "paragraph",
          children,
        },
      );
    }
  };

  const flushInlineRun = () => {
    if (inlineRun.length) {
      pushParagraph(inlineRun);
      inlineRun = [];
    }
  };

  for (const child of container.childNodes) {
    const isBlock = child.nodeType === Node.ELEMENT_NODE && BLOCK_TAG.test(child.tagName);
    if (!isBlock) {
      inlineRun.push(child);
      continue;
    }
    flushInlineRun();
    const tag = child.tagName;
    if (
      tag === "P" ||
      tag === "DIV"
    ) {
      pushParagraph(
        [
          ...child.childNodes,
        ],
      );
    } else if (/^H[1-6]$/.test(tag)) {
      blocks.push(
        {
          type: "heading",
          level: Number(tag[1]),
          children: trimTrailingBreaks(readInlines(child)),
        },
      );
    } else if (tag === "HR") {
      blocks.push(
        {
          type: "thematicBreak",
        },
      );
    } else if (tag === "BLOCKQUOTE") {
      blocks.push(
        {
          type: "blockquote",
          children: readBlocks(child),
        },
      );
    } else if (tag === "PRE") {
      const code = child.querySelector("code");
      blocks.push(
        {
          type: "code",
          lang: code?.getAttribute("data-lang") || null,
          value: preText(code || child),
        },
      );
    } else if (
      tag === "UL" ||
      tag === "OL"
    ) {
      const items = [];
      for (const li of child.children) {
        if (li.tagName !== "LI") {
          continue;
        }
        const checked = li.hasAttribute("data-task")
          ? li.getAttribute("data-task") === "checked"
          : null;
        const nested = readBlocks(li);
        const children = nested.length
          ? nested
          : [
              {
                type: "paragraph",
                children: [],
              },
            ];
        items.push(
          {
            type: "listItem",
            checked,
            children,
          },
        );
      }
      blocks.push(
        {
          type: "list",
          ordered: tag === "OL",
          start: tag === "OL"
            ? Number(child.getAttribute("start") || 1)
            : undefined,
          items,
        },
      );
    } else if (tag === "TABLE") {
      const header = [];
      const align = [];
      const headCells = child.querySelectorAll("thead th, thead td");
      headCells.forEach(
        (cell) => {
          header.push(readCell(cell));
          align.push(cell.getAttribute("data-align") || null);
        },
      );
      const rows = [];
      child.querySelectorAll("tbody tr").forEach(
        (tr) => {
          const row = [];
          tr.querySelectorAll("th, td").forEach(
            (cell) => {
              row.push(readCell(cell));
            },
          );
          rows.push(row);
        },
      );
      if (
        !header.length &&
        child.querySelector("tr")
      ) {
        const first = child.querySelector("tr");
        first.querySelectorAll("th, td").forEach(
          (cell) => {
            header.push(readCell(cell));
            align.push(cell.getAttribute("data-align") || null);
          },
        );
      }
      blocks.push(
        {
          type: "table",
          header,
          align,
          rows,
        },
      );
    }
  }
  flushInlineRun();

  return blocks;
};

/** Read a contenteditable root into a block AST. */
export const elementToAst = (element) => {
  if (!element) {
    return [];
  }
  return readBlocks(element);
};
