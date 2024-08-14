import { TokenEntity } from "../subgraph";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import classNames from "classnames";
import classes from "../Tokens.module.scss";
import {
  bnToCompactDisplayString,
  bnToDisplayString,
  formatNumber,
} from "../../../../utils/format";
import { TokenIcon } from "./TokenIcon";

type TokenTableProps = {
  tokens: TokenEntity[];
  tokenIcons: { [address: string]: string };
};

export const TokenTable = ({ tokens, tokenIcons }: TokenTableProps) => (
  <Table size="xs" className={classNames(classes.noBorder)}>
    <TableBody>
      <TableRow>
        <TableData>&nbsp;</TableData>
        <TableData>name</TableData>
        <TableData>symbol</TableData>
        <TableData>supply</TableData>
        <TableData>hodlers</TableData>
        <TableData>approvals</TableData>
        <TableData>operators</TableData>
        <TableData>administrators</TableData>
      </TableRow>
      {tokens.map(token => (
        <TableRow key={token.address}>
          <TableData>
            <TokenIcon
              tokenAddress={token.address}
              tokenSymbol={token.symbol}
              tokenIconUrl={tokenIcons[token.address]}
            />
          </TableData>
          <TableData>{token.name}</TableData>
          <TableData>{token.symbol}</TableData>
          <TableData>
            <div
              title={bnToDisplayString(
                token.totalSupply,
                token.decimals,
                token.decimals,
              )}
            >
              {bnToCompactDisplayString(token.totalSupply, token.decimals)}
            </div>
          </TableData>
          <TableData>{formatNumber(+token.totalHodlers, 0)}</TableData>
          <TableData>{formatNumber(+token.totalAllowanceTargets, 0)}</TableData>
          <TableData>{formatNumber(token.operators.length, 0)}</TableData>
          <TableData>{formatNumber(token.administrators.length, 0)}</TableData>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
