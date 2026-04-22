import { describe, expect, test } from "bun:test";

import { getSourceMeta, summarizeSources } from "./pollenSources";

describe("pollenSources", () => {
  test("returns metadata for weatherdt primary source", () => {
    expect(getSourceMeta("weatherdt")).toMatchObject({
      key: "weatherdt",
      shortLabel: "实况花粉",
      isEstimated: false,
    });
  });

  test("summarizes daily sources by count", () => {
    const summary = summarizeSources([
      { source: "weatherdt" },
      { source: "weatherdt" },
      { source: "qweather" },
    ]);

    expect(summary).toEqual([
      expect.objectContaining({ key: "weatherdt", count: 2 }),
      expect.objectContaining({ key: "qweather", count: 1 }),
    ]);
  });
});
