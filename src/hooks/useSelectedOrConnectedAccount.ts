import { ethers } from "ethers";
import { Params, useParams } from "react-router-dom";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import { accountFromPathname } from "../utils/accountFromPathname";

export const useSelectedOrConnectedAccount = () => {
  const connectedAccount = useConnectedAccount();
  const { account: accountFromParams } = useParams() as Params;
  const accountFromPath = accountFromPathname();

  if (connectedAccount) return connectedAccount;
  if (accountFromParams && accountFromParams !== ethers.constants.AddressZero)
    return accountFromParams;
  // If this hook is used in context, check the pathname for an account.
  return accountFromPath;
};
