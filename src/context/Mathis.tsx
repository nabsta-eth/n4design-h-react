import * as React from "react";
import { useTrade } from "./Trade";
import { usePositions } from "./Positions";
import {
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import useGasPriceToUse from "../hooks/useGasPriceToUse";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { ApiCall, handleApiCall } from "../hooks/mathis/apiCalls";
import { useEffect } from "react";
import { MessageDelta } from "@mathis-global/mathis-sdk";
import { tryExtractJsonFromRevertMessage } from "../hooks/useSendTransaction";
import { useLanguageStore } from "./Translation";
import { getActivePath } from "../utils/url";

type MathisHookArgs = {
  onMessageReceived: (delta: MessageDelta) => void;
  onConnected?: () => void;
};

export type MathisValue = {
  isChatInputFocussed: boolean;
  setIsChatInputFocussed: (isChatInputFocussed: boolean) => void;
};

export const MathisContext = React.createContext<MathisValue | undefined>(
  undefined,
);

export const MathisProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const activePath = getActivePath();
  const [isChatInputFocussed, setIsChatInputFocussed] = React.useState(false);

  React.useEffect(() => {
    setIsChatInputFocussed(activePath === "chat");
  }, [activePath]);

  const value = React.useMemo(
    () => ({
      isChatInputFocussed,
      setIsChatInputFocussed,
    }),
    [isChatInputFocussed, setIsChatInputFocussed],
  );

  return (
    <MathisContext.Provider value={value}>
      {props.children}
    </MathisContext.Provider>
  );
};

export const useMathisStore = () => {
  const context = React.useContext(MathisContext);

  if (context === undefined) {
    throw new Error("useMathisStore must be used within a MathisProvider");
  }
  return context;
};

export type MathisHook = {
  sendUserInput: (content: string) => void;
};

export const useMathis = ({
  onMessageReceived,
  onConnected,
}: MathisHookArgs): MathisHook => {
  const { t } = useLanguageStore();
  const { protocol } = useTrade();
  const { positions } = usePositions();
  const { slippage } = useUserWalletStore();
  const gasPrice = useGasPriceToUse();
  const signer = useSigner();
  const [sdk] = usePromise(async () => {
    const { MathisSdk } = await import("@mathis-global/mathis-sdk");
    return new MathisSdk();
  }, []);
  const performApiCall = (request: ApiCall): boolean => {
    if (!sdk) {
      return false;
    }
    handleApiCall({
      request,
      // @ts-ignore TODO IMPLEMENT/FIX
      platform,
      // @ts-ignore TODO IMPLEMENT/FIX
      getPosition,
      signer,
      gasPrice,
      slippage,
      // @ts-ignore TODO IMPLEMENT/FIX
      fetchPositions,
      t,
    })
      .then(response => {
        console.log("[zaius api call] OK", response);
        sdk.submitApiInput(response);
      })
      .catch(error => {
        error = getParsedErrorMessage(error);
        console.error("[zaius api call] ERROR", error);
        // Limit error to 100 characters.
        sdk.submitApiInput(String(error).substring(0, 100));
      });
    // Accept the request.
    return true;
  };
  useEffect(() => {
    if (!sdk) {
      return;
    }
    sdk.onConnected(() => {
      console.log("[mathis] sdk connected");
      sdk.startChat("zaius");
      sdk.onChatMessage(onMessageReceived);
      sdk.setApiCallHandler(performApiCall);
      onConnected?.();
    });
  }, [sdk]);
  useEffect(() => {
    if (!sdk) {
      return;
    }
    sdk.setApiCallHandler(performApiCall);
  }, [sdk, positions]);
  return {
    sendUserInput: (input: string) => {
      if (!sdk) {
        console.warn(`[mathis] cannot submit; not ready yet`);
        return;
      }
      sdk.submitUserInput(input);
    },
  };
};

const getParsedErrorMessage = (e: any) => {
  const revertError = tryExtractJsonFromRevertMessage(e);
  return revertError?.data?.message || revertError?.message || e;
};
