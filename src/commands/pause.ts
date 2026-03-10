import type { ActiveTimer } from "../types/index.js";

export interface PauseResult {
  success: boolean;
  message: string;
  timer?: ActiveTimer;
}

export function pauseTimer(currentTimer: ActiveTimer | null): PauseResult {
  if (!currentTimer) {
    return { success: false, message: "No timer is running." };
  }

  if (currentTimer.currentPauseStart) {
    return { success: false, message: "Timer is already paused." };
  }

  const updated: ActiveTimer = {
    ...currentTimer,
    currentPauseStart: new Date().toISOString(),
  };

  return {
    success: true,
    message: `Timer paused for ${currentTimer.ticket}.`,
    timer: updated,
  };
}
