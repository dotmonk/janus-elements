import Component, {
  html,
} from "janus-elements";
import SearchIcon from "janus-elements/ui/icons/search";
import FilterIcon from "janus-elements/ui/icons/filter";

import {
  example,
  kitPropRows,
  propsTable,
  rowStyle,
  sectionStyle,
} from "../shared.js";

const options = [
  {
    name: "Option #1",
    value: "option1",
  },
  {
    name: "Option #2",
    value: "option2",
  },
];

const manyOptions = [
  ...options,
  {
    name: "Option #3",
    value: "option3",
  },
  {
    name: "Alpha",
    value: "alpha",
  },
  {
    name: "Bravo",
    value: "bravo",
  },
  {
    name: "Charlie",
    value: "charlie",
  },
];

const groupedOptions = [
  {
    name: "Fruit",
    options: [
      {
        name: "Apple",
        value: "apple",
      },
      {
        name: "Banana",
        value: "banana",
      },
      {
        name: "Cherry",
        value: "cherry",
        disabled: true,
      },
    ],
  },
  {
    name: "Veg",
    options: [
      {
        name: "Carrot",
        value: "carrot",
      },
      {
        name: "Daikon",
        value: "daikon",
      },
    ],
  },
];

const colorsSnippet = `<Select color="standard" options=\${options} onChange=\${(value) => alert(value)} />
<Select color="accent" options=\${options} onChange=\${(value) => alert(value)} />
<Select color="success" options=\${options} onChange=\${(value) => alert(value)} />
<Select value="option2" options=\${options} onChange=\${(value) => alert(value)} />
<Select disabled options=\${options} />`;

const propsSnippet = `<Select
  placeholder="Select and change"
  value=\${selectPropValue}
  options=\${[...options, { name: "Option #3", value: "option3" }]}
  onChange=\${(value) => setState({ selectPropValue: value })}
/>`;

const clearableSnippet = `<Select
  clearable
  placeholder="Clearable"
  value=\${clearableValue}
  options=\${options}
  onChange=\${(value) => setState({ clearableValue: value })}
/>`;

const multiSnippet = `<Select
  multi
  clearable
  class="multi-select"
  placeholder="Pick several"
  value=\${multiValue}
  options=\${manyOptions}
  onChange=\${(value) => setState({ multiValue: value })}
/>`;

const groupsSnippet = `<Select
  class="grouped-select"
  placeholder="Grouped"
  value=\${groupedValue}
  options=\${groupedOptions}
  onChange=\${(value) => setState({ groupedValue: value })}
/>`;

const creatableSnippet = `<Select
  creatable
  class="creatable-select"
  placeholder="Type to create"
  value=\${creatableValue}
  options=\${creatableOptions}
  onChange=\${(value) => setState({ creatableValue: value })}
  onCreateOption=\${(name) =>
    setState({
      creatableOptions: [...creatableOptions, { name, value: name }],
    })
  }
/>`;

const asyncPool = [
  {
    name: "Alpha",
    value: "alpha",
  },
  {
    name: "Alpine",
    value: "alpine",
  },
  {
    name: "Beta",
    value: "beta",
  },
  {
    name: "Bravo",
    value: "bravo",
  },
  {
    name: "Charlie",
    value: "charlie",
  },
];

const loadAsyncOptions = (input) => new Promise(
  (resolve) => {
    setTimeout(
      () => {
        const needle = (input || "").trim().toLowerCase();
        resolve(asyncPool.filter(
          (option) => !needle
            ? true
            : option.name.toLowerCase().includes(needle),
        ));
      },
      250,
    );
  },
);

const asyncSnippet = `<Select
  class="async-select"
  placeholder="Async search"
  cacheOptions
  loadOptions=\${(input) => fetchOptions(input)}
  onChange=\${(value) => setState({ asyncValue: value })}
  value=\${asyncValue}
/>`;

const asyncSearchSnippet = `import SearchIcon from "janus-elements/ui/icons/search";

<Select
  class="async-search-select"
  placeholder="Async search (icon)"
  headIcon=\${SearchIcon}
  tailIcon=\${null}
  cacheOptions
  loadOptions=\${(input) => fetchOptions(input)}
  onChange=\${(value) => setState({ asyncSearchValue: value })}
  value=\${asyncSearchValue}
/>`;

const customTailSnippet = `import FilterIcon from "janus-elements/ui/icons/filter";

<Select
  class="filter-tail-select"
  placeholder="Filter tail icon"
  tailIcon=\${FilterIcon}
  options=\${options}
  onChange=\${(value) => setState({ filterTailValue: value })}
  value=\${filterTailValue}
/>`;

const renderSnippet = `<Select
  class="render-select"
  searchable=\${false}
  options=\${options}
  value=\${renderValue}
  onChange=\${(value) => setState({ renderValue: value })}
  renderOption=\${(option) => html\`• \${option.name}\`}
  renderValue=\${(option) => html\`★ \${option.name}\`}
/>`;

const overflowSnippet = `<div style=\${{ height: "72px", overflow: "auto", border: "1px solid var(--janus-border)" }}>
  <p>Scrollable padding</p>
  <Select class="overflow-select" options=\${manyOptions} placeholder="Open in overflow" />
  <p>More padding below</p>
</div>`;

const typeaheadSnippet = `<Select
  searchable=\${false}
  tailIcon=\${null}
  class="typeahead-select"
  options=\${[...options, { name: "Option #3", value: "option3" }]}
  placeholder="Typeahead (not searchable)"
/>`;

class DocsUiSelect extends Component {

  constructor() {
    super();
    this.state = {
      multiValue: [],
      creatableOptions: [
        ...options,
      ],
    };
  }

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Select</h2>
        <h3>Controlled value</h3>
        <Select
          onChange=${(value) => this.setState(
            {
              selectPropValue: value,
            },
          )}
          value=${this.state.selectPropValue}
          placeholder="Select and change"
          options=${[
            ...options,
            {
              name: "Option #3",
              value: "option3",
            },
          ]}
        />
        ${example(propsSnippet)}
        <h3>Multi</h3>
        <Select
          class="multi-select"
          multi=${true}
          clearable=${true}
          placeholder="Pick several"
          value=${this.state.multiValue}
          options=${manyOptions}
          onChange=${(value) => this.setState(
            {
              multiValue: value,
            },
          )}
        />
        ${example(multiSnippet)}
        <h3>Groups and disabled</h3>
        <Select
          class="grouped-select"
          placeholder="Grouped"
          value=${this.state.groupedValue}
          options=${groupedOptions}
          onChange=${(value) => this.setState(
            {
              groupedValue: value,
            },
          )}
        />
        ${example(groupsSnippet)}
        <h3>Creatable</h3>
        <Select
          class="creatable-select"
          creatable=${true}
          placeholder="Type to create"
          value=${this.state.creatableValue}
          options=${this.state.creatableOptions}
          onChange=${(value) => this.setState(
            {
              creatableValue: value,
            },
          )}
          onCreateOption=${(name) => {
            const exists = this.state.creatableOptions.some(
              (option) => option.value === name,
            );
            this.setState(
              {
                creatableValue: name,
                creatableOptions: exists
                  ? this.state.creatableOptions
                  : [
                      ...this.state.creatableOptions,
                      {
                        name,
                        value: name,
                      },
                    ],
              },
            );
          }}
        />
        ${example(creatableSnippet)}
        <h3>Async</h3>
        <Select
          class="async-select"
          placeholder="Async search"
          cacheOptions=${true}
          loadOptions=${loadAsyncOptions}
          value=${this.state.asyncValue}
          onChange=${(value) => this.setState(
            {
              asyncValue: value,
            },
          )}
        />
        ${example(asyncSnippet)}
        <h3>Async with search icon</h3>
        <Select
          class="async-search-select"
          placeholder="Async search (icon)"
          headIcon=${SearchIcon}
          tailIcon=${null}
          cacheOptions=${true}
          loadOptions=${loadAsyncOptions}
          value=${this.state.asyncSearchValue}
          onChange=${(value) => this.setState(
            {
              asyncSearchValue: value,
            },
          )}
        />
        ${example(asyncSearchSnippet)}
        <h3>Custom tail icon</h3>
        <Select
          class="filter-tail-select"
          placeholder="Filter tail icon"
          tailIcon=${FilterIcon}
          options=${options}
          value=${this.state.filterTailValue}
          onChange=${(value) => this.setState(
            {
              filterTailValue: value,
            },
          )}
        />
        ${example(customTailSnippet)}
        <h3>Custom render</h3>
        <Select
          class="render-select"
          searchable=${false}
          placeholder="Custom render"
          options=${options}
          value=${this.state.renderValue}
          onChange=${(value) => this.setState(
            {
              renderValue: value,
            },
          )}
          renderOption=${(option) => html`
            •
            ${option.name}
          `}
          renderValue=${(option) => html`
            ★
            ${option.name}
          `}
        />
        ${example(renderSnippet)}
        <h3>Clearable</h3>
        <Select
          class="clearable-select"
          clearable=${true}
          placeholder="Clearable"
          value=${this.state.clearableValue}
          options=${options}
          onChange=${(value) => this.setState(
            {
              clearableValue: value,
            },
          )}
        />
        ${example(clearableSnippet)}
        <h3>Menu in overflow</h3>
        <div
          class="select-overflow-scroller"
          style=${{
            height: "72px",
            overflow: "auto",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "var(--janus-border)",
            padding: "8px",
          }}
        >
          <p>Scrollable padding</p>
          <Select
            class="overflow-select"
            options=${manyOptions}
            placeholder="Open in overflow"
            value=${this.state.overflowValue}
            onChange=${(value) => this.setState(
              {
                overflowValue: value,
              },
            )}
          />
          <p>More padding below</p>
        </div>
        ${example(overflowSnippet)}
        <h3>Typeahead without search</h3>
        <Select
          class="typeahead-select"
          searchable=${false}
          tailIcon=${null}
          placeholder="Typeahead (not searchable)"
          options=${[
            ...options,
            {
              name: "Option #3",
              value: "option3",
            },
          ]}
          onChange=${(value) => this.setState(
            {
              typeaheadValue: value,
            },
          )}
          value=${this.state.typeaheadValue}
        />
        ${example(typeaheadSnippet)}
        <h3>Colors and states</h3>
        <div style=${rowStyle}>
          ${[
            "standard",
            "accent",
            "success",
          ].map(
            (color) => html`
              <Select
                color=${color}
                onChange=${(value) => alert(value)}
                options=${options}
              />
            `,
          )}
          <Select
            value="option2"
            onChange=${(value) => alert(value)}
            options=${options}
          />
          <Select
            disabled=${true}
            options=${options}
          />
        </div>
        ${example(colorsSnippet)}
        ${propsTable(
          "Select",
          [
            ...kitPropRows,
            [
              "options",
              "Option[] | Group[]",
              "`{ name, value }` or grouped `{ name, options }`.",
            ],
            [
              "value",
              "string | string[]",
              "Selected value(s); array when `multi`.",
            ],
            [
              "placeholder",
              "string",
              "Empty trigger label.",
            ],
            [
              "searchable",
              "boolean",
              "Filter while typing (default true).",
            ],
            [
              "clearable",
              "boolean",
              "Clear control on the trigger.",
            ],
            [
              "multi",
              "boolean",
              "Multi-select with chips.",
            ],
            [
              "creatable",
              "boolean",
              "Create option from the filter.",
            ],
            [
              "onCreateOption",
              "(name) => void",
              "Called when creating an option.",
            ],
            [
              "formatCreateLabel",
              "(input) => string",
              "Create-row label.",
            ],
            [
              "loadOptions",
              "(input) => Promise",
              "Async options loader.",
            ],
            [
              "cacheOptions",
              "boolean",
              "Cache async results.",
            ],
            [
              "defaultOptions",
              "boolean | Option[]",
              "Options before/without search.",
            ],
            [
              "loading",
              "boolean",
              "Force the loading row (with or without `loadOptions`).",
            ],
            [
              "loadingMessage",
              "string",
              "Loading row label (default `Loading...`).",
            ],
            [
              "noOptionsMessage",
              "string",
              "Empty menu message (default `No options`).",
            ],
            [
              "renderOption",
              "(opt) => node",
              "Custom option row.",
            ],
            [
              "renderValue",
              "(opt) => node",
              "Custom trigger value.",
            ],
            [
              "headIcon / tailIcon",
              "Icon | null",
              "Trigger icons; default tail is Chevron.",
            ],
            [
              "onChange",
              "(value) => void",
              "Selected value(s), or cleared empty.",
            ],
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiSelect);
