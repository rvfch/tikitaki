import { loadHistory } from "../storage/history.js";
import { loadSettings } from "../storage/settings.js";
import { getJiraWorklogs } from "../integrations/jira.js";
import { getClockifyEntries } from "../integrations/clockify.js";
import type { TimeEntry } from "../types/index.js";
import type { RemoteWorklog } from "../integrations/types.js";

export interface SyncCheckResult {
  localOnly: TimeEntry[];
  remoteOnly: RemoteWorklog[];
  matched: Array<{ local: TimeEntry; remote: RemoteWorklog }>;
}

function isSimilarDuration(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff < 300; // within 5 minutes
}

export async function checkSync(): Promise<SyncCheckResult> {
  const settings = loadSettings();
  const localEntries = loadHistory();
  const remoteWorklogs: RemoteWorklog[] = [];

  const tickets = [...new Set(localEntries.map((e) => e.ticket))];

  if (settings.integrations.jira) {
    for (const ticket of tickets) {
      const worklogs = await getJiraWorklogs(
        ticket,
        settings.integrations.jira,
      );
      remoteWorklogs.push(...worklogs);
    }
  }

  if (settings.integrations.clockify) {
    const dates = localEntries.map((e) => e.startTime.split("T")[0]);
    const minDate = dates.sort()[0] || new Date().toISOString().split("T")[0];
    const maxDate =
      dates.sort().reverse()[0] || new Date().toISOString().split("T")[0];
    const entries = await getClockifyEntries(
      settings.integrations.clockify,
      minDate,
      maxDate,
    );
    remoteWorklogs.push(...entries);
  }

  const matched: Array<{ local: TimeEntry; remote: RemoteWorklog }> = [];
  const matchedLocalIds = new Set<string>();
  const matchedRemoteIndices = new Set<number>();

  for (const local of localEntries) {
    const localDate = local.startTime.split("T")[0];
    for (let i = 0; i < remoteWorklogs.length; i++) {
      if (matchedRemoteIndices.has(i)) continue;
      const remote = remoteWorklogs[i];
      if (
        remote.ticket === local.ticket &&
        remote.date === localDate &&
        isSimilarDuration(remote.duration, local.duration)
      ) {
        matched.push({ local, remote });
        matchedLocalIds.add(local.id);
        matchedRemoteIndices.add(i);
        break;
      }
    }
  }

  return {
    localOnly: localEntries.filter((e) => !matchedLocalIds.has(e.id)),
    remoteOnly: remoteWorklogs.filter((_, i) => !matchedRemoteIndices.has(i)),
    matched,
  };
}
