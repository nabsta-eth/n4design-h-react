import classes from "./DevPanel.module.scss";
import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import Button from "../Button";
import { isDevPanelVisibleLocalStorage } from "../../utils/local-storage";

const DevPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(
    isDevPanelVisibleLocalStorage.get() || false,
  );
  const { isDev, setIsDev } = useUserWalletStore();
  const [keyCounter, setKeyCounter] = useState<number>(0);

  const setVisibility = useCallback(
    (value: boolean) => {
      setIsVisible(value);
      setIsDev(value);
      isDevPanelVisibleLocalStorage.set(value);
    },
    [setIsVisible, setIsDev],
  );

  useEffect(() => {
    window.document.onkeyup = event => {
      if (event.code !== "KeyH") return;
      setKeyCounter(value => value + 1);
      setTimeout(() => setKeyCounter(0), 500);
    };
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.dev = () => setVisibility(!isVisible);
  }, [isVisible, setVisibility]);

  useEffect(() => {
    if (keyCounter !== 3) return;
    setVisibility(!isVisible);
    setKeyCounter(0);
  }, [keyCounter, isVisible, setVisibility]);

  const toggleIsDev = () => {
    setIsDev(!isDev);
  };

  return (
    <div
      className={classNames({
        [classes.panel]: true,
        [classes.visible]: isVisible,
      })}
    >
      <header>debug mode</header>
      <div>
        status: <b>{isDev ? "on" : "off"}</b>
      </div>
      <Button onClick={toggleIsDev}>toggle</Button>
    </div>
  );
};

export default DevPanel;
