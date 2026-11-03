import {
  createTaskCheckbox,
} from "./dom.js";

const BLOCK_RE = /^(P|H[1-6]|BLOCKQUOTE|PRE|DIV|LI)$/;

/** Character offset of a DOM point within the editor root (text nodes only). */
export const charOffsetIn = (root, node, offset) => {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );
  let count = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) {
      return count + offset;
    }
    count += current.nodeValue.length;
    current = walker.nextNode();
  }
  if (
    node &&
    node.nodeType === Node.ELEMENT_NODE &&
    root.contains(node)
  ) {
    const before = root.ownerDocument.createRange();
    before.selectNodeContents(root);
    before.setEnd(
      node,
      Math.min(
        offset,
        node.childNodes.length,
      ),
    );
    return before.toString().length;
  }
  return count;
};

/** DOM point for a character offset within the editor root. */
export const pointFromCharOffset = (root, target) => {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );
  let count = 0;
  let current = walker.nextNode();
  let lastText = null;
  while (current) {
    const length = current.nodeValue.length;
    if (count + length >= target) {
      return {
        node: current,
        offset: Math.max(
          0,
          target - count,
        ),
      };
    }
    count += length;
    lastText = current;
    current = walker.nextNode();
  }
  if (
    lastText &&
    target <= count
  ) {
    return {
      node: lastText,
      offset: lastText.nodeValue.length,
    };
  }
  const fallback = root.lastElementChild || root.lastChild || root;
  return {
    node: fallback,
    offset: fallback.nodeType === Node.TEXT_NODE
      ? fallback.nodeValue.length
      : fallback.childNodes.length,
  };
};

export const selectionIn = (root) => {
  const selection = root.ownerDocument.getSelection();
  if (
    !selection ||
    !selection.rangeCount
  ) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }
  return {
    selection,
    range,
  };
};

export const focusEditor = (root) => {
  root.focus();
};

export const placeCaretIn = (root, node, atEnd = false) => {
  const selection = root.ownerDocument.getSelection();
  if (
    !selection ||
    !node
  ) {
    return;
  }
  const range = root.ownerDocument.createRange();
  range.selectNodeContents(node);
  range.collapse(!atEnd);
  selection.removeAllRanges();
  selection.addRange(range);
};

/** Nearest block element under the editor root for a range. */
export const blockFromRange = (range, root) => {
  let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  while (
    node &&
    node !== root
  ) {
    if (
      BLOCK_RE.test(node.tagName) ||
      node.parentElement === root
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

export const currentBlock = (root) => {
  const sel = selectionIn(root);
  if (!sel) {
    return root.firstElementChild;
  }
  return blockFromRange(
    sel.range,
    root,
  ) || root.firstElementChild;
};

const currentListItem = (root) => {
  const block = currentBlock(root);
  if (!block) {
    return null;
  }
  if (block.tagName === "LI") {
    return block;
  }
  return block.closest?.("li") || null;
};

const isTaskBox = (node) => node.nodeType === Node.ELEMENT_NODE && node.hasAttribute("data-rich-task-box");

const taskBoxOf = (li) => li.querySelector(":scope > [data-rich-task-box]");

/** The block (p, heading) holding a list item's text, if it has one. */
const itemContent = (li) => [
  ...li.children,
].find(
  (child) => /^(P|H[1-6]|DIV)$/.test(child.tagName),
) || null;

const listItemContentNodes = (li) => [
  ...li.childNodes,
].filter(
  (node) => !isTaskBox(node),
);

const isEmptyListItem = (li) => {
  const nodes = listItemContentNodes(li);
  if (!nodes.length) {
    return true;
  }
  const text = nodes.map(
    (node) => node.textContent || "",
  ).join("").replace(
    /\u00a0/g,
    " ",
  ).trim();
  return !text;
};

const TEXT_BLOCK = /^(P|H[1-6]|DIV)$/;
const BLOCK_CHILD = /^(P|H[1-6]|DIV|UL|OL|BLOCKQUOTE|PRE|TABLE|HR)$/;
const LIST_TAG = {
  bullet: "ul",
  ordered: "ol",
  task: "ul",
};

const isBlockChild = (node) => node.nodeType === Node.ELEMENT_NODE && (BLOCK_CHILD.test(node.tagName) || isTaskBox(node));

/** Group runs of text and inline elements directly under `container` into paragraphs. */
export const wrapInlineRuns = (container) => {
  const doc = container.ownerDocument;
  let paragraph = null;
  for (const node of [
    ...container.childNodes,
  ]) {
    if (isBlockChild(node)) {
      paragraph = null;
      continue;
    }
    if (!paragraph) {
      const blank = node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim();
      const content = node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE;
      if (
        blank ||
        !content
      ) {
        continue;
      }
      paragraph = doc.createElement("p");
      container.insertBefore(
        paragraph,
        node,
      );
    }
    paragraph.appendChild(node);
  }
};

/** Run a DOM change, then put the caret back on the same nodes; moving a node resets ranges inside it. */
export const keepingCaret = (root, change) => {
  const sel = selectionIn(root);
  const saved = sel && {
    startContainer: sel.range.startContainer,
    startOffset: sel.range.startOffset,
    endContainer: sel.range.endContainer,
    endOffset: sel.range.endOffset,
  };
  const result = change();
  if (
    saved &&
    root.contains(saved.startContainer) &&
    root.contains(saved.endContainer)
  ) {
    try {
      const range = root.ownerDocument.createRange();
      range.setStart(
        saved.startContainer,
        saved.startOffset,
      );
      range.setEnd(
        saved.endContainer,
        saved.endOffset,
      );
      sel.selection.removeAllRanges();
      sel.selection.addRange(range);
    } catch {
      // Offsets past a container's new length: leave the browser's caret.
    }
  }
  return result;
};

/** Put the caret in `fallback` unless it already sits inside a text block. */
const settleCaret = (root, fallback) => {
  const container = selectionIn(root)?.range.startContainer;
  const element = container?.nodeType === Node.ELEMENT_NODE
    ? container
    : container?.parentElement;
  const block = element?.closest("p, h1, h2, h3, h4, h5, h6, pre, td, th");
  if (
    !block ||
    !root.contains(block)
  ) {
    placeCaretIn(
      root,
      fallback,
    );
  }
};

const renameElement = (el, tagName) => {
  if (el.tagName === tagName.toUpperCase()) {
    return el;
  }
  const next = el.ownerDocument.createElement(tagName);
  while (el.firstChild) {
    next.appendChild(el.firstChild);
  }
  for (const attr of el.attributes) {
    next.setAttribute(
      attr.name,
      attr.value,
    );
  }
  el.replaceWith(next);
  return next;
};

/** Convert the caret's text block (or a list item's) to p or h1–h6. */
export const setBlockTag = (root, tagName) => {
  focusEditor(root);
  const block = currentBlock(root);
  if (
    !block ||
    block === root
  ) {
    const el = root.ownerDocument.createElement(tagName);
    el.appendChild(root.ownerDocument.createElement("br"));
    root.appendChild(el);
    placeCaretIn(
      root,
      el,
    );
    return el;
  }
  const target = block.tagName === "LI"
    ? ensureItemContent(block)
    : block;
  if (!TEXT_BLOCK.test(target.tagName)) {
    return target;
  }
  const next = keepingCaret(
    root,
    () => renameElement(
      target,
      tagName,
    ),
  );
  settleCaret(
    root,
    next,
  );
  return next;
};

const stripTaskFromItem = (li) => {
  li.removeAttribute("data-task");
  taskBoxOf(li)?.remove();
};

/** Make sure the item's text sits in a block after any checkbox, so typing lands there. */
const ensureItemContent = (li) => {
  const doc = li.ownerDocument;
  wrapInlineRuns(li);
  let content = itemContent(li);
  if (!content) {
    content = doc.createElement("p");
    li.appendChild(content);
  }
  if (
    !content.textContent &&
    !content.querySelector("br, img")
  ) {
    content.appendChild(doc.createElement("br"));
  }
  return content;
};

const makeTask = (li) => {
  if (!li.hasAttribute("data-task")) {
    li.setAttribute(
      "data-task",
      "unchecked",
    );
  }
  if (!taskBoxOf(li)) {
    const checked = li.getAttribute("data-task") === "checked";
    li.prepend(createTaskCheckbox(
      li.ownerDocument,
      checked,
    ));
  }
  return ensureItemContent(li);
};

/** "bullet", "ordered" or "task". */
const itemKind = (li) => {
  if (li.hasAttribute("data-task")) {
    return "task";
  }
  return li.parentElement?.tagName === "OL"
    ? "ordered"
    : "bullet";
};

const emptyCopy = (list) => {
  const copy = list.cloneNode(false);
  copy.removeAttribute("start");
  return copy;
};

/** Split the item's list so the item sits alone in a list; siblings keep their order. */
const isolateItem = (li) => {
  const list = li.parentElement;
  const following = [];
  for (let next = li.nextElementSibling; next; next = next.nextElementSibling) {
    following.push(next);
  }
  if (following.length) {
    const tail = emptyCopy(list);
    tail.append(...following);
    list.after(tail);
  }
  if (!li.previousElementSibling) {
    return list;
  }
  const own = emptyCopy(list);
  list.after(own);
  own.append(li);
  return own;
};

/** Replace a list item with its own blocks; returns the first one. */
const liftItem = (_root, li) => {
  stripTaskFromItem(li);
  const content = ensureItemContent(li);
  const list = isolateItem(li);
  list.replaceWith(...li.childNodes);
  return content;
};

const wrapBlockInList = (root, kind) => {
  const doc = root.ownerDocument;
  const block = currentBlock(root);
  const list = doc.createElement(LIST_TAG[kind]);
  const li = doc.createElement("li");
  list.appendChild(li);
  if (
    !block ||
    block === root
  ) {
    root.appendChild(list);
  } else if (TEXT_BLOCK.test(block.tagName)) {
    keepingCaret(
      root,
      () => {
        block.replaceWith(list);
        li.appendChild(block);
      },
    );
  } else {
    return;
  }
  settleCaret(
    root,
    kind === "task"
      ? makeTask(li)
      : ensureItemContent(li),
  );
};

/**
 * Give the caret's item a list kind, or lift it out of its list when it
 * already has that kind. Only the current item changes.
 */
export const setListKind = (root, kind) => {
  focusEditor(root);
  const li = currentListItem(root);
  if (!li) {
    wrapBlockInList(
      root,
      kind,
    );
    return;
  }
  if (itemKind(li) === kind) {
    settleCaret(
      root,
      keepingCaret(
        root,
        () => liftItem(
          root,
          li,
        ),
      ),
    );
    return;
  }
  const content = keepingCaret(
    root,
    () => {
      if (li.parentElement.tagName !== LIST_TAG[kind].toUpperCase()) {
        const list = root.ownerDocument.createElement(LIST_TAG[kind]);
        isolateItem(li).replaceWith(list);
        list.append(li);
      }
      if (kind === "task") {
        return makeTask(li);
      }
      stripTaskFromItem(li);
      return ensureItemContent(li);
    },
  );
  settleCaret(
    root,
    content,
  );
};

/** Tasks only live in bullet lists; move one that landed in a numbered list into its own. */
const keepTaskInBulletList = (li) => {
  if (
    li.hasAttribute("data-task") &&
    li.parentElement.tagName === "OL"
  ) {
    const list = li.ownerDocument.createElement("ul");
    isolateItem(li).replaceWith(list);
    list.append(li);
  }
};

/** Tab: nest the caret's item under the previous one. False outside lists. */
export const indentItem = (root) => {
  const li = currentListItem(root);
  if (!li) {
    return false;
  }
  const prev = li.previousElementSibling;
  if (!prev) {
    return true;
  }
  keepingCaret(
    root,
    () => {
      ensureItemContent(prev);
      const tag = li.parentElement.tagName;
      let nested = prev.lastElementChild;
      if (nested?.tagName !== tag) {
        nested = root.ownerDocument.createElement(tag.toLowerCase());
        prev.append(nested);
      }
      nested.append(li);
    },
  );
  return true;
};

/** Shift+Tab: lift the caret's item one level; at the top level, out of the list. */
export const outdentItem = (root) => {
  const li = currentListItem(root);
  if (!li) {
    return false;
  }
  const parentItem = li.parentElement.parentElement;
  if (parentItem?.tagName !== "LI") {
    settleCaret(
      root,
      keepingCaret(
        root,
        () => liftItem(
          root,
          li,
        ),
      ),
    );
    return true;
  }
  keepingCaret(
    root,
    () => {
      const list = li.parentElement;
      const following = [];
      for (let next = li.nextElementSibling; next; next = next.nextElementSibling) {
        following.push(next);
      }
      if (following.length) {
        const tail = emptyCopy(list);
        tail.append(...following);
        li.append(tail);
      }
      parentItem.after(li);
      if (!list.children.length) {
        list.remove();
      }
      keepTaskInBulletList(li);
    },
  );
  return true;
};

/** Split list item at caret: new empty/following item after. */
const splitListItem = (root, li) => {
  const sel = selectionIn(root);
  if (!sel) {
    return;
  }
  const doc = root.ownerDocument;
  const next = doc.createElement("li");
  if (li.hasAttribute("data-task")) {
    next.setAttribute(
      "data-task",
      "unchecked",
    );
    next.appendChild(createTaskCheckbox(
      doc,
      false,
    ));
  }

  const range = sel.range.cloneRange();
  range.selectNodeContents(li);
  range.setStart(
    sel.range.endContainer,
    sel.range.endOffset,
  );
  const trailing = range.extractContents();
  for (const node of [
    ...trailing.childNodes,
  ]) {
    if (isTaskBox(node)) {
      node.remove();
      continue;
    }
    next.appendChild(node);
  }
  li.after(next);
  placeCaretIn(
    root,
    ensureItemContent(next),
  );
};

const rangeAtStartOfListItem = (range, li) => {
  if (!range.collapsed) {
    return false;
  }
  const probe = range.cloneRange();
  probe.selectNodeContents(li);
  const box = taskBoxOf(li);
  if (
    box &&
    box.nextSibling
  ) {
    probe.setStartBefore(box.nextSibling);
  }
  probe.setEnd(
    range.startContainer,
    range.startOffset,
  );
  const before = probe.toString().replace(
    /\u00a0/g,
    " ",
  );
  return !before.trim();
};

/** Move an item's content into the previous item, joining the text where they meet. */
const joinWithPreviousItem = (root, prev, li) => {
  stripTaskFromItem(li);
  const first = ensureItemContent(li);
  wrapInlineRuns(prev);
  const last = prev.lastElementChild;
  if (
    last &&
    TEXT_BLOCK.test(last.tagName) &&
    TEXT_BLOCK.test(first.tagName)
  ) {
    if (
      last.lastChild?.nodeName === "BR" &&
      first.textContent
    ) {
      last.lastChild.remove();
    }
    placeCaretIn(
      root,
      last,
      true,
    );
    last.append(...first.childNodes);
    first.remove();
  } else {
    placeCaretIn(
      root,
      prev,
      true,
    );
  }
  prev.append(...li.childNodes);
  li.remove();
};

/** Backspace at start of list item: join with the previous item or lift it out. */
export const handleListBackspace = (root) => {
  const sel = selectionIn(root);
  const li = currentListItem(root);
  if (
    !sel ||
    !li ||
    !rangeAtStartOfListItem(
      sel.range,
      li,
    )
  ) {
    return false;
  }
  const prev = li.previousElementSibling;
  if (prev) {
    joinWithPreviousItem(
      root,
      prev,
      li,
    );
  } else {
    placeCaretIn(
      root,
      liftItem(
        root,
        li,
      ),
    );
  }
  return true;
};

/** Enter inside a code block inserts a newline; browsers otherwise split or wrap the block. */
export const handleCodeEnter = (root) => {
  const sel = selectionIn(root);
  const container = sel?.range.startContainer;
  const element = container?.nodeType === Node.ELEMENT_NODE
    ? container
    : container?.parentElement;
  const pre = element?.closest("pre");
  if (
    !pre ||
    !root.contains(pre)
  ) {
    return false;
  }
  const {
    range,
    selection,
  } = sel;
  range.deleteContents();
  let text = range.startContainer;
  let offset = range.startOffset;
  if (text.nodeType === Node.TEXT_NODE) {
    text.insertData(
      offset,
      "\n",
    );
  } else {
    const newline = root.ownerDocument.createTextNode("\n");
    range.insertNode(newline);
    text = newline;
    offset = 0;
  }
  const code = pre.querySelector("code") || pre;
  let last = code;
  while (last.lastChild) {
    last = last.lastChild;
  }
  // A trailing newline renders no line in <pre> without a placeholder after it.
  if (
    last === text &&
    offset + 1 === text.length
  ) {
    code.appendChild(root.ownerDocument.createElement("br"));
  }
  range.setStart(
    text,
    offset + 1,
  );
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
};

export const handleListEnter = (root) => {
  const li = currentListItem(root);
  if (
    !li ||
    !root.contains(li)
  ) {
    return false;
  }
  if (isEmptyListItem(li)) {
    placeCaretIn(
      root,
      liftItem(
        root,
        li,
      ),
    );
    return true;
  }
  splitListItem(
    root,
    li,
  );
  return true;
};

const selectionAncestor = (root) => {
  const sel = selectionIn(root);
  if (!sel) {
    return null;
  }
  const node = sel.range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? sel.range.commonAncestorContainer
    : sel.range.commonAncestorContainer.parentElement;
  return node && root.contains(node)
    ? node
    : null;
};

/** True only for explicit bold marks, not inherited heading weight. */
const hasBoldMark = (from, root) => {
  let node = from;
  while (
    node &&
    node !== root
  ) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (
        node.tagName === "STRONG" ||
        node.tagName === "B"
      ) {
        return true;
      }
      const weight = node.style && node.style.fontWeight;
      if (
        weight === "bold" ||
        weight === "bolder" ||
        (
          weight &&
          Number(weight) >= 600
        )
      ) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

const hasItalicMark = (from, root) => {
  let node = from;
  while (
    node &&
    node !== root
  ) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (
        node.tagName === "EM" ||
        node.tagName === "I"
      ) {
        return true;
      }
      const style = node.style && node.style.fontStyle;
      if (
        style === "italic" ||
        style === "oblique"
      ) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

/** Active format flags for toolbar `aria-pressed`. */
export const queryFormats = (root) => {
  const block = currentBlock(root);
  const li = currentListItem(root);
  const kind = li
    ? itemKind(li)
    : null;
  const headingLevel = (() => {
    if (!block) {
      return 0;
    }
    if (/^H[1-6]$/.test(block.tagName)) {
      return Number(block.tagName[1]);
    }
    if (block.tagName === "LI") {
      const inner = [
        ...block.children,
      ].find(
        (child) => /^H[1-6]$/.test(child.tagName),
      );
      return inner
        ? Number(inner.tagName[1])
        : 0;
    }
    return 0;
  })();
  const ancestor = selectionAncestor(root);
  const codeEl = ancestor?.closest?.("code");
  const inCode = Boolean(codeEl && codeEl.parentElement?.tagName !== "PRE");
  const inQuote = Boolean(block?.closest?.("blockquote"));
  const inStrike = Boolean(ancestor?.closest?.("del, s, strike"));
  const pre = ancestor?.closest?.("pre");
  const cell = ancestor?.closest?.("td, th");

  return {
    bold: hasBoldMark(
      ancestor,
      root,
    ),
    italic: hasItalicMark(
      ancestor,
      root,
    ),
    strike: inStrike,
    code: inCode,
    headingLevel,
    link: Boolean(ancestor?.closest?.("a")),
    codeLanguage: pre
      ? pre.querySelector("code")?.getAttribute("data-lang") || "plain"
      : null,
    bulletList: kind === "bullet",
    orderedList: kind === "ordered",
    taskList: kind === "task",
    quote: inQuote,
    table: cell
      ? {
          header: Boolean(cell.closest("thead")),
          align: cell.getAttribute("data-align"),
        }
      : null,
  };
};
