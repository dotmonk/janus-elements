import {
  html,
} from "../index.js";

import theme from "./theme.js";
import util from "./util.js";
import {
  getMonthNames,
  parseISODate,
  parseISOMonth,
} from "./dateTime.js";
import "./icon/chevron.js";
import "./icon/calendar.js";
import "./icon/clock.js";
import "./icon/close.js";

export const FIELD_DECORATION_ICON_SIZE = 14;

export const fieldDecorationIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: "0",
  lineHeight: "0",
  color: "var(--janus-text-muted)",
};

/** Leading calendar glyph for date-family picker triggers. */
export const calendarFieldIcon = (animated = false) => html`
  <span
    style=${fieldDecorationIconStyle}
    aria-hidden="true"
  >
    <CalendarIcon
      key=${animated
        ? "cal-animated"
        : "cal-static"}
      size=${FIELD_DECORATION_ICON_SIZE}
      animated=${Boolean(animated)}
    />
  </span>
`;

/** Leading clock glyph for time fields. */
export const clockFieldIcon = (animated = false) => html`
  <span
    style=${fieldDecorationIconStyle}
    aria-hidden="true"
  >
    <ClockIcon
      key=${animated
        ? "clock-animated"
        : "clock-static"}
      size=${FIELD_DECORATION_ICON_SIZE}
      animated=${Boolean(animated)}
    />
  </span>
`;

/** Themed shell that wraps combobox + clear so clear sits inside the field. */
export const pickerFieldShellStyle = (color, disabled) => util.expand(
  theme.field(color),
  {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    margin: "2px",
    cursor: disabled
      ? "not-allowed"
      : "pointer",
    opacity: disabled
      ? "0.5"
      : "1",
  },
);

export const pickerComboboxStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  flexGrow: "1",
  minWidth: "0",
  margin: "0",
  padding: "0",
  borderWidth: "0",
  backgroundColor: "transparent",
  color: "inherit",
  font: "inherit",
  fontSize: "0.875rem",
  textAlign: "left",
  cursor: "inherit",
};

export const pickerClearButton = ({
  label,
  animated,
  onClick,
}) => html`
  <button
    type="button"
    aria-label=${label}
    style=${theme.dismissButton}
    onClick=${onClick}
  >
    <CloseIcon
      size=${14}
      animated=${Boolean(animated)}
    />
  </button>
`;

export const calendarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

export const calendarNavButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  padding: "0",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--janus-border)",
  borderRadius: "var(--janus-radius)",
  backgroundColor: "transparent",
  color: "var(--janus-text)",
  cursor: "pointer",
  ":hover": {
    backgroundColor: theme.mix(
      "var(--janus-text)",
      10,
      "transparent",
    ),
  },
};

const controlsStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  flex: "1",
  justifyContent: "center",
};

const selectStyle = (color) => ({
  ...theme.field(color),
  margin: "0",
  padding: "4px 6px",
  minWidth: "7.5rem",
});

const yearStyle = (color) => ({
  ...theme.field(color),
  margin: "0",
  padding: "4px 6px",
  width: "4.5rem",
  textAlign: "center",
});

/** Year window from min/max ISO date or month, else today ± 100. */
export const yearBounds = (min, max) => {
  const now = new Date().getFullYear();
  let from = now - 100;
  let to = now + 100;
  const minParts = parseISODate(min) || parseISOMonth(min);
  const maxParts = parseISODate(max) || parseISOMonth(max);
  if (minParts) {
    from = minParts.year;
  }
  if (maxParts) {
    to = maxParts.year;
  }
  if (from > to) {
    return {
      from: to,
      to: from,
    };
  }
  return {
    from,
    to,
  };
};

export const isPickerFormControl = (target) => {
  if (
    !target ||
    !target.closest
  ) {
    return false;
  }
  return Boolean(target.closest("select, input, textarea"));
};

export const yearSpinInput = ({
  color,
  viewYear,
  min,
  max,
  onYear,
}) => {
  const {
    from,
    to,
  } = yearBounds(
    min,
    max,
  );
  return html`
    <input
      type="number"
      aria-label="Year"
      inputmode="numeric"
      style=${yearStyle(color)}
      value=${String(viewYear)}
      min=${String(from)}
      max=${String(to)}
      step="1"
      onInput=${(event) => {
        event.stopPropagation();
        const raw = event.target.value;
        const next = Number(raw);
        // Apply while typing only for a complete in-range year so re-render
        // does not wipe partial edits; spinner steps are always complete.
        if (
          raw !== "" &&
          Number.isFinite(next) &&
          String(Math.trunc(Math.abs(next))).length >= 4 &&
          next >= from &&
          next <= to
        ) {
          onYear(Math.trunc(next));
        }
      }}
      onChange=${(event) => {
        event.stopPropagation();
        const next = Number(event.target.value);
        if (!Number.isFinite(next)) {
          event.target.value = String(viewYear);
          return;
        }
        onYear(Math.min(
          to,
          Math.max(
            from,
            Math.trunc(next),
          ),
        ));
      }}
    />
  `;
};

/**
 * Year number spin with prev/next year chevrons (MonthPicker).
 */
export const yearHeader = ({
  color,
  viewYear,
  min,
  max,
  onPrevious,
  onNext,
  onYear,
}) => html`
  <div style=${calendarHeaderStyle}>
    <button
      type="button"
      aria-label="Previous year"
      style=${calendarNavButtonStyle}
      onClick=${onPrevious}
    >
      <ChevronIcon
        size=${16}
        style=${{
          transform: "rotate(90deg)",
        }}
      />
    </button>
    <div style=${controlsStyle}>${yearSpinInput(
        {
          color,
          viewYear,
          min,
          max,
          onYear,
        },
      )}</div>
    <button
      type="button"
      aria-label="Next year"
      style=${calendarNavButtonStyle}
      onClick=${onNext}
    >
      <ChevronIcon
        size=${16}
        style=${{
          transform: "rotate(-90deg)",
        }}
      />
    </button>
  </div>
`;

/**
 * Month dropdown + year number spin, with prev/next month chevrons.
 */
export const monthYearHeader = ({
  color,
  locale,
  viewYear,
  viewMonth,
  min,
  max,
  onPrevious,
  onNext,
  onMonth,
  onYear,
}) => {
  const months = getMonthNames(locale);

  return html`
    <div style=${calendarHeaderStyle}>
      <button
        type="button"
        aria-label="Previous month"
        style=${calendarNavButtonStyle}
        onClick=${onPrevious}
      >
        <ChevronIcon
          size=${16}
          style=${{
            transform: "rotate(90deg)",
          }}
        />
      </button>
      <div style=${controlsStyle}>
        <select
          aria-label="Month"
          style=${selectStyle(color)}
          value=${String(viewMonth)}
          onChange=${(event) => {
            event.stopPropagation();
            onMonth(Number(event.target.value));
          }}
        >${months.map(
            (name, index) => html`
              <option
                key=${index + 1}
                value=${String(index + 1)}
              >${name}</option>
            `,
          )}</select>
        ${yearSpinInput(
          {
            color,
            viewYear,
            min,
            max,
            onYear,
          },
        )}
      </div>
      <button
        type="button"
        aria-label="Next month"
        style=${calendarNavButtonStyle}
        onClick=${onNext}
      >
        <ChevronIcon
          size=${16}
          style=${{
            transform: "rotate(-90deg)",
          }}
        />
      </button>
    </div>
  `;
};
