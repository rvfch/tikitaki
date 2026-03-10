import { getUnsyncedEntries, updateEntry } from "../storage/history.js";
import { loadSettings } from "../storage/settings.js";
import { syncToJira } from "../integrations/jira.js";
import { syncToClockify } from "../integrations/clockify.js";
import type { SyncResult } from "../types/index.js";

export async function syncAll(): Promise<SyncResult[]> {
  const settings = loadSettings();
  const results: SyncResult[] = [];

  if (settings.integrations.jira) {
    const entries = getUnsyncedEntries("jira");
    for (const entry of entries) {
      const result = await syncToJira(entry, settings.integrations.jira);
      if (result.success) {
        updateEntry(entry.id, {
          synced: { ...entry.synced, jira: true },
        });
      }
      results.push(result);
    }
  }

  if (settings.integrations.clockify) {
    const entries = getUnsyncedEntries("clockify");
    for (const entry of entries) {
      const result = await syncToClockify(
        entry,
        settings.integrations.clockify,
      );
      if (result.success) {
        updateEntry(entry.id, {
          synced: { ...entry.synced, clockify: true },
        });
      }
      results.push(result);
    }
  }

  if (!settings.integrations.jira && !settings.integrations.clockify) {
    return [
      {
        entryId: "",
        ticket: "",
        success: false,
        target: "jira",
        error: "No integrations configured. Use /settings:integrations first.",
      },
    ];
  }

  return results;
}
