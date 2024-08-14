import { parseEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { Network } from "handle-sdk";

export type Monitor = {
  name: string;
  address: string;
  balanceSymbol: string;
  networks: Network[];
};

export const lowBalances: { [symbol: string]: BigNumber } = {
  ETH: parseEther("0.02"),
  FOREX: parseEther("5000"),
  MATIC: parseEther("20"),
};

export const monitors = [
  {
    name: "Synths server bot",
    address: "0xcafe1Ff994293F286eb88561F9B6bF1B69C06be1",
    balanceSymbol: "ETH",
    networks: ["arbitrum"],
  },
  {
    name: "Reward Pool",
    address: "0xDE17Af0E4A6c870762508DcB7dCc20719584CBd0",
    balanceSymbol: "FOREX",
    networks: ["arbitrum"],
  },
  {
    name: "Bridge bot",
    address: "0xbabe32F532698f384ddaA61D8A14a07AB2E515Eb",
    balanceSymbol: "ETH",
    networks: ["arbitrum", "ethereum", "polygon"],
  },
  {
    name: "fxToken liquidator bot",
    address: "0xeb05636cf920c9e3ae454d82a71c8d3f05c4a668",
    balanceSymbol: "ETH",
    networks: ["arbitrum"],
  },
  {
    name: "hLP liquidator bot",
    address: "0xeeeebC39021050d002D43e59E6209B77BcC78f5D",
    balanceSymbol: "ETH",
    networks: ["arbitrum"],
  },
  {
    name: "Chainlink bot",
    address: "0x746d1bc4aAE7b76d3431C0441CDf9BF160e34C4e",
    balanceSymbol: "ETH",
    networks: ["arbitrum"],
  },
  {
    name: "Rebates",
    address: "0xd5D4F5442615Db3E2DfB3F5cf6559bA1716BA362",
    balanceSymbol: "FOREX",
    networks: ["arbitrum"],
  },
  {
    name: "Permit Executor",
    address: "0xeeed6DA1F27b704F014737318140F4dFD256E7F5",
    balanceSymbol: "ETH",
    networks: ["arbitrum", "ethereum"],
  },
] as Monitor[];
