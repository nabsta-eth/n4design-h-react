import { MinterEntity, TokenEntity } from "../subgraph";
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
  minters: MinterEntity[];
  token: TokenEntity;
  tokenIcons: { [address: string]: string };
};

export const MintersTable = ({
  minters,
  tokenIcons,
  token,
}: TokenTableProps) => (
  <Table size="xs" className={classNames(classes.noBorder)}>
    <TableBody>
      <TableRow>
        <TableData>&nbsp;</TableData>
        <TableData>minter position</TableData>
        <TableData>address</TableData>
        <TableData>minted</TableData>
        <TableData>burned</TableData>
        <TableData>net supply</TableData>
      </TableRow>
      {minters.map(
        (minter, i) =>
          (minter.totalMinted.gt(0) || minter.totalBurned.gt(0)) && (
            <MinterRow
              key={minter.id}
              minter={minter}
              token={token}
              tokenIconUrl={tokenIcons[token.address]}
              topNumber={i + 1}
            />
          ),
      )}
    </TableBody>
  </Table>
);

type MinterRowProps = {
  minter: MinterEntity;
  token: TokenEntity;
  tokenIconUrl: string;
  topNumber: number;
};

const MinterRow = ({
  minter,
  token,
  tokenIconUrl,
  topNumber,
}: MinterRowProps) => (
  <TableRow>
    <TokenIcon
      tokenAddress={token.address}
      tokenSymbol={token.symbol}
      tokenIconUrl={tokenIconUrl}
    />
    <TableData>top #{topNumber}</TableData>
    <TableData>
      <a
        href={getExplorerUrl(minter.address, "address", NETWORK)}
        target={"_blank"}
        rel="noreferrer noopener"
      >
        <span>
          {findContractAddressAlias(minter.address) || minter.address}
        </span>
      </a>
    </TableData>
    <TableData>
      <div
        title={bnToDisplayString(
          minter.totalMinted,
          token.decimals,
          token.decimals,
        )}
      >
        +{bnToCompactDisplayString(minter.totalMinted, token.decimals)}
      </div>
    </TableData>
    <TableData>
      <div
        title={bnToDisplayString(
          minter.totalBurned,
          token.decimals,
          token.decimals,
        )}
      >
        -{bnToCompactDisplayString(minter.totalBurned, token.decimals)}
      </div>
    </TableData>
    <TableData>
      <div
        title={bnToDisplayString(
          minter.totalMinted.sub(minter.totalBurned),
          token.decimals,
          token.decimals,
        )}
      >
        {bnToCompactDisplayString(
          minter.totalMinted.sub(minter.totalBurned),
          token.decimals,
        )}
      </div>
    </TableData>
  </TableRow>
);
