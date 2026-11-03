import Component, {
  html,
} from "../index.js";

import "./Button.js";

class Navbar extends Component {

  render() {
    const {
      value,
      titles,
      size,
      disabled,
      color,
      onChange,
      label,
    } = this.props;

    return html`
      <div
        role="radiogroup"
        aria-label=${label || "Navigation"}
        style=${{
          display: "inline-flex",
          gap: "2px",
          padding: "3px",
          borderRadius: "calc(var(--janus-radius) + 3px)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--janus-border)",
          backgroundColor: "var(--janus-surface)",
        }}
      >${titles.map(
          (title) => html`
            <Button
              role="radio"
              aria-checked=${value === title
                ? "true"
                : "false"}
              style=${value === title
                ? {
                    margin: "0",
                  }
                : {
                    margin: "0",
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                  }}
              size=${size}
              disabled=${disabled}
              color=${color}
              active=${value === title}
              onClick=${() => onChange && onChange(title)}
            >${title}</Button>
          `,
        )}</div>
    `;
  }
}

Component.register(Navbar);
