import { BigNumber } from "ethers";
import request, { gql } from "graphql-request";
import { config } from "handle-sdk";

export type TradeFees = {
  swap: BigNumber;
  marginAndLiquidation: BigNumber;
  mint: BigNumber;
  burn: BigNumber;
};

type TradeResponse = {
  swap: string;
  marginAndLiquidation: string;
  mint: string;
  burn: string;
};

export type HpsmFee = {
  id: string;
  collectedFees: BigNumber;
};

type HpsmResponse = {
  id: string;
  collectedFees: string;
};

export const getAccumulatedTradeFees = async (): Promise<TradeFees> => {
  const { feeStat } = await request<{ feeStat: TradeResponse }>(
    config.theGraphEndpoints.arbitrum.trade,
    gql`
      query {
        feeStat(id: "total") {
          swap
          marginAndLiquidation
          mint
          burn
        }
      }
    `,
  );
  return {
    swap: BigNumber.from(feeStat.swap),
    burn: BigNumber.from(feeStat.burn),
    marginAndLiquidation: BigNumber.from(feeStat.marginAndLiquidation),
    mint: BigNumber.from(feeStat.mint),
  };
};

export const getAccumulatedHpsmFees = async (): Promise<HpsmFee[]> => {
  const { collectedFees } = await request<{ collectedFees: HpsmResponse[] }>(
    config.theGraphEndpoints.arbitrum.hpsm,
    gql`
      query {
        collectedFees(first: 1000) {
          id
          collectedFees
        }
      }
    `,
  );
  return collectedFees.map(fee => ({
    id: fee.id,
    collectedFees: BigNumber.from(fee.collectedFees),
  }));
};
