import Component, {
  html,
} from "janus-elements";

import {
  capitalize,
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
  tones,
} from "../shared.js";

const snippet = `<Badge color="standard">Standard</Badge>
<Badge color="accent">Accent</Badge>
<Badge color="success">Success</Badge>
<Badge color="warning">Warning</Badge>
<Badge color="error">Error</Badge>
<Badge color="info">Info</Badge>`;

class DocsUiBadges extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Badges</h2>
        <div style=${rowStyle}>${tones.map(
            (color) => html`
              <Badge color=${color}>${capitalize(color)}</Badge>
            `,
          )}</div>
        ${example(snippet)}
        ${propsTable(
          "Badge",
          [
            ...kitPropRows,
            [
              "children",
              "node",
              "Badge text.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiBadges);
