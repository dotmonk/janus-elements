import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const navbarSnippet = `<Navbar
  titles=\${["First", "Second", "Third"]}
  value=\${navbarValue || "First"}
  color="standard"
  onChange=\${(value) => setState({ navbarValue: value })}
/>
<Navbar
  titles=\${["First", "Second", "Third"]}
  value=\${navbarValue || "First"}
  color="accent"
  onChange=\${(value) => setState({ navbarValue: value })}
/>`;

const toolbarSnippet = `<Toolbar label="Actions">
  <Button color="accent">Save</Button>
  <Button>Cancel</Button>
  <Select
    options=\${[{ value: "draft", name: "Draft" }, { value: "published", name: "Published" }]}
    value=\${status || "draft"}
    onChange=\${(value) => setState({ status: value })}
  />
</Toolbar>`;

const layoutSnippet = `<Tabs tabs=\${[
  { title: "Overview", content: overview },
  { title: "Details", content: details },
  { title: "Settings", content: settings },
]} />
<Accordion items=\${[
  { title: "Can I use it without a build step?", content: noBuild },
  { title: "Does it support dark mode?", content: darkMode },
  { title: "How do I change the colors?", content: colors },
]} />
<Card
  title="Starter"
  subtitle="For trying things out"
  footer=\${html\`<Button color="accent">Choose Starter</Button>\`}
>One project and community support.</Card>
<Card
  title="Pro"
  subtitle="For individuals"
  footer=\${html\`<Button color="accent">Choose Pro</Button>\`}
>Unlimited projects and priority support.</Card>
<Card
  title="Team"
  subtitle="For small teams"
  footer=\${html\`<Button color="accent">Choose Team</Button>\`}
>Shared workspaces and roles.</Card>`;

class DocsUiNavigationLayout extends Component {

  constructor() {
    super();
    this.state = {
      toolbarStatus: "draft",
    };
  }

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Navigation and layout</h2>
        <h3>Segmented navigation</h3>
        ${[
          "standard",
          "accent",
        ].map(
          (color) => html`
            <div style=${rowStyle}>
              <Navbar
                titles=${[
                  "First",
                  "Second",
                  "Third",
                ]}
                color=${color}
                onChange=${(value) => this.setState(
                  {
                    navbarValue: value,
                  },
                )}
                value=${this.state.navbarValue || "First"}
              />
            </div>
          `,
        )}
        ${example(navbarSnippet)}
        <h3>Toolbar</h3>
        <p
          style=${{
            margin: "0 0 8px",
            color: "var(--janus-text-muted)",
          }}
        >
          A flush
          <code>role="toolbar"</code>
          button group for Button and Select (and other focusable controls): shared outer corners, abutted edges. Arrow keys, Home and End move between items.
        </p>
        <div style=${rowStyle}>
          <Toolbar label="Actions">
            <Button color="accent">Save</Button>
            <Button>Cancel</Button>
            <Select
              options=${[
                {
                  value: "draft",
                  name: "Draft",
                },
                {
                  value: "published",
                  name: "Published",
                },
              ]}
              value=${this.state.toolbarStatus || "draft"}
              onChange=${(value) => this.setState(
                {
                  toolbarStatus: value,
                },
              )}
            />
          </Toolbar>
        </div>
        ${example(toolbarSnippet)}
        <h3>Tabs</h3>
        <Tabs
          tabs=${[
            {
              title: "Overview",
              content: html`
                <p
                  style=${{
                    margin: "0",
                  }}
                >Tabs switch between panels with the mouse or the arrow keys.</p>
              `,
            },
            {
              title: "Details",
              content: html`
                <p
                  style=${{
                    margin: "0",
                  }}
                >Only the selected tab is in the tab order; the others are reached with the arrow keys.</p>
              `,
            },
            {
              title: "Settings",
              content: html`
                <p
                  style=${{
                    margin: "0",
                  }}
                >Each panel is labelled by its tab.</p>
              `,
            },
          ]}
        />
        <h3>Accordion</h3>
        <div
          style=${{
            margin: "0 0 16px",
          }}
        >
          <Accordion
            items=${[
              {
                title: "Can I use it without a build step?",
                content: html`
                  Yes. Import the ES modules directly.
                `,
              },
              {
                title: "Does it support dark mode?",
                content: html`
                  It follows the system setting, and the theme can be forced to light or dark.
                `,
              },
              {
                title: "How do I change the colors?",
                content: html`
                  Override the --janus-* custom properties in your own stylesheet.
                `,
              },
            ]}
          />
        </div>
        <h3>Cards</h3>
        <div
          style=${{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >${[
            {
              title: "Starter",
              subtitle: "For trying things out",
              body: "One project and community support.",
            },
            {
              title: "Pro",
              subtitle: "For individuals",
              body: "Unlimited projects and priority support.",
            },
            {
              title: "Team",
              subtitle: "For small teams",
              body: "Shared workspaces and roles.",
            },
          ].map(
            (plan) => html`
              <Card
                title=${plan.title}
                subtitle=${plan.subtitle}
                footer=${html`
                  <Button color="accent">${`Choose ${plan.title}`}</Button>
                `}
              >${plan.body}</Card>
            `,
          )}</div>
        ${example(layoutSnippet)}
        ${propsTable(
          [
            {
              name: "Navbar",
              rows: [
                ...kitPropRows,
                [
                  "titles",
                  "string[]",
                  "Segment labels.",
                ],
                [
                  "value",
                  "string",
                  "Selected title.",
                ],
                [
                  "label",
                  "string",
                  "Accessible group label.",
                ],
                [
                  "onChange",
                  "(title) => void",
                  "Selected title.",
                ],
              ],
            },
            {
              name: "Toolbar",
              rows: [
                ...kitPropRows,
                [
                  "label",
                  "string",
                  "Accessible toolbar name (`aria-label`).",
                ],
                [
                  "orientation",
                  "\"horizontal\" | \"vertical\"",
                  "Arrow-key axis; default horizontal.",
                ],
                [
                  "children",
                  "node",
                  "Typically Button and Select.",
                ],
              ],
            },
            {
              name: "Tabs",
              rows: [
                ...kitPropRows,
                [
                  "tabs",
                  "{ title, content }[]",
                  "Tab definitions.",
                ],
              ],
            },
            {
              name: "Accordion",
              rows: [
                ...kitPropRows,
                [
                  "items",
                  "{ id?, title, content }[]",
                  "Panels; `id`/`key`/`title` keys open state.",
                ],
              ],
            },
            {
              name: "Card",
              rows: [
                ...kitPropRows,
                [
                  "title",
                  "string",
                  "Card heading.",
                ],
                [
                  "subtitle",
                  "string",
                  "Secondary heading.",
                ],
                [
                  "footer",
                  "node",
                  "Footer content.",
                ],
                [
                  "children",
                  "node",
                  "Card body.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiNavigationLayout);
