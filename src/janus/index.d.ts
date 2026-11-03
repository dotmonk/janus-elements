export type JanusStyle = string | {
  [property: string]: string | number | JanusStyle | undefined;
};

export type JanusProps = Record<string, unknown> & {
  style?: JanusStyle;
  key?: string | number;
};

export type JanusTemplateResult =
  | Node
  | Node[]
  | DocumentFragment
  | string
  | number
  | null
  | undefined
  | boolean
  | JanusTemplateResult[];

declare class Component extends HTMLElement {

  state: Record<string, unknown>;
  props?: JanusProps;
  childElements?: Node[];

  setState(newState: Record<string, unknown>): void;

  receiveProps(props: JanusProps, childElements: Node[]): void;

  render(): JanusTemplateResult;

  renderWithStyle(): JanusTemplateResult;

  componentWillMount?(): void;

  componentDidMount?(): void;

  componentWillUnmount?(): void;

  componentWillReceiveProps?(props: JanusProps | undefined, state: Record<string, unknown>): void;

  static register(classInstance: CustomElementConstructor): void;
}

export declare function html(strings: TemplateStringsArray, ...values: unknown[]): JanusTemplateResult;

export declare function render(container: ParentNode, elements: JanusTemplateResult): void;

export declare function camelToKebab(name: string): string;

export {
  Component,
};
export default Component;
