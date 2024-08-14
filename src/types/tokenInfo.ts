import { ethers } from "ethers";
import { TokenInfo } from "handle-sdk";

export type OptionalTokenBalance = { balance?: ethers.BigNumber };
export type OptionalTokenPrice = { price?: ethers.BigNumber };
export type TokenWithBalance = TokenInfo & OptionalTokenBalance;
export type TokenWithOptionalPrice = TokenInfo & OptionalTokenPrice;
export type TokenWithBalanceAndPrice = TokenInfo &
  OptionalTokenBalance &
  OptionalTokenPrice;
