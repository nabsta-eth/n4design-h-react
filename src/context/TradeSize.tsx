import { BigNumber, constants } from "ethers";
import { createContext, useContext, useMemo, useState } from "react";

export type TradeSizeValue = {
  size: BigNumber;
  setSize: (size: BigNumber) => void;
  sizeLpc: BigNumber;
  setSizeLpc: (sizeLpc: BigNumber) => void;
  equityDelta: BigNumber;
  setEquityDelta: (value: BigNumber) => void;
};

const TradeSizeContext = createContext<TradeSizeValue | null>(null);

export const TradeSizeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [size, setSize] = useState(constants.Zero);
  // Size of the trade in LP currency, e.g. USD.
  const [sizeLpc, setSizeLpc] = useState(constants.Zero);
  // Used for adding or removing equity from the simulated account for
  // preview purposes, e.g. during deposit and withdraw.
  const [equityDelta, setEquityDelta] = useState(constants.Zero);

  const value = useMemo(
    () => ({
      size,
      setSize,
      sizeLpc,
      setSizeLpc,
      equityDelta,
      setEquityDelta,
    }),
    [size.toString(), sizeLpc.toString(), equityDelta.toString()],
  );

  return (
    <TradeSizeContext.Provider value={value}>
      {children}
    </TradeSizeContext.Provider>
  );
};

export const useTradeSize = () => {
  const context = useContext(TradeSizeContext);
  if (!context) {
    throw new Error("TradeSize context must be used in TradeSizeProvider");
  }
  return context;
};
