import Component, {
  html,
} from "../janus/index.js";
import {
  pushHash,
  pushPathname,
} from "../janus/ui/index.js";

window.calls = {};
window.changedValues = {};

const count = (name) => () => {
  window.calls[name] = (window.calls[name] || 0) + 1;
};

const countChange = (name) => (event) => {
  count(name)();
  window.changedValues[name] = event.target.value;
};

class HandlerCounts extends Component {

  render() {
    return html`
      <Panel onClick=${count("panel")}>
        <span class="panel-content">Panel</span>
      </Panel>
      <Badge onClick=${count("badge")}>Badge</Badge>
      <Spinner
        class="spinner-click"
        onClick=${count("spinner")}
      >Spinner</Spinner>
      <Spinner class="spinner-default">Ring</Spinner>
      <Spinner
        class="spinner-dots"
        variant="dots"
      >Dots</Spinner>
      <Spinner
        class="spinner-bars"
        variant="bars"
      >Bars</Spinner>
      <Spinner
        class="spinner-pulse"
        variant="pulse"
      >Pulse</Spinner>
      <Spinner
        class="spinner-unknown"
        variant="nope"
      >Fallback</Spinner>
      <Button onClick=${count("button")}>Button</Button>
      <Button color="#d6336c">Custom tone</Button>
      <Input onChange=${countChange("input")} />
      <Textarea onChange=${countChange("textarea")}>Text</Textarea>
      <div class="block-context">
        <Panel
          style=${{
            padding: "20px",
            marginTop: "12px",
          }}
        >Styled panel</Panel>
        <Button
          style=${{
            marginTop: "24px",
          }}
        >Spaced</Button>
      </div>
      <div
        class="flex-context"
        style="display: flex; width: 400px"
      >
        <Panel
          style=${{
            flexGrow: "1",
            margin: "0",
          }}
        >Growing panel</Panel>
        <span>Fixed</span>
      </div>
      <div class="icon-fixtures">
        <EditIcon class="icon-static" />
        <EditIcon
          class="icon-animated"
          animated
        />
        <HeartIcon
          class="icon-colored"
          color="success"
        />
        <SearchIcon
          class="icon-labelled"
          aria-label="Search"
        />
        <CharactersIcon
          class="characters-text"
          text="MW"
          color="accent"
        />
        <CharactersIcon class="characters-child">★</CharactersIcon>
        <CharactersIcon
          class="characters-labelled"
          text="JD"
          aria-label="Jane Doe"
        />
        <CharactersIcon
          class="characters-animated"
          text="●"
          color="error"
          animated
        />
        <IconDiscWrapper
          class="icon-disc"
          size=${40}
          color="accent"
        >
          <CharactersIcon text="MW" />
        </IconDiscWrapper>
        <IconDiscWrapper
          class="icon-disc-outline"
          size=${40}
          color="accent"
          outline
        >
          <CharactersIcon text="MW" />
        </IconDiscWrapper>
        <IconSquareWrapper
          class="icon-square"
          size=${40}
          color="info"
        >
          <UserIcon size=${20} />
        </IconSquareWrapper>
        <IconTriangleWrapper
          class="icon-triangle"
          size=${40}
          color="warning"
        >
          <CharactersIcon text="⚠" />
        </IconTriangleWrapper>
        <IconTriangleWrapper
          class="icon-triangle-outline"
          size=${40}
          color="warning"
          outline
        >
          <CharactersIcon text="⚠" />
        </IconTriangleWrapper>
      </div>
    `;
  }
}

Component.register(HandlerCounts);

class RouterFixture extends Component {

  render() {
    return html`
      <div class="router-fixture">
        <Button
          class="push-hash-a"
          onClick=${() => pushHash("/fixture-a")}
        >Hash A</Button>
        <Button
          class="push-hash-b"
          onClick=${() => pushHash("/fixture-b")}
        >Hash B</Button>
        <Button
          class="push-path-a"
          onClick=${() => pushPathname("/fixture-path-a")}
        >Path A</Button>
        <Button
          class="push-path-b"
          onClick=${() => pushPathname("/fixture-path-b")}
        >Path B</Button>
        <Route hashRegex=${/^\/fixture-a\/?$/}>
          <p class="route-hash-a">Hash route A</p>
        </Route>
        <Route hashRegex=${/^\/fixture-b\/?$/}>
          <p class="route-hash-b">Hash route B</p>
        </Route>
        <Route pathnameRegex=${/^\/fixture-path-a\/?$/}>
          <p class="route-path-a">Path route A</p>
        </Route>
        <Route pathnameRegex=${/^\/fixture-path-b\/?$/}>
          <p class="route-path-b">Path route B</p>
        </Route>
        <Route
          hashRegex=${/^\/fixture-mix\/?$/}
          pathnameRegex=${/^\/fixture-mix\/?$/}
        >
          <p class="route-mix">Mixed route</p>
        </Route>
        <Location
          render=${(location) => html`
            <p class="location-hash-path">${location.hashPath || "(empty)"}</p>
          `}
        />
      </div>
    `;
  }
}

Component.register(RouterFixture);

class CodeEditorFixture extends Component {

  constructor() {
    super();
    this.state = {
      value: "const greet = \"hi\";\n",
      pyValue: "print(1)\n",
      overrideValue: "{\"a\": 1}\n",
      autoValue: "#!/usr/bin/env python3\nprint(1)\n",
      detected: "",
    };
  }

  render() {
    const {
      value,
      pyValue,
      overrideValue,
      autoValue,
      detected,
    } = this.state;
    return html`
      <div class="code-editor-fixtures">
        <CodeEditor
          class="code-js"
          language="javascript"
          value=${value}
          onChange=${(next) => {
            window.calls.code = (window.calls.code || 0) + 1;
            window.changedValues.code = next;
            this.setState(
              {
                value: next,
              },
            );
          }}
        />
        <CodeEditor
          class="code-py-file"
          filename="script.py"
          value=${pyValue}
          onChange=${(next) => this.setState(
            {
              pyValue: next,
            },
          )}
        />
        <CodeEditor
          class="code-py-shebang"
          value=${"#!/usr/bin/env python3\nprint(1)\n"}
        />
        <CodeEditor
          class="code-auto"
          value=${autoValue}
          onChange=${(next) => this.setState(
            {
              autoValue: next,
            },
          )}
          onLanguageChange=${(language) => {
            window.detectedLanguage = language;
            this.setState(
              {
                detected: language,
              },
            );
          }}
        />
        <p class="code-detected">${detected}</p>
        <CodeEditor
          class="code-override"
          language="json"
          filename="notes.py"
          value=${overrideValue}
          onChange=${(next) => this.setState(
            {
              overrideValue: next,
            },
          )}
        />
        <CodeEditor
          class="code-readonly"
          language="javascript"
          value=${"const x = 1;"}
          readOnly=${true}
        />
        <CodeEditor
          class="code-disabled"
          language="javascript"
          value=${"const y = 2;"}
          disabled=${true}
        />
        <CodeEditor
          class="code-plain"
          language="plain"
          value=${"<raw & tagged>"}
        />
      </div>
    `;
  }
}

Component.register(CodeEditorFixture);

class RichTextareaFixture extends Component {

  constructor() {
    super();
    this.state = {
      value: "Hello **world**",
      controlled: "Start",
      listValue: "- alpha\n- beta",
      codeValue: "Use `plain code` here",
      taskValue: "- [ ] todo\n- [x] done",
    };
  }

  render() {
    const {
      value,
      controlled,
      listValue,
      codeValue,
      taskValue,
    } = this.state;
    return html`
      <div class="rich-textarea-fixtures">
        <RichTextarea
          class="rich-main"
          value=${value}
          onChange=${(next) => {
            window.calls.rich = (window.calls.rich || 0) + 1;
            window.changedValues.rich = next;
            this.setState(
              {
                value: next,
              },
            );
          }}
        />
        <RichTextarea
          class="rich-list"
          value=${listValue}
          onChange=${(next) => {
            window.changedValues.richList = next;
            this.setState(
              {
                listValue: next,
              },
            );
          }}
        />
        <RichTextarea
          class="rich-code"
          value=${codeValue}
          onChange=${(next) => {
            window.changedValues.richCode = next;
            this.setState(
              {
                codeValue: next,
              },
            );
          }}
        />
        <RichTextarea
          class="rich-tasks"
          value=${taskValue}
          onChange=${(next) => {
            window.changedValues.richTasks = next;
            this.setState(
              {
                taskValue: next,
              },
            );
          }}
        />
        <RichTextarea
          class="rich-controlled"
          value=${controlled}
          onChange=${(next) => {
            window.changedValues.richControlled = next;
            this.setState(
              {
                controlled: next,
              },
            );
          }}
        />
        <button
          type="button"
          class="rich-set-value"
          onClick=${() => this.setState(
            {
              controlled: "## From outside",
            },
          )}
        >Set value</button>
        <RichTextarea
          class="rich-disabled"
          value=${"Locked"}
          disabled=${true}
        />
        <Field
          label="Notes"
          hint="Markdown"
          class="rich-field"
        >
          <RichTextarea
            class="rich-in-field"
            value=${"Fielded"}
            onChange=${() => {}}
          />
        </Field>
      </div>
    `;
  }
}

Component.register(RichTextareaFixture);

class ToolbarFixture extends Component {

  constructor() {
    super();
    this.state = {
      selectValue: "a",
    };
  }

  render() {
    const {
      selectValue,
    } = this.state;
    return html`
      <div class="toolbar-fixtures">
        <Toolbar
          class="toolbar-main"
          label="Actions"
        >
          <Button class="toolbar-save">Save</Button>
          <Button class="toolbar-cancel">Cancel</Button>
          <Select
            class="toolbar-select"
            searchable=${false}
            options=${[
              {
                value: "a",
                name: "Alpha",
              },
              {
                value: "b",
                name: "Beta",
              },
            ]}
            value=${selectValue}
            onChange=${(value) => this.setState(
              {
                selectValue: value,
              },
            )}
          />
        </Toolbar>
        <Toolbar
          class="toolbar-searchable"
          label="Filter bar"
        >
          <Button class="toolbar-go">Go</Button>
          <Select
            class="toolbar-search-select"
            searchable
            options=${[
              {
                value: "a",
                name: "Alpha",
              },
              {
                value: "b",
                name: "Beta",
              },
            ]}
            value=${selectValue}
            onChange=${(value) => this.setState(
              {
                selectValue: value,
              },
            )}
          />
          <Button class="toolbar-reset">Reset</Button>
        </Toolbar>
      </div>
    `;
  }
}

Component.register(ToolbarFixture);
