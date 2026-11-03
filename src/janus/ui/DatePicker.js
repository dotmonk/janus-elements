import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  addMonths,
  calendarCells,
  formatDisplayDate,
  formatISODate,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayNames,
  isDateDisabled,
  parseISODate,
  shiftISODate,
  todayISO,
} from "./dateTime.js";
import {
  calendarFieldIcon,
  isPickerFormControl,
  monthYearHeader,
  pickerClearButton,
  pickerComboboxStyle,
  pickerFieldShellStyle,
} from "./calendarChrome.js";
import {
  claimPicker,
  clearPickerContent,
  isPickerOwner,
  popupShellStyle,
  positionPicker,
  releasePicker,
  renderPicker,
} from "./pickerPortal.js";

let datePickerId = 0;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "2px",
};

const weekdayStyle = {
  textAlign: "center",
  fontSize: "0.75rem",
  fontWeight: "600",
  color: "var(--janus-text-muted)",
  padding: "4px 0",
  userSelect: "none",
};

const dayStyle = (tone, selected, today, active, inMonth, disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  margin: "0",
  padding: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: selected
    ? tone
    : "transparent",
  borderRadius: "var(--janus-radius)",
  backgroundColor: selected
    ? theme.mix(
        tone,
        20,
        "var(--janus-raised)",
      )
    : active
    ? theme.mix(
        tone,
        12,
        "var(--janus-raised)",
      )
    : "transparent",
  color: !inMonth
    ? "var(--janus-text-muted)"
    : selected
    ? tone
    : "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: today || selected
    ? "600"
    : "500",
  opacity: disabled
    ? "0.4"
    : inMonth
    ? "1"
    : "0.65",
  cursor: disabled
    ? "not-allowed"
    : "pointer",
  boxShadow: today && !selected
    ? `inset 0 -2px 0 ${tone}`
    : "none",
  ":hover": disabled
    ? {}
    : {
        backgroundColor: theme.mix(
          tone,
          14,
          "var(--janus-raised)",
        ),
      },
});

class DatePicker extends Component {

  constructor() {
    super();
    datePickerId += 1;
    this._pickerId = datePickerId;
    const today = todayISO();
    const parts = parseISODate(today);
    this.state = {
      expanded: false,
      viewYear: parts.year,
      viewMonth: parts.month,
      activeIso: today,
      triggerHover: false,
      clearHover: false,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionPopup();
    this._onKeyDown = (event) => this.onPopupKeyDown(event);
  }

  dialogId() {
    return `janus-date-picker-${this._pickerId}`;
  }

  gridId() {
    return `${this.dialogId()}-grid`;
  }

  triggerEl() {
    return this.querySelector("[role=\"combobox\"]");
  }

  triggerBox() {
    const field = this.querySelector("[data-janus-picker-field]") || this.triggerEl();
    return field
      ? field.getBoundingClientRect()
      : null;
  }

  syncViewFromValue() {
    const {
      value,
    } = this.props || {};
    const parts = parseISODate(value) || parseISODate(todayISO());
    this.state.viewYear = parts.year;
    this.state.viewMonth = parts.month;
    this.state.activeIso = value && parseISODate(value)
      ? value
      : todayISO();
  }

  expand() {
    this.syncViewFromValue();
    claimPicker(this);
    this.setState(
      {
        expanded: true,
      },
    );
    this.syncPopup();
    queueMicrotask(
      () => {
        const active = document.getElementById(`day-${this.state.activeIso}-${this._pickerId}`);
        active && active.focus();
      },
    );
  }

  collapse() {
    if (isPickerOwner(this)) {
      releasePicker(this);
    }
    this.setState(
      {
        expanded: false,
      },
    );
    this.teardownPopup();
  }

  toggle() {
    if (this.state.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  applyValue(next) {
    const {
      onChange,
    } = this.props || {};
    onChange && onChange(next);
  }

  commit(iso) {
    const {
      min,
      max,
    } = this.props || {};
    if (isDateDisabled(
      iso,
      min,
      max,
    )) {
      return;
    }
    this.applyValue(iso);
    this.collapse();
    const trigger = this.triggerEl();
    trigger && trigger.focus();
  }

  clear(event) {
    event.stopPropagation();
    this.applyValue(undefined);
  }

  moveMonth(delta) {
    const next = addMonths(
      this.state.viewYear,
      this.state.viewMonth,
      delta,
    );
    this.setView(
      next.year,
      next.month,
    );
  }

  setView(year, month) {
    this.setState(
      {
        viewYear: year,
        viewMonth: month,
      },
    );
    this.syncPopup();
  }

  attachListeners() {
    document.addEventListener(
      "pointerdown",
      this._onPointerDown,
      true,
    );
    window.addEventListener(
      "resize",
      this._onReposition,
    );
    window.addEventListener(
      "scroll",
      this._onReposition,
      true,
    );
    document.addEventListener(
      "keydown",
      this._onKeyDown,
      true,
    );
  }

  detachListeners() {
    document.removeEventListener(
      "pointerdown",
      this._onPointerDown,
      true,
    );
    window.removeEventListener(
      "resize",
      this._onReposition,
    );
    window.removeEventListener(
      "scroll",
      this._onReposition,
      true,
    );
    document.removeEventListener(
      "keydown",
      this._onKeyDown,
      true,
    );
  }

  onDocumentPointerDown(event) {
    if (!this.state.expanded) {
      return;
    }
    const root = document.getElementById("janus-ui-picker-popup");
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

  onPopupKeyDown(event) {
    if (!this.state.expanded) {
      return;
    }
    const {
      min,
      max,
    } = this.props || {};
    if (event.key === "Escape") {
      event.preventDefault();
      this.collapse();
      const trigger = this.triggerEl();
      trigger && trigger.focus();
      return;
    }
    const root = document.getElementById("janus-ui-picker-popup");
    if (
      !root ||
      !root.contains(event.target)
    ) {
      return;
    }
    if (isPickerFormControl(event.target)) {
      return;
    }
    const deltas = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      PageUp: null,
      PageDown: null,
      Home: null,
      End: null,
    };
    if (
      !(event.key in deltas) &&
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }
    event.preventDefault();
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      this.commit(this.state.activeIso);
      return;
    }
    if (event.key === "PageUp") {
      this.moveMonth(event.shiftKey
        ? -12
        : -1);
      return;
    }
    if (event.key === "PageDown") {
      this.moveMonth(event.shiftKey
        ? 12
        : 1);
      return;
    }
    let next = this.state.activeIso;
    if (event.key === "Home") {
      const parts = parseISODate(next);
      next = formatISODate(
        parts.year,
        parts.month,
        1,
      );
    } else if (event.key === "End") {
      const parts = parseISODate(next);
      const last = new Date(
        parts.year,
        parts.month,
        0,
      ).getDate();
      next = formatISODate(
        parts.year,
        parts.month,
        last,
      );
    } else {
      next = shiftISODate(
        next,
        deltas[event.key],
      );
    }
    const parts = parseISODate(next);
    this.setState(
      {
        activeIso: next,
        viewYear: parts.year,
        viewMonth: parts.month,
      },
    );
    this.syncPopup();
    queueMicrotask(
      () => {
        const cell = document.getElementById(`day-${next}-${this._pickerId}`);
        cell && cell.focus();
      },
    );
    void min;
    void max;
  }

  positionPopup() {
    if (!this.state.expanded) {
      return;
    }
    const root = document.getElementById("janus-ui-picker-popup");
    positionPicker(
      this.triggerBox(),
      root,
    );
  }

  popupContent() {
    const {
      color,
      value,
      locale,
      min,
      max,
    } = this.props || {};
    const tone = theme.tone(color);
    const firstDay = getFirstDayOfWeek(locale);
    const weekdays = getWeekdayNames(
      locale,
      firstDay,
    );
    const months = getMonthNames(locale);
    const {
      viewYear,
      viewMonth,
      activeIso,
    } = this.state;
    const weeks = calendarCells(
      viewYear,
      viewMonth,
      firstDay,
      min,
      max,
    );
    const today = todayISO();
    const title = `${months[viewMonth - 1]} ${viewYear}`;

    return html`
      <div
        id=${this.dialogId()}
        role="dialog"
        aria-modal="true"
        aria-label=${title}
        style=${popupShellStyle}
      >
        ${monthYearHeader(
          {
            color,
            locale,
            viewYear,
            viewMonth,
            min,
            max,
            onPrevious: () => this.moveMonth(-1),
            onNext: () => this.moveMonth(1),
            onMonth: (month) => this.setView(
              viewYear,
              month,
            ),
            onYear: (year) => this.setView(
              year,
              viewMonth,
            ),
          },
        )}
        <div
          id=${this.gridId()}
          role="grid"
          aria-label=${title}
          style=${gridStyle}
        >${weekdays.map(
            (name) => html`
              <div
                key=${`wd-${name}`}
                role="columnheader"
                style=${weekdayStyle}
              >${name}</div>
            `,
          )}${weeks.map(
            (week) => week.map(
              (cell) => {
                const selected = cell.iso === value;
                const active = cell.iso === activeIso;
                return html`
                  <button
                    key=${cell.iso}
                    id=${`day-${cell.iso}-${this._pickerId}`}
                    type="button"
                    role="gridcell"
                    tabindex=${active
                      ? "0"
                      : "-1"}
                    aria-selected=${selected
                      ? "true"
                      : "false"}
                    aria-disabled=${cell.disabled
                      ? "true"
                      : undefined}
                    aria-current=${cell.iso === today
                      ? "date"
                      : undefined}
                    style=${dayStyle(
                      tone,
                      selected,
                      cell.iso === today,
                      active,
                      cell.inMonth,
                      cell.disabled,
                    )}
                    onClick=${() => this.commit(cell.iso)}
                    onFocus=${() => {
                      if (this.state.activeIso !== cell.iso) {
                        this.setState(
                          {
                            activeIso: cell.iso,
                          },
                        );
                      }
                    }}
                  >${cell.day}</button>
                `;
              },
            ),
          )}</div>
      </div>
    `;
  }

  syncPopup() {
    if (!this.state.expanded) {
      this.teardownPopup();
      return;
    }
    this.attachListeners();
    renderPicker(this.popupContent());
    this.positionPopup();
  }

  teardownPopup() {
    this.detachListeners();
    if (!isPickerOwner(this)) {
      clearPickerContent();
    }
  }

  componentWillReceiveProps() {
    if (this.state.expanded) {
      queueMicrotask(
        () => {
          if (this.state.expanded) {
            this.syncPopup();
          }
        },
      );
    }
  }

  componentWillUnmount() {
    releasePicker(this);
    this.teardownPopup();
  }

  render() {
    const {
      color,
      value,
      disabled,
      clearable,
      placeholder = "Select date",
      locale,
      name,
    } = this.props || {};
    const {
      expanded,
      triggerHover,
      clearHover,
    } = this.state;
    const label = value
      ? formatDisplayDate(
          value,
          locale,
        )
      : placeholder;
    const showClear = clearable && value && !disabled;

    return html`
      <div
        data-janus-picker-field
        style=${util.expand(
          pickerFieldShellStyle(
            color,
            disabled,
          ),
          {
            minWidth: "11rem",
            color: value
              ? "var(--janus-text)"
              : "var(--janus-text-muted)",
          },
        )}
        onMouseEnter=${() => {
          if (!this.state.triggerHover) {
            this.setState(
              {
                triggerHover: true,
              },
            );
          }
        }}
        onMouseLeave=${() => {
          if (
            this.state.triggerHover ||
            this.state.clearHover
          ) {
            this.setState(
              {
                triggerHover: false,
                clearHover: false,
              },
            );
          }
        }}
      >
        <button
          type="button"
          role="combobox"
          aria-expanded=${expanded
            ? "true"
            : "false"}
          aria-haspopup="dialog"
          aria-controls=${expanded
            ? this.dialogId()
            : undefined}
          ${name
            ? {
                name,
              }
            : {}}
          ${disabled
            ? {
                disabled: "",
              }
            : {}}
          style=${pickerComboboxStyle}
          onClick=${() => {
            if (!disabled) {
              this.toggle();
            }
          }}
        >
          ${calendarFieldIcon(triggerHover && !disabled)}
          <span
            style=${{
              flexGrow: "1",
            }}
          >${label}</span>
        </button>
        ${showClear
          ? html`
              <span
                onMouseEnter=${() => {
                  if (!this.state.clearHover) {
                    this.setState(
                      {
                        clearHover: true,
                      },
                    );
                  }
                }}
                onMouseLeave=${() => {
                  if (this.state.clearHover) {
                    this.setState(
                      {
                        clearHover: false,
                      },
                    );
                  }
                }}
              >${pickerClearButton(
                  {
                    label: "Clear date",
                    animated: clearHover,
                    onClick: (event) => this.clear(event),
                  },
                )}</span>
            `
          : ""}
      </div>
    `;
  }
}

Component.register(DatePicker);
