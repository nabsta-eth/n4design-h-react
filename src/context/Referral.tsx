import * as React from "react";
import useQueryString from "../hooks/useQueryString";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";
import { useContext, useMemo } from "react";

const LEGACY_STORAGE_KEY = "handle-referrer";
const STORAGE_KEY = "referral-code";
const STORAGE_VERSION = 1;

export type ReferralValue = {
  referralCode: string | null;
};

export const ReferralContext = React.createContext<ReferralValue>({
  referralCode: null,
});

export const ReferralProvider: React.FC = props => {
  const query = useQueryString();
  const ref = query.get("ref");
  const [referralCode, setReferralCode] = useLocalStorageVersioned<
    string | null
  >(STORAGE_KEY, STORAGE_VERSION, null);
  React.useEffect(() => {
    wipeLegacyReferralFromLocalStorage();
  }, []);

  React.useEffect(() => {
    if (!ref) {
      return;
    }
    if (ref.length > 32) {
      console.warn(`ignoring referral code longer than 32 characters: ${ref}`);
      return;
    }
    setReferralCode(ref);
  }, [ref]);
  const value = useMemo(
    (): ReferralValue => ({
      referralCode,
    }),
    [referralCode],
  );
  return (
    <ReferralContext.Provider value={value}>
      {props.children}
    </ReferralContext.Provider>
  );
};

const wipeLegacyReferralFromLocalStorage = () => {
  if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
};

export const useReferralCode = () => useContext(ReferralContext).referralCode;
