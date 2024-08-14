import MobilePosition from "./MobilePosition";
import { useLanguageStore } from "../../context/Translation";
import { useTrade } from "../../context/Trade";
import { Position } from "handle-sdk/dist/components/trade/position";
import { pairToString } from "handle-sdk/dist/utils/general";
import TradeTextPlaceholderMobile from "./TradeTextPlaceholderMobile";

const MobilePositions = () => {
  const { t } = useLanguageStore();
  const { account: tradeAccount } = useTrade();
  const positions: Position[] | undefined = tradeAccount?.getAllPositions();
  const arePositionsLoaded =
    !tradeAccount || (!!positions && positions?.length >= 0);
  const positionsPlaceholder =
    !tradeAccount || !arePositionsLoaded || positions?.length === 0;
  const placeholderText = t.noOpenPositions;

  return (
    <div className="uk-flex-1 positions-wrapper">
      {positionsPlaceholder && (
        <TradeTextPlaceholderMobile
          placeholderText={placeholderText}
          isLoading={!arePositionsLoaded}
        />
      )}

      {!positionsPlaceholder &&
        positions?.map(position => (
          <MobilePosition
            position={position}
            key={pairToString(position.pairId.pair)}
          />
        ))}
    </div>
  );
};

export default MobilePositions;
