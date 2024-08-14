import { Theme } from "../../types/theme";
import { getThemeFile } from "../ui";

export const getChartConfig = (theme: Theme) => {
  const themeFile = getThemeFile(theme);
  return {
    date: {
      key: "date",
      inputFormat: "%Y-%m-%d_%H:%M:%S",
      outputFormat: "%d/%m %H:%M",
    },
    size: {
      height: 360,
    },
    color: {
      key: false,
      keys: false,
      scheme: false,
      current: themeFile.primaryColor,
      default: themeFile.primaryColor,
      background: themeFile.backgroundColor,
      movementUp: themeFile.chartUpColor,
      movementDown: themeFile.chartDownColor,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  };
};
