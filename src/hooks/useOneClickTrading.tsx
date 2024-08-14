import { useCallback, useRef } from "react";
import { useTrade } from "../context/Trade";
import { Signer, Wallet } from "ethers";
import {
  TradeAccount,
  TradeAccountRole,
} from "handle-sdk/dist/components/trade";
import {
  useConnectedNetwork,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Provider } from "@ethersproject/providers";
import { useLocalStorageContext } from "../context/LocalStorage";
import { NetworkMap } from "handle-sdk/dist";
import { CHAIN_ID_TO_NETWORK_NAME } from "handle-sdk/dist/constants";
import { showErrorNotification } from "../utils/trade/showNotificationFromError";
import { useLanguageStore } from "../context/Translation";

export type OneClickTradingHook = {
  isOneClickTradingActive: boolean;
  enableOneClickTrading: () => Promise<boolean>;
  disableOneClickTrading: () => void;
};

export type OneClickTradingStore = Partial<
  NetworkMap<{
    [account: number]: OneClickTradingStoreItem | undefined;
  }>
>;

export type OneClickTradingStoreItem = {
  key: string;
  isActive: boolean;
};

export const useOneClickTrading = (): OneClickTradingHook => {
  const [store, setStore] = useOneClickTradingStorage();
  const { account } = useTrade();
  const signer = useSigner();
  const isProcessing = useRef(false);
  const network = useConnectedNetwork();
  const { t } = useLanguageStore();
  const isOneClickTradingActive = !!(
    account &&
    network &&
    store[network]?.[account.id]?.isActive
  );
  const enableOneClickTrading = useCallback(async () => {
    const canProceed = !!(
      !isOneClickTradingActive &&
      !isProcessing.current &&
      account &&
      network &&
      signer &&
      signer.provider
    );
    if (!canProceed) {
      if (!signer) {
        showErrorNotification(t.octWalletNotConnectedErrorNotificationText);
      } else if (!account) {
        showErrorNotification(t.octNoTradingAccountErrorNotificationText);
      }
      return false;
    }
    isProcessing.current = true;
    try {
      const storageItem = store[network]?.[account?.id];
      const key = storageItem
        ? storageItem.key
        : await enableNewOneClickTradingAccount(
            signer,
            signer.provider,
            account,
          );
      setStore({
        ...store,
        [network]: {
          ...store[network],
          [account.id]: {
            key,
            isActive: true,
          },
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      isProcessing.current = false;
    }
  }, [isOneClickTradingActive, account, signer, store, network]);
  const disableOneClickTrading = useCallback(() => {
    const canProceed = !!(
      isOneClickTradingActive &&
      !isProcessing.current &&
      account &&
      network &&
      store &&
      signer
    );
    if (!canProceed) {
      return;
    }
    setStore({
      ...store,
      [network]: {
        ...store[network],
        [account.id]: {
          key: store[network]![account.id]!.key,
          isActive: false,
        },
      },
    });
  }, [isOneClickTradingActive, account, signer, store, network]);
  return {
    isOneClickTradingActive,
    enableOneClickTrading,
    disableOneClickTrading,
  };
};

export const useOneClickTradingWallet = (
  accountId: number | undefined,
): Wallet | null => {
  const [store] = useOneClickTradingStorage();
  const { connection } = useUserWalletStore();
  if (!connection.chain.isConnected || !store || !accountId) {
    return null;
  }
  const network = CHAIN_ID_TO_NETWORK_NAME[connection.chain.chainId];
  const item = store[network]?.[accountId];
  if (!network || !item?.isActive) {
    return null;
  }
  return new Wallet(item.key, connection.chain.provider);
};

const useOneClickTradingStorage = () =>
  useLocalStorageContext().oneClickTrading;

const enableNewOneClickTradingAccount = async (
  signer: Signer,
  provider: Provider,
  account: TradeAccount,
): Promise<string> => {
  const wallet = Wallet.createRandom().connect(provider);
  await account.grantRole({
    userAddress: wallet.address,
    role: TradeAccountRole.Trader,
    signer,
  });
  return wallet.privateKey;
};
