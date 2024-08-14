import React from "react";
import { useLanguageStore } from "../context/Translation";
import { sortIcon, Sorting } from "../utils/sort";
import { TRADES_FIRST_COLUMN_WIDTH } from "./Trades/Trades";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type TradesHeaderProps = {
  sort: Sorting;
  onChangeSort: (by: Sorting["by"]) => void;
};
export const TradesHeader = (props: TradesHeaderProps) => {
  const { t } = useLanguageStore();

  const sortTooltip = (by: string) => {
    let sortName = `${t.date}/${t.time}`;
    switch (by) {
      case "indexToken":
        sortName = t.market;
        break;
      case "isLong":
        sortName = t.side;
        break;
    }

    const sortTooltipPrefix = "title: ";
    const sortTooltipSuffix = "; pos: bottom;";
    if (by === props.sort.by)
      return `${sortTooltipPrefix}${t.reverse}${sortTooltipSuffix}`;
    return `${sortTooltipPrefix}${t.sortBy} ${sortName}${sortTooltipSuffix}`;
  };

  return (
    <React.Fragment>
      <div
        className="uk-text-left"
        style={{ width: `${TRADES_FIRST_COLUMN_WIDTH}px` }}
      >
        <div>
          {t.market}
          <FontAwesomeIcon
            onClick={() => props.onChangeSort("indexToken")}
            uk-tooltip={sortTooltip("indexToken")}
            icon={["far", sortIcon(props.sort, "indexToken")]}
            className="uk-margin-xsmall-left uk-margin-small-right"
          />
          {t.side}
          <FontAwesomeIcon
            onClick={() => props.onChangeSort("isLong")}
            uk-tooltip={sortTooltip("isLong")}
            icon={["far", sortIcon(props.sort, "isLong")]}
            className="uk-margin-xsmall-left"
          />
        </div>
      </div>

      <div className="uk-flex-1 uk-text-right">
        <div>{t.size}</div>
      </div>

      <div className="uk-flex-1 uk-text-right">
        <div>
          {t.date}/{t.time}
          <FontAwesomeIcon
            onClick={() => props.onChangeSort("timestamp")}
            uk-tooltip={sortTooltip("timestamp")}
            icon={["far", sortIcon(props.sort, "timestamp")]}
            className="uk-margin-xsmall-left"
          />
        </div>
      </div>
    </React.Fragment>
  );
};
