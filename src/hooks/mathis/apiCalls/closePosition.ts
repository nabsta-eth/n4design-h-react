import { ethers } from "ethers";
import {
  isSamePair,
  pairFromString,
  pairToString,
} from "handle-sdk/dist/utils/general";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { Pair } from "handle-sdk/dist/types/trade";
import { HandleApiCallArgs } from "./index";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { replaceNativeSymbolForWrapped } from "../../../utils/general";
import { HLP_PLATFORM_NAME } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { TokenInfo } from "handle-sdk";
import { Position } from "handle-sdk/dist/components/trade/position";
import { useToken } from "../../../context/TokenManager";
import { CHAIN_ID_TO_NETWORK_NAME } from "handle-sdk/dist/constants";

export const WEB3_WALLET_NOT_CONNECTED_ERROR = "web3 wallet is not connected";

const RECEIVE_TOKEN_SYMBOL = "fxUSD";

export const closePosition = async ({
  request: {
    args: [longOrShort, assetSymbol],
  },
  platform,
  positions,
  signer,
  gasPrice,
  slippage,
  fetchPositions,
  t,
}: HandleApiCallArgs): Promise<string> => {
  if (!signer) {
    return WEB3_WALLET_NOT_CONNECTED_ERROR;
  }
  assetSymbol = parseAssetSymbol(assetSymbol);
  const isLong = getIsLongFromValidatedStringInput(longOrShort);
  const pair = pairFromString(`${assetSymbol}/USD`);
  const position = getPositionOrThrow(positions, pair, isLong);
  const network = await signer
    .provider!.getNetwork()
    .then(network => CHAIN_ID_TO_NETWORK_NAME[network.chainId]);
  const receiveCollateralToken = useToken(RECEIVE_TOKEN_SYMBOL, network);
  const tx = await platform.decreasePosition({
    // @ts-ignore TODO IMPLEMENT/FIX
    collateralAddress: position.collateralAddress,
    // @ts-ignore TODO IMPLEMENT/FIX
    receiveCollateralAddress: receiveCollateralToken.address,
    // @ts-ignore TODO IMPLEMENT/FIX
    pair: position.pair,
    isLong: position.isLong,
    indexDelta: position.size,
    // Fully closing position, therefore collateral delta may be zero.
    collateralDelta: ethers.constants.Zero,
    signer,
    overrides: { gasPrice },
    slippagePercent: slippage,
  });
  await tx.wait(1);
  // Refresh positions so that it shows up instantly for the user.
  fetchPositions();
  return t.closePositionSuccessToast;
};

export const getIsLongFromValidatedStringInput = (value: string): boolean => {
  if (value.toLowerCase() === "long") {
    return true;
  }
  if (value.toLowerCase() === "short") {
    return false;
  }
  throw "long or short parameter not valid";
};

export const getPositionOrThrow = (
  positions: Position[],
  pair: Pair,
  isLong: boolean,
): Position => {
  const position = positions.find(p => isSamePair(pair, p.pairId.pair));
  if (!position) {
    const stringifiedLongShort = isLong ? "long" : "short";
    throw `${stringifiedLongShort} position not found for pair ${pairToString(
      pair,
    )}`;
  }
  return position;
};

export const parseAssetSymbol = (symbol: string): string => {
  // Trade platforms use WETH, not ETH.
  return replaceNativeSymbolForWrapped(symbol);
};

export const getDefaultReceiveCollateralToken = (
  platformName: string,
): TokenInfo => {
  const symbol = platformName === HLP_PLATFORM_NAME ? "fxUSD" : "USDC.e";
  return HandleTokenManagerInstance.getTokenBySymbol(
    symbol,
    DEFAULT_HLP_NETWORK,
  );
};
