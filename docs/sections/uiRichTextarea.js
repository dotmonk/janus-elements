import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const initial = `# Notes

Write **bold**, *italic*, and \`code\`.

- [ ] Task one
- [x] Task two

| Col | Value |
| --- | --- |
| A | 1 |
`;

const snippet = `<RichTextarea
  value=\${markdown}
  placeholder="Write Markdown…"
  onChange=\${(next) => setState({ markdown: next })}
/>`;

class DocsUiRichTextarea extends Component {

  constructor() {
    super();
    this.state = {
      markdown: initial,
    };
  }

  render() {
    const {
      markdown,
    } = this.state;
    return html`
      <section style=${sectionStyle}>
        <h2>Rich textarea</h2>
        <p
          style=${{
            color: "var(--janus-text-muted)",
            maxWidth: "42rem",
          }}
        >
          WYSIWYG editor whose value is Markdown. The Formatting bar is a
          <code>Toolbar</code>
          (
          <code>janus-elements/ui/toolbar</code>
          ): it stays fixed while the body scrolls, and its menus use
          <code>position: fixed</code>
          so they are not clipped. Toolbar covers bold/italic/strikethrough, a Heading menu (H1–H6), lists, task lists, quotes, fenced code (highlighted, with a language menu while the caret is in a block), horizontal rules, tables (in a table the table button becomes a menu that adds and deletes rows and columns and sets column alignment; Tab and Enter move between cells), links, and images (URL only). With the caret in a link the Link button unlinks it. Ctrl/Cmd+B and I format; undo/redo is built in (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y) for typing and toolbar commands. List buttons set the current item's kind; pressing the active one returns it to a paragraph. Enter splits or exits list items; Backspace at the start of an item joins it to the previous one, or unwraps the first item. Tab and Shift+Tab indent and outdent list items. Toolbar buttons show pressed state for the caret. Use the Markdown icon to edit the source (highlighted
          <code>CodeEditor</code>
          ), then toggle back to WYSIWYG. No extra dependencies.
        </p>
        <Field
          label="Editor"
          hint="Markdown in, Markdown out"
        >
          <RichTextarea
            value=${markdown}
            placeholder="Write Markdown…"
            onChange=${(next) => this.setState(
              {
                markdown: next,
              },
            )}
          />
        </Field>
        <p
          style=${{
            marginTop: "12px",
            color: "var(--janus-text-muted)",
          }}
        >Current Markdown</p>
        <pre
          style=${{
            margin: "0",
            padding: "10px 12px",
            borderRadius: "var(--janus-radius)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--janus-border)",
            backgroundColor: "var(--janus-raised)",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--janus-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
            fontSize: "0.8125rem",
          }}
        >${markdown}</pre>
        ${example(snippet)}
        ${propsTable(
          "RichTextarea",
          [
            ...kitPropRows,
            [
              "value",
              "string",
              "Markdown string.",
            ],
            [
              "placeholder",
              "string",
              "Empty editor hint.",
            ],
            [
              "readOnly",
              "boolean",
              "Non-editable; like `disabled` for editing, still focusable chrome.",
            ],
            [
              "onChange",
              "(markdown) => void",
              "Updated Markdown.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiRichTextarea);
