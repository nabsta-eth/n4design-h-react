import classNames from "classnames";
import classes from "./OpenInterestDisplay.module.scss";
import { useTrade } from "../../context/Trade";
import { AMOUNT_DECIMALS, TradePair } from "handle-sdk/dist/components/trade";
import { PRICE_UNIT } from "../../utils/trade";
import { bnToDisplayString } from "../../utils/format";
import { useTradePrices } from "../../context/TradePrices";
import { ethers } from "ethers";

type Props = {
  tradePair: TradePair;
};

const OPEN_INTEREST_PRECISION = 1;

const OpenInterestDisplay = (props: Props) => {
  const { protocol } = useTrade();
  const { getPrice } = useTradePrices();
  const liquidityPool = protocol.getLiquidityPool(props.tradePair.id.lpId);
  const openInterest = liquidityPool.getOpenInterest(props.tradePair);
  const pairMarketPriceBid =
    getPrice(props.tradePair.pair)?.bestBid ?? ethers.constants.Zero;
  const pairMarketPriceAsk =
    getPrice(props.tradePair.pair)?.bestAsk ?? ethers.constants.Zero;

  const { maxOpenInterestLong, maxOpenInterestShort } = props.tradePair;
  const openInterestLongDisplay = `${bnToDisplayString(
    openInterest.long.mul(pairMarketPriceBid).div(PRICE_UNIT).div(1_000),
    AMOUNT_DECIMALS,
    OPEN_INTEREST_PRECISION,
  )}k`;
  const openInterestShortDisplay = `${bnToDisplayString(
    openInterest.short.mul(pairMarketPriceAsk).div(PRICE_UNIT).div(1_000),
    AMOUNT_DECIMALS,
    OPEN_INTEREST_PRECISION,
  )}k`;

  const maxOpenInterestLongDisplay = `${bnToDisplayString(
    maxOpenInterestLong?.mul(pairMarketPriceBid).div(PRICE_UNIT).div(1e6) ??
      ethers.constants.Zero,
    AMOUNT_DECIMALS,
    OPEN_INTEREST_PRECISION,
  )}M`;
  const maxOpenInterestShortDisplay = `${bnToDisplayString(
    maxOpenInterestShort?.mul(pairMarketPriceAsk).div(PRICE_UNIT).div(1e6) ??
      ethers.constants.Zero,
    AMOUNT_DECIMALS,
    OPEN_INTEREST_PRECISION,
  )}M`;
  const openInterestFullLongDisplay = `${openInterestLongDisplay}/${
    maxOpenInterestLong ? maxOpenInterestLongDisplay : "∞"
  }`;
  const openInterestFullShortDisplay = `${openInterestShortDisplay}/${
    maxOpenInterestShort ? maxOpenInterestShortDisplay : "∞"
  }`;

  return (
    <div className={classNames("uk-flex uk-flex-middle", classes.oiContainer)}>
      <div className="uk-flex uk-flex-column uk-flex-middle">
        <div
          uk-tooltip={`title: long open interest (USD) / max. long open interest (USD); pos: bottom;`}
        >
          <span className="uk-tooltip-content">{"open int.(l)"}</span>
        </div>

        <span className={classNames("hfi-up", classes.values)}>
          {openInterestFullLongDisplay}
        </span>
      </div>

      <div className="uk-flex uk-flex-column uk-flex-middle">
        <div
          uk-tooltip={`title: short open interest (USD) / max. short open interest (USD); pos: bottom;`}
        >
          <span className="uk-tooltip-content">{"open int.(s)"}</span>
        </div>

        <span className={classNames("hfi-down", classes.values)}>
          {openInterestFullShortDisplay}
        </span>
      </div>
    </div>
  );
};

export default OpenInterestDisplay;
