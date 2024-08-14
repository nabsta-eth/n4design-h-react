import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import Markets from "../Markets/Markets";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";

const PopoutMarkets = () => {
  const network = useConnectedNetwork() || DEFAULT_HLP_NETWORK;
  return <Markets network={network} noBorder />;
};

export default PopoutMarkets;
