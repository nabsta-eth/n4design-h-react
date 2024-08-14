export type Option<T> = {
  value: T;
  displayValue?: string;
};

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (newValue: T) => void;
};

const SimpleSelect = <T extends string>({
  options,
  value,
  onChange,
}: Props<T>) => {
  return (
    <select
      value={value}
      onChange={event => {
        onChange(event.target.value as T);
      }}
    >
      {options.map(option => {
        return (
          <option key={option.value} value={option.value}>
            {option.displayValue || option.value}
          </option>
        );
      })}
    </select>
  );
};

export default SimpleSelect;
