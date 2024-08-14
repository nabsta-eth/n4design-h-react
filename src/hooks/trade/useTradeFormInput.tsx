import { BigNumber } from "ethers";
import { PositionSizeValue } from "../../components/Trade/TradeForm/PositionSizeValue";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from "react";
import { TradeSizeType } from "handle-sdk/dist/components/trade";
import { LOT_SIZE_MAX_DECIMALS, USD_DISPLAY_DECIMALS } from "../../utils/trade";

export type TradeFormInputSetter = (value: BigNumber, price: BigNumber) => void;

/// If LPC, it is quoted by the LP currency.
/// If lot, user uses the front-end defined position lot size.
/// By default, 1 LOT = 1 Position Size.
export type PositionInputType = TradeSizeType;

/// Hook state for managing position input.
/// If the input is zero, this is null.
/// If the input is not zero, this will always yield values > 0 and not be null.
export type TradeFormInputHook = {
  /// The unsigned position size. Always > 0.
  size: BigNumber;
  /// The unsigned position value. Always > 0.
  valueLpc: BigNumber;
  /// The signed position size: negative if short, positive is long. Always > 0.
  sizeSigned: BigNumber;
  /// The signed position value: negative if short, positive is long. Always > 0.
  valueLpcSigned: BigNumber;
  /// If the user input type is `lpc`, then this is equal to `valueLpc`
  /// Otherwise, this is equal to `size`.
  userInputValue: BigNumber;
  setSize: TradeFormInputSetter;
  setValueLpc: TradeFormInputSetter;
  setUserInputType: Dispatch<SetStateAction<PositionInputType>>;
  userInputType: PositionInputType;
  clear: () => void;
  // the maximum decimals permitted for the input
  decimals: number;
};

type InputState = PositionSizeValue;

type InputAction =
  | {
      type: "setLpcAmount" | "setLotAmount";
      value: BigNumber;
      price: BigNumber;
    }
  | {
      type: "clear";
    };

export const DEFAULT_INPUT_TYPE: PositionInputType = "Lot";

/// Synchronises position size and value using `PositionSizeValue`.
export const useTradeFormInput = (isLong: boolean): TradeFormInputHook => {
  const [input, dispatchInput] = useReducer(
    inputReducer,
    PositionSizeValue.zero(),
  );
  const [userInputType, setUserInputType] =
    useState<PositionInputType>(DEFAULT_INPUT_TYPE);
  const setSize = useCallback((size: BigNumber, price: BigNumber) => {
    dispatchInput({
      type: "setLotAmount",
      value: size,
      price,
    });
  }, []);
  const setValueLpc = useCallback((lpcAmount: BigNumber, price: BigNumber) => {
    dispatchInput({
      type: "setLpcAmount",
      value: lpcAmount,
      price,
    });
  }, []);
  const clear = useCallback(() => {
    dispatchInput({
      type: "clear",
    });
  }, []);
  return useMemo(
    (): TradeFormInputHook => ({
      size: input.size,
      valueLpc: input.valueLpc,
      sizeSigned: input.sizeSigned(isLong),
      valueLpcSigned: input.valueLpcSigned(isLong),
      setSize,
      setValueLpc,
      clear,
      userInputType,
      setUserInputType,
      userInputValue: userInputType == "Lpc" ? input.valueLpc : input.size,
      decimals:
        userInputType == "Lpc" ? USD_DISPLAY_DECIMALS : LOT_SIZE_MAX_DECIMALS,
    }),
    [input, isLong, userInputType],
  );
};

const inputReducer = (_state: InputState, action: InputAction): InputState => {
  switch (action.type) {
    case "setLpcAmount":
      return PositionSizeValue.fromOpenValue(action.value, action.price);
    case "setLotAmount":
      return PositionSizeValue.fromSize(action.value, action.price);
    case "clear":
      return PositionSizeValue.zero();
    default:
      throw new Error("invalid input action type");
  }
};
