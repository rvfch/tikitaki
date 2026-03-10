import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  parseISO,
  isWithinInterval,
  parse,
} from "date-fns";
import type { TimeEntry } from "../types/index.js";

export function filterToday(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  return entries.filter((e) =>
    isWithinInterval(parseISO(e.startTime), { start, end }),
  );
}

export function filterWeek(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return entries.filter((e) =>
    isWithinInterval(parseISO(e.startTime), { start, end }),
  );
}

export function filterMonth(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return entries.filter((e) =>
    isWithinInterval(parseISO(e.startTime), { start, end }),
  );
}

export function filterDate(entries: TimeEntry[], dateStr: string): TimeEntry[] {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const start = startOfDay(date);
  const end = endOfDay(date);
  return entries.filter((e) =>
    isWithinInterval(parseISO(e.startTime), { start, end }),
  );
}

export function groupByDate(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  const groups: Record<string, TimeEntry[]> = {};
  for (const entry of entries) {
    const date = parseISO(entry.startTime).toISOString().split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  }
  return groups;
}
