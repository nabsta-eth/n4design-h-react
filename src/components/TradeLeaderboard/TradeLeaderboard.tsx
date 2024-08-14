import classes from "./TradeLeaderboard.module.scss";
import { TradeNetwork } from "handle-sdk/dist/types/network";
import { getTradeUsdToken, useTrade } from "../../context/Trade";
import { TradeReader } from "handle-sdk/dist/components/trade/reader";
import {
  TradeAccount,
  TradeAdapter,
  TradeProtocol,
} from "handle-sdk/dist/components/trade";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useEffect, useState } from "react";
import { useTradePrices } from "../../context/TradePrices";
import { amountToDisplayString } from "../../utils/format";
import { retryPromise } from "../../utils/general";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import classNames from "classnames";

export type TradeLeaderboardProps = {
  accountIds: number[];
  network: TradeNetwork;
};

export const TradeLeaderboard = ({
  accountIds,
  network,
}: TradeLeaderboardProps) => {
  useTradePrices();
  const { protocol, adapter, reader } = useTrade();
  const [accounts] = usePromise(
    () => fetchAccounts(accountIds, reader, protocol, adapter, network),
    [accountIds, reader, adapter, network],
  );
  const [_, setUpdateCounter] = useState(0);
  useEffect(() => {
    if (!accounts) {
      return;
    }
    accounts.forEach(a => {
      a.onUpdate = () => setUpdateCounter(c => c + 1);
      a.subscribeToRemoteUpdates();
    });
    return () => {
      accounts.forEach(a => a.cancelSubscriptionToRemoteUpdates());
    };
  }, [accounts]);
  const rows = (accounts ?? []).map(mapAccountData);
  rows?.sort((a, b) => (+b?.equity || 0) - (+a?.equity || 0));
  return (
    <Container size="xl">
      <h2>leaderboard</h2>
      <table className="uk-table uk-table-divider">
        <thead className="uk-table-header">
          <tr className="hfi-table-header-row">
            <th>rank</th>
            <th className="uk-text-center">account id</th>
            <th className="uk-text-right">account value</th>
            <th className="uk-text-right">open positions</th>
            <th className="uk-text-right">open interest</th>
            <th className="uk-text-right">account leverage</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((data, i) => (
            <TableRow key={data.accountId} rank={i + 1} {...data} />
          ))}
        </tbody>
      </table>
    </Container>
  );
};

type FormattedAccountData = {
  accountId: string;
  equity: string;
  positionCount: string;
  openInterest: string;
  leverage: string;
};

type TableRowProps = FormattedAccountData & {
  rank: number;
};

const TableRow = ({
  rank,
  accountId,
  equity,
  positionCount,
  openInterest,
  leverage,
  ...rest
}: TableRowProps) => (
  <tr
    {...rest}
    className={classNames({
      [classes.gold]: rank === 1,
      [classes.silver]: rank === 2,
      [classes.bronze]: rank === 3,
    })}
  >
    <td>
      {rank}
      {rank < 4 && (
        <FontAwesomeIcon
          className="uk-margin-small-left"
          icon={["far", "medal"]}
        />
      )}
    </td>
    <td className="uk-text-center">{accountId}</td>
    <td className="uk-text-right">{equity}</td>
    <td className="uk-text-right">{positionCount}</td>
    <td className="uk-text-right">{openInterest}</td>
    <td className="uk-text-right">{leverage}</td>
  </tr>
);

const fetchAccounts = async (
  accountIds: number[],
  reader: TradeReader,
  protocol: TradeProtocol,
  adapter: TradeAdapter,
  network: TradeNetwork,
): Promise<TradeAccount[]> =>
  Promise.all(
    accountIds.map(id =>
      retryPromise(() =>
        TradeAccount.fromId(
          id,
          reader,
          protocol,
          adapter,
          getTradeUsdToken(network).address,
        ),
      ),
    ),
  );

const mapAccountData = (account: TradeAccount): FormattedAccountData => {
  return {
    accountId: account.id.toString(),
    equity: amountToDisplayString(account.getEquity()),
    positionCount: account.getAllPositions().length.toString(),
    openInterest: amountToDisplayString(account.getOpenInterest()),
    leverage: `${amountToDisplayString(account.getLeverage())}x`,
  };
};
