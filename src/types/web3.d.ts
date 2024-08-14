declare namespace web3 {
  type WalletName = "wallet_connect" | "metamask" | "magic" | "gnosis";
  type MapWalletName<T> = { [key in WalletName]: T };
  type NetworkDetails = {
    chainName: string;
    chainId: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
  };
}
