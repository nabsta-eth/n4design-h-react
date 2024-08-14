// This module runs before anything else in the main bundle.
const version = import.meta.env.VITE_APP_VERSION ?? "?";
console.log(`%c🦍 v${version}`, "font-weight: bold; font-size: 26px;");
