import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  dirname,
  join,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";
import {
  parseHtmlTemplate,
} from "../../scripts/januse/html-template.mjs";
import {
  parse,
  print,
} from "../../scripts/januse/js-syntax.mjs";
import {
  toMaximallySpaced,
  toSingleLine,
} from "../../scripts/januse/source-whitespace.mjs";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

const PRESERVE_TEXT_TAGS = new Set(
  [
    "style",
    "script",
    "pre",
    "textarea",
  ],
);

function walkAst(node, visit) {
  if (
    !node ||
    typeof node !== "object"
  ) {
    return;
  }
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        walkAst(
          item,
          visit,
        );
      }
    } else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    ) {
      walkAst(
        value,
        visit,
      );
    }
  }
}

function significantChildren(children, preserve) {
  const hasLiteralText = children.some(
    (child) => child.type === "text" && child.value.trim(),
  );
  const out = [];
  for (const child of children) {
    if (child.type === "text") {
      if (preserve) {
        if (hasLiteralText) {
          out.push(child);
        }
        continue;
      }
      const text = child.value.replace(
        /\s+/g,
        " ",
      ).trim();
      if (text) {
        out.push(
          {
            type: "text",
            value: text,
          },
        );
      }
      continue;
    }
    out.push(child);
  }
  return out;
}

function summarizeHtmlTree(tree) {
  const summarize = (node, preserveParent = false) => {
    if (node.type === "fragment") {
      return {
        type: "fragment",
        children: significantChildren(
          node.children,
          false,
        ).map(
          (child) => summarize(
            child,
            false,
          ),
        ),
      };
    }
    if (node.type === "element") {
      const preserve = PRESERVE_TEXT_TAGS.has(node.name.toLowerCase());
      const kids = significantChildren(
        node.children,
        preserve,
      );
      const empty = kids.length === 0;
      return {
        type: "element",
        name: node.name,
        selfClosing: empty && !preserve
          ? true
          : Boolean(node.selfClosing),
        attrs: (node.attrs || []).map(
          (attr) => {
            if (attr.spread) {
              return {
                spread: true,
                expr: attr.expr,
              };
            }
            if (attr.expr != null) {
              return {
                name: attr.name,
                expr: attr.expr,
              };
            }
            return {
              name: attr.name,
              value: attr.value,
            };
          },
        ),
        children: kids.map(
          (child) => summarize(
            child,
            preserve,
          ),
        ),
        flow: preserve
          ? null
          : kids.map(
              (child) => {
                if (child.type === "text") {
                  return child.value.replace(
                    /\s+/g,
                    " ",
                  );
                }
                if (child.type === "expr") {
                  return `\${${child.index}}`;
                }
                return "";
              },
            ).join("").replace(
              /^\s+|\s+$/g,
              "",
            ),
      };
    }
    if (node.type === "expr") {
      return {
        type: "expr",
        index: node.index,
      };
    }
    if (node.type === "comment") {
      return {
        type: "comment",
        value: node.value.trim(),
      };
    }
    if (node.type === "text") {
      return {
        type: "text",
        value: preserveParent
          ? node.value
          : node.value.replace(
              /\s+/g,
              " ",
            ).trim(),
      };
    }
    return {
      type: node.type,
    };
  };
  return summarize(tree);
}

function htmlFingerprints(ast) {
  const templates = [];
  walkAst(
    ast,
    (node) => {
      if (
        node.type === "TaggedTemplateExpression" &&
        node.tag?.type === "Identifier" &&
        node.tag.name === "html"
      ) {
        templates.push(node.quasi);
      }
    },
  );
  return templates.map(
    (quasi) => ({
      expressionCount: quasi.expressions.length,
      tree: summarizeHtmlTree(parseHtmlTemplate(
        quasi.quasis,
        quasi.expressions,
      )),
    }),
  );
}

function loadFixture(name) {
  return readFileSync(
    join(
      fixturesDir,
      name,
    ),
    "utf8",
  );
}

test(
  "format-demo compact and spaced sources match structurally before format",
  () => {
    const compact = loadFixture("format-demo-website.compact.js");
    const spaced = loadFixture("format-demo-website.spaced.js");
    assert.ok(
      !compact.includes("\n\n"),
      "compact fixture should be a single line",
    );
    assert.ok(
      spaced.split("\n").length > 20,
      "spaced fixture should spread across many lines",
    );

    const compactAst = parse(compact);
    const spacedAst = parse(spaced);
    assert.equal(
      compactAst.error,
      undefined,
    );
    assert.equal(
      spacedAst.error,
      undefined,
    );
    assert.deepEqual(
      htmlFingerprints(compactAst.ast),
      htmlFingerprints(spacedAst.ast),
      "html` structure must match before formatting",
    );
  },
);

test(
  "format-demo compact and spaced format to the exact same source",
  () => {
    const compact = loadFixture("format-demo-website.compact.js");
    const spaced = loadFixture("format-demo-website.spaced.js");
    const base = loadFixture("format-demo-website.base.js");
    const formattedCompact = print(parse(compact).ast);
    const formattedSpaced = print(parse(spaced).ast);
    assert.equal(
      formattedCompact,
      formattedSpaced,
    );
    assert.equal(
      formattedCompact,
      base,
      "fixtures must stay aligned with the canonical base",
    );
    assert.equal(
      print(parse(formattedCompact).ast),
      formattedCompact,
      "formatted demo must be idempotent",
    );
  },
);

test(
  "format-demo regenerating compact/spaced from base still converges",
  () => {
    const base = loadFixture("format-demo-website.base.js");
    const againCompact = toSingleLine(base);
    const againSpaced = toMaximallySpaced(base);
    assert.equal(
      print(parse(againCompact).ast),
      print(parse(againSpaced).ast),
    );
    assert.equal(
      print(parse(againCompact).ast),
      base,
    );
  },
);
