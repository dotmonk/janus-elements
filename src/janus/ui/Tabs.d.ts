import type {
  KitProps,
} from "./props.d.ts";

export type TabItem = {
  title: string;
  content?: unknown;
};

export type TabsProps = KitProps & {
  tabs: TabItem[];
};

export {};
