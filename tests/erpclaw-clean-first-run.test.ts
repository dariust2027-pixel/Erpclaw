import { describe, expect, it } from "vitest";

import { actionSafety } from "../lib/erpclaw/action-safety";

describe("clean first-run guardrails", () => {
  it("does not treat company creation as a read-only bootstrap action", () => {
    expect(actionSafety("setup-company")).not.toBe("read");
  });

  it("does not expose demo-data seeding through a normal onboarding path", () => {
    const onboardingActions = ["setup-company", "seed-defaults", "setup-chart-of-accounts"];
    expect(onboardingActions).not.toContain("seed-demo-data");
  });
});
