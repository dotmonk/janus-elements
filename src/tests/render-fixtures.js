import Component, {
  html,
} from "../janus/index.js";

import "../janus/ui/Accordion.js";

window.renderCounts = {};

const countRender = (name) => {
  window.renderCounts[name] = (window.renderCounts[name] || 0) + 1;
};

class TypingField extends Component {

  render() {
    const {
      text = "",
    } = this.state;
    return html`
      <input
        onInput=${(event) => this.setState(
          {
            text: event.target.value,
          },
        )}
      />
      <span class="echo">${text}</span>
    `;
  }
}

class ClickCounter extends Component {

  render() {
    countRender("ClickCounter");
    const {
      count = 0,
    } = this.state;
    return html`
      <button
        onClick=${() => this.setState(
          {
            count: count + 1,
          },
        )}
      >${this.props.label}: ${count}</button>
    `;
  }
}

class CounterHost extends Component {

  render() {
    const {
      renders = 0,
    } = this.state;
    return html`
      <button
        class="rerender"
        onClick=${() => this.setState(
          {
            renders: renders + 1,
          },
        )}
      >Re-render parent</button>
      <span class="parent-renders">${renders}</span>
      <ClickCounter label=${`Parent render ${renders}`} />
    `;
  }
}

class Wrapper extends Component {

  render() {
    countRender("Wrapper");
    return html`
      <div>${this.childElements}</div>
    `;
  }
}

class RenderCountHost extends Component {

  render() {
    return html`
      <Wrapper>
        <b>1</b>
        <b>2</b>
        <b>3</b>
      </Wrapper>
    `;
  }
}

class Frame extends Component {

  render() {
    return html`
      <fieldset>${this.childElements}</fieldset>
    `;
  }
}

class SlottedField extends Component {

  render() {
    const {
      text = "",
    } = this.state;
    return html`
      <Frame>
        <input
          onInput=${(event) => this.setState(
            {
              text: event.target.value,
            },
          )}
        />
      </Frame>
      <span class="echo">${text}</span>
    `;
  }
}

window.mountCount = 0;

class MountCounter extends Component {

  componentWillMount() {
    window.mountCount += 1;
  }

  render() {
    return html`
      <i>mounted</i>
    `;
  }
}

class TickingFrame extends Component {

  render() {
    const {
      ticks = 0,
    } = this.state;
    return html`
      <fieldset>${this.childElements}</fieldset>
      <button
        class="tick"
        onClick=${() => this.setState(
          {
            ticks: ticks + 1,
          },
        )}
      >${ticks}</button>
    `;
  }
}

class ReslottedField extends Component {

  render() {
    return html`
      <TickingFrame>
        <input />
        <MountCounter />
      </TickingFrame>
    `;
  }
}

class ItemCounter extends Component {

  render() {
    const {
      count = 0,
    } = this.state;
    return html`
      <button
        class="item-counter"
        onClick=${() => this.setState(
          {
            count: count + 1,
          },
        )}
      >${this.props.name}: ${count}</button>
    `;
  }
}

class KeyedList extends Component {

  constructor() {
    super();
    this.state = {
      items: [
        "a",
        "b",
        "c",
      ],
    };
  }

  render() {
    const {
      items,
    } = this.state;
    return html`
      <button
        class="remove-first"
        onClick=${() => this.setState(
          {
            items: items.slice(1),
          },
        )}
      >Remove first</button>
      <button
        class="add-first"
        onClick=${() => this.setState(
          {
            items: [
              "z",
              ...items,
            ],
          },
        )}
      >Add first</button>
      <button
        class="reverse"
        onClick=${() => this.setState(
          {
            items: [
              ...items,
            ].reverse(),
          },
        )}
      >Reverse</button>
      <ul>${items.map(
          (item) => html`
            <li key=${item}>
              <input name=${item} />
              <ItemCounter name=${item} />
            </li>
          `,
        )}</ul>
    `;
  }
}

class DisclosureHost extends Component {

  render() {
    const {
      renders = 0,
    } = this.state;
    return html`
      <details class="plain-details">
        <summary>More</summary>
        Hidden text
      </details>
      <button
        class="disclosure-rerender"
        onClick=${() => this.setState(
          {
            renders: renders + 1,
          },
        )}
      >Re-render</button>
      <span
        class="flagged"
        ${renders % 2
          ? {
              "data-odd": "",
            }
          : {}}
      >${renders}</span>
    `;
  }
}

class StyleGcHost extends Component {

  constructor() {
    super();
    this.state = {
      mode: "empty",
      uniqueCount: 0,
    };
  }

  render() {
    const {
      mode,
      uniqueCount,
    } = this.state;
    if (mode === "unique") {
      return html`
        <div class="style-gc-root">${Array.from(
            {
              length: uniqueCount,
            },
            (_, index) => html`
              <span
                class=${`style-gc-unique-${index}`}
                style=${{
                  marginTop: `${index + 1}px`,
                }}
              >${index}</span>
            `,
          )}</div>
      `;
    }
    if (mode === "shared") {
      const shared = {
        padding: "9px",
      };
      return html`
        <div class="style-gc-root">
          <span
            class="style-gc-shared-a"
            style=${shared}
          >a</span>
          <span
            class="style-gc-shared-b"
            style=${shared}
          >b</span>
        </div>
      `;
    }
    if (mode === "shared-one") {
      return html`
        <div class="style-gc-root">
          <span
            class="style-gc-shared-a"
            style=${{
              padding: "9px",
            }}
          >a</span>
        </div>
      `;
    }
    return html`
      <div class="style-gc-root" />
    `;
  }
}

window.iconClicks = 0;

class IconHost extends Component {

  render() {
    const {
      large = false,
    } = this.state;
    return html`
      <svg
        class="icon"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        role="img"
        aria-label="Status"
      >
        <circle
          cx="12"
          cy="12"
          r=${large
            ? 10
            : 6}
          onClick=${() => window.iconClicks += 1}
        />
        ${[
          4,
          18,
        ].map(
          (x) => html`
            <rect
              class="nested-rect"
              x=${x}
              y="20"
              width="2"
              height="2"
            />
          `,
        )}
        <foreignObject
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <span class="inside-foreign">html</span>
        </foreignObject>
      </svg>
      <button
        class="grow-icon"
        onClick=${() => this.setState(
          {
            large: !large,
          },
        )}
      >Grow</button>
    `;
  }
}

class AccordionReorderHost extends Component {

  constructor() {
    super();
    this.state = {
      items: [
        {
          id: "a",
          title: "Alpha",
          content: "A body",
        },
        {
          id: "b",
          title: "Beta",
          content: "B body",
        },
      ],
    };
  }

  render() {
    return html`
      <div>
        <button
          class="reorder"
          onClick=${() => this.setState(
            {
              items: [
                ...this.state.items,
              ].reverse(),
            },
          )}
        >Reorder</button>
        <Accordion items=${this.state.items} />
      </div>
    `;
  }
}

class SelectValueHost extends Component {

  constructor() {
    super();
    this.state = {
      month: 10,
    };
  }

  render() {
    const {
      month,
    } = this.state;
    return html`
      <div>
        <select
          class="month-select"
          aria-label="Fixture month"
          value=${String(month)}
          onChange=${(event) => this.setState(
            {
              month: Number(event.target.value),
            },
          )}
        >${[
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
          ].map(
            (value) => html`
              <option
                key=${value}
                value=${String(value)}
              >${value}</option>
            `,
          )}</select>
        <button
          class="set-march"
          onClick=${() => this.setState(
            {
              month: 3,
            },
          )}
        >March</button>
      </div>
    `;
  }
}

[
  IconHost,
  AccordionReorderHost,
  SelectValueHost,
  StyleGcHost,
  DisclosureHost,
  TypingField,
  ClickCounter,
  CounterHost,
  Wrapper,
  RenderCountHost,
  Frame,
  SlottedField,
  MountCounter,
  TickingFrame,
  ReslottedField,
  ItemCounter,
  KeyedList,
].forEach(
  (component) => Component.register(component),
);
