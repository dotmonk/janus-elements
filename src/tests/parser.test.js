import {
  describe,
  test,
} from "node:test";
import assert from "node:assert/strict";

import parser from "../janus/template/parser.js";

// Mirrors the tokenizing in template/index.js, which can't load outside a browser.
const parse = (strings, ...values) => parser(strings.reduce(
  (list, str, index) => {
    list = list.concat(str.split(""));
    values.length > index && list.push(index);
    return list;
  },
  [],
)).contents;

const element = (tagName, props = {}, contents = [], propModifiers = []) => ({
  tagName,
  props,
  contents,
  propModifiers,
});

describe(
  "elements and text",
  () => {
    test(
      "empty template",
      () => assert.deepEqual(
        parse``,
        [],
      ),
    );
    test(
      "text only",
      () => assert.deepEqual(
        parse`test`,
        [
          "test",
        ],
      ),
    );
    test(
      "empty element",
      () => assert.deepEqual(
        parse`<p></p>`,
        [
          element("p"),
        ],
      ),
    );
    test(
      "self-closing element",
      () => assert.deepEqual(
        parse`<p />`,
        [
          element("p"),
        ],
      ),
    );
    test(
      "element with text",
      () => assert.deepEqual(
        parse`<p>test</p>`,
        [
          element(
            "p",
            {},
            [
              "test",
            ],
          ),
        ],
      ),
    );
    test(
      "whitespace is kept",
      () => assert.deepEqual(
        parse`<p>\n\ttest\n</p>`,
        [
          element(
            "p",
            {},
            [
              "\n\ttest\n",
            ],
          ),
        ],
      ),
    );
    test(
      "nested elements",
      () => {
        assert.deepEqual(
          parse`<p><b /></p>`,
          [
            element(
              "p",
              {},
              [
                element("b"),
              ],
            ),
          ],
        );
        assert.deepEqual(
          parse`<p><b>a</b></p>`,
          [
            element(
              "p",
              {},
              [
                element(
                  "b",
                  {},
                  [
                    "a",
                  ],
                ),
              ],
            ),
          ],
        );
      },
    );
    test(
      "text between elements",
      () => assert.deepEqual(
        parse`test<p />test<p></p>test`,
        [
          "test",
          element("p"),
          "test",
          element("p"),
          "test",
        ],
      ),
    );
    test(
      "component tag name",
      () => assert.deepEqual(
        parse`<TestProps />`,
        [
          element("TestProps"),
        ],
      ),
    );
  },
);

describe(
  "attributes",
  () => {
    test(
      "boolean attribute",
      () => assert.deepEqual(
        parse`<p a>test</p>`,
        [
          element(
            "p",
            {
              a: true,
            },
            [
              "test",
            ],
          ),
        ],
      ),
    );
    test(
      "unquoted value",
      () => assert.deepEqual(
        parse`<p a=b />`,
        [
          element(
            "p",
            {
              a: "b",
            },
          ),
        ],
      ),
    );
    test(
      "quoted values",
      () => assert.deepEqual(
        parse`<p a="b" b="c" />`,
        [
          element(
            "p",
            {
              a: "b",
              b: "c",
            },
          ),
        ],
      ),
    );
    test(
      "empty quoted value",
      () => assert.deepEqual(
        parse`<p a="" />`,
        [
          element(
            "p",
            {
              a: "",
            },
          ),
        ],
      ),
    );
    test(
      "escaped quote inside quoted value",
      () => assert.deepEqual(
        parse`<p a="x\\"y">t</p>`,
        [
          element(
            "p",
            {
              a: "x\"y",
            },
            [
              "t",
            ],
          ),
        ],
      ),
    );
  },
);

describe(
  "variables",
  () => {
    test(
      "variable as child",
      () => assert.deepEqual(
        parse`<p>test${"a"}test${"b"}</p>`,
        [
          element(
            "p",
            {},
            [
              "test",
              0,
              "test",
              1,
            ],
          ),
        ],
      ),
    );
    test(
      "variable as attribute value",
      () => {
        assert.deepEqual(
          parse`<p a=${"x"} />`,
          [
            element(
              "p",
              {
                a: 0,
              },
            ),
          ],
        );
        assert.deepEqual(
          parse`<p a="${"x"}" />`,
          [
            element(
              "p",
              {
                a: 0,
              },
            ),
          ],
        );
      },
    );
    test(
      "variable as prop modifier",
      () => assert.deepEqual(
        parse`<p ${{
          a: "b",
        }}></p>`,
        [
          element(
            "p",
            {},
            [],
            [
              0,
            ],
          ),
        ],
      ),
    );
  },
);

describe(
  "less-than in text",
  () => {
    test(
      "at top level",
      () => assert.deepEqual(
        parse`1 < 2`,
        [
          "1 < 2",
        ],
      ),
    );
    test(
      "inside an element",
      () => assert.deepEqual(
        parse`<p>a < b</p>`,
        [
          element(
            "p",
            {},
            [
              "a < b",
            ],
          ),
        ],
      ),
    );
    test(
      "at the end",
      () => assert.deepEqual(
        parse`a <`,
        [
          "a <",
        ],
      ),
    );
  },
);

describe(
  "parse errors",
  () => {
    test(
      "unterminated attribute name",
      () => assert.throws(
        () => parse`<p a`,
        /Parse error/,
      ),
    );
    test(
      "unterminated quoted value",
      () => assert.throws(
        () => parse`<p a="b`,
        /Parse error/,
      ),
    );
    test(
      "variable mixed with text in quoted value",
      () => {
        assert.throws(
          () => parse`<p a="b${"c"}" />`,
          /Parse error/,
        );
        assert.throws(
          () => parse`<p a="${"c"}b" />`,
          /Parse error/,
        );
      },
    );
    test(
      "unclosed opening tag",
      () => assert.throws(
        () => parse`<p a="b"`,
        /Parse error/,
      ),
    );
    test(
      "missing end tag",
      () => {
        assert.throws(
          () => parse`<p>text`,
          /Parse error/,
        );
        assert.throws(
          () => parse`<p a>`,
          /Parse error/,
        );
      },
    );
    test(
      "mismatched end tag",
      () => assert.throws(
        () => parse`<p></b>`,
        /Parse error/,
      ),
    );
    test(
      "stray end tag",
      () => assert.throws(
        () => parse`</p>`,
        /Parse error/,
      ),
    );
    test(
      "comments are not supported",
      () => assert.throws(
        () => parse`<!-- note -->`,
        /Parse error/,
      ),
    );
  },
);
