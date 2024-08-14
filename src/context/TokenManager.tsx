import * as React from "react";
import { HandleTokenManager, Network, TokenInfo } from "handle-sdk";
import { tryConvertSymbolToFxTokenSymbol } from "../utils/trade/toDisplayPair";

type TokenMangerContextType = {
  tokenManager: HandleTokenManager;
  updateCount: number;
};

const TokenManagerContext = React.createContext<TokenMangerContextType | null>(
  null,
);

export const TokenManagerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const tokenManager = React.useMemo(() => {
    const manager = new HandleTokenManager({
      tokenListUrls:
        window &&
        ["arbitrum", "ethereum", "polygon", "arbitrum-sepolia"].map(
          network => `${window.location.origin}/tokenlist/${network}.json`,
        ),
    });
    manager.onTokensChange = () => setTokenUpdateCount(count => count + 1);
    return manager;
  }, []);
  const [tokenUpdateCount, setTokenUpdateCount] = React.useState(0);
  return (
    <TokenManagerContext.Provider
      value={{
        tokenManager,
        updateCount: tokenUpdateCount,
      }}
    >
      {children}
    </TokenManagerContext.Provider>
  );
};

/* eslint-disable react-hooks/exhaustive-deps */
/* Exhaustive deps is disabled as the tokenUpdateCount should cause the component to re-render
 * despite the fact that it the tokenManager object is not actually changing.
 */

export const useTokenManager = (): HandleTokenManager => {
  const context = React.useContext(TokenManagerContext);
  if (context === null) {
    throw new Error(
      "useTokenManager must be used within a TokenManagerProvider",
    );
  }
  return context.tokenManager;
};

export const useTokenUpdateCount = (): number => {
  const context = React.useContext(TokenManagerContext);
  if (context === null) {
    throw new Error(
      "useTokenUpdateCount must be used within a TokenManagerProvider",
    );
  }
  return context.updateCount;
};

export const useAllTokens = (network?: Network | number): TokenInfo[] => {
  const tokenManager = useTokenManager();
  const tokenUpdateCount = useTokenUpdateCount();
  return React.useMemo(() => {
    return tokenManager.getLoadedTokens(network);
  }, [tokenManager, network, tokenUpdateCount]);
};

export const useToken = (
  symbol?: string,
  network?: Network | number,
): TokenInfo | undefined => {
  const tokenManager = useTokenManager();
  const updateCount = useTokenUpdateCount();
  return React.useMemo(() => {
    if (!symbol || !network) return undefined;
    // If the symbol is e.g. USD, use fxUSD instead.
    symbol = tryConvertSymbolToFxTokenSymbol(symbol);
    return tokenManager.tryGetTokenBySymbol(symbol, network);
  }, [symbol, tokenManager, network, updateCount]);
};

export const useTokenByAddress = (
  address?: string,
  network?: Network | number,
): TokenInfo | undefined => {
  const tokenManager = useTokenManager();
  const updateCount = useTokenUpdateCount();
  return React.useMemo(() => {
    if (!address || !network) return undefined;
    return tokenManager.getTokenByAddress(address, network);
  }, [address, tokenManager, network, updateCount]);
};

export const useTokens = (
  symbols: string[],
  network: Network | number,
): TokenInfo[] => {
  const updateCount = useTokenUpdateCount();
  const tokenManager = useTokenManager();
  return React.useMemo(
    () =>
      tokenManager.getTokensBySymbols(
        symbols.map(symbol => ({
          symbol,
          network,
        })),
      ),
    [symbols, tokenManager, network, updateCount],
  );
};

export const useNativeToken = (network: Network | number) => {
  const tokenManager = useTokenManager();
  const updateCount = useTokenUpdateCount();
  return React.useMemo(
    () => tokenManager.getNativeToken(network),
    [tokenManager, network, updateCount],
  );
};

export const useHlpTokens = (network: Network | number) => {
  const tokenManager = useTokenManager();
  const updateCount = useTokenUpdateCount();
  return React.useMemo(
    () => tokenManager.getHlpTokens(network),
    [tokenManager, network, updateCount],
  );
};

export const useHlpWrappedNativeToken = (network: Network | number) => {
  const hlpTokens = useHlpTokens(network);
  return hlpTokens.find(token => token.extensions?.isWrappedNative);
};
