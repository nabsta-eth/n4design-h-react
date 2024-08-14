import React from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import classes from "./MobileChooseWallet.module.scss";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import ChooseWalletWrapper from "@handle-fi/react-components/dist/components/ChooseWalletWrapper/ChooseWalletWrapper";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";

const MobileChooseWallet: React.FC = () => {
  const connectedAccount = useConnectedAccount();
  const navigate = useNavigate();
  const { setShowChooseWalletModal, isMobile, activeTheme } = useUiStore();

  React.useEffect(() => {
    if (connectedAccount) {
      navigate("/");
    }
  }, [connectedAccount]);

  const onReturn = () => {
    navigate(-1);
  };

  return (
    <div className="uk-width-expand uk-height-1-1 uk-flex uk-flex-column">
      <div className={classNames("uk-flex uk-flex-middle", classes.header)}>
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={onReturn}
        />
        <h4 className="uk-margin-remove-vertical">login to handle.fi</h4>
      </div>

      <div
        className={classNames("uk-flex uk-flex-center", classes.bodyWrapper)}
      >
        <Container
          size="large"
          className={classNames(
            "uk-flex uk-flex-column uk-flex-center uk-flex-middle uk-width-expand",
            {
              "uk-padding-remove": isMobile,
            },
          )}
        >
          <ChooseWalletWrapper
            isMobile={isMobile}
            setShowChooseWalletModal={setShowChooseWalletModal}
            primaryColor={getThemeFile(activeTheme).primaryColor}
          />
        </Container>
      </div>
    </div>
  );
};

export default MobileChooseWallet;
