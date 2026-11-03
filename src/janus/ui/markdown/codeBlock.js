import {
  charOffsetIn,
  pointFromCharOffset,
  selectionIn,
} from "./blocks.js";
import {
  preText,
  renderCode,
} from "./dom.js";

/** Re-render a code element's text as highlighted tokens, keeping a caret inside it. */
export const highlightCode = (code) => {
  const sel = selectionIn(code);
  const caret = sel && {
    start: charOffsetIn(
      code,
      sel.range.startContainer,
      sel.range.startOffset,
    ),
    end: charOffsetIn(
      code,
      sel.range.endContainer,
      sel.range.endOffset,
    ),
  };
  const text = preText(code);
  renderCode(
    code,
    text,
  );
  if (!caret) {
    return;
  }
  const range = code.ownerDocument.createRange();
  if (text) {
    const start = pointFromCharOffset(
      code,
      caret.start,
    );
    const end = pointFromCharOffset(
      code,
      caret.end,
    );
    range.setStart(
      start.node,
      start.offset,
    );
    range.setEnd(
      end.node,
      end.offset,
    );
  } else {
    range.setStart(
      code,
      0,
    );
  }
  sel.selection.removeAllRanges();
  sel.selection.addRange(range);
};

export const highlightCodeBlocks = (root) => {
  for (const code of root.querySelectorAll("pre > code")) {
    highlightCode(code);
  }
};

/** The code element holding the caret, if any. */
export const codeAtCaret = (root) => {
  const container = selectionIn(root)?.range.startContainer;
  const element = container?.nodeType === Node.ELEMENT_NODE
    ? container
    : container?.parentElement;
  return element?.closest("pre")?.querySelector("code") || null;
};
