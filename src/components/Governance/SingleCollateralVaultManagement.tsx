import * as React from "react";
import {
  SINGLE_COLLATERAL_NETWORK_NAMES,
  SingleCollateralVault,
  SingleCollateralVaultNetwork,
} from "handle-sdk";
import { useSingleCollateralVaults } from "../../context/Vaults";
import { InputNumber, PageTitle, SimpleSelect } from "../index";
import { ethers } from "ethers";
import useVaultSDK from "../../hooks/useVaultSdk";
import {
  useConnectedAccount,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import useSendTransaction from "../../hooks/useSendTransaction";
import useSingleCollateralVaultDepositApproval from "../../hooks/useSingleCollateralVaultDepositApproval";
import { useSingleCollateralRepayAllowance } from "../../hooks/useAllowanceFromSDK";
import useInputNumberState from "../../hooks/useInputNumberState";
import { ADMIN_NOTIFICATIONS } from "../../config/notifications";
import { GovernanceRoute } from "../../navigation/Governance";

const DEFAULT_NETWORK = "arbitrum";

const SingleCollateralVaultManagement: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] =
    React.useState<SingleCollateralVaultNetwork>(DEFAULT_NETWORK);

  const [vaults] = useSingleCollateralVaults({
    network: selectedNetwork,
    fetch: true,
  });
  return (
    <div>
      <PageTitle text="kashi pools" />
      <SimpleSelect
        options={SINGLE_COLLATERAL_NETWORK_NAMES.map(network => ({
          value: network,
        }))}
        value={selectedNetwork}
        onChange={setSelectedNetwork}
      />
      {!vaults.length && <p>Loading...</p>}
      {vaults.map(v => {
        return (
          <div key={v.vaultSymbol} style={{ display: "flex" }}>
            <div>
              <p>{v.vaultSymbol}</p>
              <p>Available: {ethers.utils.formatEther(v.availableToBorrow)}</p>
            </div>
            <div>
              <AddFxTokenForm
                vault={v}
                disabled={false}
                network={selectedNetwork}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

type AddFxTokenFormProps = {
  vault: SingleCollateralVault;
  disabled: boolean;
  network: SingleCollateralVaultNetwork;
};

const AddFxTokenForm: React.FC<AddFxTokenFormProps> = ({
  vault,
  disabled,
  network,
}) => {
  const vaultsSDK = useVaultSDK();
  const signer = useSigner();
  const { sendTransaction } = useSendTransaction();
  const connectedAccount = useConnectedAccount();

  const [kashiApproved, signKashiApproval] =
    useSingleCollateralVaultDepositApproval(connectedAccount, network);

  const { allowance, updateAllowance } = useSingleCollateralRepayAllowance(
    vault.fxToken.symbol,
    network,
  );

  const fxTokenAmount = useInputNumberState();

  const onSubmit = async () => {
    if (!signer || !allowance || !vaultsSDK) {
      return;
    }

    let approveKashiSignature: ethers.Signature | undefined;

    if (!kashiApproved) {
      approveKashiSignature = await signKashiApproval();
    }

    const amount = fxTokenAmount.value.bn;

    if (allowance.lt(amount)) {
      await updateAllowance(amount);
    }

    await sendTransaction(
      gasPrice =>
        vaultsSDK.supplyFxTokenSingleCollateral(
          {
            amount,
            vaultSymbol: vault.vaultSymbol,
            network,
            approveKashiSignature,
          },
          signer,
          { gasPrice },
        ),
      ADMIN_NOTIFICATIONS,
    );
  };

  return (
    <div>
      <InputNumber
        id="amount"
        name="amount"
        value={fxTokenAmount.value}
        onChange={fxTokenAmount.onChange}
        decimals={18}
        disabled={disabled}
      />

      <button type="submit" onClick={onSubmit}>
        Submit
      </button>
    </div>
  );
};

export default {
  component: SingleCollateralVaultManagement,
  name: "SingleCollateralVaultManagement",
} as GovernanceRoute;
