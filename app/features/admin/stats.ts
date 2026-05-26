export type StatsFilters = {
  range: string;
  from: string;
  to: string;
  granularity: string;
  metric: string;
  protocol: string;
  provider: string;
  status: string;
  currency: string;
};

export type MockPoint = {
  label: string;
  value: number;
};

export function readStatsFilters(query: (name: string) => string | undefined): StatsFilters {
  const range = query("range") ?? "30d";
  const fallback = defaultRange(range);

  return {
    range,
    from: range === "custom" ? (query("from") ?? fallback.from) : fallback.from,
    to: range === "custom" ? (query("to") ?? fallback.to) : fallback.to,
    granularity: query("granularity") ?? fallback.granularity,
    metric: query("metric") ?? "amount",
    protocol: query("protocol") ?? "",
    provider: query("provider") ?? "",
    status: query("status") ?? "",
    currency: query("currency") ?? "CNY"
  };
}

export function createMockStats(filters: StatsFilters) {
  let from = parseLocalDateTime(filters.from);
  let to = parseLocalDateTime(filters.to);
  let error: string | undefined;

  if (!from || !to || from >= to) {
    const fallback = defaultRange("24h");
    from = parseLocalDateTime(fallback.from) ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    to = parseLocalDateTime(fallback.to) ?? new Date();
    error = "时间范围无效，已使用最近 24 小时数据。";
  }

  const points = createPoints(from, to, filters.granularity, filters);
  const amountMinor = points.reduce((sum, point) => sum + Math.round(point.value * 100), 0);
  const orderCount = Math.max(1, Math.round(points.reduce((sum, point) => sum + point.value, 0) / 12));
  const successRate = clamp(82 + modifier(filters.protocol) + modifier(filters.provider), 55, 99);
  const callbackRate = clamp(88 + modifier(filters.status), 60, 99);

  return {
    from,
    to,
    error,
    points,
    summary: {
      amountMinor,
      orderCount,
      paidCount: Math.round(orderCount * (successRate / 100)),
      successRate,
      callbackRate
    },
    breakdown: {
      protocol: {
        routerpay: filters.protocol === "easypay" ? 2 : 11,
        easypay: filters.protocol === "routerpay" ? 1 : 7
      },
      status: {
        created: 5,
        pending: 3,
        paid: 18,
        failed: 2,
        refunded: 1
      },
      providers: [
        { label: "Afdian", value: filters.provider && filters.provider !== "afdian" ? 2 : 22 },
        { label: "Stripe", value: 9 },
        { label: "Alipay", value: 7 },
        { label: "Wechat", value: 5 }
      ]
    },
    failureReasons: [
      { label: "provider_timeout", count: 8, rate: 38 },
      { label: "signature_invalid", count: 5, rate: 24 },
      { label: "callback_5xx", count: 4, rate: 19 },
      { label: "duplicate_event", count: 2, rate: 10 }
    ]
  };
}

export function granularityLabel(granularity: string) {
  return granularity === "minute" ? "按分钟" : granularity === "day" ? "按天" : granularity === "week" ? "按周" : "按小时";
}

export function metricTitle(metric: string) {
  return metric === "count" ? "订单数趋势" : metric === "success" ? "成功率趋势" : metric === "callback" ? "回调趋势" : "支付金额趋势";
}

export function metricValue(
  metric: string,
  summary: ReturnType<typeof createMockStats>["summary"],
  currency: string,
  formatMoney: (amountMinor: number, currency: string) => string
) {
  if (metric === "count") return String(summary.orderCount);
  if (metric === "success") return `${summary.successRate}%`;
  if (metric === "callback") return `${summary.callbackRate}%`;
  return formatMoney(summary.amountMinor, currency);
}

export function formatRangeLabel(from: Date, to: Date) {
  return `${toLocalInputValue(from).replace("T", " ")} - ${toLocalInputValue(to).replace("T", " ")}`;
}

function createPoints(from: Date, to: Date, granularity: string, filters: StatsFilters): MockPoint[] {
  const step = granularityMs(granularity);
  const totalSteps = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / step));
  const count = Math.min(96, totalSteps);
  const sampleEvery = Math.max(1, Math.ceil(totalSteps / count));
  const points: MockPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date(from.getTime() + index * sampleEvery * step);
    const wave = Math.sin(index / 2.7) * 9 + Math.cos(index / 5) * 5;
    const base = 34 + wave + modifier(filters.protocol) + modifier(filters.provider) + modifier(filters.status);
    const metricFactor = filters.metric === "success" || filters.metric === "callback" ? 1.4 : filters.metric === "count" ? 0.8 : 2.2;
    points.push({
      label: formatPointLabel(date, granularity),
      value: Math.max(2, Math.round(base * metricFactor + (index % 7)))
    });
  }

  return points;
}

function defaultRange(range: string) {
  const now = new Date();
  let from = new Date(now);
  let granularity = "hour";

  if (range === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
    granularity = "hour";
  } else if (range === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
    return { from: toLocalInputValue(start), to: toLocalInputValue(end), granularity: "hour" };
  } else if (range === "7d") {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    granularity = "day";
  } else if (range === "90d") {
    from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    granularity = "week";
  } else if (range === "24h" || range === "custom") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    granularity = "hour";
  } else {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    granularity = "day";
  }

  return { from: toLocalInputValue(from), to: toLocalInputValue(now), granularity };
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function granularityMs(granularity: string) {
  if (granularity === "minute") return 60 * 1000;
  if (granularity === "day") return 24 * 60 * 60 * 1000;
  if (granularity === "week") return 7 * 24 * 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function formatPointLabel(date: Date, granularity: string) {
  const value = toLocalInputValue(date);
  if (granularity === "minute" || granularity === "hour") {
    return value.slice(5).replace("T", " ");
  }
  return value.slice(5, 10);
}

function modifier(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
