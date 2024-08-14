import { WalletChoice } from "@handle-fi/react-components/dist/context/UserWallet";

export const shouldShowApprovalAndPendingNotification = (
  walletChoice: WalletChoice,
) =>
  walletChoice?.walletName === "dynamic" &&
  (walletChoice.dynamicWalletType === "walletConnect" ||
    walletChoice.dynamicWalletType === "browser");
