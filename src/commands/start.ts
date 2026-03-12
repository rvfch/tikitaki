import type { ActiveTimer } from '../types/index.js'

export interface StartResult {
  success: boolean
  message: string
  timer?: ActiveTimer
}

function parseStartTime(timeStr: string): Date | string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) {
    return 'Invalid time format. Use HH:MM (e.g. /start TICK-1 10:00)'
  }

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (hours > 23 || minutes > 59) {
    return 'Invalid time. Hours must be 0-23 and minutes 0-59.'
  }

  const now = new Date()
  const startTime = new Date(now)
  startTime.setHours(hours, minutes, 0, 0)

  if (startTime > now) {
    return 'Start time cannot be in the future.'
  }

  return startTime
}

export function startTimer(
  args: string,
  currentTimer: ActiveTimer | null
): StartResult {
  if (currentTimer) {
    return {
      success: false,
      message: `Timer already running for ${currentTimer.ticket}. Use /stop first.`,
    }
  }

  const parts = args.trim().split(/\s+/)
  if (parts.length < 1 || !parts[0]) {
    return {
      success: false,
      message: 'Usage: /start <ticket> [description] [HH:MM]',
    }
  }

  const ticket = parts[0]
  const remainingParts = parts.slice(1)

  // Check if the last argument is a time (HH:MM)
  let startTime = new Date()
  let customTime: string | null = null
  const lastPart = remainingParts[remainingParts.length - 1]
  if (lastPart && /^\d{1,2}:\d{2}$/.test(lastPart)) {
    const parsed = parseStartTime(lastPart)
    if (typeof parsed === 'string') {
      return { success: false, message: parsed }
    }
    startTime = parsed
    customTime = lastPart
    remainingParts.pop()
  }

  const description = remainingParts.join(' ') || ''
  const project = ticket.includes('-') ? ticket.split('-')[0] : ''

  const timer: ActiveTimer = {
    ticket,
    description,
    project,
    startTime: startTime.toISOString(),
    pauses: [],
    currentPauseStart: null,
  }

  const timeNote = customTime ? ` (from ${customTime})` : ''

  return {
    success: true,
    message: `Timer started for ${ticket}${description ? `: ${description}` : ''}${timeNote}`,
    timer,
  }
}
