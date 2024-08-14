import React from "react";
import { usePrevious } from "../../hooks/usePrevious";
import classes from "./flashingnumber.module.scss";
import animations from "./animation.module.scss";
import classNames from "classnames";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  delay?: string;
  disabled?: boolean;
};

const FlashingNumber = ({
  value,
  delay,
  className,
  children,
  disabled,
  ...rest
}: Props) => {
  const previousValue = usePrevious(value);
  const ref = React.useRef<HTMLDivElement>(null);

  const flash = React.useCallback((color: "green" | "red") => {
    if (!ref.current) return;

    ref.current.classList.remove(
      animations["flash-red"],
      animations["flash-green"],
    );
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.classList.add(animations[`flash-${color}`]);
    }, 10);
  }, []);

  React.useEffect(() => {
    if (!previousValue || !value || disabled) return;
    if (value > previousValue) {
      flash("green");
    }

    if (value < previousValue) {
      flash("red");
    }
  }, [value, previousValue, flash]);

  return (
    <div
      ref={ref}
      {...rest}
      className={classNames(className, classes.flashingNumber)}
      style={{
        animationDelay: delay ? delay : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default FlashingNumber;
