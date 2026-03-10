import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let tempDir: string;

vi.mock("../storage/paths.js", () => ({
  getDataDir: () => tempDir,
  getHistoryPath: () => join(tempDir, "history.json"),
  getSettingsPath: () => join(tempDir, "settings.json"),
}));

const { createLogEntry } = await import("../commands/log.js");

describe("createLogEntry", () => {
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "cli-timer-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true });
  });

  it("creates a valid log entry", () => {
    const result = createLogEntry({
      ticket: "TEST-1",
      description: "manual entry",
      date: "2026-03-11",
      startTime: "09:00",
      endTime: "10:30",
    });
    expect(result.success).toBe(true);
    expect(result.entry?.duration).toBe(5400); // 1.5 hours
    expect(result.entry?.ticket).toBe("TEST-1");
  });

  it("fails with missing ticket", () => {
    const result = createLogEntry({
      ticket: "",
      description: "",
      date: "2026-03-11",
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("fails when end is before start", () => {
    const result = createLogEntry({
      ticket: "TEST-1",
      description: "",
      date: "2026-03-11",
      startTime: "10:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("End time must be after start time");
  });

  it("derives project from ticket", () => {
    const result = createLogEntry({
      ticket: "PROJ-123",
      description: "",
      date: "2026-03-11",
      startTime: "09:00",
      endTime: "10:00",
    });
    expect(result.entry?.project).toBe("PROJ");
  });

  it("uses explicit project when provided", () => {
    const result = createLogEntry({
      ticket: "PROJ-123",
      description: "",
      date: "2026-03-11",
      startTime: "09:00",
      endTime: "10:00",
      project: "CUSTOM",
    });
    expect(result.entry?.project).toBe("CUSTOM");
  });
});
