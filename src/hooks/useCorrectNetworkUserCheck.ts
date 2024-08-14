import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import React from "react";
import { useLocation } from "react-router-dom";
import { checkCorrectNetworkAndSendNotification } from "../utils/trade";
import { useLanguageStore } from "../context/Translation";

export const useCorrectNetworkUserCheck = () => {
  const connectedNetwork = useConnectedNetwork();
  const { t } = useLanguageStore();
  const activePath = useLocation().pathname;

  React.useEffect(() => {
    if (connectedNetwork) {
      checkCorrectNetworkAndSendNotification(t, connectedNetwork, activePath);
    }
  }, [activePath, connectedNetwork]);
};
