import React from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  generatePath,
} from "react-router-dom";
import { useAccountStore } from "../context/Account";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";

const useSetAccount = (url?: string) => {
  const { account, ...restOfParams } = useParams();
  const { setAccount } = useAccountStore();
  const connectedAccount = useConnectedAccount();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (connectedAccount && account !== connectedAccount && url) {
      const path = generatePath(url, {
        ...restOfParams,
        account: connectedAccount,
      });
      navigate(path, {
        replace: true,
      });
    }
    setAccount(account?.toLowerCase() || connectedAccount?.toLowerCase());
  }, [
    account,
    connectedAccount,
    location,
    restOfParams,
    url,
    setAccount,
    navigate,
  ]);
};

export default useSetAccount;
