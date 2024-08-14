import { UkTooltipType, getUkTooltip } from "../general";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import { TradePair } from "handle-sdk/dist/components/trade";
import { TranslationMap } from "../../types/translation";
import { MouseOrKeyboardEvent } from "../../types/mouseAndKeyboard";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";

export const getMarketTooltip = (
  t: TranslationMap,
  marketName: string,
  isViewOnly: boolean,
  position: UkTooltipType["position"] = "bottom",
) => {
  return getUkTooltip({
    title: `${t.showChartFor} ${marketName}${isViewOnly ? ". " : ""}${
      isViewOnly ? t.thisMarketIsNotTradeable : ""
    }${isViewOnly ? "." : ""}`,
    position,
  });
};

export const getClickableMarketProps = (
  shouldShowProps: boolean,
  t: TranslationMap,
  tradePair: TradePairOrViewOnlyInstrument,
  marketName: string,
  onClick: (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    tradePair: TradePairOrViewOnlyInstrument,
  ) => void,
  tooltipPosition: UkTooltipType["position"] = "bottom",
) => {
  if (!shouldShowProps) {
    return {};
  }
  const isViewOnly = ViewOnlyInstrument.isViewOnlyInstrument(tradePair);
  return {
    ["uk-tooltip"]: getMarketTooltip(
      t,
      marketName,
      isViewOnly,
      tooltipPosition,
    ),
    tabIndex: 0,
    onClick: (e: MouseOrKeyboardEvent<HTMLDivElement>) => onClick(e, tradePair),
    onKeyDown: (e: MouseOrKeyboardEvent<HTMLDivElement>) =>
      onClick(e, tradePair),
  };
};
