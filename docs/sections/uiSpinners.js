import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const snippet = `<Spinner>Loading...</Spinner>
<Spinner variant="dots" color="accent">Thinking...</Spinner>
<Spinner variant="bars">Syncing...</Spinner>
<Spinner variant="pulse" color="success">Busy</Spinner>`;

class DocsUiSpinners extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Spinners</h2>
        <p
          style=${{
            margin: "0 0 12px",
            color: "var(--janus-text-muted)",
          }}
        >
          Default is the ring. Pass
          <code>variant</code>
          for dots, bars, or pulse. Unknown values fall back to ring.
        </p>
        <div
          style=${{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "4px 0",
          }}
        >
          <Spinner>Loading...</Spinner>
          <Spinner
            variant="dots"
            color="accent"
          >Thinking...</Spinner>
          <Spinner variant="bars">Syncing...</Spinner>
          <Spinner
            variant="pulse"
            color="success"
          >Busy</Spinner>
        </div>
        ${example(snippet)}
        ${propsTable(
          "Spinner",
          [
            ...kitPropRows,
            [
              "variant",
              "string",
              "`ring` (default), `dots`, `bars`, or `pulse`.",
            ],
            [
              "children",
              "node",
              "Status label.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiSpinners);
