import { Network } from "handle-sdk";
import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import {
  Connection,
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import Button, { Props as ButtonProps } from "../Button";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import ChooseWalletModal from "@handle-fi/react-components/dist/components/ChooseWalletModal/ChooseWalletModal";
import { getThemeFile } from "../../utils/ui";
import classNames from "classnames";
import classes from "./ButtonSmart.module.scss";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";

export type Props = Omit<ButtonProps, "ref"> & {
  network?: Network;
};

type InternalTitleProps = {
  network?: Network;
  userStoreInitialising: boolean;
  connection: Connection;
  connectedNetwork?: Network;
  connectedAccount?: string;
};

const InternalTitle: React.FC<InternalTitleProps> = props => {
  const {
    network,
    userStoreInitialising,
    connection,
    connectedNetwork,
    connectedAccount,
    children,
    ...rest
  } = props;
  const { showChooseWalletModal } = useUiStore();
  const { t } = useLanguageStore();
  const correctNetwork = network === connectedNetwork;

  const buttonText = () => {
    if (
      connection.user.isConnecting ||
      connection.chain.isConnecting ||
      userStoreInitialising ||
      (!connection.user.isConnected && correctNetwork)
    ) {
      return `${t.connecting}...`;
    }
    return !showChooseWalletModal &&
      !connection.user.isConnected &&
      !userStoreInitialising
      ? t.connectYourWallet
      : `${t.connecting}...`;
  };

  if (network && !correctNetwork) {
    return (
      <div className="uk-flex uk-flex-center uk-flex-middle" {...rest}>
        {t.switchTo}
        <Image
          src={NETWORK_NAME_TO_LOGO_URL[network]}
          alt={network}
          width="20"
          className={classNames(
            "uk-margin-small-left uk-margin-xsmall-right",
            classes.networkLogo,
          )}
        />
        {networkNameToShow(network)}
      </div>
    );
  }

  if (!connectedAccount) {
    return (
      <div>
        <FontAwesomeIcon
          icon={["far", "wallet"]}
          className="uk-margin-small-right"
        />
        <span>{buttonText()}</span>
      </div>
    );
  }

  return <span>{children}</span>;
};

const ButtonSmart = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const { setWalletChoice, switchNetwork, connection, userStoreInitialising } =
    useUserWalletStore();
  const {
    isMobile,
    showChooseWalletModal,
    setShowChooseWalletModal,
    activeTheme,
    isTradePopout,
  } = useUiStore();
  const navigate = useNavigate();

  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const { network, onClick, disabled, children, loading, ...rest } = props;

  const correctNetwork = network === connectedNetwork;

  let internalOnClick: (() => Promise<void>) | undefined = onClick;
  // if connected and on correct network, use normal disabled logic, otherwise enable so
  // that user can connect their wallet / switch network
  let internalDisabled =
    showChooseWalletModal ||
    userStoreInitialising ||
    (correctNetwork && !!connectedAccount)
      ? disabled
      : false;

  if (!connectedAccount) {
    internalOnClick = async () => {
      setWalletChoice({ walletName: "dynamic", dynamicWalletType: undefined });
      if (isMobile) {
        navigate("/choosewallet");
      } else {
        setShowChooseWalletModal(true);
      }
    };
  } else if (!correctNetwork) {
    internalOnClick = network
      ? async () => {
          setInternalLoading(true);
          await switchNetwork(network);
        }
      : undefined;
  }
  const isLoading =
    internalLoading ||
    !!loading ||
    userStoreInitialising ||
    connection.chain.isConnecting ||
    connection.user.isConnecting;

  useEffect(() => {
    if (network && correctNetwork) {
      setInternalLoading(false);
    }
  }, [network, correctNetwork]);

  return (
    <>
      <Button
        ref={ref}
        type={connectedAccount && correctNetwork ? "primary" : "secondary"}
        onClick={internalOnClick}
        loading={isLoading}
        disabled={internalDisabled}
        {...rest}
      >
        <InternalTitle
          network={network}
          userStoreInitialising={userStoreInitialising}
          connection={connection}
          connectedNetwork={connectedNetwork}
          connectedAccount={connectedAccount}
        >
          {children}
        </InternalTitle>
      </Button>
      {isTradePopout && (
        <ChooseWalletModal
          showChooseWalletModal={showChooseWalletModal}
          setShowChooseWalletModal={setShowChooseWalletModal}
          isMobile={isMobile}
          primaryColor={getThemeFile(activeTheme).primaryColor}
        />
      )}
    </>
  );
});

export default ButtonSmart;
