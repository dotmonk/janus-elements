import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  extname,
  relative,
} from "node:path";
import test from "node:test";
import {
  parseHtmlTemplate,
} from "../../scripts/januse/html-template.mjs";
import {
  parse,
  print,
} from "../../scripts/januse/js-syntax.mjs";
import {
  formatJson,
  formatMarkup,
} from "../../scripts/januse/text-format.mjs";
import {
  collectFiles,
  repoRoot,
} from "../../scripts/januse/walk.mjs";

// Same roots as `januse format --check docs src` — include fixtures under
// src/tests; those were lossy under the broken printer and break Playwright.
const CORPUS_ROOTS = [
  "src",
  "docs",
];
const CORPUS_EXTS = [
  ".js",
  ".mjs",
  ".ts",
  ".json",
  ".svg",
  ".html",
];
const PRESERVE_TEXT_TAGS = new Set(
  [
    "style",
    "script",
    "pre",
    "textarea",
  ],
);

function relPath(file) {
  return relative(
    repoRoot,
    file,
  ).split("\\").join("/");
}

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

function collectHtmlTemplates(ast) {
  const templates = [];
  walkAst(
    ast,
    (node) => {
      if (
        node.type !== "TaggedTemplateExpression" ||
        node.tag?.type !== "Identifier" ||
        node.tag.name !== "html"
      ) {
        return;
      }
      templates.push(node.quasi);
    },
  );
  return templates;
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

/**
 * Structure-only view of an html` tree. Ignores formatter whitespace so a
 * pretty-print cannot “pass” by dropping attrs/spreads or moving them into
 * children.
 */
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
        // Empty non-preserve tags may print as `/>`; treat that as equivalent.
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
        // Joined phrasing catches `${name}: ${count}` vs broken newlines.
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
  return collectHtmlTemplates(ast).map(
    (quasi) => {
      const tree = parseHtmlTemplate(
        quasi.quasis,
        quasi.expressions,
      );
      return {
        expressionCount: quasi.expressions.length,
        quasiCount: quasi.quasis.length,
        tree: summarizeHtmlTree(tree),
      };
    },
  );
}

function formatSource(file, source) {
  const ext = extname(file).toLowerCase();
  if (ext === ".json") {
    return formatJson(source);
  }
  if (ext === ".svg") {
    return formatMarkup(
      source,
      {
        svg: true,
      },
    );
  }
  if (ext === ".html") {
    return formatMarkup(
      source,
      {
        svg: false,
      },
    );
  }
  const typescript = ext === ".ts" || file.endsWith(".d.ts");
  const {
    ast,
    error,
  } = parse(
    source,
    {
      typescript,
    },
  );
  if (error) {
    const err = new Error(error.message);
    err.line = error.line;
    err.column = error.column;
    throw err;
  }
  return {
    ast,
    formatted: print(ast),
    typescript,
  };
}

test(
  "format corpus preserves html` structure and stays idempotent",
  () => {
    const files = collectFiles(
      CORPUS_ROOTS,
      CORPUS_EXTS,
    );
    assert.ok(
      files.length > 50,
      `expected a real corpus, found ${files.length} files`,
    );

    let jsFiles = 0;
    let htmlTemplates = 0;

    for (const file of files) {
      const rel = relPath(file);
      const source = readFileSync(
        file,
        "utf8",
      );
      const ext = extname(file).toLowerCase();

      if (
        ext === ".json" ||
        ext === ".svg" ||
        ext === ".html"
      ) {
        let once;
        try {
          once = formatSource(
            file,
            source,
          );
        } catch (error) {
          assert.fail(`${rel}: format-error: ${error.message}`);
        }
        const twice = formatSource(
          file,
          once,
        );
        assert.equal(
          twice,
          once,
          `${rel}: markup/json format is not idempotent`,
        );
        continue;
      }

      jsFiles += 1;
      let first;
      try {
        first = formatSource(
          file,
          source,
        );
      } catch (error) {
        assert.fail(`${rel}:${error.line || "?"}:${error.column || "?"}: ${error.message}`);
      }

      const before = htmlFingerprints(first.ast);
      htmlTemplates += before.length;

      const {
        ast: formattedAst,
        error: reparseError,
      } = parse(
        first.formatted,
        {
          typescript: first.typescript,
        },
      );
      assert.equal(
        reparseError,
        undefined,
        `${rel}: formatted output did not re-parse`,
      );

      const after = htmlFingerprints(formattedAst);
      assert.deepEqual(
        after,
        before,
        `${rel}: html\` structure changed under format (attrs/spreads/tags/exprs)`,
      );

      const second = print(formattedAst);
      assert.equal(
        second,
        first.formatted,
        `${rel}: format is not idempotent`,
      );
    }

    assert.ok(
      jsFiles > 20,
      `expected many JS corpus files, found ${jsFiles}`,
    );
    assert.ok(
      htmlTemplates > 20,
      `expected many html\` templates, found ${htmlTemplates}`,
    );
  },
);
