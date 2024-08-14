import { useStakedHlpData } from "../hooks/useStakedHlpData";
import { hlp } from "handle-sdk/dist/components/trade/platforms";

const HlpStakingStats = () => {
  const data = useStakedHlpData(hlp.config.DEFAULT_HLP_NETWORK)!;
  return (
    <div>
      <div className="uk-flex uk-flex-between uk-grid-small">
        <span>TVL</span>
        <span>{data.tvlInUSD}</span>
      </div>

      <div className="uk-flex uk-flex-between uk-grid-small">
        <span>APR</span>
        <span>{data.estApr}</span>
      </div>

      <div className="uk-flex uk-flex-between uk-grid-small">
        <span>total staked</span>
        <span className="uk-margin-left">{data.totalDeposits} hLP</span>
      </div>
    </div>
  );
};

export default HlpStakingStats;
