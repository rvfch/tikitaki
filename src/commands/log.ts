import { v4 as uuidv4 } from 'uuid'
import {
  parse,
  differenceInSeconds,
  subSeconds,
  addSeconds,
  format,
} from 'date-fns'
import { addEntry } from '../storage/history.js'
import { parseDurationInput } from '../utils/formatDuration.js'
import type { TimeEntry } from '../types/index.js'

export interface LogInput {
  ticket: string
  description?: string
  duration?: string
  startTime?: string
  endTime?: string
  project?: string
}

export interface LogResult {
  success: boolean
  message: string
  entry?: TimeEntry
}

export function createLogEntry(input: LogInput): LogResult {
  if (!input.ticket) {
    return { success: false, message: 'Ticket is required.' }
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  let startDateTime: Date
  let endDateTime: Date
  let duration: number

  if (input.startTime && input.endTime) {
    // Both from and to provided — duration is calculated
    const startDate = input.startTime.includes('-')
      ? input.startTime
      : `${today} ${input.startTime}`
    const endDate = input.endTime.includes('-')
      ? input.endTime
      : `${today} ${input.endTime}`
    startDateTime = parse(startDate, 'yyyy-MM-dd HH:mm', new Date())
    endDateTime = parse(endDate, 'yyyy-MM-dd HH:mm', new Date())
    duration = differenceInSeconds(endDateTime, startDateTime)
    if (duration <= 0) {
      return { success: false, message: 'End time must be after start time.' }
    }
  } else if (input.duration && input.startTime) {
    // Duration + from — calculate end
    duration = parseDurationInput(input.duration) ?? 0
    if (duration <= 0) {
      return {
        success: false,
        message: 'Invalid duration. Use format like "1h 30m" or "2:30".',
      }
    }
    const startDate = input.startTime.includes('-')
      ? input.startTime
      : `${today} ${input.startTime}`
    startDateTime = parse(startDate, 'yyyy-MM-dd HH:mm', new Date())
    endDateTime = addSeconds(startDateTime, duration)
  } else if (input.duration) {
    // Duration only — end at now, start = now - duration
    duration = parseDurationInput(input.duration) ?? 0
    if (duration <= 0) {
      return {
        success: false,
        message: 'Invalid duration. Use format like "1h 30m" or "2:30".',
      }
    }
    endDateTime = new Date()
    startDateTime = subSeconds(endDateTime, duration)
  } else {
    return {
      success: false,
      message: 'Duration is required.',
    }
  }

  const project =
    input.project ||
    (input.ticket.includes('-') ? input.ticket.split('-')[0] : '')

  const entry: TimeEntry = {
    id: uuidv4(),
    ticket: input.ticket,
    description: input.description || '',
    project,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    duration,
    pauses: [],
    synced: { jira: false, clockify: false },
  }

  addEntry(entry)

  const h = Math.floor(duration / 3600)
  const m = Math.floor((duration % 3600) / 60)
  return {
    success: true,
    message: `Logged ${h}h ${m}m for ${input.ticket}.`,
    entry,
  }
}

// Parse inline: /log <ticket> <duration> <from?> <description?> <to?>
export function parseLogArgs(args: string): LogInput | null {
  if (!args.trim()) return null

  const parts = args.trim().split(/\s+/)
  if (parts.length < 2) return null

  const ticket = parts[0]
  const duration = parts[1]

  // Validate duration
  if (!parseDurationInput(duration)) return null

  const from = parts[2] || undefined
  // Check if from looks like a time (HH:mm or HH:mm with date)
  const fromIsTime = from && /^\d{1,2}:\d{2}$/.test(from)

  if (fromIsTime) {
    // parts[3..n-1] could be description, parts[n] could be "to" time
    const remaining = parts.slice(3)
    const last = remaining[remaining.length - 1]
    const lastIsTime = last && /^\d{1,2}:\d{2}$/.test(last)

    if (lastIsTime && remaining.length > 1) {
      return {
        ticket,
        duration,
        startTime: from,
        endTime: last,
        description: remaining.slice(0, -1).join(' '),
      }
    } else if (lastIsTime && remaining.length === 1) {
      return {
        ticket,
        duration,
        startTime: from,
        endTime: last,
      }
    } else {
      return {
        ticket,
        duration,
        startTime: from,
        description: remaining.join(' ') || undefined,
      }
    }
  }

  // from is not a time — treat rest as description
  return {
    ticket,
    duration,
    description: parts.slice(2).join(' ') || undefined,
  }
}
