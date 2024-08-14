import React from "react";
import { ethers } from "ethers";
import { useToken } from "../../context/TokenManager";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import { config } from "../../config";
import classNames from "classnames";
import classes from "./HlpCompositionModal.module.scss";
import { bnToDisplayString, valueToDisplayString } from "../../utils/format";
import { getTokenAmountDisplayDecimals } from "../../utils/general";
import { PRICE_UNIT, expandDecimals } from "../../utils/trade";
import { useHlpVaultBalance } from "../../context/HlpVaultBalance";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";
import { isSameAddress } from "handle-sdk/dist/utils/general";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import {
  fetchLiquidityInfo,
  LiquidityInfo,
} from "handle-sdk/dist/components/trade/platforms/hlp/internals/tokens";
import { useUiStore } from "../../context/UserInterface";
import { getFxTokenPriceUsdH2so } from "../../utils/oracle";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { getThemeFile } from "../../utils/ui";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

type Props = {
  show: boolean;
  onClose: () => void;
};

type HlpConstituentTokenProps = {
  symbol: string;
  value: number;
  price: ethers.BigNumber;
  maxValue: number;
  targetWeightPercent: number;
  liquidityInfo: LiquidityInfo | undefined;
};

const network = DEFAULT_HLP_NETWORK;

const HlpCompositionModal = ({ show, onClose }: Props) => {
  const hlpTokenInfo = useToken("hLP", network);
  const [hlpConstituentTokens, , isLoading] = usePromise(() =>
    hlp.internals.fetchTokens(),
  );
  const { balances } = useHlpVaultBalance();
  const [tokenUsdHlpAmounts] = usePromise(() =>
    hlp.internals.getAllTokenUsdHlpAmounts(),
  );
  const [liquidityInfo, setLiquidityInfo] = React.useState<
    Map<string, LiquidityInfo>
  >(new Map());
  const { showChooseWalletModal, activeTheme } = useUiStore();

  React.useEffect(() => {
    if (!hlpConstituentTokens) return;
    fetchLiquidityInfo(
      hlpConstituentTokens.map(token => token.address),
      network,
    ).then(setLiquidityInfo);
  }, [hlpConstituentTokens]);

  const { totalUsdAmount, hlpDetails } = React.useMemo(() => {
    const hlpDetails: HlpConstituentTokenProps[] = [];
    let total = 0;
    if (!tokenUsdHlpAmounts || !hlpConstituentTokens)
      return {
        totalUsdAmount: 0,
        hlpDetails: [],
      };
    for (const hlpConstituentToken of hlpConstituentTokens) {
      const usdHlpAmount =
        tokenUsdHlpAmounts[hlpConstituentToken.address.toLowerCase()];
      if (usdHlpAmount.eq(0)) continue;
      const balance = balances.find(({ token }) =>
        isSameAddress(token.address, hlpConstituentToken.address),
      );
      const hlpConstituentTokenInfo =
        HandleTokenManagerInstance.getTokenByAddress(
          hlpConstituentToken.address,
          network,
        );
      const price = balance
        ? getFxTokenPriceUsdH2so(hlpConstituentTokenInfo.symbol) ??
          ethers.constants.Zero
        : ethers.constants.Zero;
      const value = balance?.balance
        ?.mul(price)
        .div(expandDecimals(1, hlpConstituentToken.tokenDecimals));
      const valueNum = +ethers.utils.formatUnits(value ?? 0, PRICE_DECIMALS);
      const usdHlpAmountParseFactor =
        hlpConstituentToken.tokenDecimals - PRICE_DECIMALS;
      const maxUsdHlpAmount =
        hlpConstituentToken.maxUsdHlpAmount ?? ethers.constants.Zero;
      const maxUsdHlpAmountNumber =
        +maxUsdHlpAmount.div(
          ethers.utils.parseUnits("1", usdHlpAmountParseFactor),
        ) / +PRICE_UNIT;
      hlpDetails.push({
        symbol: hlpConstituentTokenInfo.symbol,
        price,
        value: valueNum,
        maxValue: maxUsdHlpAmountNumber,
        targetWeightPercent:
          hlpConstituentToken.tokenWeight / BASIS_POINTS_DIVISOR,
        liquidityInfo: liquidityInfo.get(
          hlpConstituentToken.address.toLowerCase(),
        ),
      });
      total += valueNum;
    }
    hlpDetails.sort((a, b) => b.value - a.value);
    return {
      totalUsdAmount: total,
      hlpDetails,
    };
  }, [hlpConstituentTokens, tokenUsdHlpAmounts, liquidityInfo]);

  return (
    <Modal
      show={show}
      onClose={onClose}
      modalClasses={classNames("uk-padding-remove-bottom", classes.modal)}
      showChooseWalletModal={showChooseWalletModal}
    >
      <ul className="uk-nav uk-dropdown-nav handle-select">
        <li
          className={classNames(
            "uk-margin-small-bottom uk-h4",
            classes.modalTitle,
          )}
        >
          <span className="uk-margin-small-right uk-position-relative">
            <Image
              className={classNames("uk-position-relative", classes.hlpLogo)}
              width="24"
              src={hlpTokenInfo?.logoURI ?? config.tokenIconPlaceholderUrl}
              alt={hlpTokenInfo?.symbol}
            />
          </span>
          hLP breakdown
        </li>

        <li className="uk-nav-divider"></li>

        <li>
          <div
            className={classNames(
              "uk-flex uk-flex-between uk-flex-middle",
              classes.headerRow,
            )}
          >
            <div
              className={classNames(
                "uk-flex uk-flex-middle uk-flex-1",
                classes.tokenColumn,
              )}
            >
              token
            </div>
            <div className="uk-flex-1 uk-text-right">price</div>
            <div className="uk-flex-1 uk-text-right">pool (USD)</div>
            <div className="uk-flex-1 uk-text-right">curr/target wgt</div>
            <div className="uk-flex-1 uk-text-right">utilisation</div>
          </div>
        </li>

        {isLoading && (
          <li
            key="loading"
            className={classNames(
              "uk-flex uk-flex-middle uk-flex-center",
              classes.row,
            )}
          >
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </li>
        )}
        {hlpDetails.map(hlpConstituentToken => (
          <li
            key={hlpConstituentToken.symbol}
            className={classNames("uk-flex", classes.row)}
          >
            <HlpRow
              hlpConstituentToken={hlpConstituentToken}
              totalUsdAmount={totalUsdAmount}
            />
          </li>
        ))}
        <li></li>
      </ul>
    </Modal>
  );
};

type HlpRowProps = {
  hlpConstituentToken: HlpConstituentTokenProps;
  totalUsdAmount: number;
};

const HlpRow = (props: HlpRowProps) => {
  const { hlpConstituentToken, totalUsdAmount } = props;
  const logoUri = useToken(hlpConstituentToken.symbol, network)?.logoURI;
  const precision = getTokenAmountDisplayDecimals(hlpConstituentToken.symbol);
  const priceDisplay = bnToDisplayString(
    hlpConstituentToken.price,
    PRICE_DECIMALS,
    precision,
  );

  const utilisationDisplay = hlpConstituentToken.liquidityInfo?.reservedAmount
    ? bnToDisplayString(
        hlpConstituentToken.liquidityInfo?.reservedAmount
          .mul(BASIS_POINTS_DIVISOR)
          .div(hlpConstituentToken.liquidityInfo.poolAmount),
        2,
      )
    : "0.00";

  const currentWeightPercent =
    (hlpConstituentToken.value / totalUsdAmount) * 100;

  return (
    <div
      className={classNames(
        "uk-flex uk-width-expand uk-flex-between uk-flex-middle",
        classes.container,
      )}
    >
      <div
        className={classNames(
          "uk-flex uk-flex-middle uk-flex-1",
          classes.tokenColumn,
        )}
      >
        <SpritesheetIcon
          iconName={hlpConstituentToken.symbol}
          sizePx={24}
          style={{ marginTop: 1 }}
          className="uk-margin-xsmall-right"
          fallbackSrc={logoUri ?? config.tokenIconPlaceholderUrl}
        />
        {hlpConstituentToken.symbol}
      </div>

      <div className="uk-flex-1 uk-text-right">{priceDisplay}</div>

      <div className="uk-flex-1 uk-text-right">
        {valueToDisplayString(
          hlpConstituentToken.value,
          hlpConstituentToken.symbol,
          2,
        )}
      </div>

      <div className="uk-flex-1 uk-text-right">
        <span
          className={classNames({
            [classes.aboveTarget]:
              currentWeightPercent > hlpConstituentToken.targetWeightPercent,
          })}
        >
          {valueToDisplayString(
            (hlpConstituentToken.value / totalUsdAmount) * 100,
            hlpConstituentToken.symbol,
            2,
          )}
          %
        </span>
        {" / "}
        {valueToDisplayString(
          hlpConstituentToken.targetWeightPercent,
          hlpConstituentToken.symbol,
          2,
        )}
        %
      </div>

      <div className="uk-flex-1 uk-text-right">{utilisationDisplay}%</div>
    </div>
  );
};

export default HlpCompositionModal;
