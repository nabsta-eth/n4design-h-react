import classNames from "classnames";
import classes from "./Portfolio.module.scss";
import React from "react";
import WalletAssetsTile from "./Tiles/WalletAssetsTile";
import TotalDebtTile from "./Tiles/TotalDebtTile";
import FxKeeperPoolStakedTile from "./Tiles/FxKeeperPoolStakedTile";
import VeForexTile from "./Tiles/VeForexTile";
import TotalCdpCollateralTile from "./Tiles/TotalCdpCollateralTile";
import PriceChartTile from "./Tiles/PriceChartTile";
import useDashboard, { DashboardHook } from "../../hooks/useDashboard";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  PRICECHART_TILE_ID_PREFIX,
  portfolioTilesLayoutsLocalStorage,
} from "../../utils/local-storage";
import { useSelectedOrConnectedAccount } from "../../hooks/useSelectedOrConnectedAccount";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { TileProps } from "./Tiles/PortfolioTile";
import GovernanceStakedTile from "./Tiles/GovernanceStakedTile";
import LiquidityStakedTile from "./Tiles/LiquidityStakedTile";
import ClaimableFxKeeperRewardsTile from "./Tiles/ClaimableFxKeeperRewardsTile";
import TradeAccountTile from "./Tiles/TradeAccountTile";
import TradeAccountUsageTile from "./Tiles/TradeAccountUsageTile";
import TradeAccountLiquidationTile from "./Tiles/TradeAccountLiquidationTile";
import PositionPerformanceTile from "./Tiles/PositionPerformanceTile";
import defaultPriceChart from "../../utils/dashboard";
import {
  getNextPriceChartTileId,
  getPriceChartTileId,
} from "../../utils/general";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { DEFAULT_ACCOUNT } from "../../config";
import {
  Breakpoint,
  useDashboardTilesStore,
} from "../../context/DashboardTiles";
import TradeDepositModal from "../Trade/TradeDepositModal/TradeDepositModal";
import TradeWithdrawModal from "../Trade/TradeWithdrawModal/TradeWithdrawModal";
import { useUiStore } from "../../context/UserInterface";
import { useToken } from "../../context/TokenManager";
import { DEFAULT_TOKENS, DISPLAY_TOKENS } from "../../navigation/Convert";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import SelectEveryToken from "../SelectEveryToken";

/**
 * a tile consists of:
 * @param i identifier of the tile to align with the package we use;
 * @param component React component to render;
 * @param x horizontal position, i.e. column;
 * @param y vertical position, i.e. row;
 * @param w width, in grid units;
 * @param h height, in grid units.
 */
type Tile = {
  i: string;
  component: React.ReactNode;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** a layout is per tile as above plus:
 * @param moved has it been moved during customise;
 * @param static is it draggable.
 */
export type Layout = Tile &
  {
    moved?: boolean;
    static?: boolean;
  }[];

const COLUMNS: Record<Breakpoint, number> = {
  lg: 12,
  md: 9,
  sm: 6,
  xs: 4,
  xxs: 2,
};
const WIDTHS: Record<Breakpoint, number> = {
  lg: 3,
  md: 3,
  sm: 3,
  xs: 4,
  xxs: 2,
};
const TILE_ROW_HEIGHT = 100;
const CHART_TILE_HEIGHT = 2;
const BREAKPOINTS: Record<Breakpoint, number> = {
  lg: 1600,
  md: 1200,
  sm: 900,
  xs: 500,
  xxs: 0,
};

const ResponsiveGridLayout = WidthProvider(Responsive);

type PortfolioProps = {
  show: boolean;
  shouldShowCustomise: boolean;
};

const Portfolio = ({ show, shouldShowCustomise }: PortfolioProps) => {
  const account = useSelectedOrConnectedAccount();
  const network = useConnectedNetwork() ?? DEFAULT_HLP_NETWORK;
  const dashboardData = useDashboard({
    account: account ?? DEFAULT_ACCOUNT,
    network: network,
  });
  const {
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
  } = useDashboardTilesStore();
  const { showChooseWalletModal } = useUiStore();
  const originalPortfolioTilesLayouts =
    portfolioTilesLayoutsLocalStorage.get() ?? {};
  const [portfolioTilesLayouts, setPortfolioTilesLayouts] = React.useState(
    originalPortfolioTilesLayouts,
  );
  const { assets, debt, protocolData } = dashboardData;
  const defaultPriceChartId = getPriceChartTileId(1);
  const priceChartIdToUse = priceChartId ?? defaultPriceChartId;
  const fromToken = useToken(
    priceChartTiles[priceChartIdToUse].fromToken,
    network,
  );
  const toToken = useToken(priceChartTiles[priceChartIdToUse].toToken, network);

  const onClickNewPriceChartTile = () => addNewPriceChartTile();

  const addNewPriceChartTile = () => {
    const nextPriceChartId = getNextPriceChartTileId(priceChartTiles);
    const newPriceChartTiles = { ...priceChartTiles };
    newPriceChartTiles[nextPriceChartId] = defaultPriceChart(network);
    setPriceChartTiles(newPriceChartTiles);
    const newPortfolioTiles = [...portfolioTiles];
    newPortfolioTiles.push(nextPriceChartId);
    setPortfolioTiles(newPortfolioTiles);
  };

  const onClickRemovePriceChartTile = (id: string) => {
    const newPriceChartTiles = { ...priceChartTiles };
    delete newPriceChartTiles[id];
    setPriceChartId(undefined);
    setPriceChartTiles(newPriceChartTiles);
    const newPortfolioTiles = portfolioTiles.filter(tile => tile !== id);
    setPortfolioTiles(newPortfolioTiles);
  };

  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

  const onCloseDepositModal = () => {
    setShowDepositModal(false);
  };
  const onCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const baseTiles = React.useMemo(() => {
    let ix1 = 0;
    return portfolioTiles.map((tileId, ix) => {
      // Is used to define the tile sequence and compensate for tiles
      // with a height spanning multiple rows (price chart).
      ix1 = acceptOrAdjustIx1(ix, ix1, portfolioTiles, breakpoint);
      // Determines the sequence in the row as the basis for calculating the column.
      const ix2 = getRowPosition(ix1, breakpoint);
      // Gets the object required to render the tile.
      return getPortfolioTileToDisplay({
        tileId,
        show,
        dashboardData,
        shouldShowCustomise,
        onClickNewPriceChartTile,
        onClickRemovePriceChartTile,
        showDepositModal,
        setShowDepositModal,
        showWithdrawModal,
        setShowWithdrawModal,
        ix: ix1++,
        ix2,
        breakpoint,
      });
    });
  }, [
    portfolioTiles,
    shouldShowCustomise,
    protocolData,
    assets,
    debt,
    breakpoint,
    showDepositModal,
    showWithdrawModal,
  ]);

  const getPortfolioTiles = (layout: Layout) => {
    const newLayout: Layout = layout.sort((a, b) => {
      const aLayout = a as Layout;
      const bLayout = b as Layout;
      return (
        aLayout.y * COLUMNS[breakpoint] +
        aLayout.x -
        (bLayout.y * COLUMNS[breakpoint] + bLayout.x)
      );
    });
    return newLayout.map(tile => {
      const tileLayout = tile as Layout;
      return tileLayout.i;
    });
  };

  const onLayoutChange = (
    layout: Layout,
    layouts: Record<Breakpoint, Layout>,
  ) => {
    const newBreakpoint = Object.entries(layouts)[0][0] as Breakpoint;
    setBreakpoint(newBreakpoint);
    portfolioTilesLayoutsLocalStorage.set(layouts);
    setPortfolioTilesLayouts(layouts);
    const newPortfolioTiles = getPortfolioTiles(layouts[newBreakpoint]);
    setPortfolioTiles(newPortfolioTiles);
  };

  const onBreakpointChange = (newBreakpoint: Breakpoint, newCols: number) => {
    setBreakpoint(newBreakpoint);
  };

  return (
    <div hidden={!show}>
      <div
        className={classNames(classes.gridWrapper, {
          [classes.gridWrapperCustomise]: shouldShowCustomise,
        })}
      >
        <ResponsiveGridLayout
          id="tiles"
          cols={COLUMNS}
          breakpoints={BREAKPOINTS}
          rowHeight={TILE_ROW_HEIGHT}
          layouts={portfolioTilesLayouts}
          onLayoutChange={(layout: Layout, layouts: any) =>
            onLayoutChange(layout, layouts)
          }
          onBreakpointChange={onBreakpointChange}
          measureBeforeMount={false}
          isDraggable={shouldShowCustomise}
          isResizable={false}
          className={classes.grid}
        >
          {baseTiles.map(tile => {
            if (!tile) return null;
            return (
              <div
                id={tile.i}
                key={tile.i}
                data-grid={{
                  x: tile.x,
                  y: tile.y,
                  w: tile.w,
                  h: tile.h,
                }}
              >
                {tile.component}
              </div>
            );
          })}
        </ResponsiveGridLayout>

        {showDepositModal && (
          <TradeDepositModal
            show={showDepositModal}
            onClose={onCloseDepositModal}
          />
        )}

        {showWithdrawModal && (
          <TradeWithdrawModal
            show={showWithdrawModal}
            onClose={onCloseWithdrawModal}
          />
        )}

        {showPairModal && (
          <Modal
            width={400}
            title="select pair"
            show={showPairModal}
            onClose={() => setShowPairModal(false)}
            modalClasses={classes.pairModal}
            showChooseWalletModal={showChooseWalletModal}
          >
            <SelectEveryToken
              id={`${priceChartIdToUse}FromToken`}
              onChange={fromTokenSymbol =>
                onChangeToken(priceChartIdToUse, "from", fromTokenSymbol)
              }
              network={network}
              wrapperClassName="uk-margin"
              value={fromToken?.symbol || DEFAULT_TOKENS[network].from}
              displayOptions={DISPLAY_TOKENS[network]}
              dropdownOffset={"0"}
            />

            <SelectEveryToken
              id={`${priceChartIdToUse}ToToken`}
              onChange={toTokenSymbol =>
                onChangeToken(priceChartIdToUse, "to", toTokenSymbol)
              }
              network={network}
              wrapperClassName="uk-margin"
              value={toToken?.symbol || DEFAULT_TOKENS[network].from}
              showBalance={false}
              displayOptions={DISPLAY_TOKENS[network]}
              dropdownOffset={"0"}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

const getRowPosition = (ix1: number, breakpoint: Breakpoint) => {
  const row = Math.floor((ix1 * WIDTHS[breakpoint]) / COLUMNS[breakpoint]);
  const tilesPerRow = COLUMNS[breakpoint] / WIDTHS[breakpoint];
  return ix1 - row * tilesPerRow;
};

const acceptOrAdjustIx1 = (
  ix: number,
  ix1: number,
  tiles: string[],
  breakpoint: Breakpoint,
) => {
  // Double increment if the previous row has a price chart tile.
  if (getIsPrevRowTilePriceChart(ix, tiles, breakpoint)) ix1++;
  return ix1++;
};

const getIsPrevRowTilePriceChart = (
  ix: number,
  tiles: string[],
  breakpoint: Breakpoint,
) => {
  const prevRowTileIx = ix - COLUMNS[breakpoint] / WIDTHS[breakpoint];
  return (
    ix > prevRowTileIx &&
    tiles[prevRowTileIx]?.includes(PRICECHART_TILE_ID_PREFIX)
  );
};

const getDataProps = (
  tileId: string,
  ix: number,
  ix2: number,
  breakpoint: Breakpoint,
) => {
  const row = Math.floor((ix * WIDTHS[breakpoint]) / COLUMNS[breakpoint]);
  const column = ix2 * WIDTHS[breakpoint];
  return {
    w: WIDTHS[breakpoint],
    h: tileId.includes(PRICECHART_TILE_ID_PREFIX) ? CHART_TILE_HEIGHT : 1,
    x: column,
    y: row,
  };
};

type TileToDisplayProps = {
  tileId: string;
  show: boolean;
  dashboardData: DashboardHook;
  shouldShowCustomise: boolean;
  onClickNewPriceChartTile: () => void;
  onClickRemovePriceChartTile: (id: string) => void;
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;
  showWithdrawModal: boolean;
  setShowWithdrawModal: (show: boolean) => void;
  ix: number;
  ix2: number;
  breakpoint: Breakpoint;
} & TileProps;

const getPortfolioTileToDisplay = (props: TileToDisplayProps) => {
  const {
    tileId,
    show,
    dashboardData,
    shouldShowCustomise,
    onClickNewPriceChartTile,
    onClickRemovePriceChartTile,
    showDepositModal,
    setShowDepositModal,
    showWithdrawModal,
    setShowWithdrawModal,
    ix,
    ix2,
    breakpoint,
  } = props;
  const { assets, debt, protocolData } = dashboardData;
  // Gets the width/height & row/column props for the tile
  const dataProps = getDataProps(tileId, ix, ix2, breakpoint);

  if (tileId.includes(PRICECHART_TILE_ID_PREFIX))
    return {
      i: tileId,
      component: (
        <PriceChartTile
          shouldShowCustomise={shouldShowCustomise}
          id={tileId}
          onClickNewPriceChartTile={onClickNewPriceChartTile}
          onClickRemovePriceChartTile={onClickRemovePriceChartTile}
          isVisible={show}
        />
      ),
      ...dataProps,
    };

  switch (tileId) {
    case "tradeAccount":
      return {
        i: tileId,
        component: (
          <TradeAccountTile
            showDepositModal={showDepositModal}
            setShowDepositModal={setShowDepositModal}
            showWithdrawModal={showWithdrawModal}
            setShowWithdrawModal={setShowWithdrawModal}
          />
        ),
        ...dataProps,
      };
    case "tradeAccountUsage":
      return {
        i: tileId,
        component: <TradeAccountUsageTile />,
        ...dataProps,
      };
    case "tradeAccountLiquidation":
      return {
        i: tileId,
        component: <TradeAccountLiquidationTile />,
        ...dataProps,
      };
    case "positionPerformance":
      return {
        i: tileId,
        component: <PositionPerformanceTile />,
        ...dataProps,
      };
    case "userWalletAssets":
      return {
        i: tileId,
        component: (
          <WalletAssetsTile
            assets={assets.wallet?.assets}
            areLoading={assets.wallet?.areLoading}
            currency={assets.wallet?.currency}
          />
        ),
        ...dataProps,
      };
    case "userTotalDebt":
      return {
        i: tileId,
        component: <TotalDebtTile debtInEth={debt.debtInEth} />,
        ...dataProps,
      };
    case "governanceStaked":
      return {
        i: tileId,
        component: (
          <GovernanceStakedTile
            governanceData={protocolData.governanceLockData}
          />
        ),
        ...dataProps,
      };
    case "userKeeperStaked":
      return {
        i: tileId,
        component: (
          <FxKeeperPoolStakedTile
            stakedFxTokens={assets.stakedTokens.fxTokens}
          />
        ),
        ...dataProps,
      };
    case "liquidityStaked":
      return {
        i: tileId,
        component: (
          <LiquidityStakedTile
            hlp={assets.stakedTokens.hlp}
            curve={assets.stakedTokens.curve}
          />
        ),
        ...dataProps,
      };
    case "totalCdpCollateral":
      return {
        i: tileId,
        component: (
          <TotalCdpCollateralTile
            kashi={assets.vaultCollateral.kashi}
            handle={assets.vaultCollateral.handle}
          />
        ),
        ...dataProps,
      };
    case "userVeForex":
      return {
        i: tileId,
        component: <VeForexTile veForex={assets.stakedTokens.veForex} />,
        ...dataProps,
      };
    case "claimableFxKeeperRewards":
      return {
        i: tileId,
        component: (
          <ClaimableFxKeeperRewardsTile
            fxKeeperPools={protocolData.fxKeeperPools}
          />
        ),
        ...dataProps,
      };
    default:
      return null;
  }
};

export default Portfolio;
