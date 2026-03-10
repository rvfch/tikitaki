import { loadHistory } from "../storage/history.js";
import {
  filterToday,
  filterWeek,
  filterMonth,
  filterDate,
} from "../utils/dateFilters.js";
import type { TimeEntry } from "../types/index.js";

export type HistoryFilter = "today" | "week" | "month" | "date";

export interface HistoryResult {
  entries: TimeEntry[];
  filter: HistoryFilter;
  dateArg?: string;
}

export function getHistory(
  subcommand: string | null,
  args: string,
): HistoryResult {
  const all = loadHistory();

  if (subcommand === "week") {
    return { entries: filterWeek(all), filter: "week" };
  }

  if (subcommand === "month") {
    return { entries: filterMonth(all), filter: "month" };
  }

  if (args.trim()) {
    return {
      entries: filterDate(all, args.trim()),
      filter: "date",
      dateArg: args.trim(),
    };
  }

  return { entries: filterToday(all), filter: "today" };
}
