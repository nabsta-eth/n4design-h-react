import { config } from "handle-sdk";
import { useToken } from "../context/TokenManager";
import { Erc20__factory } from "../contracts";
import { EarnTableRow } from "../navigation/Earn";
import { bnToDisplayString } from "../utils/format";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";

const network = "arbitrum";
const pool = config.lp[network].curveFxUsdFraxUsdc;

export const useFraxCurvePoolData = (): EarnTableRow => {
  const fxUsd = useToken("fxUSD", network);

  const [balance] = usePromise(async () => {
    const fraxbp_f = pool.tokensInLp.find(
      t => t.symbol === "FRAXBP-f",
    )?.address;
    if (!fxUsd || !fraxbp_f) return;
    const [fxUsdBalance, fraxUsdcBalance] = await Promise.all([
      Erc20__factory.connect(fxUsd.address, getProvider(network)).balanceOf(
        pool.contractAddress,
      ),
      Erc20__factory.connect(fraxbp_f, getProvider(network)).balanceOf(
        pool.contractAddress,
      ),
    ]);
    // both tokens have 18 decimals
    return fxUsdBalance.add(fraxUsdcBalance);
  }, [fxUsd]);

  return {
    network,
    estApr: "view on curve",
    platform: pool.platform,
    title: pool.title,
    totalDeposits: "",
    comingSoon: false,
    externalOnly: true,
    link: pool.url,
    active: true,
    category: "liquidity" as const,
    component: null,
    tvlInUSD: balance && `$${bnToDisplayString(balance, 18, 2, 2)}`,
  };
};
