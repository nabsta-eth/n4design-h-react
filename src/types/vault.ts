import { KashiPoolConfig, SingleCollateralVaultSymbol } from "handle-sdk";

export type VaultAction = "repay" | "borrow" | "withdraw";
export type SingleCollateralVaultDetails = KashiPoolConfig & {
  vaultSymbol: SingleCollateralVaultSymbol;
};
