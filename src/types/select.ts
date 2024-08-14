import { IconName } from "@fortawesome/fontawesome-common-types";
import { RefObject } from "react";

export type SelectIcon =
  | {
      type: "icon";
      value: IconName;
    }
  | {
      type: "image";
      value: string;
    }
  | {
      type: "spritesheet";
      value: string;
    };

export type SelectOption<T> = {
  item: T;
  label?: string;
  icon?: SelectIcon;
  rightLabel?: string;
  hidden?: boolean;
  disabled?: boolean;
};

export type DisplayOption<T> = SelectOption<T> & {
  ref?: RefObject<HTMLButtonElement>;
};
export type DisplayOptions<T> = DisplayOption<T>[];
