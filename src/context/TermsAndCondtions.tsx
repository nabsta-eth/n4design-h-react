import * as React from "react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchDataHttp } from "../utils/general";
import { useAccount } from "./Account";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import { ethers } from "ethers";
import axios from "axios";
import { sendAnalyticsEvent } from "../utils/analytics";
import config from "handle-sdk/dist/config";

const TERMS_HASH_PREFIX =
  "I have read and agree to the handle.fi Terms of Use\n";
const TERMS_ENDPOINT = `${config.api.baseUrl}/terms-and-conditions`;
const TERMS_ACCOUNT_SIGNATURE_ENDPOINT = (address: string) =>
  `${TERMS_ENDPOINT}/signature/${address}`;

export type TermsAndConditions = {
  content: string;
  /// Keccak-256 hash of the content.
  contentHash: string;
  /// Represents the revision number of the terms.
  id: number;
};

export type AccountSignature = {
  /// Whether a signature was found.
  haSigned: boolean;
  signature: string | null;
  /// Terms ID of the signature. If this is lower than the current terms ID,
  /// thie account needs to sign the newest terms.
  termsId: number | null;
};

export type TermsAndConditionsValue = {
  termsAndConditions?: TermsAndConditions;
  accountSignature?: AccountSignature;
  signTermsAndConditions?: () => Promise<void>;
  openTermsModal?: (callback: () => any) => void;
  closeTermsModal?: () => void;
  isSigningDone: {
    current: boolean;
  };
  fetchAccountSignature: () => Promise<AccountSignature | undefined>;
  ensureTermsSigned: () => Promise<void>;
  isTermsModalOpen: boolean;
};

export const TermsAndConditionsContext =
  React.createContext<TermsAndConditionsValue>({
    isTermsModalOpen: false,
    fetchAccountSignature: () => Promise.resolve(undefined),
    ensureTermsSigned: () => Promise.resolve(),
    isSigningDone: {
      current: false,
    },
  });

export const TermsAndConditionsProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [termsAndConditions] = usePromise<TermsAndConditions>(() =>
    fetchDataHttp(TERMS_ENDPOINT),
  );
  const account = useAccount();
  const signer = useSigner();
  const [accountSignature, setAccountSignature] = useState<AccountSignature>();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [onSignTermsCallback, setOnSignTermsCallback] = useState<{
    callback: () => void;
  }>();
  const isSigningDone = useRef(false);

  const fetchAccountSignature = useCallback(async () => {
    if (!account || !termsAndConditions) {
      return;
    }
    const data = await fetchDataHttp<AccountSignature>(
      TERMS_ACCOUNT_SIGNATURE_ENDPOINT(account),
    );
    isSigningDone.current = getIsSigningDone(data, termsAndConditions);
    setAccountSignature(data);
    return data;
  }, [account, termsAndConditions]);

  useEffect(() => {
    fetchAccountSignature();
  }, [fetchAccountSignature]);

  const signTermsAndConditions = useCallback(async () => {
    if (!termsAndConditions || !accountSignature || !signer || !account) {
      throw new Error("signTermsAndConditions: not initialised");
    }
    if (isSigningDone.current) {
      // Account has signed the latest terms & conditions already.
      return;
    }
    await signer
      .signMessage(getTermsSignableMessage(termsAndConditions.contentHash))
      .then(signature => uploadSignature(signature, account))
      .then(fetchAccountSignature);

    sendAnalyticsEvent("sign_terms_of_use");
    // Trigger callback in another stack to avoid errors being thrown.
    setTimeout(() => {
      onSignTermsCallback?.callback();
      setOnSignTermsCallback(undefined);
    }, 0);
  }, [
    termsAndConditions,
    accountSignature,
    signer,
    account,
    onSignTermsCallback,
  ]);

  const openTermsModal = (callback: () => void) => {
    setOnSignTermsCallback({
      callback,
    });
    setIsTermsModalOpen(true);
  };

  const ensureTermsSigned: () => Promise<void> = useCallback(async () => {
    await fetchAccountSignature();
    if (isSigningDone.current) {
      return;
    }
    return new Promise((resolve, reject) => {
      openTermsModal(async () => {
        try {
          await ensureTermsSigned();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }, [termsAndConditions]);

  const value: TermsAndConditionsValue = useMemo(
    () => ({
      termsAndConditions,
      accountSignature,
      signTermsAndConditions,
      isTermsModalOpen,
      isSigningDone,
      fetchAccountSignature,
      ensureTermsSigned,
      openTermsModal,
      closeTermsModal: () => {
        setOnSignTermsCallback(undefined);
        setIsTermsModalOpen(false);
      },
    }),
    [
      termsAndConditions,
      accountSignature,
      signTermsAndConditions,
      isTermsModalOpen,
      isSigningDone,
      fetchAccountSignature,
    ],
  );

  return (
    <TermsAndConditionsContext.Provider value={value}>
      {props.children}
    </TermsAndConditionsContext.Provider>
  );
};

const getTermsSignableMessage = (contentHash: string): Uint8Array =>
  ethers.utils.toUtf8Bytes(`${TERMS_HASH_PREFIX}${contentHash}`);

const uploadSignature = async (signature: string, account: string) => {
  const response = await axios.put(TERMS_ACCOUNT_SIGNATURE_ENDPOINT(account), {
    signature,
  });
  if (response.status !== 200) {
    throw new Error(`uploadSignature: failed ${response.status}`);
  }
};

const getIsSigningDone = (
  accountSignature: AccountSignature | undefined,
  termsAndConditions: TermsAndConditions | undefined,
): boolean =>
  !!accountSignature &&
  !!termsAndConditions &&
  accountSignature.termsId === termsAndConditions.id;

export const useTermsAndConditions = (): TermsAndConditionsValue =>
  useContext(TermsAndConditionsContext);
