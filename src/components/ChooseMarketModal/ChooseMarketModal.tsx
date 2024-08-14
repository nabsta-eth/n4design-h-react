import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useTrade } from "../../context/Trade";
import SelectTradePair from "../SelectTradePair";
import Button from "../Button";
import { useUiStore } from "../../context/UserInterface";
import { TradePairId } from "handle-sdk/dist/components/trade";
import { useCallback } from "react";

type Props = {
  show: boolean;
  onClose: () => void;
  openChart: () => void;
};

const ChooseMarketModal = ({ show, onClose, openChart }: Props) => {
  const { setSelectedPair, selectedTradePair, pairs } = useTrade();
  const { showChooseWalletModal } = useUiStore();

  const changePair = useCallback(
    (tradePairId: TradePairId) => {
      const pair = pairs.find(p => p.id.eq(tradePairId))?.pair;
      if (!pair) {
        console.error(
          `did not find pair by trade id ${tradePairId.toString()}`,
        );
      }
      setSelectedPair(pair ?? selectedTradePair.pair);
    },
    [pairs, selectedTradePair, setSelectedPair],
  );

  const openChartInternal = () => {
    openChart();
    onClose();
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={"choose market"}
      width={400}
      showChooseWalletModal={showChooseWalletModal}
    >
      <form
        noValidate
        autoComplete="off"
        className="uk-align-center uk-flex-1 uk-margin-remove-bottom uk-margin-small-top"
      >
        <fieldset className="uk-fieldset">
          <SelectTradePair
            id="frame-choose-market"
            onChange={changePair}
            value={selectedTradePair.id}
          />

          <Button
            className="uk-width-expand uk-margin-top"
            type="primary"
            onClick={openChartInternal}
          >
            open chart
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
};

export default ChooseMarketModal;
