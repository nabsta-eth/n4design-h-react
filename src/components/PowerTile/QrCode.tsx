import { useLanguageStore } from "../../context/Translation";
import QRCode from "react-qr-code";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import classNames from "classnames";
import classes from "./QrCode.module.scss";

export const QrCode = () => {
  const { t } = useLanguageStore();
  const { activeTheme, isMobile } = useUiStore();
  const connectedAccount = useConnectedAccount();
  const themeFile = getThemeFile(activeTheme);
  if (!connectedAccount) {
    console.warn("No connected account for QR code");
    return null;
  }
  return (
    <div
      className={classNames(classes.wrapper, "uk-text-center qr-code-dropdown")}
    >
      <QRCode
        uk-tooltip={
          isMobile
            ? undefined
            : `title: ${
                t?.headerWalletButtonQrCodeTooltip ??
                "scan with mobile device to view wallet"
              }; pos: bottom;`
        }
        value={connectedAccount}
        size={100}
        fgColor={themeFile.primaryColor}
        bgColor={"transparent"}
      />
    </div>
  );
};
