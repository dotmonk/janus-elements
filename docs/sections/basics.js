import Component, {
  html,
} from "janus-elements";

import {
  sectionStyle,
} from "../shared.js";

const nestedStyle = {
  padding: "12px 14px",
  border: "1px solid var(--janus-border)",
  borderRadius: "var(--janus-radius)",
  backgroundColor: "var(--janus-surface)",
  maxWidth: "36ch",
  ":hover": {
    borderColor: "var(--janus-accent)",
  },
  b: {
    color: "#b45309",
  },
  ">code": {
    fontSize: "14px",
    color: "var(--janus-text-muted)",
  },
};

const styleSnippet = `style=\${{
  padding: "12px 14px",
  border: "1px solid var(--janus-border)",
  ":hover": { borderColor: "var(--janus-accent)" },
  b: { color: "#b45309" },
  ">code": { fontSize: "14px" },
}}`;

class DocsBasics extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Basics</h2>
        <p>
          Core API:
          <code>Component</code>
          , the
          <code>html</code>
          tagged template, and
          <code>render</code>
          . Templates use the
          <code>html</code>
          tag so editors that highlight lit-html treat them as HTML.
        </p>
        <h3>Component</h3>
        <p>
          Subclass
          <code>Component</code>
          , implement
          <code>render()</code>
          , and call
          <code>Component.register</code>
          . That defines
          <code>janus-</code>
          plus the class name in kebab case, for example
          <code>${"<janus-counter>"}</code>
          . Each capital letter starts a new word, so
          <code>UI</code>
          becomes
          <code>${"<janus-u-i>"}</code>
          .
        </p>
        <p>
          Props from the parent arrive as
          <code>this.props</code>
          . Lifecycle:
          <code>componentWillMount</code>
          and
          <code>componentDidMount</code>
          on every connect,
          <code>componentWillUnmount</code>
          on every disconnect. New props arrive through
          <code>componentWillReceiveProps(props, state)</code>
          .
        </p>
        <h3>Templates</h3>
        <ul>
          <li>
            A capitalised tag is a Janus Elements component (
            <code>${"<Button>"}</code>
            →
            <code>${"<janus-button>"}</code>
            ); lowercase tags are HTML.
          </li>
          <li>
            Every element must be closed:
            <code>${"<br />"}</code>
            ,
            <code>${"<p></p>"}</code>
            .
          </li>
          <li>
            <code>onClick=\${fn}</code>
            attaches a listener; event attributes accept only functions. On a component, the handler is attached to the component element and fires via bubbling.
          </li>
          <li>
            Give list items a
            <code>key</code>
            so they keep DOM, focus and state when the list changes.
          </li>
          <li>
            <code>${"${html`...`}"}</code>
            builds real DOM nodes. Pass that result as a prop when a component should render rich markup, not only a string.
          </li>
        </ul>
        <h3>Nested selectors</h3>
        <p>
          <code>style=\${{ ... }}</code>
          becomes a generated class. Nested objects are selectors relative to that class: keys that start with
          <code>:</code>
          or
          <code>></code>
          join directly (
          <code>:hover</code>
          ,
          <code>>code</code>
          ); other keys are descendants (
          <code>b</code>
          → a space before
          <code>b</code>
          ).
        </p>
        <div
          class="style-demo"
          style=${nestedStyle}
        >
          Hover the box:
          <b>bold</b>
          uses a descendant selector;
          <code>code</code>
          is a direct child.
        </div>
        <div
          style=${{
            marginTop: "12px",
          }}
        >
          <CodeSnippet
            language="javascript"
            code=${styleSnippet}
          />
        </div>
        <h3>Rendering</h3>
        <p>
          <code>setState</code>
          and a parent's re-render update the existing DOM in place. Focus, typed text and child component state survive; attributes the browser sets itself (such as
          <code>open</code>
          on
          <code>${"<details>"}</code>
          ) are kept.
        </p>
      </section>
    `;
  }
}

Component.register(DocsBasics);
