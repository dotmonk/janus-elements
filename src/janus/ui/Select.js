import Component, {
  html,
  render,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  animatedIconSlot,
  iconHoverHandlers,
} from "./createIcon.js";
import {
  createLatestAsync,
} from "./latestAsync.js";
import ChevronIcon from "./icon/chevron.js";
import CloseIcon from "./icon/close.js";
import "./Button.js";
import "./Spinner.js";

let selectId = 0;
let openSelect = null;

const MENU_MAX_HEIGHT = 240;
const MENU_GAP = 4;
const MENU_Z_INDEX = "10000";
const TYPEAHEAD_RESET_MS = 500;
const LOAD_DEBOUNCE_MS = 300;
const TRIGGER_ICON_SIZE = 16;
const CHIP_ICON_SIZE = 14;

const isGroup = (entry) => entry && Array.isArray(entry.options) && !("value" in entry);

const flattenEntries = (entries = []) => {
  const leaves = [];
  entries.forEach(
    (entry) => {
      if (isGroup(entry)) {
        (entry.options || []).forEach(
          (option) => leaves.push(option),
        );
      } else if (
        entry &&
        entry.value !== undefined
      ) {
        leaves.push(entry);
      }
    },
  );
  return leaves;
};

const optionsStyle = {
  margin: "0px",
  padding: "4px",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  backgroundColor: "var(--janus-raised)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--janus-border)",
  borderRadius: "var(--janus-radius)",
  boxShadow: "var(--janus-shadow)",
  maxHeight: `${MENU_MAX_HEIGHT}px`,
  overflowX: "hidden",
  overflowY: "auto",
  boxSizing: "border-box",
};

const optionStyle = (tone, selected, active, disabled) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 14px",
  margin: "0",
  borderRadius: "var(--janus-radius)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "transparent",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: "500",
  lineHeight: "1.25",
  cursor: disabled
    ? "not-allowed"
    : "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  opacity: disabled
    ? "0.45"
    : "1",
  color: tone,
  backgroundColor: !disabled && (selected || active)
    ? theme.mix(
        tone,
        16,
        "var(--janus-raised)",
      )
    : "transparent",
  ":hover": disabled
    ? {}
    : {
        backgroundColor: theme.mix(
          tone,
          16,
          "var(--janus-raised)",
        ),
      },
});

const groupHeaderStyle = {
  padding: "6px 14px 2px",
  margin: "0",
  color: "var(--janus-text-muted)",
  fontSize: "0.75rem",
  fontWeight: "600",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  userSelect: "none",
};

const noOptionsStyle = {
  padding: "8px 14px",
  margin: "0",
  color: "var(--janus-text-muted)",
  fontSize: "0.875rem",
};

const loadingRowStyle = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  margin: "0",
};

const controlRowStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  margin: "2px",
  position: "relative",
};

const multiControlStyle = (color) => util.expand(
  theme.field(color),
  {
    display: "inline-flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4px",
    margin: "2px",
    minWidth: "12ch",
    maxWidth: "100%",
    cursor: "text",
    paddingTop: "4px",
    paddingBottom: "4px",
  },
);

const chipStyle = (tone) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  maxWidth: "100%",
  padding: "2px 4px 2px 8px",
  borderRadius: "var(--janus-radius)",
  backgroundColor: theme.mix(
    tone,
    16,
    "var(--janus-raised)",
  ),
  color: tone,
  fontSize: "0.8125rem",
  fontWeight: "500",
  lineHeight: "1.25",
});

const chipRemoveStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  padding: "0 2px",
  borderWidth: "0",
  borderRadius: "var(--janus-radius)",
  backgroundColor: "transparent",
  color: "inherit",
  lineHeight: "0",
  cursor: "pointer",
  ":hover": {
    backgroundColor: "color-mix(in oklab, currentColor 12%, transparent)",
  },
};

const multiInputStyle = {
  flexGrow: "1",
  minWidth: "8ch",
  margin: "0",
  padding: "2px 4px",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: "inherit",
  font: "inherit",
  fontSize: "0.875rem",
  outline: "none",
  "::placeholder": {
    color: "var(--janus-text-muted)",
  },
};

const searchControlStyle = (color) => util.expand(
  theme.field(color),
  {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    margin: "2px",
    minWidth: "12ch",
    cursor: "text",
    paddingTop: "4px",
    paddingBottom: "4px",
    paddingLeft: "8px",
    paddingRight: "6px",
  },
);

const staticControlStyle = (color) => util.expand(
  searchControlStyle(color),
  {
    // Match native <input> default size (~20ch) so this doesn't look
    // shrunk next to searchable Selects.
    minWidth: "20ch",
    maxWidth: "100%",
    cursor: "pointer",
  },
);

const searchFieldInputStyle = {
  flexGrow: "1",
  minWidth: "6ch",
  margin: "0",
  padding: "2px 0",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: "inherit",
  font: "inherit",
  fontSize: "0.875rem",
  outline: "none",
  "::placeholder": {
    color: "var(--janus-text-muted)",
  },
};

const staticValueStyle = (muted) => ({
  flexGrow: "1",
  minWidth: "6ch",
  margin: "0",
  padding: "2px 0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: muted
    ? "var(--janus-text-muted)"
    : "var(--janus-text)",
});

const triggerIconSlotStyle = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: "0",
  lineHeight: "0",
  color: "var(--janus-text-muted)",
};

const ensureMenuRoot = () => {
  let root = document.getElementById("janus-ui-select-menu");
  if (!root) {
    root = document.createElement("div");
    root.id = "janus-ui-select-menu";
    document.body.appendChild(root);
  }
  return root;
};

const removeMenuRootIfEmpty = () => {
  const root = document.getElementById("janus-ui-select-menu");
  if (
    root &&
    !root.childElementCount
  ) {
    root.remove();
  }
};

class Select extends Component {

  constructor() {
    super();
    selectId += 1;
    this._selectId = selectId;
    this._typeahead = "";
    this._typeaheadTimer = null;
    this._menuOwner = false;
    this._latestLoad = createLatestAsync(
      {
        debounceMs: LOAD_DEBOUNCE_MS,
      },
    );
    this._optionsCache = new Map();
    this.state = {
      expanded: false,
      activeIndex: -1,
      filter: "",
      asyncOptions: [],
      loading: false,
      triggerHover: false,
      clearHover: false,
      chipHover: null,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionMenu();
  }

  setChipHover(chipHover) {
    if (this.state.chipHover === chipHover) {
      return;
    }
    this.setState(
      {
        chipHover,
      },
    );
  }

  headIconNode(animated) {
    const {
      headIcon,
    } = this.props || {};
    return animatedIconSlot(
      headIcon,
      {
        size: TRIGGER_ICON_SIZE,
        animated,
        style: triggerIconSlotStyle,
      },
    );
  }

  tailIconNode(animated) {
    const {
      tailIcon,
    } = this.props || {};
    if (tailIcon === null) {
      return "";
    }
    return animatedIconSlot(
      tailIcon === undefined
        ? ChevronIcon
        : tailIcon,
      {
        size: TRIGGER_ICON_SIZE,
        animated,
        style: triggerIconSlotStyle,
      },
    );
  }

  closeIcon(size, animated) {
    return animatedIconSlot(
      CloseIcon,
      {
        size,
        animated,
        style: triggerIconSlotStyle,
      },
    );
  }

  listboxId() {
    return `janus-select-list-${this._selectId}`;
  }

  optionId(index) {
    return `janus-select-option-${this._selectId}-${index}`;
  }

  isMulti() {
    return Boolean(this.props && this.props.multi);
  }

  isSearchable() {
    return this.props.searchable !== false;
  }

  isCreatable() {
    return Boolean(this.props && this.props.creatable);
  }

  hasLoadOptions() {
    return typeof (this.props && this.props.loadOptions) === "function";
  }

  isLoading() {
    return Boolean((this.props && this.props.loading) || this.state.loading);
  }

  menuSourceOptions() {
    if (!this.hasLoadOptions()) {
      return this.props.options || [];
    }
    const {
      defaultOptions,
    } = this.props || {};
    if (this.state.asyncOptions.length) {
      return this.state.asyncOptions;
    }
    if (Array.isArray(defaultOptions)) {
      return defaultOptions;
    }
    return this.state.asyncOptions;
  }

  flatOptions() {
    const byValue = new Map();
    const add = (entries) => {
      flattenEntries(entries).forEach(
        (option) => {
          byValue.set(
            option.value,
            option,
          );
        },
      );
    };
    add(this.props.options || []);
    const {
      defaultOptions,
    } = this.props || {};
    if (Array.isArray(defaultOptions)) {
      add(defaultOptions);
    }
    add(this.state.asyncOptions || []);
    return [
      ...byValue.values(),
    ];
  }

  selectedValues() {
    const {
      value,
    } = this.props || {};
    if (this.isMulti()) {
      return Array.isArray(value)
        ? value
        : [];
    }
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }
    return [
      value,
    ];
  }

  selectedOptions() {
    const leaves = this.flatOptions();
    const byValue = new Map(leaves.map(
      (option) => [
        option.value,
        option,
      ],
    ));
    return this.selectedValues().map(
      (value) => byValue.get(value) || {
        name: String(value),
        value,
      },
    );
  }

  optionLabel(option, meta) {
    const {
      renderOption,
    } = this.props || {};
    if (typeof renderOption === "function") {
      return renderOption(
        option,
        meta,
      );
    }
    return option.name;
  }

  valueContent(option) {
    const {
      renderValue,
    } = this.props || {};
    if (typeof renderValue === "function") {
      return renderValue(option);
    }
    return option.name;
  }

  valueText(option) {
    const content = this.valueContent(option);
    if (
      typeof content === "string" ||
      typeof content === "number"
    ) {
      return String(content);
    }
    return option.name || "";
  }

  clearLoadTimer() {
    this._latestLoad.cancel();
  }

  applyCachedOptions(key) {
    this.clearLoadTimer();
    this.setMenuState(
      {
        asyncOptions: this._optionsCache.get(key),
        loading: false,
        activeIndex: 0,
      },
    );
  }

  scheduleLoad(input) {
    if (!this.hasLoadOptions()) {
      return;
    }
    const key = String(input || "");
    const {
      cacheOptions,
    } = this.props || {};
    if (
      cacheOptions &&
      this._optionsCache.has(key)
    ) {
      this.applyCachedOptions(key);
      return;
    }
    // Show loading during debounce so the menu never flashes "No options".
    if (!this.state.loading) {
      this.setMenuState(
        {
          loading: true,
        },
      );
    }
    this._latestLoad.schedule(
      () => this.fetchOptions(key),
    ).then(
      (next) => this.receiveOptions(next),
      () => this.receiveOptionsError(),
    );
  }

  runLoad(input) {
    if (!this.hasLoadOptions()) {
      return;
    }
    const key = String(input || "");
    const {
      cacheOptions,
    } = this.props || {};
    if (
      cacheOptions &&
      this._optionsCache.has(key)
    ) {
      this.applyCachedOptions(key);
      return;
    }
    this.setMenuState(
      {
        loading: true,
      },
    );
    this._latestLoad.run(
      () => this.fetchOptions(key),
    ).then(
      (next) => this.receiveOptions(next),
      () => this.receiveOptionsError(),
    );
  }

  fetchOptions(key) {
    const {
      cacheOptions,
      loadOptions,
    } = this.props || {};
    return Promise.resolve(loadOptions(key)).then(
      (options) => {
        const next = Array.isArray(options)
          ? options
          : [];
        if (cacheOptions) {
          this._optionsCache.set(
            key,
            next,
          );
        }
        return next;
      },
    );
  }

  receiveOptions(next) {
    if (next === undefined) {
      return;
    }
    this.setMenuState(
      {
        asyncOptions: next,
        loading: false,
        activeIndex: 0,
      },
    );
  }

  receiveOptionsError() {
    this.setMenuState(
      {
        loading: false,
      },
    );
  }

  singleSelected() {
    if (this.isMulti()) {
      return null;
    }
    const values = this.selectedValues();
    if (!values.length) {
      return null;
    }
    return this.selectedOptions()[0] || null;
  }

  matchesFilter(option) {
    // Async results are already filtered by loadOptions.
    if (this.hasLoadOptions()) {
      return true;
    }
    if (!this.isSearchable()) {
      return true;
    }
    const filter = (this.state.filter || "").trim().toLowerCase();
    if (!filter) {
      return true;
    }
    return (option.name || "").toLowerCase().includes(filter);
  }

  visibleLeafOptions() {
    const selected = new Set(this.selectedValues());
    return flattenEntries(this.menuSourceOptions()).filter(
      (option) => {
        if (
          this.isMulti() &&
          selected.has(option.value)
        ) {
          return false;
        }
        return this.matchesFilter(option);
      },
    );
  }

  createInput() {
    return (this.state.filter || "").trim();
  }

  canCreate() {
    if (
      !this.isCreatable() ||
      !this.isSearchable()
    ) {
      return false;
    }
    const trimmed = this.createInput();
    if (!trimmed) {
      return false;
    }
    const lower = trimmed.toLowerCase();
    if (this.flatOptions().some(
      (option) => (option.name || "").toLowerCase() === lower,
    )) {
      return false;
    }
    if (this.selectedValues().some(
      (value) => String(value).toLowerCase() === lower,
    )) {
      return false;
    }
    return true;
  }

  createLabel() {
    const input = this.createInput();
    const {
      formatCreateLabel,
    } = this.props || {};
    if (typeof formatCreateLabel === "function") {
      return formatCreateLabel(input);
    }
    return `Create "${input}"`;
  }

  // Navigable rows: enabled visible options + optional create action.
  navItems() {
    const items = this.visibleLeafOptions().filter(
      (option) => !option.disabled,
    ).map(
      (option) => ({
        kind: "option",
        option,
      }),
    );
    if (this.canCreate()) {
      items.push(
        {
          kind: "create",
          value: this.createInput(),
        },
      );
    }
    return items;
  }

  // Visual menu rows including group headers and disabled options.
  menuRows() {
    const options = this.menuSourceOptions();
    const selected = new Set(this.selectedValues());
    const rows = [];
    const nav = this.navItems();
    const navIndexFor = (option) => nav.findIndex(
      (item) => item.kind === "option" && item.option.value === option.value,
    );

    const pushOption = (option) => {
      if (
        this.isMulti() &&
        selected.has(option.value)
      ) {
        return;
      }
      if (!this.matchesFilter(option)) {
        return;
      }
      rows.push(
        {
          kind: "option",
          option,
          navIndex: option.disabled
            ? -1
            : navIndexFor(option),
        },
      );
    };

    options.forEach(
      (entry) => {
        if (isGroup(entry)) {
          const children = (entry.options || []).filter(
            (option) => {
              if (
                this.isMulti() &&
                selected.has(option.value)
              ) {
                return false;
              }
              return this.matchesFilter(option);
            },
          );
          if (!children.length) {
            return;
          }
          rows.push(
            {
              kind: "group",
              name: entry.name,
            },
          );
          children.forEach(pushOption);
          return;
        }
        if (
          entry &&
          entry.value !== undefined
        ) {
          pushOption(entry);
        }
      },
    );

    if (this.canCreate()) {
      const createIndex = nav.findIndex(
        (item) => item.kind === "create",
      );
      rows.push(
        {
          kind: "create",
          label: this.createLabel(),
          value: this.createInput(),
          navIndex: createIndex,
        },
      );
    }

    return rows;
  }

  clearTypeahead() {
    this._typeahead = "";
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
  }

  scheduleTypeaheadReset() {
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
    }
    this._typeaheadTimer = setTimeout(
      () => {
        this._typeahead = "";
        this._typeaheadTimer = null;
      },
      TYPEAHEAD_RESET_MS,
    );
  }

  jumpToTypeahead(character) {
    const items = this.navItems().filter(
      (item) => item.kind === "option",
    );
    if (!items.length) {
      return;
    }
    this._typeahead += character;
    this.scheduleTypeaheadReset();
    const buffer = this._typeahead.toLowerCase();
    const first = buffer[0];
    const isCycle = buffer.length > 1 && [
      ...buffer,
    ].every(
      (char) => char === first,
    );
    const {
      activeIndex,
    } = this.state;
    const optionNavIndexes = this.navItems().map(
      (item, index) => item.kind === "option"
        ? index
        : -1,
    ).filter(
      (index) => index >= 0,
    );
    let matchNav = -1;
    if (isCycle) {
      const currentPos = Math.max(
        0,
        optionNavIndexes.indexOf(Math.max(
          activeIndex,
          0,
        )),
      );
      for (let step = 1; step <= optionNavIndexes.length; step += 1) {
        const navIndex = optionNavIndexes[(currentPos + step) % optionNavIndexes.length];
        const item = this.navItems()[navIndex];
        if ((item.option.name || "").toLowerCase().startsWith(first)) {
          matchNav = navIndex;
          break;
        }
      }
    } else {
      matchNav = this.navItems().findIndex(
        (item) => item.kind === "option" && (item.option.name || "").toLowerCase().startsWith(buffer),
      );
    }
    if (matchNav >= 0) {
      this.setMenuState(
        {
          activeIndex: matchNav,
        },
      );
    }
  }

  setMenuState(partial) {
    this.setState(partial);
    this.syncMenu();
  }

  clampActiveIndex(index) {
    const items = this.navItems();
    if (!items.length) {
      return -1;
    }
    if (index < 0) {
      return 0;
    }
    return Math.min(
      index,
      items.length - 1,
    );
  }

  expand(activeIndex = 0) {
    const {
      value,
    } = this.props || {};
    const items = this.navItems();
    let nextActive = activeIndex;
    if (
      !this.isMulti() &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const selectedNav = items.findIndex(
        (item) => item.kind === "option" && item.option.value === value,
      );
      if (
        activeIndex === 0 &&
        selectedNav >= 0
      ) {
        nextActive = selectedNav;
      }
    }
    if (
      openSelect &&
      openSelect !== this
    ) {
      openSelect.collapse();
    }
    openSelect = this;
    this.setMenuState(
      {
        expanded: true,
        filter: "",
        activeIndex: items.length
          ? this.clampActiveIndex(nextActive)
          : -1,
      },
    );
    this.positionMenu();
    if (this.hasLoadOptions()) {
      this.runLoad("");
    }
    if (this.isSearchable()) {
      const input = this.querySelector("input[role='combobox']");
      input && input.focus();
    }
  }

  collapse() {
    this.clearTypeahead();
    this.clearLoadTimer();
    if (openSelect === this) {
      openSelect = null;
    }
    this.setMenuState(
      {
        expanded: false,
        activeIndex: -1,
        filter: "",
        loading: false,
      },
    );
  }

  applyValue(nextValue) {
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(nextValue);
  }

  commitCreate() {
    const created = this.createInput();
    if (!created) {
      return;
    }
    const {
      onCreateOption,
    } = this.props || {};
    // Notify parent first so options update before the value is applied.
    onCreateOption && onCreateOption(created);
    if (this.isMulti()) {
      const next = [
        ...this.selectedValues(),
        created,
      ];
      this.setMenuState(
        {
          filter: "",
          activeIndex: 0,
        },
      );
      this.applyValue(next);
      queueMicrotask(
        () => {
          if (!this.state.expanded) {
            return;
          }
          this.positionMenu();
          const input = this.querySelector("input[role='combobox']");
          input && input.focus();
        },
      );
      return;
    }
    queueMicrotask(
      () => {
        this.collapse();
        this.applyValue(created);
      },
    );
  }

  commit(index) {
    const items = this.navItems();
    const item = items[index];
    if (!item) {
      return;
    }
    if (item.kind === "create") {
      this.commitCreate();
      return;
    }
    const option = item.option;
    if (
      !option ||
      option.disabled
    ) {
      return;
    }
    if (this.isMulti()) {
      const next = [
        ...this.selectedValues(),
        option.value,
      ];
      this.setMenuState(
        {
          filter: "",
          activeIndex: 0,
        },
      );
      this.applyValue(next);
      queueMicrotask(
        () => {
          if (!this.state.expanded) {
            return;
          }
          this.positionMenu();
          const input = this.querySelector("input[role='combobox']");
          input && input.focus();
        },
      );
      return;
    }
    queueMicrotask(
      () => {
        this.collapse();
        this.applyValue(option.value);
      },
    );
  }

  removeValue(removed, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.isMulti()) {
      return;
    }
    const next = this.selectedValues().filter(
      (value) => value !== removed,
    );
    this.applyValue(next);
  }

  clearValue(event) {
    event.stopPropagation();
    event.preventDefault();
    this.collapse();
    this.applyValue(this.isMulti()
      ? []
      : undefined);
  }

  moveActive(delta) {
    const items = this.navItems();
    if (!items.length) {
      return;
    }
    this.clearTypeahead();
    const {
      activeIndex,
    } = this.state;
    const start = activeIndex < 0
      ? delta > 0
          ? -1
          : 0
      : activeIndex;
    const next = (start + delta + items.length) % items.length;
    this.setMenuState(
      {
        activeIndex: next,
      },
    );
    queueMicrotask(
      () => this.scrollActiveIntoView(),
    );
  }

  scrollActiveIntoView() {
    const {
      activeIndex,
    } = this.state;
    if (activeIndex < 0) {
      return;
    }
    const option = document.getElementById(this.optionId(activeIndex));
    option && option.scrollIntoView(
      {
        block: "nearest",
      },
    );
  }

  onFilterInput(event) {
    const filter = event.target.value;
    this.setMenuState(
      {
        filter,
        activeIndex: 0,
        expanded: true,
      },
    );
    if (this.hasLoadOptions()) {
      this.scheduleLoad(filter);
    }
  }

  onTriggerKeyDown(event) {
    if (this.props.disabled) {
      return;
    }
    const {
      expanded,
      filter,
    } = this.state;
    const searchable = this.isSearchable();
    if (
      this.isMulti() &&
      event.key === "Backspace" &&
      !(filter || "") &&
      this.selectedValues().length
    ) {
      event.preventDefault();
      const values = this.selectedValues();
      this.removeValue(values[values.length - 1]);
      return;
    }
    const isTypeaheadKey = !searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ";
    if (isTypeaheadKey) {
      event.preventDefault();
      if (!expanded) {
        this.expand();
      }
      this.jumpToTypeahead(event.key);
      return;
    }
    if (!expanded) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        this.expand();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.collapse();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.moveActive(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.moveActive(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      if (this.navItems().length) {
        this.setMenuState(
          {
            activeIndex: 0,
          },
        );
      }
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = this.navItems().length - 1;
      if (last >= 0) {
        this.setMenuState(
          {
            activeIndex: last,
          },
        );
      }
      return;
    }
    if (
      event.key === "Enter" ||
      (
        !searchable &&
        event.key === " "
      )
    ) {
      event.preventDefault();
      this.commit(this.state.activeIndex);
    }
  }

  onDocumentPointerDown(event) {
    if (!this.state.expanded) {
      return;
    }
    const root = document.getElementById("janus-ui-select-menu");
    if (
      this.contains(event.target) ||
      (
        root &&
        root.contains(event.target)
      )
    ) {
      return;
    }
    this.collapse();
  }

  attachMenuListeners() {
    if (this._menuOwner) {
      return;
    }
    this._menuOwner = true;
    document.addEventListener(
      "pointerdown",
      this._onPointerDown,
      true,
    );
    window.addEventListener(
      "resize",
      this._onReposition,
    );
    document.addEventListener(
      "scroll",
      this._onReposition,
      true,
    );
  }

  detachMenuListeners() {
    if (!this._menuOwner) {
      return;
    }
    this._menuOwner = false;
    document.removeEventListener(
      "pointerdown",
      this._onPointerDown,
      true,
    );
    window.removeEventListener(
      "resize",
      this._onReposition,
    );
    document.removeEventListener(
      "scroll",
      this._onReposition,
      true,
    );
  }

  triggerBox() {
    // Prefer a real painted control: janus-button is display:contents and has
    // an empty getBoundingClientRect(), while its inner button is forwarded the
    // data-janus-select-trigger attribute.
    const trigger = this.querySelector("input[data-janus-select-trigger], button[data-janus-select-trigger], a[data-janus-select-trigger], [data-janus-select-trigger]");
    if (!trigger) {
      return null;
    }
    let rect = trigger.getBoundingClientRect();
    if (
      rect.width > 0 ||
      rect.height > 0
    ) {
      return rect;
    }
    const painted = trigger.querySelector("button, a, input");
    return painted
      ? painted.getBoundingClientRect()
      : rect;
  }

  positionMenu() {
    if (!this.state.expanded) {
      return;
    }
    const root = document.getElementById("janus-ui-select-menu");
    const rect = this.triggerBox();
    if (
      !root ||
      !rect
    ) {
      return;
    }
    const menuHeight = Math.min(
      root.scrollHeight > 0
        ? root.scrollHeight
        : 48,
      MENU_MAX_HEIGHT,
    );
    const roomBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const roomAbove = rect.top - MENU_GAP;
    const openUpwards = roomBelow < menuHeight && roomAbove > roomBelow;
    Object.assign(
      root.style,
      {
        position: "fixed",
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
        width: "max-content",
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

  menuContent() {
    const {
      color,
      value,
      noOptionsMessage,
      loadingMessage,
    } = this.props || {};
    const {
      activeIndex,
    } = this.state;
    const tone = theme.tone(color);
    const rows = this.menuRows();
    const selected = this.isMulti()
      ? null
      : this.flatOptions().find(
          (option) => option.value === value,
        );
    const listId = this.listboxId();
    const multi = this.isMulti();
    const loading = this.isLoading();
    const hasOptions = rows.some(
      (row) => row.kind === "option" || row.kind === "create",
    );

    return html`
      <div
        id=${listId}
        role="listbox"
        class="janus-select-options"
        aria-multiselectable=${multi
          ? "true"
          : undefined}
        style=${optionsStyle}
      >${loading
          ? html`
              <div
                key="loading"
                role="presentation"
                class="janus-select-loading"
                style=${loadingRowStyle}
              >
                <Spinner color=${color}>${loadingMessage || "Loading..."}</Spinner>
              </div>
            `
          : ""}${hasOptions
          ? rows.map(
              (row) => {
                if (row.kind === "group") {
                  return html`
                    <div
                      key=${`group-${row.name}`}
                      role="presentation"
                      style=${groupHeaderStyle}
                    >${row.name}</div>
                  `;
                }
                if (row.kind === "create") {
                  return html`
                    <div
                      key="create"
                      id=${this.optionId(row.navIndex)}
                      role="option"
                      aria-selected="false"
                      style=${optionStyle(
                        tone,
                        false,
                        row.navIndex === activeIndex,
                        false,
                      )}
                      onClick=${(event) => {
                        this.commitCreate();
                        event.stopPropagation();
                      }}
                      onMouseEnter=${() => this.setMenuState(
                        {
                          activeIndex: row.navIndex,
                        },
                      )}
                    >${row.label}</div>
                  `;
                }
                const option = row.option;
                const disabled = Boolean(option.disabled);
                const isSelected = option === selected;
                const isActive = row.navIndex === activeIndex;
                return html`
                  <div
                    key=${option.value}
                    id=${row.navIndex >= 0
                      ? this.optionId(row.navIndex)
                      : undefined}
                    role="option"
                    aria-selected=${isSelected
                      ? "true"
                      : "false"}
                    aria-disabled=${disabled
                      ? "true"
                      : undefined}
                    style=${optionStyle(
                      tone,
                      isSelected,
                      isActive,
                      disabled,
                    )}
                    onClick=${(event) => {
                      event.stopPropagation();
                      if (disabled) {
                        return;
                      }
                      this.commit(row.navIndex);
                    }}
                    onMouseEnter=${() => {
                      if (
                        !disabled &&
                        row.navIndex >= 0
                      ) {
                        this.setMenuState(
                          {
                            activeIndex: row.navIndex,
                          },
                        );
                      }
                    }}
                  >${this.optionLabel(
                      option,
                      {
                        selected: isSelected,
                        active: isActive,
                        disabled,
                      },
                    )}</div>
                `;
              },
            )
          : loading
          ? ""
          : html`
              <p style=${noOptionsStyle}>${noOptionsMessage || "No options"}</p>
            `}</div>
    `;
  }

  syncMenu() {
    if (!this.state.expanded) {
      this.teardownMenu();
      return;
    }
    this.attachMenuListeners();
    const root = ensureMenuRoot();
    render(
      root,
      this.menuContent(),
    );
    this.positionMenu();
  }

  teardownMenu() {
    this.detachMenuListeners();
    const root = document.getElementById("janus-ui-select-menu");
    if (
      root &&
      openSelect === null
    ) {
      render(
        root,
        [],
      );
      removeMenuRootIfEmpty();
    } else if (
      root &&
      openSelect &&
      openSelect !== this
    ) {
      // Another select owns the menu.
    } else if (
      root &&
      openSelect === this
    ) {
      render(
        root,
        [],
      );
    }
  }

  componentWillReceiveProps() {
    if (this.state.expanded) {
      queueMicrotask(
        () => {
          if (this.state.expanded) {
            this.syncMenu();
          }
        },
      );
    }
  }

  componentWillUnmount() {
    if (openSelect === this) {
      openSelect = null;
    }
    this.clearTypeahead();
    this.clearLoadTimer();
    this.teardownMenu();
  }

  renderChips(tone, removable) {
    const {
      chipHover,
    } = this.state;
    return this.selectedOptions().map(
      (option) => html`
        <span
          key=${option.value}
          style=${chipStyle(tone)}
        >
          <span>${this.valueContent(option)}</span>
          ${removable
            ? html`
                <button
                  type="button"
                  aria-label=${`Remove ${option.name}`}
                  style=${chipRemoveStyle}
                  onMouseEnter=${() => this.setChipHover(option.value)}
                  onMouseLeave=${() => this.setChipHover(null)}
                  onClick=${(event) => this.removeValue(
                    option.value,
                    event,
                  )}
                >${this.closeIcon(
                    CHIP_ICON_SIZE,
                    chipHover === option.value,
                  )}</button>
              `
            : ""}
        </span>
      `,
    );
  }

  render() {
    const {
      disabled,
      color,
      placeholder,
      clearable,
    } = this.props;
    const {
      expanded,
      activeIndex,
      filter,
      triggerHover,
      clearHover,
    } = this.state;
    const multi = this.isMulti();
    const tone = theme.tone(color);
    const selected = this.singleSelected();
    const selectedCount = this.selectedValues().length;
    const caption = selected
      ? this.valueContent(selected)
      : placeholder || "Select";
    const inputValue = expanded
      ? filter
      : selected
      ? this.valueText(selected)
      : "";
    const listId = this.listboxId();
    const searchable = this.isSearchable();
    const showClear = clearable && selectedCount > 0 && !disabled;
    const triggerAnimated = Boolean(triggerHover);

    if (disabled) {
      if (multi) {
        return html`
          <span style=${multiControlStyle(color)}>${this.headIconNode(false)}${selectedCount
              ? this.renderChips(
                  tone,
                  false,
                )
              : html`
                  <span
                    style=${{
                      flexGrow: "1",
                    }}
                  >${placeholder || "Select"}</span>
                `}${this.tailIconNode(false)}</span>
        `;
      }
      if (searchable) {
        return html`
          <span style=${searchControlStyle(color)}>
            ${this.headIconNode(false)}
            <span
              style=${{
                flexGrow: "1",
                color: "var(--janus-text-muted)",
              }}
            >${selected
                ? this.valueText(selected)
                : placeholder || "Select"}</span>
            ${this.tailIconNode(false)}
          </span>
        `;
      }
      return html`
        <span style=${staticControlStyle(color)}>
          ${this.headIconNode(false)}
          <span style=${staticValueStyle(!selected)}>${caption}</span>
          ${this.tailIconNode(false)}
        </span>
      `;
    }

    const clearControl = showClear
      ? html`
          <button
            type="button"
            aria-label="Clear"
            style=${theme.dismissButton}
            ${iconHoverHandlers(
              this,
              {
                stateKey: "clearHover",
              },
            )}
            onClick=${(event) => this.clearValue(event)}
          >${this.closeIcon(
              TRIGGER_ICON_SIZE,
              clearHover,
            )}</button>
        `
      : "";

    if (multi) {
      return html`
        <span
          style=${controlRowStyle}
          ${iconHoverHandlers(
            this,
            {
              stateKey: "triggerHover",
            },
          )}
        >
          <span
            data-janus-select-trigger
            style=${multiControlStyle(color)}
            onClick=${() => {
              if (!this.state.expanded) {
                this.expand();
              }
              const input = this.querySelector("input[role='combobox']");
              input && input.focus();
            }}
          >${this.headIconNode(triggerAnimated)}${this.renderChips(
              tone,
              true,
            )}${searchable
              ? html`
                  <input
                    type="text"
                    role="combobox"
                    aria-expanded=${expanded
                      ? "true"
                      : "false"}
                    aria-haspopup="listbox"
                    aria-controls=${listId}
                    aria-autocomplete="list"
                    aria-activedescendant=${expanded && activeIndex >= 0
                      ? this.optionId(activeIndex)
                      : undefined}
                    style=${multiInputStyle}
                    value=${filter}
                    placeholder=${selectedCount
                      ? ""
                      : placeholder || "Select"}
                    onFocus=${() => {
                      if (!this.state.expanded) {
                        this.expand();
                      }
                    }}
                    onInput=${(event) => this.onFilterInput(event)}
                    onKeyDown=${(event) => this.onTriggerKeyDown(event)}
                    onClick=${(event) => {
                      event.stopPropagation();
                      if (!this.state.expanded) {
                        this.expand();
                      }
                    }}
                  />
                `
              : html`
                  <Button
                    style=${{
                      margin: "0",
                    }}
                    role="combobox"
                    aria-expanded=${expanded
                      ? "true"
                      : "false"}
                    aria-haspopup="listbox"
                    aria-controls=${listId}
                    aria-activedescendant=${expanded && activeIndex >= 0
                      ? this.optionId(activeIndex)
                      : undefined}
                    onClick=${(event) => {
                      event.stopPropagation();
                      expanded
                        ? this.collapse()
                        : this.expand();
                    }}
                    onKeyDown=${(event) => this.onTriggerKeyDown(event)}
                    color=${color}
                  >${placeholder || "Select"}</Button>
                `}${clearControl}${this.tailIconNode(triggerAnimated)}</span>
        </span>
      `;
    }

    if (searchable) {
      return html`
        <span
          style=${controlRowStyle}
          ${iconHoverHandlers(
            this,
            {
              stateKey: "triggerHover",
            },
          )}
        >
          <span
            data-janus-select-trigger
            style=${searchControlStyle(color)}
            onClick=${() => {
              const input = this.querySelector("input[role='combobox']");
              if (input) {
                input.focus();
              }
              if (!this.state.expanded) {
                this.expand();
              }
            }}
          >
            ${this.headIconNode(triggerAnimated)}
            <input
              type="text"
              role="combobox"
              aria-expanded=${expanded
                ? "true"
                : "false"}
              aria-haspopup="listbox"
              aria-controls=${listId}
              aria-autocomplete="list"
              aria-activedescendant=${expanded && activeIndex >= 0
                ? this.optionId(activeIndex)
                : undefined}
              style=${searchFieldInputStyle}
              value=${inputValue}
              placeholder=${placeholder || "Select"}
              onFocus=${() => {
                if (!this.state.expanded) {
                  this.expand();
                }
              }}
              onClick=${(event) => {
                event.stopPropagation();
                if (!this.state.expanded) {
                  this.expand();
                }
              }}
              onInput=${(event) => this.onFilterInput(event)}
              onKeyDown=${(event) => this.onTriggerKeyDown(event)}
            />
            ${clearControl}
            ${this.tailIconNode(triggerAnimated)}
          </span>
        </span>
      `;
    }

    return html`
      <span
        style=${controlRowStyle}
        ${iconHoverHandlers(
          this,
          {
            stateKey: "triggerHover",
          },
        )}
      >
        <span
          data-janus-select-trigger
          role="combobox"
          tabindex="0"
          aria-expanded=${expanded
            ? "true"
            : "false"}
          aria-haspopup="listbox"
          aria-controls=${listId}
          aria-activedescendant=${expanded && activeIndex >= 0
            ? this.optionId(activeIndex)
            : undefined}
          style=${staticControlStyle(color)}
          onClick=${() => expanded
            ? this.collapse()
            : this.expand()}
          onKeyDown=${(event) => this.onTriggerKeyDown(event)}
        >
          ${this.headIconNode(triggerAnimated)}
          <span style=${staticValueStyle(!selected)}>${caption}</span>
          ${clearControl}
          ${this.tailIconNode(triggerAnimated)}
        </span>
      </span>
    `;
  }
}

Component.register(Select);
