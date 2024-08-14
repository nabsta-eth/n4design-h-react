import { Network, NETWORK_NAMES } from "handle-sdk";
import Select, { Props as SelectProps } from "./Select/Select";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";
import SelectIconButton from "./SelectIconButton/SelectIconButton";
import { SelectOption } from "../types/select";

export type NetworkAndAll = Network | "all";

export type NetworkDisplay =
  | Network
  | "unsupported"
  | "connecting..."
  | "disconnected";

export type BaseProps = Omit<
  SelectProps<Network>,
  "options" | "value" | "isSelected"
> & {
  networksToExclude?: Network[];
};

type DropdownPosition =
  | "top"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";
type UnsupportedNetworkProps = BaseProps & {
  includeAllOption?: false;
  value: NetworkDisplay;
  onChange: (network: Network) => void;
  dropdownPosition?: DropdownPosition;
  showIconButton?: boolean;
  showIconRight?: boolean;
  containerId?: string;
  dropdownClassName?: string;
};

type AllNetworkProps = BaseProps & {
  includeAllOption: true;
  value: NetworkAndAll;
  onChange: (network: NetworkAndAll) => void;
  dropdownPosition?: DropdownPosition;
  showIconButton?: boolean;
  showIconRight?: boolean;
  containerId?: string;
  dropdownClassName?: string;
};

type Props = UnsupportedNetworkProps | AllNetworkProps;

const SelectNetwork: React.FC<Props> = props => {
  const {
    value,
    includeAllOption,
    networksToExclude,
    dropdownPosition,
    showIconButton,
    showIconRight,
    containerId,
    dropdownClassName,
    ...rest
  } = props;

  let options: SelectOption<Network>[] = NETWORK_NAMES.filter(
    network => !networksToExclude?.includes(network),
  )
    .sort((a, b) => (a > b ? 1 : -1))
    .map(network => ({
      item: network,
      icon: {
        type: "image",
        value: NETWORK_NAME_TO_LOGO_URL[network],
      },
      label: networkNameToShow(network),
    }));

  return (
    <>
      {showIconButton && (
        <SelectIconButton
          containerId={containerId}
          dropdownClassName={dropdownClassName}
          options={options}
          size="small"
          isSelected={network => network === value}
          dropdownPosition={
            dropdownPosition ? `${dropdownPosition}-justify` : undefined
          }
          showIconRight={showIconRight}
          {...rest}
        />
      )}
      {!showIconButton && (
        <Select
          options={options}
          size="small"
          isSelected={network => network === value}
          dropdownPosition={
            dropdownPosition ? `${dropdownPosition}-justify` : undefined
          }
          {...rest}
        />
      )}
    </>
  );
};

export default SelectNetwork;
