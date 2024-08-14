import * as React from "react";
import { Network, TokenInfo, Vault } from "handle-sdk";
import { displayDollarsAndCents, bnToDisplayString } from "../utils/format";
import "../assets/styles/vaultdetails.scss";
import { Grid } from "@handle-fi/react-components/dist/components/handle_uikit/components/Grid";
import {
  Card,
  CardBody,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Card";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import classNames from "classnames";
import { ethers } from "ethers";
import { transformDecimals } from "../utils/general";
import { KASHI_MIN_COLLATERAL_RATIO } from "../config/kashi";
import {
  useHlpWrappedNativeToken,
  useNativeToken,
} from "../context/TokenManager";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";

// currently collateral is only supported on arbitrum
const NETWORK: Network = "arbitrum";

type DisplayVault = Pick<
  Vault,
  | "fxToken"
  | "debt"
  | "collateralAsFxToken"
  | "collateralRatio"
  | "minimumMintingRatio"
  | "interestRate"
> & {
  liquidationPrice: ethers.BigNumber;
};

type Props = {
  fxToken: string; // for display before vaults are loaded
  currentVault: DisplayVault | undefined;
  futureVault: DisplayVault | undefined;
  collateral: TokenInfo | undefined;
  kashiVault: boolean;
};

const VaultDetails: React.FC<Props> = ({
  fxToken,
  currentVault,
  futureVault,
  collateral,
  kashiVault,
}) => {
  const { activeTheme } = useUiStore();
  const currentVaultIsAtMinCr =
    currentVault?.collateralRatio.gt(0) &&
    currentVault?.collateralRatio.eq(currentVault?.minimumMintingRatio);

  const currentVaultIsBelowMinCr =
    currentVault?.collateralRatio.gt(0) &&
    currentVault?.collateralRatio.lte(currentVault?.minimumMintingRatio);

  const futureVaultIsBelowMinCr =
    futureVault?.collateralRatio.gt(0) &&
    futureVault?.collateralRatio.lt(futureVault?.minimumMintingRatio);

  const futureVaultIsAtMinCr =
    futureVault?.collateralRatio.gt(0) &&
    futureVault?.collateralRatio.eq(futureVault?.minimumMintingRatio);

  const calculateLiquidationPrice = (vault: DisplayVault | undefined) => {
    if (!vault || !collateral) return;
    const minimumCollateral = vault.debt
      .mul(ethers.constants.WeiPerEther)
      .div(KASHI_MIN_COLLATERAL_RATIO);
    const currentCollateral = transformDecimals(
      // @ts-ignore -- ! fix typing
      collateral.amount,
      collateral.decimals,
      vault.fxToken.decimals,
    );
    const liquidationPrice = minimumCollateral
      .mul(ethers.constants.WeiPerEther)
      .div(currentCollateral);
    return liquidationPrice;
  };

  const nativeToken = useNativeToken(NETWORK);
  const wrappedNativeToken = useHlpWrappedNativeToken(NETWORK);
  const collateralTokenSymbolToShow =
    collateral?.symbol === wrappedNativeToken?.symbol
      ? nativeToken?.symbol
      : collateral?.symbol;

  return (
    <Grid
      id="vault-details"
      gutter="small"
      className="uk-child-width-1-2@s"
      match={true}
    >
      <div>
        <Card
          size="small"
          className={classNames({
            "hfi-warning": currentVaultIsAtMinCr,
            "hfi-error": currentVaultIsBelowMinCr,
          })}
        >
          <CardBody className="uk-flex uk-flex-column hfi-vault-card">
            <p className={classNames("uk-margin-remove")}>collateral ratio</p>

            <h4 className="uk-margin-top">
              <span
                className={classNames({
                  "hfi-warning": currentVaultIsAtMinCr,
                  "hfi-error": currentVaultIsBelowMinCr,
                })}
              >
                {currentVault ? (
                  `${displayDollarsAndCents(
                    currentVault.collateralRatio.lte(0)
                      ? ethers.constants.Zero
                      : currentVault.collateralRatio.mul("100"),
                  )}%`
                ) : (
                  <Loader color={getThemeFile(activeTheme).primaryColor} />
                )}
              </span>

              {currentVault &&
                futureVault &&
                !futureVault.collateralRatio.eq(
                  currentVault.collateralRatio,
                ) && <span>{` => `}</span>}

              <span
                className={classNames("uk-margin-top", {
                  "hfi-warning": futureVaultIsAtMinCr,
                  "hfi-error": futureVaultIsBelowMinCr,
                })}
              >
                {currentVault &&
                  futureVault &&
                  !futureVault.collateralRatio.eq(
                    currentVault.collateralRatio,
                  ) &&
                  `${displayDollarsAndCents(
                    futureVault.collateralRatio.mul("100"),
                  )}%`}
              </span>
            </h4>
          </CardBody>
        </Card>
      </div>

      <div>
        <Card size="small">
          <CardBody className="uk-flex uk-flex-column hfi-vault-card">
            <p className="uk-margin-remove">interest rate</p>
            <h4 className="uk-margin-top">
              {futureVault ? (
                `${bnToDisplayString(
                  futureVault?.interestRate.mul(100),
                  18,
                  2,
                )}%`
              ) : (
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              )}
            </h4>
          </CardBody>
        </Card>
      </div>
      <div>
        <Card size="small">
          <CardBody className="uk-flex uk-flex-column hfi-vault-card">
            <p className="uk-margin-remove">{`debt (${fxToken})`}</p>
            <h4 className="uk-margin-top">
              {currentVault ? (
                `${bnToDisplayString(currentVault.debt, 18, 2)}`
              ) : (
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              )}
              {currentVault &&
                futureVault &&
                !futureVault.debt.eq(currentVault.debt) &&
                ` => ${
                  futureVault.debt.gt(0)
                    ? bnToDisplayString(futureVault.debt, 18, 2)
                    : "0.00"
                }`}
            </h4>
          </CardBody>
        </Card>
      </div>
      <div>
        <Card size="small">
          <CardBody className="uk-flex uk-flex-column hfi-vault-card">
            <p className="uk-margin-remove">
              {`collateral value (${fxToken.slice(-3)})`}
            </p>
            <h4 className="uk-margin-top">
              {currentVault ? (
                `${bnToDisplayString(currentVault.collateralAsFxToken, 18, 2)}`
              ) : (
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              )}
              {currentVault &&
                futureVault &&
                !futureVault.collateralAsFxToken.eq(
                  currentVault.collateralAsFxToken,
                ) &&
                ` => ${bnToDisplayString(
                  futureVault.collateralAsFxToken,
                  18,
                  2,
                )}`}
            </h4>
          </CardBody>
        </Card>
      </div>
      <div>
        <Card size="small">
          <CardBody className="uk-flex uk-flex-column hfi-vault-card">
            <p className="uk-margin-remove">
              {`liquidation price ${
                collateral
                  ? `(${collateralTokenSymbolToShow}/${fxToken.slice(-3)})`
                  : ""
              }`}
            </p>
            <h4 className="uk-margin-top">
              {currentVault && collateral ? (
                `${bnToDisplayString(
                  kashiVault
                    ? calculateLiquidationPrice(currentVault) ||
                        ethers.constants.Zero
                    : currentVault.liquidationPrice,
                  currentVault.fxToken.decimals,
                  2,
                )}`
              ) : (
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              )}
              {currentVault &&
                futureVault &&
                collateral &&
                !futureVault.liquidationPrice.eq(
                  currentVault.liquidationPrice,
                ) &&
                ` => ${bnToDisplayString(
                  kashiVault
                    ? calculateLiquidationPrice(futureVault) ||
                        ethers.constants.Zero
                    : futureVault.liquidationPrice,
                  currentVault.fxToken.decimals,
                  2,
                )}`}
            </h4>
          </CardBody>
        </Card>
      </div>
    </Grid>
  );
};

export default VaultDetails;
