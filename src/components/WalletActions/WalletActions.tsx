import React from "react";
import copy from "copy-to-clipboard";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { getExplorerMetadata } from "../../utils/general";
import classes from "./WalletActions.module.scss";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../../context/UserInterface";
import classNames from "classnames";

const WalletActions = (props: React.HTMLProps<HTMLDivElement>) => {
  const { className, ...rest } = props;
  const { walletChoice } = useUserWalletStore();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();
  const { t } = useLanguageStore();
  const { isMobile } = useUiStore();

  const connectedWallet = walletChoice;

  const explorerMetadata =
    connectedAccount && network
      ? getExplorerMetadata(connectedAccount, "address", network)
      : undefined;

  const copyToClipboard = () => {
    if (connectedAccount) copy(connectedAccount);
  };

  return (
    <div
      className={classNames(className, classes.walletActionWrapper)}
      {...rest}
    >
      <Link
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.copyToClipboard,
                position: "bottom",
              }
        }
        onClick={copyToClipboard}
      >
        <FontAwesomeIcon icon={["fal", "copy"]} />
      </Link>

      <Link
        className="hfi-link"
        href={explorerMetadata?.url || "#"}
        target="_blank"
        rel="noreferrer"
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.viewAddressOnBlockExplorer,
                position: "bottom",
              }
        }
      >
        <FontAwesomeIcon icon={["fal", "external-link-square"]} />
      </Link>

      <input
        value={connectedAccount}
        id="header-account"
        readOnly
        className="off-screen"
      />
    </div>
  );
};

export default WalletActions;
