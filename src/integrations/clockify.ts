import type { TimeEntry, ClockifyConfig, SyncResult } from "../types/index.js";
import type { RemoteWorklog } from "./types.js";

const BASE_URL = "https://api.clockify.me/api/v1";

export async function syncToClockify(
  entry: TimeEntry,
  config: ClockifyConfig,
): Promise<SyncResult> {
  const projectId = config.projectMappings[entry.project];
  const url = `${BASE_URL}/workspaces/${config.workspaceId}/time-entries`;

  try {
    const body: Record<string, unknown> = {
      start: entry.startTime,
      end: entry.endTime,
      description: `${entry.ticket} ${entry.description}`.trim(),
    };

    if (projectId) {
      body.projectId = projectId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        entryId: entry.id,
        ticket: entry.ticket,
        success: false,
        target: "clockify",
        error: `HTTP ${response.status}: ${text}`,
      };
    }

    return {
      entryId: entry.id,
      ticket: entry.ticket,
      success: true,
      target: "clockify",
    };
  } catch (err) {
    return {
      entryId: entry.id,
      ticket: entry.ticket,
      success: false,
      target: "clockify",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getClockifyEntries(
  config: ClockifyConfig,
  startDate: string,
  endDate: string,
): Promise<RemoteWorklog[]> {
  const userUrl = `${BASE_URL}/user`;
  const userRes = await fetch(userUrl, {
    headers: { "X-Api-Key": config.apiKey },
  });
  if (!userRes.ok) return [];

  const user = (await userRes.json()) as { id: string };
  const url = `${BASE_URL}/workspaces/${config.workspaceId}/user/${user.id}/time-entries?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`;

  const response = await fetch(url, {
    headers: { "X-Api-Key": config.apiKey },
  });

  if (!response.ok) return [];

  const entries = (await response.json()) as Array<{
    description: string;
    timeInterval: { start: string; end: string; duration: string };
  }>;

  return entries.map((e) => {
    const start = new Date(e.timeInterval.start);
    const end = new Date(e.timeInterval.end);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    const ticket = e.description.split(" ")[0] || "";

    return {
      source: "clockify" as const,
      ticket,
      date: start.toISOString().split("T")[0],
      duration,
      description: e.description,
    };
  });
}

export async function getClockifyProjects(
  config: ClockifyConfig,
): Promise<Array<{ id: string; name: string }>> {
  const url = `${BASE_URL}/workspaces/${config.workspaceId}/projects`;
  const response = await fetch(url, {
    headers: { "X-Api-Key": config.apiKey },
  });

  if (!response.ok) return [];

  return (await response.json()) as Array<{ id: string; name: string }>;
}
