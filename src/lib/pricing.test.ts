import { describe, it, expect } from "vitest";
import { serviceCoins, bookingCoins, canAccess } from "./pricing";

describe("pricing rules", () => {
  it("intermediate gets 12% off", () => expect(serviceCoins(1000, "intermediate")).toBe(88));
  it("premium gets 18% off", () => expect(serviceCoins(1000, "premium")).toBe(82));
  it("basic pays the anchor", () => expect(serviceCoins(1000, "basic")).toBe(100));
  it("bundles of 2+ save coins", () =>
    expect(bookingCoins([{ cashKsh: 1000 }, { cashKsh: 1000 }], 0, "basic")).toBeLessThan(200));
  it("basic cannot access premium", () => expect(canAccess("basic", "premium")).toBe(false));
});
