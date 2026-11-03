import Component, {
  html,
} from "janus-elements";
import {
  highlight,
  escapeHtml,
  ensureHighlightStyles,
} from "janus-elements/ui/highlight";

class CodeSnippet extends Component {

  render() {
    ensureHighlightStyles();
    const {
      code = "",
      language = "javascript",
    } = this.props || {};
    const pre = document.createElement("pre");
    pre.className = `language-${language}`;
    const codeElement = document.createElement("code");
    codeElement.className = `language-${language}`;
    codeElement.innerHTML = highlight(
      code,
      language,
    ) || escapeHtml(code);
    pre.appendChild(codeElement);
    return html`${pre}`;
  }
}

Component.register(CodeSnippet);
