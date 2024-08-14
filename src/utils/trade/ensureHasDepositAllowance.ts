import { ensureHasAllowance } from "../ensureHasAllowance";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { SendTransaction } from "../../hooks/useSendTransaction";
import { useToken } from "../../context/TokenManager";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { BigNumber } from "ethers";
import { config } from "handle-sdk";
import { getTradeNetworkOrNull, USE_GASLESS } from "../../context/Trade";

export const useCheckDepositAllowance = (
  token: string,
  amount: InputNumberState,
  sendTransaction: SendTransaction,
  currentAllowance?: BigNumber,
): (() => Promise<boolean>) => {
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const network = getTradeNetworkOrNull(useConnectedNetwork());
  const tokenExtended = useToken(token, network ?? undefined);
  if (!signer || !connectedAccount || !tokenExtended || !network)
    throw new Error("Must have signer, connectedAccount and tokenExtended");
  if (USE_GASLESS) {
    return () => Promise.resolve(true);
  }
  return () =>
    ensureHasAllowance(
      connectedAccount,
      tokenExtended,
      config.protocol[network].tradeAccount,
      signer,
      amount.value.bn,
      sendTransaction,
      currentAllowance,
    );
};
