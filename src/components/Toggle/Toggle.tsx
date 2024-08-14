import classes from "./Toggle.module.scss";
import classNames from "classnames";

type Props = {
  value: boolean;
  onToggle: (value: boolean) => any;
};

const Toggle: React.FC<Props> = props => {
  return (
    <div
      onClick={() => props.onToggle(!props.value)}
      className={classNames("uk-margin-small-right", {
        [classes.toggle]: true,
        [classes.isOn]: props.value,
      })}
    >
      {" "}
    </div>
  );
};

export default Toggle;
