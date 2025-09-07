import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";

export type UiEvent = {
  id?: string;
  summary: string;
  startTime: string;
  endTime: string;
};

export type Grouped =
  | { mode: "day"; groups: Array<{ key: string; label: string; items: UiEvent[] }> }
  | { mode: "week"; groups: Array<{ key: string; label: string; items: UiEvent[] }> };

export const groupEvents = (rows: any[], rangeDays: number): Grouped => {
  const items: UiEvent[] = rows.map((r) => ({
    id: r.googleEventId ?? r.id,
    summary: r.summary,
    startTime: typeof r.startTime === "string" ? r.startTime : new Date(r.startTime).toISOString(),
    endTime: typeof r.endTime === "string" ? r.endTime : new Date(r.endTime).toISOString(),
  }));
  
  if (rangeDays === 30) {
    const map = new Map<string, { key: string; label: string; items: UiEvent[] }>();
    items.forEach((e) => {
      const d = parseISO(e.startTime);
      const from = startOfWeek(d, { weekStartsOn: 1 });
      const to = endOfWeek(d, { weekStartsOn: 1 });
      const key = `${from.toISOString()}_${to.toISOString()}`;
      const label = `${format(from, "MMM d")} – ${format(to, "MMM d")}`;
      const bucket = map.get(key) ?? { key, label, items: [] as UiEvent[] };
      bucket.items = [...bucket.items, e];
      map.set(key, bucket);
    });
    return { mode: "week", groups: Array.from(map.values()) };
  }
  
  const map = new Map<string, { key: string; label: string; items: UiEvent[] }>();
  items.forEach((e) => {
    const d = parseISO(e.startTime);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE, MMM d");
    const bucket = map.get(key) ?? { key, label, items: [] as UiEvent[] };
    bucket.items = [...bucket.items, e];
    map.set(key, bucket);
  });
  
  return { mode: "day", groups: Array.from(map.values()) };
};
