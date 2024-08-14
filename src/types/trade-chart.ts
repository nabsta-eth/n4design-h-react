/** Price from Chainlink subgraph entity. [timestamp, value]. */
export type ChainlinkPrice = [number, number];

export type BarData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};
