import { describe, expect, it } from "vitest";
import { assertLockedFieldsUnchanged } from "../src/utils/locked-fields";

describe("lockedFields", () => {
  it("blocks editor from changing locked canonicalSummary", () => {
    expect(() =>
      assertLockedFieldsUnchanged({
        role: "editor",
        lockedFields: { canonicalSummary: true },
        previousContent: { canonicalSummary: "old" },
        nextContent: { canonicalSummary: "new" }
      })
    ).toThrowError(/locked_field_modified/);
  });

  it("allows admin to change locked field", () => {
    expect(() =>
      assertLockedFieldsUnchanged({
        role: "admin",
        lockedFields: { canonicalSummary: true },
        previousContent: { canonicalSummary: "old" },
        nextContent: { canonicalSummary: "new" }
      })
    ).not.toThrow();
  });
});
