import type { ActiveTimer } from "../types/index.js";

export interface StartResult {
  success: boolean;
  message: string;
  timer?: ActiveTimer;
}

export function startTimer(
  args: string,
  currentTimer: ActiveTimer | null,
): StartResult {
  if (currentTimer) {
    return {
      success: false,
      message: `Timer already running for ${currentTimer.ticket}. Use /stop first.`,
    };
  }

  const parts = args.trim().split(/\s+/);
  if (parts.length < 1 || !parts[0]) {
    return {
      success: false,
      message: "Usage: /start <ticket> [description]",
    };
  }

  const ticket = parts[0];
  const description = parts.slice(1).join(" ") || "";
  const project = ticket.includes("-") ? ticket.split("-")[0] : "";

  const timer: ActiveTimer = {
    ticket,
    description,
    project,
    startTime: new Date().toISOString(),
    pauses: [],
    currentPauseStart: null,
  };

  return {
    success: true,
    message: `Timer started for ${ticket}${description ? `: ${description}` : ""}`,
    timer,
  };
}
