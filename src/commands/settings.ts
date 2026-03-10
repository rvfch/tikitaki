import { loadSettings, saveSettings } from "../storage/settings.js";
import type { Settings, JiraConfig, ClockifyConfig } from "../types/index.js";

export function getSettings(): Settings {
  return loadSettings();
}

export function saveJiraConfig(config: JiraConfig): void {
  const settings = loadSettings();
  settings.integrations.jira = config;
  saveSettings(settings);
}

export function saveClockifyConfig(config: ClockifyConfig): void {
  const settings = loadSettings();
  settings.integrations.clockify = config;
  saveSettings(settings);
}

export function removeIntegration(target: "jira" | "clockify"): void {
  const settings = loadSettings();
  settings.integrations[target] = null;
  saveSettings(settings);
}

export function updateAutoSync(enabled: boolean): void {
  const settings = loadSettings();
  settings.autoSync = enabled;
  saveSettings(settings);
}
