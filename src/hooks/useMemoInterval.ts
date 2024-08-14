import { DependencyList, useEffect, useMemo, useState } from "react";

/**
 * Memoised value that expires after a certain input time.
 * This will re-calculate the value immediately whenever any of the
 * deps change, and regularly on the interval.
 * @param interval The interval in milliseconds.
 * @param factory The useMemo factory.
 * @param deps The useMemo dependency list.
 */
export const useMemoInterval = <T>(
  factory: () => T,
  interval: number,
  deps: DependencyList,
): T => {
  const [trigger, setTrigger] = useState(false);
  const value = useMemo(factory, [...deps, trigger]);

  useEffect(() => {
    const id = setInterval(() => setTrigger(t => !t), interval);
    return () => clearInterval(id);
  }, [interval]);

  return value;
};
