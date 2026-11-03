import Component, {
  html,
} from "../index.js";

const gap = "…";

const pageItems = (page, pages) => {
  if (pages <= 7) {
    return Array.from(
      {
        length: pages,
      },
      (_, index) => index + 1,
    );
  }
  let start = Math.max(
    2,
    page - 1,
  );
  let end = Math.min(
    pages - 1,
    page + 1,
  );
  if (page <= 3) {
    end = 4;
  }
  if (page >= pages - 2) {
    start = pages - 3;
  }
  const middle = Array.from(
    {
      length: end - start + 1,
    },
    (_, index) => start + index,
  );
  return [
    1,
    ...start > 2
      ? [
          gap,
        ]
      : [],
    ...middle,
    ...end < pages - 1
      ? [
          gap,
        ]
      : [],
    pages,
  ];
};

class Pagination extends Component {

  render() {
    const {
      page,
      pages,
      onChange,
      label = "Pagination",
    } = this.props;

    return html`
      <nav
        aria-label=${label}
        style=${{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          margin: "8px 0",
        }}
      >
        <Button
          disabled=${page <= 1}
          onClick=${() => onChange(page - 1)}
        >Previous</Button>
        ${pageItems(
          page,
          pages,
        ).map(
          (item, index) => item === gap
            ? html`
                <span
                  key=${`gap-${index}`}
                  aria-hidden="true"
                  style=${{
                    padding: "0 4px",
                    color: "var(--janus-text-muted)",
                  }}
                >${gap}</span>
              `
            : html`
                <Button
                  key=${item}
                  aria-label=${`Page ${item}`}
                  active=${item === page}
                  color=${item === page
                    ? "accent"
                    : undefined}
                  ${item === page
                    ? {
                        "aria-current": "page",
                      }
                    : {}}
                  onClick=${() => onChange(item)}
                >${item}</Button>
              `,
        )}
        <Button
          disabled=${page >= pages}
          onClick=${() => onChange(page + 1)}
        >Next</Button>
      </nav>
    `;
  }
}

Component.register(Pagination);
