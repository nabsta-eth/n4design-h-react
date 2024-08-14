import { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { DisplayOptions, SelectOption } from "../types/select";

export const onSelectDropdownKeyDownInternal = <T>(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  displayOptions: DisplayOptions<T>,
  selected: SelectOption<T> | undefined,
  searchRef: RefObject<HTMLInputElement>,
) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  event.preventDefault();
  const focussedOption =
    displayOptions.findIndex(
      option => document.activeElement === option.ref?.current,
    ) || 0;

  const upOrDownBy = event.key === "ArrowDown" ? 1 : -1;
  let newIx = focussedOption + upOrDownBy;
  if (
    newIx < 0 ||
    (newIx === 0 &&
      event.key === "ArrowUp" &&
      selected?.label === displayOptions[0].label)
  ) {
    return searchRef.current?.focus();
  }

  if (newIx > displayOptions.length - 1) {
    newIx = displayOptions.length - 1;
  } else if (selected?.label === displayOptions[newIx].label) {
    newIx = newIx + upOrDownBy;
  }

  displayOptions[newIx].ref?.current?.focus();
};
