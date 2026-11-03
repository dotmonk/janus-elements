import Component, {
  html,
} from "janus-elements";
import SearchIcon from "janus-elements/ui/icons/search";
import ExportIcon from "janus-elements/ui/icons/export";

import {
  capitalize,
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
  tones,
} from "../shared.js";

const snippet = `<Button color="standard">Standard</Button>
<Button color="accent">Accent</Button>
<Button color="success">Success</Button>
<Button color="warning">Warning</Button>
<Button color="error">Error</Button>
<Button color="info">Info</Button>
<Button color="standard" active>Standard</Button>
<Button color="accent" active>Accent</Button>
<Button color="success" active>Success</Button>
<Button color="warning" active>Warning</Button>
<Button color="error" active>Error</Button>
<Button color="info" active>Info</Button>
<Button color="standard" disabled>Standard</Button>
<Button color="accent" disabled>Accent</Button>
<Button color="success" disabled>Success</Button>
<Button color="warning" disabled>Warning</Button>
<Button color="error" disabled>Error</Button>
<Button color="info" disabled>Info</Button>
<Button onClick=\${() => alert("Clicked")}>Click me</Button>`;

const iconSnippet = `import SearchIcon from "janus-elements/ui/icons/search";
import ExportIcon from "janus-elements/ui/icons/export";

<Button headIcon=\${SearchIcon}>Search</Button>
<Button color="accent" tailIcon=\${ExportIcon}>Export</Button>
<Button
  color="info"
  headIcon=\${SearchIcon}
  tailIcon=\${ExportIcon}
>
  Both
</Button>`;

class DocsUiButtons extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Buttons</h2>
        <div style=${rowStyle}>${tones.map(
            (color) => html`
              <Button color=${color}>${capitalize(color)}</Button>
            `,
          )}</div>
        <div style=${rowStyle}>${tones.map(
            (color) => html`
              <Button
                color=${color}
                active=${true}
              >${capitalize(color)}</Button>
            `,
          )}</div>
        <div style=${rowStyle}>${tones.map(
            (color) => html`
              <Button
                color=${color}
                disabled=${true}
              >${capitalize(color)}</Button>
            `,
          )}</div>
        <div style=${rowStyle}>
          <Button onClick=${() => alert("Clicked")}>Click me</Button>
        </div>
        <p
          style=${{
            margin: "12px 0 6px",
            fontSize: "0.875rem",
            color: "var(--janus-text-muted)",
          }}
        >
          Icons (
          <code>headIcon</code>
          /
          <code>tailIcon</code>
          ) animate on hover
        </p>
        <div style=${rowStyle}>
          <Button
            class="icon-button"
            headIcon=${SearchIcon}
          >Search</Button>
          <Button
            color="accent"
            tailIcon=${ExportIcon}
          >Export</Button>
          <Button
            class="icon-button-both"
            color="info"
            headIcon=${SearchIcon}
            tailIcon=${ExportIcon}
          >Both</Button>
          <Button
            class="icon-button-disabled"
            headIcon=${SearchIcon}
            disabled=${true}
          >Disabled</Button>
        </div>
        ${example(snippet)}
        ${example(iconSnippet)}
        ${propsTable(
          "Button",
          [
            ...kitPropRows,
            [
              "active",
              "boolean",
              "Pressed / selected appearance.",
            ],
            [
              "href",
              "string",
              "When set, renders as a link.",
            ],
            [
              "headIcon",
              "Icon | null",
              "Leading icon class; animates on hover.",
            ],
            [
              "tailIcon",
              "Icon | null",
              "Trailing icon class; animates on hover.",
            ],
            [
              "onClick",
              "(event) => void",
              "Click handler.",
            ],
            [
              "children",
              "node",
              "Button label.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiButtons);
