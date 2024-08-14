import Slider, { SliderProps } from "rc-slider";
import React from "react";
import "../assets/styles/slider.scss";
import {
  railStyle,
  trackStyle,
  handleStyle,
  dotStyle,
  activeDotStyle,
} from "../utils/slider";

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> &
  Omit<SliderProps, "onChange"> & {
    onChange: (value: number) => void;
  };

const HandleSlider = ({ onChange, ...rest }: Props) => (
  <Slider
    onChange={onChange as (value: number | number[]) => void}
    {...rest}
    railStyle={railStyle}
    trackStyle={trackStyle}
    handleStyle={handleStyle}
    dotStyle={dotStyle}
    activeDotStyle={activeDotStyle}
  />
);

export default HandleSlider;
