import * as React from "react";
import { Network } from "handle-sdk";
import { useUserBalancesWithPrices } from "../../hooks/useUserBalancesWithPrices";
import {
  bnToDisplayString,
  removeWholeNumberSeparatorsFromNumberString,
} from "../../utils/format";
import "../../assets/styles/wallet.scss";
import { Button, ButtonSmart, Loader, TopTaskbar } from "..";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { getExplorerMetadata, isFxToken } from "../../utils/general";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import { useNavigate } from "react-router-dom";
import { config } from "../../config";
import classNames from "classnames";
import classes from "./MobileAssets.module.scss";
import ThresholdInput from "../ThresholdInput/ThresholdInput";
import { expandDecimals } from "../../utils/trade";
import { mobileMenu } from "./MobileMenu";
import { useLanguageStore } from "../../context/Translation";
import { useWalletTokensSorted } from "../../hooks/useWalletTokensSorted";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { TokenWithBalanceAndPrice } from "../../types/tokenInfo";
import { useUserBalanceStore } from "../../context/UserBalances";
import { getThemeFile } from "../../utils/ui";
import { useUiStore } from "../../context/UserInterface";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

const MobileAssets: React.FC = () => {
  const network = useConnectedNetwork() ?? DEFAULT_HLP_NETWORK;
  const navigate = useNavigate();
  const connectedAccount = useConnectedAccount();
  const { setActiveMenuItem } = useUiMobileStore();

  const { tokens, currency, isLoading } = useUserBalancesWithPrices({
    network,
  });
  const { sortedTokens } = useWalletTokensSorted(tokens);
  const onSendTokens = (token: string) => {
    navigate(`/sendtokens?sendToken=${token}`);
  };

  const onConvert = (token: string) => {
    setActiveMenuItem(
      mobileMenu.findIndex(menuItem => menuItem.title === "convert"),
    );
    navigate(`/convert?network=${network}&fromToken=${token}`);
  };

  return (
    <div>
      {connectedAccount && tokens ? (
        <MobileAssetsTable
          isLoading={isLoading}
          tokens={sortedTokens}
          network={network}
          onSetSendToken={onSendTokens}
          setConvertToken={onConvert}
          currency={currency}
        />
      ) : (
        <div
          className={classNames(
            "uk-flex uk-flex-column uk-flex-middle",
            classes.disconnectedWrapper,
          )}
        >
          <ButtonSmart
            className={classes.connectButton}
            size="small"
            network={network}
          />
        </div>
      )}
    </div>
  );
};

export default MobileAssets;

type MobileAssetsTableProps = {
  isLoading: boolean;
  tokens: TokenWithBalanceAndPrice[];
  network: Network;
  onSetSendToken: (tokenSymbol: string) => void;
  setConvertToken: (tokenSymbol: string) => void;
  currency: string;
};

const MobileAssetsTable: React.FC<MobileAssetsTableProps> = ({
  isLoading,
  tokens,
  network,
  onSetSendToken,
  setConvertToken,
  currency,
}) => {
  const { activeTheme } = useUiStore();
  const { tokenValueThreshold } = useUserBalanceStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const parentMenuItem = mobileMenu.find(menuItem =>
    menuItem.subordinatePaths?.includes("assets"),
  );

  return (
    <div className={classNames(classes.assetsWrapper)}>
      <div
        className={classNames(
          "uk-flex uk-flex-between uk-flex-middle",
          classes.assetsHeader,
        )}
      >
        <div className="uk-flex uk-flex-middle">
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className="uk-margin-small-right"
            onClick={() => navigate(`/${parentMenuItem?.title}`)}
          />
          <h4 className="uk-margin-remove-vertical">{t.walletAssets}</h4>
        </div>

        <ThresholdInput selectedCurrency={currency} />
      </div>

      <div className={classes.assetsListWrapper}>
        {isLoading && tokens.length === 0 && (
          <div className="uk-flex uk-flex-center uk-margin-medium-top">
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </div>
        )}

        {tokens.map((token, ix) => (
          <div
            key={token.symbol}
            className={classNames(classes.assetsContainer)}
          >
            <Row
              key={token.symbol}
              token={token}
              network={network}
              onSetSendToken={onSetSendToken}
              setConvertToken={setConvertToken}
              tokenValueThreshold={tokenValueThreshold}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

type RowProps = {
  token: TokenWithBalanceAndPrice;
  network: Network;
  onSetSendToken: (tokenSymbol: string) => void;
  setConvertToken: (tokenSymbol: string) => void;
  tokenValueThreshold: string;
};

const Row: React.FC<RowProps> = ({
  network,
  token,
  onSetSendToken,
  setConvertToken,
  tokenValueThreshold,
}) => {
  const connectedAccount = useConnectedAccount();
  const DISPLAY_IF_ZERO = "--";
  const displayIfNoValue = connectedAccount ? "loading" : DISPLAY_IF_ZERO;

  const displayBalance = token.balance
    ? bnToDisplayString(token.balance, token.decimals, 4)
    : displayIfNoValue;

  const value =
    token.price &&
    token.balance?.mul(token.price).div(expandDecimals(1, token.decimals));
  const displayValue = value
    ? bnToDisplayString(value, 18, 2)
    : displayIfNoValue;

  const explorerMetadata = getExplorerMetadata(token.address, "token", network);
  const isSpritesheetIcon = token.symbol === "FOREX" || isFxToken(token.symbol);

  const hideRow =
    displayValue &&
    (displayValue === "loading" ||
      Number(removeWholeNumberSeparatorsFromNumberString(displayValue)) <
        Number(tokenValueThreshold));

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        classes.assetContainer,
        {
          [classes.hideAsset]: hideRow,
        },
      )}
    >
      <div className={classNames(classes.assetDisplay)}>
        <SpritesheetIcon
          iconName={token.symbol}
          sizePx={22}
          style={{ marginTop: 0, marginBottom: -7 }}
          className={classNames("uk-margin-small-right", {
            [classes.assetIcon]: !isSpritesheetIcon && token.symbol !== "USDT",
            [classes.handleAssetIcon]: isSpritesheetIcon,
          })}
          fallbackSrc={token.logoURI ?? config.tokenIconPlaceholderUrl}
        />

        {(token.extensions?.isHlpToken || token.extensions?.isNative) && (
          <img
            className={classNames(classes.handleCollateralImage)}
            width="14"
            src="/assets/images/handle.fiLogoLightNewCut.png"
            alt="handle"
          />
        )}

        {token.symbol}
        {!token?.extensions?.isNative && (
          <Link
            href={explorerMetadata.url}
            target="_blank"
            className="uk-margin-small-left"
          >
            <FontAwesomeIcon icon={["fal", "external-link-square"]} />
          </Link>
        )}
      </div>

      <div className="uk-flex uk-flex-middle">
        <div
          className={classNames(
            "uk-flex uk-flex-column uk-flex-center uk-flex-bottom uk-margin-right",
            classes.assetValue,
          )}
        >
          {displayBalance}
          <sub>{displayValue} USD</sub>
        </div>

        <div
          className={classNames(
            "hfi-button-collection uk-flex uk-flex-middle",
            classes.assetButtonGroup,
          )}
        >
          <Button
            id={`${token.symbol}-send-button`}
            icon
            type="secondary"
            onClick={
              connectedAccount ? () => onSetSendToken(token.symbol) : undefined
            }
          >
            <FontAwesomeIcon icon={["fal", "paper-plane-top"]} />
          </Button>

          <Button
            id={`${token.symbol}-convert-button`}
            icon
            type="secondary"
            onClick={
              connectedAccount ? () => setConvertToken(token.symbol) : undefined
            }
          >
            <FontAwesomeIcon icon={["fal", "exchange"]} />
          </Button>
        </div>
      </div>
    </div>
  );
};
