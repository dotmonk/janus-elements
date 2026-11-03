import Component, {
  html,
} from "janus-elements";
import {
  modal,
} from "janus-elements/ui";

import {
  example,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const snippet = `<Button onClick=\${() => modal.dialog(content, { callback })}>
  Dialog
</Button>
<Button onClick=\${() => modal.alert("This is the alert message.", { callback })}>
  Alert
</Button>
<Button onClick=\${() => modal.confirm("This is the alert message?", { callback })}>
  Confirm
</Button>
<Button onClick=\${() => modal.input("What is your message?", { callback })}>
  Input
</Button>`;

class DocsUiModals extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Modals</h2>
        <div style=${rowStyle}>
          <Button
            onClick=${() => modal.dialog(
              html`
                <h3
                  style=${{
                    marginTop: "0",
                  }}
                >A dialog</h3>
                <p>Any content can go in a dialog.</p>
                <Button>A button</Button>
              `,
              {
                callback: (result) => console.log(result),
              },
            )}
          >Dialog</Button>
          <Button
            onClick=${() => modal.alert(
              "This is the alert message.",
              {
                callback: (result) => console.log(result),
              },
            )}
          >Alert</Button>
          <Button
            onClick=${() => modal.confirm(
              "This is the alert message?",
              {
                callback: (result) => console.log(result),
              },
            )}
          >Confirm</Button>
          <Button
            onClick=${() => modal.input(
              "What is your message?",
              {
                callback: (result) => console.log(result),
              },
            )}
          >Input</Button>
        </div>
        ${example(snippet)}
        ${propsTable(
          "modal (API)",
          [
            [
              "modal.dialog",
              "(content, options?)",
              "Open a dialog; `options.callback` on close.",
            ],
            [
              "modal.alert",
              "(message, options?)",
              "Alert dialog.",
            ],
            [
              "modal.confirm",
              "(message, options?)",
              "Confirm dialog; callback gets boolean.",
            ],
            [
              "modal.input",
              "(message, options?)",
              "Prompt dialog; callback gets string or cancel.",
            ],
            [
              "modal.close",
              "()",
              "Close the top modal.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiModals);
