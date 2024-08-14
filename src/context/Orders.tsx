import { ActiveOrders } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import React, { PropsWithChildren } from "react";
import {
  Observer,
  useConsumeObserver,
  useCreateObserver,
} from "../hooks/useObserver";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";

type OrderContextValue = {
  orders: ActiveOrders | undefined;
  orderObserver: Observer;
  refresh: () => Promise<void>;
  loading: boolean;
};

const OrderContext = React.createContext<OrderContextValue | null>(null);

export const OrderProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const connectedAccount = useConnectedAccount();
  const observer = useCreateObserver();
  const [orders, setOrders] = React.useState<ActiveOrders>();
  const [initialLoaded, setInitialLoaded] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    if (!connectedAccount) {
      setOrders(undefined);
      return;
    }
    setOrders(
      // TODO IMPLEMENT/FIX
      // await platform.getActiveOrders({
      //   account: connectedAccount,
      //   provider: getProvider("arbitrum"),
      // }),
      { increase: [], decrease: [] },
    );
    if (!initialLoaded) setInitialLoaded(true);
  }, [connectedAccount]);

  // Fetch every 10 seconds when we have observers.
  React.useEffect(() => {
    if (!observer.isBeingObserved) return;
    fetchOrders();
    const timeout = setInterval(() => {
      fetchOrders();
    }, 10_000);
    return () => clearInterval(timeout);
  }, [fetchOrders, observer.isBeingObserved]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        orderObserver: observer,
        refresh: fetchOrders,
        loading: !initialLoaded,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = React.useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderStore must be used within a OrderProvider");
  }
  const { orderObserver, ...value } = context;
  useConsumeObserver(orderObserver);
  return value;
};

// Seperate hook for refreshing orders, since it doesn't need to be observed.
export const useRefreshOrders = () => {
  const context = React.useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderStore must be used within a OrderProvider");
  }
  return context.refresh;
};
