import { HandleApiCallArgs } from "./index";
import { pairFromString } from "handle-sdk/dist/utils/general";
import {
  getIsLongFromValidatedStringInput,
  getPositionOrThrow,
  parseAssetSymbol,
  WEB3_WALLET_NOT_CONNECTED_ERROR,
} from "./closePosition";
import { parseUnits } from "ethers/lib.esm/utils";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { BigNumber } from "ethers";
import { GLP_PRICE_UNIT } from "../../../utils/trade";
import {
  Position,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";
import { transformDecimals } from "../../../utils/general";

export const openIncreasePosition = async ({
  request: {
    args: [
      longOrShort,
      assetSymbol,
      assetAmount,
      collateralSymbol,
      leverageOrCollateralAmount,
    ],
  },
  platform,
  positions,
  signer,
  gasPrice,
  slippage,
  fetchPositions,
}: HandleApiCallArgs): Promise<string> => {
  if (!signer) {
    return WEB3_WALLET_NOT_CONNECTED_ERROR;
  }
  assetSymbol = parseAssetSymbol(assetSymbol);
  const isLong = getIsLongFromValidatedStringInput(longOrShort);
  const pair = pairFromString(`${assetSymbol}/USD`);
  const position = getPositionOrThrow(positions, pair, isLong);
  const { leverageString, collateralAmountString } =
    getLeverageOrCollateralAmount(leverageOrCollateralAmount);
  const assetPrice = platform.getPrice({
    pair,
  });
  const inputCollateralToken = HandleTokenManagerInstance.getTokenBySymbol(
    collateralSymbol,
    DEFAULT_HLP_NETWORK,
  );
  const collateralPrice = platform.getPrice({
    pair: pairFromString(`${collateralSymbol}/USD`),
  });
  const indexDelta = parseUnits(assetAmount, PRICE_DECIMALS)
    .mul(assetPrice.index)
    .div(GLP_PRICE_UNIT);
  const collateralDelta = calculateCollateralDeltaAmount(
    inputCollateralToken.decimals,
    // @ts-ignore TODO IMPLEMENT/FIX
    position,
    indexDelta,
    collateralPrice.index,
    leverageString,
    collateralAmountString,
  );
  const tx = await platform.increasePosition({
    pair,
    collateralDelta,
    indexDelta,
    isLong,
    signer,
    collateralAddress: inputCollateralToken.address,
    slippagePercent: slippage,
    overrides: { gasPrice },
  });
  await tx.wait(1);
  // Refresh positions so that it shows up instantly for the user.
  fetchPositions();
  return "increased position successfully";
};

export const getLeverageOrCollateralAmount = (
  value: string,
): {
  leverageString?: string;
  collateralAmountString?: string;
} =>
  value.toLowerCase().includes("x")
    ? {
        // Remove all non-numeric characters from the string.
        leverageString: value.replace(/\D/g, ""),
      }
    : {
        collateralAmountString: value,
      };

export const calculateCollateralDeltaAmount = (
  collateralDecimals: number,
  position: Position,
  indexDelta: BigNumber,
  collateralPrice: BigNumber,
  newLeverageString?: string,
  newCollateralAmountString?: string,
): BigNumber => {
  if (newCollateralAmountString) {
    return parseUnits(newCollateralAmountString, collateralDecimals);
  }
  const targetLeverage = parseUnits(String(parseInt(newLeverageString!)), 4);
  if (position.collateral.gt(0)) {
    return position.collateral.mul(position.leverage).div(targetLeverage);
  }
  const collateralAmountUsd = transformDecimals(
    indexDelta,
    PRICE_DECIMALS,
    collateralDecimals,
  )
    .mul(BASIS_POINTS_DIVISOR)
    .div(targetLeverage);
  return collateralAmountUsd.mul(GLP_PRICE_UNIT).div(collateralPrice);
};
