import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import classNames from "classnames";
import classes from "./MobileReviewConvert.module.scss";
import ReviewConvert, { ReviewConvertProps } from "../ReviewConvert";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type MobileReviewConvertProps = ReviewConvertProps & {
  onClose: () => void;
};

const MobileReviewConvert: React.FC<MobileReviewConvertProps> = props => {
  const { fromToken, toToken, onConvert, quote, onClose } = props;
  return (
    <React.Fragment>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.reviewConvertHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={onClose}
        />
        <h4 className="uk-margin-remove-vertical">confirm details</h4>
      </div>

      <Container size="large" className="uk-margin-small-top">
        <ReviewConvert
          fromToken={fromToken}
          toToken={toToken}
          onConvert={onConvert}
          quote={quote}
        />
      </Container>
    </React.Fragment>
  );
};

export default MobileReviewConvert;
