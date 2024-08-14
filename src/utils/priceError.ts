// TODO get rid of this (prices should never throw)
export const catchPriceError = <T extends {}>(fn: () => T): Partial<T> => {
  try {
    return fn();
  } catch (e: any) {
    if (typeof e?.message === "string") {
      if (e.message === "price error" || e.message.includes("no price")) {
        return {};
      }
    }
    throw e;
  }
};

export const convertPartial = <T extends {}>(
  value: T | undefined,
): Partial<T> => {
  return value ?? {};
};
