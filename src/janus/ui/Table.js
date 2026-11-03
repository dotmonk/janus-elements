import Component, {
  html,
} from "../index.js";

import theme from "./theme.js";

const DEFAULT_HEIGHT = 320;
const DEFAULT_ROW_HEIGHT = 40;
const DEFAULT_OVERSCAN = 5;

export const visibleRange = (scrollTop, clientHeight, rowHeight, rowCount, overscan = DEFAULT_OVERSCAN) => {
  if (
    rowCount <= 0 ||
    rowHeight <= 0
  ) {
    return {
      start: 0,
      end: 0,
    };
  }
  const start = Math.max(
    0,
    Math.floor(scrollTop / rowHeight) - overscan,
  );
  const end = Math.min(
    rowCount,
    Math.ceil((scrollTop + Math.max(
      clientHeight,
      rowHeight,
    )) / rowHeight) + overscan,
  );
  return {
    start,
    end,
  };
};

const cssSize = (value, fallback) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }
  return typeof value === "number"
    ? `${value}px`
    : String(value);
};

const numericSize = (value, fallback) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const gridTemplate = (columns) => columns.map(
  (column) => column.width || "minmax(0, 1fr)",
).join(" ");

const cellContent = (column, row) => {
  if (typeof column.render === "function") {
    return column.render(row);
  }
  return row[column.key];
};

const rowGridStyle = (columns, extras = {}) => ({
  display: "grid",
  gridTemplateColumns: gridTemplate(columns),
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  ...extras,
});

const cellStyle = (column) => ({
  padding: "0 14px",
  textAlign: column.align || "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: "0",
});

class Table extends Component {

  constructor() {
    super();
    this.state = {
      scrollTop: 0,
      clientHeight: 0,
    };
    this._onScroll = (event) => {
      const viewport = event.target;
      const header = this.querySelector("[data-janus-table-header]");
      if (header) {
        header.scrollLeft = viewport.scrollLeft;
      }
      const scrollTop = viewport.scrollTop;
      if (scrollTop === this.state.scrollTop) {
        return;
      }
      if (this._scrollFrame) {
        cancelAnimationFrame(this._scrollFrame);
      }
      this._scrollFrame = requestAnimationFrame(
        () => {
          this._scrollFrame = 0;
          this.setState(
            {
              scrollTop: viewport.scrollTop,
            },
          );
        },
      );
    };
  }

  measureViewport() {
    const viewport = this.querySelector("[data-janus-table-viewport]");
    if (!viewport) {
      return;
    }
    const clientHeight = viewport.clientHeight;
    if (clientHeight !== this.state.clientHeight) {
      this.setState(
        {
          clientHeight,
        },
      );
    }
  }

  componentDidMount() {
    this.measureViewport();
    const viewport = this.querySelector("[data-janus-table-viewport]");
    if (
      viewport &&
      typeof ResizeObserver !== "undefined"
    ) {
      this._resizeObserver = new ResizeObserver(
        () => this.measureViewport(),
      );
      this._resizeObserver.observe(viewport);
    }
  }

  componentWillUnmount() {
    if (this._scrollFrame) {
      cancelAnimationFrame(this._scrollFrame);
      this._scrollFrame = 0;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  componentWillReceiveProps() {
    queueMicrotask(
      () => this.measureViewport(),
    );
  }

  render() {
    const {
      columns = [],
      rows = [],
      caption,
      height = DEFAULT_HEIGHT,
      rowHeight = DEFAULT_ROW_HEIGHT,
      overscan = DEFAULT_OVERSCAN,
    } = this.props || {};

    const rowPx = numericSize(
      rowHeight,
      DEFAULT_ROW_HEIGHT,
    );
    const viewportPx = numericSize(
      height,
      DEFAULT_HEIGHT,
    );
    const clientHeight = this.state.clientHeight || viewportPx;
    const {
      start,
      end,
    } = visibleRange(
      this.state.scrollTop,
      clientHeight,
      rowPx,
      rows.length,
      numericSize(
        overscan,
        DEFAULT_OVERSCAN,
      ),
    );
    const slice = rows.slice(
      start,
      end,
    );
    const bodyHeight = rows.length * rowPx;

    return html`
      <div
        role="table"
        aria-label=${caption || undefined}
        aria-rowcount=${rows.length + 1}
        style=${{
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--janus-border)",
          borderRadius: "var(--janus-radius)",
          color: "var(--janus-text)",
          fontSize: "0.9375rem",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: cssSize(
            height,
            `${DEFAULT_HEIGHT}px`,
          ),
        }}
      >
        ${caption
          ? html`
              <div
                style=${{
                  flex: "0 0 auto",
                  textAlign: "left",
                  padding: "10px 14px",
                  fontWeight: "600",
                  borderBottom: "1px solid var(--janus-border)",
                  backgroundColor: "var(--janus-surface)",
                }}
              >${caption}</div>
            `
          : ""}
        <div
          data-janus-table-header
          style=${{
            flex: "0 0 auto",
            overflow: "hidden",
            borderBottom: "1px solid var(--janus-border)",
            backgroundColor: "var(--janus-raised)",
          }}
        >
          <div
            role="row"
            aria-rowindex=${1}
            style=${rowGridStyle(
              columns,
              {
                height: `${rowPx}px`,
                color: "var(--janus-text-muted)",
                fontSize: "0.8125rem",
                fontWeight: "600",
              },
            )}
          >${columns.map(
              (column) => html`
                <div
                  role="columnheader"
                  style=${cellStyle(column)}
                >${column.title}</div>
              `,
            )}</div>
        </div>
        <div
          data-janus-table-viewport
          onScroll=${this._onScroll}
          style=${{
            flex: "1 1 auto",
            overflow: "auto",
            minHeight: "0",
            position: "relative",
          }}
        >
          <div
            style=${{
              position: "relative",
              height: `${bodyHeight}px`,
            }}
          >${slice.map(
              (row, offset) => {
                const index = start + offset;
                const even = index % 2 === 1;
                return html`
                  <div
                    key=${row.id ?? index}
                    role="row"
                    aria-rowindex=${index + 2}
                    style=${rowGridStyle(
                      columns,
                      {
                        position: "absolute",
                        top: `${index * rowPx}px`,
                        left: "0",
                        right: "0",
                        height: `${rowPx}px`,
                        borderBottom: "1px solid var(--janus-border)",
                        backgroundColor: even
                          ? theme.mix(
                              "var(--janus-text)",
                              4,
                            )
                          : "transparent",
                        ":hover": {
                          backgroundColor: theme.mix(
                            "var(--janus-text)",
                            8,
                          ),
                        },
                      },
                    )}
                  >${columns.map(
                      (column) => html`
                        <div
                          role="cell"
                          style=${cellStyle(column)}
                        >${cellContent(
                            column,
                            row,
                          )}</div>
                      `,
                    )}</div>
                `;
              },
            )}</div>
        </div>
      </div>
    `;
  }
}

Component.register(Table);
