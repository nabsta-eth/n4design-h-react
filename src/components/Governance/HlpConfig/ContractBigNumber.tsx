import React, { useState } from "react";
import { InputNumber } from "../../index";
import { BigNumber, Signer } from "ethers";
import { InputNumberValue } from "../../InputNumber/InputNumber";
import {
  useConnectedNetwork,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Network } from "handle-sdk";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";

type Props = {
  initialValue: BigNumber;
  onRequestTransaction: (
    value: BigNumber,
    signer: Signer,
    network: Network,
  ) => any;
  onChangeLocal?: (value: BigNumber) => any;
  network?: Network;
  alert?: boolean;
};

const showError = (message: string) =>
  showNotification({
    status: "error",
    message,
  });

export const ContractBigNumber = (props: Props) => {
  const signer = useSigner();
  const network = useConnectedNetwork();
  const [value, setValue] = useState(props.initialValue);
  const changeValue = ({ bn }: InputNumberValue) => {
    setValue(bn);
    if (props.onChangeLocal) props.onChangeLocal(bn);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    if (!signer || !network)
      return showError("must connect wallet to submit update");
    if (props.network && network !== props.network)
      return showError(`must be connected to ${props.network}`);
    event.preventDefault();
    props.onRequestTransaction(value, signer, network);
  };
  return (
    <InputNumber
      id={"token-weight"}
      value={{
        string: value.toString(),
        bn: value,
      }}
      disabled={false}
      onChange={changeValue}
      decimals={0}
      inline={true}
      onKeyDown={handleKeyDown}
      alert={props.alert}
    />
  );
};
