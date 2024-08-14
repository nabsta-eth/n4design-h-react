import { Network, NETWORK_NAMES } from "handle-sdk";
import React from "react";
import { useSearchParams } from "react-router-dom";

type ConvertQuery = "fromToken" | "toToken" | "network";

export const useConvertQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const fromToken = searchParams.get("fromToken");
  const toToken = searchParams.get("toToken");
  let network = searchParams.get("network");

  // typecast as .includes requires network (string) to be same type as elements in
  // NETWORK_NAMES (Network[]).
  if (network && !(NETWORK_NAMES as string[]).includes(network)) network = null;

  const removeQuery = React.useCallback((q: ConvertQuery) => {
    setSearchParams(searchParams => {
      searchParams.delete(q);
      return searchParams;
    });
  }, []);

  return React.useMemo(
    () => ({
      fromToken,
      toToken,
      network: network as Network,
      removeQuery,
    }),
    [fromToken, toToken, network],
  );
};
