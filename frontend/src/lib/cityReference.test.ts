import { describe, expect, test } from "bun:test";

import {
  filterCityOptions,
  formatDistanceLabel,
  sortCityDataByReference,
  type CityOptionLike,
  type CityReferenceLike,
} from "./cityReference";

const options: CityOptionLike[] = [
  { en: "beijing", cn: "北京", lat: 39.9042, lng: 116.4074, inList: true },
  { en: "shanghai", cn: "上海", lat: 31.2304, lng: 121.4737, inList: true },
  { en: "xuzhou", cn: "徐州", lat: 34.2044, lng: 117.2859, inList: false },
];

const shanghai: CityReferenceLike = {
  en: "shanghai",
  cn: "上海",
  lat: 31.2304,
  lng: 121.4737,
};

describe("cityReference", () => {
  test("filters city options by keyword", () => {
    expect(filterCityOptions(options, "徐")).toEqual([
      expect.objectContaining({ en: "xuzhou", cn: "徐州" }),
    ]);
  });

  test("sorts city data by distance from reference city", () => {
    const sorted = sortCityDataByReference(
      [
        { city_en: "beijing", levelCode: 3 },
        { city_en: "shanghai", levelCode: 2 },
      ],
      new Map(options.filter((option) => option.inList).map((option) => [option.en, option])),
      shanghai,
    );

    expect(sorted.map((item) => item.city_en)).toEqual(["shanghai", "beijing"]);
  });

  test("formats distance label for manual reference city", () => {
    expect(formatDistanceLabel(12.4, shanghai)).toBe("距上海 12km");
  });
});
