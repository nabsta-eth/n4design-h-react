import React from "react";
import { POSITIONS_THRESHOLD_FOR_STACKED_TABLE } from "../config/trade";
import positionsHeader from "../components/PositionsHeader/PositionsHeader.module.scss";
import position from "../components/PositionElement/PositionElement.module.scss";

export const usePositionsFrameDimensions = () => {
  const positionsRef = React.createRef<HTMLDivElement>();
  const [frameWidth, setWidth] = React.useState(
    POSITIONS_THRESHOLD_FOR_STACKED_TABLE,
  );
  React.useEffect(() => {
    setWidth(positionsRef.current?.offsetWidth ?? 0);
  }, [positionsRef]);

  return {
    positionsRef,
    frameWidth,
    positionsHeaderHeight: positionsHeader.positionsHeaderHeight,
    positionHeight: position.positionHeight,
  };
};
