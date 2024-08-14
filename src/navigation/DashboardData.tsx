import React from "react";
import useDashboard from "../hooks/useDashboard";
import { useAccount } from "../context/Account";
import useSetAccount from "../hooks/useSetAccount";
import { formatPrice } from "../utils/trade";

const DashboardData = () => {
  useSetAccount();
  const account = useAccount();

  return <div>{account && <Json account={account} />}</div>;
};

const Json = (props: { account: string }) => {
  const { portfolio } = useDashboard({
    account: props.account,
    network: "arbitrum",
  });
  return (
    <div>
      {portfolio.open && (
        <div>
          <h3>Open</h3>
          <div>
            Long Collateral: {formatPrice(portfolio.open.collateral.long)}
          </div>
          <div>
            Short Collateral: {formatPrice(portfolio.open.collateral.short)}
          </div>
          <div>Long Size: {formatPrice(portfolio.open.size.long)}</div>
          <div>Short Size: {formatPrice(portfolio.open.size.short)}</div>
          <div>Long Pnl: {formatPrice(portfolio.open.pnl.long)}</div>
          <div>Short Pnl: {formatPrice(portfolio.open.pnl.short)}</div>
        </div>
      )}
      {portfolio.closed && (
        <div>
          <h3>Closed</h3>
          <div>Pnl: {formatPrice(portfolio.closed.pnl)}</div>
          <div>Collateral: {formatPrice(portfolio.closed.collateral)}</div>
          <div>Volume: {formatPrice(portfolio.closed.volume)}</div>
          <div>Wins: {portfolio.closed.wins}</div>
          <div>Losses: {portfolio.closed.losses}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardData;
