import Component, {
  html,
} from "../index.js";
import {
  render,
} from "../template/index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  parseMarkdown,
  serializeMarkdown,
  astToFragment,
  elementToAst,
  commands,
  normalize,
  codeAtCaret,
  highlightCode,
  highlightCodeBlocks,
  queryFormats,
  handleCodeEnter,
  handleListEnter,
  handleListBackspace,
  indentItem,
  outdentItem,
  insertRow,
  insertColumn,
  deleteRow,
  deleteColumn,
  deleteTable,
  setColumnAlign,
  moveToCell,
  handleTableEnter,
} from "./markdown/index.js";
import {
  charOffsetIn,
  pointFromCharOffset,
} from "./markdown/blocks.js";
import {
  EditHistory,
} from "./markdown/history.js";
import {
  LANGUAGE_IDS,
  resolveLanguageId,
} from "./highlight/index.js";
import "./CodeEditor.js";
import "./CharactersIcon.js";
import "./Toolbar.js";
import LinkIcon from "./icon/link.js";
import ImageIcon from "./icon/image.js";
import CheckIcon from "./icon/check.js";
import MarkdownIcon from "./icon/markdown.js";
import {
  instantiateIcon,
} from "./createIcon.js";

const ICON_SIZE = 14;
const GLYPH_SIZE = 30;
const MENU_GAP = 2;
const MENU_Z_INDEX = "10000";
const MENU_MAX_HEIGHT_PX = 16 * 16; /* matches max-height: 16rem at default root */

let richStylesInstalled = false;

const ensureRichStyles = () => {
  if (
    richStylesInstalled ||
    typeof document === "undefined" ||
    !document.head
  ) {
    return;
  }
  richStylesInstalled = true;
  if (document.getElementById("janus-rich-textarea-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "janus-rich-textarea-styles";
  style.textContent = `
    .janus-rich-editor h1 { font-size: 1.5rem; margin: 0.4em 0; }
    .janus-rich-editor h2 { font-size: 1.25rem; margin: 0.4em 0; }
    .janus-rich-editor h3 { font-size: 1.1rem; margin: 0.35em 0; }
    .janus-rich-editor h4,
    .janus-rich-editor h5,
    .janus-rich-editor h6 { font-size: 1.05rem; margin: 0.35em 0; }
    .janus-rich-editor p { margin: 0.35em 0; }
    .janus-rich-editor del,
    .janus-rich-editor s,
    .janus-rich-editor strike {
      text-decoration: line-through;
    }
    .janus-rich-editor hr {
      border: 0;
      border-top: 1px solid var(--janus-border-strong);
      margin: 0.75em 0;
    }
    .janus-rich-editor blockquote {
      margin: 0.4em 0;
      padding: 0.2em 0.75em;
      border-left: 3px solid var(--janus-border-strong);
      color: var(--janus-text-muted);
    }
    .janus-rich-editor pre {
      margin: 0.4em 0;
      padding: 0.5em 0.75em;
      overflow: auto;
      border-radius: var(--janus-radius);
      background: var(--janus-raised);
      font-family: var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
      font-size: 0.8125rem;
    }
    .janus-rich-editor code {
      font-family: var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
      font-size: 0.875em;
    }
    .janus-rich-editor pre code { font-size: inherit; }
    .janus-rich-editor ul, .janus-rich-editor ol { margin: 0.35em 0; padding-left: 1.4em; }
    .janus-rich-editor li { margin: 0.15em 0; }
    .janus-rich-editor li[data-task] {
      list-style: none;
      margin-left: -1.15em;
      display: flex;
      align-items: flex-start;
      gap: 0.45em;
    }
    .janus-rich-editor li[data-task] > p {
      margin: 0;
      flex: 1;
      min-width: 0;
    }
    .janus-rich-editor .janus-rich-task-box {
      appearance: none;
      display: inline-grid;
      place-content: center;
      width: 18px;
      height: 18px;
      margin: 0.15em 0 0;
      padding: 0;
      flex-shrink: 0;
      border: 1px solid var(--janus-border-strong);
      border-radius: 4px;
      background: var(--janus-surface);
      color: var(--janus-accent);
      font: inherit;
      line-height: 1;
      cursor: pointer;
    }
    .janus-rich-editor .janus-rich-task-box[aria-checked="true"]::before {
      content: "✓";
      font-size: 12px;
      font-weight: 700;
    }
    .janus-rich-editor .janus-rich-task-box:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .janus-rich-editor table {
      border-collapse: collapse;
      margin: 0.4em 0;
      width: 100%;
    }
    .janus-rich-editor th, .janus-rich-editor td {
      border: 1px solid var(--janus-border);
      padding: 0.25em 0.5em;
      text-align: start;
    }
    .janus-rich-editor [data-align="left"] { text-align: left; }
    .janus-rich-editor [data-align="center"] { text-align: center; }
    .janus-rich-editor [data-align="right"] { text-align: right; }
    .janus-rich-editor img { max-width: 100%; height: auto; }
    .janus-rich-editor a { color: var(--janus-info); }
    /* Hover swaps icon SVGs; Firefox drops a click whose target was replaced. */
    .janus-rich-toolbar button * {
      pointer-events: none;
    }
    .janus-rich-toolbar button[hidden] {
      display: none;
    }
    .janus-rich-toolbar button[aria-pressed="true"] {
      background: color-mix(in oklab, var(--janus-accent) 28%, var(--janus-raised));
      border-color: var(--janus-accent);
      color: var(--janus-accent);
    }
    .janus-rich-menu {
      position: relative;
      display: inline-flex;
    }
    .janus-rich-menu[hidden] {
      display: none;
    }
    .janus-rich-menu [role="menu"] {
      /* Open menus switch to position:fixed in JS so the shell overflow does not clip them. */
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      min-width: 9rem;
      max-height: 16rem;
      overflow: auto;
      padding: 4px;
      border: 1px solid var(--janus-border);
      border-radius: var(--janus-radius);
      background: var(--janus-raised);
      box-shadow: var(--janus-shadow);
    }
    .janus-rich-menu [role="menu"][hidden] {
      display: none;
    }
    .janus-rich-menu [role^="menuitem"] {
      padding: 4px 8px;
      border: 0;
      border-radius: var(--janus-radius);
      background: transparent;
      color: var(--janus-text);
      font: inherit;
      font-size: 0.8125rem;
      text-align: left;
      cursor: pointer;
    }
    .janus-rich-menu [role^="menuitem"]:enabled:hover,
    .janus-rich-menu [role^="menuitem"]:focus-visible {
      background: color-mix(in oklab, var(--janus-accent) 18%, var(--janus-raised));
    }
    .janus-rich-menu [role^="menuitem"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .janus-rich-menu [role="menuitemradio"][aria-checked="true"] {
      color: var(--janus-accent);
      font-weight: 700;
    }
    .janus-rich-popover {
      display: none;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      padding: 4px;
      border-radius: var(--janus-radius);
      background: var(--janus-raised);
      border: 1px solid var(--janus-border);
    }
    .janus-rich-popover.is-open {
      display: flex;
    }
  `;
  document.head.appendChild(style);
};

const setIconsAnimated = (button, animated) => {
  if (
    animated &&
    button.disabled
  ) {
    return;
  }
  button.querySelectorAll("*").forEach(
    (element) => {
      if (
        element.localName.endsWith("-icon") &&
        element.receiveProps
      ) {
        element.receiveProps(
          {
            ...element.props,
            animated,
          },
          element.childElements,
        );
      }
    },
  );
};

const glyph = (text) => html`
  <CharactersIcon
    size=${GLYPH_SIZE}
    text=${text}
  />
`;

const toolbarBtn = (label, format, onClick, locked, child, attrs = {}) => html`
  <button
    type="button"
    aria-label=${label}
    title=${label}
    style=${{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "1.75rem",
      height: "1.75rem",
      padding: "0 2px",
      margin: "0",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "var(--janus-border)",
      borderRadius: "var(--janus-radius)",
      backgroundColor: "var(--janus-raised)",
      color: "var(--janus-text)",
      font: "inherit",
      fontSize: "0.75rem",
      fontWeight: "600",
      cursor: locked
        ? "not-allowed"
        : "pointer",
      opacity: locked
        ? "0.5"
        : "1",
    }}
    ${locked
      ? {
          disabled: "disabled",
        }
      : {}}
    ${format
      ? {
          "data-format": format,
          "aria-pressed": "false",
        }
      : {}}
    ${attrs}
    onMouseDown=${(event) => event.preventDefault()}
    onMouseEnter=${(event) => setIconsAnimated(
      event.currentTarget,
      true,
    )}
    onMouseLeave=${(event) => setIconsAnimated(
      event.currentTarget,
      false,
    )}
    onClick=${onClick}
  >${child || label}</button>
`;

const HEADING_ITEMS = [
  {
    value: "0",
    label: "Paragraph",
  },
  ...[
    1,
    2,
    3,
    4,
    5,
    6,
  ].map(
    (level) => ({
      value: String(level),
      label: `Heading ${level}`,
    }),
  ),
];

const LANGUAGE_ITEMS = LANGUAGE_IDS.map(
  (id) => ({
    value: id,
    label: id,
  }),
);

const TABLE_ITEMS = [
  {
    value: "rowAbove",
    label: "Insert row above",
    action: true,
  },
  {
    value: "rowBelow",
    label: "Insert row below",
    action: true,
  },
  {
    value: "columnLeft",
    label: "Insert column left",
    action: true,
  },
  {
    value: "columnRight",
    label: "Insert column right",
    action: true,
  },
  {
    value: "deleteRow",
    label: "Delete row",
    action: true,
  },
  {
    value: "deleteColumn",
    label: "Delete column",
    action: true,
  },
  {
    value: "left",
    label: "Align left",
  },
  {
    value: "center",
    label: "Align center",
  },
  {
    value: "right",
    label: "Align right",
  },
  {
    value: "none",
    label: "No alignment",
  },
  {
    value: "deleteTable",
    label: "Delete table",
    action: true,
  },
];

const TABLE_COMMANDS = {
  rowAbove: (root) => insertRow(
    root,
    "above",
  ),
  rowBelow: (root) => insertRow(
    root,
    "below",
  ),
  columnLeft: (root) => insertColumn(
    root,
    "left",
  ),
  columnRight: (root) => insertColumn(
    root,
    "right",
  ),
  deleteRow,
  deleteColumn,
  left: (root) => setColumnAlign(
    root,
    "left",
  ),
  center: (root) => setColumnAlign(
    root,
    "center",
  ),
  right: (root) => setColumnAlign(
    root,
    "right",
  ),
  none: (root) => setColumnAlign(
    root,
    null,
  ),
  deleteTable,
};

const MENU_ITEMS = "[role^=\"menuitem\"]:not([disabled])";

/** A toolbar button opening a `role="menu"` list; neither takes focus on mouse use. */
const toolbarMenu = ({
  label,
  menu,
  icon,
  items,
  locked,
  onToggle,
  onChoose,
  onKeyDown,
}) => html`
  <span
    class="janus-rich-menu"
    data-menu=${menu}
  >
    ${toolbarBtn(
      label,
      null,
      (event) => onToggle(
        menu,
        event.detail === 0,
      ),
      locked,
      html`
        ${icon || html`
          <span data-menu-label />
        `}
        <ChevronIcon size="15" />
      `,
      {
        "aria-haspopup": "menu",
        "aria-expanded": "false",
        "data-menu-trigger": "",
      },
    )}
    <div
      role="menu"
      aria-label=${label}
      hidden
      onKeyDown=${onKeyDown}
    >${items.map(
        (item) => html`
          <button
            type="button"
            ${item.action
              ? {
                  role: "menuitem",
                }
              : {
                  role: "menuitemradio",
                  "aria-checked": "false",
                }}
            data-value=${item.value}
            onMouseDown=${(event) => event.preventDefault()}
            onClick=${() => onChoose(
              menu,
              item.value,
            )}
          >${item.label}</button>
        `,
      )}</div>
  </span>
`;

class RichTextarea extends Component {

  constructor() {
    super();
    this.state = {
      sourceMode: false,
    };
    this._syncedValue = null;
    this._popover = null;
    this._savedRange = null;
    this._popoverSnapshot = null;
    this._history = new EditHistory();
    this._onSelectionChange = () => {
      this.rememberSelection();
      if (
        this._openMenu &&
        document.activeElement === this.editorEl()
      ) {
        this.closeMenu();
      }
      this.syncToolbar();
    };
    this._onBeforeInput = (event) => this.onBeforeInput(event);
    this._openMenu = null;
    this._menuListeners = false;
    this._onDocumentMouseDown = (event) => {
      if (
        this._openMenu &&
        !event.target.closest?.(".janus-rich-menu")
      ) {
        this.closeMenu();
      }
    };
    this._onRepositionMenu = () => this.positionOpenMenu();
    this._onTaskMouseDown = (event) => this.onTaskCheckboxMouseDown(event);
    this._onTaskClick = (event) => this.onTaskCheckboxClick(event);
  }

  editorEl() {
    return this.querySelector(".janus-rich-editor");
  }

  isSourceMode() {
    return Boolean(this.state && this.state.sourceMode);
  }

  propValue() {
    return this.props && this.props.value != null
      ? String(this.props.value)
      : "";
  }

  syncedOrPropValue() {
    return this._syncedValue == null
      ? this.propValue()
      : this._syncedValue;
  }

  currentMarkdown() {
    const root = this.editorEl();
    if (
      !this.isSourceMode() &&
      root
    ) {
      return serializeMarkdown(elementToAst(root));
    }
    return this.syncedOrPropValue();
  }

  emitMarkdown({
    typing = false,
  } = {}) {
    if (this.isSourceMode()) {
      return;
    }
    const root = this.editorEl();
    if (!root) {
      return;
    }
    const next = serializeMarkdown(elementToAst(root));
    this._history.record(
      {
        markdown: next,
        selection: this.selectionOffsets(),
      },
      {
        typing,
      },
    );
    this.publish(next);
  }

  publish(markdown) {
    this._syncedValue = markdown;
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(markdown);
    this.syncToolbar();
  }

  /** Character offsets of the editor selection, or null when it is elsewhere. */
  selectionOffsets() {
    const root = this.editorEl();
    const selection = root?.ownerDocument.getSelection();
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
      start: charOffsetIn(
        root,
        range.startContainer,
        range.startOffset,
      ),
      end: charOffsetIn(
        root,
        range.endContainer,
        range.endOffset,
      ),
    };
  }

  selectOffsets(offsets) {
    const root = this.editorEl();
    if (
      !root ||
      !offsets
    ) {
      return;
    }
    const selection = root.ownerDocument.getSelection();
    const range = root.ownerDocument.createRange();
    const textLength = root.textContent.replace(
      /\u200b/g,
      "",
    ).length;
    if (
      offsets.start >= textLength &&
      root.lastElementChild
    ) {
      range.selectNodeContents(root.lastElementChild);
      range.collapse(false);
    } else {
      const start = pointFromCharOffset(
        root,
        offsets.start,
      );
      const end = pointFromCharOffset(
        root,
        offsets.end,
      );
      range.setStart(
        start.node,
        start.offset,
      );
      range.setEnd(
        end.node,
        end.offset,
      );
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  rememberSelection() {
    const offsets = this.selectionOffsets();
    if (
      offsets &&
      !this.isSourceMode()
    ) {
      this._history.updateSelection(offsets);
    }
  }

  undo() {
    this.restoreStep(this._history.undo());
  }

  redo() {
    this.restoreStep(this._history.redo());
  }

  restoreStep(step) {
    const root = this.editorEl();
    if (
      !step ||
      !root
    ) {
      return;
    }
    root.focus();
    root.replaceChildren(astToFragment(parseMarkdown(step.markdown)));
    this.applyFlags();
    this.selectOffsets(step.selection);
    this.publish(step.markdown);
  }

  onBeforeInput(event) {
    if (
      event.inputType === "historyUndo" ||
      event.inputType === "historyRedo"
    ) {
      event.preventDefault();
      if (event.inputType === "historyUndo") {
        this.undo();
      } else {
        this.redo();
      }
    }
  }

  emitSourceMarkdown(next) {
    const value = next == null
      ? ""
      : String(next);
    this._syncedValue = value;
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(value);
    this.syncToolbar();
  }

  toggleSourceMode() {
    if (
      this.props &&
      (
        this.props.disabled ||
        this.props.readOnly
      )
    ) {
      return;
    }
    if (this.isSourceMode()) {
      const source = this._syncedValue != null
        ? this._syncedValue
        : "";
      this.setState(
        {
          sourceMode: false,
        },
      );
      queueMicrotask(
        () => {
          const root = this.editorEl();
          if (root) {
            root.replaceChildren(astToFragment(parseMarkdown(source)));
            this._syncedValue = source;
            this._history.record(
              {
                markdown: source,
                selection: null,
              },
            );
          }
          this.applyFlags();
          this.syncToolbar();
        },
      );
      return;
    }
    const next = this.currentMarkdown();
    this._syncedValue = next;
    if (next !== this.propValue()) {
      const {
        onChange,
      } = this.props || {};
      onChange && onChange(next);
    }
    this.hidePopover();
    this.setState(
      {
        sourceMode: true,
      },
    );
    queueMicrotask(
      () => this.syncToolbar(),
    );
  }

  syncEditor() {
    if (this.isSourceMode()) {
      this.applyFlags();
      this.syncToolbar();
      return;
    }
    const root = this.editorEl();
    if (!root) {
      return;
    }
    const source = this.propValue();
    if (
      source === this._syncedValue &&
      root.childNodes.length
    ) {
      this.applyFlags();
      this.syncToolbar();
      return;
    }
    const fragment = astToFragment(parseMarkdown(source));
    root.replaceChildren(fragment);
    this._syncedValue = source;
    this._history.reset(
      {
        markdown: source,
        selection: null,
      },
    );
    this.applyFlags();
    this.syncToolbar();
  }

  applyFlags() {
    const {
      disabled,
      readOnly,
      placeholder,
    } = this.props || {};
    const locked = Boolean(disabled || readOnly);
    const sourceMode = this.isSourceMode();
    this.querySelectorAll(".janus-rich-toolbar button").forEach(
      (button) => {
        const isSourceToggle = button.getAttribute("data-format") === "source";
        if (isSourceToggle) {
          button.disabled = locked;
        } else {
          button.disabled = locked || sourceMode;
        }
      },
    );
    const root = this.editorEl();
    if (!root) {
      return;
    }
    const editable = !locked;
    root.setAttribute(
      "contenteditable",
      editable
        ? "true"
        : "false",
    );
    root.setAttribute(
      "aria-readonly",
      readOnly
        ? "true"
        : "false",
    );
    root.setAttribute(
      "aria-disabled",
      disabled
        ? "true"
        : "false",
    );
    if (placeholder) {
      root.setAttribute(
        "data-placeholder",
        placeholder,
      );
    } else {
      root.removeAttribute("data-placeholder");
    }
    root.querySelectorAll("[data-rich-task-box]").forEach(
      (box) => {
        box.disabled = locked;
      },
    );
    this.bindEditor(root);
  }

  bindEditor(root) {
    if (this._boundEditor === root) {
      return;
    }
    if (this._boundEditor) {
      this._boundEditor.removeEventListener(
        "mousedown",
        this._onTaskMouseDown,
        true,
      );
      this._boundEditor.removeEventListener(
        "click",
        this._onTaskClick,
        true,
      );
      this._boundEditor.removeEventListener(
        "beforeinput",
        this._onBeforeInput,
      );
    }
    this._boundEditor = root;
    root.addEventListener(
      "mousedown",
      this._onTaskMouseDown,
      true,
    );
    root.addEventListener(
      "click",
      this._onTaskClick,
      true,
    );
    root.addEventListener(
      "beforeinput",
      this._onBeforeInput,
    );
  }

  onTaskCheckboxMouseDown(event) {
    const box = event.target.closest?.("[data-rich-task-box]");
    const root = this.editorEl();
    if (
      !box ||
      !root ||
      !root.contains(box)
    ) {
      return;
    }
    // Keep contenteditable from taking the click.
    event.preventDefault();
  }

  onTaskCheckboxClick(event) {
    const box = event.target.closest?.("[data-rich-task-box]");
    const root = this.editorEl();
    if (
      !box ||
      !root ||
      !root.contains(box)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (
      this.props &&
      (
        this.props.disabled ||
        this.props.readOnly
      )
    ) {
      return;
    }
    const li = box.closest("li");
    if (
      !li ||
      !li.hasAttribute("data-task")
    ) {
      return;
    }
    const next = li.getAttribute("data-task") !== "checked";
    box.setAttribute(
      "aria-checked",
      next
        ? "true"
        : "false",
    );
    li.setAttribute(
      "data-task",
      next
        ? "checked"
        : "unchecked",
    );
    this.emitMarkdown();
  }

  syncToolbar() {
    const root = this.editorEl();
    const formats = !this.isSourceMode() && root
      ? queryFormats(root)
      : {};
    this.querySelectorAll(".janus-rich-toolbar [data-format]").forEach(
      (button) => {
        const key = button.getAttribute("data-format");
        const on = key === "source"
          ? this.isSourceMode()
          : Boolean(formats[key]);
        button.setAttribute(
          "aria-pressed",
          on
            ? "true"
            : "false",
        );
      },
    );
    const level = String(formats.headingLevel || 0);
    this.syncMenu(
      "heading",
      `H${formats.headingLevel || ""}`,
      (value) => value === level,
    );
    const language = formats.codeLanguage;
    const languageMenu = this.querySelector(".janus-rich-menu[data-menu=\"language\"]");
    if (languageMenu) {
      languageMenu.hidden = language == null;
    }
    this.syncMenu(
      "language",
      language || "",
      (value) => value === (resolveLanguageId(language) || "plain"),
    );
    const table = formats.table;
    const tableMenu = this.querySelector(".janus-rich-menu[data-menu=\"table\"]");
    if (tableMenu) {
      tableMenu.hidden = !table;
      this.querySelector("[data-insert-table]").hidden = Boolean(table);
    }
    this.syncMenu(
      "table",
      null,
      (value) => value === (table?.align || "none"),
      (value) => Boolean(table?.header) && (value === "rowAbove" || value === "deleteRow"),
    );
    if (this._openMenu) {
      this.positionOpenMenu();
    }
  }

  syncMenu(menu, label, isChecked, isDisabled = () => false) {
    const wrapper = this.querySelector(`.janus-rich-menu[data-menu="${menu}"]`);
    if (!wrapper) {
      return;
    }
    const labelEl = wrapper.querySelector("[data-menu-label]");
    if (labelEl) {
      labelEl.textContent = label;
    }
    const open = this._openMenu === menu;
    wrapper.querySelector("[data-menu-trigger]").setAttribute(
      "aria-expanded",
      open
        ? "true"
        : "false",
    );
    const panel = wrapper.querySelector("[role=\"menu\"]");
    panel.hidden = !open;
    if (!open) {
      this.clearMenuPosition(panel);
    }
    wrapper.querySelectorAll("[role^=\"menuitem\"]").forEach(
      (item) => {
        const value = item.getAttribute("data-value");
        item.disabled = isDisabled(value);
        if (item.hasAttribute("aria-checked")) {
          item.setAttribute(
            "aria-checked",
            isChecked(value)
              ? "true"
              : "false",
          );
        }
      },
    );
  }

  clearMenuPosition(panel) {
    if (!panel) {
      return;
    }
    panel.style.position = "";
    panel.style.left = "";
    panel.style.top = "";
    panel.style.bottom = "";
    panel.style.zIndex = "";
  }

  positionOpenMenu() {
    if (!this._openMenu) {
      return;
    }
    const wrapper = this.querySelector(`.janus-rich-menu[data-menu="${this._openMenu}"]`);
    const panel = wrapper?.querySelector("[role=\"menu\"]");
    const trigger = wrapper?.querySelector("[data-menu-trigger]");
    if (
      !panel ||
      panel.hidden ||
      !trigger
    ) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const menuHeight = Math.min(
      panel.scrollHeight > 0
        ? panel.scrollHeight
        : MENU_MAX_HEIGHT_PX,
      MENU_MAX_HEIGHT_PX,
    );
    const roomBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const roomAbove = rect.top - MENU_GAP;
    const openUpwards = roomBelow < menuHeight && roomAbove > roomBelow;
    Object.assign(
      panel.style,
      {
        position: "fixed",
        left: `${rect.left}px`,
        zIndex: MENU_Z_INDEX,
        top: openUpwards
          ? "auto"
          : `${rect.bottom + MENU_GAP}px`,
        bottom: openUpwards
          ? `${window.innerHeight - rect.top + MENU_GAP}px`
          : "auto",
      },
    );
  }

  attachMenuListeners() {
    if (this._menuListeners) {
      return;
    }
    this._menuListeners = true;
    window.addEventListener(
      "resize",
      this._onRepositionMenu,
    );
    document.addEventListener(
      "scroll",
      this._onRepositionMenu,
      true,
    );
  }

  detachMenuListeners() {
    if (!this._menuListeners) {
      return;
    }
    this._menuListeners = false;
    window.removeEventListener(
      "resize",
      this._onRepositionMenu,
    );
    document.removeEventListener(
      "scroll",
      this._onRepositionMenu,
      true,
    );
  }

  toggleMenu(menu, fromKeyboard) {
    this._openMenu = this._openMenu === menu
      ? null
      : menu;
    this.syncToolbar();
    if (this._openMenu) {
      this.attachMenuListeners();
      this.positionOpenMenu();
      if (fromKeyboard) {
        const items = [
          ...this.querySelectorAll(`.janus-rich-menu[data-menu="${menu}"] ${MENU_ITEMS}`),
        ];
        (items.find(
          (item) => item.getAttribute("aria-checked") === "true",
        ) || items[0])?.focus();
      }
    } else {
      this.detachMenuListeners();
    }
  }

  closeMenu({
    focusTrigger = false,
  } = {}) {
    const menu = this._openMenu;
    this._openMenu = null;
    this.detachMenuListeners();
    this.syncToolbar();
    if (
      focusTrigger &&
      menu
    ) {
      this.querySelector(`.janus-rich-menu[data-menu="${menu}"] [data-menu-trigger]`)?.focus();
    }
  }

  onMenuKeyDown(event) {
    const items = [
      ...event.currentTarget.querySelectorAll(MENU_ITEMS),
    ];
    const index = items.indexOf(document.activeElement);
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      const step = event.key === "ArrowDown"
        ? 1
        : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.closeMenu(
        {
          focusTrigger: true,
        },
      );
    } else if (event.key === "Tab") {
      this.closeMenu();
    }
  }

  chooseFromMenu(menu, value) {
    this.closeMenu();
    if (menu === "heading") {
      const level = Number(value);
      this.run(level
        ? (root) => commands.setHeading(
            root,
            level,
          )
        : commands.setParagraph);
    } else if (menu === "language") {
      this.run(
        (root) => commands.setCodeLanguage(
          root,
          value,
        ),
      );
    } else if (menu === "table") {
      this.run(TABLE_COMMANDS[value]);
    }
  }

  toggleLink() {
    const root = this.editorEl();
    if (
      root &&
      queryFormats(root).link
    ) {
      this.run(commands.unlink);
    } else {
      this.showPopover("link");
    }
  }

  run(command) {
    const root = this.editorEl();
    if (
      !root ||
      (
        this.props &&
        (
          this.props.disabled ||
          this.props.readOnly
        )
      )
    ) {
      return;
    }
    command(root);
    normalize(root);
    highlightCodeBlocks(root);
    this.emitMarkdown();
  }

  onKeyDown(event) {
    const root = this.editorEl();
    if (
      !root ||
      (
        this.props &&
        (
          this.props.disabled ||
          this.props.readOnly
        )
      )
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    const mod = (event.ctrlKey || event.metaKey) && !event.altKey;
    if (
      mod &&
      (
        key === "z" ||
        key === "y"
      )
    ) {
      event.preventDefault();
      if (
        key === "y" ||
        event.shiftKey
      ) {
        this.redo();
      } else {
        this.undo();
      }
      return;
    }
    if (
      mod &&
      !event.shiftKey &&
      (
        key === "b" ||
        key === "i"
      )
    ) {
      event.preventDefault();
      this.run(key === "b"
        ? commands.toggleBold
        : commands.toggleItalic);
      return;
    }
    const handled = (event.key === "Enter" && (handleTableEnter(root) || (!event.shiftKey && (handleCodeEnter(root) || handleListEnter(root))))) || (event.key === "Backspace" && handleListBackspace(root)) || (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey && (moveToCell(
      root,
      event.shiftKey,
    ) || (event.shiftKey
      ? outdentItem(root)
      : indentItem(root))));
    if (handled) {
      event.preventDefault();
      normalize(root);
      highlightCodeBlocks(root);
      this.emitMarkdown();
    }
  }

  onInput(event) {
    const code = !event.isComposing && codeAtCaret(this.editorEl());
    if (code) {
      highlightCode(code);
    }
    this.emitMarkdown(
      {
        typing: /^(insert|delete)/.test(event.inputType || "insert"),
      },
    );
  }

  captureEditorSelection() {
    this._savedRange = null;
    this._popoverSnapshot = null;
    const root = this.editorEl();
    if (!root) {
      return;
    }
    this._popoverSnapshot = this.currentMarkdown();
    const offsets = this.selectionOffsets();
    if (offsets) {
      const text = root.ownerDocument.getSelection().toString();
      this._savedRange = {
        ...offsets,
        text,
      };
    }
  }

  restoreEditorSelection() {
    try {
      this.selectOffsets(this._savedRange);
    } catch {
      this._savedRange = null;
    }
  }

  syncPopover() {
    const panel = this.querySelector(".janus-rich-popover");
    if (!panel) {
      return;
    }
    const kind = this._popover;
    const open = kind === "link" || kind === "image";
    panel.classList.toggle(
      "is-open",
      open,
    );
    if (!open) {
      return;
    }
    const url = panel.querySelector("[data-field=\"url\"]");
    const extra = panel.querySelector("[data-field=\"extra\"]");
    const apply = panel.querySelector("[data-action=\"apply\"]");
    if (url) {
      url.setAttribute(
        "aria-label",
        kind === "image"
          ? "Image URL"
          : "Link URL",
      );
    }
    if (extra) {
      extra.placeholder = kind === "image"
        ? "Alt text"
        : "Label";
      extra.setAttribute(
        "aria-label",
        kind === "image"
          ? "Image alt"
          : "Link label",
      );
    }
    if (apply) {
      apply.setAttribute(
        "aria-label",
        kind === "image"
          ? "Apply image"
          : "Apply link",
      );
      apply.textContent = kind === "image"
        ? "Apply image"
        : "Apply link";
    }
  }

  showPopover(kind) {
    this.captureEditorSelection();
    this._popover = kind;
    this.syncPopover();
    const panel = this.querySelector(".janus-rich-popover");
    if (!panel) {
      return;
    }
    const url = panel.querySelector("[data-field=\"url\"]");
    const extra = panel.querySelector("[data-field=\"extra\"]");
    const extraValue = kind === "link"
      ? this._savedRange?.text || ""
      : "";
    if (url) {
      url.value = "";
      url.focus();
      url.select();
    }
    if (extra) {
      extra.value = extraValue;
    }
  }

  hidePopover() {
    this._popover = null;
    this._savedRange = null;
    this._popoverSnapshot = null;
    this.syncPopover();
  }

  applyPopover() {
    const panel = this.querySelector(".janus-rich-popover");
    if (!panel) {
      return;
    }
    const kind = this._popover;
    const url = panel.querySelector("[data-field=\"url\"]")?.value || "";
    const extra = panel.querySelector("[data-field=\"extra\"]")?.value || "";
    const saved = this._savedRange;
    const snapshot = this._popoverSnapshot;
    const root = this.editorEl();
    // Focus can morph-wipe the editor; rebuild from the open-time snapshot,
    // then wrap by character offsets so we never depend on a live selection.
    if (root) {
      root.focus();
      if (snapshot != null) {
        root.replaceChildren(astToFragment(parseMarkdown(snapshot)));
        this._syncedValue = snapshot;
        const last = root.lastElementChild;
        if (
          last &&
          /^(TABLE|UL|OL|PRE|BLOCKQUOTE|HR)$/.test(last.tagName)
        ) {
          const p = root.ownerDocument.createElement("p");
          p.appendChild(root.ownerDocument.createElement("br"));
          root.appendChild(p);
        }
      }
    }
    if (kind === "image") {
      this.restoreEditorSelection();
      this.run(
        (editor) => commands.applyImage(
          editor,
          url,
          extra,
        ),
      );
    } else if (kind === "link") {
      if (
        saved &&
        saved.start !== saved.end
      ) {
        this.run(
          (editor) => commands.applyLinkAtOffsets(
            editor,
            url,
            extra,
            saved.start,
            saved.end,
          ),
        );
      } else {
        this.restoreEditorSelection();
        this.run(
          (editor) => commands.applyLink(
            editor,
            url,
            extra,
          ),
        );
      }
    }
    this.hidePopover();
  }

  onPaste(event) {
    const root = this.editorEl();
    if (
      !root ||
      (
        this.props &&
        (
          this.props.disabled ||
          this.props.readOnly
        )
      )
    ) {
      return;
    }
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") || "";
    const inCode = Boolean(codeAtCaret(root));
    const fragment = inCode
      ? root.ownerDocument.createTextNode(text)
      : astToFragment(parseMarkdown(text));
    const selection = root.ownerDocument.getSelection();
    if (
      !selection ||
      !selection.rangeCount
    ) {
      root.appendChild(fragment);
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(fragment);
      range.collapse(false);
    }
    normalize(root);
    highlightCodeBlocks(root);
    this.emitMarkdown();
  }

  receiveProps(props, childElements) {
    this.componentWillReceiveProps && this.componentWillReceiveProps(
      props,
      this.state,
    );
    const next = props && props.value != null
      ? String(props.value)
      : "";
    const mounted = Boolean(this.editorEl() || this.querySelector("janus-code-editor"));
    this.props = props;
    this.childElements = childElements;
    if (
      mounted &&
      next === this._syncedValue
    ) {
      this.applyFlags();
      this.syncToolbar();
      return;
    }
    if (this.isSourceMode()) {
      this._syncedValue = next;
      render(
        this.shadowRoot || this,
        this.renderWithStyle(),
      );
      queueMicrotask(
        () => {
          this.applyFlags();
          this.syncToolbar();
        },
      );
      return;
    }
    render(
      this.shadowRoot || this,
      this.renderWithStyle(),
    );
    queueMicrotask(
      () => this.syncEditor(),
    );
  }

  componentDidMount() {
    this.syncEditor();
    document.addEventListener(
      "selectionchange",
      this._onSelectionChange,
    );
    document.addEventListener(
      "mousedown",
      this._onDocumentMouseDown,
      true,
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      "selectionchange",
      this._onSelectionChange,
    );
    document.removeEventListener(
      "mousedown",
      this._onDocumentMouseDown,
      true,
    );
    this.detachMenuListeners();
    if (this._boundEditor) {
      this._boundEditor.removeEventListener(
        "mousedown",
        this._onTaskMouseDown,
        true,
      );
      this._boundEditor.removeEventListener(
        "click",
        this._onTaskClick,
        true,
      );
      this._boundEditor.removeEventListener(
        "beforeinput",
        this._onBeforeInput,
      );
      this._boundEditor = null;
    }
  }

  render() {
    ensureRichStyles();
    const {
      disabled,
      readOnly,
      color,
      placeholder,
    } = this.props || {};
    const locked = Boolean(disabled || readOnly);
    const sourceMode = this.isSourceMode();
    const formatLocked = locked || sourceMode;
    const markdown = this.syncedOrPropValue();

    const baseField = theme.field(color);
    const {
      ":focus": _focus,
      ...fieldRest
    } = baseField;
    const shell = util.expand(
      fieldRest,
      {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "6px",
        minHeight: "10em",
        resize: "both",
        overflow: "hidden",
        ":focus-within": {
          outline: "none",
          borderColor: "var(--janus-focus)",
          boxShadow: `0 0 0 3px ${theme.mix("var(--janus-focus)", 35, "transparent")}`,
        },
      },
    );

    const bodyStyle = {
      flexGrow: "1",
      minHeight: "0",
      overflow: "auto",
    };

    const editorStyle = {
      minHeight: "6em",
      outline: "none",
      font: "inherit",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      color: "var(--janus-text)",
      padding: "4px 6px",
      ":empty:before": {
        content: "attr(data-placeholder)",
        color: "var(--janus-text-muted)",
        pointerEvents: "none",
      },
    };

    const fieldInput = {
      flexGrow: "1",
      minWidth: "10ch",
      margin: "0",
      padding: "4px 8px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "var(--janus-border)",
      borderRadius: "var(--janus-radius)",
      backgroundColor: "var(--janus-surface)",
      color: "var(--janus-text)",
      font: "inherit",
      fontSize: "0.8125rem",
    };

    const surface = sourceMode
      ? html`
          <CodeEditor
            class="janus-rich-source"
            language="markdown"
            value=${markdown}
            placeholder=${placeholder}
            disabled=${disabled}
            readOnly=${readOnly}
            onChange=${(next) => this.emitSourceMarkdown(next)}
            style=${{
              margin: "0",
              minHeight: "6em",
            }}
          />
        `
      : html`
          <div
            class="janus-rich-editor"
            role="textbox"
            aria-multiline="true"
            style=${editorStyle}
            onInput=${(event) => this.onInput(event)}
            onKeyDown=${(event) => this.onKeyDown(event)}
            onPaste=${(event) => this.onPaste(event)}
          />
        `;

    return html`
      <div
        style=${shell}
        class="janus-rich-shell"
      >
        <Toolbar
          class="janus-rich-toolbar"
          label="Formatting"
          style=${{
            flexShrink: "0",
            width: "100%",
          }}
        >${toolbarBtn(
            "Bold",
            "bold",
            () => this.run(commands.toggleBold),
            formatLocked,
            glyph("B"),
          )}${toolbarBtn(
            "Italic",
            "italic",
            () => this.run(commands.toggleItalic),
            formatLocked,
            glyph("I"),
          )}${toolbarBtn(
            "Strikethrough",
            "strike",
            () => this.run(commands.toggleStrikethrough),
            formatLocked,
            glyph("S"),
          )}${toolbarBtn(
            "Inline code",
            "code",
            () => this.run(commands.toggleInlineCode),
            formatLocked,
            glyph("</>"),
          )}${toolbarMenu(
            {
              label: "Heading",
              menu: "heading",
              items: HEADING_ITEMS,
              locked: formatLocked,
              onToggle: (menu, fromKeyboard) => this.toggleMenu(
                menu,
                fromKeyboard,
              ),
              onChoose: (menu, value) => this.chooseFromMenu(
                menu,
                value,
              ),
              onKeyDown: (event) => this.onMenuKeyDown(event),
            },
          )}${toolbarBtn(
            "Bullet list",
            "bulletList",
            () => this.run(commands.toggleBulletList),
            formatLocked,
            glyph("•"),
          )}${toolbarBtn(
            "Numbered list",
            "orderedList",
            () => this.run(commands.toggleOrderedList),
            formatLocked,
            glyph("1."),
          )}${toolbarBtn(
            "Task list",
            "taskList",
            () => this.run(commands.toggleTaskList),
            formatLocked,
            instantiateIcon(
              CheckIcon,
              {
                size: ICON_SIZE,
              },
            ),
          )}${toolbarBtn(
            "Quote",
            "quote",
            () => this.run(commands.toggleBlockquote),
            formatLocked,
            glyph("“"),
          )}${toolbarBtn(
            "Code block",
            null,
            () => this.run(commands.insertFencedCode),
            formatLocked,
            glyph("{ }"),
          )}${toolbarMenu(
            {
              label: "Code language",
              menu: "language",
              items: LANGUAGE_ITEMS,
              locked: formatLocked,
              onToggle: (menu, fromKeyboard) => this.toggleMenu(
                menu,
                fromKeyboard,
              ),
              onChoose: (menu, value) => this.chooseFromMenu(
                menu,
                value,
              ),
              onKeyDown: (event) => this.onMenuKeyDown(event),
            },
          )}${toolbarBtn(
            "Horizontal rule",
            null,
            () => this.run(commands.insertHorizontalRule),
            formatLocked,
            glyph("—"),
          )}${toolbarBtn(
            "Table",
            null,
            () => this.run(
              (root) => commands.insertTable(
                root,
                2,
                2,
              ),
            ),
            formatLocked,
            glyph("▦"),
            {
              "data-insert-table": "",
            },
          )}${toolbarMenu(
            {
              label: "Edit table",
              menu: "table",
              icon: glyph("▦"),
              items: TABLE_ITEMS,
              locked: formatLocked,
              onToggle: (menu, fromKeyboard) => this.toggleMenu(
                menu,
                fromKeyboard,
              ),
              onChoose: (menu, value) => this.chooseFromMenu(
                menu,
                value,
              ),
              onKeyDown: (event) => this.onMenuKeyDown(event),
            },
          )}${toolbarBtn(
            "Link",
            "link",
            () => this.toggleLink(),
            formatLocked,
            instantiateIcon(
              LinkIcon,
              {
                size: ICON_SIZE,
              },
            ),
          )}${toolbarBtn(
            "Image",
            null,
            () => this.showPopover("image"),
            formatLocked,
            instantiateIcon(
              ImageIcon,
              {
                size: ICON_SIZE,
              },
            ),
          )}${toolbarBtn(
            "Markdown",
            "source",
            () => this.toggleSourceMode(),
            locked,
            instantiateIcon(
              MarkdownIcon,
              {
                size: ICON_SIZE,
              },
            ),
          )}</Toolbar>
        <div
          class="janus-rich-popover"
          style=${{
            flexShrink: "0",
          }}
        >
          <input
            data-field="url"
            type="url"
            style=${fieldInput}
          />
          <input
            data-field="extra"
            type="text"
            style=${fieldInput}
          />
          <button
            type="button"
            data-action="apply"
            aria-label="Apply link"
            style=${{
              padding: "4px 10px",
              borderRadius: "var(--janus-radius)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--janus-border)",
              backgroundColor: "var(--janus-accent)",
              color: "var(--janus-bg)",
              font: "inherit",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
            onMouseDown=${(event) => event.preventDefault()}
            onClick=${() => this.applyPopover()}
          >Apply link</button>
          <button
            type="button"
            aria-label="Cancel"
            style=${{
              padding: "4px 10px",
              borderRadius: "var(--janus-radius)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--janus-border)",
              backgroundColor: "transparent",
              color: "var(--janus-text)",
              font: "inherit",
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
            onMouseDown=${(event) => event.preventDefault()}
            onClick=${() => this.hidePopover()}
          >Cancel</button>
        </div>
        <div
          class="janus-rich-body"
          style=${bodyStyle}
        >${surface}</div>
      </div>
    `;
  }
}

Component.register(RichTextarea);
