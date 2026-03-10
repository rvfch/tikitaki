import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getSettingsPath } from "./paths.js";
import type { Settings } from "../types/index.js";

const DEFAULT_SETTINGS: Settings = {
  autoSync: false,
  minimumDailyHours: 8,
  integrations: {
    jira: null,
    clockify: null,
  },
};

export function loadSettings(): Settings {
  const path = getSettingsPath();
  if (!existsSync(path)) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}
