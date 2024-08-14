import { ApolloClient, InMemoryCache } from "@apollo/client";

export const CHAINLINK_GRAPH_API_URL =
  "https://api.thegraph.com/subgraphs/name/deividask/chainlink";

export const HANDLE_TRADE_GRAPH_API_URL =
  "https://api.thegraph.com/subgraphs/name/handle-fi/handle-trade";

export const chainlinkClient = new ApolloClient({
  uri: CHAINLINK_GRAPH_API_URL,
  cache: new InMemoryCache(),
});

export const handleTradeClient = new ApolloClient({
  uri: HANDLE_TRADE_GRAPH_API_URL,
  cache: new InMemoryCache(),
});
