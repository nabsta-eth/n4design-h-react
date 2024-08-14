import * as React from "react";
import BoxedConfirmButton from "./BoxedConfirmButton/BoxedConfirmButton";
import {
  useConnectedAccount,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { governance, GovernanceLockData } from "handle-sdk";
import { useMemo } from "react";
import { bnToDisplayString } from "../utils/format";
import { ethers } from "ethers";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

const RetiredGovernanceLockWithdraw: React.FC = () => {
  const signer = useSigner();
  const account = useConnectedAccount();
  const [data] = usePromise<GovernanceLockData | undefined>(
    () => governance.getData(account ?? ethers.constants.AddressZero, true),
    [account],
  );
  const balanceFormatted = useMemo(
    () =>
      bnToDisplayString(
        data?.account?.forexLocked ?? ethers.constants.Zero,
        18,
      ),
    [data],
  );
  if (!signer || !account || !data || !data.account?.forexLocked?.gt(0))
    return <></>;
  const withdraw = () => governance.withdraw(signer, undefined, true);
  return (
    <BoxedConfirmButton
      boxTitle={"governance pool v2.0 upgrade"}
      boxSubtitleComponent={
        <>
          (i) withdraw FOREX from v1.0 (ii) obtain 20fxUSD-80FOREX BPT
          <FontAwesomeIcon
            icon={["far", "external-link"]}
            className="uk-margin-small-left"
          />{" "}
          (iii) lock your BPT for veFOREX
        </>
      }
      boxLink={
        "https://docs.handle.fi/how-to-guides/add-balancer-liquidity-and-lock-for-veforex"
      }
      buttonTitle={"WITHDRAW"}
      buttonSubtitle={`${balanceFormatted} FOREX`}
      onClick={withdraw}
    />
  );
};

export default RetiredGovernanceLockWithdraw;
