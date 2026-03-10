import type { SyncResult } from "../types/index.js";

export type { SyncResult };

export interface RemoteWorklog {
  source: "jira" | "clockify";
  ticket: string;
  date: string;
  duration: number;
  description?: string;
}
