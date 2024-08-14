import { COLOR_NAME_TO_STYLE_VAR, ColorName, themeFile } from "../utils/ui";

type Mark = {
  style: {
    color: string;
    borderColor: string;
  };
  label: string;
};

export const getSliderMarks = (
  max: number,
  markNum: number,
  precision: number,
  min: number = 0,
  labelSuffix: string = "x",
) => {
  const marks: Record<number, Mark> = {};
  for (let i = 0; i < markNum; i++) {
    const mark = ((i + 1) * (max - min)) / markNum;
    const num = min + Math.round(mark * 10 ** precision) / 10 ** precision;
    marks[num] = {
      style: {
        color: themeFile.primaryColor,
        borderColor: themeFile.primaryColor,
      },
      label: `${num}${labelSuffix}`,
    };
  }
  return marks;
};

export type CustomSliderMark = {
  value: number;
  color: ColorName;
};

export const getMarkObjectFromCustomSliderMarks = (
  marks: CustomSliderMark[],
  precision: number = 0,
  min: number = 0,
  labelSuffix: string = "%",
) =>
  marks.reduce(
    (object, mark) => ({
      ...object,
      [mark.value]: {
        style: {
          color: COLOR_NAME_TO_STYLE_VAR[mark.color],
          borderColor: COLOR_NAME_TO_STYLE_VAR[mark.color],
        },
        label: `${mark.value.toFixed(precision)}${labelSuffix}`,
      },
    }),
    {} as Record<number, Mark>,
  );

export const railStyle = {
  backgroundColor: `${themeFile.primaryColor}40`,
  borderRadius: 0,
};

export const trackStyle = [
  {
    backgroundColor: themeFile.primaryColor,
    borderRadius: 0,
  },
];

export const handleStyle = {
  backgroundColor: "transparent",
  borderColor: themeFile.primaryColor,
  borderRadius: 0,
};

export const dotStyle = {
  backgroundColor: themeFile.backgroundColor,
  borderColor: `${themeFile.primaryColor}40`,
  borderRadius: 0,
};

export const activeDotStyle = {
  backgroundColor: themeFile.backgroundColor,
  borderColor: themeFile.primaryColor,
  borderRadius: 0,
};
