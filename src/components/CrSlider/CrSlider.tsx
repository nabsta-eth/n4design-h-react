import classNames from "classnames";
import React from "react";
import {
  CR_SLIDER_MARKS,
  CR_SLIDER_STEP,
  DEFAULT_MIN_CR,
} from "../../config/constants";
import {
  CustomSliderMark,
  getMarkObjectFromCustomSliderMarks,
  railStyle,
  trackStyle,
  handleStyle,
  dotStyle,
  activeDotStyle,
} from "../../utils/slider";
import HandleSlider from "../HandleSlider";
import Input from "../Input";
import classes from "./CrSlider.module.scss";
import { COLOR_NAME_TO_STYLE_VAR, getThemeFile } from "../../utils/ui";
import { useUiStore } from "../../context/UserInterface";

type Props = {
  collateralRatio: number;
  onChangeCollateralRatio: (value: number) => void;
  minCrToShow: number;
};

const CrSlider = ({
  collateralRatio,
  onChangeCollateralRatio,
  minCrToShow,
}: Props) => {
  const { activeTheme } = useUiStore();
  const theme = getThemeFile(activeTheme);
  const sliderMarks: CustomSliderMark[] = CR_SLIDER_MARKS.filter(
    mark => mark.value !== minCrToShow,
  );
  sliderMarks.push({
    value: minCrToShow,
    color: "orange",
  });

  const sliderColor = () => {
    const colourCrToShow = collateralRatio || DEFAULT_MIN_CR;
    if (colourCrToShow < minCrToShow) return "red";
    if (colourCrToShow === minCrToShow) return "orange";
    return "green";
  };

  const sliderColorToDisplay = COLOR_NAME_TO_STYLE_VAR[sliderColor()];

  return (
    <React.Fragment>
      <HandleSlider
        className="uk-margin-right"
        value={collateralRatio || DEFAULT_MIN_CR}
        min={CR_SLIDER_MARKS[0].value}
        max={CR_SLIDER_MARKS[CR_SLIDER_MARKS.length - 1].value}
        step={CR_SLIDER_STEP}
        onChange={onChangeCollateralRatio}
        marks={getMarkObjectFromCustomSliderMarks(
          sliderMarks,
          0,
          CR_SLIDER_MARKS[0].value,
          "%",
        )}
        railStyle={railStyle}
        trackStyle={trackStyle}
        handleStyle={handleStyle}
        dotStyle={dotStyle}
        activeDotStyle={activeDotStyle}
      />

      <Input
        id="collateralRatio"
        wrapperClassName={classNames("uk-margin-small-left", classes.crInput)}
        placeholder="CR"
        label="CR%"
        value={collateralRatio.toFixed(0)}
        onChange={newCr => onChangeCollateralRatio(Number(newCr))}
        alert={collateralRatio < minCrToShow}
      />
    </React.Fragment>
  );
};

export default CrSlider;
