import { forwardRef } from "react";
import { Button as UKButton } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { ButtonProps } from "@handle-fi/react-components/dist/components/handle_uikit/types";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";

export type DisableWithMessage = {
  disabled: boolean;
  message?: string;
};

export type Props = Omit<
  ButtonProps,
  "ref" | "submit" | "disabled" | "children"
> & {
  ref?: React.Ref<HTMLButtonElement>;
  submit?: boolean;
  active?: boolean;
  loading?: boolean;
  alert?: boolean;
  disabled?: boolean | DisableWithMessage[];
  thinBorder?: boolean;
  children?: React.ReactNode;
};

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    { children, submit, loading, disabled, alert, active, thinBorder, ...rest },
    ref,
  ) => {
    const { activeTheme } = useUiStore();
    const disabledInternal =
      disabled === true ||
      (Array.isArray(disabled) && disabled.some(({ disabled }) => disabled));

    const disabledMessage = Array.isArray(disabled)
      ? disabled.find(({ disabled }) => disabled)?.message
      : undefined;

    let childrenInternal = loading ? (
      <Loader
        className="button-loader"
        color={getThemeFile(activeTheme).primaryColor}
      />
    ) : (
      children
    );
    if (disabledInternal && disabledMessage && !loading) {
      childrenInternal = disabledMessage;
    }

    return (
      <UKButton
        ref={ref}
        submit={!!submit}
        active={active}
        disabled={loading || disabledInternal}
        alert={alert}
        {...rest}
      >
        {childrenInternal}
      </UKButton>
    );
  },
);

export default Button;
