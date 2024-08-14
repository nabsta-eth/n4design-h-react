export type ActivePositionEntity = {
  id: string;
  account: string;
  averagePrice: string;
  collateral: string;
  size: string;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  createdAt: number;
  firstIncreaseTransactionHash: string;
};

export type IncreasePositionEntity = {
  key: string;
  price: string;
  timestamp: number;
};

export type TokenConfigEntity = {
  token: string;
  minProfitBasisPoints: string;
};

export type ChainlinkPriceEntity = {
  token: string;
  value: string;
};
