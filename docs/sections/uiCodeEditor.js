import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const samples = {
  plain: `Plain text — no tokens, only escaping.
Symbols like <tag> & "quotes" stay literal.
`,
  javascript: `function greet(name) {
  const message = \`Hello, \${name}!\`;
  return message;
}
`,
  typescript: `type User = { id: number; name: string };
export function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
`,
  html: `<section class="hero">
  <h1 data-id="title">Janus</h1>
  <!-- welcome -->
</section>
`,
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">Alpha</item>
</root>
`,
  css: `.hero {
  color: var(--janus-accent);
  padding: 1.5rem;
}
@media (min-width: 640px) {
  .hero { font-size: 1.25rem; }
}
`,
  json: `{
  "name": "janus-elements",
  "private": false,
  "version": "0.1.0"
}
`,
  csv: `name,role,active
Ada,engineer,true
Grace,lead,false
`,
  markdown: `# Code editor

Edit **source** with _highlighting_.

\`\`\`js
const ok = true;
\`\`\`

See [docs](https://example.com).
`,
  shell: `#!/usr/bin/env bash
set -euo pipefail
echo "Building \${NAME:-app}"
januse dev
`,
  perl: `#!/usr/bin/env perl
use strict;
use warnings;
my $name = "Janus";
print "Hello, $name\\n";
`,
  python: `#!/usr/bin/env python3
def greet(name: str) -> str:
    """Return a greeting."""
    return f"Hello, {name}!"
`,
  c: `#include <stdio.h>
int main(void) {
  const char *name = "Janus";
  printf("Hello, %s\\n", name);
  return 0;
}
`,
  cpp: `#include <iostream>
#include <string>
int main() {
  std::string name = "Janus";
  std::cout << "Hello, " << name << "\\n";
}
`,
  java: `public class Greeter {
  public static void main(String[] args) {
    String name = "Janus";
    System.out.println("Hello, " + name);
  }
}
`,
  sql: `SELECT id, name
FROM users
WHERE active = TRUE
ORDER BY name ASC;
`,
  yaml: `name: janus-elements
version: 0.1.0
scripts:
  docs: python3 -m http.server
`,
  diff: `--- a/greet.js
+++ b/greet.js
@@ -1,3 +1,3 @@
-export const greet = (n) => "Hi " + n;
+export const greet = (n) => \`Hello, \${n}!\`;
`,
  rust: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
fn main() {
    println!("{}", greet("Janus"));
}
`,
  go: `package main
import "fmt"
func greet(name string) string {
  return fmt.Sprintf("Hello, %s!", name)
}
func main() {
  fmt.Println(greet("Janus"))
}
`,
};

const labels = {
  plain: "Plain",
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  xml: "XML",
  css: "CSS",
  json: "JSON",
  csv: "CSV",
  markdown: "Markdown",
  shell: "Shell",
  perl: "Perl",
  python: "Python",
  c: "C",
  cpp: "C++",
  java: "Java",
  sql: "SQL",
  yaml: "YAML",
  diff: "Diff",
  rust: "Rust",
  go: "Go",
};

const languageOrder = Object.keys(samples);

const autoSample = `#!/usr/bin/env python3
def greet(name: str) -> str:
    return f"Hello, {name}!"
`;

const snippet = `<CodeEditor
  value=\${source}
  onChange=\${(value) => setState({ source: value })}
  onLanguageChange=\${(language) => setState({ detected: language })}
/>
<CodeEditor
  language="javascript"
  value=\${js}
  onChange=\${(value) => setState({ js: value })}
/>
<CodeEditor
  filename="greet.py"
  value=\${python}
  onChange=\${(value) => setState({ python: value })}
/>`;

const fullWidthSection = {
  ...sectionStyle,
  maxWidth: "none",
  width: "100%",
};

const stackStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "16px",
  width: "100%",
  marginBottom: "8px",
};

const fieldWrapStyle = {
  display: "block",
  width: "100%",
};

const editorStyle = {
  width: "100%",
  boxSizing: "border-box",
};

class DocsUiCodeEditor extends Component {

  constructor() {
    super();
    this.state = {
      autoSource: autoSample,
      detected: "",
      values: {
        ...samples,
      },
    };
  }

  render() {
    const {
      autoSource,
      detected,
      values,
    } = this.state;

    return html`
      <section style=${fullWidthSection}>
        <h2>Code editor</h2>
        <p
          style=${{
            color: "var(--janus-text-muted)",
          }}
        >
          Editable source with Janus-owned highlighting (
          <code>janus-elements/ui/highlight</code>
          :
          <code>highlight</code>
          ,
          <code>detectLanguage</code>
          ,
          <code>resolveLanguageId</code>
          ,
          <code>resolveHighlightLanguage</code>
          ,
          <code>LANGUAGE_IDS</code>
          ,
          <code>escapeHtml</code>
          ,
          <code>ensureHighlightStyles</code>
          ). Omit
          <code>language</code>
          and
          <code>filename</code>
          to auto-detect from content; use
          <code>onLanguageChange</code>
          to read the result. Lock a grammar with
          <code>language</code>
          , or hint with
          <code>filename</code>
          .
        </p>
        <div style=${stackStyle}>
          <div style=${fieldWrapStyle}>
            <Field label=${`Auto-detect (no language / filename)${detected ? ` — detected: ${detected}` : ""}`}>
              <CodeEditor
                class="code-auto"
                style=${editorStyle}
                value=${autoSource}
                onChange=${(value) => this.setState(
                  {
                    autoSource: value,
                  },
                )}
                onLanguageChange=${(language) => this.setState(
                  {
                    detected: language,
                  },
                )}
                rows=${6}
              />
            </Field>
          </div>
        </div>
        ${example(snippet)}
        <div style=${stackStyle}>${languageOrder.map(
            (language) => html`
              <div
                style=${fieldWrapStyle}
                key=${language}
              >
                <Field label=${labels[language]}>
                  <CodeEditor
                    style=${editorStyle}
                    language=${language}
                    value=${values[language]}
                    onChange=${(value) => this.setState(
                      {
                        values: {
                          ...this.state.values,
                          [language]: value,
                        },
                      },
                    )}
                    rows=${language === "plain"
                      ? 3
                      : 5}
                  />
                </Field>
              </div>
            `,
          )}</div>
        ${propsTable(
          "CodeEditor",
          [
            ...kitPropRows,
            [
              "value",
              "string",
              "Source text.",
            ],
            [
              "language",
              "string",
              "Force a grammar; omit to detect.",
            ],
            [
              "filename",
              "string",
              "Used for language detection.",
            ],
            [
              "rows",
              "number",
              "Visible rows hint.",
            ],
            [
              "readOnly",
              "boolean",
              "Native read-only textarea.",
            ],
            [
              "onChange",
              "(value) => void",
              "Updated source.",
            ],
            [
              "onLanguageChange",
              "(language) => void",
              "Resolved language id.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiCodeEditor);
