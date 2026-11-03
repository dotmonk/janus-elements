import Component, {
  html,
} from "janus-elements";
import SearchIcon from "janus-elements/ui/icons/search";
import CalendarIcon from "janus-elements/ui/icons/calendar";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const snippet = `<Input value="Default" />
<Input color="accent" value="Accent" />
<Input color="error" value="Error" />
<Input disabled value="Disabled" />
<Textarea>A textarea for longer text</Textarea>
<Textarea color="success">Valid text</Textarea>
<NumberInput value=\${count} min=\${0} max=\${100} step=\${1}
  onChange=\${(value) => setState({ count: value })} />
<RangeInput value=\${volume} min=\${0} max=\${100}
  onChange=\${(value) => setState({ volume: value })} />
<ColorInput value=\${swatch}
  onChange=\${(value) => setState({ swatch: value })} />
<FileInput accept="image/*" multiple
  onChange=\${(files) => setState({ files })} />`;

const headIconSnippet = `import SearchIcon from "janus-elements/ui/icons/search";

<Input headIcon=\${SearchIcon} placeholder="Search" />`;

const tailIconSnippet = `import CalendarIcon from "janus-elements/ui/icons/calendar";

<Input tailIcon=\${CalendarIcon} placeholder="Date" />`;

class DocsUiInputs extends Component {

  constructor() {
    super();
    this.state = {
      count: 3,
      volume: 40,
      swatch: "#e3b04b",
      files: [],
    };
  }

  render() {
    const {
      count,
      volume,
      swatch,
      files,
    } = this.state;
    const fileSummary = files.length === 0
      ? "none"
      : files.map(
          (file) => file.name,
        ).join(", ");

    return html`
      <section style=${sectionStyle}>
        <h2>Inputs</h2>
        <div style=${rowStyle}>
          <Input value="Default" />
          <Input
            color="accent"
            value="Accent"
          />
          <Input
            color="error"
            value="Error"
          />
          <Input
            disabled=${true}
            value="Disabled"
          />
        </div>
        <div style=${rowStyle}>
          <Textarea>A textarea for longer text</Textarea>
          <Textarea color="success">Valid text</Textarea>
        </div>
        <div style=${rowStyle}>
          <Field label="Count">
            <NumberInput
              value=${count}
              min=${0}
              max=${100}
              step=${1}
              onChange=${(value) => this.setState(
                {
                  count: value,
                },
              )}
            />
          </Field>
          <Field label="Locked">
            <NumberInput
              value=${7}
              disabled=${true}
            />
          </Field>
          <Field label="Volume">
            <RangeInput
              value=${volume}
              min=${0}
              max=${100}
              onChange=${(value) => this.setState(
                {
                  volume: value,
                },
              )}
            />
          </Field>
          <Field label="Swatch">
            <ColorInput
              value=${swatch}
              onChange=${(value) => this.setState(
                {
                  swatch: value,
                },
              )}
            />
          </Field>
          <Field
            label="Files"
            hint="Images only"
          >
            <FileInput
              accept="image/*"
              multiple=${true}
              onChange=${(next) => this.setState(
                {
                  files: next,
                },
              )}
            />
          </Field>
        </div>
        <p
          class="inputs-summary"
          style=${{
            color: "var(--janus-text-muted)",
          }}
        >Count: ${count === undefined
            ? "—"
            : count} · Volume: ${volume} · Swatch: ${swatch} · Files: ${fileSummary}</p>
        ${example(snippet)}
        <h3>Custom head icon</h3>
        <div style=${rowStyle}>
          <Input
            class="icon-input"
            headIcon=${SearchIcon}
            placeholder="Search"
          />
        </div>
        ${example(headIconSnippet)}
        <h3>Custom tail icon</h3>
        <div style=${rowStyle}>
          <Input
            class="tail-icon-input"
            tailIcon=${CalendarIcon}
            placeholder="Date"
          />
        </div>
        ${example(tailIconSnippet)}
        ${propsTable(
          [
            {
              name: "Input",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "Controlled text value.",
                ],
                [
                  "name",
                  "string",
                  "Native name attribute.",
                ],
                [
                  "type",
                  "string",
                  "Native input type.",
                ],
                [
                  "placeholder",
                  "string",
                  "Placeholder text.",
                ],
                [
                  "headIcon",
                  "Icon | null",
                  "Leading icon class; `null` hides.",
                ],
                [
                  "tailIcon",
                  "Icon | null",
                  "Trailing icon class; `null` hides.",
                ],
              ],
            },
            {
              name: "Textarea",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "Controlled text (or children).",
                ],
                [
                  "name",
                  "string",
                  "Native name attribute.",
                ],
                [
                  "rows",
                  "number",
                  "Visible row count.",
                ],
                [
                  "placeholder",
                  "string",
                  "Placeholder text.",
                ],
                [
                  "children",
                  "node",
                  "Initial / slotted text.",
                ],
              ],
            },
            {
              name: "NumberInput",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "number",
                  "Current number.",
                ],
                [
                  "min / max / step",
                  "number",
                  "Native number constraints.",
                ],
                [
                  "placeholder",
                  "string",
                  "Placeholder when empty.",
                ],
                [
                  "onChange",
                  "(value?) => void",
                  "`number`, or `undefined` when empty.",
                ],
              ],
            },
            {
              name: "RangeInput",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "number",
                  "Slider value.",
                ],
                [
                  "min / max / step",
                  "number",
                  "Native range constraints.",
                ],
                [
                  "onChange",
                  "(value) => void",
                  "Current number.",
                ],
              ],
            },
            {
              name: "ColorInput",
              rows: [
                ...kitPropRows,
                [
                  "value",
                  "string",
                  "`#rrggbb` color.",
                ],
                [
                  "onChange",
                  "(value) => void",
                  "Selected color string.",
                ],
              ],
            },
            {
              name: "FileInput",
              rows: [
                ...kitPropRows,
                [
                  "accept",
                  "string",
                  "Native accept filter.",
                ],
                [
                  "multiple",
                  "boolean",
                  "Allow multiple files (default true).",
                ],
                [
                  "onChange",
                  "(files) => void",
                  "`File[]` selection.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiInputs);
