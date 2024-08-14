import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import classNames from "classnames";
import classes from "./MobileSharePosition.module.scss";
import { useNavigate } from "react-router-dom";
import SharePosition from "../SharePosition/SharePosition";
import { usePositionFromQueryString } from "../../hooks/usePositionFromQueryString";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { usePosition } from "../../hooks/usePosition";

const MobileSharePosition: React.FC = () => {
  const position = usePositionFromQueryString();
  const { t } = useLanguageStore();
  const { markPriceDisplay, entryPriceDisplay, pnlPercentDisplay } =
    usePosition(position);

  const navigate = useNavigate();

  return (
    <React.Fragment>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.sharePositionHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={() => navigate(-1)}
        />
        <h4 className="uk-margin-remove-vertical">{t.sharePosition}</h4>
      </div>

      <Container
        size="medium"
        className={classNames(
          "uk-flex uk-flex-column uk-flex-middle",
          classes.sharePositionWrapper,
          {
            "uk-margin-top": !position,
          },
        )}
      >
        {position ? (
          <SharePosition
            pair={position.pairId.pair}
            isLong={position.isLong}
            entryPriceDisplay={entryPriceDisplay}
            markPriceDisplay={markPriceDisplay}
            pnlPercentDisplay={pnlPercentDisplay}
          />
        ) : (
          t.positionNotFound
        )}
      </Container>
    </React.Fragment>
  );
};

export default MobileSharePosition;
