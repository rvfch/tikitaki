import type { ActiveTimer, PauseInterval } from '../types/index.js'

export interface ResumeResult {
  success: boolean
  message: string
  timer?: ActiveTimer
}

export function resumeTimer(currentTimer: ActiveTimer | null): ResumeResult {
  if (!currentTimer) {
    return { success: false, message: 'No timer is running.' }
  }

  if (!currentTimer.currentPauseStart) {
    return { success: false, message: 'Timer is not paused.' }
  }

  const completedPause: PauseInterval = {
    pausedAt: currentTimer.currentPauseStart,
    resumedAt: new Date().toISOString(),
  }

  const updated: ActiveTimer = {
    ...currentTimer,
    pauses: [...currentTimer.pauses, completedPause],
    currentPauseStart: null,
  }

  return {
    success: true,
    message: `Timer resumed for ${currentTimer.ticket}.`,
    timer: updated,
  }
}
