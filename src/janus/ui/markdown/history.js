const LIMIT = 100;
const TYPING_PAUSE_MS = 1000;

/** Undo/redo steps of editor states (`{ markdown, selection }`); a typing burst is one step. */
export class EditHistory {

  constructor(state = null) {
    this.reset(state);
  }

  reset(state) {
    this.undoStack = [];
    this.redoStack = [];
    this.current = state;
    this.typingAt = null;
  }

  /** Record the state after a change. */
  record(state, {
    typing = false,
    now = Date.now(),
  } = {}) {
    if (
      !this.current ||
      state.markdown === this.current.markdown
    ) {
      this.current = state;
      return;
    }
    const continuesBurst = typing && this.typingAt != null && now - this.typingAt < TYPING_PAUSE_MS;
    if (!continuesBurst) {
      this.undoStack.push(this.current);
      if (this.undoStack.length > LIMIT) {
        this.undoStack.shift();
      }
    }
    this.redoStack = [];
    this.current = state;
    this.typingAt = typing
      ? now
      : null;
  }

  /** Keep the caret of the current state up to date between changes. */
  updateSelection(selection) {
    if (this.current) {
      this.current = {
        ...this.current,
        selection,
      };
    }
  }

  undo() {
    return this.step(
      this.undoStack,
      this.redoStack,
    );
  }

  redo() {
    return this.step(
      this.redoStack,
      this.undoStack,
    );
  }

  step(from, to) {
    if (!from.length) {
      return null;
    }
    to.push(this.current);
    this.current = from.pop();
    this.typingAt = null;
    return this.current;
  }
}
