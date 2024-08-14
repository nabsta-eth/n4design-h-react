import classNames from "classnames";
import React from "react";
import {
  POSITIONS_MIN_WIDTH,
  POSITIONS_THRESHOLD_FOR_MARK_PRICE,
} from "../../config/trade";
import { usePositions } from "../../context/Positions";
import { useLanguageStore } from "../../context/Translation";
import { Checkbox } from "@handle-fi/react-components/dist/components/handle_uikit/components/Form/Checkbox";
import { POSITIONS_FIRST_COLUMN_WIDTH } from "../Positions/Positions";
import classes from "./PositionsHeader.module.scss";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../../context/UserInterface";

type Props = {
  showChartCheckbox?: boolean;
  showSizeInUsd: boolean;
  setShowSizeInUsd: (show: boolean) => void;
  isPlaceholder: boolean;
  isDashboard?: boolean;
};

export const PositionsHeader = ({
  showChartCheckbox,
  showSizeInUsd,
  setShowSizeInUsd,
  isPlaceholder,
  isDashboard,
}: Props) => {
  const { isModernTheme } = useUiStore();
  const { t } = useLanguageStore();
  const { showPositionsInChart, setShowPositionsInChart } = usePositions();
  const positionsHeaderRef = React.useRef<HTMLDivElement>(null);
  const isStacked = useMediaQueries().isPositionsStacked;
  const positionsFrameWidth =
    positionsHeaderRef.current?.offsetWidth ||
    POSITIONS_THRESHOLD_FOR_MARK_PRICE;

  return (
    <div
      ref={positionsHeaderRef}
      hidden={isStacked}
      className={classNames(
        "uk-flex uk-flex-between uk-border-bottom",
        classes.headerWrapper,
        {
          [classes.positionsHeaderNoBorder]:
            isModernTheme && isDashboard && !isPlaceholder,
        },
      )}
    >
      <div
        style={{ minWidth: `${POSITIONS_MIN_WIDTH - 20}px` }}
        className={classNames("uk-width-expand uk-overflow-hidden", {
          [classes.positionsWrapper]:
            positionsFrameWidth >= POSITIONS_THRESHOLD_FOR_MARK_PRICE,
          [classes.positionsWrapperSmall]:
            positionsFrameWidth < POSITIONS_THRESHOLD_FOR_MARK_PRICE,
        })}
      >
        <div
          className="uk-text-left"
          style={{ width: `${POSITIONS_FIRST_COLUMN_WIDTH}px` }}
        >
          <div>{t.market}</div>
          <div>{t.side}</div>
        </div>

        <div className="uk-flex uk-flex-1 uk-flex-column uk-flex-bottom">
          <div
            className={classNames("uk-flex uk-flex-middle", classes.sizeHeader)}
          >
            {t.size} ({showSizeInUsd ? "USD" : "lots"})
            <div
              className={classes.switchButton}
              onClick={e => setShowSizeInUsd(!showSizeInUsd)}
              onKeyDown={e => setShowSizeInUsd(!showSizeInUsd)}
              uk-tooltip={`title: show position sizes in ${
                showSizeInUsd ? "lots" : "USD"
              }; pos: bottom;`}
            >
              <FontAwesomeIcon icon={["fal", "exchange"]} />
            </div>
          </div>
          <div
            className={classes.initMarginHeader}
            uk-tooltip={`title: ${t.initMarginTooltip}; pos: bottom;`}
          >
            <span className="uk-tooltip-content">{t.initialMargin}</span>
          </div>
        </div>

        <div
          className={classNames(
            "uk-flex uk-flex-middle uk-flex-right uk-flex-1 uk-text-right",
            classes.entryPriceHdr,
          )}
        >
          <div uk-tooltip={`title: ${t.entryPriceTooltip}; pos: bottom;`}>
            <span className="uk-tooltip-content">{t.entryPrice}</span>
          </div>
        </div>

        {positionsFrameWidth >= POSITIONS_THRESHOLD_FOR_MARK_PRICE && (
          <div className="uk-flex-1 uk-text-right uk-flex uk-flex-middle uk-flex-right">
            <div
              className={classes.flashingHdr}
              uk-tooltip={`title: ${t.markPriceTooltip}; pos: bottom;`}
            >
              <span className="uk-tooltip-content">{t.markPrice}</span>
            </div>
          </div>
        )}

        <div className="uk-flex uk-flex-middle uk-flex-right uk-flex-1 uk-text-right">
          <div uk-tooltip={`title: ${t.fundingTooltip}; pos: bottom;`}>
            <span className="uk-tooltip-content">{t.funding}</span>
          </div>
        </div>

        <div className="uk-flex-1 uk-text-right uk-flex uk-flex-column uk-flex-bottom uk-height-1-1">
          <div
            className={classes.flashingHdr}
            uk-tooltip={`title: ${t.pnlTooltip}; pos: bottom;`}
          >
            <span className="uk-tooltip-content">{t.profitAndLoss}</span>
          </div>
          <div
            className={classNames(classes.flashingHdr, classes.returnHeader)}
          >
            {t.return}
          </div>
        </div>

        <div className="uk-flex uk-flex-1 uk-flex-right uk-flex-middle uk-text-right">
          {showChartCheckbox && (
            <>
              <div
                className="uk-flex uk-flex-column uk-flex-left"
                uk-tooltip={`title: ${t.showPositionsInChartTooltip}; pos: bottom;`}
              >
                <span>{t.chartPositions.split(" ")[0]}</span>
                <span className="uk-tooltip-content">
                  {t.chartPositions.split(" ")[1]}
                </span>
              </div>
              <Checkbox
                className={classNames(
                  "uk-margin-small-left uk-display-block",
                  classes.checkbox,
                )}
                checked={showPositionsInChart}
                onChange={() => setShowPositionsInChart(!showPositionsInChart)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
