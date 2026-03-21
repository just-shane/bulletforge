import { init, track } from "@plausible-analytics/tracker";

init({
  domain: "bulletforge.io",
  autoCapturePageviews: true,
  captureOnLocalhost: false,
});

export { track as trackEvent };
