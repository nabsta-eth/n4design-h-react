import { ethers } from "ethers";
import React, { useEffect } from "react";
import { truncateAddress } from "../utils/format";
import { getMockSigner } from "@handle-fi/react-components/dist/utils/web3";
import Input, { Props as InputProps } from "./Input";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";

export type InputAddressValue = {
  value: string;
  address: string | undefined;
};

type Props = Omit<InputProps, "value" | "onChange"> & {
  value: InputAddressValue;
  onChange: (value: InputAddressValue) => void;
  truncate?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
};

// ENS currency only on ethereum
const provider = getMockSigner("ethereum").provider!;

const InputAddress: React.FC<Props> = (props: Props) => {
  const {
    value: { value, address },
    onChange,
    truncate,
    alert,
    ref,
    ...rest
  } = props;
  const { activeTheme } = useUiStore();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [addressFromENS, setAddressFromENS] = React.useState<{
    address: string;
    ens: string;
  }>();

  const onChangeInternal = React.useCallback(
    async (newValue: string) => {
      setAddressFromENS(undefined);
      onChange({
        value: newValue,
        address: ethers.utils.isAddress(newValue) ? newValue : undefined,
      });

      if (!newValue?.toLowerCase().endsWith(".eth")) {
        return;
      }

      setLoading(true);
      try {
        const address = await provider.resolveName(newValue);
        if (address) {
          setAddressFromENS({
            address,
            ens: newValue,
          });
        }

        onChange({
          value: newValue,
          address: address ? address : "",
        });
      } catch (error) {
        console.error("Failed to fetch ENS", error);
      }
      setLoading(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (addressFromENS && value === addressFromENS.ens) {
      onChange({
        value: addressFromENS.address,
        address: addressFromENS.address,
      });
    }
  }, [addressFromENS, value, onChange]);

  const alertInternal = alert || (!!value && !address && !loading);

  const rightComponent = loading && (
    <Loader
      size={6}
      className="uk-margin-small-right"
      color={getThemeFile(activeTheme).primaryColor}
    />
  );

  const displayAddressValue = () => {
    return addressFromENS?.ens && value
      ? addressFromENS.ens
      : ethers.utils.isAddress(value) && truncate
      ? `${truncateAddress(value)}`
      : value;
  };

  return (
    <Input
      ref={ref}
      value={displayAddressValue()}
      alert={alertInternal}
      onChange={onChangeInternal}
      rightComponent={rightComponent}
      {...rest}
    />
  );
};

export default InputAddress;
