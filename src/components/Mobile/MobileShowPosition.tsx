import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import classNames from "classnames";
import classes from "./MobileShowPosition.module.scss";
import { useNavigate } from "react-router-dom";
import ShowPosition from "../ShowPosition/ShowPosition";
import { useUiStore } from "../../context/UserInterface";
import { usePositionFromQueryString } from "../../hooks/usePositionFromQueryString";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

const MobileShowPosition: React.FC = () => {
  const position = usePositionFromQueryString();
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();

  const navigate = useNavigate();

  const onCloseInternal = () => {
    navigate(-1);
  };

  return (
    <React.Fragment>
      <div>
        <div
          className={classNames(
            "uk-flex uk-flex-middle",
            classes.showPositionHeader,
          )}
        >
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className="uk-margin-small-right"
            onClick={onCloseInternal}
          />
          <h4 className="uk-margin-remove-vertical">{t.position}</h4>
        </div>

        <Container
          size="medium"
          className={classNames("uk-flex uk-flex-column uk-flex-middle", {
            "uk-margin-small-top": !isMobile,
            "uk-margin-top": !position,
          })}
        >
          {position ? (
            <ShowPosition
              position={position}
              onClose={() => onCloseInternal()}
              className={classNames({ "uk-margin-small-top": isMobile })}
            />
          ) : (
            t.positionNotFound
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MobileShowPosition;
