import React from "react";

export const useTradeFormDimensions = () => {
  const tradeFormRef = React.createRef<HTMLDivElement>();
  const [tradeFormWidth, setTradeFormWidth] = React.useState(0);
  const [tradeFormHeight, setTradeFormHeight] = React.useState(0);

  React.useEffect(() => {
    if (!tradeFormRef.current) {
      return;
    }
    setTradeFormWidth(tradeFormRef.current.offsetWidth);
    setTradeFormHeight(tradeFormRef.current.offsetHeight);
  }, [tradeFormRef]);

  return {
    tradeFormRef,
    tradeFormWidth,
    tradeFormHeight,
  };
};
