import { ethers } from "ethers";
import { Pair, PairStringified } from "handle-sdk/dist/types/trade";
import {
  isSamePair,
  pairFromString,
  pairToString,
} from "handle-sdk/dist/utils/general";
import React, {
  createContext,
  FC,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTrade } from "./Trade";
import { getViewOnlyInstruments } from "../config/viewOnlyInstruments";
import { SubscriptionId } from "handle-sdk/dist/types/general";
import {
  MarketPriceCallback,
  PRICE_DECIMALS,
  TradeLiquidityPool,
  TradePair,
} from "handle-sdk/dist/components/trade";
import { MarketPrice } from "handle-sdk/dist/components/trade/interface";
import { formatPrice } from "../utils/trade";
import { usePricesStore } from "./Prices";
import { usePriceFeed } from "./PriceFeed";
import { PRICE_MEMO_INTERVAL_MS } from "../config/trade";

const DEBUG_PRICE_FEED = false;
export type TradePriceOracle = (pair: Pair) => MarketPrice | null;

export type TradePricesValue = {
  getPrice: TradePriceOracle;
  subscribe: (cb: MarketPriceCallback) => void;
  unsubscribe: (cb: MarketPriceCallback) => void;
  markets: Pair[];
};

type MarketSubscriptions = Record<PairStringified, boolean>;

const TradePricesContext = createContext<TradePricesValue | null>(null);

type QueuedPrice = {
  pair: Pair;
  marketPrice: MarketPrice;
  timestamp: number;
};

type PriceStore = {
  // How long a time lives for within the queue before it is discarded.
  lifetimeMs: number;
  queue: QueuedPrice[];
  cache: Record<PairStringified, MarketPrice | undefined>;
  insert(pair: Pair, value: MarketPrice): void;
  pop(): [Pair, MarketPrice][];
  get(pair: Pair): MarketPrice | undefined;
};

const newPriceStore = (lifetimeMs: number): PriceStore => ({
  lifetimeMs,
  queue: [],
  cache: {},
  insert(pair: Pair, marketPrice: MarketPrice) {
    const pairStringified = pairToString(pair);
    if (DEBUG_PRICE_FEED) {
      console.info(
        `[PriceStore] inserting price: ${pairStringified} @ ${formatPrice(
          marketPrice.index,
          2,
          pair.quoteSymbol,
          PRICE_DECIMALS,
        )}`,
      );
    }
    this.cache[pairStringified] = marketPrice;
    this.queue.push({
      pair,
      marketPrice,
      timestamp: Date.now(),
    });
  },
  pop(): [Pair, MarketPrice][] {
    const cutoff = Date.now() - this.lifetimeMs;
    const startingIndex = this.queue.findIndex(
      item => item.timestamp >= cutoff,
    );
    const items = this.queue.slice(startingIndex);
    if (DEBUG_PRICE_FEED) {
      const dropped = this.queue.length - items.length;
      console.info(
        `[PriceStore] popping ${this.queue.length}; dropped ${dropped} prices`,
      );
    }
    this.queue = [];
    return items.map(item => [item.pair, item.marketPrice]);
  },
  get(pair: Pair): MarketPrice | undefined {
    return this.cache[pairToString(pair)];
  },
});

const STORE = newPriceStore(PRICE_MEMO_INTERVAL_MS);

/**
 * A market price with the index, bid, and ask price
 * of one with precision `PRICE_DECIMALS`.
 */
const ONE_MARKET_PRICE: MarketPrice = new MarketPrice(
  ethers.utils.parseUnits("1", PRICE_DECIMALS),
  ethers.utils.parseUnits("1", PRICE_DECIMALS),
  ethers.utils.parseUnits("1", PRICE_DECIMALS),
);

/*
 * Provider for synthetic LP market prices.
 * The index price is the H2SO price for the asset, while the
 * best bid and ask prices depend on LP-specific configuration such as spread.
 * This provider should only be used for fetching trade prices,
 * for other usages the following options should be considered instead:
 * - `h2so` module of the SDK
 * - Official Chainlink oracles
 * - CoinGecko, or another external off-chain provider
 */
export const TradePricesProvider: FC<PropsWithChildren<{}>> = props => {
  const { isPriceClientLive } = usePricesStore();
  const { priceFeed } = usePriceFeed();
  const { selectedTradePairLp, protocol, instruments } = useTrade();
  const callbacks = useRef<MarketPriceCallback[]>([]);
  const [priceBatchCount, setPriceBatchCount] = useState(0);
  const [marketSubscriptions, setMarketSubscriptions] =
    useState<MarketSubscriptions>({});
  const subscribeMarket = useCallback(
    (market: Pair) =>
      setMarketSubscriptions(store => ({
        ...store,
        [pairToString(market)]: true,
      })),
    [],
  );
  const subscribe = useCallback(
    (cb: MarketPriceCallback) => {
      callbacks.current.push(cb);
    },
    [callbacks],
  );
  const unsubscribe = useCallback(
    (cb: MarketPriceCallback) => {
      callbacks.current = callbacks.current.filter(c => c !== cb);
    },
    [callbacks],
  );

  // Subscribes to all trade pairs in all pools.
  useEffect(() => {
    if (!isPriceClientLive) {
      // If the app is unfocused (prices not live),
      // no subscriptions should be live.
      return;
    }
    console.debug("[TradePrices] subscribing to market prices");
    const pools = protocol.getLiquidityPools();
    const unsubs = pools.map(pool => {
      const tradePairs = pool.getTradePairs().filter(p => p.isActive);
      const ids = tradePairs.map(tradePair => {
        subscribeMarket(tradePair.pair);
        return subscribeTradePair(tradePair, pool, callbacks);
      });
      return () => {
        console.debug("[TradePrices] unsubscribing from market prices");
        ids.forEach(id => {
          try {
            pool.unsubscribeFromMarketPrice(id);
          } catch (e) {
            console.error(e);
          }
        });
      };
    });
    return () => unsubs.forEach(f => f());
  }, [protocol, isPriceClientLive]);

  useEffect(() => {
    if (!isPriceClientLive) {
      // If the app is unfocused (prices not live),
      // no subscriptions should be live.
      return;
    }
    // Subscribe to view only assets.
    const pairs = protocol
      .getLiquidityPools()
      .flatMap(pool => pool.getTradePairs())
      .map(tradePair => tradePair.pair);
    const ids = getViewOnlyInstruments(instruments)
      .filter(p => !pairs.some(pair => isSamePair(pair, p.pair)))
      .map(viewOnlyPair => {
        return priceFeed.subscribe([viewOnlyPair.pair], (pair, price) => {
          const marketPrice = new MarketPrice(price, price, price);
          callbacks.current.forEach(callback => callback(pair, marketPrice));
          updatePriceStoreWithMarketPrice(marketPrice, pair);
        });
      });
    return () =>
      ids.forEach(id => {
        try {
          priceFeed.unsubscribe(id);
        } catch (e) {
          console.error(e);
        }
      });
  }, [isPriceClientLive, protocol, priceFeed]);

  useEffect(() => {
    const batchInterval = setInterval(() => {
      const items = STORE.pop();
      if (items.length === 0) {
        return;
      }
      if (DEBUG_PRICE_FEED) {
        console.log(`[PriceStore] batch-updated ${items.length} prices`);
      }
      setPriceBatchCount(c => c + 1);
    }, PRICE_MEMO_INTERVAL_MS);
    return () => {
      clearInterval(batchInterval);
    };
  }, []);

  const getPrice: TradePriceOracle = useCallback((pair: Pair) => {
    const pairKey = pairToString(mapIncomingPricePair(pair));
    if (isOneToOnePair(pairKey)) {
      return ONE_MARKET_PRICE;
    }
    try {
      return STORE.get(pair) ?? selectedTradePairLp.getPrice(pair);
    } catch (_) {
      return null;
    }
  }, []);

  const markets = useMemo(
    () => Object.keys(marketSubscriptions).map(pairFromString),
    [marketSubscriptions],
  );

  const value = useMemo<TradePricesValue | null>(() => {
    return {
      getPrice,
      subscribe,
      unsubscribe,
      markets,
    };
  }, [getPrice, subscribe, unsubscribe, markets, priceBatchCount]);

  if (!value) {
    return null;
  }

  return (
    <TradePricesContext.Provider value={value}>
      {props.children}
    </TradePricesContext.Provider>
  );
};

export const useTradePrices = () => {
  const context = useContext(TradePricesContext);
  if (!context) {
    throw new Error("must be used inside TradePricesProvider");
  }
  return context;
};

const mapIncomingPricePair = (pair: Pair): Pair => {
  // Clone pair to avoid mutating the original.
  pair = { ...pair };
  let symbol: keyof Pair;
  for (symbol in pair) {
    if (pair[symbol] === "fxUSD") {
      pair[symbol] = "USD";
    }
    if (pair[symbol] === "WETH") {
      pair[symbol] = "ETH";
    }
  }
  return pair;
};

const isOneToOnePair = (pairKey: string): boolean => {
  const pair = pairFromString(pairKey);
  return pair.baseSymbol === pair.quoteSymbol;
};

const subscribeTradePair = (
  tradePair: TradePair,
  pool: TradeLiquidityPool,
  callbacks: MutableRefObject<MarketPriceCallback[]>,
): SubscriptionId => {
  const pair = tradePair.pair;
  // Handle the subscription success callback.
  const callback = (pair: Pair, price: MarketPrice) => {
    updatePriceStoreWithMarketPrice(price, pair);
    callbacks.current.forEach(callback => callback(pair, price));
  };
  return pool.subscribeToMarketPrice({
    pair,
    callback,
  });
};

const updatePriceStoreWithMarketPrice = (
  marketPrice: MarketPrice,
  pair: Pair,
) => {
  pair = mapIncomingPricePair(pair);
  const reversedPair = mapIncomingPricePair({
    baseSymbol: pair.quoteSymbol,
    quoteSymbol: pair.baseSymbol,
  });
  STORE.insert(pair, marketPrice);
  STORE.insert(reversedPair, marketPrice.inverse());
};
