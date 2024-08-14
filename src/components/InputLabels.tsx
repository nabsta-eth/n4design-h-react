import classNames from "classnames";
import React from "react";

type Props = {
  id: string;
  label?: string;
  rightLabel?: string | JSX.Element;
};

const InputLabels: React.FC<Props> = ({ id, label, rightLabel }) => {
  return (
    <React.Fragment>
      {(label || rightLabel) && (
        <div
          className={classNames("uk-flex uk-width-expand", {
            "uk-flex-between": label && rightLabel,
            "uk-flex-right": !label && rightLabel,
          })}
        >
          {label && (
            <label
              id={`left-label-${id}`}
              className="uk-form-label"
              htmlFor={id}
            >
              <span>{label}</span>
            </label>
          )}
          {rightLabel && (
            <label
              id={`right-label-${id}`}
              className="uk-form-label"
              htmlFor={id}
            >
              <span>{rightLabel}</span>
            </label>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default InputLabels;
