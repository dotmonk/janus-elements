import type {
  KitProps,
} from "./props.d.ts";

export type AccordionItem = {
  id?: string | number;
  key?: string | number;
  title: string;
  content?: unknown;
};

export type AccordionProps = KitProps & {
  items: AccordionItem[];
};

export {};
