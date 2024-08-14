import { ethers } from "ethers";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputAddress, { InputAddressValue } from "../InputAddress";
import classes from "./InputAlternateAddress.module.scss";

type InputAlternateAddressProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLDivElement
>;

const DEFAULT_TAB = "wallet";

const InputAlternateAddress = (props: InputAlternateAddressProps) => {
  const { ...rest } = props;

  const { action, account } = useParams();
  const [alternateAddress, setAlternateAddress] = useState<InputAddressValue>({
    address: account || "",
    value: account || "",
  });
  const navigate = useNavigate();

  const onChangeAddressInternal = (newAddressOrENS: InputAddressValue) => {
    setAlternateAddress(newAddressOrENS);
    if (
      newAddressOrENS?.address &&
      ethers.utils.isAddress(newAddressOrENS.address)
    )
      navigate(
        `/dashboard/${action || DEFAULT_TAB}/${newAddressOrENS.address}`,
      );
  };

  const clearSearch = () => {
    setAlternateAddress({ address: "", value: "" });
    navigate(`/dashboard/${action || DEFAULT_TAB}`);
  };

  return (
    <div {...rest}>
      <form autoComplete="off" noValidate className="uk-flex uk-flex-middle">
        <InputAddress
          id="new-address"
          inputClassName={classes.address}
          placeholder="show address"
          value={alternateAddress}
          onChange={onChangeAddressInternal}
          truncate={true}
          style={{ height: 36 }}
          leftIcon={{
            prefix: "fal",
            name: "search",
          }}
          rightIcon={
            alternateAddress?.address !== "" && alternateAddress?.value !== ""
              ? {
                  prefix: "fal",
                  name: "times",
                  onClick: clearSearch,
                }
              : undefined
          }
        />
      </form>
    </div>
  );
};

export default InputAlternateAddress;
