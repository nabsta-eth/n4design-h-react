import { useEffect } from "react";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { useLocalStorage } from "@handle-fi/react-components/dist/hooks/useLocalStorage";
import { sleep } from "../utils/general";

const MESSAGE = "reloading the page to enable dynamic sandbox...\n";
const TIMEOUT_SECS = 2;

export const EnableDynamicSandbox = () => {
  const [_, setShouldUseDynamicSandbox] = useLocalStorage<boolean>(
    "shouldUseDynamicSandbox",
    false,
  );
  useEffect(() => {
    setShouldUseDynamicSandbox(true);
    showNotification({
      status: "success",
      message: MESSAGE,
      timeoutInSeconds: TIMEOUT_SECS,
    });
    sleep(TIMEOUT_SECS * 1000).then(() => (window.location.href = "/trade"));
  }, []);
  return <>enabling dynamic sandbox...</>;
};
