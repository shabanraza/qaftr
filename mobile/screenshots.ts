import { configure, registerScreenshotScenario } from "snapscene";

configure({
  globalSetup: () => {
    // AuthGate and BillingProvider read getScreenshotState().active
  },
});

registerScreenshotScenario("paywall", {
  route: "/paywall",
  doneAfter: 2500,
});
