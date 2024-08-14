import classNames from "classnames";
import { ethers } from "ethers";
import React from "react";
import { config } from "../../config";
import { useLanguageStore } from "../../context/Translation";
import {
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import {
  isCustomGasPrice,
  TransactionSpeedPreset,
  transactionSpeeds,
} from "../../types/transaction-speed";
import { isValidBigNumber } from "../../utils/general";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select/Select";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

const GasSettings = () => {
  const { t } = useLanguageStore();
  const {
    transactionSpeed,
    setTransactionSpeed,
    slippage,
    setSlippage,
    currentGasPrice,
  } = useUserWalletStore();
  const connectedNetwork = useConnectedNetwork();

  const [slippageInternal, setSlippageInternal] = React.useState<string>(
    slippage.toString(),
  );
  const [gasGwei, setGasGwei] = React.useState<string>(
    isCustomGasPrice(transactionSpeed) ? transactionSpeed.toString() : "",
  );
  const [transactionSpeedCategory, setTransactionSpeedCategory] =
    React.useState<TransactionSpeedPreset | "custom">(
      isCustomGasPrice(transactionSpeed) ? "custom" : transactionSpeed,
    );

  const transactionSpeedOptions = [...transactionSpeeds, "custom"] as const;
  const transactionSpeedSelect = transactionSpeedOptions.map(s => ({
    item: s,
    label: s,
  }));

  const isValidGasPrice = isValidBigNumber(gasGwei, 9);
  const hasTransactionSpeedChanged = () => {
    if (transactionSpeedCategory === "custom") {
      return transactionSpeed !== +gasGwei;
    }
    return transactionSpeed !== transactionSpeedCategory;
  };
  const hasSlippageChanged = () => {
    return slippage !== +slippageInternal;
  };

  React.useEffect(() => {
    if (transactionSpeedCategory !== "custom") {
      const multiplier =
        config.transactionSpeedMultipliers[transactionSpeedCategory];
      const gasPrice =
        +ethers.utils.formatUnits(currentGasPrice || "0", "gwei") * multiplier;
      setGasGwei(gasPrice.toFixed(2));
    }
  }, [transactionSpeedCategory, connectedNetwork]);

  React.useEffect(() => {
    if (
      transactionSpeedCategory === "custom" &&
      isCustomGasPrice(transactionSpeed)
    ) {
      setTransactionSpeed(transactionSpeed);
    }
  }, [connectedNetwork]);

  const onClick = () => {
    setTransactionSpeed(
      transactionSpeedCategory === "custom"
        ? +gasGwei
        : transactionSpeedCategory,
    );
    setSlippage(+slippageInternal);
  };

  return (
    <div className="uk-margin-small-top uk-width-expand">
      <div className="uk-margin">
        <label
          className="uk-form-label cursor-pointer"
          data-uk-tooltip={`title: ${t.maxSlippageTooltip}; pos: right;`}
        >
          {t.maxSlippage}
          <FontAwesomeIcon
            className="uk-margin-xsmall-left"
            icon={["fal", "question-circle"]}
          />
        </label>

        <div className="uk-flex slippage">
          <Input
            id="customSlippage"
            value={slippageInternal.toString()}
            type="number"
            min="0.1"
            max="20"
            step="0.1"
            inputClassName="uk-text-right"
            style={{ width: "75px" }}
            onChange={value => setSlippageInternal(value)}
          />
          <div className="uk-flex uk-margin-small-left uk-flex-column uk-flex-center">
            <span>%</span>
          </div>
        </div>
      </div>

      <div className="uk-margin-top uk-flex uk-flex-between uk-flex-middle">
        <div className="uk-flex uk-width-expand uk-flex-column uk-margin-right">
          <Select
            id="transactionSpeed"
            label={t.transactionSpeed}
            options={transactionSpeedSelect}
            isSelected={ts => ts === transactionSpeedCategory}
            onChange={setTransactionSpeedCategory}
          />
        </div>

        <div className="uk-flex uk-flex-column">
          {transactionSpeedCategory === "custom" ? (
            <label
              className="uk-form-label cursor-pointer"
              htmlFor="gasPriceInGwei"
              data-uk-tooltip={`title: ${t.customGasPriceTooltip}; pos: bottom`}
            >
              gwei
              <FontAwesomeIcon
                className="uk-margin-xsmall-left"
                icon={["fal", "question-circle"]}
              />
            </label>
          ) : (
            <label
              className="uk-form-label disabled-opacity"
              htmlFor="gasPriceInGwei"
            >
              gwei
            </label>
          )}
          <Input
            id="custom-gas-price"
            readOnly={transactionSpeedCategory !== "custom"}
            value={gasGwei}
            type="number"
            min="0"
            inputClassName="uk-text-right"
            style={{ width: "75px" }}
            onChange={setGasGwei}
          />
        </div>
      </div>

      <div className="uk-margin-top">
        <Button
          id="button"
          expand={true}
          disabled={!hasTransactionSpeedChanged() && !hasSlippageChanged()}
          onClick={onClick}
          className={classNames({
            "hfi-error": !isValidGasPrice,
          })}
        >
          {transactionSpeedCategory !== "custom" || isValidGasPrice
            ? t.saveSettings
            : t.invalidCustomGasPrice}
        </Button>
      </div>
    </div>
  );
};

export default GasSettings;
