import { BigNumber, ethers } from "ethers";
import { Network } from "handle-sdk";
import React from "react";
import { usePositions } from "../../context/Positions";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { sumBn } from "../../utils/general";
import { TradeAction } from "handle-sdk/dist/components/trade";

export type DashboardPortfolioHookArgs = {
  account: string;
  network: Network;
};

export type DashboardPortfolioHookValue = {
  open?: {
    collateral: {
      long: BigNumber;
      short: BigNumber;
    };
    size: {
      long: BigNumber;
      short: BigNumber;
    };
    pnl: {
      long: BigNumber;
      short: BigNumber;
    };
  };
  closed?: {
    pnl: BigNumber;
    collateral: BigNumber;
    volume: BigNumber;
    wins: number;
    losses: number;
  };
};

const useDashboardPortfolio = ({
  account,
  network,
}: DashboardPortfolioHookArgs): DashboardPortfolioHookValue => {
  const { positions } = usePositions();
  const [tradeHistory] = usePromise(
    // TODO implement this.
    (): Promise<TradeAction[]> => Promise.resolve([]),
    [account, network],
  );

  const open = React.useMemo(() => {
    if (!positions) return;
    const longPositions = positions.filter(p => p.isLong);
    const shortPositions = positions.filter(p => !p.isLong);

    const openLongSize = sumBn(longPositions.map(p => p.size));
    const openShortSize = sumBn(shortPositions.map(p => p.size));

    const openLongPnl = sumBn(
      longPositions.map(p => p.calculateFullUnrealizedEquityToBeRealized()),
    );
    const openShortPnl = sumBn(
      shortPositions.map(p => p.calculateFullUnrealizedEquityToBeRealized()),
    );

    return {
      collateral: {
        long: ethers.constants.Zero,
        short: ethers.constants.Zero,
      },
      size: {
        long: openLongSize,
        short: openShortSize,
      },
      pnl: {
        long: openLongPnl,
        short: openShortPnl,
      },
    };
  }, [positions]);

  const closed = React.useMemo(() => {
    if (!tradeHistory) return;
    const closedPnl =
      tradeHistory && sumBn(tradeHistory.map(h => h.realisedEquity));
    const closedCollateral =
      tradeHistory &&
      sumBn(
        tradeHistory.map(h =>
          // TODO: this was collateralDelta, current value of size is not correct.
          h.size.gte(0) ? h.size : h.size.mul(-1),
        ),
      );
    const volume = tradeHistory && sumBn(tradeHistory.map(h => h.size));

    const pnlTrades =
      tradeHistory && tradeHistory.filter(h => !h.realisedEquity.isZero());
    const wins =
      pnlTrades && pnlTrades.filter(h => h.realisedEquity.gt(0)).length;
    const losses = wins && pnlTrades && pnlTrades.length - wins;

    return {
      pnl: closedPnl,
      collateral: closedCollateral,
      volume,
      wins,
      losses,
    };
  }, [tradeHistory]);

  return React.useMemo(
    () => ({
      open,
      closed,
    }),
    [open, closed],
  );
};

export default useDashboardPortfolio;
