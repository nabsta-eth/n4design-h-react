import React, { useCallback, useState } from "react";
import ClosePositionModal from "../ClosePositionModal/ClosePositionModal";
import PositionElement from "../PositionElement/PositionElement";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import classNames from "classnames";
import classes from "./Positions.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { useLanguageStore } from "../../context/Translation";
import ColouredScrollbars from "../ColouredScrollbars";
import { PositionsHeader } from "../PositionsHeader/PositionsHeader";
import { POSITIONS_THRESHOLD_FOR_STACKED_TABLE } from "../../config/trade";
import TransactionsPlaceholder from "../TransactionsPlaceholder/TransactionsPlaceholder";
import { useTrade } from "../../context/Trade";
import { usePositionsFrameDimensions } from "../../hooks/usePositionsFrameDimensions";
import { Position } from "handle-sdk/dist/components/trade/position";
import SharePositionModal from "../SharePositionModal/SharePositionModal";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";

export type PositionActionType = "edit" | "close" | "share" | "editTrigger";

type ChangePosition = {
  index: number | null;
  change: PositionActionType;
};

type Props = {
  show: boolean;
  onClickMarket?: (pair: TradePairOrViewOnlyInstrument) => void;
  isDashboard?: boolean;
};

export const POSITIONS_FIRST_COLUMN_WIDTH = 100;

const Positions = ({ show, onClickMarket, isDashboard }: Props) => {
  const { t } = useLanguageStore();
  const [activePosition, setActivePosition] = useState<ChangePosition>({
    index: null,
    change: "edit",
  });
  const {
    isMobile,
    showChooseWalletModal,
    setShowChooseWalletModal,
    isTradePopout,
  } = useUiStore();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const { account: tradeAccount } = useTrade();
  const synthPositions = tradeAccount?.getAllPositions();
  const positionsLoaded =
    !tradeAccount || (!!synthPositions && synthPositions?.length >= 0);

  const closeModal = () => {
    setActivePosition({
      index: null,
      change: "edit",
    });
  };

  const openModal = useCallback((index: number, change: PositionActionType) => {
    setActivePosition({
      index,
      change,
    });
  }, []);

  const positionsPlaceholder =
    !tradeAccount || !positionsLoaded || synthPositions?.length === 0;

  const position = synthPositions?.[activePosition?.index ?? -1];

  const { positionsRef, frameWidth, positionHeight, positionsHeaderHeight } =
    usePositionsFrameDimensions();
  const isStacked = frameWidth < POSITIONS_THRESHOLD_FOR_STACKED_TABLE;

  // scroll height for positions:
  //  on dash it's the vh less the tiles & tabs;
  //  on trade it's the frame height less the header.
  const allowanceForPopoutHeader = positionsHeaderHeight;
  const allowanceForHeader = isStacked ? "0" : positionsHeaderHeight;
  const desktopHeight = isDashboard
    ? "100vh - 600px"
    : `100% - ${allowanceForHeader}px`;
  const scrollHeight = isTradePopout
    ? `calc(100vh - ${allowanceForPopoutHeader}px)`
    : `calc(${desktopHeight})`;
  const actualHeight =
    +positionHeight * (synthPositions ? synthPositions.length : 0);

  const containerStyle = {
    height: isTradePopout ? scrollHeight : "100%",
  };

  const openPositionModal = React.useCallback(
    (type: PositionActionType, position: Position) => {
      const index = synthPositions?.indexOf(position) ?? 0;
      openModal(index, type);
    },
    [synthPositions, openModal],
  );

  const [showSizeInUsd, setShowSizeInUsd] = useState(true);

  return (
    <div
      ref={positionsRef}
      className={classNames("uk-height-1-1", {
        [classes.dashboardWrapper]: isDashboard,
      })}
      hidden={!show}
    >
      {(isDashboard || !isStacked) && (
        <PositionsHeader
          showChartCheckbox={!isDashboard}
          showSizeInUsd={showSizeInUsd}
          setShowSizeInUsd={setShowSizeInUsd}
          isPlaceholder={positionsPlaceholder}
          isDashboard={isDashboard}
        />
      )}

      {positionsPlaceholder ? (
        <div className={classNames(classes.placeholderContainer)}>
          <TransactionsPlaceholder
            type="positions"
            connectedNetwork={connectedNetwork}
            showChooseWalletModal={showChooseWalletModal}
            setShowChooseWalletModal={setShowChooseWalletModal}
            loading={!positionsLoaded}
            t={t}
            connectedAccount={connectedAccount}
          />
        </div>
      ) : (
        <ColouredScrollbars
          universal
          style={{
            minHeight: isDashboard ? positionHeight : undefined,
            height: isDashboard ? actualHeight : scrollHeight,
            maxHeight: isDashboard ? scrollHeight : undefined,
          }}
        >
          <div style={containerStyle}>
            <ColouredScrollbars universal>
              {!positionsPlaceholder &&
                synthPositions?.map((position, index) => (
                  <PositionElement
                    position={position}
                    openModal={openPositionModal}
                    key={position.pairId.toString()}
                    firstColumnWidth={POSITIONS_FIRST_COLUMN_WIDTH}
                    isDashboard={isDashboard}
                    onClickMarket={onClickMarket}
                    showSizeInUsd={showSizeInUsd}
                    width={frameWidth}
                    index={index}
                  />
                ))}
            </ColouredScrollbars>

            {activePosition.change === "close" && position && (
              <ClosePositionModal position={position} onClose={closeModal} />
            )}

            {activePosition.change === "share" && position && !isMobile && (
              <SharePositionModal position={position} onClose={closeModal} />
            )}
          </div>
        </ColouredScrollbars>
      )}
    </div>
  );
};

export default Positions;
