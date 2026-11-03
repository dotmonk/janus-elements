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

const snippet = `<Tooltip tooltip="Plain string content">
  <Button>String tooltip</Button>
</Tooltip>
<Tooltip tooltip=\${html\`<p><b>Bold</b> Regular <i>italic</i></p>\`}>
  <Button>Markup tooltip</Button>
</Tooltip>`;

class DocsUiTooltip extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Tooltip</h2>
        <p
          style=${{
            margin: "0 0 12px",
            color: "var(--janus-text-muted)",
          }}
        >
          The
          <code>tooltip</code>
          prop accepts a plain string or rich markup from
          <code>${"html`...`"}</code>
          (bold, italic, and other elements).
        </p>
        <div style=${rowStyle}>
          <Tooltip tooltip="Plain string content">
            <Button>String tooltip</Button>
          </Tooltip>
          <Tooltip
            tooltip=${html`
              <p>
                <b>Bold</b>
                Regular
                <i>italic</i>
              </p>
            `}
          >
            <Button>Markup tooltip</Button>
          </Tooltip>
        </div>
        ${example(snippet)}
        ${propsTable(
          "Tooltip",
          [
            ...kitPropRows,
            [
              "tooltip",
              "string | node",
              "Tooltip content (string or `html\`...\`).",
            ],
            [
              "children",
              "node",
              "Trigger element.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiTooltip);
