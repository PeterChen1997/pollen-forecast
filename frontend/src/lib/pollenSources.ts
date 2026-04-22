export type PollenSourceKey = "weatherdt" | "qweather" | "nearby";

export interface SourceMeta {
  key: PollenSourceKey;
  shortLabel: string;
  label: string;
  description: string;
  isEstimated: boolean;
}

export interface SourceCountInput {
  source?: string | null;
}

export interface SourceSummary extends SourceMeta {
  count: number;
}

const SOURCE_META: Record<PollenSourceKey, SourceMeta> = {
  weatherdt: {
    key: "weatherdt",
    shortLabel: "实况花粉",
    label: "WeatherDT 花粉指数",
    description: "来自第三方花粉接口的主数据源。",
    isEstimated: false,
  },
  qweather: {
    key: "qweather",
    shortLabel: "过敏指数",
    label: "和风天气过敏指数",
    description: "主数据缺失时使用的和风天气花粉过敏指数回退数据。",
    isEstimated: false,
  },
  nearby: {
    key: "nearby",
    shortLabel: "邻近推算",
    label: "邻近城市推算",
    description: "根据附近已监测城市的花粉等级进行距离加权推算。",
    isEstimated: true,
  },
};

const SOURCE_ORDER: PollenSourceKey[] = ["weatherdt", "qweather", "nearby"];

export function getSourceMeta(source?: string | null): SourceMeta | null {
  if (!source) return null;
  return SOURCE_META[source as PollenSourceKey] ?? null;
}

export function summarizeSources(items: SourceCountInput[]): SourceSummary[] {
  const counts = new Map<PollenSourceKey, number>();

  for (const item of items) {
    const meta = getSourceMeta(item.source);
    if (!meta) continue;
    counts.set(meta.key, (counts.get(meta.key) ?? 0) + 1);
  }

  return SOURCE_ORDER
    .filter((key) => counts.has(key))
    .map((key) => ({
      ...SOURCE_META[key],
      count: counts.get(key) ?? 0,
    }));
}
