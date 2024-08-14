import * as React from "react";
import classNames from "classnames";
import classes from "./MobileConfirmTrade.module.scss";
import ConfirmTrade, { ConfirmTradeProps } from "../ConfirmTrade/ConfirmTrade";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type MobileConfirmTradeProps = ConfirmTradeProps & {
  onClose: () => void;
};

const MobileConfirmTrade: React.FC<MobileConfirmTradeProps> = props => {
  const { t } = useLanguageStore();

  return (
    <div>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.confirmTradeHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={() => props.onClose()}
        />
        <h4 className="uk-margin-remove-vertical">{t.confirmTrade}</h4>
      </div>

      <ConfirmTrade {...props} />
    </div>
  );
};

export default MobileConfirmTrade;
