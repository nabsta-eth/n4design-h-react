import classNames from "classnames";
import Button from "../Button";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import { useToken } from "../../context/TokenManager";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import classes from "./MobilePosition.module.scss";
import { useNavigate } from "react-router-dom";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import { useLanguageStore } from "../../context/Translation";
import { Position } from "handle-sdk/dist/components/trade/position";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { usePosition } from "../../hooks/usePosition";
import { useTrade } from "../../context/Trade";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

type Props = {
  position: Position;
};

const navigatePath = (action: string, pairId: Position["pairId"]) =>
  `/${action}position?pair=${JSON.stringify(pairId)}`;

const MobilePosition = ({ position }: Props) => {
  const mediaQueries = useMediaQueries();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const isUsdBase = position.pairId.pair.baseSymbol === "USD";
  const { pnlDisplay, pnlPercent, pnlPercentDisplay } = usePosition(position);
  const { protocol } = useTrade();
  const liquidityPool = protocol.getLiquidityPool(position.pairId.lpId);
  const instrument = useInstrumentOrThrow(pairToString(position.pairId.pair));
  const isMarketClosed = !liquidityPool.getPairAvailability({
    pair: position?.pairId.pair,
  }).isAvailable;

  const isLongDisplay = position.isLong ? t.long : t.short;
  const idBase = `mobile-position-${position.pairId.pair.baseSymbol.toLowerCase()}-${position.pairId.pair.quoteSymbol.toLowerCase()}`;

  return (
    <div
      id={idBase}
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        classes.positionContainer,
      )}
    >
      <div
        className="uk-flex uk-flex-middle"
        onClick={() => navigate(navigatePath("show", position.pairId))}
      >
        <PairDisplay
          pair={position.pairId.pair}
          noAssets
          size={mediaQueries.maxSmallMobile ? undefined : "1.5x"}
          instrument={instrument}
        />

        <div
          className={classNames(
            "uk-flex uk-flex-column uk-flex-center uk-flex-top",
          )}
        >
          <PairDisplay
            className={classes.pairText}
            pair={position.pairId.pair}
            noIcons
            instrument={instrument}
          />
          <div
            className={classNames({
              "hfi-up": position.isLong,
              "hfi-down": !position.isLong,
            })}
          >
            <span
              className={classNames(classes.isLongLeverage, {
                [classes.notUsdBase]: !isUsdBase,
              })}
            >
              {isLongDisplay}
            </span>
          </div>
        </div>
      </div>

      <div
        className="uk-flex uk-flex-column uk-flex-bottom uk-flex-1"
        onClick={() => navigate(navigatePath("show", position.pairId))}
      >
        <div
          className={classNames({
            "hfi-flash-up": pnlPercent.gt("0") && !isMarketClosed,
            "hfi-flash-down": pnlPercent.lte("0") && !isMarketClosed,
            "disabled-opacity": isMarketClosed,
          })}
        >
          <FlashingNumber
            className={classes.flashingNumber}
            value={+pnlDisplay}
            disabled={isMarketClosed}
          >
            {pnlPercent?.gt("0") ? "+" : ""}
            {pnlDisplay}
          </FlashingNumber>
        </div>

        <div
          className={classNames("uk-flex uk-flex-bottom", classes.size, {
            "uk-flex-column": mediaQueries.maxSmallMobile,
          })}
        >
          <div
            className={classNames(
              "uk-flex uk-margin-xsmall-left",
              classes.profit,
              {
                "hfi-flash-up": pnlPercent.gt("0") && !isMarketClosed,
                "hfi-flash-down": pnlPercent.lte("0") && !isMarketClosed,
                "disabled-opacity": isMarketClosed,
              },
            )}
          >
            {"("}
            <FlashingNumber
              className={classes.flashingNumber}
              value={+pnlPercentDisplay}
              disabled={isMarketClosed}
            >
              {pnlPercent?.gt("0") ? "+" : ""}
              {`${pnlPercentDisplay}%`}
            </FlashingNumber>
            {")"}
          </div>
        </div>
      </div>

      <div className="hfi-button-collection uk-flex-1 uk-flex-right">
        <PositionButton
          position={position}
          action="share"
          isDisabled={isMarketClosed}
          idBase={idBase}
        >
          <FontAwesomeIcon icon={["fal", "share-nodes"]} />
        </PositionButton>

        <PositionButton
          position={position}
          action="close"
          isDisabled={isMarketClosed}
          idBase={idBase}
        >
          <FontAwesomeIcon icon={["fal", "times"]} />
        </PositionButton>
      </div>
    </div>
  );
};

const PositionButton = (props: any) => {
  const { position, action, children, idBase, isDisabled, ...rest } = props;
  const navigate = useNavigate();

  return (
    <Button
      icon
      id={`${idBase}-${action}-button`}
      type="secondary"
      className={classNames("uk-margin-remove", {
        "hfi-error-button": action === "close",
      })}
      disabled={isDisabled}
      onClick={() => navigate(navigatePath(action, position.pairId))}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default MobilePosition;
