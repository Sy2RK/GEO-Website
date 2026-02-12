import { describe, expect, it } from "vitest";
import { nextDraftRevision, nextPublishedRevision } from "../src/utils/workflow";

describe("draft publish workflow", () => {
  it("increments draft revision", () => {
    expect(nextDraftRevision(4)).toBe(5);
  });

  it("increments published revision", () => {
    expect(nextPublishedRevision(2)).toBe(3);
  });
});
