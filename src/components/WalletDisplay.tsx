import { DetailedHTMLProps, HTMLAttributes } from "react";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import classNames from "classnames";
import { truncateAddress } from "../utils/format";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useLanguageStore } from "../context/Translation";

export type WalletDisplayProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

const WalletDisplay = (props: WalletDisplayProps) => {
  const { className, ...rest } = props;
  const connectedAccount = useConnectedAccount();
  const { t } = useLanguageStore();

  const displayAddress = connectedAccount || t.disconnected;

  return (
    <div className={classNames("uk-flex uk-flex-middle", className)} {...rest}>
      <FontAwesomeIcon
        icon={["fal", "wallet"]}
        className="uk-margin-small-right"
      />

      {connectedAccount ? `${truncateAddress(displayAddress)}` : displayAddress}
    </div>
  );
};

export default WalletDisplay;
