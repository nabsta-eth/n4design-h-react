import * as React from "react";
import classnames from "classnames";
import "../../assets/styles/input.scss";
import { InputLabels } from "../";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import classes from "./Input.module.scss";
import { forwardRef } from "react";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

export type Props = Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "id" | "value" | "onChange" | "key" | "ref"
> & {
  id: string;
  value: string;
  onChange: (newValue: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  label?: string;
  rightLabel?: string | JSX.Element;
  wrapperClassName?: string;
  inputClassName?: string;
  alert?: boolean;
  rightComponent?: React.ReactNode;
  leftIcon?: {
    prefix: IconPrefix;
    name: IconName;
    onClick?: () => void;
  };
  rightIcon?: {
    prefix: IconPrefix;
    name: IconName;
    onClick?: () => void;
  };
  inline?: boolean;
};

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {
    id,
    value,
    onChange,
    onKeyDown,
    label,
    rightLabel,
    wrapperClassName,
    inputClassName,
    alert,
    rightComponent,
    leftIcon,
    rightIcon,
    disabled,
    inline,
    ...rest
  } = props;

  const onChangeInternal = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const newValue = e.target.value;

      onChange(newValue);
    },
    [onChange],
  );

  return (
    <div
      className={classnames("hfi-input", wrapperClassName, {
        [classes.inline]: inline,
      })}
    >
      <InputLabels id={id} label={label} rightLabel={rightLabel} />
      <div className="uk-position-relative uk-flex">
        {leftIcon && (
          <span className="uk-form-icon">
            <FontAwesomeIcon
              icon={[leftIcon.prefix, leftIcon.name]}
              className="fa-icon"
            />
          </span>
        )}
        {rightIcon &&
          (rightIcon.onClick ? (
            <Button
              icon
              type="default"
              className="uk-form-icon uk-form-icon-flip"
              style={{ marginRight: 2, marginTop: 0 }}
              onClick={rightIcon.onClick}
            >
              <FontAwesomeIcon
                icon={[rightIcon.prefix, rightIcon.name]}
                className="fa-icon"
                style={{ marginRight: "-2px" }}
              />
            </Button>
          ) : (
            <span className="uk-form-icon uk-form-icon-flip">
              <FontAwesomeIcon
                icon={[rightIcon.prefix, rightIcon.name]}
                className="fa-icon"
              />
            </span>
          ))}
        <input
          id={id}
          ref={ref}
          className={classnames("uk-input", inputClassName, {
            "hfi-danger": alert,
          })}
          key={`${id}-input`}
          disabled={disabled}
          value={value}
          onChange={onChangeInternal}
          onKeyDown={onKeyDown}
          {...rest}
        />
        {rightComponent && (
          <div className="hfi-input-right-component">{rightComponent}</div>
        )}
      </div>
    </div>
  );
});

export default Input;
