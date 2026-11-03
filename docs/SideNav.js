import Component, {
  html,
} from "janus-elements";
import {
  pushHash,
} from "janus-elements/ui";

import {
  ancestorsOfHash,
  navTree,
  normalizeDocsHash,
} from "./nav.js";

const leafButtonStyle = (active) => ({
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "6px 10px",
  margin: "0",
  border: "none",
  borderRadius: "var(--janus-radius)",
  backgroundColor: active
    ? "var(--janus-raised)"
    : "transparent",
  color: active
    ? "var(--janus-text)"
    : "var(--janus-text-muted)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: active
    ? "600"
    : "500",
  cursor: "pointer",
  ":hover": {
    backgroundColor: "var(--janus-raised)",
    color: "var(--janus-text)",
  },
});

const branchButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  width: "100%",
  textAlign: "left",
  padding: "6px 10px",
  margin: "0",
  border: "none",
  borderRadius: "var(--janus-radius)",
  backgroundColor: "transparent",
  color: "var(--janus-text)",
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: "600",
  cursor: "pointer",
  ":hover": {
    backgroundColor: "var(--janus-raised)",
  },
};

class SideNav extends Component {

  constructor() {
    super();
    this.state = {
      expanded: {},
    };
  }

  toggleBranch(id) {
    this.setState(
      {
        expanded: {
          ...this.state.expanded,
          [id]: !this.state.expanded[id],
        },
      },
    );
  }

  selectLeaf(hash) {
    pushHash(hash);
    const {
      onNavigate,
    } = this.props || {};
    onNavigate && onNavigate();
  }

  renderNode(node, activeHash, expanded, depth = 0) {
    const pad = {
      paddingLeft: `${10 + depth * 12}px`,
    };

    if (node.children) {
      const open = Boolean(expanded[node.id]);
      return html`
        <div>
          <button
            type="button"
            style=${{
              ...branchButtonStyle,
              ...pad,
            }}
            aria-expanded=${open
              ? "true"
              : "false"}
            onClick=${() => this.toggleBranch(node.id)}
          >
            <span aria-hidden="true">${open
                ? "▾"
                : "▸"}</span>
            ${node.label}
          </button>
          ${open
            ? html`
                <div
                  role="group"
                  aria-label=${node.label}
                >${node.children.map(
                    (child) => this.renderNode(
                      child,
                      activeHash,
                      expanded,
                      depth + 1,
                    ),
                  )}</div>
              `
            : html``}
        </div>
      `;
    }

    const active = activeHash === node.hash;
    return html`
      <button
        type="button"
        style=${{
          ...leafButtonStyle(active),
          ...pad,
        }}
        aria-current=${active
          ? "page"
          : "false"}
        onClick=${() => this.selectLeaf(node.hash)}
      >${node.label}</button>
    `;
  }

  render() {
    return html`
      <Location
        render=${(location) => {
          const activeHash = normalizeDocsHash(location.hashPath);
          const expanded = {
            ...this.state.expanded,
          };
          for (const id of ancestorsOfHash(activeHash)) {
            expanded[id] = true;
          }
          return html`
            <nav
              aria-label="Documentation"
              style=${{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "8px",
                height: "100%",
                overflow: "auto",
                boxSizing: "border-box",
              }}
            >${navTree.map(
                (node) => this.renderNode(
                  node,
                  activeHash,
                  expanded,
                ),
              )}</nav>
          `;
        }}
      />
    `;
  }
}

Component.register(SideNav);
