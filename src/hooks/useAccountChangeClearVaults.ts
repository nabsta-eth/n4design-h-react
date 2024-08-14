import React from "react";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useVaultStore } from "../context/Vaults";

export const useAccountChangeClearVaults = () => {
  const network = useConnectedNetwork();
  const account = useConnectedAccount();
  const { clearVaults } = useVaultStore();
  React.useEffect(() => clearVaults(), [network, account]);
};
