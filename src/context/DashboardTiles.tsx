import * as React from "react";
import {
  PriceChartTiles,
  priceChartTilesLocalStorage,
} from "../utils/local-storage";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import defaultPriceChart from "../utils/dashboard";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";
import { getPriceChartTileId } from "../utils/general";
import { Direction } from "../navigation/Convert";

export type DashboardTiles = {
  priceChartTiles: PriceChartTiles;
  setPriceChartTiles: (tiles: PriceChartTiles) => void;
  portfolioTiles: string[];
  setPortfolioTiles: (tiles: string[]) => void;
  breakpoint: Breakpoint;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  onChangeToken: (
    id: string,
    tokenDirection: Direction,
    newToken: string,
  ) => void;
  showPairModal: boolean;
  setShowPairModal: (show: boolean) => void;
  priceChartId: string | undefined;
  setPriceChartId: (id: string | undefined) => void;
  setFromToken: (id: string, fromToken: string) => void;
  setToToken: (id: string, toToken: string) => void;
};

const PRICECHART_TILES_LS_PREFIX = "priceChartTilesNew";
const PRICECHART_TILES_LS_VERSION = 1;
const DASHBOARD_PORTFOLIO_TILES_LS_VERSION = 1;
const DASHBOARD_PORTFOLIO_TILES_LS_KEY = "dashboardPortfolioTiles";
const BREAKPOINT_NAMES = ["xxs", "xs", "sm", "md", "lg"] as const;
export type Breakpoint = (typeof BREAKPOINT_NAMES)[number];
const BASE_PRICE_CHART_TILE_ID = getPriceChartTileId(1);
const BASE_TILES = [
  BASE_PRICE_CHART_TILE_ID,
  "tradeAccount",
  "tradeAccountUsage",
  "tradeAccountLiquidation",
  "positionPerformance",
  "userWalletAssets",
  "userTotalDebt",
  "governanceStaked",
  "userKeeperStaked",
  "liquidityStaked",
  "totalCdpCollateral",
  "userVeForex",
  "claimableRebates",
  "claimableFxKeeperRewards",
];

export const DashboardTilesContext = React.createContext<
  DashboardTiles | undefined
>(undefined);

export const DashboardTilesProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const connectedNetwork = useConnectedNetwork() ?? "ethereum";
  const [priceChartTiles, setPriceChartTiles] =
    useLocalStorageVersioned<PriceChartTiles>(
      PRICECHART_TILES_LS_PREFIX,
      PRICECHART_TILES_LS_VERSION,
      priceChartTilesLocalStorage.get() ?? {
        [getPriceChartTileId(1)]: defaultPriceChart(connectedNetwork),
      },
    );

  // Temporary measure to clear old price chart tiles
  if (priceChartTilesLocalStorage.get()) priceChartTilesLocalStorage.remove();

  const [portfolioTiles, setPortfolioTiles] = useLocalStorageVersioned<
    string[]
  >(
    DASHBOARD_PORTFOLIO_TILES_LS_KEY,
    DASHBOARD_PORTFOLIO_TILES_LS_VERSION,
    BASE_TILES,
  );

  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(
    BREAKPOINT_NAMES[3],
  );
  const [priceChartId, setPriceChartId] = React.useState<string | undefined>(
    undefined,
  );

  const [showPairModal, setShowPairModal] = React.useState<boolean>(false);

  const setFromToken = (id: string, fromTokenSymbol: string) => {
    const newPriceChartTiles = { ...priceChartTiles };
    newPriceChartTiles[id].fromToken = fromTokenSymbol;
    setPriceChartTiles(newPriceChartTiles);
  };

  const setToToken = (id: string, toTokenSymbol: string) => {
    const newPriceChartTiles = { ...priceChartTiles };
    newPriceChartTiles[id].toToken = toTokenSymbol;
    setPriceChartTiles(newPriceChartTiles);
  };

  // When choosing a token from the pop-up modal,
  // or when clicking on the asset in the wallet assets table,
  // we check if the opposite token is
  // the same as the one we're changing to.
  // If it is then we set the opposite token
  // to the one we're changing from.
  // We also close the pair modal if it is open
  // to view the chart outcome.
  const onChangeToken = (
    id: string,
    tokenDirection: Direction,
    newToken: string,
  ) => {
    if (tokenDirection === "to") {
      if (newToken === priceChartTiles[id].fromToken) {
        setFromToken(id, priceChartTiles[id].toToken);
      }
      setToToken(id, newToken);
    } else {
      if (newToken === priceChartTiles[id].toToken) {
        setToToken(id, priceChartTiles[id].fromToken);
      }
      setFromToken(id, newToken);
    }
    setShowPairModal(false);
  };

  const value = React.useMemo(
    () => ({
      priceChartTiles,
      setPriceChartTiles,
      portfolioTiles,
      setPortfolioTiles,
      breakpoint,
      setBreakpoint,
      onChangeToken,
      showPairModal,
      setShowPairModal,
      priceChartId,
      setPriceChartId,
      setFromToken,
      setToToken,
    }),
    [
      priceChartTiles,
      portfolioTiles,
      breakpoint,
      onChangeToken,
      showPairModal,
      priceChartId,
    ],
  );

  return (
    <DashboardTilesContext.Provider value={value}>
      {props.children}
    </DashboardTilesContext.Provider>
  );
};

export const useDashboardTilesStore = () => {
  const context = React.useContext(DashboardTilesContext);

  if (context === undefined) {
    throw new Error(
      "useDashboardTilesStore must be used within a DashboardTilesProvider",
    );
  }
  return context;
};
