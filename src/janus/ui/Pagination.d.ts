import type {
  KitProps,
} from "./props.d.ts";

export type PaginationProps = KitProps & {
  page: number;
  pages: number;
  label?: string;
};

export {};
