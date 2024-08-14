import * as React from "react";
import { PageTitle } from "../index";
import { GovernanceRoute } from "../../navigation/Governance";
import { useEffect, useState } from "react";
import { fetchPortfolio } from "handle-sdk/dist/components/portfolio";
import { MultiLineText } from "../MultiLineText";
import { useTrade } from "../../context/Trade";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { ReferralsNetwork } from "handle-sdk/dist/types/network";

const DEFAULT_ACCOUNT = "0x420220B72bbd307db8615e7aa0eAdCA399cf2FC0";

const PortfolioViewer: React.FC = () => {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const network = useConnectedNetwork();
  const { reader } = useTrade();
  useEffect(() => {
    setIsLoading(true);
    // TODO refactor `fetchPortfolio` to accept the `Network` type.
    fetchPortfolio(account, reader, network as ReferralsNetwork).then(
      portfolio => {
        setData(JSON.stringify(portfolio, null, 2));
        setIsLoading(false);
      },
    );
  }, [account]);
  return (
    <div>
      <PageTitle text="portfolio data viewer" />
      <b>view portfolio for account</b>
      <br />
      <input value={account} onChange={e => setAccount(e.target.value)} />
      <br />
      {isLoading ? "loading..." : <MultiLineText text={data} />}
    </div>
  );
};

export default {
  component: PortfolioViewer,
  name: "PortfolioViewer",
} as GovernanceRoute;
