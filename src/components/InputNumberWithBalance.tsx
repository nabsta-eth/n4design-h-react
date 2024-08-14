import { ethers } from "ethers";
import { Network, TokenInfo } from "handle-sdk";
import React, { useEffect } from "react";
import { useToken } from "../context/TokenManager";
import { useLanguageStore } from "../context/Translation";
import { BalanceWithLoading, useBalance } from "../context/UserBalances";
import { bnToDisplayString } from "../utils/format";
import InputNumber, {
  Props as InputNumberProps,
} from "./InputNumber/InputNumber";
import { useNetworkOrDefault } from "../hooks/useNetworkOrDefault";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";

type IsOverBalanceCallback = (isOverBalance: boolean) => void;

type Props = Omit<InputNumberProps, "rightLabel" | "decimals" | "min"> & {
  tokenSymbol: string | undefined;
  network: Network | undefined;
  rightLabel?: string;
  disableAlertOnOverBalance?: boolean;
  disableMaxButton?: boolean;
  balanceDecimals?: number;
  onIsOverBalance?: IsOverBalanceCallback;
};

const InputNumberWithBalance: React.FC<Props> = (props: Props) => {
  const {
    disableAlertOnOverBalance,
    tokenSymbol,
    network: inputNetwork,
    alert,
    value,
    rightLabel,
    max,
    disableMaxButton,
    balanceDecimals,
    onIsOverBalance,
    ...rest
  } = props;
  const network = useNetworkOrDefault(inputNetwork);
  const token = useToken(tokenSymbol, network);
  const { balance, isLoading } = useBalance({
    tokenSymbol,
    network,
  });

  const isOverBalance = !!(
    balance &&
    balance.lt(value.bn) &&
    !disableAlertOnOverBalance
  );

  const alertInternal =
    alert || (!value.bn.isZero() && isOverBalance) || (max && value.bn.gt(max));

  useEffect(() => {
    onIsOverBalance?.(isOverBalance);
  }, [isOverBalance]);

  return (
    <InputNumber
      value={value}
      alert={alertInternal}
      decimals={token?.decimals}
      rightLabel={
        <FullRightLabel
          rightLabel={rightLabel}
          balance={balance}
          isLoading={isLoading}
          token={token}
        />
      }
      min={ethers.constants.Zero}
      max={
        disableMaxButton ? undefined : max || balance || ethers.constants.Zero
      }
      {...rest}
    />
  );
};

type FullRightLabelProps = BalanceWithLoading & {
  rightLabel?: string;
  token?: TokenInfo;
  balanceDecimals?: number;
};

const FullRightLabel = ({
  rightLabel,
  token,
  balanceDecimals,
  balance,
  isLoading,
}: FullRightLabelProps): JSX.Element => {
  const { activeTheme } = useUiStore();
  const connectedAccount = useConnectedAccount();
  const { t } = useLanguageStore();
  const balanceToShow =
    connectedAccount && balance && token ? balance : ethers.constants.Zero;

  return (
    <React.Fragment>
      {rightLabel && `${rightLabel}${balanceToShow ? ", " : ""}`}
      {balanceToShow && `${t.bal}: `}
      {connectedAccount && isLoading ? (
        <Loader color={getThemeFile(activeTheme).primaryColor} />
      ) : (
        `${bnToDisplayString(
          balanceToShow,
          token?.decimals ?? AMOUNT_DECIMALS,
          balanceDecimals || 4,
        )}`
      )}
    </React.Fragment>
  );
};

export default InputNumberWithBalance;
