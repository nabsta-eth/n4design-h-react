import * as React from "react";
import { useContext, useEffect, useMemo, useState } from "react";

export type FocusValue = {
  /**
   * Whether the app is focused (i.e. active tab for desktop, or not in
   * the background for mobile).
   */
  isFocused: boolean;
};

export const FocusContext = React.createContext<FocusValue>({
  isFocused: true,
});

export const FocusProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const [isFocused, setIsFocused] = useState(true);
  useEffect(() => {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setIsFocused(false);
      } else {
        setIsFocused(true);
      }
    });
  }, []);
  useEffect(() => {
    console.debug(`[FOCUS] ${isFocused ? "ON" : "OFF"}`);
  }, [isFocused]);
  const value: FocusValue = useMemo(
    () => ({
      isFocused,
    }),
    [isFocused],
  );
  return (
    <FocusContext.Provider value={value}>
      {props.children}
    </FocusContext.Provider>
  );
};

export const useFocus = (): FocusValue => useContext(FocusContext);
