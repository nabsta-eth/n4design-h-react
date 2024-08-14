import {
  FxKeeperPoolPool,
  GovernanceLockData,
  LpStakingData,
  Network,
  SingleCollateralVault,
  Vault,
} from "handle-sdk";
import useDashboardAssets, {
  DashboardAssetsHookValue,
} from "./useDashboardAssets";
import useDashboardDebt, { DashboardDebtHookValue } from "./useDashboardDebt";
import React from "react";
import { useProtocolData } from "./useProtocolData";
import useDashboardPortfolio, {
  DashboardPortfolioHookValue,
} from "./useDashboardPortfolio";

export type DashboardHookArgs = {
  network: Network;
  account: string;
};

export type DashboardHook = {
  assets: DashboardAssetsHookValue;
  debt: DashboardDebtHookValue;
  portfolio: DashboardPortfolioHookValue;
  // income: DashboardIncomeHook;
  // expenses: DashboardExpensesHook;
  protocolData: {
    lpStakingPools?: LpStakingData[];
    fxKeeperPools?: FxKeeperPoolPool[];
    multiCollateralVaults?: Vault[];
    singleCollateralVaults?: SingleCollateralVault[];
    governanceLockData?: GovernanceLockData;
  };
};

const useDashboard = ({
  network,
  account,
}: DashboardHookArgs): DashboardHook => {
  const protocolData = useProtocolData(network, account);
  const {
    lpStakingPools,
    fxKeeperPools,
    multiCollateralVaults,
    singleCollateralVaults,
    governanceLockData,
  } = protocolData;

  const assets = useDashboardAssets({
    network,
    account,
    lpStakingPools,
    fxKeeperPools,
    multiCollateralVaults,
    singleCollateralVaults,
    governanceLockData,
  });

  const debt = useDashboardDebt({
    multiCollateralVaults,
    singleCollateralVaults,
  });

  const portfolio = useDashboardPortfolio({
    account,
    network,
  });

  // TODO implement income & expenses after portfolio
  // const income = useDashboardIncome({
  //   network,
  //   account,
  // });
  // const expenses = useDashboardExpenses({
  //   network,
  //   account,
  //   assetsHook: assets,
  //   incomeHook: income,
  //   debtHook: debt,
  // });

  // TODO add portfolio data

  return React.useMemo(
    () => ({
      assets,
      debt,
      portfolio,
      // income,
      // expenses,
      protocolData,
    }),
    [assets, debt, portfolio, /*income, expenses,*/ protocolData],
  );
};

export default useDashboard;
