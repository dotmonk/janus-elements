import assert from "node:assert/strict";
import test from "node:test";
import {
  parse,
  print,
} from "../../scripts/januse/js-syntax.mjs";
import {
  formatJson,
  formatMarkup,
} from "../../scripts/januse/text-format.mjs";

/** Parse → print once and assert a second print is identical. */
function assertStable(source, label = "format") {
  const {
    ast,
    error,
  } = parse(source);
  assert.equal(
    error,
    undefined,
    `${label}: parse error`,
  );
  const once = print(ast);
  const {
    ast: againAst,
    error: againError,
  } = parse(once);
  assert.equal(
    againError,
    undefined,
    `${label}: re-parse error`,
  );
  assert.equal(
    print(againAst),
    once,
    `${label}: not idempotent`,
  );
  return once;
}

function assertPrintsTo(source, expected, label = "format") {
  const once = assertStable(
    source,
    label,
  );
  assert.equal(
    once,
    expected,
    label,
  );
  return once;
}

const wrongIndent = `const themeAccentSwatch = (option) => html\`
  <span
    aria-hidden="true"
    style=\${{
    display: "inline-flex",
    width: "16px",
    height: "16px",
    boxSizing: "border-box",
    borderRadius: "3px",
    border: "1px solid var(--janus-border)",
    overflow: "hidden",
    flexShrink: "0",
    lineHeight: "0",
  }}
  >
    <span
      style=\${{
    flex: "1",
    backgroundColor: option.lightAccent
  }}
    />
    <span
      style=\${{
    flex: "1",
    backgroundColor: option.darkAccent
  }}
    />
  </span>
\`;
`;

const correctIndent = `const themeAccentSwatch = (option) => html\`
  <span
    aria-hidden="true"
    style=\${{
      display: "inline-flex",
      width: "16px",
      height: "16px",
      boxSizing: "border-box",
      borderRadius: "3px",
      border: "1px solid var(--janus-border)",
      overflow: "hidden",
      flexShrink: "0",
      lineHeight: "0",
    }}
  >
    <span
      style=\${{
        flex: "1",
        backgroundColor: option.lightAccent,
      }}
    />
    <span
      style=\${{
        flex: "1",
        backgroundColor: option.darkAccent,
      }}
    />
  </span>
\`;
`;

test(
  "html style objects indent relative to the attribute line",
  () => {
    const {
      ast,
      error,
    } = parse(wrongIndent);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      correctIndent,
    );
  },
);

test(
  "html style object indent is stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(correctIndent);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      correctIndent,
    );
  },
);

const gluedOptionLabel = `const themeOptionLabel = (option) => html\`
  <span
    style=\${{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      height: "16px",
      fontSize: "0.875rem",
      lineHeight: "16px",
    }}
  >
    \${themeAccentSwatch(option)}
    <span style=\${{
      lineHeight: "16px",
    }}>\${option.name}</span>
  </span>
\`;
`;

const brokenOptionLabel = `const themeOptionLabel = (option) => html\`
  <span
    style=\${{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      height: "16px",
      fontSize: "0.875rem",
      lineHeight: "16px",
    }}
  >
    \${themeAccentSwatch(option)}
    <span
      style=\${{
        lineHeight: "16px",
      }}
    >\${option.name}</span>
  </span>
\`;
`;

test(
  "html multiline style attributes break the host tag and children",
  () => {
    const {
      ast,
      error,
    } = parse(gluedOptionLabel);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenOptionLabel,
    );
  },
);

test(
  "html multiline style tag break is stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(brokenOptionLabel);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenOptionLabel,
    );
  },
);

const gluedIfLogical = `this._onKeyDown = (event) => {
  if (event.key === "Escape" && this.state.mobileOpen) {
    this.closeMobileNav();
  }
};
`;

const brokenIfLogical = `this._onKeyDown = (event) => {
  if (
    event.key === "Escape" &&
    this.state.mobileOpen
  ) {
    this.closeMobileNav();
  }
};
`;

test(
  "if conditions break && and || chains",
  () => {
    const {
      ast,
      error,
    } = parse(gluedIfLogical);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenIfLogical,
    );
  },
);

test(
  "broken if logical conditions are stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(brokenIfLogical);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenIfLogical,
    );
  },
);

const gluedTernary = `const showSidebar = isMobile ? mobileOpen : !sidebarCollapsed;
`;

const brokenTernary = `const showSidebar = isMobile
  ? mobileOpen
  : !sidebarCollapsed;
`;

test(
  "ternaries break with ? and : on their own lines",
  () => {
    const {
      ast,
      error,
    } = parse(gluedTernary);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenTernary,
    );
  },
);

test(
  "broken ternaries are stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(brokenTernary);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenTernary,
    );
  },
);

const gluedEmptyHtmlSpan = `class Logo extends Component {

  render() {
    const {
      markup,
    } = this.state;
    const {
      size = 32,
    } = this.props || {};
    if (!markup) {
      return html\`<span
  style=\${{
    display: "inline-block",
    width: \`\${size}px\`,
    height: \`\${size}px\`,
  }}
>
  
</span>\`;
    }
    return html\`\${svg}\`;
  }
}
`;

const brokenEmptyHtmlSpan = `class Logo extends Component {

  render() {
    const {
      markup,
    } = this.state;
    const {
      size = 32,
    } = this.props || {};
    if (!markup) {
      return html\`
        <span
          style=\${{
            display: "inline-block",
            width: \`\${size}px\`,
            height: \`\${size}px\`,
          }}
        />
      \`;
    }
    return html\`\${svg}\`;
  }
}
`;

test(
  "html empty spans with multiline style become indented self-closing tags",
  () => {
    const {
      ast,
      error,
    } = parse(gluedEmptyHtmlSpan);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenEmptyHtmlSpan,
    );
  },
);

test(
  "indented self-closing html placeholders are stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(brokenEmptyHtmlSpan);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenEmptyHtmlSpan,
    );
  },
);

const gluedPropsTable = `export const propsTable = (headingOrGroups, maybeRows) => {
  const groups = Array.isArray(headingOrGroups)
    ? headingOrGroups
    : [
        {
          name: headingOrGroups,
          rows: maybeRows,
        },
      ];

  return html\`
    <div class="docs-props">
    <h3>Props</h3>
\${groups.map(
  ({
    name,
    rows,
  }) => html\`
    <h4
      style=\${{
        marginBottom: "4px",
      }}
    >
            \${name}
    </h4>
          <table style=\${propsTableStyle}>
            <thead>
              <tr>
                <th style=\${propsHeadStyle}>Prop</th>
                <th style=\${propsHeadStyle}>Type</th>
                <th style=\${propsHeadStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              \${rows.map(
                ([
                  prop,
                  type,
                  description,
                ]) => html\`
                  <tr>
                  <td style=\${propsCellStyle}><code>\${prop}</code></td>
                    <td style=\${propsCellStyle}><code>\${type}</code></td>
                    <td style=\${propsCellStyle}>\${description}</td>
                  </tr>
                \`,
              )}
            </tbody>
          </table>
  \`,
)}
    </div>
  \`;
};
`;

const brokenPropsTable = `export const propsTable = (headingOrGroups, maybeRows) => {
  const groups = Array.isArray(headingOrGroups)
    ? headingOrGroups
    : [
        {
          name: headingOrGroups,
          rows: maybeRows,
        },
      ];

  return html\`
    <div class="docs-props">
      <h3>Props</h3>
      \${groups.map(
        ({
          name,
          rows,
        }) => html\`
          <h4
            style=\${{
              marginBottom: "4px",
            }}
          >\${name}</h4>
          <table style=\${propsTableStyle}>
            <thead>
              <tr>
                <th style=\${propsHeadStyle}>Prop</th>
                <th style=\${propsHeadStyle}>Type</th>
                <th style=\${propsHeadStyle}>Description</th>
              </tr>
            </thead>
            <tbody>\${rows.map(
                ([
                  prop,
                  type,
                  description,
                ]) => html\`
                  <tr>
                    <td style=\${propsCellStyle}>
                      <code>\${prop}</code>
                    </td>
                    <td style=\${propsCellStyle}>
                      <code>\${type}</code>
                    </td>
                    <td style=\${propsCellStyle}>\${description}</td>
                  </tr>
                \`,
              )}</tbody>
          </table>
        \`,
      )}
    </div>
  \`;
};
`;

test(
  "nested html tables indent tags and expression children",
  () => {
    const {
      ast,
      error,
    } = parse(gluedPropsTable);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenPropsTable,
    );
  },
);

test(
  "nested html table formatting is stable under reformat",
  () => {
    const {
      ast,
      error,
    } = parse(brokenPropsTable);
    assert.equal(
      error,
      undefined,
    );
    assert.equal(
      print(ast),
      brokenPropsTable,
    );
  },
);

const multiAttrHtml = `const view = html\`
  <Select
    aria-label="Mode"
    options=\${modeOptions}
    value=\${mode}
    onChange=\${(selected) => this.setMode(selected)}
  />
  <div
    style=\${{
      zIndex: "1",
    }}
    onClick=\${() => this.close()}
  ></div>
\`;
`;

test(
  "html keeps attributes that follow expression attributes",
  () => {
    const {
      ast,
      error,
    } = parse(multiAttrHtml);
    assert.equal(
      error,
      undefined,
    );
    const out = print(ast);
    assert.match(
      out,
      /options=\$\{modeOptions\}/,
    );
    assert.match(
      out,
      /value=\$\{mode\}/,
    );
    assert.match(
      out,
      /onChange=\$\{/,
    );
    assert.match(
      out,
      /onClick=\$\{/,
    );
    // Regression: attrs after ${} must not become text nodes before the expression.
    assert.doesNotMatch(
      out,
      />\s*\n\s*onClick=\s*\n\s*\$\{/,
    );
    assert.equal(
      print(parse(out).ast),
      out,
    );
  },
);

const spreadThenAttrHtml = `const view = html\`
  <div
    role="progressbar"
    \${label ? { "aria-label": label } : {}}
    \${determinate ? { "aria-valuenow": value } : {}}
    style=\${{ height: "8px" }}
  >
    <input
      type="file"
      \${disabled ? { disabled: "disabled" } : {}}
      \${bound}
      onChange=\${(event) => this.emitChange(event)}
    />
  </div>
\`;
`;

test(
  "html keeps spreads and attributes after an incomplete open tag",
  () => {
    const {
      ast,
      error,
    } = parse(spreadThenAttrHtml);
    assert.equal(
      error,
      undefined,
    );
    const out = print(ast);
    assert.match(
      out,
      /role="progressbar"/,
    );
    assert.match(
      out,
      /\$\{label\b/,
    );
    assert.match(
      out,
      /\$\{determinate\b/,
    );
    assert.match(
      out,
      /style=\$\{/,
    );
    assert.match(
      out,
      /\$\{bound\}/,
    );
    assert.match(
      out,
      /onChange=\$\{/,
    );
    // Spreads must stay attributes, not children after a premature `>`.
    assert.doesNotMatch(
      out,
      /role="progressbar">\s*\n\s*\$\{label/,
    );
    assert.doesNotMatch(
      out,
      /type="file"[^>]*>\s*\n\s*\$\{disabled/,
    );
    assert.equal(
      print(parse(out).ast),
      out,
    );
  },
);

const textareaHtml = `const view = html\`
  <textarea
    style=\${{
      minHeight: "4.5em",
    }}
    \${disabled ? { disabled: "disabled" } : {}}
  >
    \${this.childElements}
  </textarea>
\`;
`;

test(
  "html textarea content stays flush after the opening tag",
  () => {
    const {
      ast,
      error,
    } = parse(textareaHtml);
    assert.equal(
      error,
      undefined,
    );
    const out = print(ast);
    assert.match(
      out,
      />\$\{this\.childElements\}<\/textarea>/,
    );
    assert.doesNotMatch(
      out,
      />\s+\n\s*\$\{this\.childElements\}/,
    );
    assert.equal(
      print(parse(out).ast),
      out,
    );
  },
);

const preCodeHtml = `const view = html\`
  <pre
    class=\${"janus-code-highlight"}
    aria-hidden="true"
  >
    <code class=\${"language-js"} />
  </pre>
\`;
`;

test(
  "html pre code content stays flush after the opening tag",
  () => {
    const out = assertStable(
      preCodeHtml,
      "pre/code flush",
    );
    assert.match(
      out,
      /><code class=\$\{"language-js"\} \/\><\/pre>/,
    );
    assert.doesNotMatch(
      out,
      />\s*\n\s*<code/,
    );
  },
);

const phrasingMixedHtml = `const view = html\`
  <button onClick=\${() => this.inc()}>
    \${this.props.name}: \${count}
  </button>
\`;
`;

test(
  "html phrasing text between expressions stays on one line",
  () => {
    const out = assertStable(
      phrasingMixedHtml,
      "phrasing flow",
    );
    assert.match(
      out,
      />\$\{this\.props\.name\}: \$\{count\}<\/button>/,
    );
    assert.doesNotMatch(
      out,
      />\s*\n\s*\$\{this\.props\.name\}\s*\n\s*:/,
    );
  },
);

const emptyTextareaHtml = `const view = html\`
  <textarea
    style=\${{
      minHeight: "4.5em",
    }}
  ></textarea>
\`;
`;

test(
  "html empty textarea uses a real close tag, not self-closing",
  () => {
    const out = assertStable(
      emptyTextareaHtml,
      "empty textarea",
    );
    assert.match(
      out,
      /><\/textarea>/,
    );
    assert.doesNotMatch(
      out,
      /<textarea[\s\S]*\/>/,
    );
  },
);

const styleTagHtml = `const view = html\`
  <style>
    :host {
      display: block;
    }
    .row {
      gap: 8px;
    }
  </style>
\`;
`;

test(
  "html style tag preserves CSS text instead of collapsing it",
  () => {
    const out = assertStable(
      styleTagHtml,
      "style preserve",
    );
    assert.match(
      out,
      /:host \{/,
    );
    assert.match(
      out,
      /\.row \{/,
    );
    assert.match(
      out,
      /gap: 8px;/,
    );
    assert.doesNotMatch(
      out,
      /<style>\s*:host \{ display: block; \}/,
    );
  },
);

const scriptTagHtml = `const view = html\`
  <script>
    const ready = true;
    if (ready) {
      boot();
    }
  </script>
\`;
`;

test(
  "html script tag preserves script text instead of collapsing it",
  () => {
    const out = assertStable(
      scriptTagHtml,
      "script preserve",
    );
    assert.match(
      out,
      /const ready = true;/,
    );
    assert.match(
      out,
      /boot\(\);/,
    );
  },
);

const attrAfterSpreadSameChunk = `const view = html\`
  <div role="progressbar" \${label ? { "aria-label": label } : {}} style=\${barStyle}>
  </div>
\`;
`;

test(
  "html keeps style after a spread on an open tag that never closed in the prior quasi",
  () => {
    const out = assertStable(
      attrAfterSpreadSameChunk,
      "spread then style",
    );
    assert.match(
      out,
      /role="progressbar"/,
    );
    assert.match(
      out,
      /\$\{label\b/,
    );
    assert.match(
      out,
      /style=\$\{barStyle\}/,
    );
    assert.doesNotMatch(
      out,
      /role="progressbar">\s*\n\s*\$\{label/,
    );
  },
);

const staticThenExprAttrs = `const view = html\`
  <button type="button" class="primary" onClick=\${this.save} disabled=\${busy}>
    Save
  </button>
\`;
`;

test(
  "html keeps static attributes together with following expression attributes",
  () => {
    const out = assertStable(
      staticThenExprAttrs,
      "static+expr attrs",
    );
    assert.match(
      out,
      /type="button"/,
    );
    assert.match(
      out,
      /class="primary"/,
    );
    assert.match(
      out,
      /onClick=\$\{/,
    );
    assert.match(
      out,
      /disabled=\$\{busy\}/,
    );
  },
);

const voidInputHtml = `const view = html\`
  <input type="text" value=\${value} onChange=\${this.onChange} />
  <br />
\`;
`;

test(
  "html void tags stay self-closing and keep expression attributes",
  () => {
    const out = assertStable(
      voidInputHtml,
      "void tags",
    );
    assert.match(
      out,
      /<input\b/,
    );
    assert.match(
      out,
      /value=\$\{value\}/,
    );
    assert.match(
      out,
      /onChange=\$\{/,
    );
    assert.match(
      out,
      /<br\s*\/>/,
    );
    assert.doesNotMatch(
      out,
      /<\/input>/,
    );
  },
);

const fileInputLikeHtml = `const view = html\`
  <input
    type="file"
    style=\${theme.field(color)}
    \${disabled ? { disabled: "disabled" } : {}}
    \${multiple ? { multiple: "" } : {}}
    \${bound}
    onChange=\${(event) => this.emitChange(event)}
  />
\`;
`;

test(
  "html FileInput-like spreads keep bound and onChange as attributes",
  () => {
    const out = assertStable(
      fileInputLikeHtml,
      "file input spreads",
    );
    assert.match(
      out,
      /type="file"/,
    );
    assert.match(
      out,
      /style=\$\{/,
    );
    assert.match(
      out,
      /\$\{bound\}/,
    );
    assert.match(
      out,
      /onChange=\$\{/,
    );
    assert.doesNotMatch(
      out,
      /type="file"[^>]*\/>\s*\n\s*\$\{/,
    );
  },
);

const nestedMapHtml = `const view = html\`
  <ul>
    \${items.map((item) => html\`
      <li data-id=\${item.id} onClick=\${() => this.select(item)}>
        \${item.label}
      </li>
    \`)}
  </ul>
\`;
`;

test(
  "html nested templates inside map keep attrs and stay idempotent",
  () => {
    const out = assertStable(
      nestedMapHtml,
      "nested map html",
    );
    assert.match(
      out,
      /data-id=\$\{item\.id\}/,
    );
    assert.match(
      out,
      /onClick=\$\{/,
    );
    assert.match(
      out,
      /\$\{item\.label\}/,
    );
  },
);

const plainExprHtml = `const view = html\`\${node}\`;
`;

test(
  "html single-expression templates stay compact",
  () => {
    assertPrintsTo(
      plainExprHtml,
      plainExprHtml,
      "single expr html",
    );
  },
);

const multilineImports = `import Component, { html } from "../index.js";
import theme from "./theme.js";
`;

const brokenImports = `import Component, {
  html,
} from "../index.js";
import theme from "./theme.js";
`;

test(
  "imports expand named bindings onto their own lines",
  () => {
    assertPrintsTo(
      multilineImports,
      brokenImports,
      "imports",
    );
  },
);

const gluedObject = `const style = { display: "flex", gap: "8px", alignItems: "center" };
`;

const brokenObject = `const style = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};
`;

test(
  "object literals expand with trailing commas",
  () => {
    assertPrintsTo(
      gluedObject,
      brokenObject,
      "objects",
    );
  },
);

test(
  "formatJson pretty-prints and is idempotent",
  () => {
    const once = formatJson("{\"a\":1,\"b\":[true,false]}");
    assert.equal(
      once,
      `{
  "a": 1,
  "b": [
    true,
    false
  ]
}
`,
    );
    assert.equal(
      formatJson(once),
      once,
    );
  },
);

test(
  "formatMarkup indents tags and keeps void elements",
  () => {
    const once = formatMarkup(`<div class="wrap"><img src="x.png" alt=""><p>Hi</p></div>`);
    assert.equal(
      once,
      `<div class="wrap">
  <img
    src="x.png"
    alt=""
  />
  <p>
    Hi
  </p>
</div>
`,
    );
    assert.equal(
      formatMarkup(once),
      once,
    );
  },
);

test(
  "formatMarkup preserves style body text",
  () => {
    const once = formatMarkup(`<style>
  body { margin: 0; }
  .x { color: red; }
</style>`);
    assert.match(
      once,
      /body \{ margin: 0; \}/,
    );
    assert.match(
      once,
      /\.x \{ color: red; \}/,
    );
    assert.equal(
      formatMarkup(once),
      once,
    );
  },
);

test(
  "formatMarkup preserves svg self-closing shape",
  () => {
    const once = formatMarkup(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>`,
      {
        svg: true,
      },
    );
    assert.match(
      once,
      /<path d="M0 0h1v1z" \/>/,
    );
    assert.equal(
      formatMarkup(
        once,
        {
          svg: true,
        },
      ),
      once,
    );
  },
);
