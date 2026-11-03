import Component, {
  html,
} from "janus-elements";

import {
  example,
  kitPropRows,
  propsTable,
  sectionStyle,
} from "../shared.js";

const categories = [
  "Forms",
  "Feedback",
  "Layout",
  "Data",
];

const inventory = Array.from(
  {
    length: 23,
  },
  (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    category: categories[index % categories.length],
    stock: index * 37 % 100,
    price: `$${(9 + index * 1.5).toFixed(2)}`,
  }),
);

const inventoryColumns = [
  {
    key: "name",
    title: "Name",
  },
  {
    key: "category",
    title: "Category",
  },
  {
    key: "stock",
    title: "Stock",
    align: "right",
  },
  {
    key: "price",
    title: "Price",
    align: "right",
  },
];

const largeInventory = Array.from(
  {
    length: 5000,
  },
  (_, index) => ({
    id: index + 1,
    name: `Row ${index + 1}`,
    category: categories[index % categories.length],
    stock: index * 37 % 100,
    price: `$${(9 + index % 200 * 1.5).toFixed(2)}`,
  }),
);

const largeColumns = [
  {
    key: "name",
    title: "Name",
    width: "1.4fr",
  },
  {
    key: "category",
    title: "Category",
  },
  {
    key: "stock",
    title: "Stock",
    align: "right",
    render: (row) => html`
      <span class="stock-render">${row.stock} units</span>
    `,
  },
  {
    key: "price",
    title: "Price",
    align: "right",
    width: "6rem",
  },
];

const pageSize = 5;

const snippet = `<Table
  caption="Inventory"
  columns=\${inventoryColumns}
  rows=\${inventory.slice((inventoryPage - 1) * pageSize, inventoryPage * pageSize)}
/>
<Pagination
  label="Inventory pages"
  page=\${inventoryPage}
  pages=\${Math.ceil(inventory.length / pageSize)}
  onChange=\${(inventoryPage) => setState({ inventoryPage })}
/>

<Table
  caption="Virtualized rows"
  height=\${320}
  rowHeight=\${40}
  columns=\${largeColumns}
  rows=\${largeInventory}
/>`;

class DocsUiData extends Component {

  constructor() {
    super();
    this.state = {
      inventoryPage: 1,
      largePage: 10,
    };
  }

  render() {
    return html`
      <section style=${sectionStyle}>
        <h2>Data display</h2>
        <Table
          caption="Inventory"
          columns=${inventoryColumns}
          rows=${inventory.slice(
            (this.state.inventoryPage - 1) * pageSize,
            this.state.inventoryPage * pageSize,
          )}
        />
        <Pagination
          label="Inventory pages"
          page=${this.state.inventoryPage}
          pages=${Math.ceil(inventory.length / pageSize)}
          onChange=${(inventoryPage) => this.setState(
            {
              inventoryPage,
            },
          )}
        />
        <Pagination
          label="Large page range"
          page=${this.state.largePage}
          pages=${20}
          onChange=${(largePage) => this.setState(
            {
              largePage,
            },
          )}
        />
        <h3>Virtualized</h3>
        <p
          style=${{
            color: "var(--janus-text-muted)",
            marginTop: "0",
          }}
        >Only the visible rows (plus overscan) are in the DOM. Scroll the 5 000-row table below.</p>
        <Table
          class="large-inventory"
          caption="Virtualized rows"
          height=${320}
          rowHeight=${40}
          columns=${largeColumns}
          rows=${largeInventory}
        />
        ${example(snippet)}
        ${propsTable(
          [
            {
              name: "Table",
              rows: [
                ...kitPropRows,
                [
                  "columns",
                  "Column[]",
                  "`key`, `title`, optional `align` / `width` / `render`.",
                ],
                [
                  "rows",
                  "object[]",
                  "Row data.",
                ],
                [
                  "caption",
                  "string",
                  "Accessible caption.",
                ],
                [
                  "height",
                  "number | string",
                  "Viewport height for virtualization.",
                ],
                [
                  "rowHeight",
                  "number",
                  "Fixed row height in px.",
                ],
                [
                  "overscan",
                  "number",
                  "Extra rows rendered outside the viewport.",
                ],
              ],
            },
            {
              name: "Pagination",
              rows: [
                ...kitPropRows,
                [
                  "page",
                  "number",
                  "Current 1-based page.",
                ],
                [
                  "pageCount",
                  "number",
                  "Total pages.",
                ],
                [
                  "onChange",
                  "(page) => void",
                  "Selected page.",
                ],
              ],
            },
          ],
        )}
      </section>
    `;
  }
}

Component.register(DocsUiData);
