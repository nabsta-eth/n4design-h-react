import { BigNumber, ethers } from "ethers";
import { PRICE_UNIT } from "../../../utils/trade";

/**
 * This is a utility class that represents a position size and value.
 * This is mostly useful when placing a trade.
 * Note that the value is in units of the LP currency, and that it
 * varies with market price, whereas the position size remains constant.
 * The values must be positive; a boolean should be used (externally)
 * to keep track of whether the position is long or short.
 */
export class PositionSizeValue {
  /// The position size. By itself, it is unitless.
  public readonly size: BigNumber;
  /// The position value, expressed as LPC (LP currency).
  /// This is not necessarily the open value, unless this instance was
  /// created with `fromOpenValue`.
  public readonly valueLpc: BigNumber;

  private constructor(size: BigNumber, valueLpc: BigNumber) {
    if (valueLpc.lt(0)) {
      throw new Error("valueLpc must be positive");
    }
    if (size.lt(0)) {
      throw new Error("size must be positive");
    }
    this.size = size;
    this.valueLpc = valueLpc;
  }

  public static fromSize(size: BigNumber, price: BigNumber): PositionSizeValue {
    const value = positionSizeToValue(size, price);
    return new PositionSizeValue(size, value);
  }

  public static fromOpenValue(
    openValueLpc: BigNumber,
    price: BigNumber,
  ): PositionSizeValue {
    const size = price.isZero()
      ? ethers.constants.Zero
      : positionOpenValueToSize(openValueLpc, price);
    return new PositionSizeValue(size, openValueLpc);
  }

  public static zero(): PositionSizeValue {
    return new PositionSizeValue(ethers.constants.Zero, ethers.constants.Zero);
  }

  public valueLpcSigned(isLong: boolean): BigNumber {
    return isLong ? this.valueLpc : this.valueLpc.mul("-1");
  }

  public sizeSigned(isLong: boolean): BigNumber {
    return isLong ? this.size : this.size.mul("-1");
  }
}

export const positionSizeToValue = (
  size: BigNumber,
  price: BigNumber,
): BigNumber => size.mul(price).div(PRICE_UNIT);

export const positionOpenValueToSize = (
  openValueLpc: BigNumber,
  price: BigNumber,
): BigNumber => openValueLpc.mul(PRICE_UNIT).div(price);
