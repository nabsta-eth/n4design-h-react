import { Position } from "handle-sdk/dist/components/trade/position";
import React from "react";
import { useLocalStorage } from "@handle-fi/react-components/dist/hooks/useLocalStorage";
import { SHOW_POSITIONS_IN_CHART_LOCAL_STORAGE_KEY } from "../utils/local-storage";
import { useTrade } from "./Trade";

type PositionsContextType = {
  positions: Position[] | null;
  showPositionsInChart: boolean;
  setShowPositionsInChart: (show: boolean) => void;
};

const PositionsContext = React.createContext<PositionsContextType | null>(null);

export const PositionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { account } = useTrade();
  const positions = account?.getAllPositions() ?? null;
  const [showPositionsInChart, setShowPositionsInChart] = useLocalStorage(
    SHOW_POSITIONS_IN_CHART_LOCAL_STORAGE_KEY,
    true,
  );

  const value = React.useMemo(
    () => ({ positions, showPositionsInChart, setShowPositionsInChart }),
    [JSON.stringify(positions), showPositionsInChart],
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
};

export const usePositions = () => {
  const context = React.useContext(PositionsContext);
  if (!context) {
    throw new Error("usePositions must be used within a PositionsProvider");
  }
  return context;
};
