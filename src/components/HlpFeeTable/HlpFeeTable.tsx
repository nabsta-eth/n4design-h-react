import { ethers, BigNumber } from "ethers";
import {
  useHlpTokens,
  useNativeToken,
  useTokenManager,
} from "../../context/TokenManager";
import { config as handleConfig } from "../../config";
import classNames from "classnames";
import classes from "./HlpFeeTable.module.scss";
import { bnToDisplayString, valueToDisplayString } from "../../utils/format";
import React, { useState } from "react";
import { useBalances } from "../../context/UserBalances";
import {
  getTokenAmountDisplayDecimals,
  getTokenBalanceDisplayDecimals,
} from "../../utils/general";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import onChangeSort, { Sort, sortIcon } from "../../utils/sort";
import { getHlpDetails } from "../../utils/convert/getHlpDetails";
import { useUiStore } from "../../context/UserInterface";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import { useHlpVaultBalance } from "../../context/HlpVaultBalance";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

type HlpFeeTableProps = {
  onClickBuy: (token: string) => void;
  token?: string;
  showFullFeeTable?: boolean;
  isBuyingHlp: boolean;
  usdHlpDelta?: BigNumber;
};

// Hlp swap fee cannot exist without a delta amount. If no delta is passed in,
// this will be used as a default
const DEFAULT_USD_HLP_DELTA = ethers.utils.parseEther("1");
const network = DEFAULT_HLP_NETWORK;

type HlpDetails = {
  symbol: string;
  price: BigNumber;
  value: number;
  maxValue: number;
  targetWeightPercent: number;
  maxUsdHlpAmount: BigNumber;
  balance: number;
  walletValue: number;
  fee: number;
};
type Sorting = Sort<keyof HlpDetails>;

const HlpFeeTable: React.FC<HlpFeeTableProps> = props => {
  const {
    onClickBuy,
    token,
    showFullFeeTable,
    usdHlpDelta = DEFAULT_USD_HLP_DELTA,
  } = props;
  const { isMobile, activeTheme } = useUiStore();
  const balances = useBalances(network);
  const { balances: vaultBalances } = useHlpVaultBalance();
  const TokenManager = useTokenManager();
  const nativeToken = useNativeToken(network);
  const wrappedNativeToken = TokenManager.getHlpWrappedNativeToken(network);
  const minMobile = useMediaQueries().minMobile;
  const stackTableEntries = !minMobile;
  const [config] = usePromise(() => hlp.config.fetch(network));
  const [hlpTokens] = usePromise(() => hlp.internals.fetchTokens());
  const [tokenUsdHlpAmounts] = usePromise(() =>
    hlp.internals.getAllTokenUsdHlpAmounts(),
  );
  const [tokenTargetUsdHlpAmounts] = usePromise(() =>
    hlp.internals.getAllTokenTargetUsdHlpAmounts(),
  );

  const [sort, onSetSort] = React.useState<Sorting>({
    by: "walletValue",
    direction: "desc",
  });

  const _onChangeSortInternal = (by: Sorting["by"]) => {
    onChangeSort(sort, by, onSetSort);
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hlpTokensToDisplay = React.useMemo(() => {
    if (
      !tokenUsdHlpAmounts ||
      !tokenTargetUsdHlpAmounts ||
      !config ||
      !hlpTokens
    ) {
      return [];
    }
    const hlpDetails: HlpDetails[] = getHlpDetails(
      network,
      balances,
      props.isBuyingHlp,
      usdHlpDelta || DEFAULT_USD_HLP_DELTA,
      vaultBalances,
      tokenUsdHlpAmounts,
      tokenTargetUsdHlpAmounts,
      config,
      hlpTokens,
      nativeToken,
    );
    if (showFullFeeTable || !token) {
      return hlpDetails.sort((a: HlpDetails, b: HlpDetails) => {
        const aValue = +a[sort.by];
        const bValue = +b[sort.by];

        if (sort.direction === "desc") return bValue > aValue ? 1 : -1;
        return aValue > bValue ? 1 : -1;
      });
    }

    const hlpTokenSelected = hlpDetails.find(t => {
      return t.symbol === token;
    });
    setIsLoading(false);
    if (!hlpTokenSelected) return [];
    return [
      {
        ...hlpTokenSelected,
        symbol: token,
      },
    ];
  }, [
    sort,
    balances,
    token,
    wrappedNativeToken,
    showFullFeeTable,
    props.isBuyingHlp,
    vaultBalances,
    tokenTargetUsdHlpAmounts,
    tokenUsdHlpAmounts,
    config,
    hlpTokens,
    usdHlpDelta.toString(),
  ]);

  return (
    <div className="hfi-border uk-margin-xsmall-top">
      <div className="uk-nav uk-dropdown-nav handle-select">
        <div
          className={classNames(
            "uk-flex uk-flex-between uk-flex-middle",
            classes.headerRow,
          )}
        >
          <div
            className={classNames("uk-flex uk-flex-middle uk-flex-1", {
              [classes.tokenColumn]: !stackTableEntries,
              [classes.tokenColumnStacked]: stackTableEntries,
            })}
          >
            token
          </div>

          <div className="uk-flex-1 uk-text-right">price</div>

          <div className="uk-flex-1 uk-text-right">
            <span>
              wallet
              {stackTableEntries && (
                <FontAwesomeIcon
                  onClick={() => _onChangeSortInternal("walletValue")}
                  icon={["far", sortIcon(sort, "walletValue")]}
                  className="uk-margin-xsmall-left"
                />
              )}
            </span>

            <span className={classNames({ "uk-hidden": stackTableEntries })}>
              (USD)
              <FontAwesomeIcon
                onClick={() => _onChangeSortInternal("walletValue")}
                icon={["far", sortIcon(sort, "walletValue")]}
                className="uk-margin-xsmall-left"
              />
            </span>
          </div>

          <div className="uk-flex-1 uk-text-right">
            fee
            <FontAwesomeIcon
              onClick={() => _onChangeSortInternal("fee")}
              icon={["far", sortIcon(sort, "fee")]}
              className="uk-margin-xsmall-left"
            />
          </div>

          <div
            className={classNames(
              "uk-flex-1 uk-text-right",
              classes.buyButtonColumn,
              { "uk-hidden": stackTableEntries },
            )}
          ></div>
        </div>

        <div
          className={classNames(classes.tableBodyWrapper, {
            [classes.fullTableBodyWrapper]: showFullFeeTable || !token,
          })}
        >
          <div>
            {isLoading && (
              <div
                className={classNames(
                  classes.loader,
                  "uk-width-expand uk-flex uk-flex-center uk-flex-middle",
                )}
              >
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              </div>
            )}
            {!isLoading &&
              hlpTokensToDisplay.map(hlpToken => (
                <div
                  key={hlpToken.symbol}
                  className={classNames("uk-flex", {
                    [classes.row]: !stackTableEntries,
                    [classes.rowStacked]: stackTableEntries,
                  })}
                  onClick={
                    isMobile ? () => onClickBuy(hlpToken.symbol) : undefined
                  }
                >
                  <HlpRow
                    token={token}
                    hlpToken={hlpToken}
                    onClickBuy={onClickBuy}
                    showFullFeeTable={showFullFeeTable || false}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type HlpRowProps = {
  token?: string;
  hlpToken: {
    symbol: string;
    value: number;
    price: BigNumber;
    maxValue: number;
    targetWeightPercent: number;
    maxUsdHlpAmount: BigNumber;
    balance: number;
    walletValue: number;
    fee: number;
  };
  onClickBuy: (token: string) => void;
  showFullFeeTable: boolean;
};

const HlpRow = (props: HlpRowProps) => {
  const { isMobile } = useUiStore();
  const { token, hlpToken, onClickBuy } = props;
  const hlpTokens = useHlpTokens(network);
  const nativeToken = useNativeToken(network);
  const hlpTokensWithNative = React.useMemo(() => {
    return nativeToken ? [...hlpTokens, nativeToken] : hlpTokens;
  }, [hlpTokens, nativeToken]);
  const hlpTokenInfo = hlpTokensWithNative.find(
    token => token.symbol === hlpToken.symbol,
  );
  const minMobile = useMediaQueries().minMobile;
  const stackTableEntries = !minMobile;

  const precision = getTokenAmountDisplayDecimals(hlpToken.symbol);
  const priceDisplay = bnToDisplayString(
    hlpToken.price,
    PRICE_DECIMALS,
    precision,
  );

  const balancePrecision = getTokenBalanceDisplayDecimals(hlpToken.symbol);

  if (!hlpTokenInfo) {
    console.warn(`No token info found for ${hlpToken.symbol}`);
    return null;
  }

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle uk-width-expand",
        classes.toTokenBalance,
      )}
    >
      <div
        className={classNames("uk-flex uk-flex-1", {
          [classes.tokenColumn]: !stackTableEntries,
          [classes.tokenColumnStacked]: stackTableEntries,
          "uk-flex-middle uk-flex-left": stackTableEntries,
          "uk-flex-middle": !stackTableEntries,
        })}
      >
        <SpritesheetIcon
          iconName={hlpToken.symbol}
          sizePx={isMobile ? 16 : 24}
          style={{ marginTop: 1 }}
          className="uk-margin-xsmall-right"
          fallbackSrc={
            hlpTokenInfo.logoURI ?? handleConfig.tokenIconPlaceholderUrl
          }
        />
        {hlpToken.symbol}
      </div>

      <div className="uk-flex-1 uk-text-right">{priceDisplay}</div>

      <div
        className={classNames("uk-flex uk-flex-1 uk-text-right uk-flex-right", {
          "uk-flex-column uk-flex-bottom": stackTableEntries,
        })}
      >
        <span>
          {valueToDisplayString(
            hlpToken.balance,
            hlpToken.symbol,
            balancePrecision,
          )}
        </span>

        {stackTableEntries && (
          <span className={classes.valueStacked}>
            {valueToDisplayString(hlpToken.walletValue, hlpToken.symbol, 2)}
            <sub> USD</sub>
          </span>
        )}

        {!stackTableEntries && (
          <span className="uk-margin-small-left">
            {` (${valueToDisplayString(
              hlpToken.walletValue,
              hlpToken.symbol,
              2,
            )})`}
          </span>
        )}
      </div>

      <div className="uk-flex-1 uk-text-right">{hlpToken.fee.toFixed(2)}%</div>

      <div
        className={classNames(classes.buttonColumn, {
          "uk-hidden": stackTableEntries,
        })}
      >
        {props.showFullFeeTable && (
          <ButtonSmart
            type="secondary"
            disabled={hlpToken.symbol === token}
            className={classNames(classes.buyButton, {
              //[classes.disabled]: hlpToken.symbol === token,
            })}
            network={network}
            onClick={() => onClickBuy(hlpToken.symbol)}
          >
            select
          </ButtonSmart>
        )}
      </div>
    </div>
  );
};

export default HlpFeeTable;
