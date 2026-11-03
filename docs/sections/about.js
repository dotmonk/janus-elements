import Component, {
  html,
} from "janus-elements";

import "../Logo.js";
import {
  sectionStyle,
} from "../shared.js";

const shellInstallSnippet = `# 0.1.0 is prepared but not on npm yet.
# From a clone of this repo:
npm install
npm run dev
# After publish: npm install janus-elements`;

const installSnippet = `import Component, { html } from "janus-elements";
import "janus-elements/ui";
// Prefer deep imports in apps, e.g. "janus-elements/ui/button"`;

class DocsAbout extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <Logo size=${96} />
        <h2>Janus Elements</h2>
        <p>
          A small UI library built on Custom Elements. Components are classes with state, written with a JSX-like tagged template, plus a basic UI kit. Package name
          <code>janus-elements</code>
          ; version 0.1.0 is prepared but not yet published to npm.
        </p>
        <p>
          Use the sidebar to browse the core API, helpers (
          <a href="#/helpers">latestAsync and icon helpers</a>
          ),
          <a href="#/tooling">repo tooling</a>
          , and every UI kit component. Switch mode and theme in the header.
        </p>
        <h3>Install</h3>
        <CodeSnippet
          language="bash"
          code=${shellInstallSnippet}
        />
        <CodeSnippet
          language="javascript"
          code=${installSnippet}
        />
      </section>
    `;
  }
}

Component.register(DocsAbout);
