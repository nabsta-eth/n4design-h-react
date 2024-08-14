import { useEffect, useState } from "react";
import classNames from "classnames";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type Props = {
  secondsToRefresh: number;
  onRefresh: () => void;
  refreshTime?: number;
  className?: string;
};

const RefreshSpinner = ({
  secondsToRefresh,
  onRefresh,
  refreshTime = 1500,
  className,
}: Props) => {
  const [timerDisplay, setTimerDisplay] = useState(secondsToRefresh);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTimerDisplay(time => {
        return Math.max(time - 1, 0);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsToRefresh]);

  useEffect(() => {
    if (timerDisplay === 0 && !isRefreshing) {
      onRefresh();
      setIsRefreshing(true);
      setTimeout(() => {
        setTimerDisplay(secondsToRefresh);
        setIsRefreshing(false);
      }, refreshTime);
    }
  }, [onRefresh, timerDisplay, secondsToRefresh, refreshTime, isRefreshing]);

  return (
    <button
      onClick={() => setTimerDisplay(0)}
      className={classNames(
        "uk-button uk-button-primary hfi-input-button uk-flex uk-flex-between uk-flex-middle",
        className,
      )}
      style={{ width: "50px" }}
      disabled={!timerDisplay}
      type="button"
    >
      <FontAwesomeIcon
        icon={["fal", "sync"]}
        className={timerDisplay ? "" : "fa-spin"}
      />
      <div>{timerDisplay || ""}</div>
    </button>
  );
};

export default RefreshSpinner;
