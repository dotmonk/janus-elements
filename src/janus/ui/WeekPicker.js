import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  addMonths,
  calendarCells,
  datesInISOWeek,
  formatISOWeek,
  formatTemplate,
  getFirstDayOfWeek,
  getMonthNames,
  getWeekdayNames,
  isoWeekParts,
  parseISODate,
  parseISOWeek,
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

let weekPickerId = 0;

const headerGridStyle = {
  display: "grid",
  gridTemplateColumns: "2.5rem repeat(7, 1fr)",
  gap: "2px",
};

const weeksWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const weekdayStyle = {
  textAlign: "center",
  fontSize: "0.75rem",
  fontWeight: "600",
  color: "var(--janus-text-muted)",
  padding: "4px 0",
};

const weekRowStyle = (tone, selected) => ({
  display: "grid",
  gridTemplateColumns: "2.5rem repeat(7, 1fr)",
  gap: "2px",
  margin: "0",
  padding: "0",
  borderWidth: "0",
  borderRadius: "var(--janus-radius)",
  backgroundColor: selected
    ? theme.mix(
        tone,
        16,
        "var(--janus-raised)",
      )
    : "transparent",
  cursor: "pointer",
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  width: "100%",
  ":hover": {
    backgroundColor: theme.mix(
      tone,
      selected
        ? 18
        : 10,
      "var(--janus-raised)",
    ),
  },
});

const weekNumberStyle = (tone, selected) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0",
  padding: "0",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: selected
    ? tone
    : "var(--janus-text-muted)",
  font: "inherit",
  fontSize: "0.75rem",
  fontWeight: "600",
  pointerEvents: "none",
});

const dayStyle = (tone, inWeek, inMonth) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  margin: "0",
  padding: "0",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: inMonth
    ? inWeek
        ? tone
        : "var(--janus-text)"
    : "var(--janus-text-muted)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: inWeek
    ? "600"
    : "500",
  pointerEvents: "none",
});

class WeekPicker extends Component {

  constructor() {
    super();
    weekPickerId += 1;
    this._pickerId = weekPickerId;
    const today = parseISODate(todayISO());
    this.state = {
      expanded: false,
      viewYear: today.year,
      viewMonth: today.month,
      triggerHover: false,
      clearHover: false,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionPopup();
    this._onKeyDown = (event) => this.onPopupKeyDown(event);
  }

  dialogId() {
    return `janus-week-picker-${this._pickerId}`;
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
    const week = parseISOWeek(value);
    if (week) {
      const monday = datesInISOWeek(
        week.weekYear,
        week.week,
      )[0];
      const parts = parseISODate(monday);
      this.state.viewYear = parts.year;
      this.state.viewMonth = parts.month;
      return;
    }
    const today = parseISODate(todayISO());
    this.state.viewYear = today.year;
    this.state.viewMonth = today.month;
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

  commitWeek(isoDate) {
    const parts = parseISODate(isoDate);
    const week = isoWeekParts(
      parts.year,
      parts.month,
      parts.day,
    );
    this.applyValue(formatISOWeek(
      week.weekYear,
      week.week,
    ));
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

  selectedWeekDates() {
    const {
      value,
    } = this.props || {};
    const week = parseISOWeek(value);
    return week
      ? new Set(datesInISOWeek(
          week.weekYear,
          week.week,
        ))
      : new Set();
  }

  popupContent() {
    const {
      color,
      locale,
      value,
      weekColumnLabel = "Wk",
      weekRowLabel = "Week {week}",
      weekValueLabel: _weekValueLabel = "{year}-W{week}",
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
    } = this.state;
    const weeks = calendarCells(
      viewYear,
      viewMonth,
      firstDay,
      null,
      null,
    );
    const selected = this.selectedWeekDates();
    const title = `${months[viewMonth - 1]} ${viewYear}`;
    const selectedWeek = parseISOWeek(value);

    return html`
      <div
        id=${this.dialogId()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose week"
        style=${popupShellStyle}
      >
        ${monthYearHeader(
          {
            color,
            locale,
            viewYear,
            viewMonth,
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
        >
          <div
            role="row"
            style=${headerGridStyle}
          >
            <div
              role="columnheader"
              style=${weekdayStyle}
            >${weekColumnLabel}</div>
            ${weekdays.map(
              (name) => html`
                <div
                  key=${`wd-${name}`}
                  role="columnheader"
                  style=${weekdayStyle}
                >${name}</div>
              `,
            )}
          </div>
          <div style=${weeksWrapStyle}>${weeks.map(
              (week) => {
                const mid = week[3] || week[0];
                const parts = parseISODate(mid.iso);
                const weekParts = isoWeekParts(
                  parts.year,
                  parts.month,
                  parts.day,
                );
                const weekValue = formatISOWeek(
                  weekParts.weekYear,
                  weekParts.week,
                );
                const isSelected = selectedWeek && selectedWeek.weekYear === weekParts.weekYear && selectedWeek.week === weekParts.week;
                const rowLabel = formatTemplate(
                  weekRowLabel,
                  {
                    week: weekParts.week,
                    year: weekParts.weekYear,
                  },
                );
                return html`
                  <button
                    key=${`row-${weekValue}`}
                    type="button"
                    role="row"
                    data-week=${weekValue}
                    aria-label=${rowLabel}
                    aria-selected=${isSelected
                      ? "true"
                      : "false"}
                    style=${weekRowStyle(
                      tone,
                      isSelected,
                    )}
                    onClick=${() => this.commitWeek(mid.iso)}
                  >
                    <span
                      role="rowheader"
                      style=${weekNumberStyle(
                        tone,
                        isSelected,
                      )}
                    >${weekParts.week}</span>
                    ${week.map(
                      (cell) => html`
                        <span
                          key=${cell.iso}
                          role="gridcell"
                          style=${dayStyle(
                            tone,
                            selected.has(cell.iso),
                            cell.inMonth,
                          )}
                        >${cell.day}</span>
                      `,
                    )}
                  </button>
                `;
              },
            )}</div>
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
      placeholder = "Select week",
      name,
      weekValueLabel = "{year}-W{week}",
    } = this.props || {};
    const {
      expanded,
      triggerHover,
      clearHover,
    } = this.state;
    const week = parseISOWeek(value);
    const label = week
      ? formatTemplate(
          weekValueLabel,
          {
            year: week.weekYear,
            week: week.week,
          },
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
            minWidth: "9rem",
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
                    label: "Clear week",
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

Component.register(WeekPicker);
