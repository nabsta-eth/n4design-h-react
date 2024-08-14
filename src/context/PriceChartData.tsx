import * as React from "react";
import { Network, PricePoint } from "handle-sdk";
import { getPriceDataOverTime } from "../utils/convert";
import { useToken } from "./TokenManager";
import { retryNetworkRequest } from "../utils/retry-network-request";

export type PriceProviders = "coingecko" | "twelvedata" | "handle";
export type TokenPairPriceData = {
  data: PricePoint[];
  providers: PriceProviders[];
};
export type MultiTokenPriceData = {
  [key: string]: TokenPairPriceData;
};
export type PriceChartData = {
  providerData: MultiTokenPriceData | undefined;
  setProviderData: (providerData: MultiTokenPriceData) => void;
};

export const PriceChartDataContext = React.createContext<
  PriceChartData | undefined
>(undefined);

export const PriceChartDataProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [providerData, setProviderData] = React.useState<MultiTokenPriceData>();

  const value = React.useMemo(
    () => ({
      providerData,
      setProviderData,
    }),
    [providerData, setProviderData],
  );

  return (
    <PriceChartDataContext.Provider value={value}>
      {props.children}
    </PriceChartDataContext.Provider>
  );
};

export const usePriceChartDataStore = () => {
  const context = React.useContext(PriceChartDataContext);

  if (context === undefined) {
    throw new Error(
      "usePriceChartDataStore must be used within a PriceChartDataProvider",
    );
  }
  return context;
};

const DEFAULT_PROVIDER_DATA = {
  data: [],
  providers: [],
};

export const usePriceChartData = (
  fromTokenSymbol: string,
  toTokenSymbol: string,
  network: Network,
  period?: number,
): {
  providerPriceDataKey: string;
  providerPriceData: TokenPairPriceData;
  isLoading: boolean;
  fetchPriceData: () => void;
  hoverPrice: number;
  setHoverPrice: (price: number) => void;
} => {
  const { providerData, setProviderData } = usePriceChartDataStore();
  const fromToken = useToken(fromTokenSymbol, network);
  const toToken = useToken(toTokenSymbol, network);
  const providerPriceDataKey = `${fromTokenSymbol}-${toTokenSymbol}`;
  const [isLoading, setIsLoading] = React.useState(true);
  const [hoverPrice, setHoverPrice] = React.useState(0);

  const providerPriceData =
    usePriceChartDataStore().providerData?.[providerPriceDataKey] ??
    DEFAULT_PROVIDER_DATA;

  const fetchPriceData = React.useCallback(async () => {
    if (!fromToken || !toToken) {
      return;
    }

    try {
      setIsLoading(true);
      const newPriceData = await retryNetworkRequest(() =>
        getPriceDataOverTime(fromToken, toToken, network, period ?? 1),
      );
      const newProviderData = { ...providerData };
      newProviderData[providerPriceDataKey] =
        newPriceData ?? DEFAULT_PROVIDER_DATA;
      setProviderData(newProviderData);
      setHoverPrice(
        newPriceData
          ? newPriceData.data[newPriceData.data.length - 1].price
          : 0,
      );
    } finally {
      setIsLoading(false);
    }
  }, [network, fromToken, toToken, period]);

  React.useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  return {
    providerPriceDataKey,
    providerPriceData,
    isLoading: isLoading,
    fetchPriceData,
    hoverPrice,
    setHoverPrice,
  };
};
