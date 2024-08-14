import * as React from "react";
import { Network } from "handle-sdk";
import {
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import SendTokensModal from "../SendTokensModal";
import onChangeSort from "../../utils/sort";
import WalletAssetsTable from "./WalletAssetsTable";
import { useWalletTokensSorted } from "../../hooks/useWalletTokensSorted";
import { useUserBalancesWithPrices } from "../../hooks/useUserBalancesWithPrices";
import { useSelectedOrConnectedAccount } from "../../hooks/useSelectedOrConnectedAccount";

const DEFAULT_NETWORK: Network = "arbitrum";

type Props = {
  show: boolean;
  currency: string;
};

const Wallet: React.FC<Props> = ({ show, currency }) => {
  const connectedNetwork = useConnectedNetwork();
  const connectedOrSelectedAccount = useSelectedOrConnectedAccount();
  const network = connectedNetwork || DEFAULT_NETWORK;
  const { connection } = useUserWalletStore();
  const { tokens, isLoading, isLoadingPrices, refreshBalance } =
    useUserBalancesWithPrices({
      network,
    });
  const [sendToken, onSetSendToken] = React.useState<string>();
  const { sortedTokens, sort, setSort } = useWalletTokensSorted(tokens);
  const [isLoadingInternal, setIsLoadingInternal] =
    React.useState<boolean>(isLoading);

  React.useEffect(() => {
    if (connection.user.isConnecting || !connectedOrSelectedAccount)
      return setIsLoadingInternal(false);
    setIsLoadingInternal(isLoading);
  }, [isLoading, connection.user.isConnecting, connectedOrSelectedAccount]);

  const closeSendTokenModal = (areTokensSent?: boolean) => {
    onSetSendToken(undefined);
    if (areTokensSent) refreshBalance();
  };

  const sendTokenInfo = tokens.find(t => t.symbol === sendToken);

  return (
    <div hidden={!show}>
      <WalletAssetsTable
        tokens={sortedTokens}
        network={network}
        onSetSendToken={onSetSendToken}
        isLoading={isLoadingInternal}
        isLoadingPrices={isLoadingPrices}
        currency={currency}
        sort={sort}
        onSetSort={setSort}
        onChangeSort={onChangeSort}
      />

      {sendToken && sendTokenInfo && (
        <SendTokensModal
          token={sendTokenInfo}
          network={network}
          onClose={closeSendTokenModal}
        />
      )}
    </div>
  );
};

export default Wallet;
