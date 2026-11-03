import {
  render,
} from "../index.js";

export const PICKER_Z_INDEX = "10000";
export const PICKER_GAP = 4;
const ROOT_ID = "janus-ui-picker-popup";

let openOwner = null;

export const ensurePickerRoot = () => {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
};

export const removePickerRootIfEmpty = () => {
  const root = document.getElementById(ROOT_ID);
  if (
    root &&
    !root.childElementCount
  ) {
    root.remove();
  }
};

export const claimPicker = (owner) => {
  if (
    openOwner &&
    openOwner !== owner &&
    openOwner.collapse
  ) {
    openOwner.collapse();
  }
  openOwner = owner;
};

export const releasePicker = (owner) => {
  if (openOwner === owner) {
    openOwner = null;
  }
};

export const isPickerOwner = (owner) => openOwner === owner;

export const clearPickerContent = () => {
  const root = document.getElementById(ROOT_ID);
  if (root) {
    render(
      root,
      [],
    );
    removePickerRootIfEmpty();
  }
};

export const renderPicker = (content) => {
  const root = ensurePickerRoot();
  render(
    root,
    content,
  );
  return root;
};

export const positionPicker = (anchorRect, root) => {
  if (
    !anchorRect ||
    !root
  ) {
    return;
  }
  const menuHeight = Math.min(
    root.scrollHeight > 0
      ? root.scrollHeight
      : 48,
    Math.floor(window.innerHeight * 0.85),
  );
  const roomBelow = window.innerHeight - anchorRect.bottom - PICKER_GAP;
  const roomAbove = anchorRect.top - PICKER_GAP;
  const openUpwards = roomBelow < menuHeight && roomAbove > roomBelow;
  Object.assign(
    root.style,
    {
      position: "fixed",
      left: `${Math.max(8, anchorRect.left)}px`,
      minWidth: `${Math.max(anchorRect.width, 280)}px`,
      width: "max-content",
      zIndex: PICKER_Z_INDEX,
      top: openUpwards
        ? "auto"
        : `${anchorRect.bottom + PICKER_GAP}px`,
      bottom: openUpwards
        ? `${window.innerHeight - anchorRect.top + PICKER_GAP}px`
        : "auto",
    },
  );
};

export const popupShellStyle = {
  margin: "0",
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  backgroundColor: "var(--janus-raised)",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--janus-border)",
  borderRadius: "var(--janus-radius)",
  boxShadow: "var(--janus-shadow)",
  boxSizing: "border-box",
  color: "var(--janus-text)",
  font: "inherit",
};
