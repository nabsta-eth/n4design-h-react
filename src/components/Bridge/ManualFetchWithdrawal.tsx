import * as React from "react";
import {
  BridgeSDK,
  PendingWithdrawal,
  config as sdkConfig,
  BridgeNetwork,
} from "handle-sdk";
import { Button, Input } from "../index";
import {
  getEventData,
  getMockSigner,
  getProvider,
} from "@handle-fi/react-components/dist/utils/web3";
import Toggle from "../Toggle/Toggle";
import { useAllTokens } from "../../context/TokenManager";
import { config } from "../../config";

const ManualFetchWithdrawal: React.FC<{
  network: BridgeNetwork;
  onFetched: (pw: PendingWithdrawal) => any;
  requestSetAddress?: (address: string | undefined) => any;
}> = ({ network, onFetched, requestSetAddress }) => {
  const [txHash, setTxHash] = React.useState("");
  const [depositorAddress, setDepositorAddress] = React.useState<
    string | undefined
  >();
  const [useEventAddress, setUseEventAddress] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const tokenList = useAllTokens(network);

  const loadPendingWithdrawal = async () => {
    if (!network) throw new Error("loadPendingWithdrawal: no network");
    setLoading(true);
    const provider = getProvider(network);
    const receipt = await provider.getTransactionReceipt(txHash);
    const sdk = new BridgeSDK({
      apiBaseUrl: sdkConfig.bridge.apiBaseUrl,
      forexAddress: sdkConfig.forexAddress,
      byNetwork: sdkConfig.bridge.byNetwork,
      fxTokenAddresses: config.getFxTokensForScreens(["bridge"]),
    });
    const bridge = sdk.getBridgeContract(network, getMockSigner(network));
    const event = getEventData("Deposit", bridge, receipt);
    const toNetwork: BridgeNetwork | undefined = Object.keys(
      sdk.config.byNetwork,
    ).find(
      network =>
        // @ts-ignore
        sdk.config.byNetwork[network].id === event?.args?.toId?.toNumber(),
    ) as BridgeNetwork;
    if (!toNetwork) throw new Error("loadPendingWithdrawal: no toNetwork");
    const tokenSymbol = tokenList?.find(
      token => token.address === event?.args?.token,
    )?.symbol;
    if (!tokenSymbol) throw new Error("loadPendingWithdrawal: no tokenSymbol");
    setDepositorAddress(event?.args?.depositor);
    const pw: PendingWithdrawal = {
      txHash,
      tokenSymbol,
      amount: event?.args?.amount,
      nonce: event?.args?.nonce,
      fromNetwork: network,
      toNetwork,
    };
    setLoading(false);
    setTxHash("");
    onFetched(pw);
  };

  React.useEffect(() => {
    if (!requestSetAddress) return;
    requestSetAddress(useEventAddress ? depositorAddress : undefined);
  }, [useEventAddress, depositorAddress]);

  return (
    <div className="uk-margin-top">
      <div>
        <Toggle value={useEventAddress} onToggle={x => setUseEventAddress(x)} />
        use event address
      </div>
      <Input
        id="txHash"
        label="Deposit Transaction Hash"
        value={txHash}
        onChange={value => setTxHash(value)}
      />
      <Button
        className="uk-width-expand uk-margin-small-top"
        onClick={loadPendingWithdrawal}
        disabled={loading}
        loading={loading}
      >
        Find Pending Withdrawal
      </Button>
    </div>
  );
};

export default ManualFetchWithdrawal;
