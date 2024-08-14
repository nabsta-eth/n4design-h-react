import { HodlerEntity, TokenEntity } from "../subgraph";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import classNames from "classnames";
import classes from "../Tokens.module.scss";
import * as React from "react";
import {
  bnToCompactDisplayString,
  bnToDisplayString,
} from "../../../../utils/format";
import { getExplorerUrl } from "../../../../utils/general";
import { NETWORK } from "../Tokens";
import { TokenIcon } from "./TokenIcon";
import { findContractAddressAlias } from "../findContractAddressAlias";

type TokenTableProps = {
  hodlers: HodlerEntity[];
  token: TokenEntity;
  tokenIcons: { [address: string]: string };
};

export const HodlersTable = ({
  hodlers,
  tokenIcons,
  token,
}: TokenTableProps) => (
  <Table size="xs" className={classNames(classes.noBorder)}>
    <TableBody>
      <TableRow>
        <TableData>&nbsp;</TableData>
        <TableData>hodler position</TableData>
        <TableData>address</TableData>
        <TableData>balance</TableData>
      </TableRow>
      {hodlers.map(
        (hodler, i) =>
          hodler.balance.gt(0) && (
            <HodlerRow
              key={hodler.id}
              hodler={hodler}
              token={token}
              tokenIconUrl={tokenIcons[token.address]}
              topNumber={i + 1}
            />
          ),
      )}
    </TableBody>
  </Table>
);

type HodlerRowProps = {
  hodler: HodlerEntity;
  token: TokenEntity;
  tokenIconUrl: string;
  topNumber: number;
};

const HodlerRow = ({
  hodler,
  token,
  tokenIconUrl,
  topNumber,
}: HodlerRowProps) => (
  <TableRow>
    <TokenIcon
      tokenAddress={token.address}
      tokenSymbol={token.symbol}
      tokenIconUrl={tokenIconUrl}
    />
    <TableData>top #{topNumber}</TableData>
    <TableData>
      <a
        href={getExplorerUrl(hodler.address, "address", NETWORK)}
        target={"_blank"}
        rel="noreferrer noopener"
      >
        <span>
          {findContractAddressAlias(hodler.address) ?? hodler.address}
        </span>
      </a>
    </TableData>
    <TableData>
      <div
        title={bnToDisplayString(
          hodler.balance,
          token.decimals,
          token.decimals,
        )}
      >
        {bnToCompactDisplayString(hodler.balance, token.decimals)}
      </div>
    </TableData>
  </TableRow>
);
