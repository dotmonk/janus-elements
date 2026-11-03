import Component, {
  html,
} from "janus-elements";

import {
  example,
  sectionStyle,
} from "../shared.js";

const counterSnippet = `class Counter extends Component {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  render() {
    const { count } = this.state;
    return html\`
      <Button onClick=\${() => this.setState({ count: count + 1 })}>
        Clicked \${count} times
      </Button>
    \`;
  }
}

Component.register(Counter);`;

const stepperSnippet = `class StepButtons extends Component {
  render() {
    const { onStep } = this.props;
    return html\`
      <Button onClick=\${() => onStep(-1)}>−</Button>
      <Button onClick=\${() => onStep(1)}>+</Button>
    \`;
  }
}

Component.register(StepButtons);

class Stepper extends Component {
  constructor() {
    super();
    this.state = { value: 0 };
  }

  render() {
    const { value } = this.state;
    return html\`
      <p>Value: \${value}</p>
      <StepButtons
        onStep=\${(delta) => this.setState({ value: value + delta })}
      />
    \`;
  }
}

Component.register(Stepper);`;

const markupPropSnippet = `<Tooltip
  tooltip=\${html\`<p><b>Bold</b> Regular <i>italic</i></p>\`}
>
  <Button>Hover me</Button>
</Tooltip>`;

class DocsStepButtons extends Component {

  render() {
    const {
      onStep,
    } = this.props;
    return html`
      <span
        style=${{
          display: "inline-flex",
          gap: "8px",
        }}
      >
        <Button onClick=${() => onStep(-1)}>−</Button>
        <Button onClick=${() => onStep(1)}>+</Button>
      </span>
    `;
  }
}

Component.register(DocsStepButtons);

class DocsStepper extends Component {

  constructor() {
    super();
    this.state = {
      value: 0,
    };
  }

  render() {
    const {
      value,
    } = this.state;
    return html`
      <p
        style=${{
          margin: "0 0 8px",
        }}
      >Value: ${value}</p>
      <DocsStepButtons
        onStep=${(delta) => this.setState(
          {
            value: value + delta,
          },
        )}
      />
    `;
  }
}

Component.register(DocsStepper);

class DocsExamples extends Component {

  constructor() {
    super();
    this.state = {
      count: 0,
    };
  }

  render() {
    const {
      count,
    } = this.state;
    return html`
      <section style=${sectionStyle}>
        <h2>Examples</h2>
        <p>Small interactive samples of the core API.</p>
        <h3>Counter</h3>
        <p>A minimal interactive component that owns its own state:</p>
        <div
          style=${{
            marginBottom: "12px",
          }}
        >
          <Button
            onClick=${() => this.setState(
              {
                count: count + 1,
              },
            )}
          >Clicked ${count} times</Button>
        </div>
        <CodeSnippet
          language="javascript"
          code=${counterSnippet}
        />
        <h3>Parent and child</h3>
        <p>
          Pass values and callbacks as props. Here the parent owns
          <code>value</code>
          ; the child calls
          <code>onStep</code>
          so the parent can
          <code>setState</code>
          .
        </p>
        <div
          style=${{
            marginBottom: "12px",
          }}
        >
          <DocsStepper />
        </div>
        <CodeSnippet
          language="javascript"
          code=${stepperSnippet}
        />
        <h3>Markup as a prop</h3>
        <p>
          Props are not limited to strings and numbers. Wrap markup in
          <code>${"html`...`"}</code>
          and pass it in. UI kit components such as
          <code>${"<Tooltip />"}</code>
          render that content in the bubble (strings still work for plain text).
        </p>
        <div
          style=${{
            marginBottom: "12px",
          }}
        >
          <Tooltip
            tooltip=${html`
              <p>
                <b>Bold</b>
                Regular
                <i>italic</i>
              </p>
            `}
          >
            <Button>Hover me</Button>
          </Tooltip>
        </div>
        ${example(markupPropSnippet)}
      </section>
    `;
  }
}

Component.register(DocsExamples);
