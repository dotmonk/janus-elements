import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  formatDisplayMonth,
  formatISOMonth,
  getMonthNames,
  parseISOMonth,
  todayISO,
  parseISODate,
} from "./dateTime.js";
import {
  calendarFieldIcon,
  isPickerFormControl,
  pickerClearButton,
  pickerComboboxStyle,
  pickerFieldShellStyle,
  yearBounds,
  yearHeader,
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

let monthPickerId = 0;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "6px",
};

const monthStyle = (tone, selected, disabled) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0",
  padding: "10px 8px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: selected
    ? tone
    : "transparent",
  borderRadius: "var(--janus-radius)",
  backgroundColor: selected
    ? theme.mix(
        tone,
        18,
        "var(--janus-raised)",
      )
    : "transparent",
  color: selected
    ? tone
    : "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: selected
    ? "600"
    : "500",
  cursor: disabled
    ? "not-allowed"
    : "pointer",
  opacity: disabled
    ? "0.4"
    : "1",
});

const monthDisabled = (year, month, min, max) => {
  const iso = formatISOMonth(
    year,
    month,
  );
  if (
    min &&
    iso < min
  ) {
    return true;
  }
  if (
    max &&
    iso > max
  ) {
    return true;
  }
  return false;
};

class MonthPicker extends Component {

  constructor() {
    super();
    monthPickerId += 1;
    this._pickerId = monthPickerId;
    const today = parseISODate(todayISO());
    this.state = {
      expanded: false,
      viewYear: today.year,
      triggerHover: false,
      clearHover: false,
    };
    this._onPointerDown = (event) => this.onDocumentPointerDown(event);
    this._onReposition = () => this.positionPopup();
    this._onKeyDown = (event) => this.onPopupKeyDown(event);
  }

  dialogId() {
    return `janus-month-picker-${this._pickerId}`;
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
    const parts = parseISOMonth(value);
    if (parts) {
      this.state.viewYear = parts.year;
      return;
    }
    this.state.viewYear = parseISODate(todayISO()).year;
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

  commit(month) {
    const {
      min,
      max,
    } = this.props || {};
    const {
      viewYear,
    } = this.state;
    if (monthDisabled(
      viewYear,
      month,
      min,
      max,
    )) {
      return;
    }
    this.applyValue(formatISOMonth(
      viewYear,
      month,
    ));
    this.collapse();
    const trigger = this.triggerEl();
    trigger && trigger.focus();
  }

  clear(event) {
    event.stopPropagation();
    this.applyValue(undefined);
  }

  moveYear(delta) {
    const {
      min,
      max,
    } = this.props || {};
    const {
      from,
      to,
    } = yearBounds(
      min,
      max,
    );
    const next = Math.min(
      to,
      Math.max(
        from,
        this.state.viewYear + delta,
      ),
    );
    this.setYear(next);
  }

  setYear(year) {
    this.setState(
      {
        viewYear: year,
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
      value,
      locale,
      min,
      max,
    } = this.props || {};
    const tone = theme.tone(color);
    const names = getMonthNames(
      locale,
      "short",
    );
    const selected = parseISOMonth(value);
    const {
      viewYear,
    } = this.state;

    return html`
      <div
        id=${this.dialogId()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose month"
        style=${popupShellStyle}
      >
        ${yearHeader(
          {
            color,
            viewYear,
            min,
            max,
            onPrevious: () => this.moveYear(-1),
            onNext: () => this.moveYear(1),
            onYear: (year) => this.setYear(year),
          },
        )}
        <div
          role="grid"
          aria-label=${String(viewYear)}
          style=${gridStyle}
        >${names.map(
            (name, index) => {
              const month = index + 1;
              const isSelected = selected && selected.year === viewYear && selected.month === month;
              const disabled = monthDisabled(
                viewYear,
                month,
                min,
                max,
              );
              return html`
                <button
                  key=${month}
                  type="button"
                  role="gridcell"
                  aria-selected=${isSelected
                    ? "true"
                    : "false"}
                  aria-disabled=${disabled
                    ? "true"
                    : undefined}
                  style=${monthStyle(
                    tone,
                    isSelected,
                    disabled,
                  )}
                  onClick=${() => this.commit(month)}
                >${name}</button>
              `;
            },
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
      placeholder = "Select month",
      locale,
      name,
    } = this.props || {};
    const {
      expanded,
      triggerHover,
      clearHover,
    } = this.state;
    const label = value
      ? formatDisplayMonth(
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
            minWidth: "10rem",
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
                    label: "Clear month",
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

Component.register(MonthPicker);
