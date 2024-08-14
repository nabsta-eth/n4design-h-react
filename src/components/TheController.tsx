import * as React from "react";
import { usePricesStore, useTokenUsdPrice } from "../context/Prices";
import { useProtocolStore } from "../context/Protocol";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";

let fetchGasInterval: NodeJS.Timer | undefined;

// Do all app wide initialisation and cross store reactions
// here so it is easier to track and optimize.
const TheController: React.FC = props => {
  const { fetchGasPrice } = useUserWalletStore();
  const { fetchNativeTokenPrices } = usePricesStore();
  const { fetchCollaterals, fetchFxTokens, fetchProtocolParameters } =
    useProtocolStore();

  // fetch forex price
  useTokenUsdPrice({
    tokenSymbol: "FOREX",
    fetch: true,
  });

  React.useEffect(() => {
    fetchCollaterals();
  }, [fetchCollaterals]);

  React.useEffect(() => {
    fetchFxTokens();
  }, [fetchFxTokens]);

  React.useEffect(() => {
    fetchProtocolParameters();
  }, [fetchProtocolParameters]);

  // fetch gas price very 30 seconds
  React.useEffect(() => {
    fetchGasPrice();
    if (fetchGasInterval) {
      return;
    }

    fetchGasInterval = setInterval(() => {
      fetchGasPrice();
    }, 30000);

    return () => {
      if (fetchGasInterval) {
        clearInterval(fetchGasInterval);
      }
    };
  }, [fetchGasPrice]);

  React.useEffect(() => {
    fetchNativeTokenPrices();
  }, [fetchNativeTokenPrices]);

  return <React.Fragment>{props.children}</React.Fragment>;
};

export default TheController;
