import classNames from "classnames";
import classes from "./PriceDisplayExtended.module.scss";
import { getLocaleNumberSeparators } from "../../utils/general";
import { usePrevious } from "../../hooks/usePrevious";
import { useEffect, useState } from "react";

type Props = {
  price: string;
  chartHeader?: boolean;
  hasCurrency?: boolean;
  isViewOnly?: boolean;
  className?: string;
  noLargerDecimals?: boolean;
};

const PriceDisplayExtended = (props: Props) => {
  const { price, chartHeader, hasCurrency, isViewOnly, className } = props;
  const priceToDisplayComponents = price.split(" ");
  const [priceChanged, setPriceChanged] = useState<"up" | "down" | undefined>();
  const [firstDigitToChange, setFirstDigitToChange] = useState<
    number | undefined
  >();
  const priceToDisplay = priceToDisplayComponents[0];
  const currencyToDisplay =
    hasCurrency && priceToDisplayComponents[1]
      ? priceToDisplayComponents[1]
      : "";
  const isPriceTwoDecimals =
    priceToDisplay.indexOf(getLocaleNumberSeparators().decimalSeparator) ===
    priceToDisplay.length - 3;

  const prevPrice = usePrevious(price);
  useEffect(() => {
    if (price !== prevPrice) {
      setPriceChanged(price > prevPrice ? "up" : "down");
      setFirstDigitToChange(
        digits.findIndex((digit, ix) => digit.value !== prevPrice.charAt(ix)),
      );
    }
  }, [price]);

  // Determines the segment the digit belongs in:
  // 1: standard font size;
  // 2: larger font size;
  // 3: > 2 decimals: superscript; 2 or less, larger like segment 2.
  const getSegment = (ix: number): number => {
    if (ix < priceToDisplay.length - 3) {
      return 1;
    }
    if (ix < priceToDisplay.length - 1) {
      return 2;
    }
    return 3;
  };
  // Builds the array of digits with value, segment and direction of change if the price has changed.
  const digits = priceToDisplay.split("").map((digit, ix) => {
    return {
      value: digit,
      segment: getSegment(ix),
      change:
        firstDigitToChange && ix >= firstDigitToChange && priceChanged
          ? priceChanged
          : undefined,
    };
  });

  return (
    <span
      className={classNames(classes.price, "uk-text-nowrap", className, {
        [classes.viewOnly]: isViewOnly,
        [classes.fontSize1Pt1]: chartHeader,
      })}
    >
      {digits.map((digit, ix) => {
        if (digit.segment < 3 || (digit.segment === 3 && isPriceTwoDecimals)) {
          return (
            <span
              key={ix}
              className={classNames({
                [classes.up]: digit.change === "up",
                [classes.down]: digit.change === "down",
                [classes.larger]:
                  !props.noLargerDecimals &&
                  (digit.segment === 2 ||
                    (digit.segment === 3 && isPriceTwoDecimals)),
                [classes.largerFontSize1Pt1]:
                  chartHeader &&
                  !props.noLargerDecimals &&
                  (digit.segment === 2 ||
                    (digit.segment === 3 && isPriceTwoDecimals)),
              })}
            >
              {digit.value}
            </span>
          );
        }
        return (
          <sup
            key={ix}
            className={classNames(classes.superscript, {
              [classes.up]: digit.change === "up",
              [classes.down]: digit.change === "down",
            })}
          >
            {digit.value}
          </sup>
        );
      })}
      {currencyToDisplay}
    </span>
  );
};

export default PriceDisplayExtended;
