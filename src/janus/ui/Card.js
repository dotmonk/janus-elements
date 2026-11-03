import Component, {
  html,
} from "../index.js";

class Card extends Component {

  render() {
    const {
      title,
      subtitle,
      footer,
    } = this.props;

    return html`
      <article
        style=${{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: "0",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--janus-border)",
          borderRadius: "calc(var(--janus-radius) * 1.5)",
          backgroundColor: "var(--janus-surface)",
          color: "var(--janus-text)",
          overflow: "hidden",
        }}
      >
        ${title || subtitle
          ? html`
              <header
                style=${{
                  padding: "14px 16px 0",
                }}
              >${title
                  ? html`
                      <h3
                        style=${{
                          margin: "0",
                          fontSize: "1rem",
                        }}
                      >${title}</h3>
                    `
                  : ""}${subtitle
                  ? html`
                      <p
                        style=${{
                          margin: "2px 0 0",
                          fontSize: "0.875rem",
                          color: "var(--janus-text-muted)",
                        }}
                      >${subtitle}</p>
                    `
                  : ""}</header>
            `
          : ""}
        <div
          style=${{
            flexGrow: "1",
            padding: "12px 16px",
          }}
        >${this.childElements}</div>
        ${footer
          ? html`
              <footer
                style=${{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  padding: "10px 16px",
                  borderTop: "1px solid var(--janus-border)",
                }}
              >${footer}</footer>
            `
          : ""}
      </article>
    `;
  }
}

Component.register(Card);
