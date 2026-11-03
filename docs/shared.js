import {
  html,
} from "janus-elements";

import "./CodeSnippet.js";

export const sectionStyle = {
  marginBottom: "28px",
  maxWidth: "72ch",
};

export const rowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px",
};

export const capitalize = (word) => word[0].toUpperCase() + word.slice(1);

export const tones = [
  "standard",
  "accent",
  "success",
  "warning",
  "error",
  "info",
];

export const example = (code) => html`
  <CodeSnippet
    language="markup"
    code=${code}
  />
`;

const propsTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.875rem",
  marginTop: "8px",
  marginBottom: "20px",
};

const propsCellStyle = {
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "var(--janus-border)",
  padding: "6px 8px",
  textAlign: "left",
  verticalAlign: "top",
};

const propsHeadStyle = {
  ...propsCellStyle,
  color: "var(--janus-text-muted)",
  fontWeight: "600",
};

/**
 * Props documentation table. `rows` is `[prop, type, description][]`.
 * Pass a component name heading, or an array of `{ name, rows }` for several.
 */
export const propsTable = (headingOrGroups, maybeRows) => {
  const groups = Array.isArray(headingOrGroups)
    ? headingOrGroups
    : [
        {
          name: headingOrGroups,
          rows: maybeRows,
        },
      ];

  return html`
    <div class="docs-props">
      <h3>Props</h3>
      ${groups.map(
        ({
          name,
          rows,
        }) => html`
          <h4
            style=${{
              marginBottom: "4px",
            }}
          >${name}</h4>
          <table style=${propsTableStyle}>
            <thead>
              <tr>
                <th style=${propsHeadStyle}>Prop</th>
                <th style=${propsHeadStyle}>Type</th>
                <th style=${propsHeadStyle}>Description</th>
              </tr>
            </thead>
            <tbody>${rows.map(
                ([
                  prop,
                  type,
                  description,
                ]) => html`
                  <tr>
                    <td style=${propsCellStyle}>
                      <code>${prop}</code>
                    </td>
                    <td style=${propsCellStyle}>
                      <code>${type}</code>
                    </td>
                    <td style=${propsCellStyle}>${description}</td>
                  </tr>
                `,
              )}</tbody>
          </table>
        `,
      )}
    </div>
  `;
};

export const kitPropRows = [
  [
    "color",
    "string",
    "Tone or CSS color for the control.",
  ],
  [
    "disabled",
    "boolean",
    "Disables interaction.",
  ],
  [
    "style",
    "object",
    "Styles the component root.",
  ],
  [
    "class / className",
    "string",
    "Extra class on the host.",
  ],
  [
    "id",
    "string",
    "Host id.",
  ],
  [
    "title",
    "string",
    "Native title tooltip.",
  ],
];
