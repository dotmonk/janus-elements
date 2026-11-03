import Component, {
  html,
} from "janus-elements";
import {
  toast,
} from "janus-elements/ui";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const feedbackAlerts = [
  {
    id: "info",
    color: "info",
    title: "Heads up",
    text: "A new version is available.",
    dismissible: true,
  },
  {
    id: "success",
    color: "success",
    title: "Saved",
    text: "Your changes were saved.",
  },
  {
    id: "warning",
    color: "warning",
    title: "Check your input",
    text: "Some fields need attention.",
  },
  {
    id: "error",
    color: "error",
    title: "Something went wrong",
    text: "The request failed. Try again.",
    dismissible: true,
  },
];

const snippet = `<Feedback color="info" title="Heads up" onClose=\${dismiss}>
  A new version is available.
</Feedback>
<Feedback color="success" title="Saved">Your changes were saved.</Feedback>
<Feedback color="warning" title="Check your input">
  Some fields need attention.
</Feedback>
<Feedback color="error" title="Something went wrong" onClose=\${dismiss}>
  The request failed. Try again.
</Feedback>
<Button onClick=\${() => toast.show("Settings saved")}>Show toast</Button>
<Button
  color="success"
  onClick=\${() => toast.show("Profile updated", { color: "success" })}
>Show success toast</Button>
<Progress label="Upload" value=\${65} />
<Progress label="Backup" value=\${100} color="success" />
<Progress label="Processing" color="info" />`;

class DocsUiFeedback extends Component {

  constructor() {
    super();
    this.state = {
      dismissed: [],
    };
  }

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Feedback</h2>
        ${feedbackAlerts.filter(
          (alert) => !this.state.dismissed.includes(alert.id),
        ).map(
          (alert) => html`
            <Feedback
              key=${alert.id}
              color=${alert.color}
              title=${alert.title}
              ${alert.dismissible
                ? {
                    onClose: () => this.setState(
                      {
                        dismissed: [
                          ...this.state.dismissed,
                          alert.id,
                        ],
                      },
                    ),
                  }
                : {}}
            >${alert.text}</Feedback>
          `,
        )}
        <div style=${rowStyle}>
          <Button onClick=${() => toast.show("Settings saved")}>Show toast</Button>
          <Button
            color="success"
            onClick=${() => toast.show(
              "Profile updated",
              {
                color: "success",
              },
            )}
          >Show success toast</Button>
        </div>
        <Progress
          label="Upload"
          value=${65}
        />
        <Progress
          label="Backup"
          value=${100}
          color="success"
        />
        <Progress
          label="Processing"
          color="info"
        />
        ${example(snippet)}
        ${propsTable(
          [
            {
              name: "Feedback",
              rows: [
                ...kitPropRows,
                [
                  "title",
                  "string",
                  "Alert heading.",
                ],
                [
                  "onClose",
                  "(event?) => void",
                  "When set, shows a dismiss control.",
                ],
                [
                  "children",
                  "node",
                  "Alert body.",
                ],
              ],
            },
            {
              name: "Progress",
              rows: [
                ...kitPropRows,
                [
                  "label",
                  "string",
                  "Accessible / visible label.",
                ],
                [
                  "value",
                  "number",
                  "Progress amount; omit for indeterminate.",
                ],
                [
                  "max",
                  "number",
                  "Maximum (default 100).",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiFeedback);
