import Component, {
  html,
} from "janus-elements";
import {
  pushHash,
} from "janus-elements/ui";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const importSnippet = `import {
  pushHash,
  pushPathname,
  parseLocation,
  subscribeLocation,
} from "janus-elements/ui";

const nav = (loc) => html\`
  <Navbar value=\${titleFrom(loc)} titles=\${titles} onChange=\${go} />
\`;

pushHash("/library");
pushPathname("/docs/library");
parseLocation(); // { pathname, hashPath, hashParams, searchParams }`;

const routeSnippet = `<Route hashRegex=\${/^\\/?$/}>
  <Home />
</Route>
<Route pathnameRegex=\${/^\\/library\\/?$/} basename=\${"/docs"}>
  <Library />
</Route>

<Location render=\${nav} />`;

class DocsRouting extends Component {

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Routing</h2>
        <p>
          Hash and pathname routing from
          <code>janus-elements/ui</code>
          . This docs site uses a hash path per sidebar leaf (
          <code>#/routing</code>
          ,
          <code>#/ui/buttons</code>
          , …).
        </p>
        <h3>Route</h3>
        <p>
          <code>${"<Route />"}</code>
          renders its children when
          <code>hashRegex</code>
          ,
          <code>pathnameRegex</code>
          , or both match (either is enough). Pass
          <code>basename</code>
          when the app is served under a path prefix; that prefix is stripped before the pathname test.
        </p>
        <h3>Location</h3>
        <p>
          <code>${"<Location render />"}</code>
          calls
          <code>render</code>
          with the parsed location whenever the URL changes. Use it for chrome that must track the route (sidebar, title, breadcrumbs). The location object is
          <code>{ pathname, hashPath, hashParams, searchParams }</code>
          .
        </p>
        <h3>Navigation</h3>
        <p>
          <code>pushHash</code>
          and
          <code>pushPathname</code>
          call
          <code>history.pushState</code>
          and dispatch a
          <code>pushstate</code>
          event so open routes and locations update.
          <code>parseLocation</code>
          reads the current URL once;
          <code>subscribeLocation</code>
          listens for
          <code>popstate</code>
          and
          <code>pushstate</code>
          .
          <code>${"<Router />"}</code>
          is an optional wrapper that re-renders its children on those same events.
        </p>
        <div style=${rowStyle}>
          <Button onClick=${() => pushHash("/about")}>pushHash /about</Button>
          <Button onClick=${() => pushHash("/routing")}>pushHash /routing</Button>
        </div>
        <p
          style=${{
            color: "var(--janus-text-muted)",
            fontSize: "0.9rem",
          }}
        >Try the buttons, then use the browser back and forward controls.</p>
        <CodeSnippet
          language="javascript"
          code=${importSnippet}
        />
        ${example(routeSnippet)}
        ${propsTable(
          [
            {
              name: "Route",
              rows: [
                ...kitPropRows,
                [
                  "hashRegex",
                  "RegExp",
                  "Match against the hash path; either regex may match.",
                ],
                [
                  "pathnameRegex",
                  "RegExp",
                  "Match against the pathname (after `basename`).",
                ],
                [
                  "basename",
                  "string",
                  "Path prefix stripped before the pathname test.",
                ],
                [
                  "children",
                  "node",
                  "Rendered when the route matches.",
                ],
              ],
            },
            {
              name: "Location",
              rows: [
                ...kitPropRows,
                [
                  "render",
                  "(loc) => node",
                  "`loc` is `{ pathname, hashPath, hashParams, searchParams }`.",
                ],
              ],
            },
            {
              name: "Router",
              rows: [
                ...kitPropRows,
                [
                  "children",
                  "node",
                  "Re-rendered on `popstate` / `pushstate` (optional wrapper).",
                ],
              ],
            },
            {
              name: "Navigation helpers",
              rows: [
                [
                  "pushHash",
                  "(hash) => void",
                  "Push a hash path and notify subscribers.",
                ],
                [
                  "pushPathname",
                  "(path) => void",
                  "Push a pathname and notify subscribers.",
                ],
                [
                  "parseLocation",
                  "(loc?) => object",
                  "Read the current (or given) URL once.",
                ],
                [
                  "subscribeLocation",
                  "(listener) => unsubscribe",
                  "Listen for `popstate` and `pushstate`.",
                ],
                [
                  "matchRoute",
                  "(options?, loc?) => boolean",
                  "Test `hashRegex` / `pathnameRegex` / `basename` against a location.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsRouting);
