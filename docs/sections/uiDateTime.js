import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const snippet = `<DatePicker
  value=\${date}
  clearable
  onChange=\${(value) => setState({ date: value })}
/>
<TimePicker
  value=\${time}
  clearable
  onChange=\${(value) => setState({ time: value })}
/>
<TimePicker
  value=\${time12}
  hour12
  onChange=\${(value) => setState({ time12: value })}
/>
<DateTimePicker
  value=\${dateTime}
  clearable
  onChange=\${(value) => setState({ dateTime: value })}
/>
<WeekPicker
  value=\${week}
  clearable
  onChange=\${(value) => setState({ week: value })}
/>
<MonthPicker
  value=\${month}
  clearable
  onChange=\${(value) => setState({ month: value })}
/>
<DateRangePicker
  value=\${range}
  clearable
  onChange=\${(value) => setState({ range: value })}
/>`;

class DocsUiDateTime extends Component {

  constructor() {
    super();
    this.state = {
      date: "2026-10-28",
      time: "14:30",
      time12: "09:15",
      dateTime: "2026-10-28T14:30",
      week: "2026-W44",
      month: "2026-10",
      range: {
        start: "2026-10-10",
        end: "2026-10-20",
      },
    };
  }

  render() {
    const {
      date,
      time,
      time12,
      dateTime,
      week,
      month,
      range,
    } = this.state;
    const rangeLabel = range && range.start && range.end
      ? `${range.start} → ${range.end}`
      : range && range.start
      ? `${range.start} → …`
      : "—";
    return html`
      <section style=${sectionStyle}>
        <h2>Date and time</h2>
        <div style=${rowStyle}>
          <Field label="Date">
            <DatePicker
              value=${date}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  date: value,
                },
              )}
            />
          </Field>
          <Field label="Time">
            <TimePicker
              value=${time}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  time: value,
                },
              )}
            />
          </Field>
          <Field label="Time (12-hour)">
            <TimePicker
              value=${time12}
              hour12=${true}
              onChange=${(value) => this.setState(
                {
                  time12: value,
                },
              )}
            />
          </Field>
        </div>
        <div style=${rowStyle}>
          <Field label="Date and time">
            <DateTimePicker
              value=${dateTime}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  dateTime: value,
                },
              )}
            />
          </Field>
          <Field label="Week">
            <WeekPicker
              value=${week}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  week: value,
                },
              )}
            />
          </Field>
          <Field label="Month">
            <MonthPicker
              value=${month}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  month: value,
                },
              )}
            />
          </Field>
          <Field label="Range">
            <DateRangePicker
              value=${range}
              clearable=${true}
              onChange=${(value) => this.setState(
                {
                  range: value,
                },
              )}
            />
          </Field>
        </div>
        <p
          class="date-time-summary"
          style=${{
            color: "var(--janus-text-muted)",
          }}
        >Date: ${date || "—"} · Time: ${time || "—"} · 12-hour: ${time12 || "—"} · DateTime: ${dateTime || "—"} · Week: ${week || "—"} · Month: ${month || "—"} · Range: ${rangeLabel}</p>
        ${example(snippet)}
        ${propsTable(
          [
            {
              name: "DatePicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "ISO date `YYYY-MM-DD`.",
                ],
                [
                  "name",
                  "string",
                  "Optional name attribute on the combobox.",
                ],
                [
                  "placeholder",
                  "string",
                  "Empty-state label.",
                ],
                [
                  "locale",
                  "string",
                  "BCP 47 locale; omit for `en-US`.",
                ],
                [
                  "min / max",
                  "string",
                  "Inclusive ISO date bounds.",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "Committed ISO date, or `undefined` when cleared.",
                ],
              ],
            },
            {
              name: "TimePicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "ISO time `HH:mm` or `HH:mm:ss`.",
                ],
                [
                  "name",
                  "string",
                  "Stored as `data-name` on the group.",
                ],
                [
                  "placeholder",
                  "string",
                  "Unused for the segmented field; kept for API parity.",
                ],
                [
                  "locale",
                  "string",
                  "Affects display helpers; omit for `en-US`.",
                ],
                [
                  "step",
                  "number",
                  "Minute step, or second step when `< 60`.",
                ],
                [
                  "hour12",
                  "boolean",
                  "12-hour clock with AM/PM.",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "Committed ISO time, or `undefined` when cleared.",
                ],
              ],
            },
            {
              name: "DateTimePicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "ISO `YYYY-MM-DDTHH:mm`.",
                ],
                [
                  "name",
                  "string",
                  "Optional name on the combobox.",
                ],
                [
                  "placeholder",
                  "string",
                  "Empty-state label.",
                ],
                [
                  "locale",
                  "string",
                  "BCP 47 locale; omit for `en-US`.",
                ],
                [
                  "min / max",
                  "string",
                  "Inclusive ISO date bounds for the calendar.",
                ],
                [
                  "hour12",
                  "boolean",
                  "12-hour clock in the popup.",
                ],
                [
                  "hourLabel",
                  "string",
                  "Hour select label and `aria-label` (default `Hour`).",
                ],
                [
                  "minuteLabel",
                  "string",
                  "Minute select label and `aria-label` (default `Minute`).",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "Committed datetime, or `undefined` when cleared.",
                ],
              ],
            },
            {
              name: "WeekPicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "ISO week `YYYY-Www`.",
                ],
                [
                  "name",
                  "string",
                  "Optional name on the combobox.",
                ],
                [
                  "placeholder",
                  "string",
                  "Empty-state label.",
                ],
                [
                  "locale",
                  "string",
                  "BCP 47 locale; omit for `en-US`.",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "weekColumnLabel",
                  "string",
                  "Week-number column header (default `Wk`).",
                ],
                [
                  "weekRowLabel",
                  "string",
                  "Row `aria-label` template; `{week}` / `{year}` (default `Week {week}`).",
                ],
                [
                  "weekValueLabel",
                  "string",
                  "Trigger label template; `{year}` / `{week}` (default `{year}-W{week}`).",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "Committed ISO week, or `undefined` when cleared.",
                ],
              ],
            },
            {
              name: "MonthPicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "ISO month `YYYY-MM`.",
                ],
                [
                  "name",
                  "string",
                  "Optional name on the combobox.",
                ],
                [
                  "placeholder",
                  "string",
                  "Empty-state label.",
                ],
                [
                  "locale",
                  "string",
                  "BCP 47 locale; omit for `en-US`.",
                ],
                [
                  "min / max",
                  "string",
                  "Inclusive ISO month bounds.",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "Committed ISO month, or `undefined` when cleared.",
                ],
              ],
            },
            {
              name: "DateRangePicker",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "{ start?, end? }",
                  "Inclusive ISO date range.",
                ],
                [
                  "name",
                  "string",
                  "Optional name on the combobox.",
                ],
                [
                  "placeholder",
                  "string",
                  "Empty-state label.",
                ],
                [
                  "locale",
                  "string",
                  "BCP 47 locale; omit for `en-US`.",
                ],
                [
                  "min / max",
                  "string",
                  "Inclusive ISO date bounds.",
                ],
                [
                  "clearable",
                  "boolean",
                  "Shows a clear control inside the field.",
                ],
                [
                  "instructionLabel",
                  "string",
                  "Popup hint before a start date is chosen.",
                ],
                [
                  "instructionLabelWithStart",
                  "string",
                  "Popup hint after start; `{date}` is the formatted start.",
                ],
                [
                  "onChange",
                  "(value) => void",
                  "Range object; cleared fields are omitted.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiDateTime);
