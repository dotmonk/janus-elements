import Component, {
  html,
} from "../index.js";

class BaseTheme extends Component {

  render() {
    const {
      mode = "system",
    } = this.props || {};
    if (mode === "system") {
      delete document.documentElement.dataset.janusTheme;
    } else {
      document.documentElement.dataset.janusTheme = mode;
    }

    return html`
      <style>
        body {
          margin: 0;
          background: var(--janus-bg);
          color: var(--janus-text);
          font-family: var(--janus-font);
          line-height: 1.5;
        }

        a {
          color: var(--janus-accent);
          text-underline-offset: 2px;
        }

        a:hover {
          color: color-mix(in oklab, var(--janus-accent) 75%, var(--janus-text));
        }

        h1, h2, h3, h4, h5, h6 {
          color: var(--janus-text);
          font-weight: 600;
          line-height: 1.25;
          margin: 0.8em 0 0.4em;
        }

        :focus-visible {
          outline: 2px solid var(--janus-focus);
          outline-offset: 2px;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: var(--janus-border-strong) transparent;
        }

        ::selection {
          background: color-mix(in oklab, var(--janus-accent) 35%, transparent);
        }
      </style>
    `;
  }
}

Component.register(BaseTheme);
