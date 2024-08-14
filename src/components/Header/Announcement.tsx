import classNames from "classnames";
import classes from "./Announcement.module.scss";

type Props = {
  children?: React.ReactNode;
};

export const Announcement = ({ children }: Props) => {
  return <div className={classNames(classes.wrapper)}>{children}</div>;
};
