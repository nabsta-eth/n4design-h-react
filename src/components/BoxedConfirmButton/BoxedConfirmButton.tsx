import classNames from "classnames";
import classes from "./BoxedConfirmButton.module.scss";
import * as React from "react";
import { useCallback } from "react";

export type Props = {
  boxTitle: string;
  boxSubtitle?: string;
  boxSubtitleComponent?: React.ReactNode;
  buttonTitle: string;
  buttonSubtitle: string;
  onClick: () => any;
  boxLink?: string;
};

const BoxedConfirmButton: React.FC<Props> = props => {
  const classLink = { [classes.link]: !!props.boxLink };
  const openBoxLink = useCallback(() => {
    if (!props.boxLink) {
      return;
    }
    window.open(props.boxLink);
  }, [props.boxLink]);
  const subtitleComponent: React.ReactNode = props.boxSubtitleComponent
    ? props.boxSubtitleComponent
    : props.boxSubtitle || "";
  return (
    <div className={classNames(classes.rectangularConfirmButton)}>
      <div className={classNames(classes.box)}>
        <div className={classNames(classes.title)}>{props.boxTitle}</div>
        <div
          className={classNames(classes.subtitle, classLink)}
          onClick={openBoxLink}
        >
          {subtitleComponent}
        </div>
      </div>
      <div className={classNames(classes.button)} onClick={props.onClick}>
        <div className={classNames(classes.title)}>{props.buttonTitle}</div>
        <div className={classNames(classes.subtitle)}>
          {props.buttonSubtitle}
        </div>
      </div>
    </div>
  );
};

export default BoxedConfirmButton;
