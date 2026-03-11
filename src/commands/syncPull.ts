import { v4 as uuidv4 } from 'uuid'
import { loadSettings } from '../storage/settings.js'
import { loadHistory, addEntry } from '../storage/history.js'
import { getJiraWorklogs } from '../integrations/jira.js'
import { getClockifyEntries } from '../integrations/clockify.js'
import { filterByPeriod, getDateRange } from '../utils/dateFilters.js'
import { toLocalDateStr, entryLocalDate } from '../utils/formatDate.js'
import type { Period } from '../utils/dateFilters.js'
import type { RemoteWorklog } from '../integrations/types.js'
import type { TimeEntry } from '../types/index.js'

export interface PullResult {
  imported: number
  skipped: number
  source: string
  errors: string[]
}

function isSimilarDuration(a: number, b: number): boolean {
  return Math.abs(a - b) < 300
}

function alreadyExists(
  remote: RemoteWorklog,
  localEntries: TimeEntry[]
): boolean {
  return localEntries.some(
    (local) =>
      local.ticket === remote.ticket &&
      entryLocalDate(local.startTime) === remote.date &&
      isSimilarDuration(local.duration, remote.duration)
  )
}

function worklogToEntry(
  remote: RemoteWorklog,
  source: 'jira' | 'clockify'
): TimeEntry {
  const startDate = new Date(`${remote.date}T09:00:00`)
  const endDate = new Date(startDate.getTime() + remote.duration * 1000)

  return {
    id: uuidv4(),
    ticket: remote.ticket,
    description: remote.description || '',
    project: remote.ticket.includes('-') ? remote.ticket.split('-')[0] : '',
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    duration: remote.duration,
    pauses: [],
    synced: {
      jira: source === 'jira',
      clockify: source === 'clockify',
    },
  }
}

export async function syncPull(period?: Period): Promise<PullResult[]> {
  const settings = loadSettings()
  let localEntries = loadHistory()
  if (period) localEntries = filterByPeriod(localEntries, period)
  const results: PullResult[] = []

  if (settings.integrations.jira) {
    const result: PullResult = {
      imported: 0,
      skipped: 0,
      source: 'jira',
      errors: [],
    }
    try {
      const tickets = [...new Set(localEntries.map((e) => e.ticket))]
      for (const ticket of tickets) {
        let worklogs = await getJiraWorklogs(ticket, settings.integrations.jira)
        if (period) {
          const range = getDateRange(period)
          const minDate = toLocalDateStr(range.start)
          const maxDate = toLocalDateStr(range.end)
          worklogs = worklogs.filter(
            (w) => w.date >= minDate && w.date <= maxDate
          )
        }
        for (const wl of worklogs) {
          if (alreadyExists(wl, localEntries)) {
            result.skipped++
          } else {
            addEntry(worklogToEntry(wl, 'jira'))
            result.imported++
          }
        }
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err))
    }
    results.push(result)
  }

  if (settings.integrations.clockify) {
    const result: PullResult = {
      imported: 0,
      skipped: 0,
      source: 'clockify',
      errors: [],
    }
    try {
      let minDate: string
      let maxDate: string
      if (period) {
        const range = getDateRange(period)
        minDate = range.start.toISOString().split('T')[0]
        maxDate = range.end.toISOString().split('T')[0]
      } else {
        const dates = localEntries.map((e) => entryLocalDate(e.startTime))
        const today = toLocalDateStr(new Date())
        minDate = dates.sort()[0] || today
        maxDate = dates.sort().reverse()[0] || today
      }
      const entries = await getClockifyEntries(
        settings.integrations.clockify,
        minDate,
        maxDate
      )
      const currentLocal = loadHistory()
      for (const wl of entries) {
        if (alreadyExists(wl, currentLocal)) {
          result.skipped++
        } else {
          addEntry(worklogToEntry(wl, 'clockify'))
          result.imported++
        }
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err))
    }
    results.push(result)
  }

  if (!settings.integrations.jira && !settings.integrations.clockify) {
    return [
      {
        imported: 0,
        skipped: 0,
        source: 'none',
        errors: [
          'No integrations configured. Use /settings:integrations first.',
        ],
      },
    ]
  }

  return results
}
