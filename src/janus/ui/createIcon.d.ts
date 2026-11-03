export function instantiateIcon(Icon: new () => HTMLElement, props?: Record<string, unknown>): HTMLElement | "";

export function animatedIconSlot(Icon: new () => HTMLElement, options?: {
  size?: number;
  animated?: boolean;
  style?: Record<string, unknown>;
}): unknown;

export function iconHoverHandlers(component: {
  state: Record<string, unknown>;
  setState(newState: Record<string, unknown>): void;
}, options?: {
  disabled?: boolean;
  stateKey?: string;
}): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

declare function createIcon(className: string, fileBase: string): new () => HTMLElement;

export default createIcon;
