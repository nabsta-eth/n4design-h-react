import { BigNumber, constants, providers } from "ethers";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Everything has to be compared with bignumbers because of arbitrary data padding in logs
const bnCompare = (a: any, b: any) => BigNumber.from(a).eq(BigNumber.from(b));

export const getTransfersFromLogs = (
  receipt: providers.TransactionReceipt,
  fromToken: string,
  toToken: string,
) => {
  const account = receipt.from;
  const transfers = receipt.logs.filter(log =>
    bnCompare(log.topics[0], TRANSFER_TOPIC),
  );

  const fromTransfers = transfers.filter(t => bnCompare(t.address, fromToken));
  const toTransfers = transfers.filter(t => bnCompare(t.address, toToken));

  const accountTransfersFrom = fromTransfers.filter(log =>
    bnCompare(log.topics[1], account),
  );
  const accountTransfersTo = toTransfers.filter(log =>
    bnCompare(log.topics[2], account),
  );

  const fromAmount = accountTransfersFrom.reduce(
    (acc, log) => acc.add(log.data),
    constants.Zero,
  );
  const toAmount = accountTransfersTo.reduce(
    (acc, log) => acc.add(log.data),
    constants.Zero,
  );

  return {
    fromAmount,
    toAmount,
  };
};
