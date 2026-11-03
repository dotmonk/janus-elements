import Component, {
  html,
} from "janus-elements";

import {
  capitalize,
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const colorsSnippet = `<Panel color="standard">
  <strong>Standard panel</strong>
  <p>Body text with a link inside.</p>
  <Button color="standard">Action</Button>
</Panel>
<Panel color="accent">
  <strong>Accent panel</strong>
  <p>Body text with a link inside.</p>
  <Button color="accent">Action</Button>
</Panel>
<Panel color="success">
  <strong>Success panel</strong>
  <p>Body text with a link inside.</p>
  <Button color="success">Action</Button>
</Panel>
<Panel color="error">
  <strong>Error panel</strong>
  <p>Body text with a link inside.</p>
  <Button color="error">Action</Button>
</Panel>`;

const nestedSnippet = `<Panel>
  Outer panel
  <Panel color="accent">
    Accent panel
    <Panel>Inner panel</Panel>
  </Panel>
</Panel>`;

class DocsUiPanels extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Panels</h2>
        <h3>Colors</h3>
        ${[
          "standard",
          "accent",
          "success",
          "error",
        ].map(
          (color) => html`
            <Panel color=${color}>
              <strong>${capitalize(color)} panel</strong>
              <p
                style=${{
                  margin: "4px 0 8px",
                }}
              >
                Body text with a
                <a href="#">link</a>
                inside.
              </p>
              <Button color=${color}>Action</Button>
            </Panel>
          `,
        )}
        ${example(colorsSnippet)}
        <h3>Nested panels</h3>
        <Panel>
          Outer panel
          <Panel color="accent">
            Accent panel
            <Panel>Inner panel</Panel>
          </Panel>
        </Panel>
        ${example(nestedSnippet)}
        ${propsTable(
          "Panel",
          [
            ...kitPropRows,
            [
              "children",
              "node",
              "Panel body.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiPanels);
