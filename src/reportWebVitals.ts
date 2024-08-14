import { Metric, ReportHandler } from "web-vitals";
import { sendAnalyticsEvent } from "./utils/analytics";

export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export const sendToAnalytics = ({ id, name, value }: Metric) =>
  sendAnalyticsEvent("web_vitals", {
    event_action: name,
    // Values must be integers.
    event_value: Math.round(name === "CLS" ? value * 1000 : value),
    // ID is unique to current page load.
    event_label: id,
    // Avoids affecting bounce rate.
    non_interaction: true,
  });

reportWebVitals(sendToAnalytics);
