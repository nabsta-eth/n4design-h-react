import { BigNumber } from "ethers";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_NOTIFICATIONS } from "../config/notifications";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import useSendTransaction from "../hooks/useSendTransaction";
import { STAKED_HLP_POOL_ID } from "../hooks/useStakedHlpData";
import { EarnTableData, formatExactAprRow } from "../utils/earn";
import { bnToDisplayString } from "../utils/format";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import DisplayEarnPoolData from "./DisplayEarnPoolData";
import EarnPoolBase from "./EarnPoolBase";
import { rewards } from "handle-sdk";

type Props = {
  data: Pick<EarnTableData, "totalDeposits" | "exactApr">;
};

const StakedHlpPool = ({ data }: Props) => {
  const navigate = useNavigate();
  const { connection } = useUserWalletStore();
  const [claimableBalance, setClaimableBalance] = React.useState<BigNumber>();
  const [deposit, setDeposit] = React.useState<BigNumber>();
  const { sendTransaction, sendingTransaction } = useSendTransaction();

  React.useEffect(() => {
    if (!connection.user.isConnected) {
      setClaimableBalance(undefined);
      return;
    }
    rewards
      .getClaimableBalance(connection.user.address, STAKED_HLP_POOL_ID)
      .then(setClaimableBalance);
    rewards
      .getDeposit(connection.user.address, STAKED_HLP_POOL_ID)
      .then(([d]) => setDeposit(d));
  }, [connection.user]);

  const claim = async (tab: string) => {
    switch (tab) {
      case "claim rewards":
        if (!connection.user.isConnected) {
          showNotification({
            message: `connect wallet to claim rewards`,
            status: "info",
          });
          break;
        }
        const signer = connection.user.signer;
        await sendTransaction(
          gasPrice =>
            rewards.claimFromPool(signer, STAKED_HLP_POOL_ID, {
              gasPrice,
            }),
          DEFAULT_NOTIFICATIONS,
        );
        break;
      case "deposit":
        navigate("/convert?fromToken=fxUSD&toToken=hLP&network=arbitrum");
        break;
      case "withdraw":
        navigate("/convert?toToken=fxUSD&fromToken=hLP&network=arbitrum");
        break;
      default:
        throw new Error(`Tab '${tab}' not recognised`);
    }
  };

  return (
    <EarnPoolBase
      onTabClick={claim}
      selectedTab=""
      tabButtons={[
        { name: "deposit" },
        { name: "withdraw" },
        {
          name: "claim rewards",
          disabled:
            sendingTransaction ||
            !connection.user.isConnected ||
            !claimableBalance?.gt(0),
        },
      ]}
    >
      {[
        null,
        <React.Fragment key={"right-row"}>
          <div>total staked: {data.totalDeposits} hLP</div>

          <DisplayEarnPoolData
            title="your staked"
            data={deposit && bnToDisplayString(deposit, 18, 2)}
            symbol="hLP"
          />
          <DisplayEarnPoolData
            title="your unclaimed rewards"
            data={
              claimableBalance && bnToDisplayString(claimableBalance, 18, 2)
            }
            symbol="FOREX"
          />
          {formatExactAprRow(data.exactApr)}
        </React.Fragment>,
      ]}
    </EarnPoolBase>
  );
};

export default StakedHlpPool;
