import { Network } from "handle-sdk";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { VaultAction } from "../../types/vault";
import ButtonTabs from "../ButtonTabs";

type VaultType = "multi-collateral" | "single-collateral";

type Props = {
  active: VaultType;
  fxToken: string;
  network: Network;
  account: string;
  action: VaultAction;
};

const VaultTypeTabs: React.FC<Props> = ({
  active,
  fxToken,
  network,
  account,
  action,
}) => {
  const navigate = useNavigate();

  const onChange = (type: VaultType) => {
    if (type === "multi-collateral") {
      navigate(`/vaults/multi/${fxToken}/${account}/${action}`);
      return;
    }
    navigate(`/vaults/single/${network}/${fxToken}/${account}/${action}`);
  };

  return (
    <ButtonTabs
      wrapperClassName="uk-margin-top uk-margin-bottom uk-width-expand"
      active={active}
      buttons={[
        { name: "multi-collateral", disabled: network !== "arbitrum" },
        { name: "single-collateral", disabled: network !== "arbitrum" },
      ]}
      onClick={onChange}
    />
  );
};

export default VaultTypeTabs;
