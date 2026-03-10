import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CLI_TIMER_DIR = join(homedir(), ".cli-timer");

export function getDataDir(): string {
  if (!existsSync(CLI_TIMER_DIR)) {
    mkdirSync(CLI_TIMER_DIR, { recursive: true });
  }
  return CLI_TIMER_DIR;
}

export function getHistoryPath(): string {
  return join(getDataDir(), "history.json");
}

export function getSettingsPath(): string {
  return join(getDataDir(), "settings.json");
}
