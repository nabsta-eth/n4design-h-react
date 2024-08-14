import { ethers } from "ethers";
import React from "react";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { GovernanceRoute } from "../../navigation/Governance";
import { formatPrice } from "../../utils/trade";
import { useTokenManager } from "../../context/TokenManager";
import {
  getAccumulatedHpsmFees,
  getAccumulatedTradeFees,
  HpsmFee,
  TradeFees,
} from "../../utils/governance";

const FeeTracker = () => {
  const connectedNetwork = useConnectedNetwork();
  const network = connectedNetwork || "arbitrum";
  const [tradeFees, setTradeFees] = React.useState<TradeFees>();
  const [hpsmFees, setHpsmFees] = React.useState<HpsmFee[]>();
  const tokenManager = useTokenManager();

  React.useEffect(() => {
    if (!network) return;
    (async () => {
      setTradeFees(await getAccumulatedTradeFees());
      setHpsmFees(await getAccumulatedHpsmFees());
    })();
  }, [network]);

  const hlpTotal =
    tradeFees &&
    tradeFees.marginAndLiquidation
      .add(tradeFees.mint)
      .add(tradeFees.burn)
      .add(tradeFees.swap);

  return (
    <div>
      <h3>hLP Fees</h3>
      {tradeFees && (
        <>
          <div>
            <span>Margin and Liquidation: </span>
            <span>{formatPrice(tradeFees.marginAndLiquidation)}</span>
          </div>
          <div>
            <span>Mint: </span>
            <span>{formatPrice(tradeFees.mint)}</span>
          </div>
          <div>
            <span>Burn: </span>
            <span>{formatPrice(tradeFees.burn)}</span>
          </div>
          <div>
            <span>Swap: </span>
            <span>{formatPrice(tradeFees.swap)}</span>
          </div>
          <div>
            <span>Total: </span>
            <span>{hlpTotal && formatPrice(hlpTotal)}</span>
          </div>
        </>
      )}
      <h3>hPSM Fees</h3>
      {hpsmFees?.map(e => {
        const token = tokenManager.getTokenByAddress(e.id, network);
        return (
          <div>
            <span>{token?.symbol || e.id}: </span>
            <span>
              {ethers.utils.formatUnits(e.collectedFees, token?.decimals ?? 18)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default {
  component: FeeTracker,
  name: "Fee Tracker",
} as GovernanceRoute;
