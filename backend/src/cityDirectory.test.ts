import { describe, expect, test } from "bun:test";

import {
  findCityByChineseName,
  findNearestMajorCity,
  getCityOptions,
} from "./cityDirectory";

describe("cityDirectory", () => {
  test("matches listed city by Chinese name with suffix", () => {
    expect(findCityByChineseName("北京市")).toMatchObject({
      en: "beijing",
      cn: "北京",
    });
  });

  test("matches expanded city by Chinese name with suffix", () => {
    expect(findCityByChineseName("徐州市")).toMatchObject({
      en: "xuzhou",
      cn: "徐州",
    });
  });

  test("finds nearest listed city from coordinates", () => {
    const result = findNearestMajorCity(31.2304, 121.4737);

    expect(result.city.en).toBe("shanghai");
    expect(result.distance).toBeLessThan(1);
  });

  test("returns searchable city options with listed flag", () => {
    const options = getCityOptions("徐");

    expect(options.some((option) => option.en === "xuzhou" && option.inList === false)).toBe(true);
    expect(options.some((option) => option.en === "xian" && option.inList === true)).toBe(false);
  });
});
