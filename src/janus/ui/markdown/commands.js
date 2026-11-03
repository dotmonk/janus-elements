import {
  safeUrl,
} from "./safeUrl.js";
import {
  highlightCode,
} from "./codeBlock.js";
import {
  selectionIn,
  focusEditor,
  placeCaretIn,
  blockFromRange,
  currentBlock,
  setBlockTag,
  setListKind,
  keepingCaret,
  wrapInlineRuns,
  pointFromCharOffset,
} from "./blocks.js";

const exec = (root, command, value) => {
  focusEditor(root);
  root.ownerDocument.execCommand(
    command,
    false,
    value,
  );
};

export const toggleBold = (root) => exec(
  root,
  "bold",
);
export const toggleItalic = (root) => exec(
  root,
  "italic",
);

const elementOf = (node) => node.nodeType === Node.ELEMENT_NODE
  ? node
  : node.parentElement;

const textBlockOf = (node) => elementOf(node)?.closest("p, h1, h2, h3, h4, h5, h6, li, td, th");

/** Take the selected part of `mark` out of it, splitting the mark around the selection. */
const unmarkSelection = (mark, range) => {
  const doc = mark.ownerDocument;
  const inside = doc.createRange();
  inside.selectNodeContents(mark);
  if (range.compareBoundaryPoints(
    Range.START_TO_START,
    inside,
  ) > 0) {
    inside.setStart(
      range.startContainer,
      range.startOffset,
    );
  }
  if (range.compareBoundaryPoints(
    Range.END_TO_END,
    inside,
  ) < 0) {
    inside.setEnd(
      range.endContainer,
      range.endOffset,
    );
  }
  const after = doc.createRange();
  after.setStart(
    inside.endContainer,
    inside.endOffset,
  );
  after.setEnd(
    mark,
    mark.childNodes.length,
  );
  const tail = mark.cloneNode(false);
  tail.appendChild(after.extractContents());
  const selected = inside.extractContents();
  const first = selected.firstChild;
  const last = selected.lastChild;
  mark.after(
    selected,
    tail,
  );
  for (const piece of [
    mark,
    tail,
  ]) {
    if (
      !piece.textContent &&
      !piece.querySelector("img")
    ) {
      piece.remove();
    }
  }
  if (first) {
    const selection = doc.getSelection();
    const moved = doc.createRange();
    moved.setStartBefore(first);
    moved.setEndAfter(last);
    selection.removeAllRanges();
    selection.addRange(moved);
  }
};

/** Wrap the selection in `tagName`, or unmark it inside an enclosing mark. Needs a selection. */
const toggleMark = (root, selector, tagName) => {
  focusEditor(root);
  const sel = selectionIn(root);
  if (
    !sel ||
    sel.range.collapsed
  ) {
    return;
  }
  const {
    range,
  } = sel;
  const ancestor = elementOf(range.commonAncestorContainer);
  if (ancestor.closest("pre")) {
    return;
  }
  const existing = ancestor.closest(selector);
  if (
    existing &&
    root.contains(existing)
  ) {
    unmarkSelection(
      existing,
      range,
    );
    return;
  }
  if (textBlockOf(range.startContainer) !== textBlockOf(range.endContainer)) {
    return;
  }
  const mark = root.ownerDocument.createElement(tagName);
  mark.appendChild(range.extractContents());
  range.insertNode(mark);
  range.selectNodeContents(mark);
  sel.selection.removeAllRanges();
  sel.selection.addRange(range);
};

export const toggleStrikethrough = (root) => toggleMark(
  root,
  "del, s, strike",
  "del",
);
export const toggleInlineCode = (root) => toggleMark(
  root,
  "code",
  "code",
);

export const setHeading = (root, level = 2) => {
  const tag = `h${Math.min(6, Math.max(1, level))}`;
  const block = currentBlock(root);
  let heading = null;
  if (
    block &&
    /^H[1-6]$/.test(block.tagName)
  ) {
    heading = block;
  } else if (
    block &&
    block.tagName === "LI"
  ) {
    heading = [
      ...block.children,
    ].find(
      (child) => /^H[1-6]$/.test(child.tagName),
    ) || null;
  }
  if (
    heading &&
    heading.tagName === tag.toUpperCase()
  ) {
    setBlockTag(
      root,
      "p",
    );
    return;
  }
  setBlockTag(
    root,
    tag,
  );
};

export const setParagraph = (root) => setBlockTag(
  root,
  "p",
);

export const toggleBulletList = (root) => setListKind(
  root,
  "bullet",
);
export const toggleOrderedList = (root) => setListKind(
  root,
  "ordered",
);
export const toggleTaskList = (root) => setListKind(
  root,
  "task",
);

export const toggleBlockquote = (root) => {
  focusEditor(root);
  const doc = root.ownerDocument;
  const block = currentBlock(root);
  if (
    !block ||
    block === root
  ) {
    const quote = doc.createElement("blockquote");
    const p = doc.createElement("p");
    p.appendChild(doc.createElement("br"));
    quote.appendChild(p);
    root.appendChild(quote);
    placeCaretIn(
      root,
      p,
    );
    return;
  }
  const quote = block.closest("blockquote");
  if (
    quote &&
    root.contains(quote)
  ) {
    keepingCaret(
      root,
      () => {
        wrapInlineRuns(quote);
        quote.replaceWith(...quote.childNodes);
      },
    );
    return;
  }
  if (!/^(P|H[1-6]|DIV)$/.test(block.tagName)) {
    return;
  }
  keepingCaret(
    root,
    () => {
      const wrapper = doc.createElement("blockquote");
      block.replaceWith(wrapper);
      wrapper.appendChild(block);
    },
  );
};

export const insertHorizontalRule = (root) => {
  const sel = selectionIn(root) || ensureRange(root);
  const doc = root.ownerDocument;
  const hr = doc.createElement("hr");
  const after = doc.createElement("p");
  after.appendChild(doc.createElement("br"));
  if (!sel) {
    root.appendChild(hr);
    root.appendChild(after);
    placeCaretIn(
      root,
      after,
    );
    return;
  }
  const block = blockFromRange(
    sel.range,
    root,
  ) || currentBlock(root);
  if (
    block &&
    block !== root &&
    root.contains(block)
  ) {
    block.after(hr);
    hr.after(after);
  } else {
    const marker = currentBlock(root) || root.lastElementChild;
    if (
      marker &&
      marker !== root
    ) {
      marker.after(hr);
      hr.after(after);
    } else {
      root.appendChild(hr);
      root.appendChild(after);
    }
  }
  placeCaretIn(
    root,
    after,
  );
};

export const insertFencedCode = (root) => {
  focusEditor(root);
  const sel = selectionIn(root);
  const doc = root.ownerDocument;
  const pre = doc.createElement("pre");
  const code = doc.createElement("code");
  const text = sel
    ? sel.range.toString() || "code"
    : "code";
  code.textContent = text;
  pre.appendChild(code);
  if (sel) {
    sel.range.deleteContents();
    sel.range.insertNode(pre);
  } else {
    root.appendChild(pre);
  }
  const after = doc.createElement("p");
  after.appendChild(doc.createElement("br"));
  pre.after(after);
  placeCaretIn(
    root,
    after,
  );
};

const ensureRange = (root) => {
  let sel = selectionIn(root);
  if (sel) {
    return sel;
  }
  // Avoid focusEditor here: focusing the contenteditable can morph-wipe
  // children that are not in the component template.
  placeCaretIn(
    root,
    root.lastElementChild || root,
  );
  return selectionIn(root);
};

const anchorFromRange = (range, root) => {
  let node = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }
  while (
    node &&
    node !== root
  ) {
    if (node.tagName === "A") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const placeCaretAfter = (root, node) => {
  const selection = root.ownerDocument.getSelection();
  if (
    !selection ||
    !node
  ) {
    return;
  }
  const range = root.ownerDocument.createRange();
  if (
    node.lastChild &&
    node.lastChild.nodeType === Node.TEXT_NODE
  ) {
    const text = node.lastChild;
    range.setStart(
      text,
      text.nodeValue.length,
    );
  } else {
    range.setStartAfter(node);
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

const isEmptyBlock = (node) => {
  if (
    !node ||
    node.nodeType !== Node.ELEMENT_NODE
  ) {
    return false;
  }
  if (!/^(P|DIV)$/.test(node.tagName)) {
    return false;
  }
  const text = node.textContent.replace(
    /\u200b/g,
    "",
  ).trim();
  if (text) {
    return false;
  }
  return !node.querySelector("img, table, hr, pre, ul, ol, blockquote");
};

/** Keep inserted inlines inside a paragraph when they land on the editor root. */
const wrapInlineInParagraph = (root, node) => {
  if (
    !node ||
    node.parentElement !== root
  ) {
    return node;
  }
  const p = root.ownerDocument.createElement("p");
  root.insertBefore(
    p,
    node,
  );
  // Pull adjacent bare text/inlines into the same paragraph so a link wrap
  // does not leave sibling root text that serializes as extra blocks.
  while (
    p.previousSibling &&
    (
      p.previousSibling.nodeType === Node.TEXT_NODE ||
      (
        p.previousSibling.nodeType === Node.ELEMENT_NODE &&
        !/^(P|H[1-6]|UL|OL|PRE|BLOCKQUOTE|TABLE|HR|DIV)$/.test(p.previousSibling.tagName)
      )
    )
  ) {
    p.insertBefore(
      p.previousSibling,
      p.firstChild,
    );
  }
  p.appendChild(node);
  while (
    p.nextSibling &&
    (
      p.nextSibling.nodeType === Node.TEXT_NODE ||
      (
        p.nextSibling.nodeType === Node.ELEMENT_NODE &&
        !/^(P|H[1-6]|UL|OL|PRE|BLOCKQUOTE|TABLE|HR|DIV)$/.test(p.nextSibling.tagName)
      )
    )
  ) {
    p.appendChild(p.nextSibling);
  }
  return node;
};

const removeAdjacentEmptyBlocks = (root, node) => {
  const block = node?.closest?.("p, h1, h2, h3, h4, h5, h6, div") || node?.parentElement;
  if (
    !block ||
    block === root
  ) {
    return;
  }
  let sibling = block.nextSibling;
  while (
    sibling &&
    isEmptyBlock(sibling)
  ) {
    const next = sibling.nextSibling;
    sibling.remove();
    sibling = next;
  }
};

const MARK_TAGS = new Set(
  [
    "STRONG",
    "B",
    "EM",
    "I",
    "DEL",
    "S",
    "STRIKE",
  ],
);
const BLOCK_TAGS = new Set(
  [
    "P",
    "DIV",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "UL",
    "OL",
    "PRE",
    "BLOCKQUOTE",
    "TABLE",
    "HR",
  ],
);

const isMarkElement = (node) => node && node.nodeType === Node.ELEMENT_NODE && MARK_TAGS.has(node.tagName);

const isBlockElement = (node) => node && node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(node.tagName);

/**
 * An `<a>` may only contain phrasing content. Contenteditable often "repairs"
 * bad wraps into `<a><h1></h1><p>Write</p></a>`, which still serializes as a
 * fine Markdown link but renders as stacked blocks. Flatten to text + marks.
 */
const sanitizeLinkElement = (root, a, fallbackLabel) => {
  if (
    !a ||
    !root.contains(a)
  ) {
    return a;
  }
  const doc = a.ownerDocument;
  const collectPhrasing = (from, into) => {
    for (const n of [
      ...from.childNodes,
    ]) {
      if (n.nodeType === Node.TEXT_NODE) {
        if (n.nodeValue) {
          into.appendChild(doc.createTextNode(n.nodeValue));
        }
        continue;
      }
      if (
        n.nodeType !== Node.ELEMENT_NODE ||
        n.tagName === "BR"
      ) {
        continue;
      }
      if (
        isMarkElement(n) ||
        n.tagName === "CODE"
      ) {
        const mark = doc.createElement(n.tagName.toLowerCase());
        collectPhrasing(
          n,
          mark,
        );
        if (mark.childNodes.length) {
          into.appendChild(mark);
        }
        continue;
      }
      collectPhrasing(
        n,
        into,
      );
    }
  };
  const dest = doc.createDocumentFragment();
  collectPhrasing(
    a,
    dest,
  );
  while (a.firstChild) {
    a.removeChild(a.firstChild);
  }
  a.appendChild(dest);
  if (!a.textContent.replace(
    /\u200b/g,
    "",
  ).trim()) {
    a.textContent = fallbackLabel || "link";
  }
  // Link must live inside a block, never as a root-level wrapper of blocks.
  if (a.parentElement === root) {
    const p = doc.createElement("p");
    root.insertBefore(
      p,
      a,
    );
    p.appendChild(a);
  }
  return a;
};

/** If a link sits alone in a paragraph between text paragraphs, merge them. */
const mergeOrphanLinkParagraph = (root, a) => {
  const p = a?.parentElement;
  if (
    !p ||
    p.tagName !== "P" ||
    p.parentElement !== root
  ) {
    return;
  }
  const onlyLink = [
    ...p.childNodes,
  ].every(
    (node) => node === a || (node.nodeType === Node.TEXT_NODE && !String(node.nodeValue).trim()) || (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR"),
  );
  if (!onlyLink) {
    return;
  }
  const prev = p.previousElementSibling;
  const next = p.nextElementSibling;
  if (
    prev &&
    prev.tagName === "P"
  ) {
    while (p.firstChild) {
      prev.appendChild(p.firstChild);
    }
    p.remove();
    if (
      next &&
      next.tagName === "P"
    ) {
      while (next.firstChild) {
        prev.appendChild(next.firstChild);
      }
      next.remove();
    }
    return;
  }
  if (
    next &&
    next.tagName === "P"
  ) {
    while (next.firstChild) {
      p.appendChild(next.firstChild);
    }
    next.remove();
  }
};

/**
 * Prefer `<a><strong>…</strong></a>` over `<strong><a>…</a></strong>`.
 * Nesting a link inside a mark often makes the browser split the mark and
 * leave empty `****` shells.
 */
const liftLinkOutOfMarks = (a) => {
  let parent = a.parentElement;
  while (isMarkElement(parent)) {
    const mark = parent;
    const grand = mark.parentNode;
    if (
      !grand ||
      isBlockElement(mark)
    ) {
      break;
    }
    const alone = [
      ...mark.childNodes,
    ].every(
      (node) => node === a || (node.nodeType === Node.TEXT_NODE && !String(node.nodeValue).trim()),
    );
    if (!alone) {
      break;
    }
    grand.insertBefore(
      a,
      mark,
    );
    while (a.firstChild) {
      mark.appendChild(a.firstChild);
    }
    a.appendChild(mark);
    parent = a.parentElement;
  }
  return a;
};

/** Tidy a freshly inserted link into valid inline markup and put the caret after it. */
const settleLink = (root, inserted, fallbackLabel) => {
  let a = liftLinkOutOfMarks(inserted);
  wrapInlineInParagraph(
    root,
    a,
  );
  removeAdjacentEmptyBlocks(
    root,
    a,
  );
  mergeOrphanLinkParagraph(
    root,
    a,
  );
  a = sanitizeLinkElement(
    root,
    a,
    fallbackLabel,
  );
  placeCaretAfter(
    root,
    a,
  );
};

const wrapTextNodeRangeInLink = (doc, textNode, start, end, href, label) => {
  const full = textNode.nodeValue || "";
  const before = full.slice(
    0,
    start,
  );
  const mid = full.slice(
    start,
    end,
  );
  const after = full.slice(end);
  const parent = textNode.parentNode;
  // Whole contents of a mark → wrap the mark in the link (not link in mark).
  if (
    !before &&
    !after &&
    isMarkElement(parent) &&
    [
      ...parent.childNodes,
    ].every(
      (node) => node === textNode || (node.nodeType === Node.TEXT_NODE && !String(node.nodeValue).trim()),
    )
  ) {
    const a = doc.createElement("a");
    a.setAttribute(
      "href",
      href || "#",
    );
    parent.parentNode.insertBefore(
      a,
      parent,
    );
    a.appendChild(parent);
    return a;
  }
  const a = doc.createElement("a");
  a.setAttribute(
    "href",
    href || "#",
  );
  a.textContent = mid || label || href || "link";
  const fragment = doc.createDocumentFragment();
  if (before) {
    fragment.appendChild(doc.createTextNode(before));
  }
  fragment.appendChild(a);
  if (after) {
    fragment.appendChild(doc.createTextNode(after));
  }
  parent.replaceChild(
    fragment,
    textNode,
  );
  return liftLinkOutOfMarks(a);
};

/**
 * Wrap a character-offset range in a link without using window selection.
 * Used after popover Apply so focus morph cannot drop the rest of the sentence.
 */
export const applyLinkAtOffsets = (root, url, label, start, end) => {
  const startPt = pointFromCharOffset(
    root,
    start,
  );
  const endPt = pointFromCharOffset(
    root,
    end,
  );
  const range = root.ownerDocument.createRange();
  range.setStart(
    startPt.node,
    startPt.offset,
  );
  range.setEnd(
    endPt.node,
    endPt.offset,
  );
  linkRange(
    root,
    range,
    safeUrl(url),
    label,
  );
};

export const applyLink = (root, url, label) => {
  const href = safeUrl(url);
  // Prefer the already-restored selection; focusing can re-enter morph and
  // wipe contenteditable children that are not in the template.
  const sel = selectionIn(root) || ensureRange(root);
  if (!sel) {
    return;
  }
  linkRange(
    root,
    sel.range,
    href,
    label,
  );
};

export const unlink = (root) => {
  const sel = selectionIn(root);
  const a = sel && anchorFromRange(
    sel.range,
    root,
  );
  if (a) {
    keepingCaret(
      root,
      () => a.replaceWith(...a.childNodes),
    );
  }
};

export const setCodeLanguage = (root, language) => {
  const sel = selectionIn(root);
  const code = sel && elementOf(sel.range.startContainer).closest("pre")?.querySelector("code");
  if (!code) {
    return;
  }
  if (
    language &&
    language !== "plain"
  ) {
    code.setAttribute(
      "data-lang",
      language,
    );
  } else {
    code.removeAttribute("data-lang");
  }
  highlightCode(code);
};

const linkRange = (root, range, href, label) => {
  const doc = root.ownerDocument;
  const fallbackLabel = label || href || "link";
  let a;
  if (
    !range.collapsed &&
    range.startContainer === range.endContainer &&
    range.startContainer.nodeType === Node.TEXT_NODE
  ) {
    a = wrapTextNodeRangeInLink(
      doc,
      range.startContainer,
      range.startOffset,
      range.endOffset,
      href,
      label,
    );
  } else {
    a = doc.createElement("a");
    a.setAttribute(
      "href",
      href || "#",
    );
    if (range.collapsed) {
      a.textContent = fallbackLabel;
      insertInlineAtCaret(
        root,
        range,
        a,
      );
    } else {
      // Never surroundContents across blocks — extract text and wrap that.
      a.textContent = range.toString() || fallbackLabel;
      range.deleteContents();
      range.insertNode(a);
    }
  }
  settleLink(
    root,
    a,
    fallbackLabel,
  );
};

/** Insert an inline node; if the range sits on a lone `<br>`, replace it. */
const insertInlineAtCaret = (root, range, node) => {
  const block = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;
  if (
    block &&
    root.contains(block) &&
    block.childNodes.length === 1 &&
    block.firstChild.tagName === "BR"
  ) {
    block.replaceChild(
      node,
      block.firstChild,
    );
    return;
  }
  range.insertNode(node);
};

export const applyImage = (root, url, alt = "") => {
  const src = safeUrl(url);
  if (!src) {
    return;
  }
  const sel = selectionIn(root) || ensureRange(root);
  if (!sel) {
    return;
  }
  if (!sel.range.collapsed) {
    sel.range.deleteContents();
  }
  const img = root.ownerDocument.createElement("img");
  img.setAttribute(
    "src",
    src,
  );
  img.setAttribute(
    "alt",
    alt || "",
  );
  insertInlineAtCaret(
    root,
    sel.range,
    img,
  );
  wrapInlineInParagraph(
    root,
    img,
  );
  removeAdjacentEmptyBlocks(
    root,
    img,
  );
  placeCaretAfter(
    root,
    img,
  );
};

export const insertTable = (root, rows = 2, cols = 2) => {
  focusEditor(root);
  const sel = ensureRange(root);
  const doc = root.ownerDocument;
  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  for (let col = 0; col < cols; col += 1) {
    const th = doc.createElement("th");
    th.textContent = `H${col + 1}`;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = doc.createElement("tbody");
  for (let row = 0; row < rows; row += 1) {
    const tr = doc.createElement("tr");
    for (let col = 0; col < cols; col += 1) {
      const td = doc.createElement("td");
      td.textContent = " ";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  // Tables must be block siblings of paragraphs/list items — inserting into a
  // `<p>` (e.g. caret in a task) flattens to plain text on serialize.
  const block = sel
    ? blockFromRange(
        sel.range,
        root,
      )
    : null;
  const anchor = (block && block !== root && root.contains(block) && block) || root.lastElementChild;
  if (
    anchor &&
    anchor !== root
  ) {
    const listItem = anchor.closest?.("li");
    const host = listItem && root.contains(listItem)
      ? listItem.parentElement
      : anchor;
    if (
      host &&
      host !== root &&
      root.contains(host)
    ) {
      host.after(table);
    } else {
      anchor.after(table);
    }
  } else {
    root.appendChild(table);
  }
  const after = doc.createElement("p");
  after.appendChild(doc.createElement("br"));
  table.after(after);
  placeCaretIn(
    root,
    after,
  );
};
