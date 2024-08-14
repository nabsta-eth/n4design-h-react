import React from "react";
import { DEFAULT_HIDE_TOKEN_VALUE_THRESHOLD } from "../config/constants";
import { walletValueThresholdLocalStorage } from "../utils/local-storage";

const useTokenThreshold = () => {
  const walletValueThresholdFromLocalStorage =
    walletValueThresholdLocalStorage.get();

  const [tokenValueThreshold, setTokenValueThreshold] = React.useState<string>(
    walletValueThresholdFromLocalStorage || DEFAULT_HIDE_TOKEN_VALUE_THRESHOLD,
  );

  const onShowThresholdInput = () => {
    setTokenValueThreshold(Number(tokenValueThreshold).toFixed(2).toString());
    setShowThresholdInput(true);
  };

  const [showThresholdInput, setShowThresholdInput] =
    React.useState<boolean>(false);

  return {
    onShowThresholdInput,
    showThresholdInput,
    setShowThresholdInput,
  };
};

export default useTokenThreshold;
