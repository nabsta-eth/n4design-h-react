import { useTradeLayoutStore } from "../../context/TradeLayout";
import Button from "../Button";

export const TradeSettings = () => {
  const { resetLayout } = useTradeLayoutStore();

  return (
    <div className="uk-flex uk-flex-middle">
      <Button onClick={resetLayout}>reset layout</Button>
    </div>
  );
};
