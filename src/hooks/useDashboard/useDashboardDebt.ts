import { BigNumber } from "ethers";
import { SingleCollateralVault, Vault } from "handle-sdk";
import React from "react";
import { sumBn } from "../../utils/general";

export type DashboardDebtHookArgs = {
  multiCollateralVaults?: Vault[];
  singleCollateralVaults?: SingleCollateralVault[];
};

export type DashboardDebtHookValue = {
  // the total debt in eth (naturally to 18 decimals)
  debtInEth?: BigNumber;
};

const useDashboardDebt = ({
  multiCollateralVaults,
  singleCollateralVaults,
}: DashboardDebtHookArgs): DashboardDebtHookValue => {
  const multiCollateralVaultsDebt =
    multiCollateralVaults && sumBn(multiCollateralVaults.map(v => v.debtAsEth));

  const singleCollateralVaultsDebt =
    singleCollateralVaults &&
    sumBn(singleCollateralVaults.map(v => v.debtAsEth));

  const totalDebt =
    multiCollateralVaultsDebt &&
    singleCollateralVaultsDebt &&
    multiCollateralVaultsDebt.add(singleCollateralVaultsDebt);

  return React.useMemo(
    () => ({
      debtInEth: totalDebt,
    }),
    [multiCollateralVaults, singleCollateralVaults],
  );
};

export default useDashboardDebt;
