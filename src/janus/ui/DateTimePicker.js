import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  addMonths,
  calendarCells,
  formatDisplayDate,
  formatDisplayTime,
  formatISODateTime,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayNames,
  isDateDisabled,
  parseISODate,
  parseISODateTime,
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

let dateTimePickerId = 0;

const pad2 = (value) => String(value).padStart(
  2,
  "0",
);

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

const dayStyle = (tone, selected, inMonth, disabled) => ({
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
    : "transparent",
  color: !inMonth
    ? "var(--janus-text-muted)"
    : selected
    ? tone
    : "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  opacity: disabled
    ? "0.4"
    : "1",
  cursor: disabled
    ? "not-allowed"
    : "pointer",
});

class DateTimePicker extends Component {

  constructor() {
    super();
    dateTimePickerId += 1;
    this._pickerId = dateTimePickerId;
    const today = todayISO();
    const parts = parseISODate(today);
    this.state = {
      expanded: false,
      viewYear: parts.year,
      viewMonth: parts.month,
      dateIso: today,
      hour: 12,
      minute: 0,
      triggerHover: false,
      clearHover: false,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionPopup();
    this._onKeyDown = (event) => this.onPopupKeyDown(event);
  }

  dialogId() {
    return `janus-datetime-picker-${this._pickerId}`;
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

  syncFromValue() {
    const {
      value,
    } = this.props || {};
    const parts = parseISODateTime(value) || {
      ...parseISODate(todayISO()),
      hour: 12,
      minute: 0,
    };
    this.state.viewYear = parts.year;
    this.state.viewMonth = parts.month;
    this.state.dateIso = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
    this.state.hour = parts.hour;
    this.state.minute = parts.minute;
  }

  toISO() {
    const parts = parseISODate(this.state.dateIso);
    return formatISODateTime(
      parts.year,
      parts.month,
      parts.day,
      this.state.hour,
      this.state.minute,
      0,
      false,
    );
  }

  expand() {
    this.syncFromValue();
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

  commit() {
    const {
      min,
      max,
    } = this.props || {};
    if (isDateDisabled(
      this.state.dateIso,
      min,
      max,
    )) {
      return;
    }
    this.applyValue(this.toISO());
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
      hour12,
      hourLabel,
      minuteLabel,
    } = this.props || {};
    const tone = theme.tone(color);
    const firstDay = getFirstDayOfWeek(locale);
    const weekdays = getWeekdayNames(
      locale,
      firstDay,
    );
    const months = getMonthNames(locale);
    const hourText = hourLabel || "Hour";
    const minuteText = minuteLabel || "Minute";
    const {
      viewYear,
      viewMonth,
      dateIso,
      hour,
      minute,
    } = this.state;
    const weeks = calendarCells(
      viewYear,
      viewMonth,
      firstDay,
      min,
      max,
    );
    const title = `${months[viewMonth - 1]} ${viewYear}`;
    const hours = hour12
      ? Array.from(
          {
            length: 12,
          },
          (_, index) => index + 1,
        )
      : Array.from(
          {
            length: 24,
          },
          (_, index) => index,
        );
    const displayHour = hour12
      ? hour % 12 === 0
          ? 12
          : hour % 12
      : hour;
    const period = hour >= 12
      ? "PM"
      : "AM";

    return html`
      <div
        id=${this.dialogId()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose date and time"
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
              (cell) => html`
                <button
                  key=${cell.iso}
                  type="button"
                  role="gridcell"
                  aria-selected=${cell.iso === dateIso
                    ? "true"
                    : "false"}
                  style=${dayStyle(
                    tone,
                    cell.iso === dateIso,
                    cell.inMonth,
                    cell.disabled,
                  )}
                  onClick=${() => {
                    if (!cell.disabled) {
                      this.setState(
                        {
                          dateIso: cell.iso,
                        },
                      );
                      this.syncPopup();
                    }
                  }}
                >${cell.day}</button>
              `,
            ),
          )}</div>
        <div
          style=${{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label
            style=${{
              fontSize: "0.875rem",
            }}
          >
            ${hourText}
            <select
              aria-label=${hourText}
              style=${theme.field(color)}
              value=${String(displayHour)}
              onChange=${(event) => {
                event.stopPropagation();
                let next = Number(event.target.value);
                if (hour12) {
                  const isPm = this.state.hour >= 12;
                  if (next === 12) {
                    next = isPm
                      ? 12
                      : 0;
                  } else {
                    next = isPm
                      ? next + 12
                      : next;
                  }
                }
                this.setState(
                  {
                    hour: next,
                  },
                );
                this.syncPopup();
              }}
            >${hours.map(
                (value) => html`
                  <option
                    key=${value}
                    value=${String(value)}
                  >${pad2(value)}</option>
                `,
              )}</select>
          </label>
          <label
            style=${{
              fontSize: "0.875rem",
            }}
          >
            ${minuteText}
            <select
              aria-label=${minuteText}
              style=${theme.field(color)}
              value=${String(minute)}
              onChange=${(event) => {
                event.stopPropagation();
                this.setState(
                  {
                    minute: Number(event.target.value),
                  },
                );
                this.syncPopup();
              }}
            >${Array.from(
                {
                  length: 60,
                },
                (_, index) => html`
                  <option
                    key=${index}
                    value=${String(index)}
                  >${pad2(index)}</option>
                `,
              )}</select>
          </label>
          ${hour12
            ? html`
                <select
                  aria-label="Period"
                  style=${theme.field(color)}
                  value=${period}
                  onChange=${(event) => {
                    event.stopPropagation();
                    const nextPeriod = event.target.value;
                    let nextHour = this.state.hour % 12;
                    if (nextPeriod === "PM") {
                      nextHour = nextHour === 0
                        ? 12
                        : nextHour + 12;
                    }
                    this.setState(
                      {
                        hour: nextHour,
                      },
                    );
                    this.syncPopup();
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              `
            : ""}
          <button
            type="button"
            style=${util.expand(
              theme.field(color),
              {
                cursor: "pointer",
                fontWeight: "600",
                marginLeft: "auto",
              },
            )}
            onClick=${() => this.commit()}
          >Done</button>
        </div>
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
      placeholder = "Select date and time",
      locale,
      hour12,
      name,
    } = this.props || {};
    const {
      expanded,
      triggerHover,
      clearHover,
    } = this.state;
    const parts = parseISODateTime(value);
    const label = parts
      ? `${formatDisplayDate(`${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`, locale)} ${formatDisplayTime(`${pad2(parts.hour)}:${pad2(parts.minute)}`, locale, hour12)}`
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
            minWidth: "14rem",
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
                    label: "Clear date and time",
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

Component.register(DateTimePicker);
