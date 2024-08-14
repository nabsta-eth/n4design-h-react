import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import { useEffect, useState } from "react";

export type UseGraph<T> = [T | undefined, boolean, any];

export const useGraph = <TData>(
  querySource: string | string[],
  subgraphUrl: string,
): UseGraph<TData> => {
  const query = gql(querySource);

  const client = new ApolloClient({
    link: new HttpLink({ uri: subgraphUrl, fetch }),
    cache: new InMemoryCache(),
  });

  const [data, setData] = useState<TData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
  }, [querySource]);

  useEffect(() => {
    client
      .query({ query })
      .then(({ data }) => {
        setData(data as TData);
      })
      .catch(exception => {
        console.warn(
          "Subgraph request failed error: %s subgraphUrl: %s",
          exception.message,
          subgraphUrl,
        );
        setError(exception);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [querySource]);

  return [data, loading, error];
};
