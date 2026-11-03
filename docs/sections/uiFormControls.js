import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const plans = [
  {
    name: "Free",
    value: "free",
  },
  {
    name: "Pro",
    value: "pro",
  },
  {
    name: "Team",
    value: "team",
  },
];

const snippet = `<Checkbox
  checked=\${notifications}
  onChange=\${(event) => setState({ notifications: event.target.checked })}
>Email notifications</Checkbox>
<Checkbox disabled>Unavailable option</Checkbox>
<Switch
  checked=\${compact}
  onChange=\${(event) => setState({ compact: event.target.checked })}
>Compact layout</Switch>
<RadioGroup
  name="plan"
  label="Plan"
  value=\${plan}
  options=\${plans}
  onChange=\${(event) => setState({ plan: event.target.value })}
/>
<Field label="Email" hint="We never share your address.">
  <Input value="janus@example.com" />
</Field>
<Field label="Username" error="That name is taken.">
  <Input color="error" value="janus" />
</Field>`;

class DocsUiFormControls extends Component {

  constructor() {
    super();
    this.state = {
      notifications: true,
      compact: false,
      plan: "free",
    };
  }

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Form controls</h2>
        <div>
          <Checkbox
            checked=${this.state.notifications}
            onChange=${(event) => this.setState(
              {
                notifications: event.target.checked,
              },
            )}
          >Email notifications</Checkbox>
          <Checkbox disabled=${true}>Unavailable option</Checkbox>
        </div>
        <div>
          <Switch
            checked=${this.state.compact}
            onChange=${(event) => this.setState(
              {
                compact: event.target.checked,
              },
            )}
          >Compact layout</Switch>
        </div>
        <RadioGroup
          name="plan"
          label="Plan"
          value=${this.state.plan}
          options=${plans}
          onChange=${(event) => this.setState(
            {
              plan: event.target.value,
            },
          )}
        />
        <p
          class="form-summary"
          style=${{
            color: "var(--janus-text-muted)",
          }}
        >Notifications: ${this.state.notifications
            ? "on"
            : "off"} · Compact layout: ${this.state.compact
            ? "on"
            : "off"} · Plan: ${this.state.plan}</p>
        <Field
          label="Email"
          hint="We never share your address."
        >
          <Input value="janus@example.com" />
        </Field>
        <Field
          label="Username"
          error="That name is taken."
        >
          <Input
            color="error"
            value="janus"
          />
        </Field>
        ${example(snippet)}
        ${propsTable(
          [
            {
              name: "Checkbox / Switch",
              rows: [
                ...kitPropRows,
                [
                  "checked",
                  "boolean",
                  "Checked state.",
                ],
                [
                  "name",
                  "string",
                  "Native name.",
                ],
                [
                  "onChange",
                  "(event) => void",
                  "Change event; read `event.target.checked`.",
                ],
                [
                  "children",
                  "node",
                  "Label.",
                ],
              ],
            },
            {
              name: "RadioGroup",
              rows: [
                ...kitPropRows,
                [
                  "label",
                  "string",
                  "Group legend.",
                ],
                [
                  "name",
                  "string",
                  "Shared radio name.",
                ],
                [
                  "value",
                  "string",
                  "Selected option value.",
                ],
                [
                  "options",
                  "{ name, value }[]",
                  "Radio options.",
                ],
                [
                  "onChange",
                  "(event) => void",
                  "Change event; read `event.target.value`.",
                ],
              ],
            },
            {
              name: "Field",
              rows: [
                ...kitPropRows,
                [
                  "label",
                  "string",
                  "Visible label.",
                ],
                [
                  "hint",
                  "string",
                  "Help text; linked via `aria-describedby`.",
                ],
                [
                  "error",
                  "string",
                  "Error text; linked via `aria-describedby`.",
                ],
                [
                  "children",
                  "node",
                  "The control.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiFormControls);
