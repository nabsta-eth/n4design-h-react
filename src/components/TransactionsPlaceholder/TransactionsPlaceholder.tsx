import classNames from "classnames";
import { Network } from "handle-sdk";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { TranslationKey } from "../../types/translation";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import classes from "./TransactionsPlaceholder.module.scss";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import { getTradeNetworkOrNull } from "../../context/Trade";

type TransactionsPlaceholderProps = {
  type: "positions" | "orders" | "trades" | "transactions";
  connectedAccount?: string;
  loading: boolean;
  connectedNetwork?: Network;
  showChooseWalletModal: boolean;
  setShowChooseWalletModal: (show: boolean) => void;
  t: Record<TranslationKey, string>;
};

const TransactionsPlaceholder: React.FC<TransactionsPlaceholderProps> = ({
  type,
  connectedAccount,
  loading,
  connectedNetwork,
  t,
}) => {
  const network = useConnectedNetwork() || DEFAULT_HLP_NETWORK;
  const { activeTheme } = useUiStore();

  const placeholder = () => {
    if (loading)
      return <Loader color={getThemeFile(activeTheme).primaryColor} />;
    if (type === "positions") return t.noOpenPositions;
    if (type === "orders") return t.noOpenOrders;
    if (type === "trades") return t.noTradesYet;
    if (type === "transactions") return "no transactions yet";
  };

  return (
    <div
      className={classNames("uk-flex uk-flex-center", {
        [classes.loading]: connectedAccount && loading,
        [classes.disconnected]: !connectedAccount,
        [classes.placeholder]: connectedAccount && !loading,
      })}
    >
      {(() => {
        if (connectedAccount) {
          if (loading)
            return (
              <Loader
                className="uk-margin-small-top"
                color={getThemeFile(activeTheme).primaryColor}
              />
            );
          if (tradeNetworks.includes(connectedNetwork as TradeNetwork)) {
            return <span>{placeholder()}</span>;
          }
          return (
            <ButtonSmart
              network={getTradeNetworkOrNull(network) ?? undefined}
              className={classes.switchNetwork}
              size="small"
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
            <ButtonSmart
              className={classes.connectButton}
              size="small"
              network={getTradeNetworkOrNull(network) ?? undefined}
            />
          </div>
        );
      })()}
    </div>
  );
};

export default TransactionsPlaceholder;
