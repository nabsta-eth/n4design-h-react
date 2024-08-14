import "./startup";
import React from "react";
import * as ReactDOMClient from "react-dom/client";
import App from "./App";
import { reportWebVitals, sendToAnalytics } from "./reportWebVitals";
import "./assets/styles/themes.scss";
import "./assets/styles/styles.scss";
import "./assets/styles/scrollbars.scss";
import "./assets/styles/walletconnect.scss";
import "./assets/styles/notifications.scss";
import "../node_modules/react-grid-layout/css/styles.css";
import "../node_modules/react-resizable/css/styles.css";
import "./assets/styles/tipr-fli.scss";
import "@fortawesome/fontawesome-pro/css/fontawesome.min.css";
import "@fortawesome/fontawesome-pro/css/brands.min.css";
import "@fortawesome/fontawesome-pro/css/regular.min.css";
import "@fortawesome/fontawesome-pro/css/solid.min.css";
import "@fortawesome/fontawesome-pro/css/light.min.css";
import "./assets/styles/fontawesome-custom-icons.scss";
import "./assets/styles/dynamic.scss";
import { ContainerElement } from "d3";

const handle = document.getElementById("handle") as ContainerElement;
const root = ReactDOMClient.createRoot(handle);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Report web vitals to google analytics.
reportWebVitals(sendToAnalytics);
