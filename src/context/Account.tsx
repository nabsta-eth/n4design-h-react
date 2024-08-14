import * as React from "react";

export type AccountVault = {
  account: string | undefined;
  setAccount: (account?: string) => void;
};

export const AccountContext = React.createContext<AccountVault | undefined>(
  undefined,
);

export const AccountProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [account, setAccountInternal] = React.useState<string>();

  const setAccount = React.useCallback((newAccount?: string) => {
    setAccountInternal(newAccount);
  }, []);

  const value = React.useMemo(
    () => ({
      account,
      setAccount,
    }),
    [account, setAccount],
  );

  return (
    <AccountContext.Provider value={value}>
      {props.children}
    </AccountContext.Provider>
  );
};

export const useAccountStore = () => {
  const context = React.useContext(AccountContext);

  if (context === undefined) {
    throw new Error("useAccountStore must be used within a AccountProvider");
  }
  return context;
};

export const useAccount = (): string | undefined => {
  const { account } = useAccountStore();

  return account;
};
