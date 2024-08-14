import * as React from "react";
import { Network } from "handle-sdk";
import {
  Button,
  ButtonSmart,
  InputNumber,
  InputNumberWithBalance,
  InputAddress,
} from "..";
import useInputNumberState from "../../hooks/useInputNumberState";
import useInputAddressState from "../../hooks/useInputAddressState";
import { useUserBalanceStore } from "../../context/UserBalances";
import { Erc20__factory } from "../../contracts";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import useSendTransaction from "../../hooks/useSendTransaction";
import { getSendTokenNotifications } from "../../config/notifications";
import { ethers } from "ethers";
import { getTokenBalanceDisplayDecimals } from "../../utils/general";
import DisplayValue from "../DisplayValue/DisplayValue";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import classNames from "classnames";
import classes from "./SendTokens.module.scss";
import { TokenWithBalanceAndPrice } from "../../types/tokenInfo";
import {
  bnToDisplayString,
  removeWholeNumberSeparatorsFromNumberString,
} from "../../utils/format";
import { InputNumberValue } from "../InputNumber/InputNumber";

type Props = {
  token: TokenWithBalanceAndPrice | undefined;
  network: Network;
  onClose: (areSent: boolean) => void;
};

const SendTokens: React.FC<Props> = ({ token, network, onClose }) => {
  const tokenAmountState = useInputNumberState();
  const tokenValueState = useInputNumberState();
  const tokenAmountAsUsdState = useInputNumberState();
  const tokenValueAsUsdState = useInputNumberState();
  const addressState = useInputAddressState();
  const { refreshBalance } = useUserBalanceStore();
  const signer = useSigner();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const { t } = useLanguageStore();
  const { isTouch } = useUiStore();

  const [areTokensSwitched, setAreTokensSwitched] = React.useState(false);

  const onSend = async () => {
    if (!token || !signer || !addressState.value.address) {
      return;
    }

    const tx = (gasPrice: ethers.BigNumber | undefined) => {
      if (!addressState.value.address) {
        throw Error("No address");
      }

      const amountToSend = areTokensSwitched
        ? tokenValueAsUsdState.value.bn
        : tokenAmountState.value.bn;

      return token.extensions?.isNative
        ? signer.sendTransaction({
            to: addressState.value.address,
            value: amountToSend,
            gasPrice,
          })
        : Erc20__factory.connect(token.address, signer).transfer(
            addressState.value.address,
            amountToSend,
            { gasPrice },
          );
    };

    await sendTransaction(
      tx,
      getSendTokenNotifications({
        amount: tokenAmountState.value.bn,
        token,
        to: addressState.value.value,
        network: network,
      }),
      {
        callback: async () => {
          refreshBalance(network);
          onClose(true);
          addressState.reset();
          tokenAmountState.reset();
        },
      },
    );
  };

  const canSend =
    !tokenAmountState.value.bn.isZero() &&
    token?.balance &&
    token?.balance.gte(tokenAmountState.value.bn) &&
    addressState.value.address;

  const onChangeTokenAmount = (newValue: InputNumberValue) => {
    tokenAmountState.onChange(newValue);
    if (token?.price) {
      tokenValueState.onChangeBN(
        newValue.bn.mul(token?.price || 0).div(ethers.constants.WeiPerEther),
        token?.decimals || 18,
      );
    } else {
      tokenValueState.reset();
    }

    tokenAmountAsUsdState.onChange(tokenValueState.value);
    tokenValueAsUsdState.onChange(tokenAmountState.value);
  };

  const onClickSwitchTokens = () => {
    setAreTokensSwitched(!areTokensSwitched);
    if (areTokensSwitched) {
      tokenAmountState.onChange(tokenValueAsUsdState.value);
      tokenValueState.onChange(tokenAmountAsUsdState.value);
    } else {
      tokenAmountAsUsdState.onChange(tokenValueState.value);
      tokenValueAsUsdState.onChange(tokenAmountState.value);
    }
  };

  const onMaxTokenAsUsdAmount = () => {
    const balanceBn = token?.balance || ethers.constants.Zero;
    tokenAmountAsUsdState.onChangeBN(
      balanceBn.mul(token?.price || 0).div(ethers.constants.WeiPerEther),
      token?.decimals || 18,
    );
    tokenValueAsUsdState.onChangeBN(balanceBn, token?.decimals || 18);
    tokenAmountState.onChangeBN(balanceBn, token?.decimals || 18);
  };

  const onChangeTokenUsdAmount = (newValue: InputNumberValue) => {
    tokenAmountAsUsdState.onChange(newValue);
    const newValueAsUsdBn = token?.price
      ? newValue.bn.mul(ethers.constants.WeiPerEther).div(token?.price)
      : ethers.constants.Zero;

    tokenValueAsUsdState.onChangeBN(newValueAsUsdBn, token?.decimals || 18);

    tokenAmountState.onChangeBN(newValueAsUsdBn, token?.decimals || 18);
    tokenValueState.onChange(newValue);
  };

  return (
    <form noValidate autoComplete="off" className="uk-width-expand">
      <InputAddress
        id="address"
        label="address"
        placeholder="recipient address"
        value={addressState.value}
        onChange={addressState.onChange}
        disabled={sendingTransaction}
      />

      {!areTokensSwitched && (
        <InputNumberWithBalance
          id="amount"
          label={`amount (${token?.symbol})`}
          placeholder="amount to send"
          wrapperClassName="uk-margin-small-top"
          tokenSymbol={token?.symbol}
          network={network}
          value={tokenAmountState.value}
          onChange={onChangeTokenAmount}
          disabled={
            !ethers.utils.isAddress(addressState.value.address || "") ||
            sendingTransaction
          }
          rightComponent={
            <div className="uk-flex uk-flex-middle">
              {tokenValueState.value.bn.gt(0) && token?.price && (
                <DisplayValue
                  currency="USD"
                  value={
                    +removeWholeNumberSeparatorsFromNumberString(
                      tokenValueState.value.string,
                    )
                  }
                />
              )}

              <Button
                onClick={onClickSwitchTokens}
                className={classNames(
                  "hfi-input-button uk-margin-small-left",
                  classes.button,
                )}
                disabled={
                  !ethers.utils.isAddress(addressState.value.address || "") ||
                  sendingTransaction
                }
                tooltip={
                  isTouch
                    ? undefined
                    : {
                        text: t.switchCurrency,
                        position: "left",
                      }
                }
              >
                <FontAwesomeIcon icon={["fal", "exchange"]} />
              </Button>
            </div>
          }
        />
      )}

      {areTokensSwitched && (
        <InputNumber
          id="amount"
          label={`amount (USD)`}
          rightLabel={`bal: ${
            token?.balance
              ? bnToDisplayString(
                  token?.balance,
                  18,
                  getTokenBalanceDisplayDecimals(token?.symbol),
                )
              : ""
          }`}
          placeholder="amount to send"
          wrapperClassName="uk-margin-small-top"
          value={tokenAmountAsUsdState.value}
          decimals={token?.decimals || 18}
          onChange={onChangeTokenUsdAmount}
          disabled={
            !ethers.utils.isAddress(addressState.value.address || "") ||
            sendingTransaction
          }
          rightComponent={
            <div className="uk-flex uk-flex-middle">
              {tokenValueAsUsdState.value.bn.gt(0) && token?.price && (
                <DisplayValue
                  currency={token?.symbol}
                  value={+tokenValueAsUsdState.value.string}
                  decimals={getTokenBalanceDisplayDecimals(token?.symbol || "")}
                />
              )}

              <Button
                onClick={onClickSwitchTokens}
                className={classNames(
                  "hfi-input-button uk-margin-small-left uk-margin-small-right",
                  classes.button,
                )}
                disabled={
                  !ethers.utils.isAddress(addressState.value.address || "") ||
                  sendingTransaction
                }
                tooltip={
                  isTouch
                    ? undefined
                    : {
                        text: t.switchCurrency,
                        position: "left",
                      }
                }
              >
                <FontAwesomeIcon icon={["fal", "exchange"]} />
              </Button>

              <Button
                onClick={onMaxTokenAsUsdAmount}
                className={classNames("hfi-input-button", classes.button)}
                disabled={
                  !ethers.utils.isAddress(addressState.value.address || "") ||
                  sendingTransaction
                }
              >
                {t.max}
              </Button>
            </div>
          }
        />
      )}
      <ButtonSmart
        network={network}
        disabled={!canSend}
        loading={sendingTransaction}
        className="uk-margin-top"
        expand={true}
        onClick={onSend}
      >
        send
      </ButtonSmart>
    </form>
  );
};

export default SendTokens;
