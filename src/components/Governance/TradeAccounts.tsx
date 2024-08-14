import React, { useCallback, useState } from "react";
import { GovernanceRoute } from "../../navigation/Governance";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { TradeAccountRole } from "handle-sdk/dist/components/trade";
import { ethers } from "ethers";
import Input from "../Input";
import Label from "@handle-fi/react-components/dist/components/handle_uikit/components/Label/Label";
import { Button } from "../index";
import { Erc721__factory } from "../../contracts";
import { config as sdkConfig, config } from "handle-sdk";
import useSendTransaction from "../../hooks/useSendTransaction";
import { DEFAULT_NOTIFICATIONS } from "../../config/notifications";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { getTradeNetworkOrNull } from "../../context/Trade";
import { TradeReaderSubgraph } from "handle-sdk/dist/components/trade/reader";

const DEFAULT_RECEIVER_ADDRESS = "0x000000000000000000000000000000000000DEAD";

const TradeAccounts = () => {
  const userAddress = useConnectedAccount() ?? ethers.constants.AddressZero;
  const network = getTradeNetworkOrNull(useConnectedNetwork());
  const { connection } = useUserWalletStore();
  const [ids] = usePromise(() => {
    if (!network) {
      return Promise.resolve([]);
    }
    return new TradeReaderSubgraph(
      sdkConfig.theGraphEndpoints[network].synths,
    ).getUserAccountIds(userAddress, TradeAccountRole.Owner);
  }, [userAddress, network]);
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const [inputId, setInputId] = useState("");
  React.useEffect(() => {
    if (ids && ids.length !== 0) setInputId(ids[0].toString());
  }, [ids]);
  const [toAddress, setToAddress] = useState(DEFAULT_RECEIVER_ADDRESS);
  const transferAccount = useCallback(() => {
    if (sendingTransaction || !connection.user.isConnected || !network) {
      return;
    }
    const account = Erc721__factory.connect(
      config.protocol[network].tradeAccount,
      connection.user.signer,
    );
    showNotification({
      status: "info",
      message: `transferring out account ${inputId}`,
    });
    sendTransaction(
      () => account.transferFrom(userAddress, toAddress, inputId),
      DEFAULT_NOTIFICATIONS,
    );
  }, [inputId, toAddress, sendingTransaction, sendTransaction]);
  return (
    <div>
      <h3 className="uk-margin-small-bottom">
        trade account ids owned by the connected user
      </h3>

      {ids?.map((id, ix) => (
        <span key={id}>
          {ix === 0 ? "id:" : ", "} {id}
        </span>
      ))}

      <div className="uk-margin-small-top">
        <Label content={"transfer account id"} />
        <Input
          id={"transfer-out-account-id"}
          value={inputId}
          onChange={setInputId}
        />
      </div>

      <div className="uk-margin-small-top">
        <Label content={"receiving address"} />
        <Input
          id={"transfer-out-account-receiving-address"}
          value={toAddress}
          onChange={setToAddress}
        />
      </div>

      <Button
        className="uk-margin-top"
        id={"transfer-out-account-button"}
        onClick={transferAccount}
        disabled={sendingTransaction || !connection.user.isConnected}
      >
        transfer out
      </Button>
    </div>
  );
};

export default {
  component: TradeAccounts,
  name: "Trade Accounts",
} as GovernanceRoute;
