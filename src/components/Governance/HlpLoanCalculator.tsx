import { BigNumber, ethers } from "ethers";
import React, { useState } from "react";
import { GovernanceRoute } from "../../navigation/Governance";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { bnToDisplayString } from "../../utils/format";
import { InputNumber } from "../index";
import { InputNumberValue } from "../InputNumber/InputNumber";
import { hlp } from "handle-sdk/dist/components/trade/platforms";

const HlpLoanCalculator = () => {
  const [borrow, setBorrow] = useState<InputNumberValue>({
    bn: ethers.constants.Zero,
    string: "0",
  });
  const [deposit, setDeposit] = useState<InputNumberValue>({
    bn: ethers.constants.Zero,
    string: "0",
  });
  const [hlpPrice, error, loading] = usePromise(() =>
    hlp.trade.getLpTokenPrice(),
  );
  if (error) return <div>error: {error}</div>;
  if (loading || !hlpPrice) return <div>loading...</div>;
  const debtAsUsd = borrow.bn.sub(deposit.bn);
  const collateralAsHlp = hlpPrice
    ? borrow.bn.mul(BigNumber.from(10).pow(18)).div(hlpPrice)
    : ethers.constants.Zero;
  const liquidationPrice = collateralAsHlp.gt(0)
    ? debtAsUsd.mul(ethers.constants.WeiPerEther).div(collateralAsHlp)
    : ethers.constants.Zero;
  return (
    <div>
      <h3>hLP Loan Calculator</h3>
      Borrow
      <InputNumber
        id={"hlc-borrow"}
        value={borrow}
        onChange={setBorrow}
        decimals={18}
      />
      worth of USD with
      <InputNumber
        id={"hlc-collateral"}
        value={deposit}
        onChange={setDeposit}
        decimals={18}
      />
      worth of USD
      <br />
      at the current hLP price of {bnToDisplayString(hlpPrice, 18)} hLP/USD
      <br />
      therefore yielding a collateral of{" "}
      {bnToDisplayString(collateralAsHlp, 18)} hLP
      <br />
      and a debt of {bnToDisplayString(debtAsUsd, 18)} USD
      <br />
      the position would be liquidated at a price of{" "}
      {bnToDisplayString(liquidationPrice, 18)} hLP/USD
    </div>
  );
};

export default {
  component: HlpLoanCalculator,
  name: "hLP Loan Calculator",
} as GovernanceRoute;
