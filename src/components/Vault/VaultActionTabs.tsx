import * as React from "react";
import { VaultAction } from "../../types/vault";
import ButtonTabs from "../ButtonTabs";

type Props = {
  active: VaultAction;
  onChange: (newAction: VaultAction) => void;
  disabled?: Partial<{ [key in VaultAction]: boolean }>;
};

const VaultActionTabs: React.FC<Props> = ({ active, disabled, onChange }) => {
  return (
    <ButtonTabs
      wrapperClassName="uk-margin-bottom uk-width-expand"
      active={active}
      buttons={[
        { name: "borrow", disabled: disabled?.borrow },
        { name: "repay", disabled: disabled?.repay },
        {
          name: "withdraw",
          disabled: disabled?.withdraw,
        },
      ]}
      onClick={onChange}
    />
  );
};

export default VaultActionTabs;
