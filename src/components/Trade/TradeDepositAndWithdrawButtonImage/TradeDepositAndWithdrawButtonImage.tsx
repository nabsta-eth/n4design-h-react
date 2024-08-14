import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { TokenInfo } from "handle-sdk";
import { config } from "../../../config";

export const TradeDepositAndWithdrawButtonImage = ({
  token,
}: {
  token: TokenInfo;
}) => {
  return (
    <SpritesheetIcon
      sizePx={20}
      style={{ marginTop: 0 }}
      className="uk-margin-xsmall-left uk-margin-xsmall-right"
      iconName={token.symbol}
      fallbackSrc={token.logoURI ?? config.tokenIconPlaceholderUrl}
    />
  );
};
