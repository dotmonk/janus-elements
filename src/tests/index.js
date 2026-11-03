import {
  title,
  success,
  error,
  summary,
} from "./helpers.js";

import template, {
  render,
} from "../janus/template/index.js";

import {
  createStyle,
} from "../janus/template/createTemplateFunction.js";

import Component from "../janus/Component.js";

const html = (strings, ...values) => {
  return {
    strings,
    values,
  };
};

const isWhitespaceText = (node) => node?.nodeType === 3 && !/\S/.test(node.textContent);

// html` pretty-print inserts newlines between tags; those become text nodes.
// Collapse formatter whitespace around tags so assertions match compact HTML.
const normalizeHtml = (html) => html.replace(
  />\s+/g,
  ">",
).replace(
  /\s+</g,
  "<",
).replace(
  /^\s+|\s+$/g,
  "",
);

const matchTemplate = (tagParts, result) => {
  try {
    const elements = template.apply(
      this,
      [
        tagParts.strings,
      ].concat(tagParts.values),
    );
    const container = document.createElement("div");
    // Pretty-printed html`…` includes leading/trailing newline text nodes.
    elements.forEach(
      (element) => {
        if (!isWhitespaceText(element)) {
          container.appendChild(element);
        }
      },
    );
    const html = normalizeHtml(container.innerHTML);
    const expected = normalizeHtml(result);
    if (expected === html) {
      success(result || "ok");
    } else {
      error(`${html} expected ${result}`);
    }
  } catch (e) {
    error(`Parse error expected ${result} got ${String(e)}`);
  }
};

const matchTemplateError = (tagParts, expectedMessage) => {
  try {
    template.apply(
      this,
      [
        tagParts.strings,
      ].concat(tagParts.values),
    );
    error(`Expected an error containing "${expectedMessage}"`);
  } catch (e) {
    if (String(e).includes(expectedMessage)) {
      success(String(e));
    } else {
      error(`Expected an error containing "${expectedMessage}" got ${String(e)}`);
    }
  }
};

const testHtmlElementSupport = () => {
  title("Basic HTML element support");
  matchTemplate(
    html``,
    "",
  );
  matchTemplate(
    html`
      test
    `,
    "test",
  );
  matchTemplate(
    html`
      <p />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p>test</p>
    `,
    "<p>test</p>",
  );
  matchTemplate(
    html`
      <p a>test</p>
    `,
    "<p a=\"\">test</p>",
  );
  matchTemplate(
    html`
      <p a="b">test</p>
    `,
    "<p a=\"b\">test</p>",
  );
  matchTemplate(
    html`
      <p a="b">test</p>
    `,
    "<p a=\"b\">test</p>",
  );
  matchTemplate(
    html`
      <p
        a="b"
        b="c"
      >test</p>
    `,
    "<p a=\"b\" b=\"c\">test</p>",
  );
  matchTemplate(
    html`
      <p a="">test</p>
    `,
    "<p a=\"\">test</p>",
  );
  matchTemplate(
    html`
      <p>\n\ttest\n</p>
    `,
    "<p>\n\ttest\n</p>",
  );
  matchTemplate(
    html`
      <p>
        <b />
      </p>
    `,
    "<p><b></b></p>",
  );
  matchTemplate(
    html`
      <p>
        <b>a</b>
      </p>
    `,
    "<p><b>a</b></p>",
  );
  matchTemplate(
    html`
      test
      <p />
      test
      <p />
      test
    `,
    "test<p></p>test<p></p>test",
  );
};

const testHtmlElementVariablesSupport = () => {
  title("Basic HTML elements with variables and attributes support");
  matchTemplate(
    html`
      <p>${"test"}</p>
    `,
    "<p>test</p>",
  );
  matchTemplate(
    html`
      <p>test${"test"}test${"foo"}</p>
    `,
    "<p>testtesttestfoo</p>",
  );
  matchTemplate(
    html`
      <p a=${"test"} />
    `,
    "<p a=\"test\"></p>",
  );
  matchTemplate(
    html`
      <p a=${() => {}} />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p a=${true} />
    `,
    "<p a=\"\"></p>",
  );
  matchTemplate(
    html`
      <p a=${false} />
    `,
    "<p></p>",
  );
  matchTemplateError(
    html`
      <p onClick=${"test"} />
    `,
    "must be a function",
  );
  matchTemplateError(
    html`
      <p onclick=${"test"} />
    `,
    "must be a function",
  );
  matchTemplateError(
    html`
      <p onclick="test" />
    `,
    "must be a function",
  );
  matchTemplateError(
    html`
      <p onClick=${true} />
    `,
    "must be a function",
  );
  matchTemplate(
    html`
      <p onClick=${undefined} />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p onClick=${null} />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p onClick=${false} />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p one=${"test"} />
    `,
    "<p one=\"test\"></p>",
  );
  matchTemplate(
    html`
      <p onClick=${() => {}} />
    `,
    "<p></p>",
  );
  matchTemplate(
    html`
      <p passOnFunction=${() => {}} />
    `,
    "<p></p>",
  );
};

const getElementsFromTemplate = (tagParts) => {
  let elements = [];
  try {
    elements = template.apply(
      this,
      [
        tagParts.strings,
      ].concat(tagParts.values),
    );
  } catch (e) {
    error(`Template error: ${String(e)}`);
  }
  // Skip formatter-inserted leading/trailing whitespace text nodes so
  // elements[0] is the first real element (see html` pretty-print layout).
  return elements.filter(
    (node) => !isWhitespaceText(node),
  );
};

const testHtmlElementEventsSupport = () => {
  title("Basic HTML element event support");
  let clicked = false;
  const elements = getElementsFromTemplate(html`
    <a
      onClick=${() => {
        clicked = true;
      }}
    />
  `);
  elements[0].click();
  if (clicked) {
    success("Click event was attached and triggered");
  } else {
    error("Click event was not attached or not triggered");
  }
};

const testJanusComponentSupport = () => {
  title("Basic Janus Component support");

  class Test extends Component {

    render() {
      return template`<h4>This is a component</h4>`;
    }
  }

  Component.register(Test);

  matchTemplate(
    html`
      <Test />
    `,
    "<janus-test></janus-test>",
  );
  matchTemplate(
    html`
      <Test a=${"test"} />
    `,
    "<janus-test a=\"test\"></janus-test>",
  );
  matchTemplateError(
    html`
      <Tset />
    `,
    "Unknown component <Tset>",
  );
  matchTemplate(
    html`
      <my-widget />
    `,
    "<my-widget></my-widget>",
  );
};

const testJanusComponentPropsSupport = () => {
  title("Basic Janus Component Props support");

  class TestProps extends Component {

    render() {
      const props = this.props;
      return template`<h4>${props.values}</h4>`;
    }
  }

  Component.register(TestProps);

  let elements = getElementsFromTemplate(html`
    <TestProps
      values=${[
        template`<a />`,
        template`<b />`,
        template`<p />`,
      ]}
    />
  `);
  if (elements[0].props.values.length === 3) {
    success("Janus component created with correct props structure");
  } else {
    error("Janus component created with imcorrect props structure");
  }
  elements = template`<TestProps values=${[
    template`<a />`,
    template`<b />`,
    template`<p />`,
  ]} />`;
  const result = elements[0].render();
  if (result[0].innerHTML === "<a></a><b></b><p></p>") {
    success("Janus components variable with array of components rendered correctly");
  } else {
    error("Janus components variable with array of components did not render correctly");
  }
};

const testJanusComponentPropsModifiersSupport = () => {
  title("Basic Janus Component Props Modifiers support");
  matchTemplate(
    html`
      <p
        ${{
          test: "test",
        }}
      />
    `,
    "<p test=\"test\"></p>",
  );
  matchTemplate(
    html`
      <p
        ${{
          "data-count": 5,
        }}
      />
    `,
    "<p data-count=\"5\"></p>",
  );
  matchTemplate(
    html`
      <p
        ${{
          "data-count": 1,
        }}
        title=${"x"}
      />
    `,
    "<p title=\"x\" data-count=\"1\"></p>",
  );
  matchTemplate(
    html`
      <p
        title="a"
        ${{
          title: "b",
        }}
      />
    `,
    "<p title=\"b\"></p>",
  );
  matchTemplate(
    html`
      <p data-count=${5} />
    `,
    "<p data-count=\"5\"></p>",
  );
};

const matchStyling = (styleObject, expected) => {
  const actual = createStyle(
    ".janus-auto-class-2001",
    styleObject,
  );
  if (expected.trim().replace(
    /\n/g,
    "",
  ) === actual.trim().replace(
    /\n/g,
    "",
  )) {
    success("Works");
  } else {
    error(`Expected \n"${expected.trim().replace(/\n/g, "")}"\n, found \n"${actual.trim().replace(/\n/g, "")}"`);
  }
};

const testJanusStylingSupport = () => {
  title("Janus Styling support");

  matchStyling(
    {
      color: "red",
    },
    ".janus-auto-class-2001 {color: red;}",
  );

  matchStyling(
    {
      display: "block",
      maxWidth: "20%",
      ">p": {
        width: "100%",
        b: {
          color: "#f00",
        },
      },
      "p>b": {
        color: "#0f0",
      },
      "b:hover": {
        fontSize: "12pt",
      },
      ":hover": {
        fontSize: "5px",
      },
    },
    `.janus-auto-class-2001 {display: block;max-width: 20%;}
.janus-auto-class-2001>p {width: 100%;}
.janus-auto-class-2001>p b {color: #f00;}
.janus-auto-class-2001 p>b {color: #0f0;}
.janus-auto-class-2001 b:hover {font-size: 12pt;}
.janus-auto-class-2001:hover {font-size: 5px;}`,
  );
};

const testHtmlElementPropsAsChildrenSupport = () => {
  title("Janus Component props as children support");

  class TestChildrenProps extends Component {

    render() {
      const {
        test,
      } = this.props;
      return template`<span>${test}</span>`;
    }
  }

  Component.register(TestChildrenProps);

  matchTemplate(
    //sanity check
    html`
      <TestChildrenProps />
    `,
    "<janus-test-children-props></janus-test-children-props>",
  );

  const container = document.createElement("div");
  document.body.appendChild(container);
  render(
    container,
    template`<TestChildrenProps test=${"test1"}/>`,
  );
  const expected = "<janus-test-children-props test=\"test1\"><span>test1</span></janus-test-children-props>";
  if (container.innerHTML === expected) {
    success(expected);
  } else {
    error(`${container.innerHTML} expected ${expected}`);
  }
  container.remove();
};

(() => {
  testHtmlElementSupport();
  testHtmlElementVariablesSupport();
  testHtmlElementEventsSupport();
  testJanusComponentSupport();
  testJanusComponentPropsSupport();
  testJanusStylingSupport();
  testJanusComponentPropsModifiersSupport();
  testHtmlElementPropsAsChildrenSupport();
  summary();
})();
