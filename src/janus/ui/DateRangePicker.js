import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  addMonths,
  calendarCells,
  compareISODate,
  formatDisplayDate,
  formatTemplate,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayNames,
  isDateDisabled,
  parseISODate,
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

let dateRangePickerId = 0;

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
};

const dayStyle = (tone, edge, inRange, inMonth, disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  margin: "0",
  padding: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: edge
    ? tone
    : "transparent",
  borderRadius: "var(--janus-radius)",
  backgroundColor: edge
    ? theme.mix(
        tone,
        22,
        "var(--janus-raised)",
      )
    : inRange
    ? theme.mix(
        tone,
        12,
        "var(--janus-raised)",
      )
    : "transparent",
  color: !inMonth
    ? "var(--janus-text-muted)"
    : edge
    ? tone
    : "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: edge
    ? "600"
    : "500",
  opacity: disabled
    ? "0.4"
    : "1",
  cursor: disabled
    ? "not-allowed"
    : "pointer",
});

const normalizeRange = (value) => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {
      start: undefined,
      end: undefined,
    };
  }
  return {
    start: value.start || undefined,
    end: value.end || undefined,
  };
};

const inRange = (iso, start, end) => {
  if (
    !start ||
    !end
  ) {
    return false;
  }
  return compareISODate(
    iso,
    start,
  ) >= 0 && compareISODate(
    iso,
    end,
  ) <= 0;
};

class DateRangePicker extends Component {

  constructor() {
    super();
    dateRangePickerId += 1;
    this._pickerId = dateRangePickerId;
    const today = parseISODate(todayISO());
    this.state = {
      expanded: false,
      viewYear: today.year,
      viewMonth: today.month,
      draftStart: undefined,
      draftEnd: undefined,
      triggerHover: false,
      clearHover: false,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionPopup();
    this._onKeyDown = (event) => this.onPopupKeyDown(event);
  }

  dialogId() {
    return `janus-date-range-picker-${this._pickerId}`;
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
    const range = normalizeRange(this.props && this.props.value);
    const anchor = range.start || range.end || todayISO();
    const parts = parseISODate(anchor);
    this.state.viewYear = parts.year;
    this.state.viewMonth = parts.month;
    this.state.draftStart = range.start;
    this.state.draftEnd = range.end;
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

  pickDay(iso) {
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
    const {
      draftStart,
      draftEnd,
    } = this.state;
    if (
      !draftStart ||
      (
        draftStart &&
        draftEnd
      )
    ) {
      this.setState(
        {
          draftStart: iso,
          draftEnd: undefined,
        },
      );
      this.syncPopup();
      return;
    }
    let start = draftStart;
    let end = iso;
    if (compareISODate(
      end,
      start,
    ) < 0) {
      start = iso;
      end = draftStart;
    }
    this.setState(
      {
        draftStart: start,
        draftEnd: end,
      },
    );
    this.applyValue(
      {
        start,
        end,
      },
    );
    this.collapse();
    const trigger = this.triggerEl();
    trigger && trigger.focus();
  }

  clear(event) {
    event.stopPropagation();
    this.applyValue(
      {
        start: undefined,
        end: undefined,
      },
    );
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
    if (
      isPickerFormControl(event.target) &&
      event.key !== "Escape"
    ) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.collapse();
      const trigger = this.triggerEl();
      trigger && trigger.focus();
    }
  }

  positionPopup() {
    if (!this.state.expanded) {
      return;
    }
    positionPicker(
      this.triggerBox(),
      document.getElementById("janus-ui-picker-popup"),
    );
  }

  popupContent() {
    const {
      color,
      locale,
      min,
      max,
      instructionLabel = "Pick start and end dates",
      instructionLabelWithStart = "Start {date} — pick end",
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
      draftStart,
      draftEnd,
    } = this.state;
    const weeks = calendarCells(
      viewYear,
      viewMonth,
      firstDay,
      min,
      max,
    );
    const title = `${months[viewMonth - 1]} ${viewYear}`;
    const hint = draftStart && !draftEnd
      ? formatTemplate(
          instructionLabelWithStart,
          {
            date: formatDisplayDate(
              draftStart,
              locale,
            ),
          },
        )
      : instructionLabel;

    return html`
      <div
        id=${this.dialogId()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose date range"
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
        <p
          style=${{
            margin: "0",
            fontSize: "0.8125rem",
            color: "var(--janus-text-muted)",
          }}
        >${hint}</p>
        <div
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
                const edge = cell.iso === draftStart || cell.iso === draftEnd;
                const ranged = inRange(
                  cell.iso,
                  draftStart,
                  draftEnd,
                );
                return html`
                  <button
                    key=${cell.iso}
                    type="button"
                    role="gridcell"
                    aria-selected=${edge
                      ? "true"
                      : "false"}
                    aria-disabled=${cell.disabled
                      ? "true"
                      : undefined}
                    style=${dayStyle(
                      tone,
                      edge,
                      ranged,
                      cell.inMonth,
                      cell.disabled,
                    )}
                    onClick=${() => this.pickDay(cell.iso)}
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
      placeholder = "Select date range",
      locale,
      name,
    } = this.props || {};
    const {
      expanded,
      triggerHover,
      clearHover,
    } = this.state;
    const range = normalizeRange(value);
    const label = range.start && range.end
      ? `${formatDisplayDate(range.start, locale)} – ${formatDisplayDate(range.end, locale)}`
      : range.start
      ? `${formatDisplayDate(range.start, locale)} – …`
      : placeholder;
    const showClear = clearable && !disabled && (range.start || range.end);

    return html`
      <div
        data-janus-picker-field
        style=${util.expand(
          pickerFieldShellStyle(
            color,
            disabled,
          ),
          {
            minWidth: "16rem",
            color: range.start || range.end
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
                    label: "Clear date range",
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

Component.register(DateRangePicker);
