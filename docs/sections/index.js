import {
  html,
} from "janus-elements";

import "./about.js";
import "./basics.js";
import "./helpers.js";
import "./tooling.js";
import "./examples.js";
import "./routing.js";
import "./uiGeneral.js?v=4";
import "./uiCustomTheme.js";
import "./uiButtons.js";
import "./uiBadges.js";
import "./uiInputs.js";
import "./uiCodeEditor.js";
import "./uiRichTextarea.js";
import "./uiDateTime.js";
import "./uiFormControls.js";
import "./uiFeedback.js";
import "./uiNavigationLayout.js";
import "./uiData.js";
import "./uiSelect.js";
import "./uiPanels.js";
import "./uiSpinners.js";
import "./uiIcons.js";
import "./uiTooltip.js";
import "./uiModals.js";

import {
  DEFAULT_HASH,
  normalizeDocsHash,
} from "../nav.js";

const pages = {
  "/about": () => html`
    <DocsAbout />
  `,
  "/basics": () => html`
    <DocsBasics />
  `,
  "/helpers": () => html`
    <DocsHelpers />
  `,
  "/tooling": () => html`
    <DocsTooling />
  `,
  "/examples": () => html`
    <DocsExamples />
  `,
  "/routing": () => html`
    <DocsRouting />
  `,
  "/ui/general": () => html`
    <DocsUiGeneral />
  `,
  "/ui/custom-theme": () => html`
    <DocsUiCustomTheme />
  `,
  "/ui/buttons": () => html`
    <DocsUiButtons />
  `,
  "/ui/badges": () => html`
    <DocsUiBadges />
  `,
  "/ui/inputs": () => html`
    <DocsUiInputs />
  `,
  "/ui/code-editor": () => html`
    <DocsUiCodeEditor />
  `,
  "/ui/rich-textarea": () => html`
    <DocsUiRichTextarea />
  `,
  "/ui/date-time": () => html`
    <DocsUiDateTime />
  `,
  "/ui/form-controls": () => html`
    <DocsUiFormControls />
  `,
  "/ui/feedback": () => html`
    <DocsUiFeedback />
  `,
  "/ui/navigation-layout": () => html`
    <DocsUiNavigationLayout />
  `,
  "/ui/data": () => html`
    <DocsUiData />
  `,
  "/ui/select": () => html`
    <DocsUiSelect />
  `,
  "/ui/panels": () => html`
    <DocsUiPanels />
  `,
  "/ui/spinners": () => html`
    <DocsUiSpinners />
  `,
  "/ui/icons": () => html`
    <DocsUiIcons />
  `,
  "/ui/tooltip": () => html`
    <DocsUiTooltip />
  `,
  "/ui/modals": () => html`
    <DocsUiModals />
  `,
};

export const sectionForHash = (hashPath) => {
  const hash = normalizeDocsHash(hashPath);
  const page = pages[hash] || pages[DEFAULT_HASH];
  return page();
};
