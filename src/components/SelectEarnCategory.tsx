import { SelectOption } from "../types/select";
import { EarnCategory } from "../navigation/Earn";
import Select, { Props as SelectProps } from "./Select/Select";

type Props = Omit<
  SelectProps<EarnCategory>,
  "options" | "value" | "isSelected"
> & {
  value: EarnCategory;
  onChange: (category: EarnCategory) => void;
};

const SelectEarnCategory: React.FC<Props> = props => {
  const { value, ...rest } = props;

  const categoryOptions: SelectOption<EarnCategory>[] = [
    {
      item: "governance",
      label: "governance",
    },
    {
      item: "fxKeeper",
      label: "fxKeeper",
    },
    {
      item: "liquidity",
      label: "liquidity",
    },
  ];

  return (
    <Select
      options={categoryOptions}
      isSelected={category => category === value}
      {...rest}
    />
  );
};

export default SelectEarnCategory;
