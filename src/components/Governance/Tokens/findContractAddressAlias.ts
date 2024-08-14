import { config } from "handle-sdk";
import {
  getHlpContracts,
  HlpContracts,
} from "handle-sdk/dist/components/trade/platforms/hlp/config";

const contracts: Record<string, string> = {
  // Unknown cast is required because the ProtocolAddresses type is incorrect
  // and currently does not match the actual object value.
  ...(config.protocol.arbitrum.protocol as unknown as Record<string, string>),
  ...Object.keys(getHlpContracts("arbitrum")).reduce(
    (object, key) => ({
      ...object,
      [`hlp:${key}`]: getHlpContracts("arbitrum")[key as keyof HlpContracts],
    }),
    {},
  ),
  bridge: config.bridge.byNetwork.arbitrum.address,
  handleDAO: "0x623E035722E54d7819DF70CBc35d0b1C9f2F8f86",
};

/// Tries to find an address contract alias, returning null if not found.
export const findContractAddressAlias = (address: string) => {
  address = address.toLowerCase();
  for (let alias in contracts) {
    if (String(contracts[alias]).toLowerCase() == address) return alias;
  }
  return null;
};
