import {
  EarnTableData,
  calculateAndFormatAprRange,
  calculateAndFormatUserApr,
} from "../utils/earn";
import { Network, rewards, utils } from "handle-sdk";
import { useHlpVaultBalance } from "../context/HlpVaultBalance";
import { bnToDisplayString } from "../utils/format";
import * as React from "react";
import { BigNumber } from "ethers";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import { getHlpContracts } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { useMemoInterval } from "./useMemoInterval";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";

export const STAKED_HLP_POOL_ID = BigNumber.from(9);

type AprData = {
  userBoost?: number;
  poolApr: number;
  averagePoolBoost: number;
};

export const useStakedHlpData = (
  network: Network,
): EarnTableData | undefined => {
  const { tvl, balances } = useHlpVaultBalance();

  // stale TVL that updates every 5 seconds
  const staleTvl = useMemoInterval(() => tvl, 5000, [balances]);

  const connectedAccount = useConnectedAccount();
  const [apr, setApr] = React.useState<AprData>();

  const [shlpSupply] = usePromise(async () => {
    const { sHlp } = getHlpContracts(network);
    return sHlp.totalSupply();
  }, [network]);

  React.useEffect(() => {
    (async () => {
      const [poolApr, averagePoolBoost] = await Promise.all([
        utils.reward.fetchHlpVaultFeeApr(network),
        rewards.fetchAveragePoolBoost(
          STAKED_HLP_POOL_ID,
          getProvider(network),
          network,
        ),
      ]);
      setApr({ poolApr, averagePoolBoost });

      if (connectedAccount) {
        utils.reward
          .fetchUserBoost(
            connectedAccount,
            STAKED_HLP_POOL_ID,
            getProvider(network),
            network,
          )
          .then(userBoost => setApr(apr => apr && { ...apr, userBoost }))
          .catch(_ => {});
      }
    })();
  }, [connectedAccount, network]);

  if (network !== "arbitrum") return;

  return {
    estApr: apr
      ? calculateAndFormatAprRange(apr.poolApr, apr.averagePoolBoost)
      : "-",
    exactApr:
      apr &&
      calculateAndFormatUserApr(
        apr.userBoost,
        apr.poolApr,
        apr.averagePoolBoost,
      ),
    network,
    platform: "handle",
    title: "handle Liquidity Pool - hLP",
    totalDeposits: shlpSupply
      ? bnToDisplayString(shlpSupply, 18, 2, 2)
      : "0.00",
    tvlInUSD: `$${bnToDisplayString(staleTvl, PRICE_DECIMALS, 2, 2)}`,
  };
};
