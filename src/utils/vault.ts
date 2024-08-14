import { ethers } from "ethers";
import {
  Collateral,
  CollateralSymbol,
  config as sdkConfig,
  FxToken,
  Network,
  ProtocolParameters,
  SingleCollateralVaultNetwork,
  SingleCollateralVaultSymbol,
  Vault,
  VaultController,
} from "handle-sdk";
import { SingleCollateralVaultDetails } from "../types/vault";

export const checkVaultSafety = (
  vault: Pick<Vault, "collateralRatio" | "minimumMintingRatio"> | undefined,
) =>
  vault?.collateralRatio.gt(0) &&
  vault.collateralRatio.gte(vault.minimumMintingRatio);

const getKashiPoolDetailsByNetwork = (_network: Network) => {
  // we return an empty array as it is safe to cast
  const network = _network as SingleCollateralVaultNetwork;
  const vaults = sdkConfig.singleCollateralVaults[network];

  if (!vaults) {
    return [];
  }

  return Object.keys(vaults).reduce((progress, _vaultSymbol) => {
    const vaultSymbol = _vaultSymbol as SingleCollateralVaultSymbol;
    const vault = sdkConfig.singleCollateralVaults[network][vaultSymbol];
    return [
      ...progress,
      {
        ...vault,
        vaultSymbol,
      },
    ];
  }, [] as SingleCollateralVaultDetails[]);
};

export const getKashiPoolDetailsByNetworkAndFxToken = (
  network: Network,
  fxToken: string,
) => {
  const pools = getKashiPoolDetailsByNetwork(network);
  return pools.filter(pool => pool.fxToken === fxToken);
};

export const getKashiPoolDetails = (
  network: Network,
  fxToken: string,
  collateralSymbol: string,
) => {
  const pools = getKashiPoolDetailsByNetworkAndFxToken(network, fxToken);
  const pool = pools.find(pool => pool.collateral.symbol === collateralSymbol);
  // if a pool cant be found return the default one for the network
  return pool || getKashiPoolDetailsByNetwork(network)[0];
};

export const getAvailableSingleCollateralVaultCollaterals = (
  network: Network,
  fxToken: string,
) => {
  const pools = getKashiPoolDetailsByNetworkAndFxToken(network, fxToken);
  return pools.map(p => p.collateral.symbol);
};

export const getAvailableSingleCollateralVaultFxTokens = (network: Network) => {
  const pools = getKashiPoolDetailsByNetwork(network);

  return pools
    .map(p => p.fxToken)
    .filter((item, i, ar) => ar.indexOf(item) === i);
};

export const calculateUpdatedAvailableToMintAfterCollateralDeposit = (
  additionalCollateralAmount: ethers.BigNumber,
  collateralSymbol: CollateralSymbol,
  vault: Vault,
  fxToken: FxToken,
  collaterals: Collateral[],
  protocolParameters: ProtocolParameters,
) => {
  const vaultCollateralWithBalanceDepositedAsCollateral = new VaultController(
    vault,
    protocolParameters,
    fxToken,
    collaterals,
  );

  vaultCollateralWithBalanceDepositedAsCollateral.addCollateral(
    collateralSymbol,
    additionalCollateralAmount,
  );

  return vaultCollateralWithBalanceDepositedAsCollateral.vault.availableToMint;
};

export const calculateCollateralAmountValueAsFx = (
  amount: ethers.BigNumber,
  collateral: Collateral,
  fxToken: FxToken,
) => {
  return amount
    .mul(collateral.price)
    .div(ethers.BigNumber.from("10").pow(collateral.decimals))
    .mul(ethers.constants.WeiPerEther)
    .div(fxToken.price);
};
