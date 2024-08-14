type Options = {
  suffix?: string;
};

export const oldToNew = (
  old: string | undefined,
  newValue: string | undefined,
  { suffix }: Options = {},
) => {
  if (old === undefined) return valueToDisplay(newValue!, suffix);
  if (newValue === undefined) return valueToDisplay(old, suffix);
  if (stripSuffix(old, suffix) === stripSuffix(newValue, suffix))
    return valueToDisplay(old, suffix);
  return valueToDisplay(
    `${stripSuffix(old, suffix)} => ${stripSuffix(newValue, suffix)}`,
    suffix,
  );
};

const stripSuffix = (value: string, suffix: string | undefined) => {
  if (suffix === undefined) return value;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
};

const valueToDisplay = (value: string, suffix?: string) =>
  `${value}${suffix ?? ""}`;
