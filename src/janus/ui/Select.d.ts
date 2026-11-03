import type {
  KitProps,
} from "./props.d.ts";
import type {
  IconComponent,
} from "./icon.d.ts";

export type SelectOption = {
  value: string;
  name: string;
  disabled?: boolean;
};

export type SelectGroup = {
  name: string;
  options: SelectOption[];
};

export type SelectOptionSource = SelectOption | SelectGroup;

export type SelectRenderOptionMeta = {
  selected: boolean;
  active: boolean;
  disabled: boolean;
};

export type SelectProps = Omit<KitProps, "onChange"> & {
  value?: string | string[];
  options?: SelectOptionSource[];
  placeholder?: string;
  searchable?: boolean;
  headIcon?: IconComponent | null;
  tailIcon?: IconComponent | null;
  clearable?: boolean;
  multi?: boolean;
  creatable?: boolean;
  formatCreateLabel?: (input: string) => string;
  noOptionsMessage?: string;
  loadOptions?: (input: string) => Promise<SelectOptionSource[]> | SelectOptionSource[];
  defaultOptions?: boolean | SelectOptionSource[];
  cacheOptions?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  renderOption?: (option: SelectOption, meta: SelectRenderOptionMeta) => unknown;
  renderValue?: (option: SelectOption) => unknown;
  onChange?: (value: string | string[] | undefined) => void;
  onCreateOption?: (input: string) => void;
};

export {};
