import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import classNames from "classnames";
import classes from "./MobileClosePosition.module.scss";
import { useNavigate } from "react-router-dom";
import ClosePosition from "../ClosePosition/ClosePosition";
import { useUiStore } from "../../context/UserInterface";
import { usePositionFromQueryString } from "../../hooks/usePositionFromQueryString";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useState } from "react";

const MobileClosePosition: React.FC = () => {
  const position = usePositionFromQueryString();
  const { isMobile } = useUiStore();
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const [reset, setReset] = useState(false);

  const onCloseInternal = () => {
    navigate(-1);
    setReset(!reset);
  };

  return (
    <React.Fragment>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.closePositionHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={onCloseInternal}
        />
        <h4 className="uk-margin-remove-vertical">{t.reducePosition}</h4>
      </div>

      <Container
        size="medium"
        className={classNames(
          "uk-flex uk-flex-column uk-flex-middle",
          classes.closePositionWrapper,
          {
            "uk-margin-small-top": !isMobile,
            "uk-margin-top": !position,
          },
        )}
      >
        {position ? (
          <ClosePosition
            reset={reset}
            position={position}
            onClose={() => onCloseInternal()}
          />
        ) : (
          t.positionNotFound
        )}
      </Container>
    </React.Fragment>
  );
};

export default MobileClosePosition;
