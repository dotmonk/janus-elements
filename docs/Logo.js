import Component, {
  html,
} from "janus-elements";

const logoMarkup = fetch(new URL(
  "./logo.svg",
  import.meta.url,
)).then(
  (response) => response.text(),
);

let logoInstance = 0;

function uniquifyClipPaths(svg) {
  const suffix = `-${++logoInstance}`;
  for (const el of svg.querySelectorAll("[id]")) {
    el.id = `${el.id}${suffix}`;
  }
  for (const el of svg.querySelectorAll("[clip-path]")) {
    el.setAttribute(
      "clip-path",
      el.getAttribute("clip-path").replace(
        /url\(#([^)]+)\)/g,
        (_, id) => `url(#${id}${suffix})`,
      ),
    );
  }
}

class Logo extends Component {

  componentWillMount() {
    logoMarkup.then(
      (markup) => this.setState(
        {
          markup,
        },
      ),
    );
  }

  render() {
    const {
      markup,
    } = this.state;
    const {
      size = 32,
    } = this.props || {};
    if (!markup) {
      return html`
        <span
          style=${{
            display: "inline-block",
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      `;
    }

    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    const svg = template.content.firstElementChild;
    svg.setAttribute(
      "width",
      size,
    );
    svg.setAttribute(
      "height",
      size,
    );
    svg.style.display = "block";
    uniquifyClipPaths(svg);
    return html`${svg}`;
  }
}

Component.register(Logo);
