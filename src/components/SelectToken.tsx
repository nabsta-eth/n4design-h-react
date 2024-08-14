import * as React from "react";
import { Network, TokenInfo, prices } from "handle-sdk";
import { useBalances } from "../context/UserBalances";
import { TokenSymbolToBalance } from "../utils/erc20";
import Select, { Props as SelectProps } from "./Select/Select";
import { bnToDisplayString } from "../utils/format";
import { ethers } from "ethers";
import { useTokenManager, useTokens } from "../context/TokenManager";
import { onTokenImageLoadError } from "../utils/token-data";
import { config } from "../config";
import { useCallback } from "react";
import { bigNumberToFloat, isFxToken } from "../utils/general";
import { isSameAddress } from "handle-sdk/dist/utils/general";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import { SelectOption } from "../types/select";

export type Props<T extends string> = Omit<
  SelectProps<T>,
  "options" | "isSelected"
> & {
  value?: T;
  network: Network;
  options: T[];
  /** Options that appear in the dropdown. */
  displayOptions?: T[];
  showBalance?: boolean;
  customBalances?: TokenSymbolToBalance;
  displayName?: boolean;
  withSearch?: boolean;
  searchPlaceholder?: string;
  market?: boolean;
  maxDisplayOptions?: number;
};

const SelectToken = <T extends string>({
  value,
  options,
  displayOptions,
  network,
  showBalance,
  customBalances,
  withSearch,
  searchPlaceholder,
  displayName,
  onChange,
  maxDisplayOptions,
  market,
  ...rest
}: Props<T>) => {
  const [searchValue, setSearchValue] = React.useState("");
  const tokenList = useTokens(options, network);
  const tokenManager = useTokenManager();
  const walletBalances = useBalances(network);
  const balances = customBalances || walletBalances;
  const connectedAccount = useConnectedAccount();

  const addCustomToken = async (address: string) => {
    const newToken = await prices.coingecko.fetchTokenDetailsFromAddress(
      address,
      network,
    );
    tokenManager.addCustomTokens([newToken]);
  };

  const selectOptions: SelectOption<T>[] = React.useMemo(() => {
    return tokenList
      .filter(token => !token.extensions?.isViewOnly)
      .map(token => {
        const isSpritesheetToken =
          isFxToken(token.symbol) || token.symbol === "FOREX";
        const balance = balances[token.symbol];
        const hidden =
          (searchValue && !fitsSearchQuery(searchValue, token)) ||
          (!searchValue &&
            !!connectedAccount &&
            displayOptions &&
            !displayOptions.includes(token.symbol as T));

        const getBalanceDisplay = () => {
          if (!showBalance || !balance || balance.isZero()) {
            return undefined;
          }
          const smallBalance =
            bigNumberToFloat(balance, token.decimals) < 0.0001;
          if (smallBalance) {
            return "< 0.0001";
          }
          return bnToDisplayString(balance, token.decimals, 4);
        };
        const tokenImageUri = token.logoURI ?? config.tokenIconPlaceholderUrl;
        return {
          item: token.symbol as T,
          icon: {
            type: isSpritesheetToken ? "spritesheet" : "image",
            value: isSpritesheetToken ? token.symbol : tokenImageUri,
          },
          label: `${token.symbol}${displayName ? " " + token.name : ""}`,
          rightLabel: getBalanceDisplay(),
          hidden,
        };
      });
  }, [
    balances,
    displayName,
    displayOptions,
    tokenList,
    searchValue,
    showBalance,
  ]);

  const sortedTokenList = React.useMemo(() => {
    if (searchValue) {
      return selectOptions.sort((a, b) => sortBySearch(a, b, searchValue));
    }
    if (displayOptions?.length) {
      return selectOptions.sort((a, b) =>
        sortByDisplayOptionIndex(a, b, displayOptions),
      );
    }
    return selectOptions;
  }, [displayOptions, searchValue, selectOptions]);

  const search = {
    value: searchValue,
    onChange: async (address: string) => {
      setSearchValue(address);

      const existingFromAddress = tokenList.find(token =>
        isSameAddress(token.address, address),
      );

      if (ethers.utils.isAddress(address) && !existingFromAddress) {
        addCustomToken(address);
      }
    },
    placeholder: searchPlaceholder ?? "",
  };

  const internalOnChange = useCallback((value: T) => {
    setSearchValue("");
    onChange(value);
  }, []);

  const isSelected = useCallback(token => token === value, [value]);

  return (
    <Select
      maxDisplayOptions={maxDisplayOptions}
      options={sortedTokenList || []}
      isSelected={isSelected}
      search={withSearch ? search : undefined}
      onChange={internalOnChange}
      onImageLoadError={onTokenImageLoadError}
      market={market}
      {...rest}
    />
  );
};

export default SelectToken;

const fitsSearchQuery = (query: string, token: TokenInfo) => {
  const queryLower = query.toLowerCase();
  return (
    token.symbol.toLowerCase().includes(queryLower) ||
    token.name.toLowerCase().includes(queryLower) ||
    (query.startsWith("0x") && token.address.toLowerCase().includes(queryLower))
  );
};

const allToLowerCase = (strings: string[]) => strings.map(s => s.toLowerCase());

const sortByDisplayOptionIndex = <T extends string>(
  a: SelectOption<T>,
  b: SelectOption<T>,
  displayOptions: T[],
) => {
  const indexA = allToLowerCase(displayOptions).indexOf(a.item.toLowerCase());
  const indexB = allToLowerCase(displayOptions).indexOf(b.item.toLowerCase());

  if (indexA === -1) {
    return -1;
  }

  return indexA - indexB;
};

const sortBySearch = <T extends string>(
  a: SelectOption<T>,
  b: SelectOption<T>,
  searchQuery: string,
) => {
  const indexA = a.item.toLowerCase().indexOf(searchQuery.toLowerCase());
  const indexB = b.item.toLowerCase().indexOf(searchQuery.toLowerCase());
  const valueIncIxA =
    (indexA === -1 ? 999 : indexA).toString().padStart(3, "0") +
    a.item.toLowerCase();
  const valueIncIxB =
    (indexB === -1 ? 999 : indexB).toString().padStart(3, "0") +
    b.item.toLowerCase();
  return valueIncIxA > valueIncIxB ? 1 : -1;
};
