import classNames from "classnames";
import { useUiStore } from "../../context/UserInterface";
import {
  fxTokenSymbolToCurrency,
  valueToDisplayString,
} from "../../utils/format";
import Input from "../Input";
import classes from "./ThresholdInput.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import React from "react";
import { useUserBalanceStore } from "../../context/UserBalances";
import {
  INPUT_CHAR_WIDTH,
  INPUT_PADDING_FOR_ICONS,
} from "../../config/constants";
import useTokenThreshold from "../../hooks/useTokenThreshold";

type Props = {
  disabled?: boolean;
  selectedCurrency: string;
};

const ThresholdInput = ({ disabled, selectedCurrency }: Props) => {
  const { tokenValueThreshold, onChangeTokenValueThreshold } =
    useUserBalanceStore();
  const { showThresholdInput, onShowThresholdInput, setShowThresholdInput } =
    useTokenThreshold();
  const { isMobile } = useUiStore();

  const inputRef = React.createRef<HTMLInputElement>();
  React.useEffect(() => {
    if (showThresholdInput) {
      inputRef.current?.focus();
    }
  }, [showThresholdInput]);

  return (
    <div
      className={classNames({
        [classes.desktopWrapper]: !isMobile,
        [classes.mobileWrapper]: isMobile,
      })}
    >
      <div
        className={classNames({
          [classes.inputOpen]: showThresholdInput,
          [classes.inputClosed]: !showThresholdInput,
          [classes.desktopWrapper]: !isMobile,
          [classes.mobileWrapper]: isMobile,
        })}
        onClick={onShowThresholdInput}
      >
        {showThresholdInput ? (
          <form
            noValidate
            autoComplete="off"
            onSubmit={() => setShowThresholdInput(false)}
          >
            <Input
              id="threshold-input"
              ref={inputRef}
              style={{
                width:
                  (tokenValueThreshold.length || 1) * INPUT_CHAR_WIDTH +
                  INPUT_PADDING_FOR_ICONS,
              }}
              wrapperClassName={classes.thresholdWrapper}
              inputClassName={classes.thresholdInput}
              disabled={disabled}
              value={tokenValueThreshold}
              onChange={onChangeTokenValueThreshold}
              leftIcon={{
                prefix: "far",
                name: "greater-than-equal",
              }}
              rightComponent={fxTokenSymbolToCurrency(selectedCurrency)}
              onBlur={() => setShowThresholdInput(false)}
            />
          </form>
        ) : (
          <div
            className="cursor-pointer"
            uk-tooltip="title: click to adjust min. value for token display; pos: bottom;"
          >
            <div className="uk-tooltip-content">
              <FontAwesomeIcon
                icon={["far", "greater-than-equal"]}
                className={classes.greaterThanEqualIcon}
              />
              {`${valueToDisplayString(
                Number(tokenValueThreshold),
                "fxUSD",
                2,
              )} ${fxTokenSymbolToCurrency(selectedCurrency)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThresholdInput;
