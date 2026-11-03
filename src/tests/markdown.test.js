import {
  test,
} from "node:test";
import assert from "node:assert/strict";

import {
  parseMarkdown,
  serializeMarkdown,
} from "../janus/ui/markdown/index.js";

const roundtrip = (source) => serializeMarkdown(parseMarkdown(source));

test(
  "empty markdown roundtrips to empty",
  () => {
    assert.equal(
      roundtrip(""),
      "",
    );
    assert.equal(
      roundtrip("   \n\n"),
      "",
    );
  },
);

test(
  "paragraphs and hard breaks",
  () => {
    assert.equal(
      roundtrip("Hello world"),
      "Hello world",
    );
    assert.equal(
      roundtrip("Line one  \nLine two"),
      "Line one  \nLine two",
    );
    assert.equal(
      roundtrip("First\n\nSecond"),
      "First\n\nSecond",
    );
  },
);

test(
  "bold, italic, strikethrough, and inline code",
  () => {
    assert.equal(
      roundtrip("**bold** and *italic*"),
      "**bold** and *italic*",
    );
    assert.equal(
      roundtrip("~~gone~~"),
      "~~gone~~",
    );
    assert.equal(
      roundtrip("Use `code` here"),
      "Use `code` here",
    );
    assert.equal(
      roundtrip("**bold *and* italic**"),
      "**bold *and* italic**",
    );
  },
);

test(
  "empty strong/emphasis marks are not serialized",
  () => {
    assert.equal(
      roundtrip("[**Write**](https://example.com)**** **bold**"),
      "[**Write**](https://example.com) **bold**",
    );
  },
);

test(
  "links and images",
  () => {
    assert.equal(
      roundtrip("[Janus](https://example.com)"),
      "[Janus](https://example.com)",
    );
    assert.equal(
      roundtrip("![Alt text](https://example.com/a.png)"),
      "![Alt text](https://example.com/a.png)",
    );
  },
);

test(
  "headings",
  () => {
    assert.equal(
      roundtrip("# Title"),
      "# Title",
    );
    assert.equal(
      roundtrip("## Section"),
      "## Section",
    );
    assert.equal(
      roundtrip("###### Tiny"),
      "###### Tiny",
    );
  },
);

test(
  "unordered, ordered, and task lists",
  () => {
    assert.equal(
      roundtrip("- one\n- two"),
      "- one\n- two",
    );
    assert.equal(
      roundtrip("1. alpha\n2. beta"),
      "1. alpha\n2. beta",
    );
    assert.equal(
      roundtrip("- [ ] todo\n- [x] done"),
      "- [ ] todo\n- [x] done",
    );
  },
);

test(
  "blockquotes, thematic breaks, and fenced code",
  () => {
    assert.equal(
      roundtrip("> quoted"),
      "> quoted",
    );
    assert.equal(
      roundtrip("Before\n\n---\n\nAfter"),
      "Before\n\n---\n\nAfter",
    );
    assert.equal(
      roundtrip("```js\nconst x = 1;\n```"),
      "```js\nconst x = 1;\n```",
    );
  },
);

test(
  "pipe tables",
  () => {
    const table = [
      "| Name | Age |",
      "| --- | --- |",
      "| Ada | 36 |",
    ].join("\n");
    assert.equal(
      roundtrip(table),
      table,
    );
  },
);

test(
  "table cells escape pipes",
  () => {
    const table = [
      "| A | B |",
      "| --- | --- |",
      "| a \\| b | c |",
    ].join("\n");
    const ast = parseMarkdown(table);
    assert.equal(
      ast[0].type,
      "table",
    );
    assert.equal(
      serializeMarkdown(ast),
      table,
    );
  },
);

test(
  "dangerous URLs are stripped on parse",
  () => {
    const ast = parseMarkdown("[x](javascript:alert(1))");
    const link = ast[0].children.find(
      (node) => node.type === "link",
    );
    assert.equal(
      link.url,
      "",
    );
    const imageAst = parseMarkdown("![x](javascript:alert(1))");
    const image = imageAst[0].children.find(
      (node) => node.type === "image",
    );
    assert.equal(
      image.url,
      "",
    );
  },
);

test(
  "nested inline inside links",
  () => {
    assert.equal(
      roundtrip("[**bold** link](https://example.com)"),
      "[**bold** link](https://example.com)",
    );
  },
);

const paragraph = (...children) => [
  {
    type: "paragraph",
    children,
  },
];
const text = (value) => ({
  type: "text",
  value,
});

test(
  "text that would read as syntax is escaped only where ambiguous",
  () => {
    const cases = [
      [
        "# literal",
        "\\# literal",
      ],
      [
        "#hashtag",
        "#hashtag",
      ],
      [
        "- item",
        "\\- item",
      ],
      [
        "+ item",
        "\\+ item",
      ],
      [
        "1. item",
        "1\\. item",
      ],
      [
        "1) item",
        "1\\) item",
      ],
      [
        "> quote",
        "\\> quote",
      ],
      [
        "---",
        "\\---",
      ],
      [
        "===",
        "\\===",
      ],
      [
        "3.5 apples",
        "3.5 apples",
      ],
      [
        "a - b > c",
        "a - b > c",
      ],
      [
        "~~x~~",
        "\\~\\~x\\~\\~",
      ],
      [
        "<b>tag</b>",
        "\\<b>tag\\</b>",
      ],
      [
        "AT&T &amp;",
        "AT&T \\&amp;",
      ],
    ];
    for (const [
      value,
      expected,
    ] of cases) {
      const markdown = serializeMarkdown(paragraph(text(value)));
      assert.equal(
        markdown,
        expected,
        value,
      );
      assert.deepEqual(
        parseMarkdown(markdown),
        paragraph(text(value)),
        value,
      );
    }
    const afterBreak = paragraph(
      text("a"),
      {
        type: "break",
      },
      text("# b"),
    );
    assert.equal(
      serializeMarkdown(afterBreak),
      "a  \n\\# b",
    );
    assert.deepEqual(
      parseMarkdown("a  \n\\# b"),
      afterBreak,
    );
    const listItem = [
      {
        type: "list",
        ordered: false,
        items: [
          {
            type: "listItem",
            checked: null,
            children: paragraph(text("- x")),
          },
        ],
      },
    ];
    assert.equal(
      serializeMarkdown(listItem),
      "- \\- x",
    );
  },
);

test(
  "loaded escapes survive a save",
  () => {
    for (const source of [
      "\\# not a heading",
      "\\- not a list",
      "1\\. not a list",
      "\\> not a quote",
    ]) {
      assert.equal(
        roundtrip(source),
        source,
      );
    }
  },
);

test(
  "underscores inside words are not emphasis",
  () => {
    assert.deepEqual(
      parseMarkdown("snake_case_name"),
      paragraph(text("snake_case_name")),
    );
    assert.equal(
      roundtrip("snake_case_name"),
      "snake\\_case\\_name",
    );
    assert.equal(
      roundtrip("_em_ word"),
      "*em* word",
    );
  },
);

test(
  "nested lists stay tight and indent by marker width",
  () => {
    assert.equal(
      roundtrip("- a\n  - b\n    - c"),
      "- a\n  - b\n    - c",
    );
    assert.equal(
      roundtrip("1. a\n   1. b"),
      "1. a\n   1. b",
    );
    assert.equal(
      roundtrip("- [ ] a\n  - b"),
      "- [ ] a\n  - b",
    );
    assert.equal(
      roundtrip("- a\n\n  second"),
      "- a\n\n  second",
    );
  },
);

test(
  "table cells keep backslashes stable across saves",
  () => {
    const table = "| A |\n| --- |\n| a\\\\b and `c\\|d` |";
    assert.equal(
      roundtrip(table),
      table,
    );
    assert.equal(
      roundtrip(roundtrip(table)),
      table,
    );
    const code = parseMarkdown(table)[0].rows[0][0].find(
      (n) => n.type === "inlineCode",
    );
    assert.equal(
      code.value,
      "c|d",
    );
  },
);

test(
  "strong emphasis, code spans with backticks, link titles and parentheses",
  () => {
    assert.equal(
      roundtrip("***both***"),
      "***both***",
    );
    assert.equal(
      roundtrip("`` a`b ``"),
      "``a`b``",
    );
    assert.equal(
      serializeMarkdown(paragraph(
        {
          type: "inlineCode",
          value: "a`",
        },
      )),
      "`` a` ``",
    );
    assert.deepEqual(
      parseMarkdown("`` a` ``"),
      paragraph(
        {
          type: "inlineCode",
          value: "a`",
        },
      ),
    );
    assert.equal(
      roundtrip("[a](https://x.y \"T\")"),
      "[a](https://x.y \"T\")",
    );
    const link = parseMarkdown("[a](https://x.y \"T\")")[0].children[0];
    assert.equal(
      link.url,
      "https://x.y",
    );
    assert.equal(
      link.title,
      "T",
    );
    assert.equal(
      roundtrip("[a](https://x.y/a_(b))"),
      "[a](https://x.y/a_(b))",
    );
    assert.equal(
      roundtrip("[a](<https://x.y/a b>)"),
      "[a](https://x.y/a%20b)",
    );
    assert.equal(
      roundtrip("![i](https://x.y/i.png \"Pic\")"),
      "![i](https://x.y/i.png \"Pic\")",
    );
  },
);

test(
  "marks move edge whitespace outside their delimiters",
  () => {
    const struck = paragraph(
      {
        type: "delete",
        children: [
          text("alpha "),
        ],
      },
      text("beta"),
      {
        type: "strong",
        children: [
          text(" gamma"),
        ],
      },
    );
    assert.equal(
      serializeMarkdown(struck),
      "~~alpha~~ beta **gamma**",
    );
  },
);

test(
  "setext headings and 1) lists",
  () => {
    assert.equal(
      roundtrip("Title\n====="),
      "# Title",
    );
    assert.equal(
      roundtrip("Sub\n---"),
      "## Sub",
    );
    assert.equal(
      roundtrip("Two\nlines\n==="),
      "# Two lines",
    );
    assert.equal(
      roundtrip("1) one\n2) two"),
      "1. one\n2. two",
    );
    assert.equal(
      roundtrip("a\n\n---"),
      "a\n\n---",
    );
  },
);
