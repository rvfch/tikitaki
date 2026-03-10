import { v4 as uuidv4 } from 'uuid'
import { parse, differenceInSeconds } from 'date-fns'
import { addEntry } from '../storage/history.js'
import type { TimeEntry } from '../types/index.js'

export interface LogInput {
  ticket: string
  description: string
  date: string
  startTime: string
  endTime: string
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
  if (!input.date || !input.startTime || !input.endTime) {
    return {
      success: false,
      message: 'Date, start time, and end time are required.',
    }
  }

  const startDateTime = parse(
    `${input.date} ${input.startTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  )
  const endDateTime = parse(
    `${input.date} ${input.endTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  )

  const duration = differenceInSeconds(endDateTime, startDateTime)
  if (duration <= 0) {
    return { success: false, message: 'End time must be after start time.' }
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

  return {
    success: true,
    message: `Logged ${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m for ${input.ticket}.`,
    entry,
  }
}
