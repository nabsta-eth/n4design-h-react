import { BigNumber } from "ethers";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/handle-fi/handle-fxtoken",
  cache: new InMemoryCache(),
});

export type TokenEntity = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isFxToken: boolean;
  totalSupply: BigNumber;
  totalMinted: BigNumber;
  totalBurned: BigNumber;
  totalVolume: BigNumber;
  totalHodlers: BigNumber;
  totalHistoricMinters: BigNumber;
  totalAllowanceTargets: BigNumber;
  administrators: string[];
  operators: string[];
};

export type HodlerEntity = {
  id: string;
  address: string;
  token: string;
  balance: BigNumber;
};

export type MinterEntity = {
  id: string;
  address: string;
  token: string;
  totalMinted: BigNumber;
  totalBurned: BigNumber;
};

export type AllowanceTargetEntity = {
  id: string;
  address: string;
  token: string;
  totalApprovers: BigNumber;
};

const entitiesQuery = gql`
  {
    tokens {
      id
      symbol
      name
      decimals
      isFxToken
      totalSupply
      totalMinted
      totalBurned
      totalVolume
      totalHodlers
      totalHistoricMinters
      totalAllowanceTargets
      administrators
      operators
    }
  }
`;

const getTopHodlersQuery = (first: number, tokenAddress: string) => gql`
{
  hodlers(
    first: ${first}
    orderBy: balance
    orderDirection: desc
    where: {
      token: "${tokenAddress.toLowerCase()}"
    }
  ) {
    id
    address
    token {
      id
    }
    balance
  }
}
`;

const getTopMintersQuery = (first: number, tokenAddress: string) => gql`
{
  minters(
    first: ${first}
    orderBy: totalMinted
    orderDirection: desc
    where: {
      token: "${tokenAddress.toLowerCase()}"
    }
  ) {
    id
    address
    token {
      id
    }
    totalMinted
    totalBurned
  }
}
`;

export const getTokenEntities = async (): Promise<TokenEntity[]> => {
  const {
    data: { tokens },
  } = await client.query({ query: entitiesQuery });
  if (!Array.isArray(tokens))
    throw new Error("getTokenEntities: invalid response");
  return tokens.map(token => ({
    ...token,
    address: token.id,
    totalSupply: BigNumber.from(token.totalSupply),
    totalMinted: BigNumber.from(token.totalMinted),
    totalBurned: BigNumber.from(token.totalBurned),
    totalVolume: BigNumber.from(token.totalVolume),
    totalHodlers: BigNumber.from(token.totalHodlers),
    totalHistoricMinters: BigNumber.from(token.totalHistoricMinters),
    totalAllowanceTargets: BigNumber.from(token.totalAllowanceTargets),
  }));
};

export const getTopHodlerEntities = async (
  count: number,
  tokenAddress: string,
): Promise<HodlerEntity[]> => {
  const {
    data: { hodlers },
  } = await client.query({
    query: getTopHodlersQuery(count, tokenAddress),
  });
  if (!Array.isArray(hodlers))
    throw new Error("getTopHodlerEntities: invalid response");
  return hodlers.map(hodler => ({
    ...hodler,
    balance: BigNumber.from(hodler.balance),
  }));
};

export const getTopMinterEntities = async (
  count: number,
  tokenAddress: string,
): Promise<MinterEntity[]> => {
  const {
    data: { minters },
  } = await client.query({
    query: getTopMintersQuery(count, tokenAddress),
  });
  if (!Array.isArray(minters))
    throw new Error("getTopMinterEntities: invalid response");
  return minters.map(minter => ({
    ...minter,
    totalMinted: BigNumber.from(minter.totalMinted),
    totalBurned: BigNumber.from(minter.totalBurned),
  }));
};
