import { HandleApiCallArgs } from "./index";
import { pairFromString } from "handle-sdk/dist/utils/general";
import {
  getIsLongFromValidatedStringInput,
  getPositionOrThrow,
  parseAssetSymbol,
  WEB3_WALLET_NOT_CONNECTED_ERROR,
} from "./closePosition";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import {
  calculateCollateralDeltaAmount,
  getLeverageOrCollateralAmount,
} from "./openIncreasePosition";
import { parseUnits } from "ethers/lib.esm/utils";
import { GLP_PRICE_UNIT } from "../../../utils/trade";

export const decreasePosition = async ({
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
  const assetDecimals = HandleTokenManagerInstance.getTokenBySymbol(
    assetSymbol,
    DEFAULT_HLP_NETWORK,
  ).decimals;
  const position = getPositionOrThrow(positions, pair, isLong);
  const { leverageString, collateralAmountString } =
    getLeverageOrCollateralAmount(leverageOrCollateralAmount);
  const assetPrice = platform.getPrice({
    pair,
  });
  const collateralPrice = platform.getPrice({
    pair: pairFromString(`${collateralSymbol}/USD`),
  });
  const receiveCollateralToken = HandleTokenManagerInstance.getTokenBySymbol(
    collateralSymbol,
    DEFAULT_HLP_NETWORK,
  );
  const positionCollateralToken = HandleTokenManagerInstance.getTokenByAddress(
    // @ts-ignore TODO IMPLEMENT/FIX
    position.collateralAddress,
    DEFAULT_HLP_NETWORK,
  );
  const indexDelta = parseUnits(assetAmount, assetDecimals)
    .mul(assetPrice.index)
    .div(GLP_PRICE_UNIT);
  const collateralDelta = calculateCollateralDeltaAmount(
    positionCollateralToken.decimals,
    // @ts-ignore TODO IMPLEMENT/FIX
    position,
    indexDelta,
    collateralPrice.index,
    leverageString,
    collateralAmountString,
  );
  const tx = await platform.decreasePosition({
    // @ts-ignore TODO IMPLEMENT/FIX
    collateralAddress: position.collateralAddress,
    receiveCollateralAddress: receiveCollateralToken.address,
    // @ts-ignore TODO IMPLEMENT/FIX
    pair: position.pair,
    isLong: position.isLong,
    indexDelta,
    collateralDelta,
    signer,
    overrides: { gasPrice },
    slippagePercent: slippage,
  });
  await tx.wait(1);
  // Refresh positions so that it shows up instantly for the user.
  fetchPositions();
  return "decreased position successfully";
};
