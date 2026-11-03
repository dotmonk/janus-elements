import Component, {
  html,
} from "../index.js";

const itemKey = (item, index) => item.id ?? item.key ?? item.title ?? index;

class Accordion extends Component {

  constructor() {
    super();
    this.state = {
      open: {},
    };
  }

  toggle(key, isOpen) {
    if (Boolean(this.state.open[key]) !== isOpen) {
      this.setState(
        {
          open: {
            ...this.state.open,
            [key]: isOpen,
          },
        },
      );
    }
  }

  render() {
    const {
      items,
    } = this.props;
    const {
      open,
    } = this.state;

    return html`
      <div
        style=${{
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--janus-border)",
          borderRadius: "var(--janus-radius)",
          overflow: "hidden",
        }}
      >${items.map(
          (item, index) => {
            const key = itemKey(
              item,
              index,
            );
            return html`
              <details
                key=${key}
                style=${{
                  borderTop: index === 0
                    ? "none"
                    : "1px solid var(--janus-border)",
                  ":is([open]) > summary::after": {
                    transform: "rotate(180deg)",
                  },
                }}
                onToggle=${(event) => this.toggle(
                  key,
                  event.target.open,
                )}
                ${open[key]
                  ? {
                      open: "",
                    }
                  : {}}
              >
                <summary
                  style=${{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    fontWeight: "500",
                    cursor: "pointer",
                    listStyle: "none",
                    "::-webkit-details-marker": {
                      display: "none",
                    },
                    "::after": {
                      content: "\"▾\"",
                      color: "var(--janus-text-muted)",
                      transition: "transform 120ms",
                    },
                    ":hover": {
                      backgroundColor: "var(--janus-raised)",
                    },
                  }}
                >${item.title}</summary>
                <div
                  style=${{
                    padding: "0 16px 14px",
                  }}
                >${item.content}</div>
              </details>
            `;
          },
        )}</div>
    `;
  }
}

Component.register(Accordion);
