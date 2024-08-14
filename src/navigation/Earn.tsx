import * as React from "react";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import { useAccount } from "../context/Account";
import { useEarnStore } from "../context/Earn";
import {
  useFxTokensUsdPrice,
  useNativeTokenPrice,
  usePricesStore,
  useTokenUsdPrice,
} from "../context/Prices";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import useSetAccount from "../hooks/useSetAccount";
import {
  EarnTableData,
  getGovernancePoolEarnTableRowData,
  getKeeperPoolEarnTableRowsData,
  getLpStakingDataEarnTableRowData,
  GOVERNANCE_POOL_TITLE,
} from "../utils/earn";
import {
  GovernancePool,
  KeeperPool,
  LPStakingPool as LPPool,
  PageTitle,
  Loader,
  Tabs,
} from "../components";
import {
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeadData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import { PLATFORM_NAME_TO_LOGO_URL } from "../config/constants";
import "../assets/styles/earn.scss";
import { useToken } from "../context/TokenManager";
import { config } from "../config";
import classNames from "classnames";
import { MediaQueries, useMediaQueries } from "../hooks/useMediaQueries";
import Metatags from "../components/Metatags";
import { getUkTooltip } from "../utils/general";
import { numberifyWithRanges } from "../utils/format";
import classes from "../components/Earn/Earn.module.scss";
import onChangeSort, { sortIcon, Sorting } from "../utils/sort";
import { useStakedHlpData } from "../hooks/useStakedHlpData";
import StakedHlpPool from "../components/StakedHlpPool";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { useSperaxData } from "../utils/earn/sperax";
import RetiredGovernanceLockWithdraw from "../components/RetiredGovernanceLockWithdraw";
import * as sdk from "handle-sdk";
import { useFraxCurvePoolData } from "../hooks/useFraxCurvePool";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";

export const EARN_CATEGORIES = ["governance", "liquidity", "fxKeeper"] as const;
export type EarnCategory = (typeof EARN_CATEGORIES)[number];

export type EarnTableRow = EarnTableData & {
  component: JSX.Element | null;
  category: EarnCategory;
  active: boolean;
};

export type EarnTableRows = {
  rows: EarnTableRow[] | null;
  category: EarnCategory;
};

const NUMBER_OF_COLUMNS = 7;
const BALANCER_POOL_LINK =
  "https://app.balancer.fi/#/arbitrum/pool/0x4f14d06cb1661ce1dc2a2f26a10a7cd94393b29c000200000000000000000097";

/// returns an array of rows with the corresponding category, or null if one of
/// the specified categories has null rows (which indicates loading)
const getCategoryRows = (category: string, ...rows: EarnTableRows[]) => {
  const matches = [];
  for (const row of rows) {
    if (category !== row.category) continue;
    if (row.rows === null) return null;
    matches.push(...row.rows);
  }
  return matches;
};

const EarnPage: React.FC = () => {
  useSetAccount();
  const {
    fetchFxKeeperPools,
    fetchGovernanceLockData,
    fetchRewardPoolData,
    fetchRewardPools,
    fetchLpStakingPools,
    lpStakingPools,
    fxKeeperPools,
    rewardPoolData,
    rewardPools,
    governanceLockData,
  } = useEarnStore();
  const { activeTheme } = useUiStore();
  const shlpData = useStakedHlpData(hlp.config.DEFAULT_HLP_NETWORK);
  const { userStoreInitialising } = useUserWalletStore();
  const account = useAccount();
  const [selectedPoolTitle, setSelectedPoolTitle] = React.useState<string>();
  const [category, setCategory] = React.useState<EarnCategory>("governance");

  React.useEffect(() => {
    if (userStoreInitialising) {
      return;
    }
    fetchFxKeeperPools(account);
    fetchGovernanceLockData(account);
    fetchRewardPoolData(account);
    fetchLpStakingPools(account);
    fetchRewardPools();
  }, [
    account,
    userStoreInitialising,
    fetchRewardPools,
    fetchFxKeeperPools,
    fetchGovernanceLockData,
    fetchRewardPoolData,
    fetchLpStakingPools,
  ]);

  const forexPriceUsd = useTokenUsdPrice({
    tokenSymbol: "FOREX",
    fetch: false,
  });
  const fxTokensUsd = useFxTokensUsdPrice({ fetch: true });
  const ethPrice = useNativeTokenPrice("ethereum");
  const { tokenUsdPrices } = usePricesStore();
  const balancerLpPriceUsd =
    tokenUsdPrices[sdk.config.lp.arbitrum.balancerFxUsdForex.lpToken.symbol];
  const mediaQueries = useMediaQueries();

  const governanceLockRow: EarnTableRows = React.useMemo(() => {
    if (
      !governanceLockData ||
      !rewardPoolData ||
      !rewardPools ||
      !forexPriceUsd ||
      !balancerLpPriceUsd
    ) {
      return {
        rows: null,
        category: "governance" as const,
      };
    }
    const data = getGovernancePoolEarnTableRowData(
      rewardPoolData,
      rewardPools.governanceLock,
      governanceLockData,
      forexPriceUsd || 0,
      balancerLpPriceUsd,
    );
    return {
      rows: [
        {
          ...data,
          component: <GovernancePool data={data} />,
          category: "governance" as const,
          active: true,
          link: BALANCER_POOL_LINK,
        },
      ],
      category: "governance" as const,
    };
  }, [governanceLockData, rewardPoolData, rewardPools, forexPriceUsd]);

  const keeperPoolRows: EarnTableRows = React.useMemo(() => {
    if (!fxKeeperPools || !rewardPoolData || !fxTokensUsd || !forexPriceUsd) {
      return {
        category: "fxKeeper" as const,
        rows: null,
      };
    }
    const rows = getKeeperPoolEarnTableRowsData(
      fxKeeperPools,
      rewardPoolData,
      fxTokensUsd,
      forexPriceUsd,
    ).map((row, index) => ({
      ...row,
      component: (
        <KeeperPool fxTokenSymbol={fxKeeperPools[index].fxToken} data={row} />
      ),
      category: "fxKeeper" as const,
      active: true,
    }));
    return {
      category: "fxKeeper" as const,
      rows,
    };
  }, [fxKeeperPools, rewardPoolData, fxTokensUsd, forexPriceUsd]);

  const lpStakingRows: EarnTableRows = React.useMemo(() => {
    if (!lpStakingPools || !fxTokensUsd || !forexPriceUsd || !ethPrice) {
      return {
        category: "liquidity" as const,
        rows: null,
      };
    }
    const rows = getLpStakingDataEarnTableRowData(
      lpStakingPools,
      forexPriceUsd,
      fxTokensUsd,
      ethPrice,
    ).map((row, index) => ({
      ...row,
      component: <LPPool pool={lpStakingPools[index]} />,
      category: "liquidity" as const,
      active: lpStakingPools[index].name !== "sushiWethForex",
    }));
    return {
      rows,
      category: "liquidity" as const,
    };
  }, [lpStakingPools, fxTokensUsd, forexPriceUsd, ethPrice]);

  const speraxData = useSperaxData();
  const speraxDemeterRow: EarnTableRows = React.useMemo(() => {
    return {
      rows: [
        {
          ...speraxData,
          active: true,
          category: "liquidity" as const,
          component: null,
        },
      ],
      category: "liquidity" as const,
    };
  }, [speraxData]);
  const hlpRow: EarnTableRows = React.useMemo(() => {
    if (!shlpData) {
      return {
        rows: null,
        category: "liquidity" as const,
      };
    }
    return {
      rows: [
        {
          ...shlpData,
          active: true,
          category: "liquidity" as const,
          component: <StakedHlpPool data={shlpData} />,
        },
      ],
      category: "liquidity" as const,
    };
  }, [shlpData]);

  const fraxRow = useFraxCurvePoolData();

  const allRows = getCategoryRows(
    category,
    governanceLockRow,
    keeperPoolRows,
    lpStakingRows,
    speraxDemeterRow,
    hlpRow,
    { rows: [fraxRow], category: fraxRow.category },
  );

  const activePools: EarnTableRow[] | undefined = allRows?.filter(
    row => row.active,
  );

  const inactivePools: EarnTableRow[] | undefined = allRows?.filter(
    row => !row.active,
  );

  const [sort, onSetSort] = React.useState<Sorting>({
    by: "tvlInUSD",
    direction: "desc",
  });

  const sortBy = sort.by === "apy" ? "estApr" : sort.by;

  const activePoolsToDisplay = React.useMemo(() => {
    const sortedActivePools = activePools?.sort((a: any, b: any) => {
      const aValue =
        typeof a[sortBy] === "string" ? numberifyWithRanges(a[sortBy]) : 0;
      const bValue =
        typeof b[sortBy] === "string" ? numberifyWithRanges(b[sortBy]) : 0;
      return sort.direction === "desc" ? bValue - aValue : aValue - bValue;
    });
    return sortedActivePools;
  }, [activePools, sort.direction, sortBy]);

  const inactivePoolsToDisplay = React.useMemo(() => {
    const sortedInactivePools = inactivePools?.sort((a: any, b: any) => {
      const aValue =
        typeof a[sortBy] === "string" ? numberifyWithRanges(a[sortBy]) : 0;
      const bValue =
        typeof b[sortBy] === "string" ? numberifyWithRanges(b[sortBy]) : 0;
      return sort.direction === "desc" ? bValue - aValue : aValue - bValue;
    });
    return sortedInactivePools;
  }, [inactivePools, sort.direction, sortBy]);

  const onPoolRowClick = (row: EarnTableRow) => {
    if (row.comingSoon || row.title === selectedPoolTitle) {
      setSelectedPoolTitle(undefined);
    } else {
      setSelectedPoolTitle(row.title);
    }
  };

  const _onChangeSortInternal = (by: Sorting["by"]) => {
    onChangeSort(sort, by, onSetSort);
  };

  const sortTooltip = (by: string) => {
    let sortName = "est. APR";
    if (by === "tvlInUSD") sortName = "TVL";
    const sortString = `${by === sort.by ? "" : " by " + sortName}`;
    return getUkTooltip({
      title: `${by === sort.by ? "reverse " : ""}sort${sortString}`,
      position: "right",
    });
  };

  const inactiveRowsForCategory =
    inactivePoolsToDisplay &&
    inactivePoolsToDisplay.filter(row => row.category === category).length > 0;

  return (
    <React.Fragment>
      <Metatags
        function="earn"
        description="stake tokens to provide liquidity and earn fees &amp; rewards"
      />

      <Container id="earn" size="small">
        <React.Fragment>
          <PageTitle
            text="earn"
            className="uk-flex uk-flex-between uk-flex-middle"
            sticky={mediaQueries.maxMobile}
          ></PageTitle>

          <div
            className={classNames("uk-select-group uk-flex", classes.earnTabs)}
          >
            <Tabs
              tabs={EARN_CATEGORIES}
              active={category}
              onClick={setCategory}
              tabsClassName="uk-margin-remove"
            />
          </div>

          <RetiredGovernanceLockWithdraw />

          <Table size="xs" className="uk-margin-small-top uk-table-divider">
            <TableHead>
              <TableRow>
                <TableHeadData>
                  <span className="uk-margin-small-left">pool</span>
                </TableHeadData>
                <TableHeadData textAlign="center">network</TableHeadData>
                <TableHeadData textAlign="right">
                  est. APR
                  <FontAwesomeIcon
                    onClick={() => _onChangeSortInternal("apy")}
                    uk-tooltip={sortTooltip("apy")}
                    icon={["far", sortIcon(sort, "apy")]}
                    className="uk-margin-xsmall-left"
                  />
                </TableHeadData>
                <TableHeadData textAlign="right">
                  TVL
                  <FontAwesomeIcon
                    onClick={() => _onChangeSortInternal("tvlInUSD")}
                    uk-tooltip={sortTooltip("tvlInUSD")}
                    icon={["far", sortIcon(sort, "tvlInUSD")]}
                    className="uk-margin-xsmall-left"
                  />
                </TableHeadData>
                <TableHeadData textAlign="center">rewards</TableHeadData>
                <TableHeadData>
                  <></>
                </TableHeadData>
                <TableHeadData>
                  <></>
                </TableHeadData>
              </TableRow>
            </TableHead>

            <TableBody>
              {activePoolsToDisplay &&
                activePoolsToDisplay
                  .filter(p => p.category === category)
                  .map((row, ix) => {
                    const notLastRow =
                      ix < activePoolsToDisplay.length - 1 ||
                      !inactivePools ||
                      inactivePools.length > 0;
                    const lastActiveRow =
                      ix === activePoolsToDisplay.length - 1;
                    return (
                      <PoolRow
                        key={row.title}
                        row={row}
                        category={category}
                        selectedPoolTitle={
                          row.title === GOVERNANCE_POOL_TITLE
                            ? GOVERNANCE_POOL_TITLE
                            : selectedPoolTitle
                        }
                        mediaQueries={mediaQueries}
                        onPoolRowClick={onPoolRowClick}
                        notLastRow={notLastRow}
                        lastActiveRow={lastActiveRow}
                      />
                    );
                  })}

              {inactiveRowsForCategory && (
                <TableRow className="dummy-row inactive-pools-header">
                  <TableData colSpan={NUMBER_OF_COLUMNS}>
                    inactive pools
                  </TableData>
                </TableRow>
              )}

              {inactiveRowsForCategory &&
                inactivePoolsToDisplay.map((row, ix) => {
                  const notLastRow = ix < inactivePoolsToDisplay.length - 1;
                  return (
                    <PoolRow
                      key={row.title}
                      row={row}
                      category={category}
                      selectedPoolTitle={selectedPoolTitle}
                      mediaQueries={mediaQueries}
                      onPoolRowClick={onPoolRowClick}
                      notLastRow={notLastRow}
                    />
                  );
                })}
            </TableBody>
          </Table>
        </React.Fragment>

        {!activePoolsToDisplay && (
          <div className="uk-flex uk-flex-center uk-flex-middle uk-width-expand">
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </div>
        )}

        {activePoolsToDisplay?.length === 0 && (
          <div className="uk-flex uk-flex-center uk-width-expand">
            <span>no pools for the selection</span>
          </div>
        )}
      </Container>
    </React.Fragment>
  );
};

type PoolRowProps = {
  row: EarnTableRow;
  category: EarnCategory;
  selectedPoolTitle: string | undefined;
  mediaQueries: MediaQueries;
  onPoolRowClick: (row: EarnTableRow) => void;
  notLastRow: boolean;
  lastActiveRow?: boolean;
};

const PoolRow: React.FC<PoolRowProps> = props => {
  const {
    row,
    category,
    selectedPoolTitle,
    onPoolRowClick,
    mediaQueries,
    lastActiveRow,
  } = props;
  const externalOnly = !row.component;
  const isSelected = row.title === selectedPoolTitle;

  const splitRowTitle = row.title.split(" ");
  const fxToken =
    category === "fxKeeper" ? splitRowTitle[splitRowTitle.length - 1] : "";

  const poolAprTooltipExtension =
    category === "fxKeeper"
      ? " depositors also earn additional vault liquidation gains."
      : "";

  const poolAprTooltip =
    row.category === "governance" ||
    row.category === "fxKeeper" ||
    (row.category === "liquidity" && row.platform === "handle")
      ? `title: est. APR range.<br />varies based on user's veFOREX balance.${poolAprTooltipExtension}; pos: bottom-right;`
      : undefined;

  const onClickRow = () => {
    if (externalOnly) {
      if (!row.link) throw new Error("External only rows must have link");
      return window.open(row.link);
    }
    if (!row.comingSoon) {
      onPoolRowClick(row);
    }
  };

  return (
    <React.Fragment key={row.title}>
      <TableRow
        className={classNames("body-row", {
          "uk-active": !row.comingSoon && isSelected,
          [classes.inactive]: !row.active,
          [classes.active]: isSelected,
          [classes.lastActiveRow]: lastActiveRow,
        })}
        onClick={onClickRow}
      >
        <TableData
          textAlign="left"
          className={classNames("uk-flex uk-flex-between", classes.earnRow, {
            [classes.maxMobile]: mediaQueries.maxMobile,
          })}
        >
          <span className="uk-flex uk-flex-middle">
            {category === "fxKeeper" && (
              <SpritesheetIcon
                iconName={fxToken}
                sizePx={24}
                style={{ marginTop: 0 }}
                className={classNames("uk-margin-small-right", {
                  "uk-margin-xsmall-left": mediaQueries.minMobile,
                })}
                fallbackSrc={config.tokenIconPlaceholderUrl}
              />
            )}
            {category !== "fxKeeper" && (
              <Image
                src={PLATFORM_NAME_TO_LOGO_URL[row.platform]}
                alt={row.platform}
                width="24"
                className={classNames("uk-margin-small-right", {
                  "uk-margin-xsmall-left": mediaQueries.minMobile,
                })}
              />
            )}
            <span>{row.title}</span>
            {row.link && mediaQueries.maxMobile && (
              <span className="uk-margin-small-left">
                <FontAwesomeIcon
                  onClick={() => {
                    window.open(row.link, "_blank")?.focus();
                  }}
                  icon={["far", "external-link"]}
                />
              </span>
            )}
          </span>

          {mediaQueries.maxMobile && (
            <span className="uk-margin-small-right">
              <FontAwesomeIcon
                icon={["far", isSelected ? "chevron-up" : "chevron-down"]}
              />
            </span>
          )}
        </TableData>

        <TableData
          label="network"
          className={classes.networkLabel}
          textAlign={mediaQueries.maxMobile ? "right" : "center"}
        >
          <Image
            src={NETWORK_NAME_TO_LOGO_URL[row.network]}
            alt={row.network}
            width="24"
          />
        </TableData>

        {row.comingSoon ? (
          <TableData label="status" textAlign="center" colSpan={5}>
            coming soon
          </TableData>
        ) : (
          <React.Fragment>
            <TableData label="APR" textAlign="right">
              <span uk-tooltip={poolAprTooltip}>
                <span className="uk-tooltip-content">{row.estApr}</span>
              </span>
            </TableData>

            <TableData
              label="TVL"
              textAlign="right"
              className={classNames(classes.tvlCell)}
            >
              {row.tvlInUSD !== undefined && `${row.tvlInUSD}`}
            </TableData>
          </React.Fragment>
        )}

        {!row.comingSoon && (
          <React.Fragment>
            <TableData
              label="rewards"
              className={classNames(classes.rewards)}
              textAlign={mediaQueries.maxMobile ? "right" : "center"}
            >
              <SpritesheetIcon
                iconName={"FOREX"}
                sizePx={24}
                className={classNames(
                  "uk-position-relative hfi-token-overlap",
                  classes.rewardsImg,
                  {
                    [classes.nonKeeperPoolRewardsImg]:
                      row.category !== "fxKeeper",
                  },
                )}
                fallbackSrc={config.tokenIconPlaceholderUrl}
              />
              {row.category === "fxKeeper" && (
                <SpritesheetIcon
                  iconName={"ETH"}
                  sizePx={24}
                  style={{ marginTop: 0 }}
                  className={classNames("uk-position-relative", classes.ethImg)}
                  fallbackSrc={config.tokenIconPlaceholderUrl}
                />
              )}
            </TableData>

            <TableData
              className={classNames({
                "uk-hidden": mediaQueries.maxMobile,
              })}
            >
              {row.link && mediaQueries.minMobile && (
                <FontAwesomeIcon
                  onClick={() => {
                    window.open(row.link, "_blank")?.focus();
                  }}
                  icon={["far", "external-link"]}
                />
              )}
            </TableData>

            <TableData
              textAlign="center"
              className={classNames({
                "uk-hidden": mediaQueries.maxMobile,
                "hfi-showbuthide": row.comingSoon,
              })}
            >
              {!externalOnly && mediaQueries.minMobile && (
                <>
                  <FontAwesomeIcon
                    icon={["far", isSelected ? "chevron-up" : "chevron-down"]}
                  />
                </>
              )}
            </TableData>
          </React.Fragment>
        )}
      </TableRow>

      {!externalOnly && isSelected && (
        <TableRow className="body-row body-row-content">
          <TableData colSpan={NUMBER_OF_COLUMNS}>
            <div>{row.component}</div>
          </TableData>
        </TableRow>
      )}
    </React.Fragment>
  );
};

export default EarnPage;
