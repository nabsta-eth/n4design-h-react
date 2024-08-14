import classNames from "classnames";
import classes from "./PowerTileMainContent.module.scss";
import TradeAccountTile from "../TradePortfolio/Tiles/TradeAccountTile";
import WalletAssetsTile from "../TradePortfolio/Tiles/WalletAssetsTile";
import { useUiStore } from "../../context/UserInterface";
import { useTrade } from "../../context/Trade";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { useLanguageStore } from "../../context/Translation";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import TradeDeposit from "../Trade/TradeDeposit/TradeDeposit";
import TradeWithdraw from "../Trade/TradeWithdraw/TradeWithdraw";
import { useTradeAccountDisplay } from "../../context/TradeAccountDisplay";
import { usePowerTileStore } from "@handle-fi/react-components/dist/context/PowerTile";

export const PowerTileMainContent = () => {
  const { account: tradeAccount } = useTrade();
  const { connection, userStoreInitialising } = useUserWalletStore();
  const { isPowerTileOpen } = usePowerTileStore();

  const canDeposit =
    connection.chain.isConnected &&
    connection.chain.isSupportedNetwork &&
    tradeNetworks.includes(connection.chain.network as TradeNetwork) &&
    !userStoreInitialising &&
    connection.user.isConnected;
  const isTradeAccount = !!tradeAccount?.id;

  const [showDeposit, setShowDeposit] = useState(false);
  const onClickDeposit = () => {
    setShowDeposit(true);
    setShowWithdraw(false);
  };
  const onCloseDeposit = () => {
    setShowDeposit(false);
  };

  const [showWithdraw, setShowWithdraw] = useState(false);
  const onClickWithdraw = () => {
    setShowWithdraw(true);
    setShowDeposit(false);
  };
  const onCloseWithdraw = () => {
    setShowWithdraw(false);
  };

  useEffect(() => {
    if (!isPowerTileOpen) {
      setShowDeposit(false);
      setShowWithdraw(false);
    }
  }, [isPowerTileOpen]);

  const showMainContent = !(showDeposit || showWithdraw);

  return (
    <>
      {showMainContent && (
        <div
          className={classNames(
            "uk-margin-small-top uk-width-expand",
            classes.mainContent,
          )}
        >
          <TradeAccountTile className={classes.tile} />
          <WalletAssetsTile className={classes.tile} />
        </div>
      )}

      <div className={classNames(classes.additionalContent)}>
        <div className={classNames(classes.additionalContentInner)}>
          {canDeposit && showMainContent && !isTradeAccount && (
            <OpenAccountButton
              showDeposit={showDeposit}
              onClickDeposit={onClickDeposit}
            />
          )}

          {canDeposit && showMainContent && isTradeAccount && (
            <DepositAndWithdrawButtons
              showDeposit={showDeposit}
              onClickDeposit={onClickDeposit}
              showWithdraw={showWithdraw}
              onClickWithdraw={onClickWithdraw}
            />
          )}

          {showDeposit && (
            <Deposit
              setShowDeposit={setShowDeposit}
              onCloseDeposit={onCloseDeposit}
            />
          )}

          {showWithdraw && (
            <Withdraw
              setShowWithdraw={setShowWithdraw}
              onCloseWithdraw={onCloseWithdraw}
            />
          )}
        </div>
      </div>
    </>
  );
};

const OpenAccountButton = ({
  showDeposit,
  onClickDeposit,
}: {
  showDeposit: boolean;
  onClickDeposit: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  return (
    <div
      className={classNames(
        "uk-width-1-2 hfi-button-collection uk-margin-small-top",
        classes.buttons,
      )}
    >
      <Button
        id={"powertile-open-account-button"}
        type="secondary"
        expand
        className="hfi-powertile-button"
        active={isMobile && showDeposit}
        onClick={onClickDeposit}
      >
        <FontAwesomeIcon
          className="uk-margin-small-right"
          icon={["far", "door-open"]}
        />
        {t.openAccount}
      </Button>
    </div>
  );
};

const DepositAndWithdrawButtons = ({
  showDeposit,
  onClickDeposit,
  showWithdraw,
  onClickWithdraw,
}: {
  showDeposit: boolean;
  onClickDeposit: () => void;
  showWithdraw: boolean;
  onClickWithdraw: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountEquity } = currentAccountDisplay;
  return (
    <div
      className={classNames(
        "hfi-button-collection uk-margin-small-top",
        classes.buttons,
        classes.depositWithdrawButtons,
      )}
    >
      <Button
        id={"powertile-deposit-button"}
        type="secondary"
        expand
        className="hfi-powertile-button"
        active={isMobile && showDeposit}
        onClick={onClickDeposit}
      >
        <FontAwesomeIcon
          className="uk-margin-small-right"
          icon={["far", "arrow-down-to-bracket"]}
        />
        {t.deposit}
      </Button>

      <Button
        id={"powertile-withdraw-button"}
        type="secondary"
        expand
        className="hfi-powertile-button"
        active={isMobile && showWithdraw}
        disabled={accountEquity?.isZero()}
        onClick={onClickWithdraw}
      >
        <FontAwesomeIcon
          className="uk-margin-small-right"
          icon={["far", "arrow-up-from-bracket"]}
        />
        {t.withdraw}
      </Button>
    </div>
  );
};

const Deposit = ({
  setShowDeposit,
  onCloseDeposit,
}: {
  setShowDeposit: Dispatch<SetStateAction<boolean>>;
  onCloseDeposit: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  const { account: tradeAccount } = useTrade();
  const isTradeAccount = !!tradeAccount?.id;
  return (
    <div className={classNames("uk-margin-small-top", classes.depositWrapper)}>
      {!isMobile && (
        <div className={classes.depositHeader}>
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className={classNames(classes.leftIcon)}
            onClick={() => setShowDeposit(false)}
          />
          <FontAwesomeIcon
            icon={[
              "far",
              isTradeAccount ? "arrow-down-to-bracket" : "door-open",
            ]}
            className={classNames("uk-margin-small-right", classes.depositIcon)}
          />
          {isTradeAccount ? t.deposit : t.openAccount}
        </div>
      )}
      <TradeDeposit onClose={onCloseDeposit} />
    </div>
  );
};

const Withdraw = ({
  setShowWithdraw,
  onCloseWithdraw,
}: {
  setShowWithdraw: Dispatch<SetStateAction<boolean>>;
  onCloseWithdraw: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  return (
    <div className={classNames("uk-margin-small-top", classes.withdrawWrapper)}>
      {!isMobile && (
        <div className={classes.withdrawHeader}>
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className={classNames(classes.leftIcon)}
            onClick={() => setShowWithdraw(false)}
          />
          <FontAwesomeIcon
            icon={["far", "arrow-up-from-bracket"]}
            className={classNames(
              "uk-margin-small-right",
              classes.withdrawIcon,
            )}
          />
          {t.withdraw}
        </div>
      )}
      <TradeWithdraw onClose={onCloseWithdraw} />
    </div>
  );
};
