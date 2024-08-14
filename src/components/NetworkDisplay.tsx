import classNames from "classnames";
import { DetailedHTMLProps, HTMLAttributes } from "react";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useLanguageStore } from "../context/Translation";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";

export type NetworkDisplayProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  showNetworkName: boolean;
};

const NetworkDisplay = (props: NetworkDisplayProps) => {
  const { className, showNetworkName, ...rest } = props;
  const network = useConnectedNetwork();
  const { t } = useLanguageStore();

  return (
    <div
      className={classNames("uk-flex uk-flex-left uk-flex-middle", className)}
      {...rest}
    >
      {network ? (
        <Image
          src={NETWORK_NAME_TO_LOGO_URL[network]}
          alt={network}
          width="20"
          className="uk-margin-small-right"
        />
      ) : (
        <FontAwesomeIcon
          icon={["fal", "chart-network"]}
          className="uk-margin-small-right"
        />
      )}
      {showNetworkName && (
        <span className="uk-h5 uk-margin-remove-vertical">
          {network ? networkNameToShow(network) : t.disconnected}
        </span>
      )}
    </div>
  );
};

export default NetworkDisplay;
