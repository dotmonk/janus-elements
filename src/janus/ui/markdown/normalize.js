import {
  keepingCaret,
  wrapInlineRuns,
} from "./blocks.js";

const BLOCK_TAG = /^(P|H[1-6]|DIV|UL|OL|BLOCKQUOTE|PRE|TABLE|HR)$/;

/** Contenteditable fix-ups can nest blocks in a paragraph or heading; lift them out. */
const unnestBlocks = (root) => {
  for (const block of [
    ...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6"),
  ]) {
    if (![
      ...block.children,
    ].some(
      (child) => BLOCK_TAG.test(child.tagName),
    )) {
      continue;
    }
    wrapInlineRuns(block);
    block.replaceWith(...block.childNodes);
  }
};

const mergeAdjacentLists = (root) => {
  for (const list of [
    ...root.querySelectorAll("ul, ol"),
  ]) {
    while (
      list.isConnected &&
      list.nextElementSibling?.tagName === list.tagName
    ) {
      const next = list.nextElementSibling;
      list.append(...next.childNodes);
      next.remove();
    }
  }
};

const removeEmptyMarks = (root) => {
  const marks = root.querySelectorAll("strong, b, em, i, del, s, strike, code");
  for (const mark of [
    ...marks,
  ]) {
    const empty = !mark.textContent.replace(
      /​/g,
      "",
    );
    if (
      empty &&
      !mark.closest("pre") &&
      !mark.querySelector("img, br")
    ) {
      mark.remove();
    }
  }
};

/** Bring the editor DOM back to the shapes the Markdown parser produces. */
export const normalize = (root) => keepingCaret(
  root,
  () => {
    unnestBlocks(root);
    for (const container of [
      root,
      ...root.querySelectorAll("blockquote, li"),
    ]) {
      wrapInlineRuns(container);
    }
    mergeAdjacentLists(root);
    removeEmptyMarks(root);
  },
);
