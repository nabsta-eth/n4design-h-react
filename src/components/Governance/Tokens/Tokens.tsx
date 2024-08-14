import * as React from "react";
import { PageTitle } from "../../";
import { useTokenManager } from "../../../context/TokenManager";
import {
  getTokenEntities,
  TokenEntity,
  HodlerEntity,
  MinterEntity,
  getTopHodlerEntities,
  getTopMinterEntities,
} from "./subgraph";
import { Network } from "handle-sdk";
import { TokenTable } from "./tables/TokenTable";
import { HodlersTable } from "./tables/HodlersTable";
import { MintersTable } from "./tables/MintersTable";

export const NETWORK: Network = "arbitrum";

export type Hodlers = { [tokenAddress: string]: HodlerEntity[] };
export type Minters = { [tokenAddress: string]: MinterEntity[] };

export const Tokens: React.FC = () => {
  const tokenManager = useTokenManager();
  const [tokens, setTokens] = React.useState<TokenEntity[]>([]);
  const [loadedTokens, setLoadedTokens] = React.useState(false);
  const [hodlers, setHodlers] = React.useState<Hodlers>({});
  const [minters, setMinters] = React.useState<Minters>({});
  React.useEffect(() => {
    // Load tokens.
    (async () => {
      const tokens = await getTokenEntities();
      tokens.sort((a, b) => (a.totalSupply.lt(b.totalSupply) ? 1 : -1));
      setTokens(tokens);
      setLoadedTokens(true);
    })();
  }, []);
  React.useEffect(() => {
    // Load hodlers.
    (async () => {
      setHodlers({});
      for (let token of tokens) {
        const hodlerEntities = await getTopHodlerEntities(5, token.address);
        setHodlers(hodlers => {
          if (!hodlers[token.address]) hodlers[token.address] = [];
          return {
            ...hodlers,
            [token.address]: [...hodlers[token.address], ...hodlerEntities],
          };
        });
      }
    })();
    // Load minters.
    (async () => {
      for (let token of tokens) {
        const minterEntities = await getTopMinterEntities(5, token.address);
        setMinters(minters => {
          if (!minters[token.address]) minters[token.address] = [];
          return {
            ...minters,
            [token.address]: [...minters[token.address], ...minterEntities],
          };
        });
      }
    })();
  }, [loadedTokens]);
  const tokenIcons = React.useMemo(
    () =>
      tokens.reduce(
        (object, token) => ({
          ...object,
          [token.address]: tokenManager.getTokenBySymbol(token.symbol, NETWORK)!
            .logoURI,
        }),
        {},
      ),
    [tokens],
  );
  const tokensByAddress: { [address: string]: TokenEntity } = React.useMemo(
    () =>
      tokens.reduce(
        (dictionary, token) => ({
          ...dictionary,
          [token.address]: token,
        }),
        {},
      ),
    [tokens],
  );
  return (
    <div className="uk-margin-medium-top">
      {tokens.length >= 0 && (
        <div>
          <PageTitle text="arbitrum token table" />
          <TokenTable tokens={tokens} tokenIcons={tokenIcons} />
        </div>
      )}
      <PageTitle text={"top token hodlers"} />
      {Object.keys(hodlers).map(
        tokenAddress =>
          !!hodlers[tokenAddress].length && (
            <div key={tokenAddress}>
              <HodlersTable
                hodlers={hodlers[tokenAddress]}
                token={tokensByAddress[tokenAddress]}
                tokenIcons={tokenIcons}
              />
            </div>
          ),
      )}
      <PageTitle text={"top token minters"} />
      {Object.keys(minters).map(
        tokenAddress =>
          !!minters[tokenAddress].length && (
            <div key={tokenAddress}>
              <MintersTable
                minters={minters[tokenAddress]}
                token={tokensByAddress[tokenAddress]}
                tokenIcons={tokenIcons}
              />
            </div>
          ),
      )}
    </div>
  );
};
