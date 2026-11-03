const body = document.querySelector("body");

const message = (html, color) => {
  const p = document.createElement("p");
  p.style = `color: ${color};`;
  const textarea = document.createElement("textarea");
  textarea.setAttribute(
    "readonly",
    "",
  );
  textarea.innerHTML = html;
  p.appendChild(textarea);
  body.appendChild(p);
};

const counts = {
  error: 0,
  success: 0,
  warning: 0,
};

export const error = (html) => {
  message(
    html,
    "red",
  );
  counts.error += 1;
};

export const success = (html) => {
  message(
    html,
    "Chartreuse",
  );
  counts.success += 1;
};

export const title = (html) => {
  const p = document.createElement("h3");
  p.innerHTML = html;
  body.appendChild(p);
};

export const summary = () => {
  const p = document.createElement("p");
  p.style = "border-top: solid 1px white; margin-top: 10px; text-align: right";
  const successP = `<span style="color: Chartreuse">Success: ${counts.success}</span>`;
  const errorP = `<span style="color: red">Error: ${counts.error}</span>`;
  const totalP = `<span style="color: white; font-weight: bold;">Total: ${counts.error + counts.success}</span>`;

  p.innerHTML = `${successP} ${errorP} ${totalP}`;
  body.appendChild(p);
};
