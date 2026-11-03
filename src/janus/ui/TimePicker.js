import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  clockFieldIcon,
  pickerClearButton,
} from "./calendarChrome.js";
import {
  formatISOTime,
  parseISOTime,
} from "./dateTime.js";

let timePickerId = 0;

const pad2 = (value) => String(value).padStart(
  2,
  "0",
);

const shellStyle = (color, disabled) => util.expand(
  theme.field(color),
  {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    margin: "2px",
    padding: "4px 8px",
    cursor: disabled
      ? "not-allowed"
      : "text",
    opacity: disabled
      ? "0.5"
      : "1",
  },
);

const segmentStyle = {
  width: "2.25rem",
  margin: "0",
  padding: "2px 0",
  borderWidth: "0",
  borderRadius: "var(--janus-radius)",
  backgroundColor: "transparent",
  color: "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
  outline: "none",
  ":focus": {
    backgroundColor: theme.mix(
      "var(--janus-focus)",
      18,
      "transparent",
    ),
  },
  ":disabled": {
    cursor: "not-allowed",
  },
};

const separatorStyle = {
  color: "var(--janus-text-muted)",
  userSelect: "none",
  padding: "0 1px",
};

const periodStyle = (color) => util.expand(
  theme.field(color),
  {
    margin: "0 0 0 4px",
    padding: "2px 6px",
    minWidth: "3.25rem",
    cursor: "pointer",
  },
);

const clamp = (value, min, max) => Math.min(
  max,
  Math.max(
    min,
    value,
  ),
);

const wrap = (value, min, max) => {
  const span = max - min + 1;
  let next = (value - min) % span + min;
  if (next < min) {
    next += span;
  }
  return next;
};

class TimePicker extends Component {

  constructor() {
    super();
    timePickerId += 1;
    this._pickerId = timePickerId;
    this._digitBuffer = "";
    this._digitSegment = null;
    this.state = {
      hour: 0,
      minute: 0,
      second: 0,
      period: "AM",
      triggerHover: false,
      clearHover: false,
    };
  }

  usesSeconds() {
    const {
      step,
    } = this.props || {};
    return Number(step) < 60 && step !== undefined && step !== null;
  }

  minuteStep() {
    const {
      step,
    } = this.props || {};
    if (this.usesSeconds()) {
      return 1;
    }
    const numeric = Number(step);
    return Number.isFinite(numeric) && numeric > 0
      ? numeric
      : 1;
  }

  secondStep() {
    const {
      step,
    } = this.props || {};
    const numeric = Number(step);
    return Number.isFinite(numeric) && numeric > 0
      ? numeric
      : 1;
  }

  isHour12() {
    return Boolean(this.props && this.props.hour12);
  }

  partsFromProps() {
    const {
      value,
    } = this.props || {};
    const parts = parseISOTime(value);
    if (!parts) {
      return {
        hour: 0,
        minute: 0,
        second: 0,
        period: "AM",
      };
    }
    let hour = parts.hour;
    let period = "AM";
    if (this.isHour12()) {
      period = hour >= 12
        ? "PM"
        : "AM";
      hour = hour % 12;
      if (hour === 0) {
        hour = 12;
      }
    }
    return {
      hour,
      minute: parts.minute,
      second: parts.second || 0,
      period,
    };
  }

  syncFromProps() {
    const next = this.partsFromProps();
    const {
      hour,
      minute,
      second,
      period,
    } = this.state;
    if (
      hour === next.hour &&
      minute === next.minute &&
      second === next.second &&
      period === next.period
    ) {
      return;
    }
    this.setState(next);
  }

  componentWillMount() {
    Object.assign(
      this.state,
      this.partsFromProps(),
    );
  }

  componentWillReceiveProps() {
    // Avoid clobbering in-progress digit entry on the focused segment.
    const active = typeof document !== "undefined"
      ? document.activeElement
      : null;
    if (
      active &&
      this.contains(active) &&
      active.getAttribute("data-segment")
    ) {
      return;
    }
    this.syncFromProps();
  }

  toISO() {
    let hour = this.state.hour;
    if (this.isHour12()) {
      if (this.state.period === "AM") {
        hour = hour === 12
          ? 0
          : hour;
      } else {
        hour = hour === 12
          ? 12
          : hour + 12;
      }
    }
    return formatISOTime(
      hour,
      this.state.minute,
      this.state.second,
      this.usesSeconds(),
    );
  }

  emit(nextParts) {
    const {
      onChange,
      disabled,
    } = this.props || {};
    if (nextParts) {
      this.setState(nextParts);
    }
    if (disabled) {
      return;
    }
    onChange && onChange(this.toISO());
  }

  clear(event) {
    event.stopPropagation();
    const {
      onChange,
    } = this.props || {};
    this.setState(
      {
        hour: 0,
        minute: 0,
        second: 0,
        period: "AM",
      },
    );
    onChange && onChange(undefined);
  }

  resetDigitBuffer() {
    this._digitBuffer = "";
    this._digitSegment = null;
  }

  focusSegment(name) {
    const input = this.querySelector(`[data-segment="${name}"]`);
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }

  segmentOrder() {
    const order = [
      "hour",
      "minute",
    ];
    if (this.usesSeconds()) {
      order.push("second");
    }
    if (this.isHour12()) {
      order.push("period");
    }
    return order;
  }

  moveSegment(from, delta) {
    const order = this.segmentOrder();
    const index = order.indexOf(from);
    if (index < 0) {
      return;
    }
    const next = order[index + delta];
    if (!next) {
      return;
    }
    this.resetDigitBuffer();
    if (next === "period") {
      const select = this.querySelector("[data-segment=\"period\"]");
      select && select.focus();
      return;
    }
    this.focusSegment(next);
  }

  stepSegment(name, direction) {
    if (name === "hour") {
      if (this.isHour12()) {
        this.emit(
          {
            hour: wrap(
              this.state.hour + direction,
              1,
              12,
            ),
          },
        );
      } else {
        this.emit(
          {
            hour: wrap(
              this.state.hour + direction,
              0,
              23,
            ),
          },
        );
      }
      return;
    }
    if (name === "minute") {
      const step = this.minuteStep();
      this.emit(
        {
          minute: wrap(
            this.state.minute + direction * step,
            0,
            59,
          ),
        },
      );
      return;
    }
    if (name === "second") {
      const step = this.secondStep();
      this.emit(
        {
          second: wrap(
            this.state.second + direction * step,
            0,
            59,
          ),
        },
      );
    }
  }

  commitTypedSegment(name, raw) {
    const digits = String(raw).replace(
      /\D/g,
      "",
    );
    if (!digits) {
      this.syncFromProps();
      return;
    }
    let value = Number(digits);
    if (name === "hour") {
      if (this.isHour12()) {
        value = clamp(
          value,
          1,
          12,
        );
      } else {
        value = clamp(
          value,
          0,
          23,
        );
      }
      this.emit(
        {
          hour: value,
        },
      );
      return;
    }
    if (name === "minute") {
      this.emit(
        {
          minute: clamp(
            value,
            0,
            59,
          ),
        },
      );
      return;
    }
    if (name === "second") {
      this.emit(
        {
          second: clamp(
            value,
            0,
            59,
          ),
        },
      );
    }
  }

  onSegmentKeyDown(name, event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.resetDigitBuffer();
      this.stepSegment(
        name,
        1,
      );
      queueMicrotask(
        () => this.focusSegment(name),
      );
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.resetDigitBuffer();
      this.stepSegment(
        name,
        -1,
      );
      queueMicrotask(
        () => this.focusSegment(name),
      );
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.moveSegment(
        name,
        -1,
      );
      return;
    }
    if (
      event.key === "ArrowRight" ||
      event.key === ":" ||
      event.key === ";"
    ) {
      event.preventDefault();
      this.moveSegment(
        name,
        1,
      );
      return;
    }
    if (event.key === "Tab") {
      this.resetDigitBuffer();
      return;
    }
    if (
      event.key.length === 1 &&
      /\d/.test(event.key)
    ) {
      event.preventDefault();
      if (this._digitSegment !== name) {
        this._digitBuffer = "";
        this._digitSegment = name;
      }
      this._digitBuffer = (this._digitBuffer + event.key).slice(-2);
      this.commitTypedSegment(
        name,
        this._digitBuffer,
      );
      queueMicrotask(
        () => {
          this.focusSegment(name);
          if (this._digitBuffer.length >= 2) {
            this.resetDigitBuffer();
            this.moveSegment(
              name,
              1,
            );
          }
        },
      );
    }
  }

  onSegmentBlur(name, event) {
    this.resetDigitBuffer();
    this.commitTypedSegment(
      name,
      event.target.value,
    );
  }

  onSegmentFocus(event) {
    event.target.select();
  }

  segmentInput(name, value, label) {
    const {
      disabled,
    } = this.props || {};
    return html`
      <input
        data-segment=${name}
        type="text"
        inputmode="numeric"
        maxlength="2"
        aria-label=${label}
        role="spinbutton"
        aria-valuenow=${String(value)}
        value=${pad2(value)}
        ${disabled
          ? {
              disabled: "",
            }
          : {}}
        style=${segmentStyle}
        onFocus=${(event) => this.onSegmentFocus(event)}
        onBlur=${(event) => this.onSegmentBlur(
          name,
          event,
        )}
        onKeyDown=${(event) => this.onSegmentKeyDown(
          name,
          event,
        )}
        onChange=${(event) => event.stopPropagation()}
        onInput=${(event) => event.stopPropagation()}
      />
    `;
  }

  render() {
    const {
      color,
      disabled,
      clearable,
      name,
      value,
    } = this.props || {};
    const {
      hour,
      minute,
      second,
      period,
      triggerHover,
      clearHover,
    } = this.state;
    const showClear = clearable && value && !disabled;

    return html`
      <div
        role="group"
        aria-label="Time"
        data-janus-picker-field
        ${name
          ? {
              "data-name": name,
            }
          : {}}
        style=${shellStyle(
          color,
          disabled,
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
        ${clockFieldIcon(triggerHover && !disabled)}
        <span
          style=${{
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            flexGrow: "1",
          }}
        >
          ${this.segmentInput(
            "hour",
            hour,
            "Hours",
          )}
          <span
            style=${separatorStyle}
            aria-hidden="true"
          >:</span>
          ${this.segmentInput(
            "minute",
            minute,
            "Minutes",
          )}
          ${this.usesSeconds()
            ? html`
                <span
                  style=${separatorStyle}
                  aria-hidden="true"
                >:</span>
                ${this.segmentInput(
                  "second",
                  second,
                  "Seconds",
                )}
              `
            : ""}
          ${this.isHour12()
            ? html`
                <select
                  data-segment="period"
                  aria-label="Period"
                  style=${periodStyle(color)}
                  value=${period}
                  ${disabled
                    ? {
                        disabled: "",
                      }
                    : {}}
                  onChange=${(event) => {
                    event.stopPropagation();
                    this.emit(
                      {
                        period: event.target.value,
                      },
                    );
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              `
            : ""}
        </span>
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
                    label: "Clear time",
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

Component.register(TimePicker);
