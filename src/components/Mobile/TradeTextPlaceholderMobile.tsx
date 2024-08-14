import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import classNames from "classnames";
import classes from "./MobilePlaceholder.module.scss";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import WalletButton from "../WalletButton/WalletButton";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import { getTradeNetworkOrNull } from "../../context/Trade";

type MobilePlaceholderProps = {
  placeholderText: string;
  isLoading: boolean;
};

/**
 * This renders either:
 * 1. A loader, if the `isLoading` prop is true;
 * 2. ButtonSmart (connect/change network button);
 * 3. The placeholder prop text;
 */
const TradeTextPlaceholderMobile: React.FC<MobilePlaceholderProps> = ({
  placeholderText,
  isLoading,
}) => {
  const connectedAccount = useConnectedAccount();
  return (
    <div
      className={classNames("uk-flex uk-flex-center", {
        [classes.loading]: connectedAccount && isLoading,
        [classes.disconnected]: !connectedAccount,
        [classes.placeholder]: connectedAccount && !isLoading,
      })}
    >
      <MobilePlaceholderContent
        placeholderText={placeholderText}
        isLoading={isLoading}
      />
    </div>
  );
};

const MobilePlaceholderContent: React.FC<MobilePlaceholderProps> = ({
  placeholderText,
  isLoading,
}) => {
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const { activeTheme } = useUiStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  if (connectedAccount) {
    if (isLoading) {
      return <Loader color={getThemeFile(activeTheme).primaryColor} />;
    }

    if (tradeNetworks.includes(connectedNetwork as TradeNetwork)) {
      return <span>{placeholderText}</span>;
    }

    return (
      <ButtonSmart
        network={getTradeNetworkOrNull(connectedNetwork) ?? undefined}
        className={classes.switchNetwork}
      >
        {" "}
      </ButtonSmart>
    );
  }

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-column uk-flex-middle",
        classes.disconnectedWrapper,
      )}
    >
      <WalletButton
        className={classes.connectButton}
        id="trade-wallet-button"
        text={t.connectYourWallet}
        onChooseWallet={() => navigate("/choosewallet")}
      />
    </div>
  );
};

export default TradeTextPlaceholderMobile;
