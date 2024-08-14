import { TradePair } from "handle-sdk/dist/components/trade";
import PositionSkewIndicator from "../PositionSkewIndicator/PositionSkewIndicator";
import HeaderFeeRates from "../HeaderFeeRates/HeaderFeeRates";
import OpenInterestDisplay from "../OpenInterestDisplay/OpenInterestDisplay";

type Props = {
  tradePair: TradePair;
};

export const TradeChartHeaderRightSection = ({ tradePair }: Props) => {
  return (
    <>
      <PositionSkewIndicator tradePair={tradePair} />
      <OpenInterestDisplay tradePair={tradePair} />
      <HeaderFeeRates tradePair={tradePair} />
    </>
  );
};
