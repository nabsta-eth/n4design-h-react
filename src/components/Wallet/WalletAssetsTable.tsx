import React from "react";
import { Network } from "handle-sdk";
import { sortIcon, Sorting } from "../../utils/sort";
import {
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeadData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import classes from "./WalletAssetsTable.module.scss";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import {
  TokenWithBalanceAndPrice,
  TokenWithOptionalPrice,
} from "../../types/tokenInfo";
import {
  addAssetToWallet,
  NewWalletAsset,
} from "@handle-fi/react-components/dist/utils/browser";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import { ethers } from "ethers";
import { bnToDisplayString, fxTokenSymbolToCurrency } from "../../utils/format";
import {
  getExplorerMetadata,
  getLocaleNumberSeparators,
  getPriceChartTileId,
  getUkTooltip,
  getZeroDecimalString,
  isFxToken,
} from "../../utils/general";
import classNames from "classnames";
import { config } from "../../config";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import { useNavigate } from "react-router-dom";
import Button from "../Button";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import { useSelectedOrConnectedAccount } from "../../hooks/useSelectedOrConnectedAccount";
import { expandDecimals } from "../../utils/trade";
import { isProtocolToken } from "../../utils/dashboard/dashboard-assets";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUserBalanceStore } from "../../context/UserBalances";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";
import { useDashboardTilesStore } from "../../context/DashboardTiles";
import { ButtonSmart } from "..";
import { useLanguageStore } from "../../context/Translation";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

type WalletAssetsTableProps = {
  isLoading: boolean;
  isLoadingPrices: boolean;
  tokens?: TokenWithBalanceAndPrice[];
  network: Network;
  currency: string;
  sort: Sorting;
  onSetSendToken: (tokenSymbol: string) => void;
  onSetSort: (newSort: Sorting) => void;
  onChangeSort: (
    sort: Sorting,
    by: string,
    onSetSort: (newSort: Sorting) => void,
  ) => void;
};

const WalletAssetsTable: React.FC<WalletAssetsTableProps> = ({
  isLoading,
  isLoadingPrices,
  tokens,
  network,
  currency,
  sort,
  onSetSendToken,
  onSetSort,
  onChangeSort,
}) => {
  const { activeTheme, isModernTheme } = useUiStore();
  const selectedOrConnectedAccount = useSelectedOrConnectedAccount();
  const { tokenValueThreshold } = useUserBalanceStore();
  const { t } = useLanguageStore();

  const onChangeSortInternal = (by: Sorting["by"]) => {
    onChangeSort(sort, by, onSetSort);
  };

  const currencyToDisplay = fxTokenSymbolToCurrency(currency);
  const areAssetsLoading = isLoading || isLoadingPrices;

  const tokensToDisplay = React.useMemo(() => {
    return tokens?.filter(token => {
      const tokenThresholdBn = expandDecimals(
        +tokenValueThreshold,
        token.decimals + 18,
      );
      const tokenWalletValue = (token.balance ?? ethers.constants.Zero).mul(
        token.price ?? ethers.constants.Zero,
      );
      return tokenWalletValue.gte(tokenThresholdBn);
    });
  }, [tokens, isLoadingPrices, tokenValueThreshold]);

  const renderTableBody = () => {
    if (!selectedOrConnectedAccount)
      return (
        <TableRow className={classes.transparent}>
          <TableData colSpan={5} className="uk-text-center">
            <div className="uk-flex uk-flex-column uk-flex-middle uk-margin-small-top uk-margin-small-bottom">
              <ButtonSmart
                className={classes.connectButton}
                size="small"
                network={network}
              />
            </div>
          </TableData>
        </TableRow>
      );

    if (areAssetsLoading && tokensToDisplay?.length === 0)
      return (
        <TableRow>
          <TableData colSpan={5} className="uk-text-center">
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </TableData>
        </TableRow>
      );
    if (tokensToDisplay?.length === 0)
      return (
        <TableRow>
          <TableData colSpan={5} className="uk-text-center">
            no tokens found
          </TableData>
        </TableRow>
      );

    return tokensToDisplay?.map(token => (
      <Row
        key={token.symbol}
        token={token}
        network={network}
        onSetSendToken={onSetSendToken}
        currencySymbol={currencyToDisplay}
        areAssetsLoading={isLoading}
        arePricesLoading={isLoadingPrices}
      />
    ));
  };

  return (
    <Table
      id="wallet"
      responsive
      size="xs"
      divider
      className="uk-margin-remove"
    >
      <TableHead className="hfi-wallet-table-header hfi-border-top-remove">
        <TableRow className="hfi-table-header-row">
          <TableHeadData
            className={classNames({
              [classes.headerDataDash]:
                isModernTheme && !selectedOrConnectedAccount,
            })}
          >
            {t.token}
            <FontAwesomeIcon
              onClick={() => onChangeSortInternal("symbol")}
              icon={["far", sortIcon(sort, "symbol")]}
              className="uk-margin-xsmall-left cursor-pointer"
            />
          </TableHeadData>
          <TableHeadData
            textAlign="right"
            className={classNames({
              [classes.headerDataDash]:
                isModernTheme && !selectedOrConnectedAccount,
            })}
          >
            {t.balance}
            <FontAwesomeIcon
              onClick={() => onChangeSortInternal("balance")}
              icon={["far", sortIcon(sort, "balance")]}
              className="uk-margin-xsmall-left cursor-pointer"
            />
          </TableHeadData>
          <TableHeadData
            textAlign="right"
            className={classNames({
              [classes.headerDataDash]:
                isModernTheme && !selectedOrConnectedAccount,
            })}
          >
            {t.price} ({currencyToDisplay})
          </TableHeadData>
          <TableHeadData
            textAlign="right"
            className={classNames({
              [classes.headerDataDash]:
                isModernTheme && !selectedOrConnectedAccount,
            })}
          >
            {t.value} ({currencyToDisplay})
            <FontAwesomeIcon
              onClick={() => onChangeSortInternal("value")}
              icon={["far", sortIcon(sort, "value")]}
              className="uk-margin-xsmall-left cursor-pointer"
            />
          </TableHeadData>
          <TableHeadData
            className={classNames({
              [classes.headerDataDash]:
                isModernTheme && !selectedOrConnectedAccount,
            })}
          >
            {" "}
          </TableHeadData>
        </TableRow>
      </TableHead>

      <TableBody>{renderTableBody()}</TableBody>
    </Table>
  );
};

type RowProps = {
  areAssetsLoading: boolean;
  arePricesLoading: boolean;
  token: TokenWithBalanceAndPrice;
  network: Network;
  onSetSendToken: (tokenSymbol: string) => void;
  currencySymbol: string;
  last?: boolean;
};

const Row: React.FC<RowProps> = ({
  areAssetsLoading,
  arePricesLoading,
  network,
  token,
  onSetSendToken,
  currencySymbol,
  last,
}) => {
  const selectedOrConnectedAccount = useSelectedOrConnectedAccount();
  const navigate = useNavigate();
  const { priceChartTiles, onChangeToken } = useDashboardTilesStore();
  const { activeTheme } = useUiStore();

  const onConvert = (token: string) => {
    navigate(
      `/convert?network=${network}&fromToken=${token}${
        token === "fxUSD" ? "&toToken=FOREX" : ""
      }`,
    );
  };

  const onBuyHlp = (token: string) => {
    navigate(`/convert?network=arbitrum&fromToken=${token}&toToken=hLP`);
  };

  const addTokenToWallet = (addToken: TokenWithOptionalPrice) => {
    const tokenToAdd: NewWalletAsset = {
      symbol: addToken.symbol,
      address: addToken.address,
      decimals: addToken.decimals,
      image: `https://arbiscan.io/token/images/handlefi${addToken.symbol.replace(
        "fx",
        "",
      )}_32.png`,
    };

    addAssetToWallet(tokenToAdd);
  };

  const canUseToBuyHlp =
    token.extensions?.isNative ||
    token.extensions?.isWrappedNative ||
    isFxToken(token.symbol);

  const mediaQueries = useMediaQueries();
  const displayPriceDecimals =
    token.extensions?.isNative ||
    token.extensions?.isWrappedNative ||
    token.symbol === "WBTC"
      ? 2
      : 4;

  const one = ethers.utils.parseEther("1");

  const displayPrice = bnToDisplayString(
    token.price || ethers.constants.Zero,
    18,
    displayPriceDecimals,
    displayPriceDecimals,
  );

  const isLoadingOrZero = selectedOrConnectedAccount ? "isLoading" : "--";

  const balanceDecimals = token.balance
    ? bnToDisplayString(token.balance, token.decimals, 4)
    : getZeroDecimalString(4);
  const balanceToDisplay =
    !token.balance?.isZero() && +balanceDecimals === 0
      ? `< 0${getLocaleNumberSeparators().decimalSeparator}0001`
      : balanceDecimals;

  const value =
    token?.balance && token?.price && token.balance.mul(token.price).div(one);
  const displayValue = value
    ? bnToDisplayString(value, token.decimals, 2)
    : isLoadingOrZero;

  const explorerMetadata = getExplorerMetadata(token.address, "token", network);
  const defaultPriceChartId = getPriceChartTileId(1);
  const chartIsCurrentToken =
    priceChartTiles[defaultPriceChartId].fromToken === token.symbol;
  const isSpritesheetIcon = token.symbol === "FOREX" || isFxToken(token.symbol);

  return (
    <TableRow
      key={token.symbol}
      className={classNames({
        last: last,
      })}
    >
      <TableData
        label={isFxToken(token.symbol) ? "fxToken" : "collateral token"}
        className={classNames(classes.tokenColumn)}
      >
        <span
          className={classNames({
            "cursor-pointer": !chartIsCurrentToken,
          })}
          onClick={
            chartIsCurrentToken
              ? undefined
              : () => onChangeToken(defaultPriceChartId, "from", token.symbol)
          }
          uk-tooltip={
            chartIsCurrentToken
              ? undefined
              : getUkTooltip({
                  title: `view chart for ${token.symbol}`,
                  position: "bottom",
                })
          }
        >
          <SpritesheetIcon
            sizePx={22}
            iconName={token.symbol}
            style={{ marginTop: 0, marginBottom: -7 }}
            className={classNames("hfi-margin-top-n2 uk-margin-small-right", {
              [classes.assetIcon]:
                !isSpritesheetIcon && token.symbol !== "USDT",
              [classes.handleAssetIcon]: isSpritesheetIcon,
            })}
            fallbackSrc={token.logoURI ?? config.tokenIconPlaceholderUrl}
          />

          {token.extensions?.isHlpToken && (
            <img
              className={classNames(classes.handleCollateralImage)}
              width="12"
              src="/assets/images/handle.fiLogoLightNewCut.png"
              alt="handle"
            />
          )}

          {token.symbol}
        </span>

        <Link
          tooltip={{
            text: explorerMetadata.prompt,
            position: "right",
          }}
          href={explorerMetadata.url}
          target="_blank"
          className="uk-margin-small-left"
        >
          <FontAwesomeIcon icon={["fal", "external-link-square"]} />
        </Link>
      </TableData>

      <TableData label="balance" textAlign="right">
        {areAssetsLoading ? (
          <Loader color={getThemeFile(activeTheme).primaryColor} />
        ) : (
          balanceToDisplay
        )}
      </TableData>

      <TableData label={`price (${currencySymbol})`} textAlign="right">
        {areAssetsLoading || arePricesLoading ? (
          <Loader color={getThemeFile(activeTheme).primaryColor} />
        ) : (
          displayPrice
        )}
      </TableData>

      <TableData
        label={`value (${currencySymbol})`}
        textAlign="right"
        className="padding-bottom<m"
      >
        {areAssetsLoading || arePricesLoading ? (
          <Loader color={getThemeFile(activeTheme).primaryColor} />
        ) : (
          displayValue
        )}
      </TableData>

      <TableData
        textAlign="left"
        className={classNames({
          [classes.buttonColumnWidth]: mediaQueries.minTablet,
        })}
      >
        <div
          className={classNames("hfi-button-collection", classes.buttonGroup)}
        >
          <Button
            id={`${token.symbol}-send-button`}
            icon
            type="secondary"
            tooltip={{
              text: `send ${token.symbol}`,
              position: "right",
            }}
            onClick={
              selectedOrConnectedAccount
                ? () => onSetSendToken(token.symbol)
                : undefined
            }
          >
            <FontAwesomeIcon icon={["fal", "paper-plane-top"]} />
          </Button>

          <Button
            id={`${token.symbol}-convert-button`}
            icon
            type="secondary"
            tooltip={{
              text: `convert ${token.symbol}`,
              position: "right",
            }}
            onClick={
              selectedOrConnectedAccount
                ? () => onConvert(token.symbol)
                : undefined
            }
          >
            <FontAwesomeIcon icon={["fal", "exchange"]} />
          </Button>

          {canUseToBuyHlp && (
            <Button
              id={`${token.symbol}-buy-hlp-button`}
              icon
              type="secondary"
              tooltip={{
                text: `buy hLP`,
                position: "right",
              }}
              onClick={
                selectedOrConnectedAccount
                  ? () => onBuyHlp(token.symbol)
                  : undefined
              }
            >
              <Image
                className="uk-position-relative"
                width="20"
                src="/assets/images/handle.fiLogoLightOutline.png"
                alt="hLP"
              />
            </Button>
          )}

          {token.symbol.startsWith("fx") && !isProtocolToken(token) && (
            <Button
              id={`${token.symbol}-add-token-to-wallet-button`}
              icon
              type="secondary"
              tooltip={{
                text: `add ${token.symbol} token to wallet`,
                position: "right",
              }}
              onClick={
                selectedOrConnectedAccount
                  ? () => addTokenToWallet(token)
                  : undefined
              }
            >
              <FontAwesomeIcon icon={["fal", "plus"]} />
            </Button>
          )}
        </div>
      </TableData>
    </TableRow>
  );
};

export default WalletAssetsTable;
