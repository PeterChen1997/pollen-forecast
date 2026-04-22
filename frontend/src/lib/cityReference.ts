export interface CityReferenceLike {
  en: string;
  cn: string;
  lat: number;
  lng: number;
  mode?: "manual" | "location";
}

export interface CityOptionLike extends CityReferenceLike {
  inList: boolean;
  tier?: number;
}

export interface CityDataLike {
  city_en: string;
  levelCode: number;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/[市区县]$/, "").toLowerCase();
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getDistanceToReference(
  city: Pick<CityReferenceLike, "lat" | "lng">,
  referenceCity?: CityReferenceLike | null,
): number | null {
  if (!referenceCity) return null;
  return haversineDistance(referenceCity.lat, referenceCity.lng, city.lat, city.lng);
}

export function sortCityDataByReference<T extends CityDataLike>(
  data: T[],
  cityMap: Map<string, Pick<CityReferenceLike, "lat" | "lng">>,
  referenceCity?: CityReferenceLike | null,
): T[] {
  if (!referenceCity) return [...data].sort((left, right) => right.levelCode - left.levelCode);

  return [...data].sort((left, right) => {
    const leftCity = cityMap.get(left.city_en);
    const rightCity = cityMap.get(right.city_en);
    const leftDistance = leftCity ? getDistanceToReference(leftCity, referenceCity) : null;
    const rightDistance = rightCity ? getDistanceToReference(rightCity, referenceCity) : null;

    if (leftDistance === null && rightDistance === null) return right.levelCode - left.levelCode;
    if (leftDistance === null) return 1;
    if (rightDistance === null) return -1;
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return right.levelCode - left.levelCode;
  });
}

export function sortOptionsByReference<T extends CityOptionLike>(
  options: T[],
  referenceCity?: CityReferenceLike | null,
): T[] {
  if (!referenceCity) return [...options];

  return [...options].sort((left, right) => {
    const leftDistance = getDistanceToReference(left, referenceCity) ?? Number.POSITIVE_INFINITY;
    const rightDistance = getDistanceToReference(right, referenceCity) ?? Number.POSITIVE_INFINITY;
    return leftDistance - rightDistance;
  });
}

export function filterCityOptions(options: CityOptionLike[], query: string, limit = 8): CityOptionLike[] {
  const normalizedQuery = normalizeQuery(query);
  const filtered = normalizedQuery
    ? options.filter((option) => {
        const cn = normalizeQuery(option.cn);
        const en = option.en.toLowerCase();
        return cn.includes(normalizedQuery) || en.includes(normalizedQuery);
      })
    : options;

  return filtered.slice(0, limit);
}

export function formatDistanceLabel(distance: number | null, referenceCity?: CityReferenceLike | null): string {
  if (distance === null) return "已收录";

  const prefix = referenceCity?.mode === "location" ? "距您" : `距${referenceCity?.cn ?? ""}`.trim();

  if (distance < 1) return `${prefix} <1km`;
  if (distance < 10) return `${prefix} ${distance.toFixed(1)}km`;
  return `${prefix} ${Math.round(distance)}km`;
}
