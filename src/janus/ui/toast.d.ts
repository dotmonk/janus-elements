export type ToastOptions = {
  color?: string;
  duration?: number;
};

declare const toast: {
  show(message: unknown, options?: ToastOptions): () => void;
};

export default toast;
