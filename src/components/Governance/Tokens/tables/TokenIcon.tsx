import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { getExplorerUrl } from "../../../../utils/general";
import { NETWORK } from "../Tokens";
import { config } from "../../../../config";

export type TokenIconProps = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenIconUrl: string;
};

export const TokenIcon = ({
  tokenAddress,
  tokenSymbol,
  tokenIconUrl,
}: TokenIconProps) => (
  <a
    href={getExplorerUrl(tokenAddress, "token", NETWORK)}
    target={"_blank"}
    rel="noreferrer noopener"
  >
    <SpritesheetIcon
      iconName={tokenSymbol}
      sizePx={45}
      style={{ marginTop: 0 }}
      fallbackSrc={config.tokenIconPlaceholderUrl}
    />
  </a>
);
