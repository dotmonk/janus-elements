import Component, {
  html,
} from "../index.js";

let instanceCount = 0;

const tabStyle = (selected) => ({
  marginBottom: "-1px",
  padding: "8px 14px",
  borderWidth: "0 0 2px",
  borderStyle: "solid",
  borderColor: selected
    ? "var(--janus-accent)"
    : "transparent",
  backgroundColor: "transparent",
  color: selected
    ? "var(--janus-text)"
    : "var(--janus-text-muted)",
  font: "inherit",
  fontSize: "0.9375rem",
  fontWeight: selected
    ? "600"
    : "500",
  cursor: "pointer",
  ":hover": {
    color: "var(--janus-text)",
  },
});

class Tabs extends Component {

  constructor() {
    super();
    instanceCount += 1;
    this.idPrefix = `janus-tabs-${instanceCount}`;
    this.state = {
      selected: 0,
    };
  }

  select(index, moveFocus) {
    this.setState(
      {
        selected: index,
      },
    );
    if (moveFocus) {
      this.querySelectorAll("[role=\"tab\"]")[index].focus();
    }
  }

  handleKeydown(event) {
    const count = this.props.tabs.length;
    const {
      selected,
    } = this.state;
    const targets = {
      ArrowRight: selected + 1,
      ArrowLeft: selected - 1,
      Home: 0,
      End: count - 1,
    };
    if (event.key in targets) {
      event.preventDefault();
      this.select(
        (targets[event.key] + count) % count,
        true,
      );
    }
  }

  render() {
    const {
      tabs,
    } = this.props;
    const {
      selected,
    } = this.state;
    const tabId = (index) => `${this.idPrefix}-tab-${index}`;
    const panelId = (index) => `${this.idPrefix}-panel-${index}`;

    return html`
      <div>
        <div
          role="tablist"
          style=${{
            display: "flex",
            gap: "4px",
            borderBottom: "1px solid var(--janus-border)",
          }}
          onKeydown=${(event) => this.handleKeydown(event)}
        >${tabs.map(
            (tab, index) => html`
              <button
                type="button"
                role="tab"
                id=${tabId(index)}
                aria-controls=${panelId(index)}
                aria-selected=${index === selected
                  ? "true"
                  : "false"}
                tabindex=${index === selected
                  ? "0"
                  : "-1"}
                style=${tabStyle(index === selected)}
                onClick=${() => this.select(index)}
              >${tab.title}</button>
            `,
          )}</div>
        ${tabs.map(
          (tab, index) => html`
            <div
              role="tabpanel"
              id=${panelId(index)}
              aria-labelledby=${tabId(index)}
              tabindex="0"
              style=${{
                padding: "16px 4px 4px",
              }}
              ${index === selected
                ? {}
                : {
                    hidden: "",
                  }}
            >${tab.content}</div>
          `,
        )}
      </div>
    `;
  }
}

Component.register(Tabs);
