import * as React from "react";
import { FxKeeperPoolPool } from "handle-sdk";
import { BigNumber } from "ethers";
import DisplayEarnPoolData from "../DisplayEarnPoolData";
import { bnToDisplayString } from "../../utils/format";
import { useEffect } from "react";
import { useTokenManager } from "../../context/TokenManager";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";

type Props = {
  keeperPool?: FxKeeperPoolPool;
};

type CollateralGain = {
  symbol: string;
  amount: BigNumber;
  decimals: number;
};

const UnclaimedLiquidationGains: React.FC<Props> = ({ keeperPool }) => {
  const tokenManager = useTokenManager();
  const network = useConnectedNetwork();
  const [unclaimedLiquidationGains, setUnclaimedLiquidationGains] =
    React.useState<CollateralGain[]>([]);

  useEffect(() => {
    if (!keeperPool || !keeperPool.account || !network)
      return setUnclaimedLiquidationGains([]);
    (async () => {
      const rewards = keeperPool.account!.rewards;
      const gains: CollateralGain[] = rewards.collateralTypes
        .map((address, i) => {
          const token = tokenManager.getTokenByAddress(address, network);
          if (!token) {
            console.error(
              `UnclaimedLiquidationGains: could not find token for address ${address}`,
            );
            return null;
          }
          return {
            symbol: token.symbol,
            decimals: token.decimals,
            amount: rewards.collateralAmounts[i],
          };
        })
        .filter(gain => gain !== null && gain.amount.gt(0)) as CollateralGain[];
      setUnclaimedLiquidationGains(gains);
    })();
  }, [keeperPool, network, tokenManager]);

  return (
    <>
      {unclaimedLiquidationGains.map(gain => (
        <DisplayEarnPoolData
          key={gain.symbol}
          title={`unclaimed liq. gain`}
          data={bnToDisplayString(gain.amount, gain.decimals, 4)}
          symbol={gain.symbol}
        />
      ))}
    </>
  );
};

export default UnclaimedLiquidationGains;
