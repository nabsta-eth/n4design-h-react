import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../context/Account";
import { useVaults } from "../../context/Vaults";
import { displayDollarsAndCents } from "../../utils/format";
import {
  Table,
  TableHead,
  TableHeadData,
  TableBody,
  TableRow,
  TableData,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import "./vaultlist.scss";
import { Network, Vault } from "handle-sdk";
import { config } from "../../config";
import classNames from "classnames";
import { useTokens } from "../../context/TokenManager";
import { bigNumberToFloat, digits } from "../../utils/general";
import classes from "./VaultList.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { useSelectedOrConnectedAccount } from "../../hooks/useSelectedOrConnectedAccount";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import { useLanguageStore } from "../../context/Translation";
import { ButtonSmart } from "..";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

const DEFAULT_NETWORK: Network = "arbitrum";

type Props = {
  show: boolean;
};

const VaultList: React.FC<Props> = ({ show }: Props) => {
  const [vaults] = useVaults({ fetch: false });
  const account = useSelectedOrConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const network = connectedNetwork ?? DEFAULT_NETWORK;
  const { activeTheme, isModernTheme } = useUiStore();
  const { t } = useLanguageStore();

  const sortedVaults = vaults.sort((a, b) => {
    if (a.debt.gt(b.debt)) {
      return -1;
    }

    if (a.debt.lt(b.debt)) {
      return 1;
    }

    return 0;
  });

  const renderTableBody = () => {
    if (!account) {
      return (
        <TableRow className={classes.transparent}>
          <TableData colSpan={6} className="uk-text-center">
            <div className="uk-flex uk-flex-column uk-flex-middle uk-margin-small-top uk-margin-small-bottom">
              <ButtonSmart
                className={classes.connectButton}
                size="small"
                network={network}
              />
            </div>
          </TableData>
        </TableRow>
      );
    } else if (vaults.length === 0) {
      return (
        <TableRow>
          <TableData colSpan={6} className="uk-text-center">
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </TableData>
        </TableRow>
      );
    } else {
      return sortedVaults.map((vault, ix) =>
        vault ? (
          <TableRow
            key={vault.fxToken.symbol}
            className={classNames({
              last: ix === sortedVaults.length - 1,
            })}
          >
            <VaultRow vault={vault} last={ix === sortedVaults.length - 1} />
          </TableRow>
        ) : null,
      );
    }
  };

  return (
    <div hidden={!show}>
      <Table
        id="vaults"
        responsive
        size="xs"
        divider
        className={"uk-margin-remove-bottom"}
      >
        <TableHead className={"hfi-vaults-table-header hfi-border-top-remove"}>
          <TableRow className={"hfi-vaults-header-row"}>
            <TableHeadData
              shrink
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {t.vault}
            </TableHeadData>
            <TableHeadData
              textAlign="right"
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {t.current}
            </TableHeadData>
            <TableHeadData
              textAlign="right"
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {t.limit}
            </TableHeadData>
            <TableHeadData
              textAlign="right"
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {t.available}
            </TableHeadData>
            <TableHeadData
              textAlign="right"
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {`${t.current} CR`}
            </TableHeadData>
            <TableHeadData
              textAlign="right"
              className={classNames({
                [classes.headerDataDash]: isModernTheme && !account,
              })}
            >
              {t.util}
            </TableHeadData>
          </TableRow>
        </TableHead>
        <TableBody>{renderTableBody()}</TableBody>
      </Table>
    </div>
  );
};

type VaultRowProps = {
  vault: Vault;
  last: boolean;
};

const VaultRow: React.FC<VaultRowProps> = ({ vault, last }) => {
  const navigate = useNavigate();
  const account = useAccount();
  const [vaults] = useVaults({ fetch: false });
  const fxTokensExtended = useTokens(
    vaults.map(vault => vault.fxToken.symbol),
    DEFAULT_NETWORK,
  );

  const manageButtonText =
    vault.debt.isZero() && vault.collateralAsEth.isZero() ? "create" : "manage";

  const getDebtLimitDisplay = () => {
    if (vault.availableToMint.gt(0) || vault.utilisation.eq(0))
      return displayDollarsAndCents(vault.debt.add(vault.availableToMint));

    const debtLimit =
      (bigNumberToFloat(vault.debt) / bigNumberToFloat(vault.utilisation)) *
      100;
    return debtLimit.toLocaleString(undefined, digits(2));
  };

  const fxToken = fxTokensExtended.find(
    fxt => fxt.symbol === vault.fxToken.symbol,
  );

  const isVaultBelowMinCr =
    vault?.debt.gt(0) && vault?.collateralRatio.lte(vault?.minimumMintingRatio);

  return (
    <React.Fragment>
      <TableData
        label="vault"
        width="small"
        className={classNames({
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        <span
          data-uk-tooltip={`title: ${vault.fxToken.symbol} multi-collateral vault; pos: right;`}
          className="cursor-pointer"
        >
          <SpritesheetIcon
            iconName={vault.fxToken.symbol}
            sizePx={22}
            style={{ marginTop: 0, marginBottom: -7 }}
            className="uk-margin-xsmall-right"
            fallbackSrc={fxToken?.logoURI ?? config.tokenIconPlaceholderUrl}
          />
          {vault.fxToken.symbol}
        </span>
      </TableData>

      <TableData
        label="current"
        textAlign="right"
        className={classNames({
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        {displayDollarsAndCents(vault.debt, 18)}
      </TableData>

      <TableData
        label="limit"
        textAlign="right"
        className={classNames({
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        {getDebtLimitDisplay()}
      </TableData>

      <TableData
        label="available"
        textAlign="right"
        className={classNames({
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        {displayDollarsAndCents(vault.availableToMint, 18)}
      </TableData>

      <TableData
        label="current collateral ratio"
        textAlign="right"
        className={classNames({
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        {displayDollarsAndCents(vault.collateralRatio.mul("100"), 18)}%
      </TableData>

      <TableData
        label="utilisation"
        textAlign="right"
        className={classNames("padding-bottom<m", {
          [classes.warning]: isVaultBelowMinCr,
        })}
      >
        {displayDollarsAndCents(vault.utilisation, 18)}%
      </TableData>

      <TableData className="uk-flex uk-flex-middle uk-flex-right">
        <Button
          type="secondary"
          color={isVaultBelowMinCr ? "warning" : undefined}
          className={classes.actionButton}
          size="xsmall"
          tooltip={{
            text: `${vault?.debt.gt(0) ? "manage vault" : "create vault"}`,
            position: "right",
          }}
          onClick={() => {
            navigate(`/vaults/multi/${vault.fxToken.symbol}/${account}`);
          }}
        >
          {manageButtonText}
        </Button>
      </TableData>
    </React.Fragment>
  );
};

export default VaultList;
