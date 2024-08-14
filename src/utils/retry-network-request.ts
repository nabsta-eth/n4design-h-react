import axios from "axios";

const DEFAULT_OPTIONS = {
  maxRetries: 5,
  delay: 500,
  debug: false,
};

export const retryNetworkRequest = async <T>(
  f: () => Promise<T>,
  options?: Partial<typeof DEFAULT_OPTIONS>,
) => {
  let retries = 0;
  const internalOptions = {
    ...options,
    ...DEFAULT_OPTIONS,
  };
  while (retries <= internalOptions.maxRetries) {
    try {
      const data = await f();
      return data;
    } catch (e) {
      if (!axios.isAxiosError(e) || retries == internalOptions.maxRetries) {
        throw e;
      }
      if (e.code != "429") {
        throw e;
      }
      retries += 1;
      await new Promise<void>(r => setTimeout(r, internalOptions.delay));
    }
  }
  throw new Error("Maximum retries reached for network request");
};
