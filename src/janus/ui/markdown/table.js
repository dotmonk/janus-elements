import {
  selectionIn,
  placeCaretIn,
} from "./blocks.js";

export const cellAtCaret = (root) => {
  const node = selectionIn(root)?.range.startContainer;
  const element = node?.nodeType === Node.ELEMENT_NODE
    ? node
    : node?.parentElement;
  const cell = element?.closest("td, th");
  return cell && root.contains(cell)
    ? cell
    : null;
};

const isHeaderCell = (cell) => Boolean(cell.closest("thead"));

const columnCells = (table, index) => [
  ...table.rows,
].map(
  (row) => row.cells[index],
).filter(Boolean);

const emptyCell = (doc, tagName, align) => {
  const cell = doc.createElement(tagName);
  if (align) {
    cell.setAttribute(
      "data-align",
      align,
    );
  }
  cell.appendChild(doc.createElement("br"));
  return cell;
};

const placeCaretAtCellEnd = (root, cell) => {
  const walker = root.ownerDocument.createTreeWalker(
    cell,
    NodeFilter.SHOW_TEXT,
  );
  let last = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    last = node;
  }
  if (!last) {
    placeCaretIn(
      root,
      cell,
    );
    return;
  }
  const range = root.ownerDocument.createRange();
  range.setStart(
    last,
    last.nodeValue.length,
  );
  range.collapse(true);
  const selection = root.ownerDocument.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

/** New body row after `row`; a header row gets it at the top of the body. */
const insertBodyRowAfter = (row) => {
  const table = row.closest("table");
  const doc = row.ownerDocument;
  const tr = doc.createElement("tr");
  for (const headerCell of table.rows[0].cells) {
    tr.appendChild(emptyCell(
      doc,
      "td",
      headerCell.getAttribute("data-align"),
    ));
  }
  if (row.closest("thead")) {
    const body = table.tBodies[0] || table.appendChild(doc.createElement("tbody"));
    body.prepend(tr);
  } else {
    row.after(tr);
  }
  return tr;
};

export const insertRow = (root, where) => {
  const cell = cellAtCaret(root);
  if (
    !cell ||
    (
      where === "above" &&
      isHeaderCell(cell)
    )
  ) {
    return;
  }
  const row = cell.parentElement;
  const added = where === "above"
    ? insertBodyRowAfter(row.previousElementSibling || row.closest("table").rows[0])
    : insertBodyRowAfter(row);
  placeCaretIn(
    root,
    added.cells[cell.cellIndex],
  );
};

export const insertColumn = (root, side) => {
  const cell = cellAtCaret(root);
  if (!cell) {
    return;
  }
  const doc = root.ownerDocument;
  const index = cell.cellIndex;
  let caretCell = null;
  for (const row of cell.closest("table").rows) {
    const reference = row.cells[Math.min(
      index,
      row.cells.length - 1,
    )];
    const added = emptyCell(
      doc,
      row.closest("thead")
        ? "th"
        : "td",
    );
    if (!reference) {
      row.appendChild(added);
    } else if (side === "left") {
      reference.before(added);
    } else {
      reference.after(added);
    }
    if (row === cell.parentElement) {
      caretCell = added;
    }
  }
  placeCaretIn(
    root,
    caretCell,
  );
};

export const deleteRow = (root) => {
  const cell = cellAtCaret(root);
  if (
    !cell ||
    isHeaderCell(cell)
  ) {
    return;
  }
  const row = cell.parentElement;
  const neighbour = row.nextElementSibling || row.previousElementSibling || row.closest("table").rows[0];
  row.remove();
  placeCaretAtCellEnd(
    root,
    neighbour.cells[Math.min(
      cell.cellIndex,
      neighbour.cells.length - 1,
    )],
  );
};

export const deleteTable = (root) => {
  const table = cellAtCaret(root)?.closest("table");
  if (!table) {
    return;
  }
  const paragraph = root.ownerDocument.createElement("p");
  paragraph.appendChild(root.ownerDocument.createElement("br"));
  table.replaceWith(paragraph);
  placeCaretIn(
    root,
    paragraph,
  );
};

export const deleteColumn = (root) => {
  const cell = cellAtCaret(root);
  if (!cell) {
    return;
  }
  const table = cell.closest("table");
  if (table.rows[0].cells.length <= 1) {
    deleteTable(root);
    return;
  }
  const index = cell.cellIndex;
  const row = cell.parentElement;
  columnCells(
    table,
    index,
  ).forEach(
    (columnCell) => columnCell.remove(),
  );
  placeCaretAtCellEnd(
    root,
    row.cells[Math.min(
      index,
      row.cells.length - 1,
    )],
  );
};

export const setColumnAlign = (root, align) => {
  const cell = cellAtCaret(root);
  if (!cell) {
    return;
  }
  for (const columnCell of columnCells(
    cell.closest("table"),
    cell.cellIndex,
  )) {
    if (align) {
      columnCell.setAttribute(
        "data-align",
        align,
      );
    } else {
      columnCell.removeAttribute("data-align");
    }
  }
};

/** Tab / Shift+Tab: next or previous cell; Tab in the last cell adds a row. */
export const moveToCell = (root, backwards) => {
  const cell = cellAtCaret(root);
  if (!cell) {
    return false;
  }
  const table = cell.closest("table");
  const cells = [
    ...table.rows,
  ].flatMap(
    (row) => [
      ...row.cells,
    ],
  );
  const target = cells[cells.indexOf(cell) + (backwards
    ? -1
    : 1)];
  if (target) {
    placeCaretAtCellEnd(
      root,
      target,
    );
  } else if (!backwards) {
    placeCaretIn(
      root,
      insertBodyRowAfter(cell.parentElement).cells[0],
    );
  }
  return true;
};

/** Enter: the cell below; from the last row, a new row. */
export const handleTableEnter = (root) => {
  const cell = cellAtCaret(root);
  if (!cell) {
    return false;
  }
  const table = cell.closest("table");
  const rows = [
    ...table.rows,
  ];
  const below = rows[rows.indexOf(cell.parentElement) + 1];
  if (below) {
    placeCaretAtCellEnd(
      root,
      below.cells[Math.min(
        cell.cellIndex,
        below.cells.length - 1,
      )],
    );
  } else {
    placeCaretIn(
      root,
      insertBodyRowAfter(cell.parentElement).cells[cell.cellIndex],
    );
  }
  return true;
};
