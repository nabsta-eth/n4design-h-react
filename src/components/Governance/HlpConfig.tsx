import { BigNumber, ethers, Signer } from "ethers";
import { TokenInfo } from "handle-sdk";
import {
  BASIS_POINTS_DIVISOR,
  CHAIN_ID_TO_NETWORK_NAME,
} from "handle-sdk/dist/constants";
import * as React from "react";
import { useHlpTokens, useTokenManager } from "../../context/TokenManager";
import {
  formatPercentage,
  getExplorerUrl,
  transformDecimals,
} from "../../utils/general";
import { formatPrice } from "../../utils/trade";
import { ContractBigNumber } from "./HlpConfig/ContractBigNumber";
import { useState } from "react";
import {
  DEFAULT_HLP_NETWORK,
  HlpConfig,
  getHlpContracts,
} from "handle-sdk/dist/components/trade/platforms/hlp/config";
import useSendTransaction, {
  SendTransaction,
} from "../../hooks/useSendTransaction";
import { DEFAULT_NOTIFICATIONS } from "../../config/notifications";
import { isSameAddress, pairFromString } from "handle-sdk/dist/utils/general";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { fetchEncodedSignedQuotes } from "handle-sdk/dist/components/h2so";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { fetchTokens } from "handle-sdk/dist/components/trade/platforms/hlp/internals";
import {
  fetchLiquidityInfo,
  HlpToken,
  LiquidityInfo,
} from "handle-sdk/dist/components/trade/platforms/hlp/internals/tokens";
import { useTradePrices } from "../../context/TradePrices";

const NETWORK = DEFAULT_HLP_NETWORK;

const HlpConfigComponent = () => {
  const hlpTokens = useHlpTokens(NETWORK);
  const [hlpTokenConfigs] = usePromise(() => fetchTokens());
  const [config] = usePromise(() => hlp.config.fetch(NETWORK));
  const [tokenWeightDelta, setTokenWeightDelta] = React.useState<
    Record<string, number>
  >({});

  const totalTokenWeightsRemote = React.useMemo(
    () =>
      hlpTokenConfigs?.reduce((sum, token) => sum + token.tokenWeight, 0) || 0,
    [hlpTokenConfigs],
  );

  // Used to update the token weight ratios when changing the weight locally.
  const totalTokenWeights = React.useMemo(
    () =>
      Object.values(tokenWeightDelta).reduce(
        (sum, weight) => sum + weight,
        totalTokenWeightsRemote,
      ),
    [tokenWeightDelta],
  );

  const hlpContracts = [
    {
      name: "hLP Vault",
      address: getHlpContracts(NETWORK).vault.address,
    },
    {
      name: "hLP Token",
      address: getHlpContracts(NETWORK).hlp.address,
    },
    {
      name: "hLP Manager",
      address: getHlpContracts(NETWORK).hlpManager.address,
    },
  ];

  const [liquidityInfo, setLiquidityInfo] = React.useState<
    Map<string, LiquidityInfo>
  >(new Map());

  React.useEffect(() => {
    fetchLiquidityInfo(
      hlpTokens.map(token => token.address),
      NETWORK,
    ).then(setLiquidityInfo);
  }, [hlpTokens]);

  if (!config)
    return (
      <div>
        <div className="uk-grid uk-grid-medium uk-margin-top">loading</div>
      </div>
    );

  return (
    <div>
      <div className="uk-grid uk-grid-medium uk-margin-top">
        {hlpTokens.map(token => {
          const tokenInfo = hlpTokenConfigs?.find(x =>
            isSameAddress(x.address, token.address),
          );
          if (!tokenInfo) {
            return <div key={token.address}>Error fetching token info</div>;
          }
          return (
            <TokenData
              token={token}
              hlpConfig={config}
              tokenConfig={tokenInfo}
              liquidityInfo={liquidityInfo.get(token.address.toLowerCase())}
              setTokenWeightDelta={(delta: number) =>
                setTokenWeightDelta({
                  ...tokenWeightDelta,
                  [token.address]: delta,
                })
              }
              totalTokenWeights={totalTokenWeights}
            />
          );
        })}
      </div>
      <div>
        <div>
          Base Swap Rate:{" "}
          {formatPercentage(config.swapFeeBasisPoints, BASIS_POINTS_DIVISOR)}
        </div>
        <div>
          Base Stable Swap Rate:{" "}
          {formatPercentage(
            config.stableSwapFeeBasisPoints,
            BASIS_POINTS_DIVISOR,
          )}
        </div>
      </div>
      <div className={"uk-margin-top"}>
        {hlpContracts?.map(contract => (
          <div key={contract.address} className={"uk-margin-small-top"}>
            <div>Name: {contract.name}</div>
            <div>
              Address:{" "}
              <a
                href={getExplorerUrl(contract.address, "address", NETWORK)}
                target="_blank"
                rel="noreferrer"
              >
                {contract.address}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

type Props = {
  token: TokenInfo; // Basic token data, like symbol, address etc
  tokenConfig: HlpToken; // hLP specific token info
  liquidityInfo: LiquidityInfo | undefined;
  /// Called whenever the token weight changes locally, passing the change.
  setTokenWeightDelta: (delta: number) => any;
  /// The total token weights (including local changes)
  totalTokenWeights: number;
  hlpConfig: HlpConfig;
};

const TokenData = ({
  token,
  tokenConfig,
  liquidityInfo,
  setTokenWeightDelta,
  totalTokenWeights,
  hlpConfig,
}: Props) => {
  const [lastPriceUpdateTime, setLastPriceUpdateTime] = React.useState(
    Date.now(),
  );
  const TokenManager = useTokenManager();
  const { getPrice } = useTradePrices();
  const { sendTransaction } = useSendTransaction();
  const network = CHAIN_ID_TO_NETWORK_NAME[token.chainId];
  const fxUSD = React.useMemo(
    () => TokenManager.getTokenBySymbol("fxUSD", network)!,
    [TokenManager, network],
  );
  const pair = pairFromString(`${token.symbol}/USD`);
  const tokenPrice = getPrice(pair);
  React.useEffect(() => {
    setLastPriceUpdateTime(Date.now());
  }, [tokenPrice]);
  const [tokenWeight, setTokenWeight] = useState(
    BigNumber.from(tokenConfig.tokenWeight),
  );
  const [usdHlpSupplyTokenIn] = usePromise(() =>
    hlp.internals.getTokenUsdHlpAmount(token.address),
  );
  const [usdHlpSupplyTokenOut] = usePromise(() =>
    hlp.internals.getTokenUsdHlpAmount(fxUSD.address),
  );
  const [targetUsdHlpAmountTokenIn] = usePromise(() =>
    hlp.internals.getTokenTargetUsdHlpAmount(token.address),
  );
  const [targetUsdHlpAmountTokenOut] = usePromise(() =>
    hlp.internals.getTokenTargetUsdHlpAmount(fxUSD.address),
  );
  const [spreadBasisPoints] = usePromise(() =>
    hlp.internals.getTokenSpreadBasisPoints({ tokenAddress: token.address }),
  );
  const [fundingRate] = usePromise(() =>
    hlp.internals
      .getAllTokenFundingRates()
      .then(f => f[token.address.toLowerCase()]),
  );

  if (
    !usdHlpSupplyTokenIn ||
    !usdHlpSupplyTokenOut ||
    !targetUsdHlpAmountTokenIn ||
    !targetUsdHlpAmountTokenOut ||
    !spreadBasisPoints ||
    !fundingRate ||
    !tokenPrice
  )
    return <></>;

  const swapFeeBasisPoints = hlp.internals.getSwapFeeBasisPoints(
    {
      config: hlpConfig,
      tokenIn: token.address,
      tokenOut: fxUSD.address,
      totalTokenWeights: BigNumber.from(totalTokenWeights),
      // 1 token worth of usdHlp
      usdHlpDelta: transformDecimals(tokenPrice.bestBid, PRICE_DECIMALS, 18),
      targetUsdHlpAmountTokenIn,
      usdHlpSupplyTokenIn,
      targetUsdHlpAmountTokenOut,
      usdHlpSupplyTokenOut,
    },
    network,
  );

  const availableLiquidity =
    liquidityInfo && liquidityInfo.poolAmount.sub(liquidityInfo.reservedAmount);

  const tokenWeightDelta = +tokenWeight - tokenConfig.tokenWeight;

  const onLocallyChangeTokenWeight = (weight: BigNumber) => {
    setTokenWeight(weight);
    setTokenWeightDelta(+weight - tokenConfig.tokenWeight);
  };

  return (
    <div key={token.address} style={{ marginBottom: "2rem" }}>
      <div>Symbol: {token.symbol}</div>
      <div>
        Address:{" "}
        <a
          href={getExplorerUrl(token.address, "address", "arbitrum")}
          target="_blank"
          rel="noreferrer"
        >
          {token.address}
        </a>
      </div>
      <div>Price: {formatPrice(tokenPrice.index, 4)}</div>
      <div>
        Last Update Time: {new Date(lastPriceUpdateTime).toLocaleString()}
      </div>
      <div>Whitelisted: {tokenConfig.isWhitelisted.toString()}</div>
      <div>
        Target Weight:
        <ContractBigNumber
          initialValue={tokenWeight}
          alert={Math.abs(tokenWeightDelta) > 0}
          onChangeLocal={onLocallyChangeTokenWeight}
          onRequestTransaction={(value, signer) =>
            updateTokenConfig(
              TokenManager.getTokenByAddress(tokenConfig.address, network)
                .symbol,
              signer,
              tokenConfig,
              { tokenWeight: +value },
              sendTransaction,
            )
          }
        />{" "}
        ({formatPercentage(+tokenWeight, totalTokenWeights, 2)})
      </div>
      <div>
        Target UsdHlp Amount:{" "}
        {formatPrice(targetUsdHlpAmountTokenIn, 2, undefined, 18)}
      </div>
      <div>
        Current UsdHlp Amount:{" "}
        {formatPrice(usdHlpSupplyTokenIn, 2, undefined, 18)}
      </div>
      <div>
        Percent of target amount:{" "}
        {formatPercentage(
          +usdHlpSupplyTokenIn
            .mul(BASIS_POINTS_DIVISOR)
            .div(targetUsdHlpAmountTokenIn),
          BASIS_POINTS_DIVISOR,
        )}
      </div>
      <div>
        Reserved Amount:{" "}
        {liquidityInfo
          ? `${(+ethers.utils.formatUnits(
              liquidityInfo.reservedAmount,
              token.decimals,
            )).toFixed(4)} ${token.symbol}`
          : "Loading..."}
      </div>
      <div>
        Min Profit Basis Points:{" "}
        {formatPercentage(
          tokenConfig.minProfitBasisPoints,
          BASIS_POINTS_DIVISOR,
        )}
      </div>
      <div>
        Max UsdHlp Amount:{" "}
        {formatPrice(tokenConfig.maxUsdHlpAmount, 2, "USD", 18)}
      </div>
      <div>Is Stable: {tokenConfig.isStable.toString()}</div>
      <div>Is Shortable: {tokenConfig.isShortable.toString()}</div>
      <div>
        Spread: {formatPercentage(+spreadBasisPoints, BASIS_POINTS_DIVISOR)}
      </div>
      <div>
        Funding Rate:{" "}
        {formatPercentage(
          +fundingRate.regular,
          hlp.config.FUNDING_RATE_PRECISION,
        )}
      </div>
      <div>
        Cumulative Funding Rate:{" "}
        {formatPercentage(
          +fundingRate.cumulative,
          hlp.config.FUNDING_RATE_PRECISION,
        )}
      </div>
      <div>
        Swap Rate w/fxUSD:{" "}
        {token.symbol !== "fxUSD" && swapFeeBasisPoints
          ? formatPercentage(+swapFeeBasisPoints, BASIS_POINTS_DIVISOR, 4)
          : "N/A"}
      </div>
      <div>
        Available Liquidity:{" "}
        {availableLiquidity
          ? ethers.utils.formatUnits(availableLiquidity, token.decimals)
          : "loading..."}
      </div>
    </div>
  );
};

const updateTokenConfig = async (
  symbol: string,
  signer: Signer,
  current: HlpToken,
  updates: Partial<HlpToken>,
  sendTransaction: SendTransaction,
) => {
  const config: HlpToken = {
    ...current,
    ...updates,
  };
  const { vault, vaultPriceFeed } = getHlpContracts("arbitrum", signer);
  // update h2so price
  await vaultPriceFeed.h2sofaApplySignedQuote(
    (
      await fetchEncodedSignedQuotes([pairFromString(`${symbol}/USD`)])
    ).encoded,
  );
  return sendTransaction(
    () =>
      vault.setTokenConfig(
        config.address,
        config.tokenDecimals,
        config.tokenWeight,
        config.minProfitBasisPoints,
        config.maxUsdHlpAmount,
        config.isStable,
        config.isShortable,
      ),
    DEFAULT_NOTIFICATIONS,
  );
};

const GovernanceTab = {
  component: HlpConfigComponent,
  name: "hLP Config",
};

export default GovernanceTab;
