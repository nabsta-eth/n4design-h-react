import * as React from "react";
import { Network, NETWORK_NAMES, PendingWithdrawal } from "handle-sdk";
import { Button } from "../index";
import { displayDollarsAndCents } from "../../utils/format";

const PendingWithdrawalsTable: React.FC<{
  pendingWithdrawals: PendingWithdrawal[];
  withdrawingHash: string | undefined;
  connectedNetwork: Network | undefined;
  onWithdraw: (pw: PendingWithdrawal) => Promise<void>;
}> = props => {
  const buttons = props.pendingWithdrawals
    .sort((a, b) => {
      const aNetworkIndex = NETWORK_NAMES.indexOf(a.toNetwork);
      const bNetworkIndex = NETWORK_NAMES.indexOf(b.toNetwork);

      if (aNetworkIndex > bNetworkIndex) {
        return 1;
      } else if (aNetworkIndex < bNetworkIndex) {
        return -1;
      } else {
        return a.nonce.gt(b.nonce) ? 1 : -1;
      }
    })
    .map(pendingWithdrawal => {
      const nonces = props.pendingWithdrawals.filter(
        pw => pw.toNetwork === pendingWithdrawal.toNetwork,
      );

      const canClaim = nonces[0].nonce.eq(pendingWithdrawal.nonce);

      return (
        <Button
          id={`withdraw-${pendingWithdrawal.txHash}`}
          key={`withdraw-${pendingWithdrawal.txHash}`}
          className="uk-margin-small-top"
          expand={true}
          onClick={() => props.onWithdraw(pendingWithdrawal)}
          disabled={!canClaim || !!props.withdrawingHash}
          loading={props.withdrawingHash === pendingWithdrawal.txHash}
        >
          {`withdraw ${displayDollarsAndCents(pendingWithdrawal.amount)} ${
            pendingWithdrawal.tokenSymbol
          } to ${pendingWithdrawal.toNetwork}`}
        </Button>
      );
    });

  return <div>{buttons}</div>;
};

export default PendingWithdrawalsTable;
