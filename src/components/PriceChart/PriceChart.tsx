import * as d3 from "d3";
import { format } from "date-fns";
import React, { useEffect } from "react";
import { useToken } from "../../context/TokenManager";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import { getTokenAmountDisplayDecimals, digits } from "../../utils/general";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { PricePoint, Network } from "handle-sdk";
import classNames from "classnames";
import { config } from "../../config";
import classes from "./PriceChart.module.scss";
import ChartLoader from "../ChartLoader";
import { useUiStore } from "../../context/UserInterface";
import { getChartConfig } from "../../utils/convert/getChartConfig";
import * as sdk from "handle-sdk";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { isKeyPressedEnterOrSpace } from "../../utils/ui";
import {
  usePriceChartData,
  usePriceChartDataStore,
} from "../../context/PriceChartData";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

type Props = {
  id?: string;
  network: Network;
  className?: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  isSwapFromToHlp?: boolean;
  height: number;
};

const REFRESH_DATA_INTERVAL = 60_000;

const DEFAULT_PROVIDER_DATA = {
  data: [],
  providers: [],
};

const COINGECKO_URL_BASE = "https://coingecko.com/en";

const PriceChart = ({
  fromTokenSymbol,
  toTokenSymbol,
  isSwapFromToHlp,
  id,
  className,
  height: propsHeight,
  network,
}: Props) => {
  const [areTokensSwitched, setAreTokensSwitched] =
    React.useState<boolean>(false);
  const fromToken = useToken(
    areTokensSwitched ? toTokenSymbol : fromTokenSymbol,
    network,
  );
  const toToken = useToken(
    areTokensSwitched ? fromTokenSymbol : toTokenSymbol,
    network,
  );

  const { activeTheme } = useUiStore();
  const { providerData, setProviderData } = usePriceChartDataStore();
  const [hoverPrice, setHoverPrice] = React.useState(0);
  const [period, setPeriod] = React.useState(1);
  const { providerPriceDataKey, providerPriceData, fetchPriceData, isLoading } =
    usePriceChartData(
      fromToken?.symbol ?? fromTokenSymbol,
      toToken?.symbol ?? toTokenSymbol,
      network,
      period,
    );
  const isCoingeckoPriceProvider =
    providerPriceData.providers.includes("coingecko");
  const priceData = providerPriceData.data;
  const noPriceData = priceData.length === 0 && !isLoading;

  const [chartWidth, setChartWidth] = React.useState(0);
  const [chartHeight, setChartHeight] = React.useState(0);
  React.useEffect(() => setChartHeight(propsHeight), [propsHeight]);
  const chartContainerRef = React.useRef<HTMLInputElement>(null);
  const [chartConfig, setChartConfig] = React.useState(
    getChartConfig(activeTheme),
  );

  const [coingeckoFromTokenId] = usePromise(async () => {
    if (fromToken?.extensions?.isNative) {
      // polygon deprecated so default to ethereum token/coin
      return "ethereum";
    } else if (fromToken?.address) {
      const tokenBasics = await sdk.prices.coingecko.fetchTokenBasics(
        fromToken?.address,
        network,
      );
      return tokenBasics.id;
    } else {
      throw new Error("no fromToken address");
    }
  }, [fromToken, network]);

  const [coingeckoToTokenId] = usePromise(async () => {
    if (toToken?.extensions?.isNative) {
      // polygon deprecated so default to ethereum token/coin
      return "ethereum";
    } else if (toToken?.address) {
      const tokenBasics = await sdk.prices.coingecko.fetchTokenBasics(
        toToken?.address,
        network,
      );
      return tokenBasics.id;
    } else {
      throw new Error("no toToken address");
    }
  }, [toToken, network]);
  const coingeckoFromTokenUrl = `${COINGECKO_URL_BASE}/coins/${coingeckoFromTokenId}`;
  const coingeckoToTokenUrl = `${COINGECKO_URL_BASE}/coins/${coingeckoToTokenId}`;

  React.useEffect(() => {
    setChartConfig(getChartConfig(activeTheme));
  }, [activeTheme]);
  const isSmallChart = chartHeight < chartConfig.size.height;

  React.useEffect(() => {
    if (!chartContainerRef.current?.offsetWidth) return;
    setChartWidth(chartContainerRef.current?.offsetWidth);
  }, [chartContainerRef.current?.offsetWidth]);

  const chartRef = React.createRef<HTMLDivElement>();

  const setChartPeriod = (_period: number) => {
    const newProviderData = { ...providerData };
    newProviderData[providerPriceDataKey] = DEFAULT_PROVIDER_DATA;
    setProviderData(newProviderData);
    setPeriod(_period);
  };

  const removeChart = React.useCallback(() => {
    d3.select(chartRef.current).selectAll("*").remove();
  }, [chartRef]);

  React.useEffect(() => {
    const refreshDataInterval = setInterval(
      fetchPriceData,
      REFRESH_DATA_INTERVAL,
    );
    return () => clearInterval(refreshDataInterval);
  }, [fetchPriceData]);

  const [priceMovement, setPriceMovement] = React.useState(0);
  useEffect(() => {
    if (priceData.length === 0) {
      setPriceMovement(0);
      return;
    }
    const chartMovement = priceData?.length
      ? priceData[priceData.length - 1].price - priceData[0].price
      : 0;

    if (hoverPrice) {
      setPriceMovement(hoverPrice - priceData[0].price);
      return;
    }

    setPriceMovement(chartMovement);
  }, [hoverPrice, priceData[0]?.price]);

  const renderChart = React.useCallback(async () => {
    const margin = chartConfig.margin;
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    // set the ranges
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // define the area
    const area = d3
      .area<PricePoint>()
      .x((d: PricePoint) => {
        return x(d.date);
      })
      .y0(height)
      .y1((d: PricePoint) => {
        return y(d.price);
      });

    // define the line
    const valueline = d3
      .line<PricePoint>()
      .x((d: PricePoint) => {
        return x(d.date);
      })
      .y((d: PricePoint) => {
        return y(d.price);
      });

    removeChart();

    const chartElement = d3.select(chartRef.current);

    const svg = chartElement
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    let minPrice = 9999999999;
    let maxPrice = 0;
    priceData.forEach(function (d) {
      if (d.price < minPrice) minPrice = d.price;
      else if (d.price > maxPrice) maxPrice = d.price;
    });
    const scaleFactor = (maxPrice - minPrice) * 0.1;

    // scale the range of the data
    x.domain(
      d3
        .extent(priceData, (d: PricePoint) => {
          return d.date;
        })
        .map(item => item ?? 1),
    );
    y.domain([
      d3.min(priceData, d => {
        return d.price - scaleFactor;
      }) ?? 0,
      d3.max(priceData, (d: any) => {
        return d.price + scaleFactor;
      }),
    ]);

    // set the gradient
    const chartColour =
      priceMovement < 0
        ? chartConfig.color.movementDown
        : chartConfig.color.movementUp;
    const areaGradientId = `${providerPriceDataKey}-area-gradient`;
    svg
      .append("linearGradient")
      .attr("id", areaGradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", chartHeight)
      .attr("x2", 0)
      .attr("y2", 0)
      .selectAll("stop")
      .data([
        {
          offset: "0%",
          color: "transparent",
        },
        {
          offset: "100%",
          color: activeTheme === "handleBerg" ? "#47739f" : chartColour,
        },
      ])
      .enter()
      .append("stop")
      .attr("offset", d => {
        return d.offset;
      })
      .attr("stop-color", d => {
        return d.color;
      });

    const bisect = d3.bisector((d: PricePoint) => {
      return d.date;
    }).left;

    const mouseover = (event: React.MouseEvent, d: PricePoint[]) => {
      mouseEvent(event, d);
    };

    const mousemove = (event: React.MouseEvent, d: PricePoint[]) => {
      mouseEvent(event, d);
    };

    const mouseEvent = (event: React.MouseEvent, d: PricePoint[]) => {
      if (isSmallChart) return;
      const x0 = x.invert(d3.pointer(event)[0]);
      const i = bisect(priceData, x0, 1);
      const PricePoint = d[i];
      if (PricePoint) setHoverPrice(PricePoint.price);

      const tooltip = d3.select(".tooltip");
      if (!isSmallChart && PricePoint)
        tooltip
          .html(
            `${format(
              PricePoint.date,
              "d/M HH:mm",
            )}\n${PricePoint.price.toLocaleString(
              undefined,
              digits(getTokenAmountDisplayDecimals(fromTokenSymbol)),
            )}`,
          )
          .attr("class", "tooltip active")
          .style("opacity", 1)
          .style("left", `${event.clientX - 48}px`)
          .style("top", `${event.clientY - 65}px`);
      else mouseLeave(event, d);
    };

    const mouseleave = (event: React.MouseEvent, d: PricePoint[]) => {
      mouseLeave(event, d);
    };

    const mouseLeave = (event: React.MouseEvent, d: PricePoint[]) => {
      const tooltip = d3.select(".tooltip");
      tooltip.style("opacity", 0);
      setHoverPrice(priceData[priceData.length - 1].price);
    };

    // add the area
    svg
      .append("path")
      .data([priceData])
      .attr("class", "area")
      .attr("d", area)
      .attr("fill", `url(#${areaGradientId}`)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseleave);

    // add the valueline path.
    svg
      .append("path")
      .data([priceData])
      .attr("class", "line")
      .attr("d", valueline)
      .style("fill", "none")
      .style("stroke", chartColour);

    chartElement
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("opacity", "0")
      .style("width", "auto")
      .style("color", chartConfig.color.current)
      .style("border", `1px solid ${chartConfig.color.current}`)
      .style("background-color", chartConfig.color.background)
      .style("padding", "4px 8px");
  }, [
    chartConfig,
    chartWidth,
    chartHeight,
    removeChart,
    priceData,
    isSmallChart,
    fromTokenSymbol,
    priceMovement,
  ]);

  React.useEffect(() => {
    renderChart();
  }, [renderChart]);

  const currentPrice =
    priceData?.length > 0 ? priceData[priceData.length - 1].price : 0;
  const priceToShow = hoverPrice ?? currentPrice;
  const formattedPriceToShow = priceToShow.toLocaleString(
    undefined,
    digits(getTokenAmountDisplayDecimals(fromTokenSymbol, priceToShow)),
  );

  const reverseChartTokens = (e: React.KeyboardEvent | React.MouseEvent) => {
    // Only proceed if mouse click or enter/space key pressed.
    if (
      e.type === "keydown" &&
      !isKeyPressedEnterOrSpace(e as React.KeyboardEvent)
    )
      return;
    setAreTokensSwitched(!areTokensSwitched);
  };

  return (
    <div id={id} ref={chartContainerRef} className="uk-flex uk-flex-column">
      {!isSmallChart && (
        <div className="uk-flex uk-flex-middle uk-flex-right uk-text-right">
          <div>
            {fromToken && toToken && (
              <h3 className="uk-margin-remove-bottom uk-margin-small-top uk-flex uk-flex-right">
                <div className="uk-flex uk-flex-center uk-margin-small-right">
                  <div
                    className={classes.switchButton}
                    onClick={e => reverseChartTokens(e)}
                    onKeyDown={e => reverseChartTokens(e)}
                    uk-tooltip={`title: reverse pair; pos: bottom;`}
                  >
                    <FontAwesomeIcon icon={["fal", "exchange"]} />
                  </div>
                </div>
                <span
                  className="uk-margin-small-right uk-position-relative"
                  style={{ zIndex: "0" }}
                >
                  <a
                    href={coingeckoFromTokenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer"
                    data-uk-tooltip={`title: view ${fromToken.symbol} on coingecko; pos: bottom;`}
                  >
                    <SpritesheetIcon
                      sizePx={24}
                      iconName={fromToken.symbol}
                      style={{ marginTop: 2 }}
                      className={classNames(
                        classes.fromTokenImg,
                        "uk-position-relative hfi-token-overlap",
                      )}
                      fallbackSrc={
                        fromToken.logoURI ?? config.tokenIconPlaceholderUrl
                      }
                    />
                  </a>
                  <a
                    href={coingeckoToTokenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer"
                    data-uk-tooltip={`title: view ${toToken.symbol} on coingecko; pos: bottom;`}
                  >
                    <SpritesheetIcon
                      sizePx={24}
                      iconName={toToken.symbol}
                      style={{ marginTop: 2, marginLeft: -12 }}
                      className={classNames(
                        classes.toTokenImg,
                        "uk-position-relative",
                      )}
                      fallbackSrc={
                        toToken.logoURI ?? config.tokenIconPlaceholderUrl
                      }
                    />
                  </a>
                </span>
                {fromToken.symbol}/{toToken.symbol}
              </h3>
            )}

            <div
              className={classNames(
                "uk-flex uk-flex-right uk-flex-top uk-h4 uk-margin-remove",
                {
                  "hfi-showbuthide": isLoading || !priceData?.length,
                },
              )}
            >
              <span className="uk-margin-xsmall-right">
                {formattedPriceToShow}
              </span>

              <span
                className={classNames({
                  "uk-margin-xsmall-right": isCoingeckoPriceProvider,
                  "hfi-up": priceMovement >= 0,
                  "hfi-down": priceMovement < 0,
                })}
              >
                ({priceMovement >= 0 ? "+" : ""}
                {priceData[0] && priceData[0].price !== 0
                  ? ((priceMovement / priceData[0].price) * 100).toLocaleString(
                      undefined,
                      digits(2),
                    )
                  : 0}
                %)
              </span>

              {isCoingeckoPriceProvider && (
                <span
                  className={classNames(
                    "uk-position-relative",
                    classes.zIndex0,
                    {
                      "hfi-showbuthide": isLoading || !priceData?.length,
                    },
                  )}
                  data-uk-tooltip="title: chart data by coingecko; pos: bottom-right;"
                >
                  <span>
                    <Image
                      className={classNames(
                        "uk-position-relative",
                        classes.coingeckoIcon,
                        {
                          [classes.onlyTwelveData]: !isCoingeckoPriceProvider,
                        },
                      )}
                      width="16"
                      src="/assets/images/coinGeckoLogo.png"
                      alt="coingecko"
                    />
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={chartRef}
        className={classNames(className, {
          "uk-hidden": noPriceData || isLoading,
        })}
      />

      {noPriceData && (
        <div
          className="uk-flex uk-flex-center uk-flex-middle uk-height-1-1"
          style={{ height: chartHeight }}
        >
          <p className="uk-h4 uk-margin-remove">
            <span>
              no chart data for period.
              <br />
              select another.
            </span>
          </p>
        </div>
      )}

      {!isSmallChart && (
        <div
          id={`${id}-buttons`}
          className={classNames(
            "uk-flex uk-flex-right",
            classes.convertChartButtons,
          )}
        >
          <div
            className={classNames("uk-button-group", {
              "uk-hidden": isLoading,
            })}
          >
            <Button
              onClick={() => setChartPeriod(1)}
              className={classNames("uk-button uk-button-small", {
                "cursor-pointer": !isSwapFromToHlp && period !== 1,
                "disabled-opacity": isLoading,
              })}
              style={{ borderRightWidth: "0 !important" }}
              disabled={isLoading}
              active={period === 1}
            >
              1d
            </Button>
            <Button
              onClick={() => setChartPeriod(7)}
              className={classNames(
                "uk-button uk-button-primary uk-button-small",
                {
                  "cursor-pointer": !isSwapFromToHlp && period !== 7,
                  "disabled-opacity": isLoading,
                },
              )}
              style={{ borderRightWidth: "0 !important" }}
              disabled={isLoading}
              active={period === 7}
            >
              1w
            </Button>
            <Button
              onClick={() => setChartPeriod(30)}
              className={classNames(
                "uk-button uk-button-primary uk-button-small",
                {
                  "cursor-pointer": !isSwapFromToHlp && period !== 30,
                  "disabled-opacity": isLoading,
                },
              )}
              disabled={isLoading}
              active={period === 30}
            >
              1m
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div
          className="uk-flex uk-flex-center uk-flex-middle uk-height-1-1"
          style={{ height: chartHeight + 6 }}
        >
          <ChartLoader />
        </div>
      )}
    </div>
  );
};

export default PriceChart;
