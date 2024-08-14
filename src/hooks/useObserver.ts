import React from "react";

// The idea behind this is that we can use this hook to track how many
// components are observing a certain value. If the number of observers
// is 0, we can stop refetching the value.
export type Observer = ReturnType<typeof useCreateObserver>;

export const useConsumeObserver = (
  observer: Pick<Observer, "startObserving" | "stopObserving">,
) => {
  React.useEffect(() => {
    observer.startObserving();
    return () => observer.stopObserving();
  }, [observer.startObserving, observer.stopObserving]);
};

export const useCreateObserver = () => {
  const [observers, setObservers] = React.useState(0);

  const startObserving = React.useCallback(() => setObservers(o => o + 1), []);
  const stopObserving = React.useCallback(() => setObservers(o => o - 1), []);

  return {
    startObserving,
    stopObserving,
    observers,
    isBeingObserved: observers > 0,
  };
};
