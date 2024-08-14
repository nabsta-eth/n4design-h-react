import classNames from "classnames";
import { Network } from "handle-sdk";
import GrillzLoader from "./GrillzLoader";

export type ComingSoonProps = {
  feature: string;
  network?: Network;
  classNames?: string;
};

const ComingSoon = (props: ComingSoonProps) => {
  return (
    <div
      className={classNames(
        "uk-height-1-1 uk-width-1-1 uk-flex uk-flex-center uk-flex-middle",
        props.classNames,
      )}
    >
      <GrillzLoader
        style={{ margin: "-12px 0" }}
        wrapperClassNames="uk-height-1-1"
        className="uk-margin-small-right"
        hideLoadingText
      />

      <span className="uk-margin-remove-vertical">
        {`${props.feature} coming soon${
          props.network ? ` to ${props.network}` : ""
        }...`}
      </span>
    </div>
  );
};

export default ComingSoon;
