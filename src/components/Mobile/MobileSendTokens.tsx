import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import SendTokens from "../SendTokens/SendTokens";
import useQueryString from "../../hooks/useQueryString";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import classNames from "classnames";
import classes from "./MobileSendTokens.module.scss";
import { useNavigate } from "react-router-dom";
import { config } from "../../config";
import { useToken } from "../../context/TokenManager";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Network } from "handle-sdk";
import { useUserBalancesWithPrices } from "../../hooks/useUserBalancesWithPrices";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

const DEFAULT_NETWORK: Network = "arbitrum";

const MobileSendTokens: React.FC = () => {
  const sendTokenQuery = useQueryString().get("sendToken");
  const connectedNetwork = useConnectedNetwork() ?? "arbitrum";
  const token = useToken(sendTokenQuery ?? "ETH", connectedNetwork);
  const network = connectedNetwork || DEFAULT_NETWORK;
  const { tokens } = useUserBalancesWithPrices({
    network,
  });
  const tokenWithBalanceAndPrice = tokens.find(t => t.symbol === token?.symbol);
  const navigate = useNavigate();

  if (!token) {
    console.warn(`Token ${sendTokenQuery} not found`);
    return null;
  }

  return (
    <React.Fragment>
      <div
        id="send-tokens-header"
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.sendTokensHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="send-tokens-back-button uk-margin-small-right"
          onClick={() => navigate(-1)}
        />
        <h4 className="uk-margin-remove-vertical">
          send
          <SpritesheetIcon
            iconName={token.symbol}
            sizePx={22}
            style={{ marginTop: 0 }}
            className="uk-margin-small-left uk-margin-xsmall-right"
            fallbackSrc={token.logoURI ?? config.tokenIconPlaceholderUrl}
          />
          {sendTokenQuery}
        </h4>
      </div>

      <Container
        size="large"
        className={classNames("uk-margin-small-top", classes.sendTokenWrapper)}
      >
        {sendTokenQuery && tokenWithBalanceAndPrice && (
          <SendTokens
            token={tokenWithBalanceAndPrice}
            network={connectedNetwork}
            onClose={() => navigate(-1)}
          />
        )}
      </Container>
    </React.Fragment>
  );
};

export default MobileSendTokens;
