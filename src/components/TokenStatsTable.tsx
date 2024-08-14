import { ethers } from "ethers";
import { IndexedFxToken } from "handle-sdk";
import { displayDollarsAndCents } from "../utils/format";

type Props = {
  fxTokens: IndexedFxToken[];
};

const TokenStatsTable: React.FC<Props> = props => {
  const ethUsdPrice = ethers.constants.WeiPerEther.pow(2).div(
    props.fxTokens.find(t => t.symbol === "fxUSD")?.rate!,
  );

  const data = props.fxTokens.map(({ symbol, rate, totalSupply, decimals }) => {
    const price = rate.mul(ethUsdPrice);

    const marketcap = rate
      .mul(ethUsdPrice)
      .mul(totalSupply)
      .div(ethers.constants.WeiPerEther.pow(2));

    return {
      symbol,
      price,
      decimals,
      marketcap,
      totalSupply,
    };
  });

  const rows = data
    .sort((a, b) => {
      if (a.marketcap.lt(b.marketcap)) {
        return 1;
      }

      if (a.marketcap.gt(b.marketcap)) {
        return -1;
      }

      return 0;
    })
    .map(({ symbol, price, marketcap, decimals, totalSupply }) => {
      return (
        <tr key={symbol}>
          <td>{symbol}</td>
          <td>{displayDollarsAndCents(totalSupply)}</td>
          <td>${displayDollarsAndCents(price, decimals * 2)}</td>
          <td>${displayDollarsAndCents(marketcap)}</td>
        </tr>
      );
    });

  return (
    <table>
      <thead>
        <tr>
          <th>fxToken</th>
          <th>total supply</th>
          <th>price (USD)</th>
          <th>value (USD)</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};

export default TokenStatsTable;
