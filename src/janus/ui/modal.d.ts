import type {
  JanusStyle,
  JanusTemplateResult,
} from "../index.js";

export type ModalOptions = {
  callback?: (...args: unknown[]) => void;
  title?: string;
  color?: string;
  message?: string;
  backdropStyle?: JanusStyle;
  escapable?: boolean;
};

declare const modal: {
  closeModal(callback?: () => void): void;
  confirm(message: unknown, options?: ModalOptions): void;
  alert(message: unknown, options?: ModalOptions): void;
  input(message: unknown, options?: ModalOptions): void;
  dialog(components: JanusTemplateResult, options?: ModalOptions): void;
};

export default modal;
