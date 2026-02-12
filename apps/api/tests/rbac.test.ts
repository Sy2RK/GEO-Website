import { describe, expect, it } from "vitest";
import { hasRole } from "../src/lib/auth";

describe("RBAC", () => {
  it("admin can access editor route", () => {
    expect(hasRole("admin", "editor")).toBe(true);
  });

  it("viewer cannot access editor route", () => {
    expect(hasRole("viewer", "editor")).toBe(false);
  });
});
