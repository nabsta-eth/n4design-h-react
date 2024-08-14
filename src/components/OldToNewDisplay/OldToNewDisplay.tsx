import classNames from "classnames";

type Options = {
  suffix?: string;
};

type Props = {
  id?: string;
  className?: string;
  old: string | undefined;
  newValue: string | undefined;
  options: Options;
  oldValueClassName?: string;
  newValueClassName?: string;
};

const OldToNew = ({
  id,
  className,
  old,
  newValue,
  options: { suffix },
  oldValueClassName,
  newValueClassName,
}: Props) => {
  if (old === undefined)
    return (
      <span id={id} className={classNames(newValueClassName)}>
        {newValue}
      </span>
    );
  if (newValue === undefined)
    return (
      <span id={id} className={classNames(oldValueClassName)}>
        {old}
      </span>
    );
  if (stripSuffix(old, suffix) === stripSuffix(newValue, suffix))
    return (
      <span id={id} className={classNames(oldValueClassName)}>
        {old}
      </span>
    );
  return (
    <span
      id={id}
      className={classNames("uk-flex uk-flex-wrap uk-flex-right", className)}
    >
      <span className={classNames("uk-text-nowrap")}>
        <span className={classNames(oldValueClassName)}>
          {`${stripSuffix(old, suffix)}`}
        </span>
        <span>&nbsp;{"=>"}&nbsp;</span>
      </span>
      <span className={classNames("uk-text-nowrap", newValueClassName)}>
        {`${stripSuffix(newValue, suffix)}${suffix ?? ""}`}
      </span>
    </span>
  );
};

const stripSuffix = (value: string, suffix: string | undefined) => {
  if (suffix === undefined) return value;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
};

export default OldToNew;
