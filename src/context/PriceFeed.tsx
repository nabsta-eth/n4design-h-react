import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  DATA_FEED_API_WS_URL_QUOTES,
  DATA_FEED_API_WS_URL_QUOTES_STAGING,
} from "handle-sdk/dist/config";
import { Options, PriceFeed } from "handle-sdk/dist/components/h2so/feed";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";

const priceNetworks = ["arbitrum", "arbitrum-sepolia"] as const;

type PriceNetwork = (typeof priceNetworks)[number];

const PRICE_FEED_OPTIONS: Options = {
  connect: true,
  autoReconnect: true,
  websocketUrl: DATA_FEED_API_WS_URL_QUOTES,
};

export type PricesValue = {
  priceFeed: PriceFeed;
};

const PricesContext = React.createContext<PricesValue | null>(null);

type PriceFeedRef = {
  value: PriceFeed;
  network: PriceNetwork;
};

export let priceFeedRef: PriceFeedRef = {
  value: new PriceFeed(PRICE_FEED_OPTIONS),
  network: "arbitrum",
};

export const PriceFeedProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const network = useConnectedNetwork();
  const [priceFeed, setPriceFeed] = useState<PriceFeed>(priceFeedRef.value);
  const [priceNetwork, setPriceNetwork] = useState<PriceNetwork>(
    priceFeedRef.network,
  );
  const [connectionCount, setConnectionCount] = useState(0);
  const [didDisconnect, setDidDisconnect] = useState(false);
  const disconnectNotificationRef = useRef<{ close: () => void }>();
  useEffect(() => {
    const index = priceNetworks.indexOf(network as PriceNetwork);
    setPriceNetwork(priceNetworks[index] ?? "arbitrum");
  }, [network]);
  useEffect(() => {
    if (priceNetwork === priceFeedRef.network) {
      // Nil action.
      return;
    }
    switch (priceNetwork) {
      case "arbitrum":
        priceFeedRef.value.setOptions({
          ...PRICE_FEED_OPTIONS,
          websocketUrl: DATA_FEED_API_WS_URL_QUOTES,
          onConnect: () => setConnectionCount(v => v + 1),
          onClose: () => setDidDisconnect(true),
        });
        priceFeedRef.value.connectPersisting().catch(console.error);
        priceFeedRef.network = "arbitrum";
        setPriceFeed(priceFeedRef.value);
        break;
      case "arbitrum-sepolia":
        priceFeedRef.value.setOptions({
          ...PRICE_FEED_OPTIONS,
          websocketUrl: DATA_FEED_API_WS_URL_QUOTES_STAGING,
          onConnect: () => setConnectionCount(v => v + 1),
          onClose: () => setDidDisconnect(true),
        });
        priceFeedRef.value.connectPersisting().catch(console.error);
        priceFeedRef.network = "arbitrum-sepolia";
        setPriceFeed(priceFeedRef.value);
        break;
    }
  }, [priceNetwork]);
  useEffect(() => {
    if (didDisconnect) {
      disconnectNotificationRef.current = showNotification({
        status: "error",
        message:
          "disconnected from H2SO price feed. attempting to reconnect...",
        timeoutInSeconds: 0,
      });
    } else if (disconnectNotificationRef.current) {
      disconnectNotificationRef.current.close();
      showNotification({
        status: "success",
        message: "re-connected to H2SO price feed",
      });
    }
  }, [didDisconnect]);
  useEffect(() => {
    setDidDisconnect(false);
  }, [connectionCount]);

  const value = React.useMemo(() => {
    return {
      priceFeed,
    };
  }, [priceFeed, connectionCount]);

  return (
    <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
  );
};

export const usePriceFeed = () => {
  const context = React.useContext(PricesContext);
  if (!context) {
    throw new Error("usePriceFeed must be used within a PriceFeedProvider");
  }
  return context;
};
