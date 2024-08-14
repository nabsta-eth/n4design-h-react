import classNames from "classnames";
import { TIPR_DOC_LINK } from "../../config/trade";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

export const TiprEligibilityMessage = ({
  tiprEligibilityMessage,
}: {
  tiprEligibilityMessage: string;
}) => {
  const tiprEligibilityMessageParts = tiprEligibilityMessage.split("#br#");
  return (
    <a
      className={classNames("hfi-orange")}
      href={TIPR_DOC_LINK}
      target="_blank"
    >
      <p className="uk-display-inline-block uk-margin-remove">
        <span className="hfi-orange">{tiprEligibilityMessageParts[0]}</span>
      </p>
      <p className="uk-display-inline-block uk-margin-remove">
        {tiprEligibilityMessageParts[1] && (
          <span className="hfi-orange uk-margin-small-left">
            {tiprEligibilityMessageParts[1]}
          </span>
        )}
        <FontAwesomeIcon
          className="uk-margin-small-left"
          icon={["far", "external-link"]}
        />
      </p>
    </a>
  );
};
