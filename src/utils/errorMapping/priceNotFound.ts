import { AxiosError } from "axios";
import { AxiosErrorMap } from ".";

export const priceNotFound: AxiosErrorMap = (
  error: AxiosError,
): string | undefined => {
  if (
    error.response?.status === 404 &&
    error.config?.url?.includes("oracle.handle.fi")
  ) {
    // url should be https://oracle.handle.fi/XXX/USD. This splits by the host,
    // then removes the first /. This should leave us with XXX/USD
    const pair: string | undefined = error.config.url
      .split("oracle.handle.fi")?.[1]
      ?.slice(1);
    if (pair) {
      return `price not found for ${pair}`;
    }
    console.warn(`Could not parse pair from ${error.config.url}`);
    return `price not found`;
  }
};
