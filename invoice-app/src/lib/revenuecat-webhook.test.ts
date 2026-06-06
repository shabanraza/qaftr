import { describe, expect, it } from "vitest";
import { resolveEntitlementUpdate } from "./revenuecat-entitlements";

const NOW = Date.parse("2026-06-06T12:00:00.000Z");

describe("resolveEntitlementUpdate", () => {
  it("grants pro on purchase and renewal events", () => {
    expect(
      resolveEntitlementUpdate({ type: "INITIAL_PURCHASE", app_user_id: "u1" }, NOW),
    ).toEqual({ plan: "pro", status: "active" });

    expect(
      resolveEntitlementUpdate({ type: "RENEWAL", app_user_id: "u1" }, NOW),
    ).toEqual({ plan: "pro", status: "active" });
  });

  it("revokes pro on expiration and billing issue", () => {
    expect(
      resolveEntitlementUpdate({ type: "EXPIRATION", app_user_id: "u1" }, NOW),
    ).toEqual({ plan: "free", status: "expired" });

    expect(
      resolveEntitlementUpdate({ type: "BILLING_ISSUE", app_user_id: "u1" }, NOW),
    ).toEqual({ plan: "free", status: "expired" });
  });

  it("ignores cancellation while access is still valid", () => {
    expect(
      resolveEntitlementUpdate(
        {
          type: "CANCELLATION",
          app_user_id: "u1",
          expiration_at_ms: NOW + 86_400_000,
        },
        NOW,
      ),
    ).toBeNull();
  });

  it("revokes pro when cancellation has no future expiration", () => {
    expect(
      resolveEntitlementUpdate(
        {
          type: "CANCELLATION",
          app_user_id: "u1",
          expiration_at_ms: NOW - 1,
        },
        NOW,
      ),
    ).toEqual({ plan: "free", status: "expired" });
  });

  it("ignores unknown informational events", () => {
    expect(
      resolveEntitlementUpdate({ type: "TEST", app_user_id: "u1" }, NOW),
    ).toBeNull();

    expect(
      resolveEntitlementUpdate({ type: "SUBSCRIBER_ALIAS", app_user_id: "u1" }, NOW),
    ).toBeNull();
  });
});
