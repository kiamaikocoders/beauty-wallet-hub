import { describe, it, expect } from "vitest";
import {
  serviceCoins,
  bookingCoins,
  canAccess,
  memberPrice,
  allowanceValueKsh,
  duration,
} from "./pricing";

describe("pricing rules", () => {
  it("intermediate gets 12% off", () => expect(serviceCoins(1000, "intermediate")).toBe(88));
  it("premium gets 18% off", () => expect(serviceCoins(1000, "premium")).toBe(82));
  it("basic pays the anchor", () => expect(serviceCoins(1000, "basic")).toBe(100));
  it("bundles of 2+ save coins", () =>
    expect(bookingCoins([{ cashKsh: 1000 }, { cashKsh: 1000 }], 0, "basic")).toBeLessThan(200));
  it("basic cannot access premium", () => expect(canAccess("basic", "premium")).toBe(false));
});

describe("member prices across classes", () => {
  it("matches the seeded bookings", () => {
    expect(memberPrice(3500, "intermediate", "intermediate")).toEqual({
      kind: "included",
      coins: 308,
    });
    expect(memberPrice(6000, "intermediate", "intermediate")).toEqual({
      kind: "included",
      coins: 528,
    });
  });
  it("basic members unlock higher classes for 10% more coins", () =>
    expect(memberPrice(2500, "basic", "intermediate")).toEqual({ kind: "unlock", coins: 275 }));
  it("intermediate members must upgrade for premium", () =>
    expect(memberPrice(9000, "intermediate", "premium")).toEqual({ kind: "upgrade" }));
  it("premium members get their discount everywhere", () =>
    expect(memberPrice(800, "premium", "basic")).toEqual({ kind: "included", coins: 66 }));
});

describe("display helpers", () => {
  it("shows the plan's service value like the designs", () => {
    expect(allowanceValueKsh("basic")).toBe(7000);
    expect(allowanceValueKsh("intermediate")).toBe(17000);
    expect(allowanceValueKsh("premium")).toBe(24400);
  });
  it("formats durations", () => {
    expect(duration(40)).toBe("40 min");
    expect(duration(75)).toBe("75 min");
    expect(duration(60)).toBe("1 hr");
    expect(duration(300)).toBe("5 hrs");
  });
});
