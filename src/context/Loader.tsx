import * as React from "react";
import { safeGetElementById } from "../utils/general";
import { useContext, useEffect, useMemo, useReducer, useState } from "react";

/// Whether to use the loader symbol description on-screen.
const SHOW_SYMBOL_DESCRIPTION = false;
const INITIAL_TIMEOUT_MS = 200;

export type LoaderValue = {
  registerLoader: React.Dispatch<symbol>;
  completeLoader: (symbol: symbol) => void;
};

export const LoaderContext = React.createContext<LoaderValue>({
  registerLoader: _ => {},
  completeLoader: _ => {},
});

type RegisteredLoader = {
  symbol: symbol;
  isLoaded: boolean;
};

type ReducerAction = {
  type: "register" | "complete";
  symbol: symbol;
};

const reducer = (
  state: RegisteredLoader[],
  { type, symbol }: ReducerAction,
): RegisteredLoader[] =>
  type === "register"
    ? getReducedLoadersRegister(state, symbol)
    : getReducedLoadersComplete(state, symbol);

const getReducedLoadersRegister = (
  state: RegisteredLoader[],
  symbol: symbol,
): RegisteredLoader[] =>
  state.map(loader => loader.symbol).includes(symbol)
    ? [...state]
    : [
        ...state,
        {
          symbol,
          isLoaded: false,
        },
      ];

const getReducedLoadersComplete = (
  state: RegisteredLoader[],
  symbol: symbol,
): RegisteredLoader[] => {
  const includes = state.map(loader => loader.symbol).includes(symbol);
  if (!includes)
    throw new Error("getReducedLoadersComplete: no loader to complete");
  return [
    ...state.map(loader =>
      loader.symbol === symbol
        ? {
            symbol: symbol,
            isLoaded: true,
          }
        : loader,
    ),
  ];
};

export const LoaderProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [loaders, dispatchLoader] = useReducer(reducer, []);
  const completeCount = useMemo(
    () =>
      loaders
        .map(loader => (loader.isLoaded ? 1 : 0))
        .reduce((sum: number, value) => sum + value, 0),
    [loaders],
  );
  const [hasTimeoutExpired, setHasTimeoutExpired] = useState(false);
  const isLoaded = useMemo(
    () => hasTimeoutExpired && completeCount === loaders.length,
    [loaders, completeCount, hasTimeoutExpired],
  );
  const status = useMemo(() => {
    if (!SHOW_SYMBOL_DESCRIPTION) {
      return "";
    }
    const description =
      loaders.find(loader => !loader.isLoaded)?.symbol.description || null;
    return description !== null ? `${description}...` : "";
  }, [loaders]);
  useEffect(() => {
    setTimeout(() => setHasTimeoutExpired(true), INITIAL_TIMEOUT_MS);
  }, []);
  useEffect(() => {
    const getVisibility = (show: boolean) => (show ? "initial" : "hidden");
    const loader = safeGetElementById("global-loader");
    const app = safeGetElementById("handle");
    loader.style.visibility = getVisibility(!isLoaded);
    app.style.visibility = getVisibility(isLoaded);
  }, [isLoaded]);
  useEffect(() => {
    const STATUS = safeGetElementById("global-loader-status");
    STATUS.textContent = status;
  }, [status]);
  const value: LoaderValue = useMemo(
    () => ({
      registerLoader(symbol) {
        console.debug("[loader] register", symbol);
        dispatchLoader({
          symbol,
          type: "register",
        });
      },
      completeLoader(symbol) {
        console.debug("[loader] complete", symbol);
        dispatchLoader({
          symbol,
          type: "complete",
        });
      },
    }),
    [loaders, isLoaded],
  );
  return (
    <LoaderContext.Provider value={value}>
      {props.children}
    </LoaderContext.Provider>
  );
};

export const useLoader = (symbol: symbol): (() => void) => {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  const [loaderSymbol] = useState(symbol);
  useEffect(() => {
    context.registerLoader(loaderSymbol);
  }, []);
  return () => context.completeLoader(loaderSymbol);
};
