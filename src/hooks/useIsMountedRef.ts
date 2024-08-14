import * as React from "react";

export const useIsMountedRef = (): { current: boolean } => {
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
};
