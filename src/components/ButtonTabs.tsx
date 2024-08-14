import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import classNames from "classnames";

type Props<T> = {
  wrapperClassName?: string;
  buttons: {
    name: T;
    disabled?: boolean;
    hide?: boolean;
  }[];
  active: T;
  buttonClassName?: string;
  onClick: (id: T) => void;
};

const ButtonTabs = <T extends string>(props: Props<T>) => {
  const buttonsToDisplay = props.buttons.filter(button => !button.hide);

  return (
    <div className={classNames(props.wrapperClassName, "uk-button-group")}>
      {buttonsToDisplay.map(button => (
        <Button
          key={button.name}
          className={props.buttonClassName}
          expand={true}
          active={button.name === props.active}
          disabled={button.disabled}
          onClick={
            button.disabled ? undefined : () => props.onClick(button.name)
          }
        >
          {button.name}
        </Button>
      ))}
    </div>
  );
};

export default ButtonTabs;
