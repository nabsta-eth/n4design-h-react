import { useTrade } from "../context/Trade";
import useQueryString from "./useQueryString";

export const usePositionFromQueryString = () => {
  const pairQuery = useQueryString().get("pair");
  const pair = pairQuery ? JSON.parse(pairQuery) : null;
  const { account: tradeAccount } = useTrade();
  return pair && tradeAccount?.getPosition(pair);
};
