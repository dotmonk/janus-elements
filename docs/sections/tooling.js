import Component, {
  html,
} from "janus-elements";

import {
  sectionStyle,
} from "../shared.js";

const lintSnippet = `npm run lint
# or: januse lint [paths...]
# default path: src`;

const formatSnippet = `npm run format          # rewrite .js/.mjs/.ts/.json/.svg/.html
npm run check-format     # exit -1 if a rewrite would change a file
# skips *.compact.js and *.spaced.js (format round-trip fixtures)`;

const devSnippet = `npm run dev
# januse dev --watch src --watch docs \\
#   --sync "src/janus:docs/lib/janus" docs
# serves http://127.0.0.1:8000/ with HMR; open /docs/`;

const checkSnippet = `./check.sh
# Docker: tsc --noEmit → januse format --check docs src →
# node --test → Playwright (chromium/firefox/webkit)`;

const syncSnippet = `node scripts/sync-ui-exports.mjs
# regenerates package.json exports + sideEffects from
# src/janus/ui/exports.manifest.json`;

class DocsTooling extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Tooling</h2>
        <p>
          The
          <code>januse</code>
          CLI (
          <code>bin/januse.mjs</code>
          , npm
          <code>bin</code>
          name
          <code>januse</code>
          ) covers lint, format, and the docs/dev server. After install:
          <code>npx januse</code>
          . Relative paths resolve from the current working directory. The Docker gate
          <code>./check.sh</code>
          is the full validation entry point.
        </p>
        <h3>januse lint</h3>
        <p>
          Static checks on
          <code>.js</code>
          /
          <code>.mjs</code>
          /
          <code>.ts</code>
          : unused bindings (unless named
          <code>_</code>
          ), undefined identifiers, prefer
          <code>===</code>
          , duplicate object keys. Default path
          <code>src</code>
          .
        </p>
        <CodeSnippet
          language="bash"
          code=${lintSnippet}
        />
        <h3>januse format</h3>
        <p>
          Pretty-prints JavaScript/TypeScript (including
          <code>html\`…\`</code>
          templates), JSON, SVG, and HTML. Pass
          <code>--check</code>
          to report drift without writing (exit code
          <code>-1</code>
          / shell
          <code>255</code>
          when a file would change). Files ending in
          <code>.compact.js</code>
          or
          <code>.spaced.js</code>
          are skipped so extreme whitespace fixtures survive.
        </p>
        <CodeSnippet
          language="bash"
          code=${formatSnippet}
        />
        <h3>januse dev</h3>
        <p>
          Serves the repo on
          <code>127.0.0.1:8000</code>
          (override with
          <code>PORT</code>
          ), watches paths, optional
          <code>--sync from:to</code>
          copies (docs use
          <code>src/janus → docs/lib/janus</code>
          ), and reloads modules over a WebSocket HMR channel. Responses use no-store cache headers.
        </p>
        <CodeSnippet
          language="bash"
          code=${devSnippet}
        />
        <h3>./check.sh</h3>
        <p>
          Builds the
          <code>janus-check</code>
          image (retries intermittent BuildKit failures), then inside Docker runs
          <code>tsc --noEmit</code>
          ,
          <code>januse format --check docs src</code>
          , unit tests, and Playwright. GitHub Actions check and Pages workflows call the same script. Specs tagged
          <code>@smoke</code>
          are the fast acceptance subset.
        </p>
        <CodeSnippet
          language="bash"
          code=${checkSnippet}
        />
        <h3>Package exports sync</h3>
        <p>
          UI
          <code>exports</code>
          and
          <code>sideEffects</code>
          are generated from
          <code>src/janus/ui/exports.manifest.json</code>
          . Edit the manifest, then sync before committing.
        </p>
        <CodeSnippet
          language="bash"
          code=${syncSnippet}
        />
      </section>
    `;
  }
}

Component.register(DocsTooling);
