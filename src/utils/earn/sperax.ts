import React from "react";
import { EarnTableData } from ".";
import { useToken } from "../../context/TokenManager";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { bnToDisplayString } from "../format";
import { getTokenBalances } from "../erc20";
import { constants } from "ethers";

const DEMETER_POOL = "0x7F18D4d3938936Bb3D94773F1D937e0fb3ABDccA";
const DEMETER_FXUSD_USDS_LINK =
  "https://demeter.sperax.io/farm/42161/0xad97b487141dd860057171e9a11e64ed6e811402?source=FarmExplore";
const network = "arbitrum";

export const useSperaxData = (): EarnTableData => {
  const fxUsd = useToken("fxUSD", network);
  const usds = useToken("USDs", network);

  const [balance] = usePromise(async () => {
    if (!usds || !fxUsd) return;
    const balances = await getTokenBalances(DEMETER_POOL, network, [
      fxUsd.address,
      usds.address,
    ]);

    // USDs & fxUSD have 18 decimals, so no adjustments are needed
    return Object.values(balances)
      .filter(b => !!b)
      .reduce((acc, curr) => acc?.add(curr!), constants.Zero);
  }, [usds, fxUsd]);

  const speraxData: EarnTableData = React.useMemo(
    () => ({
      title: "demeter fxUSD-USDs",
      network,
      platform: "sperax",
      // TODO https://github.com/handle-fi/handle-react/issues/1312
      estApr: "view on demeter",
      // both USDs & fxUSD are USD stablecoins with 18 decimals, so
      // TVL is the sum of the token balances (to 18 decimals)
      tvlInUSD: balance ? `$${bnToDisplayString(balance, 18, 2, 2)}` : "$0.00",
      totalDeposits: "", // won't be displayed
      externalOnly: true,
      link: DEMETER_FXUSD_USDS_LINK,
    }),
    [balance],
  );

  return speraxData;
};
