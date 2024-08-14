import { useTrade } from "../context/Trade";
import Select from "./Select/Select";
import { pairToDisplayString } from "../utils/trade/toDisplayPair";
import { memo, useCallback, useMemo, useState } from "react";
import { utils } from "handle-sdk";
import { isFxToken } from "../utils/general";
import { TradePairId } from "handle-sdk/dist/components/trade";
import { useLanguageStore } from "../context/Translation";
import { isSamePair } from "handle-sdk/dist/utils/general";
import { TradePairOrViewOnlyInstrument } from "../types/trade";
import { getInstrument } from "../utils/instruments";
import { SelectOption } from "../types/select";

type Props = {
  id: string;
  onChange: (newValue: TradePairId) => void;
  value: TradePairId;
  disableClosedMarkets?: boolean;
  enableSelected?: boolean;
  disabledPairs?: string[];
  disabled?: boolean;
  className?: string;
  size?: string;
  includeViewOnly?: boolean;
  withSearch?: boolean;
  showInputAsSearch?: boolean;
  dropdownOffset?: string;
  showFavouritesOnly?: boolean;
  shouldShowShortCustomUnit?: boolean;
};

const SelectTradePair = ({
  id,
  onChange: onChangeExternal,
  value,
  disableClosedMarkets,
  enableSelected,
  disabledPairs,
  disabled,
  className,
  size,
  includeViewOnly,
  withSearch,
  showInputAsSearch,
  dropdownOffset,
  showFavouritesOnly,
  shouldShowShortCustomUnit,
}: Props) => {
  const { pairs, viewOnlyInstruments, favouriteMarkets, instruments } =
    useTrade();
  const { t } = useLanguageStore();

  const [searchValue, setSearchValue] = useState("");
  const search = {
    value: searchValue,
    placeholder: t.searchMarkets,
    onChange: (searchString: string) => {
      setSearchValue(searchString);
    },
  };

  const isMarketDisabled = (market: TradePairOrViewOnlyInstrument) => {
    return (
      disabledPairs?.includes(pairToDisplayString(market.pair)) ||
      (!!disableClosedMarkets &&
        utils.trade.isTradeWeekend() &&
        (isFxToken(market.pair.baseSymbol) ||
          isFxToken(market.pair.quoteSymbol)))
    );
  };

  const memoOptions: SelectOption<string>[] = useMemo(() => {
    // Show only active trade pairs.
    let basePairs: TradePairOrViewOnlyInstrument[] = pairs.filter(
      pair => pair.isActive,
    );
    // Add in view-only if includeViewOnly prop is true.
    if (includeViewOnly) {
      basePairs = [...basePairs, ...viewOnlyInstruments];
    }
    // Filter out pairs in the dropdown that are not favourites if showFavouritesOnly is true.
    // Ensure that search value entry uses all tradeable markets, favourited or not.
    const showAllMarkets = !showFavouritesOnly || searchValue !== "";
    const allOrFavePairs = basePairs.filter(
      pair =>
        showAllMarkets ||
        favouriteMarkets.some(fave => isSamePair(fave, pair.pair)) ||
        isSamePair(pair.pair, value.pair),
    );
    // Convert the pair list into options object array for the select dropdown.
    const options = allOrFavePairs.map((market): SelectOption<string> => {
      const instrument = getInstrument(instruments, market.pair);
      const unitName = instrument.getUnitName(shouldShowShortCustomUnit) ?? "";
      return {
        item: pairToDisplayString(market.pair),
        label: pairToDisplayString(market.pair),
        rightLabel: unitName,
        disabled: isMarketDisabled(market),
      };
    });
    // Filter out pairs that don't match the search value
    // depending on the showInputAsSearch prop when no
    // search value entered.
    const hideAllMarkets = !!showInputAsSearch && searchValue === "";
    const searchOptions = options.filter(
      o =>
        o.label?.toLowerCase().includes(searchValue.toLowerCase()) &&
        !hideAllMarkets,
    );
    return searchOptions;
  }, [
    pairs,
    viewOnlyInstruments,
    searchValue,
    shouldShowShortCustomUnit,
    favouriteMarkets,
  ]);

  const onChange = useCallback(
    (newValue: string) => {
      onChangeExternal(TradePairId.fromString(newValue));
    },
    [onChangeExternal],
  );

  const isSelected = useCallback(
    v => v === pairToDisplayString(value.pair),
    [value],
  );

  return (
    <Select<string>
      isSelected={isSelected}
      disabled={disabled}
      options={memoOptions}
      id={id}
      onChange={onChange}
      showSelected={true}
      market
      enableSelected={enableSelected}
      wrapperClassName={className}
      search={withSearch || showInputAsSearch ? search : undefined}
      size={size}
      showInputAsSearch={showInputAsSearch}
      dropdownOffset={dropdownOffset}
      hideChevronUntilHovered
    />
  );
};

export default memo(SelectTradePair);
