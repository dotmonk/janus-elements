import Component, {
  html,
} from "../index.js";

let fieldId = 0;

const messageStyle = {
  fontSize: "0.8125rem",
  lineHeight: "1.4",
};

const controlPriority = [
  "[role=\"textbox\"]",
  "[role=\"combobox\"]",
  "textarea",
  "select",
  "input:not([type=\"checkbox\"]):not([type=\"button\"]):not([type=\"submit\"])",
  "button",
];

class Field extends Component {

  constructor() {
    super();
    fieldId += 1;
    this._fieldId = fieldId;
  }

  hintId() {
    return `janus-field-hint-${this._fieldId}`;
  }

  errorId() {
    return `janus-field-error-${this._fieldId}`;
  }

  findControl() {
    for (const selector of controlPriority) {
      const control = this.querySelector(selector);
      if (control) {
        return control;
      }
    }
    return null;
  }

  syncDescribedBy() {
    const {
      hint,
      error,
    } = this.props || {};
    const control = this.findControl();
    if (!control) {
      return;
    }
    const ids = [
      hint
        ? this.hintId()
        : null,
      error
        ? this.errorId()
        : null,
    ].filter(Boolean);
    if (ids.length) {
      control.setAttribute(
        "aria-describedby",
        ids.join(" "),
      );
    } else {
      control.removeAttribute("aria-describedby");
    }
  }

  componentDidMount() {
    this.syncDescribedBy();
  }

  componentWillReceiveProps() {
    queueMicrotask(
      () => this.syncDescribedBy(),
    );
  }

  render() {
    const {
      label,
      hint,
      error,
    } = this.props;

    return html`
      <div
        style=${{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          margin: "8px 0",
        }}
      >
        <label
          style=${{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          <span>${label}</span>
          ${this.childElements}
        </label>
        ${hint
          ? html`
              <small
                id=${this.hintId()}
                style=${{
                  ...messageStyle,
                  color: "var(--janus-text-muted)",
                }}
              >${hint}</small>
            `
          : ""}
        ${error
          ? html`
              <small
                id=${this.errorId()}
                style=${{
                  ...messageStyle,
                  color: "var(--janus-error)",
                  fontWeight: "500",
                }}
              >${error}</small>
            `
          : ""}
      </div>
    `;
  }
}

Component.register(Field);
