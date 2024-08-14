import classNames from "classnames";
import * as d3 from "d3";
import { DefaultArcObject } from "d3";
import { ethers } from "ethers";
import React from "react";
import { config } from "../../config";
import { useToken } from "../../context/TokenManager";
import { useHlpVaultBalance } from "../../context/HlpVaultBalance";
import { valueToDisplayString } from "../../utils/format";
import { onTokenImageLoadError } from "../../utils/token-data";
import GrillzLoader from "../GrillzLoader";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import classes from "./HlpPieChart.module.scss";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { getThemeFile } from "../../utils/ui";
import { useUiStore } from "../../context/UserInterface";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";

const chartConfig = {
  size: {
    height: 360,
    radius: 150,
  },
  margin: {
    top: 5,
    right: 0,
    bottom: 0,
    left: 0,
  },
};

// rotates the whole pie chart to avoid all the small wedges being at the top and labels overlapping
const ROTATION_FACTOR = Math.PI / 1.85;
// % of hLP below which the wedge will be consolidated into "other"
const WEDGE_CONSOLIDATION_THRESHOLD = 2;
// % of hLP below which % value won't show in the wedge
const WEDGE_CONTENT_THRESHOLD = 1;
const network = DEFAULT_HLP_NETWORK;

const HlpPieChart = () => {
  const { tvl: tvlUncached, balances: balancesUncached } = useHlpVaultBalance();
  const [tvl] = React.useState(tvlUncached);
  const [balances] = React.useState(balancesUncached);
  const theme = getThemeFile(useUiStore().activeTheme);

  const pieChartData = React.useMemo(() => {
    const data: { name: string; value: number }[] = [];
    for (const { token, balanceUsd } of balances) {
      data.push({
        name: token.symbol,
        value: +ethers.utils.formatUnits(balanceUsd || 0, PRICE_DECIMALS),
      });
    }
    const totalUsdAmount = +ethers.utils.formatUnits(tvl, PRICE_DECIMALS);
    data.push({ name: "all", value: totalUsdAmount });
    return data;
  }, [tvl, balances]);

  const totalValue = React.useMemo(
    () => pieChartData.find(data => data.name === "all")?.value ?? 0,
    [pieChartData],
  );

  const pieChartDataFinal = React.useMemo(
    () =>
      [
        ...pieChartData.filter(
          data =>
            data.name !== "all" &&
            (data.value / totalValue) * 100 >= WEDGE_CONSOLIDATION_THRESHOLD,
        ),
        {
          name: "other",
          value: pieChartData
            .filter(
              data =>
                data.name !== "all" &&
                (data.value / totalValue) * 100 < WEDGE_CONSOLIDATION_THRESHOLD,
            )
            .reduce((total, data) => total + data.value, 0),
        },
      ]
        .filter(data => data.name !== "all" && data.value > 0)
        .sort((a, b) => b.value - a.value),
    [pieChartData, totalValue],
  );

  const [chartWidth, setChartWidth] = React.useState(0);
  const chartContainerRef = React.useRef<HTMLInputElement>(null);
  React.useLayoutEffect(() => {
    if (chartContainerRef?.current)
      setChartWidth(chartContainerRef.current.offsetWidth);
  }, []);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const removeChart = React.useCallback(() => {
    d3.select(chartRef.current).selectAll("*").remove();
  }, [chartRef]);

  const renderChart = React.useCallback(async () => {
    const margin = chartConfig.margin;
    const width = chartWidth - margin.left - margin.right;
    const height = chartConfig.size.height;

    removeChart();

    const chartElement = d3.select(chartRef.current);

    const svg = chartElement
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top - margin.bottom)
      .attr("radius", chartConfig.size.radius);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const ordScale = d3
      .scaleOrdinal()
      .domain(pieChartDataFinal as Iterable<string>)
      .range([
        "#a9e2b0",
        "#ffff88",
        "#c39cd9",
        "#ff7bac",
        "#B3FDFF",
        "#ffb45a",
        "#F3DDF2",
        "#80d8ff",
      ]);

    const pie = d3.pie().value(data => data as number);

    const arc = g
      .selectAll("arc")
      .data(pie(pieChartDataFinal.map(data => data.value)))
      .enter();

    const path = d3
      .arc()
      .outerRadius(chartConfig.size.radius)
      .innerRadius(chartConfig.size.radius * 0.0001)
      .startAngle(function (d) {
        return d.startAngle + ROTATION_FACTOR;
      })
      .endAngle(function (d) {
        return d.endAngle + ROTATION_FACTOR;
      });

    arc
      .append("path")
      // @ts-ignore bad d3 typescript bindings
      .attr("d", path)
      // @ts-ignore bad d3 typescript bindings
      .attr("fill", d => ordScale(d.data))
      .attr("stroke", theme.backgroundColor)
      .attr("stroke-width", "3");

    // where label line will start
    const labelStartArc = d3
      .arc()
      .innerRadius(chartConfig.size.radius)
      .outerRadius(chartConfig.size.radius)
      .startAngle(function (d) {
        return d.startAngle + ROTATION_FACTOR;
      })
      .endAngle(function (d) {
        return d.endAngle + ROTATION_FACTOR;
      });

    // where the label line bend will occur
    const labelBendArc = d3
      .arc()
      .innerRadius(chartConfig.size.radius * 1.1)
      .outerRadius(chartConfig.size.radius * 1.1)
      .startAngle(function (d) {
        return d.startAngle + ROTATION_FACTOR;
      })
      .endAngle(function (d) {
        return d.endAngle + ROTATION_FACTOR;
      });

    // where the label line bend will occur
    const textArc = d3
      .arc()
      .innerRadius(chartConfig.size.radius)
      .outerRadius(chartConfig.size.radius * 0.6)
      .startAngle(function (d) {
        return d.startAngle + ROTATION_FACTOR;
      })
      .endAngle(function (d) {
        return d.endAngle + ROTATION_FACTOR;
      });

    // label lines
    arc
      .selectAll("allPolylines")
      .data(pie(pieChartDataFinal.map(data => data.value)))
      .enter()
      .append("polyline")
      // @ts-ignore bad d3 typescript bindings
      .attr("stroke", d => ordScale(d.data))
      .style("fill", "none")
      .attr("stroke-width", 1)
      // @ts-ignore bad d3 typescript bindings
      .attr("points", d => {
        // @ts-ignore bad d3 typescript bindings
        const posA = labelStartArc.centroid(d); // line insertion in the slice
        // @ts-ignore bad d3 typescript bindings
        const posB = labelBendArc.centroid(d); // line break: we use the other arc generator that has been built only for that
        // @ts-ignore bad d3 typescript bindings
        const posC = labelBendArc.centroid(d); // Label position = almost the same as posB
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2; // we need the angle to see if the X position will be at the extreme right or extreme left
        posC[0] =
          chartConfig.size.radius *
          1.1 *
          (midangle - ROTATION_FACTOR < Math.PI ? -1 : 1); // multiply by 1 or -1 to put it on the right or on the left
        return [posA, posB, posC];
      });

    // label text for lines
    arc
      .selectAll("allLabels")
      .data(pie(pieChartDataFinal.map(data => data.value)))
      .enter()
      .append("text")
      // @ts-ignore bad d3 typescript bindings
      .attr("fill", d => ordScale(d.data))
      .attr("stroke", "none")
      .style("font-family", "Verdana")
      .style("font-size", "1rem")
      .style("letter-spacing", "1px")
      .attr("id", d => `hlp-pie-chart-label-${pieChartDataFinal[d.index].name}`)
      .text(d => {
        const valueToDisplay = valueToDisplayString(
          pieChartDataFinal[d.index].value,
          "",
          2,
        );
        return `${pieChartDataFinal[d.index].name} $${valueToDisplay}`;
      })
      .attr("transform", d => {
        const pos = labelBendArc.centroid(d as unknown as DefaultArcObject);
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] =
          chartConfig.size.radius *
          1.11 *
          (midangle - ROTATION_FACTOR < Math.PI ? -1 : 1);
        return "translate(" + pos + ")";
      })
      .style("text-anchor", d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle - ROTATION_FACTOR < Math.PI ? "end" : "start";
      });

    // label text for wedges
    arc
      .append("text")
      .attr(
        "transform",
        d =>
          "translate(" +
          [
            textArc.centroid(d as unknown as DefaultArcObject)[0] - 20,
            textArc.centroid(d as unknown as DefaultArcObject)[1] + 4,
          ] +
          ")",
      )
      .text(d => {
        const percentage =
          (pieChartDataFinal[d.index].value / totalValue) * 100;
        if (percentage < WEDGE_CONTENT_THRESHOLD) return "";
        return `${percentage.toFixed(2)}%`;
      })
      .attr("fill", theme.backgroundColor)
      .style("font-family", theme.font)
      .style("font-size", "0.75rem")
      .style("font-weight", "bold");
  }, [chartWidth, removeChart, pieChartDataFinal, totalValue]);

  React.useEffect(() => {
    renderChart();
  }, [renderChart]);

  const token = useToken("hLP", network);

  return (
    <div
      ref={chartContainerRef}
      className={classNames(classes.pieChart, "uk-flex uk-flex-column")}
    >
      <div className="uk-flex uk-flex-right uk-text-right">
        <h3 className="uk-margin-remove-bottom uk-margin-small-top uk-flex-right">
          <span className="uk-margin-small-right uk-position-relative">
            <span>
              <Image
                className="uk-position-relative"
                style={{ marginTop: "-5px", marginLeft: "-12px" }}
                width="24"
                src={token?.logoURI ?? config.tokenIconPlaceholderUrl}
                alt={token?.symbol}
                onError={onTokenImageLoadError}
              />
            </span>
          </span>
          hLP composition
        </h3>
      </div>

      {pieChartDataFinal.length === 0 && (
        <div
          className={classNames(
            "uk-flex uk-flex-center uk-flex-middle uk-height-1-1",
            classes.pieLoader,
          )}
          style={{ height: chartConfig.size.height }}
        >
          <GrillzLoader />
        </div>
      )}

      <div
        ref={chartRef}
        className={classNames(classes.chart, {
          "uk-hidden": pieChartDataFinal.length === 0,
        })}
      ></div>
    </div>
  );
};

export default HlpPieChart;
