import * as React from "react";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";
import { useContext, useMemo } from "react";
import { OneClickTradingStore } from "../hooks/useOneClickTrading";
import { LocalStorageHook } from "@handle-fi/react-components/dist/hooks/useLocalStorage";

export type LocalStorageValue = {
  oneClickTrading: LocalStorageHook<OneClickTradingStore>;
};

export const LocalStorageContext = React.createContext<LocalStorageValue>({
  oneClickTrading: [{}, () => {}, false],
});

/**
 * Provider for reactively updating local storage items.
 */
export const LocalStorageProvider: React.FC = props => {
  const oneClickTrading = useLocalStorageVersioned<OneClickTradingStore>(
    "OCT_STORAGE",
    1,
    {},
  );
  const value = useMemo(
    (): LocalStorageValue => ({
      oneClickTrading,
    }),
    [oneClickTrading],
  );
  return (
    <LocalStorageContext.Provider value={value}>
      {props.children}
    </LocalStorageContext.Provider>
  );
};

export const useLocalStorageContext = () => useContext(LocalStorageContext);
