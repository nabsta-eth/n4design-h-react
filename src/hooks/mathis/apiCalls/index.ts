import { fetchAssetPrice } from "./price";
import { Trade } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { closePosition } from "./closePosition";
import { BigNumber, Signer } from "ethers";
import { openIncreasePosition } from "./openIncreasePosition";
import { decreasePosition } from "./decreasePosition";
import { TranslationMap } from "src/types/translation";
import { Position } from "handle-sdk/dist/components/trade/position";

export type ApiCall = {
  callType: string;
  args: string[];
};

export type HandleApiCallArgs = {
  request: ApiCall;
  platform: Trade;
  positions: Position[];
  signer?: Signer;
  gasPrice?: BigNumber;
  slippage: number;
  fetchPositions: () => void;
  t: TranslationMap;
};

type ApiCallHandler = {
  type: string;
  handler: (args: HandleApiCallArgs) => Promise<string>;
};

const apiCallHandlers: ApiCallHandler[] = [
  {
    type: "ASSET_PRICE",
    handler: fetchAssetPrice,
  },
  {
    type: "OPEN_OR_INCREASE_POSITION",
    handler: openIncreasePosition,
  },
  {
    type: "DECREASE_POSITION",
    handler: decreasePosition,
  },
  {
    type: "CLOSE_POSITION",
    handler: closePosition,
  },
];

export const handleApiCall = async (
  args: HandleApiCallArgs,
): Promise<string> => {
  const handler = apiCallHandlers.find(
    handler => handler.type === args.request.callType,
  )?.handler;
  if (!handler) {
    throw new Error("handleApiCall: unsupported call type");
  }
  return handler(args);
};
