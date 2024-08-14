import React from "react";
import HandleSlider from "./HandleSlider";
import { LeverageDisplay } from "../config";
import { getSliderMarks } from "../utils/slider";
import Input from "./Input";
import { isLeverageValidWithinRange } from "../utils/trade/leverage";
import { useLanguageStore } from "../context/Translation";

type Props = {
  leverageDisplay: LeverageDisplay;
  leverage: string;
  setLeverageBySlider: (value: number) => void;
  setLeverageByInput: (value: string) => void;
};

export const LeverageSlider: React.FC<Props> = ({
  leverageDisplay,
  leverage,
  setLeverageByInput,
  setLeverageBySlider,
}) => {
  const { t } = useLanguageStore();
  return (
    <div className="uk-margin-small-top">
      <label htmlFor="trade-leverage" className="">
        {t.leverage}
      </label>
      <div className="uk-margin-bottom uk-flex uk-flex-between uk-flex-middle">
        <HandleSlider
          className="uk-margin-right"
          min={leverageDisplay.min}
          defaultValue={leverageDisplay.default}
          value={Number(leverage)}
          max={leverageDisplay.max}
          step={leverageDisplay.step}
          onChange={setLeverageBySlider}
          marks={getSliderMarks(
            leverageDisplay.max,
            leverageDisplay.marks,
            leverageDisplay.decimalPrecision,
          )}
        />
        <div>
          <Input
            id="trade-leverage"
            wrapperClassName="uk-margin-small-left"
            style={{ width: "65px" }}
            inputMode="decimal"
            value={leverage}
            min={leverageDisplay.min}
            max={leverageDisplay.max}
            step={leverageDisplay.step}
            onChange={setLeverageByInput}
            placeholder={`${leverageDisplay.default.toFixed(2)}x`}
            alert={!isLeverageValidWithinRange(leverage, leverageDisplay)}
          />
        </div>
      </div>
    </div>
  );
};
