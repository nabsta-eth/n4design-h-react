import { Network } from "handle-sdk";
import {
  Table,
  TableBody,
  TableRow,
  TableData,
  TableHead,
  TableHeadData,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import "../assets/styles/vaultcollaterallist.scss";
import { collateralsSDK } from "../context/Protocol";
import {
  useHlpWrappedNativeToken,
  useNativeToken,
} from "../context/TokenManager";
import { bnToDisplayString, fxTokenSymbolToCurrency } from "../utils/format";
import { ethers } from "ethers";
import classNames from "classnames";
import { useMediaQueries } from "../hooks/useMediaQueries";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { config } from "../config";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

// currently collateral is only supported on arbitrum
const NETWORK: Network = "arbitrum";

type Collateral = {
  symbol: string;
  decimals: number;
  currentAmount: ethers.BigNumber;
  futureAmount: ethers.BigNumber;
  currentValue: ethers.BigNumber;
  futureValue: ethers.BigNumber;
};

type Props = {
  collaterals: Collateral[] | undefined;
  fxTokenSymbol: string | undefined;
};

const VaultCollateralList: React.FC<Props> = ({
  collaterals,
  fxTokenSymbol,
}) => {
  const { activeTheme } = useUiStore();
  const mediaQueries = useMediaQueries();

  const nativeToken = useNativeToken(NETWORK);
  const wrappedNativeToken = useHlpWrappedNativeToken(NETWORK);

  const displayAmount = (collateral: Collateral, amount: ethers.BigNumber) => {
    return bnToDisplayString(
      amount,
      collateral.decimals,
      ["WETH", "ETH"].includes(collateral.symbol) ? 4 : 2,
    );
  };

  let body;

  if (!collaterals || !fxTokenSymbol) {
    body = (
      <TableRow key="empty" className="last">
        <TableData colSpan={3}>
          <Loader color={getThemeFile(activeTheme).primaryColor} />
        </TableData>
      </TableRow>
    );
  } else if (!collaterals.length) {
    body = (
      <TableRow key="empty" className="last">
        <TableData colSpan={3}>no collateral deposited</TableData>
      </TableRow>
    );
  } else {
    body = collaterals.map((collateral, index) => {
      const last = index === collaterals.length - 1;

      const collateralTokenSymbolToShow =
        collateral.symbol === wrappedNativeToken?.symbol
          ? nativeToken?.symbol
          : collateral.symbol;

      const displayCurrentAmount = displayAmount(
        collateral,
        collateral.currentAmount,
      );

      const displayFutureAmount =
        !collateral.currentAmount.eq(collateral.futureAmount) &&
        displayAmount(collateral, collateral.futureAmount);

      const displayCurrentValue = bnToDisplayString(
        collateral.currentValue,
        18,
        2,
      );

      const displayFutureValue =
        !collateral.currentAmount.eq(collateral.futureAmount) &&
        bnToDisplayString(collateral.futureValue, 18, 2);

      if (!collateralTokenSymbolToShow) {
        console.warn(
          "Token symbol not found for collateral",
          collateral.symbol,
        );
        return null;
      }

      return (
        <TableRow
          key={collateral.symbol}
          className={classNames({
            last,
          })}
        >
          <TableData width="1-5" label="asset">
            <div className="">
              <SpritesheetIcon
                iconName={collateralTokenSymbolToShow}
                sizePx={22}
                style={{ marginTop: 0, marginBottom: -7 }}
                className="uk-margin-xsmall-right"
                fallbackSrc={config.tokenIconPlaceholderUrl}
              />
              {collateralTokenSymbolToShow}
            </div>
          </TableData>

          <TableData width="2-5" label="amount">
            <div
              className={classNames("uk-flex", {
                "uk-flex-right": mediaQueries.maxTablet,
              })}
            >
              <div>{displayCurrentAmount}</div>

              <div
                className={classNames("uk-text-center", {
                  "uk-margin-xsmall-left uk-margin-xsmall-right":
                    displayFutureAmount,
                })}
              >
                {displayFutureAmount && "=>"}
              </div>

              <div className="uk-text-right">{displayFutureAmount}</div>
            </div>
          </TableData>

          <TableData
            width="2-5"
            label={`value (${fxTokenSymbolToCurrency(fxTokenSymbol)})`}
          >
            <div
              className={classNames("uk-flex", {
                "uk-flex-right": mediaQueries.maxTablet,
              })}
            >
              <div className="">{displayCurrentValue}</div>

              <div
                className={classNames("uk-text-center", {
                  "uk-margin-xsmall-left uk-margin-xsmall-right":
                    displayFutureValue,
                })}
              >
                {displayFutureValue ? "=>" : ""}
              </div>

              <div className="uk-text-right">{displayFutureValue}</div>
            </div>
          </TableData>
        </TableRow>
      );
    });
  }

  return (
    <Table
      id="vault-collateral"
      size="xs"
      divider
      className="uk-margin-remove-bottom uk-margin-small-top"
    >
      <TableHead>
        <TableRow>
          <TableHeadData>asset</TableHeadData>
          <TableHeadData>amount</TableHeadData>
          <TableHeadData>
            value ({fxTokenSymbolToCurrency(fxTokenSymbol ?? "fxAUD")})
          </TableHeadData>
        </TableRow>
      </TableHead>

      <TableBody>{body}</TableBody>
    </Table>
  );
};

export default VaultCollateralList;
