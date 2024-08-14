import * as React from "react";
import { ethers } from "ethers";
import {
  getIsKashiApproved,
  signKashiApproval,
  SingleCollateralVaultNetwork,
} from "handle-sdk";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import { getMockSigner } from "@handle-fi/react-components/dist/utils/web3";

const useSingleCollateralVaultDepositApproval = (
  account: string | undefined,
  network: SingleCollateralVaultNetwork,
): [boolean | undefined, () => Promise<ethers.Signature>] => {
  const signer = useSigner();

  const [approved, setApproved] = React.useState<boolean>();

  React.useEffect(() => {
    (async () => {
      if (!signer || !account) {
        return;
      }

      const mockSigner = getMockSigner(network);

      const approved = await getIsKashiApproved(account, network, mockSigner);

      setApproved(approved);
    })();
  }, [signer, network, account]);

  const getSignedApproval = React.useCallback(() => {
    if (!signer || !account) {
      throw new Error('"signer" is required');
    }

    return signKashiApproval(account, network, signer);
  }, [signer, account, network]);

  return [approved, getSignedApproval as () => Promise<ethers.Signature>];
};

export default useSingleCollateralVaultDepositApproval;
