import { v4 as uuidv4 } from 'uuid'
import {
  parse,
  differenceInSeconds,
  subSeconds,
  addSeconds,
  format,
  endOfDay,
  isValid,
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
  date?: string
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

  let baseDate: string
  if (input.date) {
    const parsed = parse(input.date, 'yyyy-MM-dd', new Date())
    if (!isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== input.date) {
      return { success: false, message: 'Invalid date. Use yyyy-MM-dd.' }
    }
    baseDate = input.date
  } else {
    baseDate = format(new Date(), 'yyyy-MM-dd')
  }

  let startDateTime: Date
  let endDateTime: Date
  let duration: number

  if (input.startTime && input.endTime) {
    // Both from and to provided — duration is calculated
    const startDate = input.startTime.includes('-')
      ? input.startTime
      : `${baseDate} ${input.startTime}`
    const endDate = input.endTime.includes('-')
      ? input.endTime
      : `${baseDate} ${input.endTime}`
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
      : `${baseDate} ${input.startTime}`
    startDateTime = parse(startDate, 'yyyy-MM-dd HH:mm', new Date())
    endDateTime = addSeconds(startDateTime, duration)
  } else if (input.duration) {
    // Duration only — end at now (or end of date day), start = end - duration
    duration = parseDurationInput(input.duration) ?? 0
    if (duration <= 0) {
      return {
        success: false,
        message: 'Invalid duration. Use format like "1h 30m" or "2:30".',
      }
    }
    if (input.date) {
      endDateTime = endOfDay(parse(input.date, 'yyyy-MM-dd', new Date()))
      startDateTime = subSeconds(endDateTime, duration)
    } else {
      endDateTime = new Date()
      startDateTime = subSeconds(endDateTime, duration)
    }
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

// Parse inline: /log [date] <ticket> <duration> <from?> <description?> <to?>
export function parseLogArgs(args: string): LogInput | null {
  if (!args.trim()) return null

  const parts = args.trim().split(/\s+/)
  if (parts.length < 2) return null

  let date: string | undefined
  const rest = /^\d{4}-\d{2}-\d{2}$/.test(parts[0])
    ? ((date = parts[0]), parts.slice(1))
    : parts
  if (rest.length < 2) return null

  const ticket = rest[0]
  const duration = rest[1]

  // Validate duration
  if (!parseDurationInput(duration)) return null

  const from = rest[2] || undefined
  const fromIsTime = from && /^\d{1,2}:\d{2}$/.test(from)

  const withDate = (obj: Omit<LogInput, 'date'>) => (date ? { ...obj, date } : obj)

  if (fromIsTime) {
    const remaining = rest.slice(3)
    const last = remaining[remaining.length - 1]
    const lastIsTime = last && /^\d{1,2}:\d{2}$/.test(last)

    if (lastIsTime && remaining.length > 1) {
      return withDate({
        ticket,
        duration,
        startTime: from,
        endTime: last,
        description: remaining.slice(0, -1).join(' '),
      })
    } else if (lastIsTime && remaining.length === 1) {
      return withDate({
        ticket,
        duration,
        startTime: from,
        endTime: last,
      })
    } else {
      return withDate({
        ticket,
        duration,
        startTime: from,
        description: remaining.join(' ') || undefined,
      })
    }
  }

  return withDate({
    ticket,
    duration,
    description: rest.slice(2).join(' ') || undefined,
  })
}
