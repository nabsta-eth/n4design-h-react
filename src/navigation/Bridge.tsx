import { BigNumber, ContractTransaction, ethers, Signer } from "ethers";
import * as React from "react";
import {
  BridgeNetwork,
  Network,
  PendingWithdrawal,
  TokenInfo,
} from "handle-sdk";
import {
  InputNumberWithBalance,
  SelectBridgeToken,
  PageTitle,
  ButtonSmart,
  Button,
} from "../components";
import { bridgeSDK } from "../context/Protocol";
import useInputNumberState from "../hooks/useInputNumberState";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useBalance, useUserBalanceStore } from "../context/UserBalances";
import useSetAccount from "../hooks/useSetAccount";
import { useBridgeDepositAllowance } from "../hooks/useAllowanceFromSDK";
import { getMockSigner } from "@handle-fi/react-components/dist/utils/web3";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import SelectNetwork from "../components/SelectNetwork";
import { FxTokenAndForexSymbol } from "../types/tokens";
import useSendTransaction, {
  SendTransaction,
} from "../hooks/useSendTransaction";
import {
  BridgeNotificationArgs,
  getBlockExplorerDisplayStringFromHash,
  getBridgeDepositNotifications,
  getBridgeDepositSuccessNotificationFromReceipt,
  getBridgeWithdrawNotifications,
  getBridgeWithdrawSuccessNotificationFromReceipt,
} from "../config/notifications";
import PendingWithdrawalsTable from "../components/Bridge/PendingWithdrawalsTable";
import ManualFetchWithdrawal from "../components/Bridge/ManualFetchWithdrawal";
import Metatags from "../components/Metatags";
import { useAllTokens } from "../context/TokenManager";
import { showTransactionNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { formatEther } from "ethers/lib/utils";
import BridgeList from "../components/ExternalBridgeList/ExternalBridgeList";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { bridgeNetworks } from "handle-sdk/dist/types/network";

const DEFAULT_FROM_NETWORK: BridgeNetwork = "arbitrum";
const DEFAULT_TO_NETWORK: BridgeNetwork = "ethereum";
const DEFAULT_TOKEN = "fxAUD";
const DISABLED_TO_TOKEN: BridgeNetwork = "polygon";
const NETWORKS_TO_EXCLUDE: Network[] = ["arbitrum-sepolia"];

const deposit = async (
  sendTransaction: SendTransaction,
  fromNetwork: BridgeNetwork,
  toNetwork: BridgeNetwork,
  token: TokenInfo,
  amount: BigNumber,
  signer: Signer,
  hasEnoughAllowance: boolean,
  updateAllowance: (value: BigNumber) => Promise<void>,
  callback: (tx: ContractTransaction) => any,
) => {
  if (!hasEnoughAllowance) return updateAllowance(ethers.constants.MaxUint256);
  await sendTransaction(
    gasPrice =>
      bridgeSDK.deposit(
        {
          fromNetwork,
          toNetwork,
          tokenSymbol: token.symbol,
          amount,
        },
        signer,
        { gasPrice },
      ),
    getBridgeDepositNotifications({
      toNetwork,
      fromNetwork,
      amount,
      token,
    }),
    {
      callback,
      overwriteSuccessMessage: receipt =>
        getBridgeDepositSuccessNotificationFromReceipt(
          fromNetwork,
          toNetwork,
          token,
          amount,
          receipt,
        ),
    },
  );
};

const requestAutomaticWithdrawal = async (
  fromNetwork: BridgeNetwork,
  transactionHash: string,
  notificationArguments: Omit<BridgeNotificationArgs, "fromNetwork">,
) => {
  const notifications = getBridgeWithdrawNotifications({
    fromNetwork,
    ...notificationArguments,
  });

  showTransactionNotification("pending", notifications);
  try {
    const withdrawTxHash = await bridgeSDK.requestAutomaticWithdraw(
      fromNetwork,
      transactionHash,
    );
    const blockExplorerDisplay = getBlockExplorerDisplayStringFromHash(
      withdrawTxHash,
      notificationArguments.toNetwork,
    );
    notifications.success = `${notifications.success}${blockExplorerDisplay}`;
    showTransactionNotification("success", notifications);
  } catch (error) {
    console.error(
      "Bridge withdrawal error",
      error,
      "from network",
      fromNetwork,
      "deposit transaction hash",
      transactionHash,
    );
    showTransactionNotification("error", notifications);
    return;
  }
};

const BridgePage: React.FC = () => {
  useSetAccount();
  const connectedNetwork = useConnectedNetwork();
  const { switchNetwork, isDev } = useUserWalletStore();
  const { refreshBalance } = useUserBalanceStore();

  const [fromNetwork, setFromNetwork] = React.useState<BridgeNetwork>(
    getDefaultFromBridgeNetwork(connectedNetwork),
  );
  const [toNetwork, setToNetwork] = React.useState<BridgeNetwork>(
    fromNetwork === DEFAULT_TO_NETWORK
      ? DEFAULT_FROM_NETWORK
      : DEFAULT_TO_NETWORK,
  );
  const [tokenSymbol, setTokenSymbol] =
    React.useState<FxTokenAndForexSymbol>(DEFAULT_TOKEN);
  const [withdrawingHash, setWithdrawingHash] = React.useState<string>();
  const [pendingWithdrawals, setPendingWithdrawals] =
    React.useState<PendingWithdrawal[]>();
  const amount = useInputNumberState();
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const [withdrawWithAddress, setWithdrawWithAddress] = React.useState<
    string | undefined
  >();
  const [minimumDeposit, setMinimumDeposit] = React.useState(
    ethers.constants.Zero,
  );
  const { isSigningDone, isTermsModalOpen, ensureTermsSigned } =
    useTermsAndConditions();

  const onSelectFromNetwork = React.useCallback(
    (newFromNetwork: Network) => {
      setFromNetwork(getDefaultFromBridgeNetwork(newFromNetwork));

      if (newFromNetwork === toNetwork) {
        // If from network is polygon, switch to other network that
        // is neither the newFromNetwork nor polygon
        const fromNetworkWithoutPolygon =
          fromNetwork === DISABLED_TO_TOKEN
            ? newFromNetwork === "arbitrum"
              ? "ethereum"
              : "arbitrum"
            : fromNetwork;
        setToNetwork(getDefaultToBridgeNetwork(fromNetworkWithoutPolygon));
      }
    },
    [toNetwork, fromNetwork],
  );

  const onSelectToNetwork = React.useCallback(
    (newToNetwork: Network) => {
      setToNetwork(getDefaultToBridgeNetwork(newToNetwork));

      if (newToNetwork === fromNetwork) {
        setFromNetwork(getDefaultFromBridgeNetwork(toNetwork));
      }
    },
    [fromNetwork, toNetwork],
  );

  React.useEffect(() => {
    if (connectedNetwork) {
      onSelectFromNetwork(getDefaultFromBridgeNetwork(connectedNetwork));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedNetwork]);

  const { balance } = useBalance({
    tokenSymbol: tokenSymbol,
    network: fromNetwork,
  });

  const { allowance, updateAllowance } = useBridgeDepositAllowance(
    tokenSymbol,
    fromNetwork,
  );

  const tokens = useAllTokens(fromNetwork);
  const tokenInfo = React.useMemo(
    () => tokens.find(t => t.symbol === tokenSymbol),
    [tokens, tokenSymbol],
  );

  const loading = connectedAccount && (!balance || !allowance);
  const hasEnoughBalance = balance?.gte(amount.value.bn);
  const hasEnoughAllowance = !!allowance?.gte(amount.value.bn);

  const canDeposit =
    !amount.value.bn.isZero() &&
    hasEnoughBalance &&
    fromNetwork !== toNetwork &&
    !loading &&
    amount.value.bn.gt(minimumDeposit);

  const fetchPendingWithdraws = React.useCallback(async () => {
    if (!connectedAccount) return;
    const result = await bridgeSDK.getPendingWithdrawals(connectedAccount, {
      ethereum: getMockSigner("ethereum"),
      arbitrum: getMockSigner("arbitrum"),
      polygon: getMockSigner("polygon"),
    });
    setPendingWithdrawals(result);
  }, [connectedAccount]);

  // Call `fetchpendingWithdraws` on callback change.
  React.useEffect(() => {
    fetchPendingWithdraws();
  }, [fetchPendingWithdraws]);

  // Request automatic withdrawal on `pendingWithdrawals` change.
  React.useEffect(() => {
    if (isDev || !Array.isArray(pendingWithdrawals)) return;
    (async () => {
      for (let deposit of pendingWithdrawals) {
        await requestAutomaticWithdrawal(deposit.fromNetwork, deposit.txHash, {
          toNetwork: deposit.toNetwork,
          token: tokens.find(x => x.symbol === deposit.tokenSymbol)!,
          amount: deposit.amount,
        });
        // Wait 30 seconds between withdrawals as tx is only
        // sent to mempool in the server, but not confirmed.
        // This should only matter if the user has more than one
        // pending withdrawal, which is an edge case.
        // This wait period cannot be too low, otherwise
        // the same withdrawal may be requested twice which may
        // trigger an error notification for the user.
        await new Promise(resolve => setTimeout(resolve, 30_000));
      }
    })();
  }, [pendingWithdrawals]);

  // Update `minimumDeposit`.
  React.useEffect(() => {
    (async () => {
      setMinimumDeposit(await bridgeSDK.getTokenFee(tokenSymbol, toNetwork));
    })();
  }, [toNetwork, tokenSymbol]);

  const onSuccessfulDeposit = React.useCallback(async () => {
    await Promise.all([refreshBalance(fromNetwork), fetchPendingWithdraws()]);
    amount.reset();
  }, [fetchPendingWithdraws, fromNetwork]);

  const onWithdraw = React.useCallback(
    async (pendingWithdrawal: PendingWithdrawal) => {
      if (!signer) return;
      setWithdrawingHash(pendingWithdrawal.txHash);

      try {
        if (connectedNetwork !== pendingWithdrawal.toNetwork) {
          await switchNetwork(pendingWithdrawal.toNetwork);
          setWithdrawingHash(undefined);
          return;
        }
        const signature = await bridgeSDK.getWithdrawSignature(
          pendingWithdrawal.fromNetwork,
          pendingWithdrawal.txHash,
        );

        const nonce = await bridgeSDK.getWithdrawNonce(
          {
            fromNetwork: pendingWithdrawal.fromNetwork,
            toNetwork: pendingWithdrawal.toNetwork,
            address: withdrawWithAddress,
          },
          signer,
        );

        await sendTransaction(
          gasPrice =>
            bridgeSDK.withdraw(
              {
                fromNetwork: pendingWithdrawal.fromNetwork,
                toNetwork: pendingWithdrawal.toNetwork,
                tokenSymbol: pendingWithdrawal.tokenSymbol,
                amount: pendingWithdrawal.amount,
                nonce: withdrawWithAddress ? pendingWithdrawal.nonce : nonce,
                signature,
                address: withdrawWithAddress,
              },
              signer,
              { gasPrice },
            ),
          getBridgeWithdrawNotifications({
            fromNetwork: pendingWithdrawal.fromNetwork,
            toNetwork,
            amount: pendingWithdrawal.amount,
            token: tokenInfo!,
          }),
          {
            overwriteSuccessMessage: receipt =>
              getBridgeWithdrawSuccessNotificationFromReceipt(
                fromNetwork,
                toNetwork,
                tokenInfo!,
                amount.value.bn,
                receipt,
              ),
          },
        );
      } catch (error) {
        console.log(error);
      }
      amount.reset();
      setWithdrawingHash(undefined);
    },
    [
      connectedNetwork,
      signer,
      amount,
      tokens,
      toNetwork,
      sendTransaction,
      switchNetwork,
      withdrawWithAddress,
    ],
  );

  const onSwitchNetwork = React.useCallback(
    _event => {
      _event.preventDefault();
      setFromNetwork(toNetwork);
      setToNetwork(fromNetwork);
      amount.reset();
    },
    [fromNetwork, toNetwork],
  );

  const buttonText = () => {
    if (!hasEnoughBalance) return "insufficient balance";
    if (!amount.value.bn.isZero() && amount.value.bn.lte(minimumDeposit))
      return "amount below minimum";
    if (!isSigningDone.current && canDeposit) return "sign terms of use";
    if (!hasEnoughAllowance && !amount.value.bn.isZero())
      return `allow handle to bridge ${tokenSymbol}`;
    return "bridge";
  };

  const processing =
    sendingTransaction || !!withdrawingHash || isTermsModalOpen;

  const onChangeToken = (token: string) => {
    setTokenSymbol(token);
    amount.reset();
  };

  const [showExternalBridges, setShowExternalBridges] = React.useState(false);
  const toggleBridges = () => {
    setShowExternalBridges(!showExternalBridges);
  };

  const submitBridge = async () => {
    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    signer &&
      deposit(
        sendTransaction,
        fromNetwork,
        toNetwork,
        tokenInfo!,
        amount.value.bn,
        signer,
        hasEnoughAllowance,
        updateAllowance,
        onSuccessfulDeposit,
      );
  };

  const idPrefix = "bridge";

  return (
    <React.Fragment>
      <Metatags
        function="bridge"
        description="bridge FOREX &amp; fxTokens between networks"
      />

      <Container size="small" className="uk-flex uk-flex-middle uk-flex-column">
        <form noValidate autoComplete="off" className="uk-form-width-large">
          <PageTitle text="bridge" />

          <div className="uk-flex uk-flex-middle">
            <SelectNetwork
              id={`${idPrefix}-from-network`}
              wrapperClassName="uk-width-expand"
              label="from"
              value={fromNetwork}
              onChange={onSelectFromNetwork}
              disabled={processing}
              networksToExclude={NETWORKS_TO_EXCLUDE}
            />

            <div
              className="uk-flex uk-flex-center uk-flex-bottom uk-height-1-1"
              style={{ marginBottom: "-21px" }}
            >
              <div className="uk-margin-small-left uk-margin-small-right">
                <Button
                  icon
                  onClick={onSwitchNetwork}
                  disabled={fromNetwork === DISABLED_TO_TOKEN}
                >
                  <FontAwesomeIcon
                    icon={["fal", "exchange"]}
                    className="fa-icon"
                  />
                </Button>
              </div>
            </div>

            <SelectNetwork
              id={`${idPrefix}-to-network`}
              label="to"
              wrapperClassName="uk-width-expand"
              value={toNetwork}
              onChange={onSelectToNetwork}
              disabled={processing}
              networksToExclude={[DISABLED_TO_TOKEN, ...NETWORKS_TO_EXCLUDE]}
              showSelected
            />
          </div>

          <SelectBridgeToken
            id={`${idPrefix}-token`}
            wrapperClassName="uk-margin-top"
            value={tokenSymbol}
            network={fromNetwork}
            onChange={token => onChangeToken(token)}
            showBalance={true}
            disabled={processing}
          />

          <InputNumberWithBalance
            id={`${idPrefix}-amount`}
            label="amount"
            wrapperClassName="uk-margin-top"
            network={fromNetwork}
            value={amount.value}
            tokenSymbol={tokenSymbol}
            onChange={amount.onChange}
            placeholder="amount to bridge"
            alert={
              !amount.value.bn.isZero() && amount.value.bn.lte(minimumDeposit)
            }
            rightLabel={
              minimumDeposit.gt(0)
                ? `fee: ${formatEther(minimumDeposit)} ${tokenSymbol}`
                : undefined
            }
            disabled={processing}
          />

          <ButtonSmart
            id={`${idPrefix}-submit`}
            network={fromNetwork}
            className="uk-width-expand uk-margin-top"
            onClick={submitBridge}
            disabled={amount.value.bn.isZero()}
            loading={loading || processing}
          >
            {buttonText()}
          </ButtonSmart>
        </form>

        <div className="uk-margin-top uk-form-width-large uk-text-left cursor-pointer">
          <span
            onClick={toggleBridges}
            uk-tooltip="title: show other external bridges; pos: right;"
          >
            external bridges
            <FontAwesomeIcon
              icon={[
                "far",
                showExternalBridges ? "chevron-up" : "chevron-down",
              ]}
              className="uk-margin-small-top uk-margin-small-left"
            />
          </span>
        </div>

        {showExternalBridges && <BridgeList />}

        {isDev && (
          <ManualFetchWithdrawal
            network={fromNetwork}
            requestSetAddress={x => setWithdrawWithAddress(x)}
            onFetched={pw => {
              setPendingWithdrawals(value => {
                const array = value || [];
                return [...array, pw];
              });
            }}
          />
        )}

        {isDev && !!pendingWithdrawals?.length && (
          <React.Fragment>
            <h4>pending withdrawls</h4>
            <PendingWithdrawalsTable
              pendingWithdrawals={pendingWithdrawals}
              withdrawingHash={withdrawingHash}
              connectedNetwork={connectedNetwork}
              onWithdraw={onWithdraw}
            />
          </React.Fragment>
        )}
      </Container>
    </React.Fragment>
  );
};

const getDefaultFromBridgeNetwork = (
  network: Network | undefined,
): BridgeNetwork => {
  if (!network || !bridgeNetworks.includes(network as BridgeNetwork)) {
    return DEFAULT_FROM_NETWORK;
  }
  return network as BridgeNetwork;
};

const getDefaultToBridgeNetwork = (
  network: Network | undefined,
): BridgeNetwork => {
  if (!network || !bridgeNetworks.includes(network as BridgeNetwork)) {
    return DEFAULT_TO_NETWORK;
  }
  return network as BridgeNetwork;
};

export default BridgePage;
