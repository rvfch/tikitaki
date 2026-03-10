import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { syncToJira, getJiraWorklogs } from "../integrations/jira.js";
import type { TimeEntry, JiraConfig } from "../types/index.js";

const config: JiraConfig = {
  baseUrl: "https://test.atlassian.net",
  email: "user@test.com",
  apiToken: "test-token",
};

const entry: TimeEntry = {
  id: "1",
  ticket: "TEST-1",
  description: "test task",
  project: "TEST",
  startTime: "2026-03-11T09:00:00.000Z",
  endTime: "2026-03-11T10:00:00.000Z",
  duration: 3600,
  pauses: [],
  synced: { jira: false, clockify: false },
};

describe("syncToJira", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct payload and returns success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "123" }), { status: 201 }),
    );

    const result = await syncToJira(entry, config);
    expect(result.success).toBe(true);
    expect(result.target).toBe("jira");

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe(
      "https://test.atlassian.net/rest/api/3/issue/TEST-1/worklog",
    );

    const opts = call[1] as RequestInit;
    expect(opts.method).toBe("POST");
    expect(opts.headers).toHaveProperty("Authorization");

    const body = JSON.parse(opts.body as string);
    expect(body.timeSpentSeconds).toBe(3600);
    expect(body.comment.type).toBe("doc");
  });

  it("returns failure on HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Not found", { status: 404 }),
    );

    const result = await syncToJira(entry, config);
    expect(result.success).toBe(false);
    expect(result.error).toContain("404");
  });

  it("returns failure on network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await syncToJira(entry, config);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });
});

describe("getJiraWorklogs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses worklogs correctly", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          worklogs: [
            {
              started: "2026-03-11T09:00:00.000+0000",
              timeSpentSeconds: 3600,
              comment: {
                content: [{ content: [{ text: "test" }] }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await getJiraWorklogs("TEST-1", config);
    expect(result).toHaveLength(1);
    expect(result[0].duration).toBe(3600);
    expect(result[0].source).toBe("jira");
  });

  it("returns empty on error", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 401 }));

    const result = await getJiraWorklogs("TEST-1", config);
    expect(result).toEqual([]);
  });
});
