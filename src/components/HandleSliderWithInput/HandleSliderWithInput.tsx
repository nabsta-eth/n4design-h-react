import classNames from "classnames";
import Slider, { SliderProps } from "rc-slider";
import React, { useState } from "react";
import "../../assets/styles/slider.scss";
import classes from "./HandleSliderWithInput.module.scss";
import {
  railStyle,
  trackStyle,
  handleStyle,
  dotStyle,
  activeDotStyle,
} from "../../utils/slider";
import Input from "../Input";

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> &
  Omit<SliderProps, "onChange"> & {
    onChange: (value: number) => void;
    showInput?: boolean;
    maxToShow?: number;
    placeholder?: string;
    label?: string;
    defaultValue?: number;
  };

const HandleSliderWithInput = ({
  onChange,
  showInput,
  maxToShow = 100,
  placeholder,
  label,
  defaultValue = 100,
  ...rest
}: Props) => {
  const [value, setValue] = useState(defaultValue);

  const handleSliderChange = (value: number) => {
    setValue(value);
    onChange(value);
  };

  const handleInputChange = (newInput: string) => {
    const newValue = Number(newInput);
    if (!isNaN(newValue)) {
      setValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className={classNames("uk-flex uk-flex-middle")}>
      <Slider
        className="uk-margin-small-top"
        onChange={handleSliderChange as (value: number | number[]) => void}
        {...rest}
        railStyle={railStyle}
        trackStyle={trackStyle}
        handleStyle={handleStyle}
        dotStyle={dotStyle}
        activeDotStyle={activeDotStyle}
      />

      {showInput && (
        <Input
          id="sliderInput"
          wrapperClassName={classNames(classes.input, classes.singleLineText)}
          placeholder={placeholder}
          label={label}
          value={value.toFixed(0)}
          onChange={handleInputChange}
          alert={value > maxToShow}
        />
      )}
    </div>
  );
};

export default HandleSliderWithInput;
