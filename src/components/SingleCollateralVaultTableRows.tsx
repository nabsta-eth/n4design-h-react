import * as React from "react";
import {
  SingleCollateralVaultNetwork,
  SingleCollateralVaultSymbol,
} from "handle-sdk";
import { displayDollarsAndCents } from "../utils/format";
import {
  TableRow,
  TableData,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import "../assets/styles/vaultdetails.scss";
import { useSingleCollateralVault } from "../context/Vaults";
import { useTokens } from "../context/TokenManager";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { useAccount } from "../context/Account";
import { config } from "../config";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

type Props = {
  vaultSymbol: SingleCollateralVaultSymbol;
  network: SingleCollateralVaultNetwork;
};

const SingleCollateralVaultTableRows: React.FC<Props> = ({
  vaultSymbol,
  network,
}) => {
  const account = useAccount();

  const [vault] = useSingleCollateralVault({
    vaultSymbol,
    network,
    fetch: true,
  });

  const fxToken: string = vaultSymbol.split("-")[0];

  const fxTokensExtended = useTokens([fxToken], network);

  const manageButtonText =
    vault?.debt.isZero() && vault.collateralAsEth.isZero()
      ? "create"
      : "manage";

  return (
    <TableRow>
      <TableData>
        {fxTokensExtended.find(fxt => fxt.symbol === fxToken) && (
          <SpritesheetIcon
            iconName={fxToken}
            sizePx={22}
            style={{ marginTop: 0, marginBottom: -7 }}
            className="uk-margin-xsmall-right"
            fallbackSrc={config.tokenIconPlaceholderUrl}
          />
        )}
        {vaultSymbol}
      </TableData>

      <TableData textAlign="right">
        {vault ? displayDollarsAndCents(vault.debt, 18) : "loading..."}
      </TableData>

      <TableData textAlign="right">
        {vault
          ? displayDollarsAndCents(vault.debt.add(vault.availableToMint), 18)
          : "loading..."}
      </TableData>

      <TableData textAlign="right">
        {vault
          ? displayDollarsAndCents(vault.availableToMint, 18)
          : "loading..."}
      </TableData>

      <TableData
        textAlign="right"
        className={
          vault?.debt.gt(0) && vault?.availableToMint.lt(0)
            ? "hfi-warning-cell"
            : ""
        }
      >
        {vault
          ? displayDollarsAndCents(vault.collateralRatio.mul("100"), 18)
          : "loading..."}
        %
      </TableData>

      <TableData textAlign="right">
        {vault ? displayDollarsAndCents(vault.utilisation, 18) : "loading..."}%
      </TableData>

      <TableData textAlign="center">
        <Button
          className={"hfi-vaults-manage-button"}
          size="xsmall"
          to={`/vaults/single/polygon/fxAUD-WETH/${account}`}
        >
          {manageButtonText}
        </Button>
      </TableData>
    </TableRow>
  );
};

export default SingleCollateralVaultTableRows;
