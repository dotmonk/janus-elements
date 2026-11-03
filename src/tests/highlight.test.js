import {
  test,
} from "node:test";
import assert from "node:assert/strict";

import {
  highlight,
  detectLanguage,
  resolveHighlightLanguage,
  resolveLanguageId,
  escapeHtml,
} from "../janus/ui/highlight/index.js";

test(
  "escapeHtml escapes markup characters",
  () => {
    assert.equal(
      escapeHtml(`<a & "b">`),
      "&lt;a &amp; &quot;b&quot;&gt;",
    );
  },
);

test(
  "plain language escapes without token spans",
  () => {
    const html = highlight(
      "<script>x</script>",
      "plain",
    );
    assert.equal(
      html.includes("<span"),
      false,
    );
    assert.equal(
      html.includes("&lt;script&gt;"),
      true,
    );
  },
);

test(
  "javascript highlights keywords and strings",
  () => {
    const html = highlight(
      `const name = "Janus";`,
      "javascript",
    );
    assert.match(
      html,
      /class="token keyword"[^>]*>const</,
    );
    assert.match(
      html,
      /class="token string"[^>]*>&quot;Janus&quot;</,
    );
  },
);

test(
  "aliases map to canonical languages",
  () => {
    assert.equal(
      resolveLanguageId("js"),
      "javascript",
    );
    assert.equal(
      resolveLanguageId("TS"),
      "typescript",
    );
    assert.equal(
      resolveLanguageId("bash"),
      "shell",
    );
    assert.equal(
      resolveLanguageId("markup"),
      "html",
    );
    assert.equal(
      resolveLanguageId("md"),
      "markdown",
    );
    assert.equal(
      resolveLanguageId("unknown-lang"),
      null,
    );
  },
);

test(
  "detectLanguage uses filename extension first",
  () => {
    assert.equal(
      detectLanguage(
        {
          filename: "app.py",
          content: "const x = 1",
        },
      ),
      "python",
    );
    assert.equal(
      detectLanguage(
        {
          filename: "main.ts",
        },
      ),
      "typescript",
    );
    assert.equal(
      detectLanguage(
        {
          filename: "data.json",
        },
      ),
      "json",
    );
  },
);

test(
  "detectLanguage uses shebang and content heuristics",
  () => {
    assert.equal(
      detectLanguage(
        {
          content: "#!/usr/bin/env python3\nprint(1)\n",
        },
      ),
      "python",
    );
    assert.equal(
      detectLanguage(
        {
          content: "#!/bin/bash\necho hi\n",
        },
      ),
      "shell",
    );
    assert.equal(
      detectLanguage(
        {
          content: "<?xml version=\"1.0\"?><root/>",
        },
      ),
      "xml",
    );
    assert.equal(
      detectLanguage(
        {
          content: "{\"a\": 1, \"b\": true}",
        },
      ),
      "json",
    );
  },
);

test(
  "resolveHighlightLanguage lets language prop win",
  () => {
    assert.equal(
      resolveHighlightLanguage(
        {
          language: "json",
          filename: "notes.py",
          content: "#!/usr/bin/env python3\n",
        },
      ),
      "json",
    );
    assert.equal(
      resolveHighlightLanguage(
        {
          filename: "script.py",
          content: "print(1)",
        },
      ),
      "python",
    );
    assert.equal(
      resolveHighlightLanguage(
        {
          content: "",
        },
      ),
      "plain",
    );
  },
);

test(
  "html highlighting produces tag tokens",
  () => {
    const html = highlight(
      `<Button color="accent">Hi</Button>`,
      "html",
    );
    assert.match(
      html,
      /class="token tag"/,
    );
    assert.equal(
      html.includes("<Button"),
      false,
    );
  },
);

test(
  "javascript template interpolations nest tokens",
  () => {
    const html = highlight(
      "const message = `Hello, ${name}!`;",
      "javascript",
    );
    assert.match(
      html,
      /class="token string"/,
    );
    assert.match(
      html,
      /class="token interpolation"/,
    );
    assert.match(
      html,
      /class="token punctuation"[^>]*>\$\{</,
    );
    assert.match(
      html,
      /class="token interpolation"[^>]*>[\s\S]*name/,
    );
    assert.equal(
      /class="token string"[^>]*>[^<]*name/.test(html),
      false,
      "name should not sit only in a flat string span",
    );
  },
);

test(
  "javascript nested braces inside interpolation stay balanced",
  () => {
    const html = highlight(
      "const message = `Hello, ${foo({ a: 1 })}!`;",
      "javascript",
    );
    assert.match(
      html,
      /class="token interpolation"/,
    );
    assert.match(
      html,
      /class="token function"[^>]*>foo</,
    );
    assert.match(
      html,
      /class="token number"[^>]*>1</,
    );
  },
);

test(
  "typescript template interpolations nest tokens",
  () => {
    const html = highlight(
      "return `Hello, ${user.name}!`;",
      "typescript",
    );
    assert.match(
      html,
      /class="token interpolation"/,
    );
    assert.match(
      html,
      /user/,
    );
    assert.match(
      html,
      /name/,
    );
  },
);
test(
  "html janus attributes highlight interpolations as javascript",
  () => {
    const html = highlight(
      `<CodeEditor value=\${source} onChange=\${(value) => setState({ source: value })} />`,
      "html",
    );
    assert.match(
      html,
      /class="token tag"/,
    );
    assert.match(
      html,
      /class="token interpolation"/,
    );
    assert.match(
      html,
      /class="token function"[^>]*>setState</,
    );
  },
);

test(
  "html text-node interpolations are highlighted",
  () => {
    const html = highlight(
      `<h1>\${title}</h1>`,
      "janus",
    );
    assert.match(
      html,
      /class="token interpolation"/,
    );
    assert.match(
      html,
      /title/,
    );
  },
);

test(
  "python f-strings interpolate; plain strings do not",
  () => {
    const fstring = highlight(
      `return f"Hello, {name}!"`,
      "python",
    );
    assert.match(
      fstring,
      /class="token interpolation"/,
    );
    assert.match(
      fstring,
      /name/,
    );

    const plain = highlight(
      `return "Hello, {name}!"`,
      "python",
    );
    assert.equal(
      plain.includes("token interpolation"),
      false,
    );
  },
);

test(
  "shell and perl highlight variables inside double quotes",
  () => {
    const shell = highlight(
      `echo "Building \${NAME:-app}"`,
      "shell",
    );
    assert.match(
      shell,
      /class="token variable"/,
    );

    const perl = highlight(
      `print "Hello, $name\\n";`,
      "perl",
    );
    assert.match(
      perl,
      /class="token variable"[^>]*>\$name</,
    );
  },
);

test(
  "go raw strings do not interpolate",
  () => {
    const html = highlight(
      "s := `raw ${not-interp}`",
      "go",
    );
    assert.match(
      html,
      /class="token string"/,
    );
    assert.equal(
      html.includes("token interpolation"),
      false,
    );
  },
);

test(
  "object and map keys use property tokens",
  () => {
    const js = highlight(
      "{ python: value }",
      "javascript",
    );
    assert.match(
      js,
      /class="token property"[^>]*>python</,
    );
    assert.equal(
      /class="token property"[^>]*>value</.test(js),
      false,
    );

    const json = highlight(
      "{ \"python\": true }",
      "json",
    );
    assert.match(
      json,
      /class="token property"[^>]*>&quot;python&quot;</,
    );

    const python = highlight(
      "{\"python\": value}",
      "python",
    );
    assert.match(
      python,
      /class="token property"[^>]*>&quot;python&quot;</,
    );

    const rust = highlight(
      "Foo { python: value }",
      "rust",
    );
    assert.match(
      rust,
      /class="token property"[^>]*>python</,
    );

    const go = highlight(
      "Person{Name: \"x\"}",
      "go",
    );
    assert.match(
      go,
      /class="token property"[^>]*>Name</,
    );

    const perl = highlight(
      "{ python => $value }",
      "perl",
    );
    assert.match(
      perl,
      /class="token property"[^>]*>python</,
    );

    const yaml = highlight(
      "python: value\n",
      "yaml",
    );
    assert.match(
      yaml,
      /class="token key property"[^>]*>python</,
    );
  },
);

test(
  "unknown language falls back to plain escaping",
  () => {
    const html = highlight(
      "<x>",
      "not-a-language",
    );
    assert.equal(
      html,
      "&lt;x&gt;",
    );
  },
);
