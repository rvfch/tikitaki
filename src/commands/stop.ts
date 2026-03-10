import { v4 as uuidv4 } from 'uuid'
import { addEntry } from '../storage/history.js'
import type { ActiveTimer, TimeEntry, PauseInterval } from '../types/index.js'

export interface StopResult {
  success: boolean
  message: string
  entry?: TimeEntry
}

export function calculateElapsed(timer: ActiveTimer, now?: Date): number {
  const current = now || new Date()
  const start = new Date(timer.startTime).getTime()
  const totalElapsed = (current.getTime() - start) / 1000

  let pausedSeconds = 0
  for (const pause of timer.pauses) {
    const pauseStart = new Date(pause.pausedAt).getTime()
    const pauseEnd = pause.resumedAt
      ? new Date(pause.resumedAt).getTime()
      : current.getTime()
    pausedSeconds += (pauseEnd - pauseStart) / 1000
  }

  if (timer.currentPauseStart) {
    const pauseStart = new Date(timer.currentPauseStart).getTime()
    pausedSeconds += (current.getTime() - pauseStart) / 1000
  }

  return Math.max(0, Math.floor(totalElapsed - pausedSeconds))
}

export function stopTimer(
  currentTimer: ActiveTimer | null,
  discard: boolean = false
): StopResult {
  if (!currentTimer) {
    return { success: false, message: 'No timer is running.' }
  }

  if (discard) {
    return { success: true, message: 'Timer discarded.' }
  }

  const now = new Date()
  const finalPauses: PauseInterval[] = [...currentTimer.pauses]

  if (currentTimer.currentPauseStart) {
    finalPauses.push({
      pausedAt: currentTimer.currentPauseStart,
      resumedAt: now.toISOString(),
    })
  }

  const duration = calculateElapsed(currentTimer, now)

  const entry: TimeEntry = {
    id: uuidv4(),
    ticket: currentTimer.ticket,
    description: currentTimer.description,
    project: currentTimer.project,
    startTime: currentTimer.startTime,
    endTime: now.toISOString(),
    duration,
    pauses: finalPauses,
    synced: { jira: false, clockify: false },
  }

  addEntry(entry)

  return {
    success: true,
    message: `Timer stopped for ${currentTimer.ticket}. Duration: ${formatDurationInline(duration)}`,
    entry,
  }
}

function formatDurationInline(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}
