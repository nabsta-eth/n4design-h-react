import classNames from "classnames";
import React from "react";
import { useToken } from "../../../context/TokenManager";
import { DEFAULT_TOKENS } from "../../../navigation/Convert";
import {
  digits,
  getPriceChartTileId,
  getTokenAmountDisplayDecimals,
} from "../../../utils/general";
import PriceChart from "../../PriceChart/PriceChart";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import classes from "./PortfolioTile.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { useDashboardTilesStore } from "../../../context/DashboardTiles";
import { usePriceChartData } from "../../../context/PriceChartData";

type PriceChartTileProps = Omit<TileProps, "id"> & {
  id: string;
  shouldShowCustomise: boolean;
  onClickNewPriceChartTile: () => void;
  onClickRemovePriceChartTile: (id: string) => void;
  isVisible?: boolean;
};

const PriceChartTile = ({
  title,
  leftText,
  id,
  shouldShowCustomise,
  children,
  onClickNewPriceChartTile,
  onClickRemovePriceChartTile,
  isVisible,
  ...rest
}: PriceChartTileProps) => {
  const tileRef = React.useRef<HTMLDivElement>(null);
  // TODO: supply correct network
  const network = DEFAULT_HLP_NETWORK;
  const { priceChartTiles, setPriceChartId, showPairModal, setShowPairModal } =
    useDashboardTilesStore();
  const tileHeight = tileRef.current?.offsetHeight ?? 206;
  const fromTokenSymbol = priceChartTiles[id].fromToken;
  const toTokenSymbol = priceChartTiles[id].toToken;
  const { providerPriceData } = usePriceChartData(
    fromTokenSymbol,
    toTokenSymbol,
    network,
  );
  const priceData = providerPriceData.data;
  const isOriginalPriceChartTile = id === getPriceChartTileId(1);
  const fromToken = useToken(priceChartTiles[id].fromToken, network);
  const toToken = useToken(priceChartTiles[id].toToken, network);

  const [priceMovement, setPriceMovement] = React.useState(0);
  React.useEffect(() => {
    if (priceData.length === 0) {
      setPriceMovement(0);
      return;
    }
    const chartMovement = priceData?.length
      ? priceData[priceData.length - 1].price - priceData[0].price
      : 0;

    setPriceMovement(chartMovement);
  }, [priceData[0]?.price]);

  const onClickPair = () => {
    setPriceChartId(id);
    setShowPairModal(!showPairModal);
  };

  React.useEffect(() => {
    if (!isVisible) {
      setShowPairModal(false);
    }
  }, [isVisible]);

  const priceToDisplay =
    priceData?.length > 0 ? priceData[priceData.length - 1].price : 0;
  const priceDisplayDecimals = getTokenAmountDisplayDecimals(
    fromTokenSymbol,
    priceToDisplay,
  );
  const priceToDisplayString = priceToDisplay.toLocaleString(
    undefined,
    digits(priceDisplayDecimals),
  );

  return (
    <PortfolioTile noPadding {...rest}>
      <div key={id} ref={tileRef} className="uk-height-1-1 uk-width-1-1">
        <div
          className={classNames(
            "uk-flex uk-flex-between uk-flex-middle uk-width-expand",
            classes.chartHeader,
          )}
        >
          <div className="uk-flex" onClick={onClickPair}>
            <span uk-tooltip="title: change pair; pos: right;">
              <span className="cursor-pointer uk-tooltip-content">
                {`${fromToken?.symbol}/${toToken?.symbol}:`}
              </span>
            </span>

            <span className="uk-margin-small-left">{priceToDisplayString}</span>

            {priceData?.length > 0 && (
              <span
                className={classNames("uk-margin-small-left", {
                  "hfi-up": priceMovement >= 0,
                  "hfi-down": priceMovement < 0,
                })}
              >
                ({priceMovement >= 0 ? "+" : ""}
                {((priceMovement / priceData[0].price) * 100).toLocaleString(
                  undefined,
                  digits(1),
                )}
                %)
              </span>
            )}
          </div>

          {shouldShowCustomise && (
            <React.Fragment>
              {isOriginalPriceChartTile ? (
                <div
                  className="cursor-pointer"
                  uk-tooltip="title: add another chart tile; pos: left;"
                  onClick={onClickNewPriceChartTile}
                >
                  <span className="uk-tooltip-content chart-add-remove">
                    <FontAwesomeIcon icon={["far", "plus"]} />
                  </span>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  uk-tooltip="title: remove this chart tile; pos: left;"
                  onClick={() => onClickRemovePriceChartTile(id)}
                >
                  <span className="uk-tooltip-content chart-add-remove">
                    <FontAwesomeIcon icon={["far", "times"]} />
                  </span>
                </div>
              )}
            </React.Fragment>
          )}
        </div>

        <PriceChart
          id={id}
          fromTokenSymbol={fromToken?.symbol ?? DEFAULT_TOKENS[network].from}
          toTokenSymbol={toToken?.symbol ?? DEFAULT_TOKENS[network].from}
          height={tileHeight}
          network={network}
        />
      </div>
    </PortfolioTile>
  );
};

export default PriceChartTile;
