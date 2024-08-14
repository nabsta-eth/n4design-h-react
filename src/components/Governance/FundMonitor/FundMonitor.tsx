import * as React from "react";
import { PageTitle } from "../../";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { useTokenManager } from "../../../context/TokenManager";
import { Monitor, monitors as monitorsConfig, lowBalances } from "./config";
import { BigNumber } from "ethers";
import { fetchBalance } from "./balance";
import { bnToDisplayString } from "../../../utils/format";
import classNames from "classnames";
import classes from "./FundMonitor.module.scss";
import { Network, TokenManager } from "handle-sdk";
import { getExplorerUrl } from "../../../utils/general";

type BalanceMonitor = Omit<Monitor, "networks"> & {
  balance: BigNumber;
  network: Network;
};

export const FundMonitor: React.FC = () => {
  const tokenManager = useTokenManager();
  const [monitors, setMonitors] = React.useState<BalanceMonitor[]>([]);
  // Initialise monitors.
  React.useEffect(() => {
    monitorsConfig.forEach(monitor =>
      monitor.networks.forEach(network => {
        fetchBalanceMonitor(monitor, network, tokenManager).then(
          balanceMonitor =>
            setMonitors(monitors => [...monitors, balanceMonitor]),
        );
      }),
    );
  }, []);
  return (
    <div>
      <PageTitle text="bot & contract fund monitor" />
      {monitors.length >= monitorsConfig.length && (
        <MonitorTable monitors={monitors.sort()} />
      )}
    </div>
  );
};

const MonitorTable = ({ monitors }: { monitors: BalanceMonitor[] }) => (
  <Table size="xs" className={classNames(classes.noBorder)}>
    <TableBody>
      <TableRow>
        <TableData>name</TableData>
        <TableData>balance</TableData>
        <TableData>symbol</TableData>
        <TableData>network</TableData>
      </TableRow>
      {monitors.map(monitor => (
        <TableRow
          key={getMonitorKey(monitor)}
          className={classNames({
            [classes.error]: isLowBalance(monitor),
          })}
        >
          <TableData>
            <a
              href={getExplorerUrl(monitor.address, "address", monitor.network)}
              target="_blank"
            >
              <span>{monitor.name}</span>
            </a>
          </TableData>
          <TableData>{bnToDisplayString(monitor.balance, 18, 3)}</TableData>
          <TableData>{monitor.balanceSymbol}</TableData>
          <TableData>{monitor.network}</TableData>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const fetchBalanceMonitor = async (
  monitor: Monitor,
  network: Network,
  tokenManager: TokenManager,
): Promise<BalanceMonitor> => {
  const symbol = monitor.balanceSymbol;
  const isEth = symbol.toUpperCase() === "ETH";
  const token = isEth
    ? undefined
    : tokenManager.getTokenBySymbol(symbol, network);
  if (!isEth && !token)
    throw new Error(`FundMonitor: could not fetch balance for ${symbol}`);
  const balance = await fetchBalance(monitor.address, network, token?.address);
  return {
    ...monitor,
    network,
    balance,
    balanceSymbol: parseTokenSymbol(symbol, network, tokenManager),
  };
};

const getMonitorKey = ({ address, network, balanceSymbol }: BalanceMonitor) =>
  `${address}${network}${balanceSymbol}`;

const isLowBalance = ({ balance, balanceSymbol }: BalanceMonitor) =>
  balance.lte(lowBalances[balanceSymbol]);

const parseTokenSymbol = (
  symbol: string,
  network: Network,
  manager: TokenManager,
) => {
  if (symbol.toUpperCase() !== "ETH") return symbol;
  const parsed = manager.getNativeToken(network);
  if (!parsed) throw new Error("parseTokenSymbol: Could not parse");
  return parsed.symbol;
};
